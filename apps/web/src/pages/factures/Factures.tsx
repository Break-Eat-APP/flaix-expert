import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FilePlus2, Paperclip } from "lucide-react";
import {
  LIBELLES_STATUT_FACTURE,
  formaterMontant,
  jourParis,
  lireMontant,
  montantPourSaisie,
  totalHtFacture,
  type EtatFactures,
  type FactureVue,
  type Produit,
  type StatutFacture,
} from "@flaix/domain";
import { api, formaterDateHeure } from "../../api.ts";
import { Carte, Chargement, EntetePage, EtatVide, MessageErreur, Regles } from "../../composants/communs.tsx";

type Filtre = "a_traiter" | "toutes" | "validee" | "payee";
const PUCE: Record<StatutFacture, string> = { recue: "", rapprochee: "puce-vert", ecart: "puce-rouge", validee: "puce-violet", payee: "puce-vert" };
const dateCourte = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`;

/**
 * Factures fournisseurs (module 12b validé ; dossier §15.115) : la facture reçue (par la plateforme
 * agréée du lieu, ou sur papier) se saisit ici et se rapproche des livraisons du Stock.
 */
export function Factures() {
  const etat = useQuery({ queryKey: ["factures"], queryFn: () => api.get<EtatFactures>("/factures"), refetchOnMount: "always" });
  const produits = useQuery({ queryKey: ["produits"], queryFn: () => api.get<Produit[]>("/produits") });
  const [filtre, setFiltre] = useState<Filtre>("a_traiter");
  const [ouverte, setOuverte] = useState<string | null>(null);
  const [nouvelle, setNouvelle] = useState(false);
  if (etat.isPending || produits.isPending) return <Chargement />;
  if (etat.error) return <MessageErreur erreur={etat.error} />;
  const e = etat.data!;
  const aujourdhui = jourParis(new Date());
  const liste = e.factures.filter((f) =>
    filtre === "toutes" ? true : filtre === "a_traiter" ? ["recue", "ecart", "rapprochee"].includes(f.statut) : f.statut === filtre,
  );
  const compte = (s: Filtre) => e.factures.filter((f) => (s === "a_traiter" ? ["recue", "ecart", "rapprochee"].includes(f.statut) : s === "toutes" || f.statut === s)).length;
  const bouton = (id: Filtre, libelle: string) => (
    <button className={`onglet${filtre === id ? " actif" : ""}`} onClick={() => setFiltre(id)}>
      {libelle} ({compte(id)})
    </button>
  );
  const enRetard = e.factures.filter((f) => f.statut === "validee" && f.echeance && f.echeance < aujourdhui);

  return (
    <>
      <EntetePage
        titre="Factures"
        description="Les factures des fournisseurs, rapprochées des livraisons du Stock."
        actions={
          !nouvelle && (
            <button className="btn" onClick={() => setNouvelle(true)}>
              <FilePlus2 size={15} /> Saisir une facture
            </button>
          )
        }
      />
      {nouvelle && (
        <FormulaireFacture
          produits={produits.data ?? []}
          fournisseurs={e.fournisseurs}
          fermer={(id) => {
            setNouvelle(false);
            if (id) setOuverte(id);
          }}
        />
      )}
      {enRetard.length > 0 && (
        <div className="message message-alerte">
          Échéance dépassée, pas encore payée : {enRetard.map((f) => `${f.fournisseur} n° ${f.numero} (${dateCourte(f.echeance!)})`).join(" · ")}.
        </div>
      )}
      <div className="onglets">
        {bouton("a_traiter", "À traiter")}
        {bouton("validee", "Validées, à payer")}
        {bouton("payee", "Payées")}
        {bouton("toutes", "Toutes")}
      </div>
      <Carte>
        {liste.length === 0 ? (
          <EtatVide titre={e.factures.length ? "Rien ici" : "Aucune facture"}>
            {e.factures.length ? undefined : "Saisis la première facture reçue d'un fournisseur ; ses lignes se rapprochent seules des livraisons du Stock."}
          </EtatVide>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {liste.map((f) => (
              <div key={f.id} className="facture">
                <button className="facture-entete" onClick={() => setOuverte(ouverte === f.id ? null : f.id)} aria-expanded={ouverte === f.id}>
                  <span style={{ minWidth: 0 }}>
                    <strong>{f.fournisseur}</strong> <span className="discret">n° {f.numero}</span>
                    <div className="discret" style={{ fontSize: 12 }}>
                      du {dateCourte(f.dateFacture)}
                      {f.echeance ? ` · échéance ${dateCourte(f.echeance)}` : ""}
                      {f.fichier ? " · pièce jointe" : ""}
                    </div>
                  </span>
                  <span className="chiffre">{formaterMontant(f.totalHt)} HT</span>
                  <span className={`puce ${PUCE[f.statut]}`}>{LIBELLES_STATUT_FACTURE[f.statut]}</span>
                </button>
                {ouverte === f.id && <DetailFacture f={f} produits={produits.data ?? []} fournisseurs={e.fournisseurs} />}
              </div>
            ))}
          </div>
        )}
      </Carte>
      <Regles>
        <ul>
          <li>
            <strong>D'où viennent les factures</strong> : depuis le 1er septembre 2026, le lieu les reçoit par sa plateforme agréée (ou sur papier pendant la transition).
            FlaiX n'est pas une plateforme agréée : on saisit ici la facture et on y joint son PDF ou sa photo.
          </li>
          <li>
            <strong>Rapprochement</strong> : chaque ligne liée à un produit se confronte à une livraison déjà saisie dans le Stock — même produit, même fournisseur, livrée
            entre 45 jours avant et 7 jours après la facture ; même quantité d'abord, puis la date la plus proche. Une livraison ne sert qu'une fois. Tu peux choisir une
            autre livraison. Les lignes sans produit (frais de livraison…) ne bloquent pas.
          </li>
          <li>
            <strong>Écart</strong> : écart de quantité = facturé − livré ; écart de prix = (prix facturé − prix de la livraison) × quantité livrée, en euros. Tolérance :
            0,50 € ou 1 % du montant livré, le plus grand des deux (recommandation à confirmer). Un écart est signalé, <strong>jamais corrigé</strong> : la facture peut
            avoir raison contre une livraison mal saisie, ou l'inverse.
          </li>
          <li>
            <strong>Valider</strong> : avec un motif s'il reste un écart ou une ligne sans livraison. Une facture validée est figée (la base refuse toute modification) ;
            le rapprochement proposé est figé avec elle. <strong>Payée</strong> : après validation, avec la date du paiement. FlaiX ne paie rien lui-même.
          </li>
        </ul>
      </Regles>
    </>
  );
}

function DetailFacture({ f, produits, fournisseurs }: { f: FactureVue; produits: Produit[]; fournisseurs: string[] }) {
  const client = useQueryClient();
  const [modifier, setModifier] = useState(false);
  const [motif, setMotif] = useState("");
  const [datePaiement, setDatePaiement] = useState(jourParis(new Date()));
  const maj = (r: EtatFactures) => client.setQueryData(["factures"], r);
  const choisir = useMutation({
    mutationFn: (x: { ligneId: string; livraisonId: string | null }) => api.put<EtatFactures>(`/factures/${f.id}/lignes/${x.ligneId}/livraison`, { livraisonId: x.livraisonId }),
    onSuccess: maj,
  });
  const valider = useMutation({ mutationFn: () => api.post<EtatFactures>(`/factures/${f.id}/validation`, { motif: motif || null }), onSuccess: maj });
  const payer = useMutation({ mutationFn: () => api.post<EtatFactures>(`/factures/${f.id}/paiement`, { datePaiement }), onSuccess: maj });
  const deposer = useMutation({
    mutationFn: async (fichier: File) => {
      const octets = new Uint8Array(await fichier.arrayBuffer());
      let binaire = "";
      for (let i = 0; i < octets.length; i += 0x8000) binaire += String.fromCharCode(...octets.subarray(i, i + 0x8000));
      return api.post<EtatFactures>(`/factures/${f.id}/fichier`, { nom: fichier.name, type: fichier.type, contenu: btoa(binaire) });
    },
    onSuccess: maj,
  });
  const figee = f.statut === "validee" || f.statut === "payee";
  const motifRequis = f.statut === "ecart" || f.statut === "recue";

  if (modifier) {
    return (
      <FormulaireFacture
        produits={produits}
        fournisseurs={fournisseurs}
        facture={f}
        fermer={() => setModifier(false)}
      />
    );
  }

  return (
    <div className="facture-detail">
      <div className="scroll-x">
        <table className="tableau">
          <thead>
            <tr>
              <th>Ligne</th>
              <th className="d">Qté</th>
              <th className="d">PU HT</th>
              <th>Livraison du Stock</th>
              <th>Écart</th>
            </tr>
          </thead>
          <tbody>
            {f.lignes.map((l) => (
              <tr key={l.id}>
                <td style={{ whiteSpace: "normal" }}>{l.libelle}</td>
                <td className="d chiffre">{l.quantite}</td>
                <td className="d chiffre">{formaterMontant(l.prixUnitaire)}</td>
                <td style={{ whiteSpace: "normal" }}>
                  {!l.produitId ? (
                    <span className="discret">sans produit</span>
                  ) : figee ? (
                    l.livraison ? (
                      `du ${dateCourte(l.livraison.date)} · ${l.livraison.quantite} à ${formaterMontant(l.livraison.prixUnitaire)}`
                    ) : (
                      <span className="discret">aucune</span>
                    )
                  ) : (
                    <select
                      value={l.livraison?.id ?? ""}
                      disabled={choisir.isPending}
                      onChange={(ev) => choisir.mutate({ ligneId: l.id, livraisonId: ev.target.value || null })}
                      aria-label={`Livraison rapprochée de la ligne ${l.libelle}`}
                    >
                      <option value="">{l.candidates.length ? "Automatique" : "Aucune livraison trouvée"}</option>
                      {l.candidates.map((c) => (
                        <option key={c.id} value={c.id}>
                          {dateCourte(c.date)} · {c.quantite} à {formaterMontant(c.prixUnitaire)}
                          {l.livraison?.id === c.id && !l.livraisonChoisie ? " (proposée)" : ""}
                        </option>
                      ))}
                    </select>
                  )}
                </td>
                <td style={{ whiteSpace: "normal" }}>
                  {!l.ecart ? (
                    <span className="discret">—</span>
                  ) : l.ecart.rapprochee ? (
                    <span className="puce puce-vert">Conforme</span>
                  ) : (
                    <span className="puce puce-rouge">
                      {[
                        l.ecart.ecartQuantite ? `${l.ecart.ecartQuantite > 0 ? "+" : ""}${l.ecart.ecartQuantite} en quantité` : null,
                        Math.abs(l.ecart.impactPrix) > l.ecart.seuil ? `${l.ecart.impactPrix > 0 ? "+" : ""}${formaterMontant(l.ecart.impactPrix)} sur le prix` : null,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <MessageErreur erreur={choisir.error} />

      <div className="actions" style={{ justifyContent: "flex-start", flexWrap: "wrap", marginTop: 10 }}>
        {f.fichier && (
          <a className="btn btn-fantome" href={`/api/factures/${f.id}/fichier`} target="_blank" rel="noreferrer">
            <Paperclip size={14} /> {f.fichier.nom}
          </a>
        )}
        {!figee && (
          <label className="btn btn-fantome" style={{ cursor: "pointer" }}>
            <Paperclip size={14} /> {f.fichier ? "Remplacer la pièce jointe" : "Joindre le PDF ou la photo"}
            <input
              type="file"
              accept="application/pdf,image/jpeg,image/png"
              style={{ display: "none" }}
              onChange={(ev) => {
                const fichier = ev.target.files?.[0];
                if (fichier) deposer.mutate(fichier);
              }}
            />
          </label>
        )}
        {!figee && (
          <button className="btn btn-fantome" onClick={() => setModifier(true)}>
            Modifier la saisie
          </button>
        )}
      </div>
      <MessageErreur erreur={deposer.error} />

      {!figee && (
        <div className="actions" style={{ justifyContent: "flex-start", flexWrap: "wrap", marginTop: 10 }}>
          {motifRequis && (
            <input
              type="text"
              value={motif}
              onChange={(ev) => setMotif(ev.target.value)}
              placeholder={f.statut === "ecart" ? "Pourquoi tu valides malgré l'écart" : "Pourquoi tu valides sans livraison rapprochée"}
              aria-label="Motif de validation"
              style={{ flex: 1, minWidth: 240 }}
            />
          )}
          <button className="btn" disabled={valider.isPending || (motifRequis && motif.trim().length < 5)} onClick={() => valider.mutate()}>
            Valider la facture
          </button>
        </div>
      )}
      <MessageErreur erreur={valider.error} />

      {f.validation && (
        <p className="discret" style={{ margin: "10px 0 0" }}>
          Validée le {formaterDateHeure(f.validation.le)} par {f.validation.par}
          {f.validation.motif ? ` — « ${f.validation.motif} »` : ""}.
        </p>
      )}
      {f.statut === "validee" && (
        <div className="actions" style={{ justifyContent: "flex-start", flexWrap: "wrap", marginTop: 10 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
            Payée le
            <input type="date" value={datePaiement} onChange={(ev) => setDatePaiement(ev.target.value)} />
          </label>
          <button className="btn" disabled={payer.isPending || !datePaiement} onClick={() => payer.mutate()}>
            Marquer payée
          </button>
        </div>
      )}
      <MessageErreur erreur={payer.error} />
      {f.paiement && (
        <p className="discret" style={{ margin: "10px 0 0" }}>
          Payée le {dateCourte(f.paiement.date)} (noté par {f.paiement.par} le {formaterDateHeure(f.paiement.le)}).
        </p>
      )}
      <p className="discret" style={{ fontSize: 12, margin: "8px 0 0" }}>
        Saisie par {f.creePar} le {formaterDateHeure(f.creeLe)}.
      </p>
    </div>
  );
}

interface LigneSaisie {
  produitId: string;
  libelle: string;
  quantite: string;
  prix: string;
}
const LIGNE_VIDE: LigneSaisie = { produitId: "", libelle: "", quantite: "", prix: "" };

function FormulaireFacture({ produits, fournisseurs, facture, fermer }: { produits: Produit[]; fournisseurs: string[]; facture?: FactureVue; fermer: (id?: string) => void }) {
  const client = useQueryClient();
  const [s, setS] = useState({
    fournisseur: facture?.fournisseur ?? "",
    numero: facture?.numero ?? "",
    dateFacture: facture?.dateFacture ?? jourParis(new Date()),
    echeance: facture?.echeance ?? "",
  });
  const [lignes, setLignes] = useState<LigneSaisie[]>(
    facture?.lignes.map((l) => ({ produitId: l.produitId ?? "", libelle: l.libelle, quantite: String(l.quantite), prix: montantPourSaisie(l.prixUnitaire) })) ?? [{ ...LIGNE_VIDE }],
  );
  const lues = lignes.map((l) => ({ produitId: l.produitId || null, libelle: l.libelle.trim(), quantite: Number(l.quantite), prixUnitaire: lireMontant(l.prix) }));
  const valides = lues.every((l) => l.libelle && Number.isInteger(l.quantite) && l.quantite > 0 && l.prixUnitaire !== null);
  const enregistrer = useMutation({
    mutationFn: () => {
      const corps = { ...s, echeance: s.echeance || null, lignes: lues };
      return facture ? api.put<EtatFactures>(`/factures/${facture.id}`, corps) : api.post<EtatFactures>("/factures", corps);
    },
    onSuccess: (r) => {
      client.setQueryData(["factures"], r);
      fermer(facture ? undefined : r.factures.find((f) => f.numero === s.numero.trim())?.id);
    },
  });
  const maj = (i: number, l: Partial<LigneSaisie>) => setLignes(lignes.map((x, k) => (k === i ? { ...x, ...l } : x)));

  return (
    <Carte titre={facture ? `Modifier la facture n° ${facture.numero}` : "Saisir une facture"}>
      <div className="grille-champs">
        <label className="champ">
          <span>Fournisseur</span>
          <input type="text" list="fournisseurs-connus" value={s.fournisseur} onChange={(ev) => setS({ ...s, fournisseur: ev.target.value })} maxLength={120} />
          <datalist id="fournisseurs-connus">
            {fournisseurs.map((f) => (
              <option key={f} value={f} />
            ))}
          </datalist>
        </label>
        <label className="champ">
          <span>N° de facture</span>
          <input type="text" value={s.numero} onChange={(ev) => setS({ ...s, numero: ev.target.value })} maxLength={60} />
        </label>
        <label className="champ">
          <span>Date de la facture</span>
          <input type="date" value={s.dateFacture} onChange={(ev) => setS({ ...s, dateFacture: ev.target.value })} />
        </label>
        <label className="champ">
          <span>Échéance (facultatif)</span>
          <input type="date" value={s.echeance} onChange={(ev) => setS({ ...s, echeance: ev.target.value })} />
        </label>
      </div>
      <div className="scroll-x" style={{ marginTop: 14 }}>
        <table className="tableau">
          <thead>
            <tr>
              <th>Produit</th>
              <th>Libellé sur la facture</th>
              <th>Quantité</th>
              <th>Prix unitaire HT (€)</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {lignes.map((l, i) => (
              <tr key={i}>
                <td>
                  <select
                    value={l.produitId}
                    onChange={(ev) => {
                      const p = produits.find((x) => x.id === ev.target.value);
                      maj(i, { produitId: ev.target.value, libelle: l.libelle || p?.nom || "" });
                    }}
                    aria-label={`Produit de la ligne ${i + 1}`}
                  >
                    <option value="">Sans produit (frais…)</option>
                    {produits.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nom}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <input type="text" value={l.libelle} onChange={(ev) => maj(i, { libelle: ev.target.value })} maxLength={160} aria-label={`Libellé de la ligne ${i + 1}`} />
                </td>
                <td>
                  <input type="text" inputMode="numeric" value={l.quantite} onChange={(ev) => maj(i, { quantite: ev.target.value.replace(/\D/g, "") })} style={{ width: 90 }} aria-label={`Quantité de la ligne ${i + 1}`} />
                </td>
                <td>
                  <input type="text" inputMode="decimal" value={l.prix} onChange={(ev) => maj(i, { prix: ev.target.value })} style={{ width: 110 }} aria-label={`Prix unitaire HT de la ligne ${i + 1}`} />
                </td>
                <td>
                  {lignes.length > 1 && (
                    <button className="btn-lien" onClick={() => setLignes(lignes.filter((_, k) => k !== i))}>
                      Retirer
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="actions" style={{ justifyContent: "space-between", flexWrap: "wrap", marginTop: 10 }}>
        <button className="btn btn-fantome" onClick={() => setLignes([...lignes, { ...LIGNE_VIDE }])}>
          Ajouter une ligne
        </button>
        <span className="chiffre">Total HT : {formaterMontant(valides ? totalHtFacture(lues as { quantite: number; prixUnitaire: number }[]) : 0)}</span>
      </div>
      <div className="actions" style={{ justifyContent: "flex-start", marginTop: 12 }}>
        <button className="btn" disabled={!valides || !s.fournisseur.trim() || !s.numero.trim() || enregistrer.isPending} onClick={() => enregistrer.mutate()}>
          Enregistrer
        </button>
        <button className="btn btn-fantome" onClick={() => fermer()}>
          Annuler
        </button>
      </div>
      <MessageErreur erreur={enregistrer.error} />
    </Carte>
  );
}
