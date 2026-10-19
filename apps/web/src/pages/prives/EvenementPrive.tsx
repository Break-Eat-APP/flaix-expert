import { useState } from "react";
import { Link, useParams } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileText, Minus, Plus, Trash2 } from "lucide-react";
import {
  MODES_REGLEMENT,
  tauxTvaProposes,
  coutPersonnel,
  formaterMontant,
  formaterPourcentage,
  libelleTauxTva,
  lireMontant,
  type EvenementPrive as Donnees,
  type ModeReglementPrive,
  type Produit,
  type TauxTvaPb,
} from "@flaix/domain";
import { api, formaterDateHeure } from "../../api.ts";
import { Carte, Chargement, EntetePage, MessageErreur } from "../../composants/communs.tsx";

/** Fiche d'un événement privé (§15.160) : jauge du budget, consommations, frais, bilan, clôture, règlement, facture. */
export function EvenementPrive() {
  const { id } = useParams();
  const q = useQuery({ queryKey: ["evenement-prive", id], queryFn: () => api.get<Donnees>(`/evenements-prives/${id}`) });
  if (q.isPending) return <Chargement />;
  if (q.error) return <MessageErreur erreur={q.error} />;
  const e = q.data!;
  const ouvert = e.etat === "prevu";
  return (
    <>
      <EntetePage
        fil="Événements privés"
        filLien="/prives"
        titre={e.nom}
        description={[formaterDateHeure(e.debut), e.salon, e.invites ? `${e.invites} invités` : null, e.client.societe ?? e.client.nom].filter(Boolean).join(" · ")}
        actions={ouvert ? <span className="puce puce-vert">prévu</span> : <span className="puce">clôturé le {formaterDateHeure(e.clotureLe!)}</span>}
      />
      <Jauge e={e} />
      <div className="prive-grille">
        <Consommations e={e} />
        <div style={{ display: "grid", gap: 16, alignContent: "start" }}>
          <Bilan e={e} />
          <Frais e={e} />
        </div>
      </div>
      {!ouvert && e.sortieStock.length > 0 && (
        <div className="message message-info">
          Sorti de la réserve centrale à la clôture : {e.sortieStock.map((s) => (s.quantite.endsWith("×") ? `${s.quantite} ${s.nom}` : `${s.quantite} de ${s.nom}`)).join(", ")}.
        </div>
      )}
      {ouvert ? <Cloture e={e} /> : <ApresCloture e={e} />}
      {(ouvert || !e.facture) && <Fiche e={e} />}
    </>
  );
}

function useMaj(id: string) {
  const client = useQueryClient();
  return (d: Donnees) => {
    client.setQueryData(["evenement-prive", id], d);
    void client.invalidateQueries({ queryKey: ["evenements-prives"] });
  };
}

function Jauge({ e }: { e: Donnees }) {
  const b = e.bilan;
  if (b.budget === null)
    return (
      <div className="carte prive-jauge">
        <span className="etiquette">Consommé</span>
        <span className="montant">{formaterMontant(b.totalTtc)}</span>
        <span className="discret">Pas de budget sur la fiche.</span>
      </div>
    );
  const pct = Math.min(b.budgetPb! / 100, 100);
  const reste = b.budget - b.totalTtc;
  return (
    <div className={`carte prive-jauge ${b.niveauBudget}`}>
      <div className="en-ligne" style={{ justifyContent: "space-between" }}>
        <div>
          <span className="etiquette">Budget consommé</span>
          <span className="montant">
            {formaterMontant(b.totalTtc)} <span className="discret">/ {formaterMontant(b.budget)}</span>
          </span>
        </div>
        <span className={`puce ${b.niveauBudget === "depasse" ? "puce-rouge" : b.niveauBudget === "attention" ? "puce-ambre" : "puce-violet"}`}>
          {formaterPourcentage(b.budgetPb!)} · {reste >= 0 ? `reste ${formaterMontant(reste)}` : `dépassé de ${formaterMontant(-reste)}`}
        </span>
      </div>
      <div className="frais-jauge" role="progressbar" aria-label="Budget consommé" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct)}>
        <i style={{ width: `${pct}%` }} />
      </div>
      {b.niveauBudget === "depasse" && <p className="note" style={{ margin: 0 }}>Budget dépassé : à voir avec le client (on continue avec son accord, ou les invités paient eux-mêmes).</p>}
    </div>
  );
}

