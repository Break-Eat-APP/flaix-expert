import type { Ingredient, Produit } from "@flaix/domain";

/*
 * Ce à quoi se relie un article de facture (§15.179) : un produit vendu (canette, bouteille) ou un ingrédient acheté
 * pour les recettes (saucisse, pain, fût). Valeur du choix : « p:<id> », « i:<id> », ou vide (frais, sans lien).
 */

/** Liste reçue du serveur, ou vide si la réponse n'en est pas une. */
export const tableau = <T,>(x: unknown): T[] => (Array.isArray(x) ? (x as T[]) : []);

export const UNITE_ACHAT: Record<Ingredient["unite"], string> = { piece: "pièce(s)", kg: "kg", l: "L" };

export const valeurChoix = (produitId: string | null | undefined, ingredientId: string | null | undefined) => (produitId ? `p:${produitId}` : ingredientId ? `i:${ingredientId}` : "");

export function lireChoix(valeur: string): { produitId: string | null; ingredientId: string | null } {
  return { produitId: valeur.startsWith("p:") ? valeur.slice(2) : null, ingredientId: valeur.startsWith("i:") ? valeur.slice(2) : null };
}

/** Quantité d'ingrédient saisie dans son unité d'achat (« 4,8 » kg, « 32 » pièces) → millièmes ; null si illisible. */
export function quantiteAchatVersMilli(texte: string): number | null {
  const n = Number(texte.replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(n) && n > 0 && n <= 100_000 ? Math.round(n * 1000) : null;
}

export const milliVersQuantiteAchat = (milli: number) => String(milli / 1000).replace(".", ",");

export function ChoixArticle({
  valeur,
  produits,
  ingredients,
  onChange,
  disabled,
  libelle,
}: {
  valeur: string;
  produits: readonly Produit[];
  ingredients: readonly Ingredient[];
  onChange: (valeur: string) => void;
  disabled?: boolean;
  libelle: string;
}) {
  return (
    <select value={valeur} disabled={disabled} onChange={(ev) => onChange(ev.target.value)} aria-label={libelle}>
      <option value="">Sans lien (frais…)</option>
      <optgroup label="Produits vendus">
        {produits.map((p) => (
          <option key={p.id} value={`p:${p.id}`}>
            {p.nom}
          </option>
        ))}
      </optgroup>
      {ingredients.length > 0 && (
        <optgroup label="Ingrédients (pour les recettes)">
          {ingredients.map((g) => (
            <option key={g.id} value={`i:${g.id}`}>
              {g.nom} ({UNITE_ACHAT[g.unite]})
            </option>
          ))}
        </optgroup>
      )}
    </select>
  );
}
