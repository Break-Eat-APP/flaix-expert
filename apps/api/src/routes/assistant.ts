import type { FastifyInstance } from "fastify";
import { z } from "zod";
import {
  LIMITE_QUESTIONS_JOUR,
  chiffresVerifies,
  cibleEffective,
  dansPeriode,
  estJour,
  formaterMontant,
  formaterPourcentage,
  idPeriode,
  jourParis,
  libellePeriode,
  margeConfiguree,
  tauxMargePb,
  type EtatAssistant,
  type ReponseAssistant,
  type SourceAssistant,
  type StatsMatch,
} from "@flaix/domain";
import type { Base, Client } from "../base.ts";
import { exigerDirecteur } from "../auth/contexte.ts";
import { ErreurMetier } from "../erreurs.ts";
import { fournisseurIA, modeleIA, type MessageIA, type OutilIA } from "../ia/fournisseur.ts";
import { listerEvenements } from "./evenements.ts";
import { financesPeriode, financesSoiree } from "./finances.ts";
import { listerCategories, listerProduits } from "./produits.ts";
import { lireRapport } from "./rapport-soiree.ts";
import { resumeMatchs, statsEvenements, statsMatch } from "./resultats.ts";
import { contexte, corps } from "./outils.ts";

/*
 * Assistant « pose ta question » (décision de Rémi du 2026-10-04, dossier §15.136). Mistral ne lit les
 * données du lieu qu'au travers d'outils en lecture seule ; il ne peut rien modifier. Chaque réponse
 * nomme ses sources ; ses chiffres sont contrôlés contre les données lues ; chaque échange est gardé.
 * Règlement européen sur l'IA, article 50 : l'écran dit que la réponse est rédigée par une IA.
 */

const Question = z.object({
  question: z.string().trim().min(3, "Pose ta question en quelques mots.").max(500),
  historique: z.array(z.object({ question: z.string().max(500), reponse: z.string().max(2000) })).max(3).default([]),
});
const MAX_TOURS = 5;

const m = (c: number | null) => (c === null ? null : formaterMontant(c));
const pb = (v: number | null) => (v === null ? null : formaterPourcentage(v));

/** Résultats écrits comme l'écran : montants en euros, pourcentages, rien de brut en centimes. */
function resumeStats(s: StatsMatch) {
  return {
    encaisseTtc: m(s.caTtc),
    caHt: m(s.caHt),
    tvaCollectee: m(s.tva),
    tickets: s.tickets,
    panierMoyen: m(s.panierMoyen),
    spectateurs: s.spectateurs ?? "affluence non saisie",
    encaissePar_spectateur: s.caParSpectateur === null ? "non calculable (affluence manquante)" : m(s.caParSpectateur),
    annulations: { nombre: s.annulations.nombre, montant: m(s.annulations.montant) },
    paiement: { especes: m(s.parMode.especes), carte: m(s.parMode.carte) },
    parStand: s.parStand.map((x) => ({ stand: x.nom, encaisse: m(x.ca) })),
    parCategorie: s.parCategorie.map((x) => ({ categorie: x.nom, encaisse: m(x.ca) })),
    coutMatiere: s.coutMatiere === null ? `coût manquant sur : ${s.produitsSansCout.join(", ")}` : m(s.coutMatiere),
    margeBrute: s.margeBrute === null ? "non calculable (coût manquant)" : m(s.margeBrute),
    personnel: s.personnel.reel === null ? "non calculable (taux horaire manquant)" : m(s.personnel.reel),
    produits: [...s.produits]
      .sort((a, b) => b.caTtc - a.caTtc)
      .slice(0, 15)
      .map((p) => ({
        produit: p.nom,
        quantite: p.quantite,
        encaisse: m(p.caTtc),
        marge: p.marge === null ? "coût manquant" : m(p.marge),
        tauxMarge: pb(tauxMargePb(p.marge, p.caHt)),
        cible: p.cibleMarge == null ? "aucune" : pb(p.cibleMarge),
      })),
  };
}

