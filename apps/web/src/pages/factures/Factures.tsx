import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, FilePlus2, FileSpreadsheet, Paperclip } from "lucide-react";
import {
  cleArticle,
  colisDevine,
  correspondanceExacte,
  lireFactureExport,
  lireFacturePdf,
  normaliserFournisseur,
  proposerPourArticle,
  type CorrespondanceArticle,
  type LigneFactureLue,
  LIBELLES_STATUT_FACTURE,
  formaterMontant,
  jourParis,
  lireMontant,
  montantPourSaisie,
  totalHtFacture,
  type EtatFactures,
  type FactureVue,
  type Ingredient,
  type Produit,
  type StatutFacture,
} from "@flaix/domain";
import { api, formaterDateHeure } from "../../api.ts";
import { Carte, Chargement, EntetePage, EtatVide, MessageErreur, Regles } from "../../composants/communs.tsx";
import { lireFichierVentes } from "../caisses-connectees/fichiers.ts";
import { textePdf } from "./pdf-texte.ts";
import { ChoixArticle, UNITE_ACHAT, lireChoix, milliVersQuantiteAchat, quantiteAchatVersMilli, tableau, valeurChoix } from "./article.tsx";
import { useOptions } from "../../session.tsx";

type Filtre = "a_traiter" | "toutes" | "validee" | "payee";
const PUCE: Record<StatutFacture, string> = { recue: "", rapprochee: "puce-vert", ecart: "puce-rouge", validee: "puce-violet", payee: "puce-vert" };
const dateCourte = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`;

/**
 * Factures fournisseurs (module 12b validé ; dossier §15.115) : la facture reçue (par la plateforme
 * agréée du lieu, ou sur papier) se saisit ici et se rapproche des livraisons du Stock.
 */
export function Factures({ integre = false }: { integre?: boolean }) {
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
      {integre && <ExportComptable />}
      {integre ? (
        !nouvelle && (
          <div className="actions" style={{ justifyContent: "flex-end", marginBottom: 12 }}>
            <button className="btn" onClick={() => setNouvelle(true)}>
              <FilePlus2 size={15} /> Saisir une facture
            </button>
          </div>
        )
      ) : (
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
      )}
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
            0,50 € ou 1 % du montant livré, le plus grand des deux (validée le 1er octobre 2026). Un écart est signalé, <strong>jamais corrigé</strong> : la facture peut
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

/** Mois précédent, du premier au dernier jour (AAAA-MM-JJ). */
function moisPrecedent(): { du: string; au: string } {
  const j = new Date();
  const debut = new Date(j.getFullYear(), j.getMonth() - 1, 1);
  const fin = new Date(j.getFullYear(), j.getMonth(), 0);
  const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return { du: iso(debut), au: iso(fin) };
}

/**
 * Export pour le comptable (§15.172) : un zip de la période — PDF et photos des factures fournisseurs, factures des
 * événements privés en PDF, récapitulatif à ouvrir dans Excel (statut, payée ou non).
 */
function ExportComptable() {
  const [p, setP] = useState(moisPrecedent);
  const ok = p.du && p.au && p.du <= p.au;
  return (
    <Carte titre="Pour le comptable" description="Toutes les factures d'une période dans un seul fichier : les pièces des fournisseurs, les factures des événements privés en PDF, et un récapitulatif à ouvrir dans Excel (payée ou à payer).">
      <div className="en-ligne" style={{ flexWrap: "wrap", gap: 10 }}>
        <label className="champ" style={{ maxWidth: 170 }}>
          <span>Du</span>
          <input type="date" value={p.du} onChange={(e) => setP({ ...p, du: e.target.value })} />
        </label>
        <label className="champ" style={{ maxWidth: 170 }}>
          <span>Au</span>
          <input type="date" value={p.au} onChange={(e) => setP({ ...p, au: e.target.value })} />
        </label>
        <a className={`btn${ok ? "" : " desactive"}`} aria-disabled={!ok} href={ok ? `/api/factures/export?du=${p.du}&au=${p.au}` : undefined} download style={{ alignSelf: "flex-end" }}>
          <Download size={15} /> Télécharger les factures
        </a>
      </div>
    </Carte>
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
  // Produits qui entreraient en réserve : ni déjà rapprochés, ni fabriqués (recette) ; seulement avec l'option Stock.
  const stockActif = useOptions().stock !== false;
  const sansLivraison = stockActif ? f.lignes.filter((l) => l.produitId && !l.livraison && !l.produitFabrique).length : 0;
  // Ingrédients achetés (§15.179) : leur prix (et leur stock s'ils sont suivis) à la validation.
  const ingredientsAchetes = f.lignes.filter((l) => l.ingredientId).length;
  const aEntrer = sansLivraison + ingredientsAchetes;
  const ingredients = useQuery({ queryKey: ["ingredients"], queryFn: () => api.get<Ingredient[]>("/ingredients") });
  const [entrer, setEntrer] = useState(true);
  const [verifie, setVerifie] = useState(false);
  const valider = useMutation({
    mutationFn: () => api.post<EtatFactures>(`/factures/${f.id}/validation`, { motif: motif || null, entrerEnReserve: entrer && aEntrer > 0, alertesVerifiees: verifie }),
    onSuccess: (r) => {
      maj(r);
      for (const cle of ["reserve", "stock", "produits", "fournisseurs", "ingredients"]) void client.invalidateQueries({ queryKey: [cle] });
    },
  });
  const payer = useMutation({ mutationFn: () => api.post<EtatFactures>(`/factures/${f.id}/paiement`, { datePaiement }), onSuccess: maj });
  const deposer = useMutation({
    mutationFn: async (fichier: File) => api.post<EtatFactures>(`/factures/${f.id}/fichier`, await pieceJointe(fichier)),
    onSuccess: maj,
  });
  const figee = f.statut === "validee" || f.statut === "payee";
  // Entrée en réserve cochée : les produits sans livraison en auront une ; reste un motif seulement en cas d'écart.
  const motifRequis = f.statut === "ecart" || (f.statut === "recue" && !(entrer && sansLivraison > 0));

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
                <td className="d chiffre">
                  {l.quantite}
                  {l.unitesParColis > 1 && <div className="discret" style={{ fontSize: 11.5 }}>× {l.unitesParColis} = {l.quantite * l.unitesParColis} unités</div>}
                </td>
                <td className="d chiffre">{formaterMontant(l.prixUnitaire)}</td>
                <td style={{ whiteSpace: "normal" }}>
                  {l.ingredientId ? (
                    <span className="discret">
                      ingrédient : {tableau<Ingredient>(ingredients.data).find((g) => g.id === l.ingredientId)?.nom ?? "…"}
                      {l.ingredientMilliParUnite && ` · ${milliVersQuantiteAchat(l.ingredientMilliParUnite)} ${UNITE_ACHAT[tableau<Ingredient>(ingredients.data).find((g) => g.id === l.ingredientId)?.unite ?? "piece"]} par unité facturée`}
                    </span>
                  ) : !l.produitId ? (
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

      {!figee && f.alertes.length > 0 && (
        <div className="message message-alerte" style={{ marginTop: 10 }}>
          <strong>
            {f.alertes.length} point{f.alertes.length > 1 ? "s" : ""} à vérifier avant de valider
          </strong>
          <ul style={{ margin: "6px 0 8px", paddingLeft: 18 }}>
            {f.alertes.map((a, i) => (
              <li key={i}>
                <strong>{a.titre}</strong> — {a.detail}
              </li>
            ))}
          </ul>
          <label className="case">
            <input type="checkbox" checked={verifie} onChange={(ev) => setVerifie(ev.target.checked)} />
            <span>J'ai vérifié : la facture est juste, je peux la valider (sinon : « Modifier la saisie »)</span>
          </label>
        </div>
      )}
      {!figee && aEntrer > 0 && (
        <label className="case" style={{ marginTop: 10 }}>
          <input type="checkbox" checked={entrer} onChange={(ev) => setEntrer(ev.target.checked)} />
          <span>
            {sansLivraison > 0 && `Faire entrer en réserve centrale ${sansLivraison} produit${sansLivraison > 1 ? "s" : ""} sans livraison saisie (quantité, prix et date de la facture)`}
            {sansLivraison > 0 && ingredientsAchetes > 0 && " ; "}
            {ingredientsAchetes > 0 &&
              `${sansLivraison > 0 ? "m" : "M"}ettre à jour ${ingredientsAchetes} ingrédient${ingredientsAchetes > 1 ? "s" : ""} : prix (donc coût des recettes et marge) et réserve s'il est suivi`}
          </span>
        </label>
      )}
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
          <button className="btn" disabled={valider.isPending || (motifRequis && motif.trim().length < 5) || (f.alertes.length > 0 && !verifie)} onClick={() => valider.mutate()}>
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

