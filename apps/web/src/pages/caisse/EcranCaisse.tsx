import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Banknote, CreditCard, Lock, ReceiptText, RefreshCw, Tablet } from "lucide-react";
import {
  MOTIFS_AJUSTEMENT,
  PALIERS_REMISE_PB,
  apercuFidelite,
  calculerTicket,
  erreurAjustement,
  formaterMontant,
  lireMontant,
  scellerAnnulation,
  scellerVente,
  type Ajustement,
  type EcranCaisse as Ecran,
  type MotifAjustement,
  type ModeReglement,
  type AccueilTablette,
  type AppareilCaisse,
  type RepriseCaisse,
} from "@flaix/domain";
import { api, ErreurApi, formaterDateHeure } from "../../api.ts";
import { Chargement, MessageErreur, Regles } from "../../composants/communs.tsx";
import { useOptions, useSession } from "../../session.tsx";
import { BlocFidelite, useFideliteCaisse } from "./FideliteCaisse.tsx";
import {
  effacerEtat,
  ecrireEtat,
  envoyer,
  heureCaisse,
  initialiserEtat,
  lireEtat,
  lireNonEnvoyes,
  memoriserTicket,
  useCaisseLocale,
  useEnvoiAutomatique,
  type EtatCaisseLocale,
  type StatutEnvoi,
} from "./memoire.ts";

const pct = (pb: number) => `${(pb / 100).toLocaleString("fr-FR")} %`;
const SANS_CATEGORIE = "__autres";
const heure = new Intl.DateTimeFormat("fr-FR", { timeStyle: "short", timeZone: "Europe/Paris" });

interface Cloture {
  nbVentes: number;
  nbAnnulations: number;
  net: number;
  especes: number;
  carte: number;
  fond: number | null;
  especesAttendues: number | null;
}

/** Absence de réseau (et non refus du serveur) : fetch impossible, ou serveur injoignable derrière le relais. */
const horsLigne = (e: unknown) => !(e instanceof ErreurApi) || e.statut === 502 || e.statut === 504;

/**
 * Écran de caisse (§15.26, §15.97). Une caisse ouverte sur cet appareil fonctionne d'abord avec
 * sa mémoire locale : elle vend, scelle et garde ses tickets même sans réseau, puis les envoie.
 * `poste` : affiché à une caissière sur sa tablette (§15.100) — sans lien vers le reste du logiciel.
 */