function Consommations({ e }: { e: Donnees }) {
  const maj = useMaj(e.id);
  const ouvert = e.etat === "prevu";
  const produits = useQuery({ queryKey: ["produits"], queryFn: () => api.get<Produit[]>("/produits"), enabled: ouvert });
  const ajouter = useMutation({ mutationFn: (corps: object) => api.post<Donnees>(`/evenements-prives/${e.id}/lignes`, corps), onSuccess: maj });
  const changer = useMutation({ mutationFn: ({ ligneId, quantite }: { ligneId: string; quantite: number }) => api.patch<Donnees>(`/evenements-prives/${e.id}/lignes/${ligneId}`, { quantite }), onSuccess: maj });
  const [produitId, setProduitId] = useState("");
  const [quantite, setQuantite] = useState("1");
  const [libre, setLibre] = useState(false);
  const [libelle, setLibelle] = useState("");
  const [prix, setPrix] = useState("");
  const [tva, setTva] = useState<TauxTvaPb>(2000);
  const [cout, setCout] = useState("");
  const enVente = (produits.data ?? []).filter((p) => p.actif && p.tarifEnVigueur);
  const n = /^\d{1,5}$/.test(quantite.trim()) ? Number(quantite) : 0;
  const prixLu = lireMontant(prix);
  const coutLu = cout.trim() ? lireMontant(cout) : null;
  return (
    <Carte titre="Consommations" description={ouvert ? "Note ce que le groupe consomme ; un même produit s'ajoute à sa ligne." : "Figées à la clôture."}>
      {e.lignes.length === 0 ? (
        <p className="note" style={{ marginTop: 0 }}>Rien pour l'instant.</p>
      ) : (
        <div className="scroll-x">
          <table className="tableau">
            <tbody>
              {e.lignes.map((l) => (
                <tr key={l.id}>
                  <td>
                    <strong>{l.libelle}</strong>
                    <div className="discret" style={{ fontSize: 12 }}>
                      {formaterMontant(l.prixTtc)} TTC · TVA {libelleTauxTva(l.tauxTva)}
                    </div>
                  </td>
                  <td>
                    {ouvert ? (
                      <span className="en-ligne" style={{ gap: 4, flexWrap: "nowrap" }}>
                        <button className="btn btn-fantome" aria-label={`Un ${l.libelle} de moins`} disabled={changer.isPending} onClick={() => changer.mutate({ ligneId: l.id, quantite: l.quantite - 1 })}>
                          <Minus size={14} />
                        </button>
                        <strong className="chiffre" style={{ minWidth: 28, textAlign: "center" }}>
                          {l.quantite}
                        </strong>
                        <button className="btn btn-fantome" aria-label={`Un ${l.libelle} de plus`} disabled={changer.isPending} onClick={() => changer.mutate({ ligneId: l.id, quantite: l.quantite + 1 })}>
                          <Plus size={14} />
                        </button>
                      </span>
                    ) : (
                      <strong className="chiffre">× {l.quantite}</strong>
                    )}
                  </td>
                  <td className="d chiffre">{formaterMontant(l.quantite * l.prixTtc)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {ouvert && (
        <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
          {!libre ? (
            <div className="en-ligne">
              <select aria-label="Produit" value={produitId} onChange={(ev) => setProduitId(ev.target.value)} style={{ flex: "1 1 200px", width: "auto" }}>
                <option value="">Choisir un produit…</option>
                {enVente.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nom} — {formaterMontant(p.tarifEnVigueur!.prixTtc)}
                  </option>
                ))}
              </select>
              <input type="text" inputMode="numeric" aria-label="Quantité" value={quantite} onChange={(ev) => setQuantite(ev.target.value)} style={{ width: 70 }} />
              <button className="btn" disabled={!produitId || n < 1 || ajouter.isPending} onClick={() => ajouter.mutate({ produitId, quantite: n }, { onSuccess: () => setQuantite("1") })}>
                Ajouter
              </button>
              <button className="btn-lien" onClick={() => setLibre(true)}>
                Ligne libre
              </button>
            </div>
          ) : (
            <form
              className="grille-champs"
              style={{ alignItems: "end" }}
              onSubmit={(ev) => {
                ev.preventDefault();
                if (libelle.trim() && prixLu !== null && n >= 1 && (cout.trim() === "" || coutLu !== null))
                  ajouter.mutate({ libelle: libelle.trim(), quantite: n, prixTtc: prixLu, tauxTva: tva, coutUnitaire: coutLu }, { onSuccess: () => (setLibelle(""), setPrix(""), setCout(""), setLibre(false)) });
              }}
            >
              <label className="champ">
                <span>Libellé</span>
                <input type="text" value={libelle} onChange={(ev) => setLibelle(ev.target.value)} placeholder="Ex. : location du salon" maxLength={120} />
              </label>
              <label className="champ">
                <span>Prix TTC (€)</span>
                <input type="text" inputMode="decimal" value={prix} onChange={(ev) => setPrix(ev.target.value)} />
              </label>
              <label className="champ">
                <span>TVA</span>
                <select value={tva} onChange={(ev) => setTva(Number(ev.target.value) as TauxTvaPb)}>
                  {tauxTvaProposes(tva).map((t) => (
                    <option key={t.pb} value={t.pb}>
                      {t.libelle}
                    </option>
                  ))}
                </select>
              </label>
              <label className="champ">
                <span>Coût d'achat (facultatif)</span>
                <input type="text" inputMode="decimal" value={cout} onChange={(ev) => setCout(ev.target.value)} placeholder="service : vide" />
              </label>
              <span className="en-ligne">
                <button className="btn" disabled={!libelle.trim() || prixLu === null || ajouter.isPending}>
                  Ajouter
                </button>
                <button type="button" className="btn btn-fantome" onClick={() => setLibre(false)}>
                  Annuler
                </button>
              </span>
            </form>
          )}
          <MessageErreur erreur={ajouter.error ?? changer.error} />
        </div>
      )}
    </Carte>
  );
}

function Bilan({ e }: { e: Donnees }) {
  const b = e.bilan;
  return (
    <Carte titre="Ce qu'il te reste">
      <div className="prive-bilan">
        <span>Consommé TTC</span>
        <strong className="chiffre">{formaterMontant(b.totalTtc)}</strong>
        <span>− TVA</span>
        <span className="chiffre">{formaterMontant(b.tva)}</span>
        <span>= CA HT</span>
        <strong className="chiffre">{formaterMontant(b.caHt)}</strong>
        <span>− Marchandise (matière + emballages)</span>
        <span className="chiffre">{b.coutMarchandise === null ? "coût manquant" : formaterMontant(b.coutMarchandise)}</span>
        <span>− Frais</span>
        <span className="chiffre">{formaterMontant(b.frais)}</span>
        <span className="prive-reste">Il te reste</span>
        <strong className={`chiffre prive-reste${b.reste !== null && b.reste < 0 ? " texte-rouge" : ""}`}>{b.reste === null ? "—" : formaterMontant(b.reste)}</strong>
      </div>
      {b.produitsSansCout.length > 0 && <div className="message message-alerte">Coût manquant sur {b.produitsSansCout.join(", ")} : à saisir dans Produits & prix.</div>}
    </Carte>
  );
}

function Frais({ e }: { e: Donnees }) {
  const maj = useMaj(e.id);
  const ouvert = e.etat === "prevu";
  const ajouter = useMutation({ mutationFn: (corps: object) => api.post<Donnees>(`/evenements-prives/${e.id}/frais`, corps), onSuccess: maj });
  const retirer = useMutation({ mutationFn: (fraisId: string) => api.supprimer<Donnees>(`/evenements-prives/${e.id}/frais/${fraisId}`), onSuccess: maj });
  const [libelle, setLibelle] = useState("");
  const [montant, setMontant] = useState("");
  const [personnes, setPersonnes] = useState("");
  const [heures, setHeures] = useState("");
  const [taux, setTaux] = useState("");
  const m = lireMontant(montant);
  const p = Number(personnes), h = Number(heures.replace(",", ".")), t = lireMontant(taux);
  const personnelOk = p > 0 && h > 0 && t !== null;
  return (
    <Carte titre="Frais" description="Personnel, location, décoration… (le coût de la marchandise se calcule seul).">
      {e.frais.map((f) => (
        <div key={f.id} className="frais-ligne">
          <span>{f.libelle}</span>
          <span className="frais-actions">
            <strong className="chiffre">{formaterMontant(f.montant)}</strong>
            {ouvert && (
              <button className="btn btn-fantome" aria-label={`Retirer ${f.libelle}`} disabled={retirer.isPending} onClick={() => retirer.mutate(f.id)}>
                <Trash2 size={14} />
              </button>
            )}
          </span>
        </div>
      ))}
      {ouvert && (
        <>
          <form
            className="en-ligne"
            style={{ marginTop: 10 }}
            onSubmit={(ev) => {
              ev.preventDefault();
              if (libelle.trim() && m !== null) ajouter.mutate({ libelle: libelle.trim(), montant: m }, { onSuccess: () => (setLibelle(""), setMontant("")) });
            }}
          >
            <input type="text" aria-label="Frais" placeholder="Ex. : décoration" value={libelle} onChange={(ev) => setLibelle(ev.target.value)} style={{ flex: "1 1 150px", width: "auto" }} maxLength={120} />
            <input type="text" inputMode="decimal" aria-label="Montant du frais" placeholder="€" value={montant} onChange={(ev) => setMontant(ev.target.value)} style={{ width: 90 }} />
            <button className="btn btn-fantome" disabled={!libelle.trim() || m === null || ajouter.isPending}>
              Ajouter
            </button>
          </form>
          <div className="en-ligne" style={{ marginTop: 8 }}>
            <span className="discret">Personnel :</span>
            <input type="text" inputMode="numeric" aria-label="Personnes" placeholder="pers." value={personnes} onChange={(ev) => setPersonnes(ev.target.value)} style={{ width: 60 }} />
            <span className="discret">×</span>
            <input type="text" inputMode="decimal" aria-label="Heures" placeholder="h" value={heures} onChange={(ev) => setHeures(ev.target.value)} style={{ width: 60 }} />
            <span className="discret">×</span>
            <input type="text" inputMode="decimal" aria-label="Taux horaire chargé" placeholder="€/h" value={taux} onChange={(ev) => setTaux(ev.target.value)} style={{ width: 70 }} />
            <button
              className="btn btn-fantome"
              disabled={!personnelOk || ajouter.isPending}
              onClick={() =>
                ajouter.mutate(
                  { libelle: `Personnel (${p} × ${heures.replace(".", ",")} h)`, montant: coutPersonnel(p, Math.round(h * 60), t!) },
                  { onSuccess: () => (setPersonnes(""), setHeures(""), setTaux("")) },
                )
              }
            >
              {personnelOk ? `Ajouter ${formaterMontant(coutPersonnel(p, Math.round(h * 60), t!))}` : "Ajouter"}
            </button>
          </div>
        </>
      )}
      <MessageErreur erreur={ajouter.error ?? retirer.error} />
    </Carte>
  );
}

function Cloture({ e }: { e: Donnees }) {
  const maj = useMaj(e.id);
  const [confirmer, setConfirmer] = useState(false);
  const cloturer = useMutation({ mutationFn: () => api.post<Donnees>(`/evenements-prives/${e.id}/cloture`, {}), onSuccess: maj });
  return (
    <Carte titre="Fin de la soirée" description="La clôture fige les consommations, les frais et les coûts ; ensuite viennent le règlement et la facture.">
      {confirmer ? (
        <div className="en-ligne">
          <span>Clôturer pour {formaterMontant(e.bilan.totalTtc)} TTC ? Plus rien ne pourra changer ; les produits du catalogue sortent de la réserve centrale.</span>
          <button className="btn" disabled={cloturer.isPending} onClick={() => cloturer.mutate()}>
            Oui, clôturer
          </button>
          <button className="btn btn-fantome" onClick={() => setConfirmer(false)}>
            Annuler
          </button>
        </div>
      ) : (
        <button className="btn" disabled={e.lignes.length === 0} onClick={() => setConfirmer(true)}>
          Clôturer l'événement
        </button>
      )}
      <MessageErreur erreur={cloturer.error} />
    </Carte>
  );
}

function ApresCloture({ e }: { e: Donnees }) {
  const maj = useMaj(e.id);
  const [mode, setMode] = useState<ModeReglementPrive>(e.reglement?.mode ?? "virement");
  const [le, setLe] = useState(e.reglement?.le ?? new Date().toLocaleDateString("fr-CA", { timeZone: "Europe/Paris" }));
  const regler = useMutation({ mutationFn: (corps: object) => api.put<Donnees>(`/evenements-prives/${e.id}/reglement`, corps), onSuccess: maj });
  const facturer = useMutation({ mutationFn: () => api.post<Donnees>(`/evenements-prives/${e.id}/facture`, {}), onSuccess: maj });
  return (
    <div className="deux egal">
      <Carte titre="Règlement" description={e.reglement ? `Réglé le ${e.reglement.le.split("-").reverse().join("/")} (${MODES_REGLEMENT.find((m) => m.mode === e.reglement!.mode)!.libelle.toLowerCase()}).` : "Pas encore réglé."}>
        <div className="en-ligne">
          <select aria-label="Mode de règlement" value={mode} onChange={(ev) => setMode(ev.target.value as ModeReglementPrive)} style={{ width: "auto" }}>
            {MODES_REGLEMENT.map((m) => (
              <option key={m.mode} value={m.mode}>
                {m.libelle}
              </option>
            ))}
          </select>
          <input type="date" aria-label="Date du règlement" value={le} onChange={(ev) => setLe(ev.target.value)} style={{ width: "auto" }} />
          <button className="btn" disabled={!le || regler.isPending} onClick={() => regler.mutate({ mode, le })}>
            {e.reglement ? "Corriger" : "Noter le règlement"}
          </button>
        </div>
        <MessageErreur erreur={regler.error} />
      </Carte>
      <Carte titre="Facture" description="Si le client la demande. Numérotée, elle ne se modifie plus : note le règlement avant pour qu'elle porte « acquittée ».">
        {e.facture ? (
          <Link className="btn" to={`/prives/facture/${e.facture.id}`}>
            <FileText size={15} /> Facture {e.facture.numero}
          </Link>
        ) : (
          <button className="btn" disabled={facturer.isPending} onClick={() => facturer.mutate()}>
            <FileText size={15} /> Émettre la facture
          </button>
        )}
        <MessageErreur erreur={facturer.error} />
      </Carte>
    </div>
  );
}

function Fiche({ e }: { e: Donnees }) {
  const maj = useMaj(e.id);
  const [budget, setBudget] = useState(e.budget !== null ? String(e.budget / 100).replace(".", ",") : "");
  const [invites, setInvites] = useState(e.invites !== null ? String(e.invites) : "");
  const [salon, setSalon] = useState(e.salon ?? "");
  const [clientNom, setClientNom] = useState(e.client.nom ?? "");
  const [contact, setContact] = useState(e.client.contact ?? "");
  const [societe, setSociete] = useState(e.client.societe ?? "");
  const [adresse, setAdresse] = useState(e.client.adresse ?? "");
  const [siret, setSiret] = useState(e.client.siret ?? "");
  const [tva, setTva] = useState(e.client.tvaIntracom ?? "");
  const [notes, setNotes] = useState(e.notes ?? "");
  const enregistrer = useMutation({ mutationFn: (corps: object) => api.patch<Donnees>(`/evenements-prives/${e.id}`, corps), onSuccess: maj });
  const v = (s: string) => s.trim() || null;
  const budgetLu = budget.trim() ? lireMontant(budget) : null;
  // Clôturé : seuls le client et les notes se complètent encore (pour la facture).
  const ouvert = e.etat === "prevu";
  return (
    <Carte titre={ouvert ? "Fiche" : "Client pour la facture"} description={ouvert ? "Client, salon, budget, notes (menu prévu…)." : "Les chiffres sont figés ; le client se complète encore avant d'émettre la facture."}>
      <form
        onSubmit={(ev) => {
          ev.preventDefault();
          if (budget.trim() && budgetLu === null) return;
          enregistrer.mutate({
            ...(ouvert ? { budget: budgetLu, invites: invites.trim() ? Number(invites) : null, salon: v(salon) } : {}),
            clientNom: v(clientNom),
            clientContact: v(contact),
            societe: v(societe),
            adresse: v(adresse),
            siret: v(siret),
            tvaIntracom: v(tva),
            notes: v(notes),
          });
        }}
      >
        <div className="grille-champs">
          {(
            [
              ...(ouvert
                ? ([
                    ["Budget TTC (€)", budget, setBudget],
                    ["Invités", invites, setInvites],
                    ["Salon", salon, setSalon],
                  ] as const)
                : []),
              ["Client", clientNom, setClientNom],
              ["Contact", contact, setContact],
              ["Société", societe, setSociete],
              ["Adresse de facturation", adresse, setAdresse],
              ["SIRET du client", siret, setSiret],
              ["N° de TVA du client", tva, setTva],
            ] as const
          ).map(([libelle, valeur, changer]) => (
            <label key={libelle} className="champ">
              <span>{libelle}</span>
              <input type="text" value={valeur} onChange={(ev) => changer(ev.target.value)} />
            </label>
          ))}
        </div>
        <label className="champ" style={{ marginTop: 12 }}>
          <span>Notes</span>
          <textarea rows={3} value={notes} onChange={(ev) => setNotes(ev.target.value)} maxLength={2000} />
        </label>
        <MessageErreur erreur={enregistrer.error} />
        <div className="ligne-actions">
          <button className="btn" disabled={enregistrer.isPending}>
            Enregistrer la fiche
          </button>
        </div>
      </form>
    </Carte>
  );
}