/** Pièce jointe d'une facture, telle que l'attend le serveur (contenu en base 64). */
async function pieceJointe(fichier: File) {
  const octets = new Uint8Array(await fichier.arrayBuffer());
  let binaire = "";
  for (let i = 0; i < octets.length; i += 0x8000) binaire += String.fromCharCode(...octets.subarray(i, i + 0x8000));
  return { nom: fichier.name, type: fichier.type || "application/pdf", contenu: btoa(binaire) };
}

const estPdf = (f: File) => f.type === "application/pdf" || /\.pdf$/i.test(f.name);

interface LigneSaisie {
  /** Produit ou ingrédient de la ligne (§15.179) : « p:<id> », « i:<id> », vide. */
  choix: string;
  libelle: string;
  quantite: string;
  prix: string;
  /** Unités vendues par unité facturée (§15.173), pour un produit. */
  colis: string;
  /** Quantité d'ingrédient dans une unité facturée, dans son unité d'achat (« 32 » pièces, « 4,8 » kg). */
  qteIngredient: string;
  code: string;
  /** D'où vient le lien d'une ligne importée : correspondance apprise ou même nom (sûrs). */
  origine?: "appris" | "exact";
  /** Lien seulement ressemblant : proposé, jamais choisi d'office (Rémi, 2026-11-12). */
  proposition?: { valeur: string; nom: string };
  /** Colis deviné dans le libellé (« x24 ») : proposé, jamais rempli d'office. */
  colisPropose?: number;
  /** Colis lu dans le fichier (colonne PCB, « Col/Pack ») : un fait, pas une supposition. */
  colisLu?: number;
}
const LIGNE_VIDE: LigneSaisie = { choix: "", libelle: "", quantite: "", prix: "", colis: "1", qteIngredient: "", code: "" };