export function EcranCaisse({ caisseId: caisseImposee, poste = false }: { caisseId?: string; poste?: boolean } = {}) {
  const parametre = useParams().caisseId;
  const caisseId = (caisseImposee ?? parametre)!;
  const client = useQueryClient();
  const { etat, statut } = useCaisseLocale(caisseId);
  const [cloture, setClotureBrute] = useState<Cloture | "sans-totaux" | null>(null);
  const setCloture = (c: Cloture | "sans-totaux" | null) => {
    setClotureBrute(c);
    // Après la clôture, l'écran relit l'état du serveur (caisse fermée, prête à rouvrir).
    if (c) void client.invalidateQueries({ queryKey: ["ecran-caisse", caisseId] });
  };
  // Dernier écran du serveur : catalogue et prix à jour dès que le réseau est là.
  const ecran = useQuery({ queryKey: ["ecran-caisse", caisseId], queryFn: () => api.get<Ecran>(`/caisses/${caisseId}/ecran`), refetchInterval: 60_000, retry: false });
  useEnvoiAutomatique(caisseId, etat !== null);
  // Caisse libérée sur cet appareil (clôturée par le directeur, reprise ailleurs) : relire l'écran du serveur.
  const avaitEtat = useRef(false);
  useEffect(() => {
    if (avaitEtat.current && !etat) void client.invalidateQueries({ queryKey: ["ecran-caisse", caisseId] });
    avaitEtat.current = etat !== null;
  }, [etat, caisseId, client]);

  useEffect(() => {
    const courant = lireEtat(caisseId);
    if (courant && ecran.data?.session?.id === courant.reprise.contexte.sessionId && JSON.stringify(ecran.data) !== JSON.stringify(courant.ecran)) {
      ecrireEtat({ ...courant, ecran: ecran.data });
    }
  }, [ecran.data, caisseId]);

  // Le résumé de clôture s'affiche même si l'écran du serveur n'a pas encore été relu.
  if (cloture) return <ResumeCloture cloture={cloture} fermer={() => setCloture(null)} />;

  const e = etat?.ecran ?? ecran.data;
  if (!e) {
    if (ecran.isPending || ecran.isFetching) return <Chargement />;
    return horsLigne(ecran.error) ? (
      <div className="cmd-gate">
        <h3>Pas de réseau</h3>
        <p>Cette caisse n'est pas ouverte sur cet appareil. Elle pourra être ouverte dès que le réseau reviendra.</p>
        <button className="cmd-encaisser" onClick={() => void ecran.refetch()}>
          Réessayer
        </button>
      </div>
    ) : (
      <MessageErreur erreur={ecran.error} />
    );
  }

  return (
    <>
      <div className="cmd-topbar">
        {!poste && (
          <Link to="/caisses" className="btn btn-fantome">
            <ArrowLeft size={15} /> Caisses
          </Link>
        )}
        <strong style={{ fontSize: 15 }}>
          Caisse {e.caisse.numero}
          {e.caisse.nom ? ` — ${e.caisse.nom}` : ""} · {e.caisse.standNom}
        </strong>
        {etat ? <span className="puce puce-vert">Ouverte · {e.session?.evenementLibelle ?? "session en cours"}</span> : <span className="puce">{e.session ? "Ouverte ailleurs" : "Fermée"}</span>}
        {etat && <PuceEnvoi statut={statut} enAttente={etat.attente.length} />}
        <span className="discret" style={{ marginLeft: "auto", fontSize: 12 }}>
          {e.session
            ? `Ouverte par ${e.session.ouvertePar} le ${formaterDateHeure(e.session.ouverteLe)}${e.session.fond !== null ? ` · fond ${formaterMontant(e.session.fond)}` : " · carte uniquement"}`
            : e.caisse.especesAutorisees
              ? "Espèces + carte"
              : "Carte uniquement"}
        </span>
      </div>
      {etat && statut.etat === "refus" && (
        <div className="message message-erreur">
          Envoi refusé par le serveur : {statut.message} Les {etat.attente.length} ticket(s) en attente restent sur cette tablette : ne vide pas le navigateur et préviens {poste ? "le directeur" : "FlaiX Expert"}.{" "}
          <button className="btn-lien" onClick={() => void envoyer(caisseId)}>
            Réessayer
          </button>
        </div>
      )}

      {etat ? (
        <Vente etat={etat} apresCloture={setCloture} poste={poste} />
      ) : e.session ? (
        <AutreAppareil caisseId={caisseId} ecran={e} poste={poste} />
      ) : (
        <Ouverture ecran={e} poste={poste} />
      )}

      {!poste && <TabletteDeCaisse caisseId={caisseId} numero={e.caisse.numero} />}

      <Regles>
        <ul>
          <li><strong>Ouverture de caisse</strong> : sur la tablette d'une caissière, automatique. Le jour d'un événement prévu, à la connexion, la caisse s'ouvre sur cet événement (qui s'ouvre avec la première caisse), avec le fond prévu par le directeur dans Paramètres → Stands & caisses. Sans événement prévu ce jour-là, la tablette attend et annonce le prochain. Si l'événement d'un jour précédent est resté ouvert alors qu'un autre est prévu aujourd'hui, elle ne s'ouvre pas : le directeur doit d'abord le clôturer. Le directeur ouvre une caisse d'un clic. L'ouverture demande le réseau.</li>
          <li><strong>Vente sans réseau</strong> : chaque ticket est numéroté, scellé et gardé dans la mémoire de cette tablette avant d'afficher « encaissé », puis envoyé au serveur — tout de suite, ou au retour du réseau, dans l'ordre. L'indicateur en haut de l'écran dit combien de tickets attendent. Ne pas utiliser de navigation privée ni vider le navigateur pendant un événement.</li>
          <li><strong>Prix</strong> : ceux du catalogue chargé sur la caisse, remis à jour dès que le réseau est là. Le serveur contrôle chaque ticket reçu : un prix différent du tarif en vigueur à l'heure de la vente est inscrit (la vente a eu lieu) et signalé dans Caisses → Tickets de l'événement.</li>
          <li><strong>Total du ticket</strong> = montant brut − remise − offert, jamais négatif. La remise (en %) s'applique à chaque ligne ; l'offert (en €) est réparti sur les lignes au prorata. La TVA est calculée sur le montant réellement payé.</li>
          <li><strong>Motif obligatoire</strong> dès qu'il y a une remise ou un offert : le bouton Encaisser reste grisé tant qu'il manque.</li>
          <li><strong>Tarif abonné</strong> : remise contractuelle au taux fixé par le lieu (Paramètres → Le lieu → Réglages de caisse), jamais négociée à la caisse. Le n° d'abonné ou de carte est obligatoire et enregistré avec la vente.</li>
          <li><strong>Espèces</strong> : saisis le montant donné par le client ; le rendu monnaie est calculé. <strong>Carte</strong> : valide une fois le paiement accepté sur le terminal (en version test, le paiement carte est déclaré, pas vérifié).</li>
          <li><strong>Numérotation</strong> : chaque caisse numérote ses propres tickets (ex. 2026-C3-000125), sans trou ni doublon, jamais remis à zéro, même sans réseau. Chaque ticket est scellé et chaîné au précédent de la même caisse ; le serveur refait tous les calculs avant de l'inscrire.</li>
          <li><strong>Annulation</strong> : se fait ici, depuis « Tickets de la session », tant que la caisse est ouverte, avec un motif. Le ticket d'origine demeure ; un ticket inverse le référence.</li>
          <li><strong>Une caisse ouverte appartient à un seul appareil.</strong> Si la tablette casse, le directeur fait « Reprendre la caisse sur cet appareil » depuis un autre : les tickets que l'ancienne n'avait pas encore envoyés ne pourront plus être inscrits. Une caissière ne peut pas reprendre une caisse.</li>
          <li><strong>Caissières</strong> : chacune se connecte avec son code sur la tablette enregistrée comme cette caisse ; chaque ticket porte le nom de la personne connectée au moment de la vente. « Changer de caissière » laisse la caisse ouverte, avec ses tickets en mémoire. La connexion demande le réseau ; une caissière déjà connectée continue de vendre sans réseau.</li>
          <li><strong>Clôture de caisse</strong> : par le directeur seul, avec le réseau. Depuis l'écran de la caisse, les tickets en attente partent d'abord. À distance (Caisses → En direct), seulement si la tablette a tout envoyé et a donné des nouvelles depuis moins de 2 minutes ; sinon il peut forcer, avec un motif et sa signature inscrits au journal : les tickets restés sur la tablette ne seront plus inscrits, ils y restent visibles. La clôture fige les totaux de la session (tickets, annulations, espèces, carte, TVA par taux) et calcule les espèces attendues dans le tiroir = fond + espèces encaissées ; le tiroir se compte ensuite dans Clôtures. Une caisse clôturée ne se rouvre pas seule : elle attend le prochain événement.</li>
        </ul>
      </Regles>
    </>
  );
}

function PuceEnvoi({ statut, enAttente }: { statut: StatutEnvoi; enAttente: number }) {
  if (statut.etat === "envoi") return <span className="puce puce-violet">Envoi…</span>;
  if (statut.etat === "reconnexion") return <span className="puce puce-ambre">Reconnecte-toi pour envoyer {enAttente} ticket(s)</span>;
  if (statut.etat === "refus") return <span className="puce puce-rouge">Envoi refusé</span>;
  if (enAttente === 0) return <span className="puce puce-vert">Tout est envoyé</span>;
  if (statut.etat === "hors_ligne") return <span className="puce puce-ambre">Hors ligne · {enAttente} en attente</span>;
  return <span className="puce puce-ambre">{enAttente} en attente d'envoi</span>;
}

/** Ouvre ou reprend la caisse sur cet appareil, puis garde en mémoire tout ce qu'il faut pour vendre seul. */
async function preparerAppareil(caisseId: string, reprise: RepriseCaisse): Promise<void> {
  const ecran = await api.get<Ecran>(`/caisses/${caisseId}/ecran`);
  initialiserEtat(caisseId, reprise, ecran);
}

