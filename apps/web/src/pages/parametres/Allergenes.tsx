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

/**
 * Tableau des allergènes des produits en vente : chaque case se coche ici directement (ou dans la fiche du produit), puis
 * le tableau s'imprime pour l'affichage à la buvette.
 */
export function TableauAllergenes({ produits, majProduits }: { produits: Produit[]; majProduits: (l: Produit[]) => void }) {
  const enVente = produits.filter((p) => p.actif).sort((a, b) => a.nom.localeCompare(b.nom, "fr"));
  const sansDeclaration = enVente.filter((p) => p.allergenes.length === 0).length;
  const enregistrer = useMutation({
    mutationFn: ({ id, allergenes }: { id: string; allergenes: Allergene[] }) => api.put<Produit[]>(`/produits/${id}/allergenes`, { allergenes }),
    onSuccess: majProduits,
  });
  if (enVente.length === 0)
    return (
      <Carte titre="Tableau des allergènes">
        <p className="note" style={{ margin: 0 }}>Ajoute d'abord tes produits : leurs allergènes se cocheront ensuite ici, dans un tableau produit par produit.</p>
      </Carte>
    );
  return (
    <Carte
      titre="Tableau des allergènes"
      description="Coche ce que contient chaque produit (case par case, enregistré aussitôt). Pour ce qui est servi sans emballage, l'information doit pouvoir être donnée au client : imprime ce tableau et affiche-le à la buvette."
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
                {ALLERGENES.map((a) => {
                  const coche = p.allergenes.includes(a.code);
                  return (
                    <td key={a.code} className="allergene-colonne">
                      <input
                        type="checkbox"
                        className="seulement-ecran"
                        aria-label={`${p.nom} : ${a.libelle}`}
                        checked={coche}
                        disabled={enregistrer.isPending}
                        onChange={() => enregistrer.mutate({ id: p.id, allergenes: coche ? p.allergenes.filter((x) => x !== a.code) : [...p.allergenes, a.code] })}
                      />
                      <span className="seulement-impression">{coche ? "●" : ""}</span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <MessageErreur erreur={enregistrer.error} />
    </Carte>
  );
}
