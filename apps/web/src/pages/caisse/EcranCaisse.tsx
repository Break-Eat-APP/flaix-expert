import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Banknote, CreditCard, Lock } from "lucide-react";
import {
  MOTIFS_AJUSTEMENT,
  PALIERS_REMISE_PB,
  calculerTicket,
  erreurAjustement,
  formaterMontant,
  lireMontant,
  type Ajustement,
  type EcranCaisse as Ecran,
  type MotifAjustement,
  type ModeReglement,
  type TicketVue,
} from "@flaix/domain";
import { api, formaterDateHeure } from "../../api.ts";
import { Chargement, MessageErreur, Regles } from "../../composants/communs.tsx";

const pct = (pb: number) => `${(pb / 100).toLocaleString("fr-FR")} %`;
const SANS_CATEGORIE = "__autres";

interface Cloture {
  nbVentes: number;
  nbAnnulations: number;
  net: number;
  especes: number;
  carte: number;
  fond: number | null;
  especesAttendues: number | null;
}

export function EcranCaisse() {
  const { caisseId } = useParams();
  const client = useQueryClient();
  const ecran = useQuery({ queryKey: ["ecran-caisse", caisseId], queryFn: () => api.get<Ecran>(`/caisses/${caisseId}/ecran`) });
  const [cloture, setCloture] = useState<Cloture | null>(null);
  const rafraichir = () => client.invalidateQueries({ queryKey: ["ecran-caisse", caisseId] });

  if (ecran.isPending) return <Chargement />;
  if (ecran.error) return <MessageErreur erreur={ecran.error} />;
  const e = ecran.data!;

  return (
    <>
      <div className="cmd-topbar">
        <Link to="/caisses" className="btn btn-fantome">
          <ArrowLeft size={15} /> Caisses
        </Link>
        <strong style={{ fontSize: 15 }}>
          Caisse {e.caisse.numero}
          {e.caisse.nom ? ` — ${e.caisse.nom}` : ""} · {e.caisse.standNom}
        </strong>
        {e.session ? (
          <span className="puce puce-vert">Ouverte · {e.session.evenementLibelle}</span>
        ) : (
          <span className="puce">Fermée</span>
        )}
        <span className="discret" style={{ marginLeft: "auto", fontSize: 12 }}>
          {e.session
            ? `Ouverte par ${e.session.ouvertePar} le ${formaterDateHeure(e.session.ouverteLe)}${e.session.fond !== null ? ` · fond ${formaterMontant(e.session.fond)}` : " · carte uniquement"}`
            : e.caisse.especesAutorisees
              ? "Espèces + carte"
              : "Carte uniquement"}
        </span>
      </div>

      {cloture && <ResumeCloture cloture={cloture} fermer={() => setCloture(null)} />}
      {!cloture && (e.session ? <Vente ecran={e} apresCloture={(c) => { setCloture(c); rafraichir(); }} /> : <Ouverture ecran={e} ouverte={rafraichir} />)}

      <Regles>
        <ul>
          <li><strong>Ouverture de caisse</strong> : obligatoire avant le premier ticket, et seulement pendant un match ouvert. Le fond de caisse n'est demandé que si la caisse accepte les espèces.</li>
          <li><strong>Prix</strong> : chaque ligne est facturée au tarif en vigueur à l'instant de la vente, lu par le serveur. Changer un prix ensuite ne modifie jamais un ticket déjà émis.</li>
          <li><strong>Total du ticket</strong> = montant brut − remise − offert, jamais négatif. La remise (en %) s'applique à chaque ligne ; l'offert (en €) est réparti sur les lignes au prorata. La TVA est calculée sur le montant réellement payé.</li>
          <li><strong>Motif obligatoire</strong> dès qu'il y a une remise ou un offert : le bouton Encaisser reste grisé tant qu'il manque.</li>
          <li><strong>Tarif abonné</strong> : remise contractuelle au taux fixé par le lieu (Paramètres → Le lieu → Réglages de caisse), jamais négociée à la caisse. Le n° d'abonné ou de carte est obligatoire et enregistré avec la vente.</li>
          <li><strong>Espèces</strong> : saisis le montant donné par le client ; le rendu monnaie est calculé. <strong>Carte</strong> : valide une fois le paiement accepté sur le terminal (en version test, le paiement carte est déclaré, pas vérifié).</li>
          <li><strong>Numérotation</strong> : chaque caisse numérote ses propres tickets (ex. 2026-C3-000125), sans trou ni doublon, jamais remis à zéro. Chaque ticket est scellé et chaîné au précédent de la même caisse.</li>
          <li><strong>Clôture de caisse</strong> : fige les totaux de la session (tickets, annulations, espèces, carte, TVA par taux) et calcule les espèces attendues dans le tiroir = fond + espèces encaissées. Le comptage du tiroir se fera ensuite dans Clôtures (étape « Espèces et carte », à venir).</li>
        </ul>
      </Regles>
    </>
  );
}