function AutreAppareil({ caisseId, ecran, poste }: { caisseId: string; ecran: Ecran; poste: boolean }) {
  const client = useQueryClient();
  const [confirmer, setConfirmer] = useState(false);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<unknown>(null);
  async function reprendre() {
    setEnCours(true);
    setErreur(null);
    try {
      await preparerAppareil(caisseId, await api.post<RepriseCaisse>(`/caisses/${caisseId}/reprise`));
      await client.invalidateQueries({ queryKey: ["ecran-caisse", caisseId] });
    } catch (e) {
      setErreur(e);
    } finally {
      setEnCours(false);
    }
  }
  return (
    <div className="cmd-gate">
      <h3>Caisse ouverte sur un autre appareil</h3>
      <p>
        Caisse {ecran.caisse.numero} · {ecran.caisse.standNom}
        {ecran.session ? <> — ouverte par {ecran.session.ouvertePar} le {formaterDateHeure(ecran.session.ouverteLe)}</> : null}
      </p>
      {poste ? (
        <div className="message message-alerte" style={{ textAlign: "left" }}>
          Cette caisse est ouverte sur un autre appareil. Si cette tablette la remplace (autre tablette cassée ou perdue), seul le directeur peut la reprendre ici.
        </div>
      ) : (
        <div className="message message-alerte" style={{ textAlign: "left" }}>
          Une caisse ouverte n'appartient qu'à un seul appareil. Reprends-la ici seulement si l'autre appareil est cassé, perdu ou a perdu sa mémoire : les tickets qu'il n'a pas encore envoyés ne pourront plus être inscrits.
        </div>
      )}
      <MessageErreur erreur={erreur} />
      {poste ? null : confirmer ? (
        <div className="ligne-actions" style={{ justifyContent: "center" }}>
          <button className="btn btn-danger" disabled={enCours} onClick={() => void reprendre()}>
            Confirmer : reprendre la caisse ici
          </button>
          <button className="btn btn-fantome" onClick={() => setConfirmer(false)}>
            Annuler
          </button>
        </div>
      ) : (
        <button className="cmd-encaisser" onClick={() => setConfirmer(true)}>
          Reprendre la caisse sur cet appareil
        </button>
      )}
    </div>
  );
}

const centimesEnTexte = (c: number) => (c / 100).toFixed(2).replace(".", ",");

/**
 * Ouverture de caisse (§15.26, §15.130). Sur la tablette d'une caissière, rien à faire : la caisse
 * s'ouvre seule sur l'événement du jour avec le fond prévu par le directeur, sinon elle attend le
 * prochain événement. Le directeur ouvre d'un clic, fond prérempli, averti des cas particuliers.
 */
