import { useMutation } from "@tanstack/react-query";
import { Printer } from "lucide-react";
import { ALLERGENES, type Allergene, type Produit } from "@flaix/domain";
import { api } from "../../api.ts";
import { Carte, MessageErreur } from "../../composants/communs.tsx";

/** Allergènes d'un produit (§15.157) : chaque case s'enregistre aussitôt. */
export function AllergenesProduit({ produit, majProduits }: { produit: Produit; majProduits: (l: Produit[]) => void }) {
  const enregistrer = useMutation({ mutationFn: (allergenes: Allergene[]) => api.put<Produit[]>(`/produits/${produit.id}/allergenes`, { allergenes }), onSuccess: majProduits });
  return (
    <>
      <div className="allergenes">
        {ALLERGENES.map((a) => (
          <label key={a.code} className="case" title={a.detail || undefined}>
            <input
              type="checkbox"
              checked={produit.allergenes.includes(a.code)}
              disabled={enregistrer.isPending}
              onChange={(ev) => enregistrer.mutate(ev.target.checked ? [...produit.allergenes, a.code] : produit.allergenes.filter((x) => x !== a.code))}
            />
            {a.libelle}
          </label>
        ))}
      </div>
      <MessageErreur erreur={enregistrer.error} />
    </>
  );
}

/** Tableau des allergènes des produits en vente, à imprimer et afficher à la buvette. */
export function TableauAllergenes({ produits }: { produits: Produit[] }) {
  const enVente = produits.filter((p) => p.actif).sort((a, b) => a.nom.localeCompare(b.nom, "fr"));
  const sansDeclaration = enVente.filter((p) => p.allergenes.length === 0).length;
  return (
    <Carte
      titre="Tableau des allergènes"
      description="À afficher à la buvette : pour ce qui est servi sans emballage, l'information sur les 14 allergènes est obligatoire. Coche-les dans la fiche de chaque produit."
      actions={
        <button className="btn btn-fantome" onClick={() => window.print()}>
          <Printer size={15} /> Imprimer
        </button>
      }
    >
      {sansDeclaration > 0 && (
        <div className="message message-alerte">
          {sansDeclaration} produit{sansDeclaration > 1 ? "s" : ""} sans aucun allergène déclaré : vérifie {sansDeclaration > 1 ? "qu'ils n'en contiennent" : "qu'il n'en contient"} vraiment aucun.
        </div>
      )}
      <div className="scroll-x tableau-allergenes">
        <h2 className="seulement-impression">Allergènes de nos produits</h2>
        <table className="tableau">
          <thead>
            <tr>
              <th>Produit</th>
              {ALLERGENES.map((a) => (
                <th key={a.code} className="allergene-colonne">
                  {a.libelle}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {enVente.map((p) => (
              <tr key={p.id}>
                <td>
                  <strong>{p.nom}</strong>
                </td>
                {ALLERGENES.map((a) => (
                  <td key={a.code} className="allergene-colonne" aria-label={`${p.nom} : ${a.libelle} ${p.allergenes.includes(a.code) ? "oui" : "non"}`}>
                    {p.allergenes.includes(a.code) ? "●" : ""}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Carte>
  );
}