/**
 * Quantité d'ingrédient à proposer pour une unité facturée : pièces = colis lu dans le fichier ou deviné (« 32x160g ») ;
 * kg ou L = poids ou volume écrit dans le libellé (« (4,8 kg) », « 30 L »). Une proposition, jamais un remplissage.
 */
function quantitePropose(l: LigneSaisie, g: Ingredient | undefined): string | null {
  if (!g) return null;
  if (g.unite === "piece") {
    const n = l.colisLu ?? colisDevine(l.libelle);
    return n && n > 1 ? String(n) : null;
  }
  const m = new RegExp(String.raw`(\d+(?:[.,]\d+)?)\s*${g.unite === "kg" ? "kg" : "l"}\b`, "i").exec(l.libelle);
  return m ? m[1]!.replace(".", ",") : null;
}

function FormulaireFacture({ produits, fournisseurs, facture, fermer }: { produits: Produit[]; fournisseurs: string[]; facture?: FactureVue; fermer: (id?: string) => void }) {
  const client = useQueryClient();
  const ingredientsQ = useQuery({ queryKey: ["ingredients"], queryFn: () => api.get<Ingredient[]>("/ingredients") });
  const ingredients = tableau<Ingredient>(ingredientsQ.data).filter((g) => g.actif);
  const [s, setS] = useState({
    fournisseur: facture?.fournisseur ?? "",
    numero: facture?.numero ?? "",
    dateFacture: facture?.dateFacture ?? jourParis(new Date()),
    echeance: facture?.echeance ?? "",
    totalAnnonce: facture?.totalAnnonce != null ? montantPourSaisie(facture.totalAnnonce) : "",
  });
  const correspondances = useQuery({ queryKey: ["correspondances-fournisseurs"], queryFn: () => api.get<CorrespondanceArticle[]>("/factures/correspondances") });
  const [import_, setImport] = useState<{ message: string; erreurs: string[] } | null>(null);
  const [erreurImport, setErreurImport] = useState<unknown>(null);
  /** Facture PDF lue : jointe à la facture à l'enregistrement, sans avoir à la redéposer. */
  const [pdfLu, setPdfLu] = useState<File | null>(null);
  const [lignes, setLignes] = useState<LigneSaisie[]>(
    facture?.lignes.map((l) => ({
      choix: valeurChoix(l.produitId, l.ingredientId),
      libelle: l.libelle,
      quantite: String(l.quantite),
      prix: montantPourSaisie(l.prixUnitaire),
      colis: String(l.unitesParColis),
      qteIngredient: l.ingredientMilliParUnite ? milliVersQuantiteAchat(l.ingredientMilliParUnite) : "",
      code: l.codeArticle ?? "",
    })) ?? [{ ...LIGNE_VIDE }],
  );
  const lues = lignes.map((l) => {
    const { produitId, ingredientId } = lireChoix(l.choix);
    return {
      produitId,
      ingredientId,
      ingredientMilliParUnite: ingredientId ? quantiteAchatVersMilli(l.qteIngredient) : null,
      libelle: l.libelle.trim(),
      quantite: Number(l.quantite),
      prixUnitaire: lireMontant(l.prix),
      unitesParColis: ingredientId ? 1 : Number(l.colis || "1"),
      codeArticle: l.code.trim() || null,
    };
  });
  const valides = lues.every(
    (l) =>
      l.libelle &&
      Number.isInteger(l.quantite) &&
      l.quantite > 0 &&
      l.prixUnitaire !== null &&
      Number.isInteger(l.unitesParColis) &&
      l.unitesParColis >= 1 &&
      (!l.ingredientId || l.ingredientMilliParUnite !== null),
  );
  const totalAnnonce = s.totalAnnonce.trim() ? lireMontant(s.totalAnnonce) : null;
  const totalLignes = valides ? totalHtFacture(lues as { quantite: number; prixUnitaire: number }[]) : 0;

  /**
   * Lignes lues dans un fichier (§15.173, §15.179). Seul ce qui est sûr est rempli : la correspondance déjà validée pour
   * ce fournisseur, le produit ou l'ingrédient du même nom, le colis écrit dans le fichier. Ce qui n'est que ressemblant
   * (nom proche, colis deviné dans le libellé) est proposé, à accepter d'un clic : jamais choisi d'office (Rémi,
   * 2026-11-12 : « quand il ne sait pas, il doit proposer »).
   */
  const remplir = (lues: readonly LigneFactureLue[], fournisseur: string) => {
    const four = normaliserFournisseur(fournisseur);
    const appris = new Map((correspondances.data ?? []).filter((c) => c.fournisseur === four).map((c) => [c.cle, c]));
    const nouvelles: LigneSaisie[] = lues.map((l) => {
      const base: LigneSaisie = {
        ...LIGNE_VIDE,
        libelle: l.libelle,
        quantite: String(l.quantite),
        prix: montantPourSaisie(l.prixUnitaire),
        code: l.codeArticle ?? "",
        colis: String(l.unitesParColis ?? 1),
        colisLu: l.unitesParColis ?? undefined,
      };
      const c = appris.get(cleArticle(l.codeArticle, l.libelle));
      if (c && (c.produitId || c.ingredientId)) {
        return {
          ...base,
          choix: valeurChoix(c.produitId, c.ingredientId),
          colis: String(c.unitesParColis),
          qteIngredient: c.ingredientMilliParUnite ? milliVersQuantiteAchat(c.ingredientMilliParUnite) : "",
          origine: "appris",
        };
      }
      // Seul le colis a été retenu pour cet article : il reprend, le produit reste à proposer.
      if (c) Object.assign(base, { colis: String(c.unitesParColis), colisLu: c.unitesParColis });
      const devine = base.colisLu ? undefined : (colisDevine(l.libelle) ?? undefined);
      const exactP = correspondanceExacte(l.libelle, produits);
      if (exactP) return { ...base, choix: `p:${exactP.id}`, origine: "exact", colisPropose: devine };
      const exactI = correspondanceExacte(l.libelle, ingredients);
      if (exactI) return { ...base, choix: `i:${exactI.id}`, origine: "exact" };
      const procheP = proposerPourArticle(l.libelle, produits);
      const procheI = proposerPourArticle(l.libelle, ingredients);
      const proche = procheI && (!procheP || procheI.score > procheP.score) ? { valeur: `i:${procheI.id}`, nom: procheI.nom } : procheP ? { valeur: `p:${procheP.id}`, nom: procheP.nom } : undefined;
      return { ...base, proposition: proche, colisPropose: devine };
    });
    if (!nouvelles.length) throw new Error("Aucune ligne d'article lue dans ce fichier.");
    setLignes(nouvelles);
    const reliees = nouvelles.filter((l) => l.choix).length;
    const proposees = nouvelles.filter((l) => !l.choix && l.proposition).length;
    return `${nouvelles.length} ligne${nouvelles.length > 1 ? "s" : ""} lue${nouvelles.length > 1 ? "s" : ""}, ${reliees} reliée${reliees > 1 ? "s" : ""} (déjà connue${reliees > 1 ? "s" : ""} ou même nom)${proposees ? `, ${proposees} proposition${proposees > 1 ? "s" : ""} à accepter ou non` : ""}${four ? "" : " (saisis le fournisseur avant l'import pour reprendre ses correspondances)"}`;
  };

  /**
   * Facture PDF fabriquée par le logiciel du fournisseur (§15.178) : fournisseur, n°, date, total HT et lignes lus dans le
   * texte du PDF ; le PDF sera joint à la facture. Un PDF scanné ou d'une mise en page inconnue n'est pas deviné.
   */
  const importerPdf = async (fichier: File) => {
    const morceaux = await textePdf(fichier);
    if (!morceaux.length) throw new Error("Ce PDF ne contient pas de texte (facture scannée ou photographiée) : saisis les lignes à la main, ou utilise l'export Excel du fournisseur.");
    const f = lireFacturePdf(morceaux);
    if (f?.refus) throw new Error(f.refus);
    if (!f) throw new Error("La mise en page de ce fournisseur n'est pas encore reconnue (reconnues : Relais d'Or, Montaner Pietrini). Utilise l'export Excel du fournisseur, ou saisis les lignes à la main.");
    // Un fournisseur déjà connu sous un nom voisin garde son nom : ses correspondances s'appliquent.
    const fournisseur = fournisseurs.find((x) => normaliserFournisseur(x) === normaliserFournisseur(f.fournisseur)) ?? f.fournisseur;
    setS({
      ...s,
      fournisseur,
      numero: f.numero ?? s.numero,
      dateFacture: f.date ?? s.dateFacture,
      totalAnnonce: f.totalHt !== null ? montantPourSaisie(f.totalHt) : s.totalAnnonce,
    });
    const lu = remplir(f.lignes, fournisseur);
    setPdfLu(fichier);
    setImport({
      message: `Facture n° ${f.numero ?? "?"} de ${fournisseur} : ${lu}. Le PDF sera joint à la facture. Accepte ou non les propositions, vérifie les colis, puis enregistre.`,
      erreurs: f.remarques,
    });
  };

  /** Remplir depuis l'export Excel ou CSV de la facture (§15.173), ou depuis la facture PDF (§15.178). */
  const importer = async (fichier: File) => {
    setErreurImport(null);
    try {
      if (estPdf(fichier)) return await importerPdf(fichier);
      const lu = lireFactureExport((await lireFichierVentes(fichier)).contenu);
      if (lu.manquants.length) throw new Error(`Colonnes introuvables dans le fichier : ${lu.manquants.join(", ")}.`);
      setImport({
        message: `${remplir(lu.lignes, s.fournisseur)}. Accepte ou non les propositions, vérifie les colis, puis enregistre.`,
        erreurs: lu.erreurs.map((e) => `Ligne ${e.ligne} : ${e.message}`),
      });
    } catch (e) {
      setErreurImport(e);
      setImport(null);
    }
  };
  const enregistrer = useMutation({
    mutationFn: async () => {
      const corps = { ...s, echeance: s.echeance || null, totalAnnonce, lignes: lues.map(({ unitesParColis, ...l }) => ({ ...l, unitesParColis: unitesParColis || 1 })) };
      const r = facture ? await api.put<EtatFactures>(`/factures/${facture.id}`, corps) : await api.post<EtatFactures>("/factures", corps);
      const id = facture?.id ?? r.factures.find((x) => x.numero === s.numero.trim())?.id;
      return pdfLu && id ? api.post<EtatFactures>(`/factures/${id}/fichier`, await pieceJointe(pdfLu)) : r;
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
        <label className="champ">
          <span>Total HT écrit sur la facture (facultatif)</span>
          <input type="text" inputMode="decimal" value={s.totalAnnonce} onChange={(ev) => setS({ ...s, totalAnnonce: ev.target.value })} placeholder="contrôle des lignes" />
        </label>
      </div>
      <div className="import-facture">
        <label className="btn btn-fantome" style={{ cursor: "pointer" }}>
          <FileSpreadsheet size={15} /> Remplir depuis la facture (PDF, Excel ou CSV)
          <input
            type="file"
            accept=".pdf,application/pdf,.xlsx,.xls,.xlsm,.csv,.txt"
            style={{ display: "none" }}
            onChange={(ev) => {
              const fichier = ev.target.files?.[0];
              if (fichier) void importer(fichier);
              ev.target.value = "";
            }}
          />
        </label>
        <span className="discret">La facture PDF du fournisseur (Relais d'Or, Montaner Pietrini) ou son export Excel : les lignes se remplissent, avec les produits et colis déjà connus.</span>
      </div>
      {import_ && (
        <div className="message message-info">
          {import_.message}
          {import_.erreurs.length > 0 && (
            <ul style={{ margin: "6px 0 0", paddingLeft: 18 }}>
              {import_.erreurs.slice(0, 8).map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          )}
        </div>
      )}
      <MessageErreur erreur={erreurImport} />
      <div className="scroll-x" style={{ marginTop: 14 }}>
        <table className="tableau">
          <thead>
            <tr>
              <th>Produit ou ingrédient</th>
              <th>Libellé sur la facture</th>
              <th>Quantité</th>
              <th title="Produit : unités vendues dans une unité facturée (24 pour un colis de 24 canettes). Ingrédient : sa quantité dans une unité facturée (32 pièces, 4,8 kg).">
                Colis ou contenu
              </th>
              <th>Prix unitaire HT (€)</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {lignes.map((l, i) => (
              <tr key={i}>
                <td>
                  <ChoixArticle
                    valeur={l.choix}
                    produits={produits}
                    ingredients={ingredients}
                    libelle={`Produit ou ingrédient de la ligne ${i + 1}`}
                    onChange={(choix) => {
                      const { produitId } = lireChoix(choix);
                      maj(i, { choix, libelle: l.libelle || produits.find((x) => x.id === produitId)?.nom || "", origine: undefined, proposition: undefined });
                    }}
                  />
                  {l.origine && l.choix && <div className={`origine-ligne origine-${l.origine}`}>{l.origine === "appris" ? "déjà relié pour ce fournisseur" : "même nom"}</div>}
                  {!l.choix && l.proposition && (
                    <div className="origine-ligne origine-suggere">
                      Proposé : {l.proposition.nom} ?{" "}
                      <button className="btn-lien" onClick={() => maj(i, { choix: l.proposition!.valeur, proposition: undefined })}>
                        Choisir
                      </button>
                    </div>
                  )}
                </td>
                <td>
                  <input type="text" value={l.libelle} onChange={(ev) => maj(i, { libelle: ev.target.value })} maxLength={160} aria-label={`Libellé de la ligne ${i + 1}`} />
                </td>
                <td>
                  <input type="text" inputMode="numeric" value={l.quantite} onChange={(ev) => maj(i, { quantite: ev.target.value.replace(/\D/g, "") })} style={{ width: 90 }} aria-label={`Quantité de la ligne ${i + 1}`} />
                </td>
                <td>
                  {(() => {
                    const g = ingredients.find((x) => x.id === lireChoix(l.choix).ingredientId);
                    if (g) {
                      const propose = l.qteIngredient ? null : quantitePropose(l, g);
                      return (
                        <>
                          <input
                            type="text"
                            inputMode="decimal"
                            value={l.qteIngredient}
                            onChange={(ev) => maj(i, { qteIngredient: ev.target.value.replace(/[^\d.,]/g, "").slice(0, 9) })}
                            style={{ width: 70 }}
                            placeholder="?"
                            aria-label={`Quantité d'ingrédient par unité facturée, ligne ${i + 1}`}
                          />{" "}
                          <span className="discret">{UNITE_ACHAT[g.unite]}</span>
                          {propose && (
                            <div className="origine-ligne origine-suggere">
                              {propose} {UNITE_ACHAT[g.unite]} ?{" "}
                              <button className="btn-lien" onClick={() => maj(i, { qteIngredient: propose })}>
                                Choisir
                              </button>
                            </div>
                          )}
                          {!l.qteIngredient && !propose && <div className="discret" style={{ fontSize: 11.5 }}>contenu d'une unité facturée</div>}
                        </>
                      );
                    }
                    return (
                      <>
                        <input type="text" inputMode="numeric" value={l.colis} onChange={(ev) => maj(i, { colis: ev.target.value.replace(/\D/g, "").slice(0, 5), colisPropose: undefined })} style={{ width: 70 }} aria-label={`Unités par colis de la ligne ${i + 1}`} />
                        {Number(l.colis) > 1 && Number(l.quantite) > 0 && <div className="discret" style={{ fontSize: 11.5 }}>= {Number(l.quantite) * Number(l.colis)} unités</div>}
                        {l.colisPropose && l.colisPropose > 1 && Number(l.colis) <= 1 && (
                          <div className="origine-ligne origine-suggere">
                            Colis de {l.colisPropose} ?{" "}
                            <button className="btn-lien" onClick={() => maj(i, { colis: String(l.colisPropose), colisPropose: undefined })}>
                              Choisir
                            </button>
                          </div>
                        )}
                      </>
                    );
                  })()}
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
        <span style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button className="btn btn-fantome" onClick={() => setLignes([...lignes, { ...LIGNE_VIDE }])}>
            Ajouter une ligne
          </button>
          {lignes.some((l) => !l.choix && l.proposition) && (
            <button
              className="btn btn-fantome"
              onClick={() => setLignes(lignes.map((l) => (!l.choix && l.proposition ? { ...l, choix: l.proposition.valeur, proposition: undefined } : l)))}
            >
              Accepter les {lignes.filter((l) => !l.choix && l.proposition).length} propositions
            </button>
          )}
        </span>
        <span className="chiffre">
          Total HT : {formaterMontant(totalLignes)}
          {totalAnnonce !== null && valides && Math.abs(totalAnnonce - totalLignes) > 2 && (
            <strong style={{ color: "var(--red)", marginLeft: 8 }}>≠ {formaterMontant(totalAnnonce)} écrit sur la facture</strong>
          )}
        </span>
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
