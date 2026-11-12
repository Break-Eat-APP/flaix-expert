import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import type { CorrespondanceArticle, Ingredient, Produit } from "@flaix/domain";
import { api } from "../../api.ts";
import { Carte, Chargement, EtatVide, MessageErreur } from "../../composants/communs.tsx";
import { ChoixArticle, UNITE_ACHAT, lireChoix, milliVersQuantiteAchat, quantiteAchatVersMilli, tableau, valeurChoix } from "../factures/article.tsx";

/**
 * Achats › Correspondances (§15.174) : ce que FlaiX Expert a appris des factures, fournisseur par fournisseur — tel
 * article = tel produit, en colis de tant, ou tel ingrédient, en quantité de tant par unité facturée (§15.179). Corriger ici vaut pour les prochaines factures (celles déjà enregistrées ne
 * changent pas) ; retirer un article fait redemander son produit et son colis à la prochaine facture.
 */
export function Correspondances() {
  const client = useQueryClient();
  const liste = useQuery({ queryKey: ["correspondances-fournisseurs"], queryFn: () => api.get<CorrespondanceArticle[]>("/factures/correspondances") });
  const produits = useQuery({ queryKey: ["produits"], queryFn: () => api.get<Produit[]>("/produits") });
  const ingredients = useQuery({ queryKey: ["ingredients"], queryFn: () => api.get<Ingredient[]>("/ingredients") });
  const maj = (l: CorrespondanceArticle[]) => client.setQueryData(["correspondances-fournisseurs"], l);
  const modifier = useMutation({ mutationFn: (c: CorrespondanceArticle) => api.put<CorrespondanceArticle[]>("/factures/correspondances", c), onSuccess: maj });
  const retirer = useMutation({
    mutationFn: (c: CorrespondanceArticle) =>
      api.supprimer<CorrespondanceArticle[]>(`/factures/correspondances?fournisseur=${encodeURIComponent(c.fournisseur)}&cle=${encodeURIComponent(c.cle)}`),
    onSuccess: maj,
  });
  if (liste.isPending || produits.isPending || ingredients.isPending) return <Chargement />;
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
        Ce que FlaiX Expert a retenu de tes factures : tel article de tel fournisseur = tel produit, en colis de tant, ou tel ingrédient de tes recettes. Une correction vaut pour
        les prochaines factures ; celles déjà enregistrées ne changent pas.
      </p>
      {[...parFournisseur].map(([fournisseur, articles]) => (
        <Carte key={fournisseur} titre={fournisseur.toLocaleUpperCase("fr")} description={`${articles.length} article${articles.length > 1 ? "s" : ""} retenu${articles.length > 1 ? "s" : ""}`}>
          <div className="scroll-x">
            <table className="tableau">
              <thead>
                <tr>
                  <th>Article sur la facture</th>
                  <th>Code</th>
                  <th>Produit ou ingrédient</th>
                  <th>Colis ou contenu</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {articles.map((c) => (
                  <tr key={c.cle}>
                    <td style={{ whiteSpace: "normal" }}>{c.libelle}</td>
                    <td className="discret">{c.cle.startsWith("code:") ? c.cle.slice(5).toUpperCase() : "—"}</td>
                    <td>
                      <ChoixArticle
                        valeur={valeurChoix(c.produitId, c.ingredientId)}
                        produits={produits.data!}
                        ingredients={tableau<Ingredient>(ingredients.data).filter((g) => g.actif || g.id === c.ingredientId)}
                        disabled={modifier.isPending}
                        libelle={`Produit ou ingrédient de ${c.libelle}`}
                        onChange={(v) => {
                          const { produitId, ingredientId } = lireChoix(v);
                          // Un ingrédient se compte dans son unité : sans quantité connue, 1 (à corriger juste à côté).
                          const milli = ingredientId ? (ingredientId === c.ingredientId ? c.ingredientMilliParUnite : 1_000) : null;
                          modifier.mutate({ ...c, produitId, ingredientId, ingredientMilliParUnite: milli, unitesParColis: ingredientId ? 1 : c.unitesParColis });
                        }}
                      />
                    </td>
                    <td>
                      {c.ingredientId ? (
                        <>
                          <input
                            key={`${c.cle}-${c.ingredientMilliParUnite}`}
                            type="text"
                            inputMode="decimal"
                            defaultValue={milliVersQuantiteAchat(c.ingredientMilliParUnite ?? 1_000)}
                            style={{ width: 70 }}
                            aria-label={`Quantité d'ingrédient par unité facturée de ${c.libelle}`}
                            onBlur={(ev) => {
                              const m = quantiteAchatVersMilli(ev.target.value);
                              if (m !== null && m !== c.ingredientMilliParUnite) modifier.mutate({ ...c, ingredientMilliParUnite: m });
                            }}
                          />{" "}
                          <span className="discret">{UNITE_ACHAT[tableau<Ingredient>(ingredients.data).find((g) => g.id === c.ingredientId)?.unite ?? "piece"]}</span>
                        </>
                      ) : (
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
                      )}
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