function Ouverture({ ecran, poste }: { ecran: Ecran; poste: boolean }) {
  const client = useQueryClient();
  const k = ecran.caisse;
  const o = ecran.ouverture;
  const [fond, setFond] = useState(k.fondPrevu !== null ? centimesEnTexte(k.fondPrevu) : "");
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<unknown>(null);
  const fondCentimes = lireMontant(fond);
  async function ouvrirCaisse(corps: unknown) {
    setEnCours(true);
    setErreur(null);
    try {
      await preparerAppareil(k.id, await api.post<RepriseCaisse>(`/caisses/${k.id}/ouverture`, corps));
      await client.invalidateQueries({ queryKey: ["ecran-caisse", k.id] });
    } catch (e) {
      setErreur(e);
    } finally {
      setEnCours(false);
    }
  }
  const desactivee = !k.actif || !ecran.standActif;
  // Pour la caissière, l'événement d'hier resté ouvert et la caisse déjà clôturée bloquent aussi ; le directeur, lui, est averti.
  const bloquant = desactivee ? "Cette caisse ou son stand est désactivé." : !o.evenement ? o.blocage : poste ? (o.blocage ?? o.dejaCloturee) : null;
  const automatique = poste && !bloquant && (!k.especesAutorisees || k.fondPrevu !== null);
  const tentee = useRef(false);
  useEffect(() => {
    if (!automatique || tentee.current) return;
    tentee.current = true;
    void ouvrirCaisse({});
  }, [automatique]); // une seule tentative automatique par affichage ; ensuite, « Réessayer »

  if (poste && bloquant) return <EnAttente ecran={ecran} message={bloquant} />;
  if (automatique) {
    return (
      <div className="cmd-gate">
        <h3>Ouverture de la caisse</h3>
        <p>
          Caisse {k.numero} · {k.standNom} — événement : <strong>{o.evenement!.libelle}</strong>
        </p>
        {erreur ? (
          <>
            <MessageErreur erreur={erreur} />
            <button className="cmd-encaisser" disabled={enCours} onClick={() => void ouvrirCaisse({})}>
              Réessayer
            </button>
          </>
        ) : (
          <Chargement />
        )}
      </div>
    );
  }

  const pret = !bloquant && (!k.especesAutorisees || fondCentimes !== null);
  return (
    <form
      className="cmd-gate"
      onSubmit={(ev) => {
        ev.preventDefault();
        if (pret) void ouvrirCaisse({ fond: k.especesAutorisees ? fondCentimes : null });
      }}
    >
      <h3>Ouverture de caisse</h3>
      <p>
        Caisse {k.numero} · {k.standNom}
        {o.evenement ? <> — événement : <strong>{o.evenement.libelle}</strong></> : null}
      </p>
      {bloquant ? (
        <div className="message message-alerte" style={{ textAlign: "left" }}>
          {bloquant} {!desactivee && <Link to="/caisses">Caisses → événement du jour</Link>}
        </div>
      ) : (
        <>
          {o.blocage && <div className="message message-alerte" style={{ textAlign: "left" }}>{o.blocage} Sur la tablette d'une caissière, la caisse ne s'ouvre pas.</div>}
          {o.dejaCloturee && (
            <div className="message message-info" style={{ textAlign: "left" }}>
              Cette caisse a déjà été clôturée pour « {o.evenement?.libelle} » : la rouvrir crée une nouvelle session sur cet événement.
            </div>
          )}
          {o.evenement?.aOuvrir && (
            <div className="message message-info" style={{ textAlign: "left" }}>
              « {o.evenement.libelle} » est prévu aujourd'hui : il s'ouvrira avec cette caisse (ouverture définitive).
            </div>
          )}
          {k.especesAutorisees ? (
            <>
              {poste && <p className="aide">Le directeur n'a pas prévu de fond pour cette caisse : compte le tiroir et saisis le montant.</p>}
              <label htmlFor="fond">Fond de caisse déclaré</label>
              <input id="fond" type="text" inputMode="decimal" value={fond} onChange={(e) => setFond(e.target.value)} placeholder="0,00" autoFocus />
              {!poste && k.fondPrevu !== null && <p className="aide">Fond prévu pour cette caisse : {formaterMontant(k.fondPrevu)} (Paramètres → Stands & caisses).</p>}
            </>
          ) : (
            <p style={{ marginTop: 8 }}>Caisse carte uniquement : pas de fond de caisse.</p>
          )}
        </>
      )}
      <NonEnvoyes caisseId={k.id} />
      <MessageErreur erreur={erreur} />
      <button className="cmd-encaisser" disabled={!pret || enCours}>
        {o.dejaCloturee ? "Rouvrir la caisse" : "Ouvrir la caisse"}
      </button>
    </form>
  );
}

/** Tablette de la caissière en attente : rien de prévu aujourd'hui, caisse déjà clôturée, ou action du directeur nécessaire. */
function EnAttente({ ecran, message }: { ecran: Ecran; message: string }) {
  const client = useQueryClient();
  const o = ecran.ouverture;
  // Rien de prévu aujourd'hui, ou caisse déjà clôturée : elle se rouvrira seule. Sinon, c'est au directeur d'agir.
  const seule = !o.evenement || (o.dejaCloturee !== null && o.blocage === null);
  return (
    <div className="cmd-gate">
      <h3>{o.dejaCloturee && !o.blocage ? "Caisse clôturée" : "Caisse en attente"}</h3>
      <p>
        Caisse {ecran.caisse.numero} · {ecran.caisse.standNom}
      </p>
      <div className="message message-info" style={{ textAlign: "left" }}>
        {message}
      </div>
      <p className="aide">{seule ? "Rien à faire : la caisse s'ouvrira toute seule le jour de l'événement, à la connexion." : "Préviens le directeur."}</p>
      <NonEnvoyes caisseId={ecran.caisse.id} />
      <button className="btn btn-fantome" onClick={() => void client.invalidateQueries({ queryKey: ["ecran-caisse", ecran.caisse.id] })}>
        <RefreshCw size={15} /> Actualiser
      </button>
    </div>
  );
}

/** Tickets restés sur cette tablette après une clôture forcée (§15.130) : plus inscrits, mais montrés au directeur. */
function NonEnvoyes({ caisseId }: { caisseId: string }) {
  const lots = lireNonEnvoyes(caisseId);
  const n = lots.reduce((s, l) => s + l.tickets.length, 0);
  if (n === 0) return null;
  return (
    <div className="message message-erreur" style={{ textAlign: "left" }}>
      <strong>
        {n} ticket{n > 1 ? "s" : ""} non inscrit{n > 1 ? "s" : ""}
      </strong>{" "}
      : la caisse a été clôturée par le directeur (ou reprise sur un autre appareil) avant leur envoi. Ils restent sur cette tablette : montre-les au directeur.
      <ul style={{ margin: "6px 0 0", paddingLeft: 18 }}>
        {lots.flatMap((l) =>
          l.tickets.map((t) => (
            <li key={t.id} className="chiffre">
              {t.numeroJustificatif} · {formaterMontant(t.totalTtc)} · {formaterDateHeure(t.horodatage)}
              {l.evenementLibelle ? ` · ${l.evenementLibelle}` : ""}
            </li>
          )),
        )}
      </ul>
    </div>
  );
}

function Vente({ etat, apresCloture, poste }: { etat: EtatCaisseLocale; apresCloture: (c: Cloture | "sans-totaux") => void; poste: boolean }) {
  const ecran = etat.ecran;
  const vendeur = useSession().data?.utilisateur.id;
  const caisseId = etat.caisseId;
  const options = useOptions();
  const fid = useFideliteCaisse(caisseId, options.fidelite);
  const produits = ecran.produits;
  const categories = useMemo(() => {
    const vues = new Map<string, string>();
    for (const p of produits) vues.set(p.categorieId ?? SANS_CATEGORIE, p.categorie ?? "Autres");
    return [...vues];
  }, [produits]);

  const [cat, setCat] = useState<string | null>(null);
  const [panier, setPanier] = useState<{ produitId: string; quantite: number }[]>([]);
  // Heure du premier produit tapé (§15.139) : mesure du temps de prise de commande, hors du ticket scellé.
  const debutSaisie = useRef<string | null>(null);
  const [remisePb, setRemisePb] = useState(0);
  const [offertSaisi, setOffertSaisi] = useState("");
  const [motif, setMotif] = useState<MotifAjustement | null>(null);
  const [motifTexte, setMotifTexte] = useState("");
  const [reference, setReference] = useState("");
  const [paiement, setPaiement] = useState<ModeReglement | null>(null);
  const [donneSaisi, setDonneSaisi] = useState("");
  const [flash, setFlash] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [erreurMemoire, setErreurMemoire] = useState<string | null>(null);
  const [confirmerCloture, setConfirmerCloture] = useState(false);
  const [voirTickets, setVoirTickets] = useState(false);

  const categorieActive = cat && categories.some(([id]) => id === cat) ? cat : (categories[0]?.[0] ?? null);
  const abonne = motif === "abonne";

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const lignes = panier.flatMap((l) => {
    const p = produits.find((x) => x.id === l.produitId);
    return p ? [{ produitId: p.id, libelle: p.nom, quantite: l.quantite, prixUnitaire: p.prixTtc, tauxTva: p.tauxTva }] : [];
  });
  const offert = offertSaisi.trim() ? (lireMontant(offertSaisi) ?? 0) : 0;
  const ajustement: Ajustement = { remisePb, offert, motif, motifTexte: motifTexte.trim() || null, reference: reference.trim() || null };
  const ticket = calculerTicket(lignes, ajustement);
  // Code promo et points (§15.127) : même calcul que le ticket scellé.
  const ap = apercuFidelite(lignes, ajustement, fid.vente);
  const total = ap.total;
  const nbArticles = panier.reduce((s, l) => s + l.quantite, 0);
  const ajuste = remisePb > 0 || offert > 0;
  const erreurAj = erreurAjustement(ajustement, ecran.remiseAbonnePb);
  const donne = lireMontant(donneSaisi) ?? 0;
  const especesOk = paiement !== "especes" || donne >= total;
  const pret = nbArticles > 0 && paiement !== null && especesOk && !erreurAj && !ap.pointsTropEleves;

  /**
   * Encaisser : le ticket est scellé et écrit dans la mémoire de la tablette AVANT d'être affiché
   * comme encaissé (§15.97). L'envoi au serveur suit, tout de suite ou au retour du réseau.
   */
  function encaisser() {
    if (!pret || !paiement) return;
    const courant = lireEtat(caisseId);
    if (!courant) return;
    const { evenement, tete } = scellerVente(courant.reprise.contexte, courant.tete, {
      id: crypto.randomUUID(),
      lignes,
      ajustement,
      modeReglement: paiement,
      montantDonne: paiement === "especes" ? donne : null,
      horodatage: heureCaisse(courant),
      utilisateurId: vendeur,
      fidelite: fid.vente,
    });
    try {
      memoriserTicket(courant, debutSaisie.current ? { ...evenement, debutSaisie: debutSaisie.current } : evenement, tete);
    } catch {
      setErreurMemoire("La mémoire de la tablette refuse l'enregistrement : cette vente n'est PAS enregistrée. Vérifie que la navigation privée n'est pas activée.");
      return;
    }
    setErreurMemoire(null);
    debutSaisie.current = null;
    const rendu = paiement === "especes" ? donne - evenement.totalTtc : 0;
    setToast(`✓ ${formaterMontant(evenement.totalTtc)} encaissé · ${evenement.numeroJustificatif}${rendu ? ` · rendu ${formaterMontant(rendu)}` : ""}`);
    setPanier([]);
    setRemisePb(0);
    setOffertSaisi("");
    setMotif(null);
    setMotifTexte("");
    setReference("");
    setPaiement(null);
    setDonneSaisi("");
    fid.vider();
    void envoyer(caisseId);
  }

  // Clôture : réseau nécessaire ; tout ce qui attend part d'abord, puis le serveur vérifie qu'il ne manque rien.
  const [clotureEnCours, setClotureEnCours] = useState(false);
  const [erreurCloture, setErreurCloture] = useState<string | null>(null);
  async function lancerCloture() {
    setClotureEnCours(true);
    setErreurCloture(null);
    try {
      await envoyer(caisseId);
      const courant = lireEtat(caisseId);
      if (!courant) return;
      if (courant.attente.length > 0) {
        setErreurCloture(`${courant.attente.length} ticket(s) pas encore envoyé(s) : la clôture demande le réseau. Réessaie dès qu'il revient.`);
        return;
      }
      try {
        const totaux = await api.post<Cloture>(`/caisses/${caisseId}/cloture`, { jeton: courant.reprise.jeton, derniereSequence: courant.tete.sequence });
        effacerEtat(caisseId);
        apresCloture(totaux);
      } catch (e) {
        // Réponse perdue alors que la clôture a été faite (test F4) : le serveur dit que la caisse est fermée.
        if (e instanceof ErreurApi && e.statut === 409 && e.message.includes("n'est pas ouverte")) {
          const serveur = await api.get<Ecran>(`/caisses/${caisseId}/ecran`).catch(() => null);
          if (serveur && !serveur.session) {
            effacerEtat(caisseId);
            apresCloture("sans-totaux");
            return;
          }
        }
        setErreurCloture(horsLigne(e) ? "Pas de réseau : la clôture de caisse demande le réseau. Réessaie dès qu'il revient." : e instanceof Error ? e.message : String(e));
      }
    } finally {
      setClotureEnCours(false);
    }
  }
  const cloturer = { lancer: () => void lancerCloture(), enCours: clotureEnCours, erreur: erreurCloture };

  function ajouter(id: string) {
    // Premier produit d'une commande : la mesure commence, à l'heure de la caisse (celle du ticket).
    if (panier.length === 0 || debutSaisie.current === null) {
      const courant = lireEtat(caisseId);
      debutSaisie.current = courant ? heureCaisse(courant).toISOString() : null;
    }
    setPanier((p) => (p.some((l) => l.produitId === id) ? p.map((l) => (l.produitId === id ? { ...l, quantite: l.quantite + 1 } : l)) : [...p, { produitId: id, quantite: 1 }]));
    setFlash(id);
    setTimeout(() => setFlash((f) => (f === id ? null : f)), 420);
  }
  function retirer(id: string) {
    // Panier vidé à la main (le client renonce) : la mesure repart au prochain produit tapé.
    if (nbArticles <= 1) debutSaisie.current = null;
    setPanier((p) => p.flatMap((l) => (l.produitId !== id ? [l] : l.quantite > 1 ? [{ ...l, quantite: l.quantite - 1 }] : [])));
  }
  function choisirRemise(pb: number) {
    setRemisePb(pb);
    if (abonne) {
      setMotif(null);
      setReference("");
    }
  }
  function basculerAbonne() {
    if (abonne) {
      setMotif(null);
      setReference("");
      setRemisePb(0);
    } else if (ecran.remiseAbonnePb !== null) {
      setMotif("abonne");
      setRemisePb(ecran.remiseAbonnePb);
    }
  }
  function choisirMotif(m: MotifAjustement) {
    setMotif(m);
    if (m === "abonne" && ecran.remiseAbonnePb !== null) setRemisePb(ecran.remiseAbonnePb);
    else if (m !== "abonne") setReference("");
  }

  const montantsRapides = [...new Set([total, ...[500, 1000, 2000, 5000].filter((v) => v >= total)])].slice(0, 4);

  if (produits.length === 0) {
    return (
      <div className="carte">
        <div className="etat-vide">
          <strong>Aucun produit vendu à ce stand</strong>
          {poste ? "Préviens le directeur : aucun produit n'est coché pour ce stand." : <>Coche ce stand sur tes produits dans <Link to="/parametres/produits">Paramètres → Produits & prix</Link>.</>}
        </div>
        <ClotureBouton confirmer={confirmerCloture} setConfirmer={setConfirmerCloture} cloturer={cloturer} poste={poste} />
      </div>
    );
  }

  return (
    <>
    <div className="ligne-actions" style={{ marginTop: 0, marginBottom: 10 }}>
      <button className="btn btn-fantome" onClick={() => setVoirTickets(!voirTickets)}>
        <ReceiptText size={15} /> Tickets de la session ({etat.tickets.filter((t) => t.type === "vente").length})
      </button>
      {etat.attente.length > 0 && (
        <button className="btn btn-fantome" onClick={() => void envoyer(caisseId)}>
          <RefreshCw size={15} /> Envoyer maintenant
        </button>
      )}
    </div>
    {voirTickets && <TicketsSession etat={etat} vendeur={vendeur} />}
    {erreurMemoire && <div className="message message-erreur">{erreurMemoire}</div>}
    <div className="cmd-layout">
      <div>
        <div className="cmd-cats">
          {categories.map(([id, nom]) => (
            <button key={id} className={`cmd-catbtn${id === categorieActive ? " active" : ""}`} onClick={() => setCat(id)}>
              {nom}
            </button>
          ))}
        </div>
        <div className="cmd-pgrid">
          {produits
            .filter((p) => (p.categorieId ?? SANS_CATEGORIE) === categorieActive)
            .map((p) => (
              <button key={p.id} className={`cmd-pcard${flash === p.id ? " zap" : ""}`} onClick={() => ajouter(p.id)}>
                <div className="cmd-pname">{p.nom}</div>
                <div className="cmd-prow chiffre">{formaterMontant(p.prixTtc)}</div>
              </button>
            ))}
        </div>
      </div>

      <div className="cmd-ticket">
        <div className="cmd-thead">
          <strong>Ticket</strong>
          <span className="cmd-tcount">{nbArticles} art.</span>
        </div>
        {lignes.length === 0 ? (
          <div className="cmd-empty">Touchez un produit pour l'ajouter.</div>
        ) : (
          lignes.map((l) => (
            <div key={l.produitId} className="cmd-line">
              <div style={{ flex: 1 }}>
                <div className="nom">{l.libelle}</div>
                <div className="prix chiffre">{formaterMontant(l.prixUnitaire)}</div>
              </div>
              <button className="cmd-stepbtn" onClick={() => retirer(l.produitId)} aria-label={`Retirer un ${l.libelle}`}>−</button>
              <span className="cmd-qty chiffre">{l.quantite}</span>
              <button className="cmd-stepbtn" onClick={() => ajouter(l.produitId)} aria-label={`Ajouter un ${l.libelle}`}>+</button>
            </div>
          ))
        )}

        <div className="cmd-blocklabel">Remise au paiement</div>
        <div className="cmd-pillrow">
          <button
            className={`cmd-pill abo${abonne ? " on" : ""}`}
            onClick={basculerAbonne}
            disabled={ecran.remiseAbonnePb === null}
            title={ecran.remiseAbonnePb === null ? "Règle d'abord le taux abonné dans Paramètres → Le lieu → Réglages de caisse" : undefined}
          >
            Abonné{ecran.remiseAbonnePb !== null ? ` · ${pct(ecran.remiseAbonnePb)}` : ""}
          </button>
          {PALIERS_REMISE_PB.map((pb) => (
            <button key={pb} className={`cmd-pill${!abonne && remisePb === pb ? " on" : ""}${abonne ? " dimmed" : ""}`} onClick={() => choisirRemise(pb)}>
              {pb === 0 ? "Aucune" : pct(pb)}
            </button>
          ))}
        </div>

        <div className="cmd-blocklabel">Offert (montant exact)</div>
        <div className="cmd-offert-row">
          <input type="text" inputMode="decimal" value={offertSaisi} onChange={(e) => setOffertSaisi(e.target.value)} placeholder="0,00" aria-invalid={offertSaisi.trim() !== "" && lireMontant(offertSaisi) === null} />
          <span className="aide">€ offerts</span>
        </div>

        {ajuste && (
          <div className={`cmd-motif-box${erreurAj ? " required" : ""}`}>
            <div className="cmd-motif-title">Motif {erreurAj && <span className="req">obligatoire</span>}</div>
            <div className="cmd-motif-grid">
              {(Object.keys(MOTIFS_AJUSTEMENT) as MotifAjustement[]).map((m) => (
                <button key={m} className={`cmd-motif-chip${motif === m ? " on" : ""}`} onClick={() => choisirMotif(m)} disabled={m === "abonne" && ecran.remiseAbonnePb === null}>
                  {MOTIFS_AJUSTEMENT[m].libelle}
                </button>
              ))}
            </div>
            {motif === "autre" && <input type="text" value={motifTexte} onChange={(e) => setMotifTexte(e.target.value)} placeholder="Préciser le motif…" maxLength={200} />}
            {motif === "abonne" && (
              <>
                <input type="text" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="N° d'abonné ou de carte — obligatoire" maxLength={60} />
                <div className="aide" style={{ marginTop: 5 }}>Remise contractuelle au taux du lieu ({pct(ecran.remiseAbonnePb ?? 0)}). Le numéro est enregistré avec la vente.</div>
              </>
            )}
          </div>
        )}

        {ticket.remise > 0 && (
          <div className="cmd-subtot">
            <span>Sous-total · {abonne ? `remise abonné ${pct(remisePb)}` : `remise ${pct(remisePb)}`}</span>
            <span className="chiffre">
              {formaterMontant(ticket.brut)} · − {formaterMontant(ticket.remise)}
            </span>
          </div>
        )}
        {ticket.offert > 0 && (
          <div className="cmd-subtot">
            <span>Offert</span>
            <span className="chiffre">− {formaterMontant(ticket.offert)}</span>
          </div>
        )}
        {options.fidelite && <BlocFidelite f={fid} numeroAbonne={abonne && reference.trim() ? reference : null} resteAPayer={ticket.total - ap.promo} />}
        {ap.promo > 0 && (
          <div className="cmd-subtot">
            <span>Code {fid.code?.code}</span>
            <span className="chiffre">− {formaterMontant(ap.promo)}</span>
          </div>
        )}
        {ap.points > 0 && (
          <div className="cmd-subtot">
            <span>Points ({fid.points?.points})</span>
            <span className="chiffre">− {formaterMontant(ap.points)}</span>
          </div>
        )}
        <div className="cmd-total">
          <span>Total TTC</span>
          <span className="chiffre">{formaterMontant(total)}</span>
        </div>

        <div className="cmd-payrow">
          {ecran.caisse.especesAutorisees && (
            <button className={`cmd-paybtn${paiement === "especes" ? " on" : ""}`} onClick={() => { setPaiement("especes"); setDonneSaisi(""); }}>
              <Banknote size={16} /> Espèces
            </button>
          )}
          <button className={`cmd-paybtn${paiement === "carte" ? " on" : ""}`} onClick={() => setPaiement("carte")}>
            <CreditCard size={16} /> Carte
          </button>
        </div>

        {paiement === "especes" && (
          <div className="cmd-cashbox">
            <div className="cmd-blocklabel" style={{ marginTop: 0 }}>Montant donné par le client</div>
            <div className="cmd-quick">
              {montantsRapides.map((v, i) => (
                <button key={v} className={`cmd-qbtn${lireMontant(donneSaisi) === v ? " on" : ""}`} onClick={() => setDonneSaisi(String(v / 100).replace(".", ","))}>
                  {i === 0 ? "Exact" : formaterMontant(v)}
                </button>
              ))}
            </div>
            <input type="text" inputMode="decimal" value={donneSaisi} onChange={(e) => setDonneSaisi(e.target.value)} placeholder="Saisir un montant" />
            <div className="cmd-rendu">
              <span>Rendu monnaie</span>
              <span className="chiffre" style={{ color: !donneSaisi ? "var(--muted)" : donne < total ? "var(--red)" : "var(--green)" }}>
                {!donneSaisi ? "—" : donne < total ? `Manque ${formaterMontant(total - donne)}` : formaterMontant(donne - total)}
              </span>
            </div>
          </div>
        )}
        {paiement === "carte" && <div className="aide" style={{ marginBottom: 10 }}>Paiement carte sur le terminal — valider une fois le paiement accepté.</div>}

        <button className="cmd-encaisser" disabled={!pret} onClick={encaisser}>
          {paiement === "carte" ? "Valider le paiement" : "Encaisser"}
        </button>
        {nbArticles > 0 && erreurAj && <div className="cmd-blockmsg">{erreurAj}</div>}
        {nbArticles > 0 && ap.pointsTropEleves && <div className="cmd-blockmsg">Les points dépassent ce qui reste à payer : rends-les (×) et choisis moins de paliers.</div>}

        <ClotureBouton confirmer={confirmerCloture} setConfirmer={setConfirmerCloture} cloturer={cloturer} poste={poste} />
      </div>
      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
    </>
  );
}

/** Tickets scellés sur cet appareil pendant la session ; c'est ici qu'une vente s'annule (§15.97 point 7). */
function TicketsSession({ etat, vendeur }: { etat: EtatCaisseLocale; vendeur: string | undefined }) {
  const [cible, setCible] = useState<string | null>(null);
  const [motif, setMotif] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const annulees = new Map(etat.tickets.filter((t) => t.type === "annulation").map((t) => [t.refEvenement, t.numeroJustificatif]));
  const enAttente = new Set(etat.attente);
  const tickets = [...etat.tickets].reverse();

  function annuler(id: string) {
    const courant = lireEtat(etat.caisseId);
    const origine = courant?.tickets.find((t) => t.id === id);
    if (!courant || !origine) return;
    const { evenement, tete } = scellerAnnulation(courant.reprise.contexte, courant.tete, origine, { id: crypto.randomUUID(), motif, horodatage: heureCaisse(courant), utilisateurId: vendeur });
    try {
      memoriserTicket(courant, evenement, tete);
    } catch {
      setErreur("La mémoire de la tablette refuse l'enregistrement : l'annulation n'est PAS enregistrée.");
      return;
    }
    setCible(null);
    setMotif("");
    setErreur(null);
    void envoyer(etat.caisseId);
  }

  return (
    <div className="carte" style={{ marginBottom: 12 }}>
      <div className="carte-entete">
        <div>
          <h2>Tickets de la session</h2>
          <p>Les plus récents en premier. Une vente s'annule ici tant que la caisse est ouverte ; le ticket d'origine demeure.</p>
        </div>
      </div>
      {tickets.length === 0 ? (
        <div className="discret">Aucun ticket sur cet appareil pour l'instant.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 320, overflowY: "auto" }}>
          {tickets.map((t) => (
            <div key={t.id} className="caisse">
              <strong className="chiffre">{t.numeroJustificatif}</strong>
              <span className="discret">{heure.format(new Date(t.horodatage))}</span>
              <span className="chiffre">{formaterMontant(t.totalTtc)}</span>
              <span>{t.modeReglement === "especes" ? "Espèces" : "Carte"}</span>
              {t.type === "annulation" && <span className="puce puce-rouge">Annulation</span>}
              {t.type === "vente" && annulees.has(t.id) && <span className="puce puce-ambre">Annulé ({annulees.get(t.id)})</span>}
              {enAttente.has(t.id) && <span className="puce puce-ambre">En attente d'envoi</span>}
              <div className="actions">
                {t.type === "vente" &&
                  !annulees.has(t.id) &&
                  (cible === t.id ? (
                    <>
                      <input type="text" value={motif} onChange={(e) => setMotif(e.target.value)} placeholder="Motif (obligatoire)" maxLength={200} autoFocus style={{ width: 200 }} />
                      <button className="btn btn-danger" disabled={motif.trim().length < 3} onClick={() => annuler(t.id)}>
                        Confirmer l'annulation
                      </button>
                      <button className="btn btn-fantome" onClick={() => setCible(null)}>
                        Retour
                      </button>
                    </>
                  ) : (
                    <button className="btn btn-danger" onClick={() => { setCible(t.id); setMotif(""); }}>
                      Annuler
                    </button>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}
      {erreur && <div className="message message-erreur">{erreur}</div>}
    </div>
  );
}

function ClotureBouton({
  confirmer,
  setConfirmer,
  cloturer,
  poste,
}: {
  confirmer: boolean;
  setConfirmer: (v: boolean) => void;
  cloturer: { lancer: () => void; enCours: boolean; erreur: string | null };
  poste: boolean;
}) {
  // La caissière ne clôture pas : c'est le directeur, depuis cet écran ou à distance (§15.130).
  if (poste) {
    return (
      <p className="aide" style={{ marginTop: 14, textAlign: "center" }}>
        <Lock size={13} /> La clôture de la caisse est faite par le directeur.
      </p>
    );
  }
  return (
    <div style={{ marginTop: 14 }}>
      {confirmer ? (
        <div className="message message-alerte">
          Clôturer la caisse ? Les tickets en attente partent d'abord, puis les totaux de la session sont figés. Demande le réseau.
          <div className="ligne-actions" style={{ marginTop: 8 }}>
            <button className="btn" onClick={cloturer.lancer} disabled={cloturer.enCours}>
              {cloturer.enCours ? "Clôture…" : "Oui, clôturer"}
            </button>
            <button className="btn btn-fantome" onClick={() => setConfirmer(false)}>
              Annuler
            </button>
          </div>
        </div>
      ) : (
        <button className="btn btn-fantome btn-bloc" onClick={() => setConfirmer(true)}>
          <Lock size={15} /> Clôturer la caisse
        </button>
      )}
      {cloturer.erreur && <div className="message message-erreur">{cloturer.erreur}</div>}
    </div>
  );
}

function ResumeCloture({ cloture, fermer }: { cloture: Cloture | "sans-totaux"; fermer: () => void }) {
  if (cloture === "sans-totaux") {
    return (
      <div className="cmd-gate">
        <h3>Caisse clôturée</h3>
        <p>La clôture a bien été enregistrée par le serveur. Ses totaux sont consultables dans Caisses.</p>
        <button className="cmd-encaisser" onClick={fermer}>
          OK
        </button>
      </div>
    );
  }
  return (
    <div className="cmd-gate" style={{ textAlign: "left" }}>
      <h3 style={{ textAlign: "center" }}>Caisse clôturée</h3>
      <p style={{ textAlign: "center" }}>Totaux de la session, figés et scellés.</p>
      <div>
        {[
          ["Tickets", String(cloture.nbVentes)],
          ["Annulations", String(cloture.nbAnnulations)],
          ["Total encaissé (net)", formaterMontant(cloture.net)],
          ["dont espèces", formaterMontant(cloture.especes)],
          ["dont carte", formaterMontant(cloture.carte)],
          ...(cloture.especesAttendues !== null
            ? [
                ["Fond de caisse", formaterMontant(cloture.fond ?? 0)],
                ["Espèces attendues dans le tiroir", formaterMontant(cloture.especesAttendues)],
              ]
            : []),
        ].map(([l, v]) => (
          <div key={l} className="en-ligne" style={{ justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid var(--border)" }}>
            <span>{l}</span>
            <strong className="chiffre">{v}</strong>
          </div>
        ))}
      </div>
      <button className="cmd-encaisser" onClick={fermer}>
        OK
      </button>
    </div>
  );
}

/**
 * Enregistrer l'appareil utilisé comme tablette de cette caisse (§15.100) : réservé au directeur,
 * fait sur la tablette elle-même. Les caissières pourront ensuite s'y connecter avec leur code.
 */
function TabletteDeCaisse({ caisseId, numero }: { caisseId: string; numero: number }) {
  const client = useQueryClient();
  const appareil = useQuery({
    queryKey: ["appareil"],
    queryFn: () => api.get<AccueilTablette>("/appareil").catch((e) => (e instanceof ErreurApi && e.statut === 404 ? null : Promise.reject(e))),
    retry: false,
  });
  const [confirmer, setConfirmer] = useState(false);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<unknown>(null);
  const formation = useSession().data?.formation;
  // En formation, les tablettes se règlent depuis le vrai lieu (Équipe → Tablettes, §15.109).
  if (formation || appareil.isPending || appareil.error) return null;
  const ici = appareil.data;

  async function enregistrer() {
    setEnCours(true);
    setErreur(null);
    try {
      await api.post<AppareilCaisse[]>(`/caisses/${caisseId}/appareil`);
      await client.invalidateQueries({ queryKey: ["appareil"] });
      await client.invalidateQueries({ queryKey: ["appareils"] });
      setConfirmer(false);
    } catch (e) {
      setErreur(e);
    } finally {
      setEnCours(false);
    }
  }

  if (ici?.caisse.id === caisseId) {
    return (
      <div className="message message-ok" style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Tablet size={16} /> Cet appareil est la tablette de la caisse {numero} : les caissières s'y connectent avec leur code après ta déconnexion.
      </div>
    );
  }
  return (
    <div className="carte" style={{ marginTop: 12 }}>
      <div className="carte-entete">
        <div>
          <h2>Tablette de caisse</h2>
          <p>
            {ici
              ? `Cet appareil est la tablette de la caisse ${ici.caisse.numero}. Tu peux en faire plutôt la tablette de la caisse ${numero}.`
              : `Pour que les caissières se connectent ici avec leur code, enregistre cet appareil comme tablette de la caisse ${numero}.`}
          </p>
        </div>
        {!confirmer && (
          <button className="btn btn-fantome" onClick={() => setConfirmer(true)}>
            <Tablet size={15} /> Enregistrer cet appareil
          </button>
        )}
      </div>
      {confirmer && (
        <div className="message message-alerte">
          À faire sur la tablette posée au stand, pas sur ton ordinateur : les caissières pourront s'y connecter avec leur code et n'y verront que la caisse {numero}.
          <div className="ligne-actions" style={{ marginTop: 8 }}>
            <button className="btn" disabled={enCours} onClick={() => void enregistrer()}>
              Oui, cet appareil devient la caisse {numero}
            </button>
            <button className="btn btn-fantome" onClick={() => setConfirmer(false)}>
              Annuler
            </button>
          </div>
        </div>
      )}
      <MessageErreur erreur={erreur} />
    </div>
  );
}