const OUTILS: OutilIA[] = [
  {
    type: "function",
    function: {
      name: "lister_evenements",
      description: "Liste les événements du lieu (match, concert, soirée…) avec leur date, leur état et ce qu'ils ont encaissé. À utiliser pour trouver l'identifiant d'un événement.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "resultats",
      description: "Ventes d'un événement (evenement_id) ou d'une période (du, au au format AAAA-MM-JJ, jours inclus) : encaissé, tickets, panier moyen, stands, catégories, produits, marge brute.",
      parameters: { type: "object", properties: { evenement_id: { type: "string" }, du: { type: "string" }, au: { type: "string" } }, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "finances",
      description: "Résultat financier d'un événement (evenement_id) ou d'une période (du, au) : du montant encaissé à la marge nette, dépenses de la soirée, cible de marge nette.",
      parameters: { type: "object", properties: { evenement_id: { type: "string" }, du: { type: "string" }, au: { type: "string" } }, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "rapport_soiree",
      description: "Rapport figé d'un événement clos : comparaison avec l'événement précédent, contrôle des espèces, écarts de stock, points à surveiller.",
      parameters: { type: "object", properties: { evenement_id: { type: "string" } }, required: ["evenement_id"] },
    },
  },
  {
    type: "function",
    function: {
      name: "marges_produits",
      description: "Pour chaque produit du catalogue : prix, coût, marge par vente au prix actuel, taux de marge et cible de marge (tenue ou non).",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
];

const Params = z.object({ evenement_id: z.string().uuid().optional(), du: z.string().refine(estJour).optional(), au: z.string().refine(estJour).optional() });

/** Exécute un outil en lecture seule ; renvoie ce que l'IA lira et la source à montrer au directeur. */
async function executerOutil(c: Client, lieuId: string, nom: string, argumentsJson: string): Promise<{ donnees: unknown; source: SourceAssistant }> {
  let brut: unknown = {};
  try {
    brut = JSON.parse(argumentsJson || "{}");
  } catch {
    return { donnees: { erreur: "paramètres illisibles" }, source: { outil: nom, libelle: "paramètres illisibles" } };
  }
  const p = Params.safeParse(brut);
  const params = p.success ? p.data : {};
  const evenements = await listerEvenements(c, lieuId);
  const evenement = params.evenement_id ? evenements.find((e) => e.id === params.evenement_id) : undefined;
  const periode = params.du && params.au && params.du <= params.au ? { du: params.du, au: params.au } : null;
  const introuvable = (quoi: string) => ({ donnees: { erreur: `${quoi} : précise un événement existant (evenement_id) ou une période (du, au)` }, source: { outil: nom, libelle: quoi } });

  switch (nom) {
    case "lister_evenements": {
      const ventes = new Map((await resumeMatchs(c, lieuId)).map((x) => [x.id, x]));
      const liste = evenements.slice(0, 60).map((e) => ({
        evenement_id: e.id,
        libelle: e.libelle,
        date: jourParis(e.debut),
        etat: e.etat === "a_venir" ? "à venir" : e.etat,
        encaisse: m(ventes.get(e.id)?.caTtc ?? 0),
        tickets: ventes.get(e.id)?.tickets ?? 0,
      }));
      return { donnees: { aujourdhui: jourParis(new Date()), evenements: liste }, source: { outil: nom, libelle: "Liste des événements" } };
    }
    case "resultats": {
      if (evenement) return { donnees: { portee: `${evenement.libelle} (${jourParis(evenement.debut)})`, ...resumeStats(await statsMatch(c, lieuId, evenement)) }, source: { outil: nom, libelle: `Résultats de « ${evenement.libelle} »` } };
      if (periode) {
        const dedans = evenements.filter((e) => dansPeriode(e.debut, periode));
        const s = await statsEvenements(c, lieuId, dedans, idPeriode(periode));
        return {
          donnees: { portee: libellePeriode(periode), evenements: dedans.map((e) => `${e.libelle} (${jourParis(e.debut)})`), ...resumeStats(s) },
          source: { outil: nom, libelle: `Résultats ${libellePeriode(periode)}` },
        };
      }
      return introuvable("Résultats");
    }
    case "finances": {
      const f = evenement ? await financesSoiree(c, lieuId, evenement) : periode ? await financesPeriode(c, lieuId, periode) : null;
      if (!f) return introuvable("Finances");
      const portee = evenement ? `${evenement.libelle} (${jourParis(evenement.debut)})` : libellePeriode(periode!);
      return {
        donnees: {
          portee,
          encaisseTtc: m(f.encaisseTtc),
          caHt: m(f.caHt),
          coutMatiere: f.coutMatiere === null ? "coût manquant" : m(f.coutMatiere),
          margeBrute: f.margeBrute === null ? "non calculable" : m(f.margeBrute),
          personnel: f.personnel.reel === null ? "taux horaire manquant" : m(f.personnel.reel),
          depenses: f.depenses.filter((d) => d.montant > 0).map((d) => ({ poste: d.nom, montant: m(d.montant) })),
          totalDepenses: m(f.totalDepenses),
          margeNette: f.margeNette === null ? "non calculable" : m(f.margeNette),
          tauxMargeNette: pb(tauxMargePb(f.margeNette, f.caHt)),
          cible: f.etatCible ? { cible: pb(f.etatCible.ciblePb), cibleEnEuros: m(f.etatCible.cible), ecart: m(f.etatCible.ecart), tenue: f.etatCible.tenue } : "aucune cible",
          soirees: f.periode?.soirees.map((s) => ({ soiree: `${s.libelle} (${jourParis(s.debut)})`, encaisse: m(s.encaisseTtc), margeNette: s.margeNette === null ? "non calculable" : m(s.margeNette) })),
          rappel: "La marge nette de la soirée n'est pas le bénéfice du lieu (loyer, salaires permanents, assurance, amortissements et impôt non déduits).",
        },
        source: { outil: nom, libelle: `Finances ${evenement ? `de « ${evenement.libelle} »` : libellePeriode(periode!)}` },
      };
    }
    case "rapport_soiree": {
      if (!evenement) return introuvable("Rapport de soirée");
      const r = await lireRapport(c, lieuId, evenement.id);
      if (!r) return { donnees: { erreur: "pas de rapport : l'événement n'est pas clos, ou le rapport n'a jamais été ouvert" }, source: { outil: nom, libelle: `Rapport de « ${evenement.libelle} »` } };
      const x = r.rapport;
      return {
        donnees: {
          portee: `${evenement.libelle} (${jourParis(evenement.debut)})`,
          comparaison: x.comparaison.evenement
            ? { avec: x.comparaison.evenement.libelle, encaisse: { ecart: m(x.comparaison.encaisseTtc.ecart), ecartPourcent: x.comparaison.encaisseTtc.ecartPct === null ? null : `${x.comparaison.encaisseTtc.ecartPct.toLocaleString("fr-FR")} %` }, tickets: x.comparaison.tickets.ecart }
            : "premier événement avec des ventes",
          especes: { ecartTotal: m(x.especes.ecartTotal), tiroirs: x.especes.tiroirs.map((t) => ({ caisse: t.caisse, stand: t.stand, ecart: m(t.ecart), motif: t.motif })) },
          stock: x.stock.suivi ? { valeurDesEcarts: m(x.stock.valeurTotale), ecarts: x.stock.produits.map((s) => ({ produit: s.nom, ecart: s.ecart, valeur: m(s.valeur) })) } : "stock non suivi",
          aSurveiller: x.alertes.map((a) => `${a.titre} — ${a.detail}`),
        },
        source: { outil: nom, libelle: `Rapport de soirée de « ${evenement.libelle} »` },
      };
    }
    case "marges_produits": {
      const categories = new Map((await listerCategories(c, lieuId)).map((k) => [k.id, k]));
      const produits = (await listerProduits(c, lieuId)).filter((p) => p.actif && p.tarifEnVigueur);
      return {
        donnees: {
          produits: produits.map((p) => {
            const cible = cibleEffective(p.cibleMarge, p.categorieId ? (categories.get(p.categorieId)?.cibleMarge ?? null) : null);
            const mc = margeConfiguree(p.tarifEnVigueur!.prixTtc, p.tarifEnVigueur!.tauxTva, p.coutMatiere, cible);
            return {
              produit: p.nom,
              prix: m(p.tarifEnVigueur!.prixTtc),
              cout: m(p.coutMatiere) ?? "coût manquant",
              margeParVente: mc ? m(Math.round(mc.marge)) : "coût manquant",
              tauxMarge: mc ? pb(mc.etat.tauxPb) : null,
              cible: cible === null ? "aucune" : pb(cible),
              etat: mc ? { sans_cible: "aucune cible", inconnu: "coût manquant", tenue: "cible tenue", sous: "sous la cible" }[mc.etat.statut] : "coût manquant",
            };
          }),
        },
        source: { outil: nom, libelle: "Marges du catalogue au prix actuel" },
      };
    }
    default:
      return { donnees: { erreur: "outil inconnu" }, source: { outil: nom, libelle: "outil inconnu" } };
  }
}

async function questionsDuJour(c: Client, lieuId: string): Promise<number> {
  const { rows } = await c.query<{ n: number }>(
    "SELECT count(*)::int AS n FROM assistant_echange WHERE lieu_id = $1 AND cree_le >= (date_trunc('day', now() AT TIME ZONE 'Europe/Paris') AT TIME ZONE 'Europe/Paris')",
    [lieuId],
  );
  return rows[0]!.n;
}

function consignes(lieu: string): string {
  return [
    `Tu es l'assistant de FlaiX Expert, le logiciel de caisse et de gestion des buvettes du lieu « ${lieu} ». Tu réponds à son directeur, en français, en le tutoyant, en 3 à 6 phrases courtes.`,
    "Règles absolues :",
    "- Tu n'utilises QUE les données renvoyées par les outils. Si elles ne suffisent pas, dis-le et indique où regarder dans FlaiX Expert (Résultats, Finances, Caisses, Clôtures, Stock).",
    "- Tu recopies les montants et pourcentages exactement comme ils sont écrits dans les données (par exemple « 18 640,00 € »). Tu ne fais aucun calcul de tête.",
    "- Tu nommes toujours l'événement ou la période dont tu parles.",
    "- Une donnée absente (coût manquant, affluence non saisie) se dit telle quelle ; tu ne l'estimes jamais.",
    "- Tu ne donnes aucun conseil juridique, fiscal ou social. Une piste de gestion se présente comme une piste, pas comme une certitude.",
    "- La marge nette de la soirée n'est pas le bénéfice du lieu.",
    `Nous sommes le ${jourParis(new Date())}. Les dates sont au format AAAA-MM-JJ, heure de Paris.`,
  ].join("\n");
}

export async function routesAssistant(app: FastifyInstance, { base }: { base: Base }) {
  app.get("/api/assistant", async (req): Promise<EtatAssistant> => {
    const auth = await exigerDirecteur(req, base);
    return base.transaction(contexte(auth), async (c) => ({
      branche: fournisseurIA() !== null,
      modele: modeleIA(),
      limite: LIMITE_QUESTIONS_JOUR,
      restantes: Math.max(0, LIMITE_QUESTIONS_JOUR - (await questionsDuJour(c, auth.lieuId))),
    }));
  });

  app.post("/api/assistant", async (req): Promise<ReponseAssistant> => {
    const auth = await exigerDirecteur(req, base);
    const q = corps(Question, req);
    const f = fournisseurIA();
    if (!f) throw new ErreurMetier(409, "L'assistant n'est pas encore branché : la clé Mistral n'est pas réglée sur le serveur.");
    const lieu = await base.transaction(contexte(auth), async (c) => {
      if ((await questionsDuJour(c, auth.lieuId)) >= LIMITE_QUESTIONS_JOUR) throw new ErreurMetier(429, `Limite de ${LIMITE_QUESTIONS_JOUR} questions par jour atteinte pour ce lieu : réessaie demain.`);
      const { rows } = await c.query<{ nom: string }>("SELECT nom FROM lieu WHERE id = $1", [auth.lieuId]);
      return rows[0]!.nom;
    });

    const messages: MessageIA[] = [{ role: "system", content: consignes(lieu) }];
    for (const h of q.historique) messages.push({ role: "user", content: h.question }, { role: "assistant", content: h.reponse });
    messages.push({ role: "user", content: q.question });
    const sources: SourceAssistant[] = [];
    const lues: string[] = [q.question];
    let reponse = "";
    let modele = modeleIA() ?? "inconnu";
    const jetons = { entree: 0, sortie: 0 };

    for (let tour = 0; tour < MAX_TOURS && !reponse; tour++) {
      let r;
      try {
        r = await f(messages, tour < MAX_TOURS - 1 ? OUTILS : undefined);
      } catch (erreur) {
        req.log.error({ err: erreur }, "assistant : Mistral injoignable");
        throw new ErreurMetier(503, "Mistral ne répond pas pour l'instant : réessaie dans un moment.");
      }
      modele = r.modele;
      if (r.jetons) {
        jetons.entree += r.jetons.entree;
        jetons.sortie += r.jetons.sortie;
      }
      const appels = r.message.tool_calls ?? [];
      if (appels.length === 0) {
        reponse = r.message.content.trim();
        break;
      }
      messages.push({ role: "assistant", content: r.message.content ?? "", tool_calls: appels });
      for (const appel of appels.slice(0, 4)) {
        const resultat = await base.transaction(contexte(auth), (c) => executerOutil(c, auth.lieuId, appel.function.name, appel.function.arguments));
        const texte = JSON.stringify(resultat.donnees);
        lues.push(texte);
        sources.push(resultat.source);
        messages.push({ role: "tool", name: appel.function.name, content: texte, tool_call_id: appel.id });
      }
    }
    if (!reponse) reponse = "Je n'ai pas réussi à répondre à cette question avec les données de FlaiX Expert. Essaie de la formuler autrement, ou regarde dans Résultats.";

    const verifie = chiffresVerifies(reponse, lues);
    const restantes = await base.transaction(contexte(auth), async (c) => {
      await c.query(
        `INSERT INTO assistant_echange (lieu_id, utilisateur_id, question, reponse, sources, modele, verifie, jetons_entree, jetons_sortie)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [auth.lieuId, auth.utilisateurId, q.question, reponse, JSON.stringify(sources), modele, verifie, jetons.entree || null, jetons.sortie || null],
      );
      return Math.max(0, LIMITE_QUESTIONS_JOUR - (await questionsDuJour(c, auth.lieuId)));
    });
    return { reponse, sources, modele, verifie, restantes };
  });
}

