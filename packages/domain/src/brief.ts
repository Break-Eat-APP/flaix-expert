/**
 * Brief de fin de soirée (décision de Rémi du 2026-10-04, dossier §15.135) : les quelques points qui
 * comptent, envoyés sur le téléphone du directeur à la clôture de l'événement.
 *
 * Il est établi par des règles fixes à partir du rapport de soirée figé : chaque chiffre du brief est un
 * chiffre du rapport, recopié tel quel. Une IA (Mistral) pourra ensuite le reformuler, mais jamais
 * inventer un chiffre : `chiffresDe` permet de vérifier qu'une reformulation ne contient que des
 * chiffres présents dans le brief d'origine.
 */
import { formaterMontant } from "./argent.ts";
import { formaterPourcentage } from "./finances.ts";
import type { RapportSoiree } from "./rapport-soiree.ts";

export interface PointBrief {
  niveau: "bon" | "attention" | "info";
  texte: string;
}

export interface BriefSoiree {
  evenementId: string;
  titre: string;
  /** Une ligne : tickets, panier moyen, marge nette. */
  resume: string;
  /** Au plus quatre points, dans l'ordre d'importance. */
  points: PointBrief[];
  /** Page du rapport de soirée complet. */
  lien: string;
}

const signe = (n: number, f: (v: number) => string) => (n > 0 ? `+${f(n)}` : n < 0 ? `−${f(-n)}` : f(0));
const pct = (v: number) => `${v.toLocaleString("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} %`;

export function briefDeSoiree(r: RapportSoiree): BriefSoiree {
  const v = r.ventes;
  const points: PointBrief[] = [];

  // 1. Le résultat face à sa cible.
  const c = r.cibleMargeNette;
  if (c && c.ecart !== null) {
    points.push(
      c.tenue
        ? { niveau: "bon", texte: `Cible de marge nette tenue (${formaterPourcentage(c.ciblePb)}) : ${signe(c.ecart, formaterMontant)}.` }
        : { niveau: "attention", texte: `Marge nette sous la cible (${formaterPourcentage(c.ciblePb)}) de ${formaterMontant(-c.ecart)}.` },
    );
  } else if (r.margeNette === null) {
    points.push({ niveau: "attention", texte: r.margeBrute === null ? "Marge non calculable : coût d'achat manquant sur un produit." : "Marge nette non calculable : taux horaire manquant dans Équipe." });
  }

  // 2. L'évolution par rapport à l'événement précédent.
  const e = r.comparaison.encaisseTtc;
  if (r.comparaison.evenement && e.ecartPct !== null && e.ecart !== null) {
    points.push({
      niveau: e.ecart >= 0 ? "bon" : "attention",
      texte: `Encaissé ${signe(e.ecartPct, pct)} par rapport à « ${r.comparaison.evenement.libelle} » (${signe(e.ecart, formaterMontant)}).`,
    });
  }

  // 3. Ce qui demande une vérification : espèces, stock, puis les alertes fortes.
  const tiroirs = r.especes.tiroirs.filter((t) => t.ecart !== null && Math.abs(t.ecart) > r.especes.seuil);
  for (const t of tiroirs.slice(0, 2)) points.push({ niveau: "attention", texte: `Caisse ${t.caisse} : écart d'espèces de ${signe(t.ecart!, formaterMontant)}.` });
  if (r.stock.suivi && r.stock.valeurTotale < 0) points.push({ niveau: "attention", texte: `Écarts de stock : ${signe(r.stock.valeurTotale, formaterMontant)} de marchandise.` });
  for (const a of r.alertes.filter((x) => x.niveau === "forte" && !x.titre.includes("écart d'espèces")).slice(0, 2)) points.push({ niveau: "attention", texte: `${a.titre}.` });

  // 4. Ce qui a le mieux marché.
  const top = r.top.parMarge[0];
  if (top && top.marge !== null) points.push({ niveau: "info", texte: `Meilleure marge : ${top.nom}, ${formaterMontant(top.marge)} (${top.quantite} vendus).` });

  const morceaux = [`${v.tickets.toLocaleString("fr-FR")} ticket${v.tickets > 1 ? "s" : ""}`];
  if (v.panierMoyen !== null) morceaux.push(`panier moyen ${formaterMontant(v.panierMoyen)}`);
  if (r.margeNette !== null) morceaux.push(`marge nette ${formaterMontant(r.margeNette)}`);
  return {
    evenementId: r.evenement.id,
    titre: `${r.evenement.libelle} : ${formaterMontant(v.encaisseTtc)} encaissés`,
    resume: `${morceaux.join(" · ")}.`,
    points: points.slice(0, 4),
    lien: `/rapport-soiree/${r.evenement.id}`,
  };
}

/** Texte de la notification : le titre, puis le résumé et les deux premiers points. */
export function texteNotification(b: BriefSoiree): { titre: string; corps: string } {
  return { titre: b.titre, corps: [b.resume, ...b.points.slice(0, 2).map((p) => p.texte)].join("\n") };
}

/** Tous les nombres d'un texte (« 1 234,50 € », « −12,4 % », « 3 ») ramenés à une forme comparable. */
export function chiffresDe(texte: string): string[] {
  return (texte.match(/\d[\d\s  ]*(?:,\d+)?/g) ?? []).map((n) => n.replace(/[\s  ]/g, "")).filter((n) => n !== "");
}

/** Une reformulation est acceptée seulement si chacun de ses nombres figure déjà dans le brief d'origine. */
export function reformulationFidele(origine: BriefSoiree, reformulation: string): boolean {
  const permis = new Set(chiffresDe([origine.titre, origine.resume, ...origine.points.map((p) => p.texte)].join(" ")));
  return chiffresDe(reformulation).every((n) => permis.has(n));
}
