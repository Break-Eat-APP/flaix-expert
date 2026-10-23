import { useState } from "react";
import { Link } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PackagePlus } from "lucide-react";
import { formaterMontant, lireMontant, type EtatReserve } from "@flaix/domain";
import { api } from "../../api.ts";
import { Carte, Chargement, EtatVide, MessageErreur } from "../../composants/communs.tsx";

const aujourdhui = () => new Date().toLocaleDateString("fr-CA", { timeZone: "Europe/Paris" });

/**
 * Achats › Livraisons (§15.172) : une livraison de fournisseur entre en réserve centrale et recalcule le coût matière
 * (coût moyen pondéré) ; dessous, les dernières livraisons. Les ingrédients suivis se livrent dans Ingrédients.
 */
export function Livraisons() {
  const client = useQueryClient();
  const r = useQuery({ queryKey: ["reserve"], queryFn: () => api.get<EtatReserve>("/stock/reserve") });
  const [livraison, setLivraison] = useState({ produitId: "", quantite: "", prix: "", fournisseur: "", date: aujourdhui() });
  const livrer = useMutation({
    mutationFn: () =>
      api.post<EtatReserve>("/stock/livraisons", {
        produitId: livraison.produitId,
        quantite: Number.parseInt(livraison.quantite, 10),
        prixUnitaire: lireMontant(livraison.prix),
        fournisseur: livraison.fournisseur.trim() || null,
        dateLivraison: livraison.date,
      }),
    onSuccess: (e) => {
      client.setQueryData(["reserve"], e);
      for (const cle of ["stock", "produits", "factures", "fournisseurs"]) void client.invalidateQueries({ queryKey: [cle] });
      setLivraison({ produitId: "", quantite: "", prix: "", fournisseur: "", date: livraison.date });
    },
  });
  if (r.isPending) return <Chargement />;
  if (r.error) return <MessageErreur erreur={r.error} />;
  const e = r.data!;
  if (e.produits.length === 0)
    return (
      <Carte>
        <EtatVide titre="Aucun produit">
          Crée d'abord le catalogue dans <Link to="/parametres/produits">Paramètres → Produits & prix</Link>.
        </EtatVide>
      </Carte>
    );
  const quantiteLivree = Number.parseInt(livraison.quantite, 10);
  const prixLivre = lireMontant(livraison.prix);
  const livraisonPrete = livraison.produitId && Number.isFinite(quantiteLivree) && quantiteLivree > 0 && prixLivre !== null && livraison.date;
  const livraisons = e.mouvements.filter((m) => m.type === "livraison").slice(0, 30);
  return (
    <>
      <Carte titre="Livraison fournisseur" description="Elle entre en réserve et recalcule le coût matière du produit (coût moyen pondéré).">
        <form
          className="nouvelle-affectation"
          style={{ marginTop: 0, paddingTop: 0, borderTop: 0 }}
          onSubmit={(ev) => {
            ev.preventDefault();
            if (livraisonPrete) livrer.mutate();
          }}
        >
          <label className="champ">
            <span>Produit</span>
            <select value={livraison.produitId} onChange={(ev) => setLivraison({ ...livraison, produitId: ev.target.value })} required>
              <option value="">Choisir…</option>
              {e.produits.map((p) => (
                <option key={p.produitId} value={p.produitId}>
                  {p.nom}
                </option>
              ))}
            </select>
          </label>
          <label className="champ">
            <span>Quantité livrée</span>
            <input type="text" inputMode="numeric" value={livraison.quantite} onChange={(ev) => setLivraison({ ...livraison, quantite: ev.target.value.replace(/\D/g, "").slice(0, 6) })} required />
          </label>
          <label className="champ">
            <span>Prix d'achat unitaire HT (€)</span>
            <input type="text" inputMode="decimal" value={livraison.prix} onChange={(ev) => setLivraison({ ...livraison, prix: ev.target.value })} placeholder="ex. 1,95" aria-invalid={livraison.prix.trim() !== "" && prixLivre === null} required />
          </label>
          <label className="champ">
            <span>Fournisseur</span>
            <input type="text" value={livraison.fournisseur} onChange={(ev) => setLivraison({ ...livraison, fournisseur: ev.target.value })} maxLength={120} />
          </label>
          <label className="champ">
            <span>Date</span>
            <input type="date" value={livraison.date} onChange={(ev) => setLivraison({ ...livraison, date: ev.target.value })} required />
          </label>
          <button className="btn" disabled={!livraisonPrete || livrer.isPending}>
            <PackagePlus size={15} /> Enregistrer la livraison
          </button>
        </form>
        <MessageErreur erreur={livrer.error} />
      </Carte>

      <Carte titre="Dernières livraisons" description="Chaque livraison entre en réserve centrale. Ingrédients suivis (fûts, matières) : page Ingrédients.">
        {livraisons.length === 0 ? (
          <EtatVide titre="Aucune livraison pour l'instant" />
        ) : (
          <div className="scroll-x">
            <table className="tableau">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Produit</th>
                  <th>Fournisseur</th>
                  <th className="d">Quantité</th>
                  <th className="d">Prix unitaire HT</th>
                </tr>
              </thead>
              <tbody>
                {livraisons.map((m) => (
                  <tr key={m.id}>
                    <td>{m.dateLivraison?.split("-").reverse().join("/")}</td>
                    <td>{m.produit}</td>
                    <td>{m.fournisseur ?? "—"}</td>
                    <td className="d chiffre">{m.quantite}</td>
                    <td className="d chiffre">{m.prixUnitaire === null ? "—" : formaterMontant(m.prixUnitaire)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Carte>
    </>
  );
}
