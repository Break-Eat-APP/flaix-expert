import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import type { CorrespondanceArticle, Produit } from "@flaix/domain";
import { api } from "../../api.ts";
import { Carte, Chargement, EtatVide, MessageErreur } from "../../composants/communs.tsx";

/**
 * Achats › Correspondances (§15.174) : ce que FlaiX Expert a appris des factures, fournisseur par fournisseur — tel
 * article = tel produit, en colis de tant. Corriger ici vaut pour les prochaines factures (celles déjà enregistrées ne
 * changent pas) ; retirer un article fait redemander son produit et son colis à la prochaine facture.
 */
export function Correspondances() {
  const client = useQueryClient();
  const liste = useQuery({ queryKey: ["correspondances-fournisseurs"], queryFn: () => api.get<CorrespondanceArticle[]>("/factures/correspondances") });
  const produits = useQuery({ queryKey: ["produits"], queryFn: () => api.get<Produit[]>("/produits") });
  const maj = (l: CorrespondanceArticle[]) => client.setQueryData(["correspondances-fournisseurs"], l);
  const modifier = useMutation({ mutationFn: (c: CorrespondanceArticle) => api.put<CorrespondanceArticle[]>("/factures/correspondances", c), onSuccess: maj });
  const retirer = useMutation({
    mutationFn: (c: CorrespondanceArticle) =>
      api.supprimer<CorrespondanceArticle[]>(`/factures/correspondances?fournisseur=${encodeURIComponent(c.fournisseur)}&cle=${encodeURIComponent(c.cle)}`),
    onSuccess: maj,
  });
  if (liste.isPending || produits.isPending) return <Chargement />;
  if (liste.error) return <MessageErreur erreur={liste.error} />;
  const parFournisseur = new Map<string, CorrespondanceArticle[]>();
  for (const c of liste.data) parFournisseur.set(c.fournisseur, [...(parFournisseur.get(c.fournisseur) ?? []), c]);
  if (parFournisseur.size === 0)
    return (
      <Carte>
        <EtatVide titre="Rien d'appris pour l'instant">
          À chaque facture enregistrée, FlaiX Expert retient le produit et le colis de chaque article, pour remplir seul la facture suivante du même fournisseur.
        </EtatVide>
      </Carte>
    );
  return (
    <>
      <p className="stock-parcours">
        Ce que FlaiX Expert a retenu de tes factures : tel article de tel fournisseur = tel produit, en colis de tant. Une correction vaut pour les prochaines factures ; celles déjà
        enregistrées ne changent pas.
      </p>
      {[...parFournisseur].map(([fournisseur, articles]) => (
        <Carte key={fournisseur} titre={fournisseur.toLocaleUpperCase("fr")} description={`${articles.length} article${articles.length > 1 ? "s" : ""} retenu${articles.length > 1 ? "s" : ""}`}>
          <div className="scroll-x">
            <table className="tableau">
              <thead>
                <tr>
                  <th>Article sur la facture</th>
                  <th>Code</th>
                  <th>Produit FlaiX Expert</th>
                  <th>Unités / colis</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {articles.map((c) => (
                  <tr key={c.cle}>
                    <td style={{ whiteSpace: "normal" }}>{c.libelle}</td>
                    <td className="discret">{c.cle.startsWith("code:") ? c.cle.slice(5).toUpperCase() : "—"}</td>
                    <td>
                      <select
                        value={c.produitId ?? ""}
                        disabled={modifier.isPending}
                        onChange={(ev) => modifier.mutate({ ...c, produitId: ev.target.value || null })}
                        aria-label={`Produit de ${c.libelle}`}
                      >
                        <option value="">Sans produit (frais…)</option>
                        {produits.data!.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.nom}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <input
                        key={`${c.cle}-${c.unitesParColis}`}
                        type="text"
                        inputMode="numeric"
                        defaultValue={String(c.unitesParColis)}
                        style={{ width: 70 }}
                        aria-label={`Unités par colis de ${c.libelle}`}
                        onBlur={(ev) => {
                          const n = Number(ev.target.value.replace(/\D/g, ""));
                          if (Number.isInteger(n) && n >= 1 && n !== c.unitesParColis) modifier.mutate({ ...c, unitesParColis: n });
                        }}
                      />
                    </td>
                    <td>
                      <button className="btn-lien" aria-label={`Retirer ${c.libelle}`} onClick={() => retirer.mutate(c)} disabled={retirer.isPending}>
                        <Trash2 size={14} /> Retirer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Carte>
      ))}
      <MessageErreur erreur={modifier.error ?? retirer.error} />
    </>
  );
}