function Ouverture({ ecran, ouverte }: { ecran: Ecran; ouverte: () => void }) {
  const [fond, setFond] = useState("");
  const ouvrir = useMutation({ mutationFn: (corps: unknown) => api.post(`/caisses/${ecran.caisse.id}/ouverture`, corps), onSuccess: ouverte });
  const fondCentimes = lireMontant(fond);
  const bloquant = !ecran.caisse.actif || !ecran.standActif ? "Cette caisse ou son stand est désactivé." : !ecran.evenementOuvert ? "Aucun match n'est ouvert." : null;
  const pret = !bloquant && (!ecran.caisse.especesAutorisees || fondCentimes !== null);

  return (
    <form
      className="cmd-gate"
      onSubmit={(ev) => {
        ev.preventDefault();
        if (pret) ouvrir.mutate({ fond: ecran.caisse.especesAutorisees ? fondCentimes : null });
      }}
    >
      <h3>Ouverture de caisse</h3>
      <p>
        Caisse {ecran.caisse.numero} · {ecran.caisse.standNom}
        {ecran.evenementOuvert ? <> — match : <strong>{ecran.evenementOuvert.libelle}</strong></> : null}
      </p>
      {bloquant ? (
        <div className="message message-alerte" style={{ textAlign: "left" }}>
          {bloquant}{" "}
          {!ecran.evenementOuvert && (
            <Link to="/caisses">Ouvrir le match du jour dans Caisses</Link>
          )}
        </div>
      ) : (
        ecran.caisse.especesAutorisees && (
          <>
            <label htmlFor="fond">Fond de caisse déclaré</label>
            <input id="fond" type="text" inputMode="decimal" value={fond} onChange={(e) => setFond(e.target.value)} placeholder="0,00" autoFocus />
          </>
        )
      )}
      {!ecran.caisse.especesAutorisees && !bloquant && <p style={{ marginTop: 8 }}>Caisse carte uniquement : pas de fond de caisse.</p>}
      <MessageErreur erreur={ouvrir.error} />
      <button className="cmd-encaisser" disabled={!pret || ouvrir.isPending}>
        Ouvrir la caisse
      </button>
    </form>
  );
}

