import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import {
  UNITES_INGREDIENT,
  coutLigneRecette,
  coutRecette,
  formaterMontant,
  lireMontant,
  montantPourSaisie,
  quantiteMilliVersSaisie,
  quantiteSaisieVersMilli,
  type Ingredient,
  type Produit,
  type Recette,
  type UniteIngredient,
} from "@flaix/domain";
import { api } from "../../api.ts";
import { Carte, Chargement, EtatVide, MessageErreur } from "../../composants/communs.tsx";

/**
 * Recettes (dossier §15.117, §15.119) : les ingrédients du lieu, et la recette d'un produit vendu.
 * Le coût de fabrication devient le coût matière du produit.
 */
const euros = (c: number) => formaterMontant(Math.round(c));

export function GestionIngredients() {
  const client = useQueryClient();
  const ingredients = useQuery({ queryKey: ["ingredients"], queryFn: () => api.get<Ingredient[]>("/ingredients") });
  const [n, setN] = useState({ nom: "", unite: "kg" as UniteIngredient, prix: "" });
  const [edition, setEdition] = useState<{ id: string; prix: string } | null>(null);
  const maj = (l: Ingredient[]) => {
    client.setQueryData(["ingredients"], l);
    void client.invalidateQueries({ queryKey: ["produits"] });
    void client.invalidateQueries({ queryKey: ["recette"] });
  };
  const creer = useMutation({
    mutationFn: () => api.post<Ingredient[]>("/ingredients", { nom: n.nom, unite: n.unite, prix: lireMontant(n.prix) }),
    onSuccess: (l) => {
      maj(l);
      setN({ nom: "", unite: n.unite, prix: "" });
    },
  });
  const modifier = useMutation({
    mutationFn: ({ id, ...corps }: { id: string; prix?: number; actif?: boolean }) => api.patch<Ingredient[]>(`/ingredients/${id}`, corps),
    onSuccess: (l) => {
      maj(l);
      setEdition(null);
    },
  });
  const prixLu = lireMontant(n.prix);

  return (
    <Carte
      titre="Ingrédients"
      description="Ce qui entre dans tes recettes, avec son prix d'achat HT au kilo, au litre ou à la pièce. Changer un prix recalcule le coût de toutes les recettes qui l'utilisent."
    >
      <form
        className="en-ligne"
        onSubmit={(e) => {
          e.preventDefault();
          creer.mutate();
        }}
      >
        <input type="text" value={n.nom} onChange={(e) => setN({ ...n, nom: e.target.value })} placeholder="Ex. Tomates, Steak haché, Pain burger…" maxLength={80} style={{ flex: "1 1 220px", width: "auto" }} aria-label="Nom de l'ingrédient" />
        <select value={n.unite} onChange={(e) => setN({ ...n, unite: e.target.value as UniteIngredient })} aria-label="Unité d'achat" style={{ width: "auto" }}>
          <option value="kg">au kilo</option>
          <option value="l">au litre</option>
          <option value="piece">à la pièce</option>
        </select>
        <input
          type="text"
          inputMode="decimal"
          value={n.prix}
          onChange={(e) => setN({ ...n, prix: e.target.value })}
          placeholder={`Prix HT / ${UNITES_INGREDIENT[n.unite].achat}`}
          aria-label="Prix HT par unité d'achat"
          style={{ width: 150 }}
        />
        <button className="btn" disabled={!n.nom.trim() || prixLu === null || creer.isPending}>
          <Plus size={15} /> Ajouter
        </button>
      </form>
      <MessageErreur erreur={creer.error ?? modifier.error} />
      {ingredients.isPending ? (
        <Chargement />
      ) : ingredients.error ? (
        <MessageErreur erreur={ingredients.error} />
      ) : ingredients.data!.length === 0 ? (
        <EtatVide titre="Aucun ingrédient">Ajoute d'abord tes ingrédients ; tu les cocheras ensuite dans la recette de chaque produit.</EtatVide>
      ) : (
        <div className="scroll-x" style={{ marginTop: 12 }}>
          <table className="tableau">
            <thead>
              <tr>
                <th>Ingrédient</th>
                <th className="d">Prix HT</th>
                <th className="d">Recettes</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {ingredients.data!.map((i) => (
                <tr key={i.id} style={i.actif ? undefined : { opacity: 0.55 }}>
                  <td>
                    {i.nom}
                    {!i.actif && <span className="discret"> (désactivé)</span>}
                  </td>
                  <td className="d chiffre">
                    {edition?.id === i.id ? (
                      <form
                        className="en-ligne"
                        style={{ justifyContent: "flex-end" }}
                        onSubmit={(e) => {
                          e.preventDefault();
                          const p = lireMontant(edition.prix);
                          if (p !== null) modifier.mutate({ id: i.id, prix: p });
                        }}
                      >
                        <input type="text" inputMode="decimal" value={edition.prix} onChange={(e) => setEdition({ id: i.id, prix: e.target.value })} autoFocus style={{ width: 90 }} aria-label={`Nouveau prix de ${i.nom}`} />
                        <button className="btn" disabled={lireMontant(edition.prix) === null || modifier.isPending}>
                          OK
                        </button>
                      </form>
                    ) : (
                      `${formaterMontant(i.prix)} / ${UNITES_INGREDIENT[i.unite].achat}`
                    )}
                  </td>
                  <td className="d chiffre">{i.recettes}</td>
                  <td>
                    <div className="en-ligne" style={{ justifyContent: "flex-end", gap: 8 }}>
                      {edition?.id !== i.id && (
                        <button className="btn-lien" onClick={() => setEdition({ id: i.id, prix: montantPourSaisie(i.prix) })}>
                          changer le prix
                        </button>
                      )}
                      <button className="btn-lien" onClick={() => modifier.mutate({ id: i.id, actif: !i.actif })}>
                        {i.actif ? "désactiver" : "réactiver"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Carte>
  );
}

interface LigneSaisie {
  ingredientId: string;
  quantite: string;
}

/** Recette d'un produit vendu : ingrédients cochés et quantités, coût de fabrication en direct. */
export function RecetteProduit({ produit }: { produit: Produit }) {
  const client = useQueryClient();
  const ingredients = useQuery({ queryKey: ["ingredients"], queryFn: () => api.get<Ingredient[]>("/ingredients") });
  const recette = useQuery({ queryKey: ["recette", produit.id], queryFn: () => api.get<Recette>(`/produits/${produit.id}/recette`) });
  const [lignes, setLignes] = useState<LigneSaisie[] | null>(null);
  useEffect(() => {
    if (recette.data) setLignes(recette.data.lignes.map((l) => ({ ingredientId: l.ingredientId, quantite: quantiteMilliVersSaisie(l.quantiteMilli, l.unite) })));
  }, [recette.data]);
  const enregistrer = useMutation({
    mutationFn: (corps: { ingredientId: string; quantiteMilli: number }[]) => api.put<Recette>(`/produits/${produit.id}/recette`, { lignes: corps }),
    onSuccess: (r) => {
      client.setQueryData(["recette", produit.id], r);
      void client.invalidateQueries({ queryKey: ["produits"] });
      void client.invalidateQueries({ queryKey: ["ingredients"] });
    },
  });

  if (ingredients.isPending || recette.isPending || lignes === null) return <Chargement />;
  if (ingredients.error || recette.error) return <MessageErreur erreur={ingredients.error ?? recette.error} />;
  const tous = ingredients.data!;
  const parId = new Map(tous.map((i) => [i.id, i]));
  const lues = lignes.map((l) => {
    const i = parId.get(l.ingredientId);
    const milli = i ? quantiteSaisieVersMilli(l.quantite, i.unite) : null;
    return { ...l, ingredient: i, milli, cout: i && milli ? coutLigneRecette(i.prix, milli) : null };
  });
  const valide = lues.every((l) => l.ingredient && l.milli !== null);
  const total = valide && lues.length ? coutRecette(lues.map((l) => ({ prix: l.ingredient!.prix, quantiteMilli: l.milli! }))) : null;
  const enregistree = JSON.stringify(recette.data!.lignes.map((l) => [l.ingredientId, l.quantiteMilli]).sort()) === JSON.stringify(lues.map((l) => [l.ingredientId, l.milli]).sort());
  const disponibles = (courant: string) => tous.filter((i) => (i.actif || i.id === courant) && (i.id === courant || !lignes.some((l) => l.ingredientId === i.id)));

  if (tous.length === 0) {
    return <p className="discret">Pour faire une recette, ajoute d'abord tes ingrédients (bouton « Ingrédients » en haut de la page).</p>;
  }

  return (
    <div>
      {lues.length > 0 && (
        <div className="scroll-x">
          <table className="tableau">
            <thead>
              <tr>
                <th>Ingrédient</th>
                <th>Quantité</th>
                <th className="d">Coût</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {lues.map((l, k) => (
                <tr key={k}>
                  <td>
                    <select
                      value={l.ingredientId}
                      onChange={(e) => setLignes(lignes.map((x, j) => (j === k ? { ...x, ingredientId: e.target.value } : x)))}
                      aria-label={`Ingrédient de la ligne ${k + 1}`}
                    >
                      <option value="">Choisir…</option>
                      {disponibles(l.ingredientId).map((i) => (
                        <option key={i.id} value={i.id}>
                          {i.nom} ({formaterMontant(i.prix)} / {UNITES_INGREDIENT[i.unite].achat})
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <span className="en-ligne" style={{ gap: 6, flexWrap: "nowrap" }}>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={l.quantite}
                        onChange={(e) => setLignes(lignes.map((x, j) => (j === k ? { ...x, quantite: e.target.value } : x)))}
                        aria-label={`Quantité de la ligne ${k + 1}`}
                        aria-invalid={l.quantite.trim() !== "" && l.milli === null}
                        style={{ width: 90 }}
                      />
                      <span className="discret">{l.ingredient ? UNITES_INGREDIENT[l.ingredient.unite].recette : ""}</span>
                    </span>
                  </td>
                  <td className="d chiffre">{l.cout !== null ? euros(l.cout) : "—"}</td>
                  <td>
                    <button className="btn-lien" onClick={() => setLignes(lignes.filter((_, j) => j !== k))}>
                      retirer
                    </button>
                  </td>
                </tr>
              ))}
              <tr style={{ fontWeight: 700 }}>
                <td colSpan={2}>Coût de fabrication</td>
                <td className="d chiffre">{total !== null ? formaterMontant(total) : "—"}</td>
                <td />
              </tr>
            </tbody>
          </table>
        </div>
      )}
      <div className="ligne-actions">
        <button className="btn btn-fantome" disabled={disponibles("").length === 0} onClick={() => setLignes([...lignes, { ingredientId: "", quantite: "" }])}>
          <Plus size={15} /> Ajouter un ingrédient
        </button>
        <button
          className="btn"
          disabled={!valide || enregistree || enregistrer.isPending}
          onClick={() => enregistrer.mutate(lues.map((l) => ({ ingredientId: l.ingredientId, quantiteMilli: l.milli! })))}
        >
          {lues.length ? "Enregistrer la recette" : recette.data!.lignes.length ? "Retirer la recette" : "Enregistrer la recette"}
        </button>
      </div>
      <MessageErreur erreur={enregistrer.error} />
    </div>
  );
}