function Vente({ ecran, apresCloture }: { ecran: Ecran; apresCloture: (c: Cloture) => void }) {
  const produits = ecran.produits;
  const categories = useMemo(() => {
    const vues = new Map<string, string>();
    for (const p of produits) vues.set(p.categorieId ?? SANS_CATEGORIE, p.categorie ?? "Autres");
    return [...vues];
  }, [produits]);

  const [cat, setCat] = useState<string | null>(null);
  const [panier, setPanier] = useState<{ produitId: string; quantite: number }[]>([]);
  const [remisePb, setRemisePb] = useState(0);
  const [offertSaisi, setOffertSaisi] = useState("");
  const [motif, setMotif] = useState<MotifAjustement | null>(null);
  const [motifTexte, setMotifTexte] = useState("");
  const [reference, setReference] = useState("");
  const [paiement, setPaiement] = useState<ModeReglement | null>(null);
  const [donneSaisi, setDonneSaisi] = useState("");
  const [flash, setFlash] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [idTicket, setIdTicket] = useState(() => crypto.randomUUID());
  const [confirmerCloture, setConfirmerCloture] = useState(false);

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
  const nbArticles = panier.reduce((s, l) => s + l.quantite, 0);
  const ajuste = remisePb > 0 || offert > 0;
  const erreurAj = erreurAjustement(ajustement, ecran.remiseAbonnePb);
  const donne = lireMontant(donneSaisi) ?? 0;
  const especesOk = paiement !== "especes" || donne >= ticket.total;
  const pret = nbArticles > 0 && paiement !== null && especesOk && !erreurAj;

  const encaisser = useMutation({
    mutationFn: () =>
      api.post<TicketVue>(`/caisses/${ecran.caisse.id}/ventes`, {
        id: idTicket,
        lignes: panier,
        ajustement,
        modeReglement: paiement,
        montantDonne: paiement === "especes" ? donne : null,
      }),
    onSuccess: (t) => {
      setToast(`✓ ${formaterMontant(t.totalTtc)} encaissé · ${t.numeroJustificatif}${t.rendu ? ` · rendu ${formaterMontant(t.rendu)}` : ""}`);
      setPanier([]);
      setRemisePb(0);
      setOffertSaisi("");
      setMotif(null);
      setMotifTexte("");
      setReference("");
      setPaiement(null);
      setDonneSaisi("");
      setIdTicket(crypto.randomUUID()); // le même identifiant est réutilisé tant que la vente n'est pas confirmée
    },
  });
  const cloturer = useMutation({ mutationFn: () => api.post<Cloture>(`/caisses/${ecran.caisse.id}/cloture`), onSuccess: apresCloture });

  function ajouter(id: string) {
    setPanier((p) => (p.some((l) => l.produitId === id) ? p.map((l) => (l.produitId === id ? { ...l, quantite: l.quantite + 1 } : l)) : [...p, { produitId: id, quantite: 1 }]));
    setFlash(id);
    setTimeout(() => setFlash((f) => (f === id ? null : f)), 420);
  }
  function retirer(id: string) {
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

  const montantsRapides = [...new Set([ticket.total, ...[500, 1000, 2000, 5000].filter((v) => v >= ticket.total)])].slice(0, 4);

  if (produits.length === 0) {
    return (
      <div className="carte">
        <div className="etat-vide">
          <strong>Aucun produit vendu à ce stand</strong>
          Coche ce stand sur tes produits dans <Link to="/parametres/produits">Paramètres → Produits & prix</Link>.
        </div>
        <ClotureBouton confirmer={confirmerCloture} setConfirmer={setConfirmerCloture} cloturer={cloturer} />
      </div>
    );
  }

  return (
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
        <div className="cmd-total">
          <span>Total TTC</span>
          <span className="chiffre">{formaterMontant(ticket.total)}</span>
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
              <span className="chiffre" style={{ color: !donneSaisi ? "var(--muted)" : donne < ticket.total ? "var(--red)" : "var(--green)" }}>
                {!donneSaisi ? "—" : donne < ticket.total ? `Manque ${formaterMontant(ticket.total - donne)}` : formaterMontant(donne - ticket.total)}
              </span>
            </div>
          </div>
        )}
        {paiement === "carte" && <div className="aide" style={{ marginBottom: 10 }}>Paiement carte sur le terminal — valider une fois le paiement accepté.</div>}

        <button className="cmd-encaisser" disabled={!pret || encaisser.isPending} onClick={() => encaisser.mutate()}>
          {encaisser.isPending ? "Enregistrement…" : paiement === "carte" ? "Valider le paiement" : "Encaisser"}
        </button>
        {nbArticles > 0 && erreurAj && <div className="cmd-blockmsg">{erreurAj}</div>}
        <MessageErreur erreur={encaisser.error} />

        <ClotureBouton confirmer={confirmerCloture} setConfirmer={setConfirmerCloture} cloturer={cloturer} />
      </div>
      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}

function ClotureBouton({
  confirmer,
  setConfirmer,
  cloturer,
}: {
  confirmer: boolean;
  setConfirmer: (v: boolean) => void;
  cloturer: { mutate: () => void; isPending: boolean; error: unknown };
}) {
  return (
    <div style={{ marginTop: 14 }}>
      {confirmer ? (
        <div className="message message-alerte">
          Clôturer la caisse ? Les totaux de la session seront figés.
          <div className="ligne-actions" style={{ marginTop: 8 }}>
            <button className="btn" onClick={() => cloturer.mutate()} disabled={cloturer.isPending}>
              Oui, clôturer
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
      <MessageErreur erreur={cloturer.error} />
    </div>
  );
}

function ResumeCloture({ cloture, fermer }: { cloture: Cloture; fermer: () => void }) {
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
