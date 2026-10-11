/**
 * Allergènes (dossier §15.157) : les 14 allergènes à déclarer (règlement INCO n° 1169/2011, annexe II). Pour ce qui
 * est servi sans emballage (buvette, Click & Collect), l'information doit être donnée au client : chaque produit porte
 * la liste de ses allergènes, et un tableau s'imprime pour l'affichage.
 */
export const ALLERGENES = [
  { code: "gluten", libelle: "Gluten", detail: "blé, seigle, orge (bière), avoine, épeautre" },
  { code: "crustaces", libelle: "Crustacés", detail: "crevettes, crabe, homard" },
  { code: "oeufs", libelle: "Œufs", detail: "mayonnaise, pâtisseries" },
  { code: "poissons", libelle: "Poissons", detail: "" },
  { code: "arachides", libelle: "Arachides", detail: "cacahuètes" },
  { code: "soja", libelle: "Soja", detail: "" },
  { code: "lait", libelle: "Lait", detail: "fromage, beurre, crème" },
  { code: "fruits_a_coque", libelle: "Fruits à coque", detail: "amandes, noisettes, noix, pistaches" },
  { code: "celeri", libelle: "Céleri", detail: "" },
  { code: "moutarde", libelle: "Moutarde", detail: "sauces" },
  { code: "sesame", libelle: "Sésame", detail: "pains à burger" },
  { code: "sulfites", libelle: "Sulfites", detail: "vin, cidre (plus de 10 mg/l)" },
  { code: "lupin", libelle: "Lupin", detail: "" },
  { code: "mollusques", libelle: "Mollusques", detail: "" },
] as const;

export type Allergene = (typeof ALLERGENES)[number]["code"];

export const estAllergene = (x: string): x is Allergene => ALLERGENES.some((a) => a.code === x);

/** Allergènes dans l'ordre réglementaire, sans doublon. */
export const trierAllergenes = (liste: readonly string[]): Allergene[] => ALLERGENES.map((a) => a.code).filter((c) => liste.includes(c));

/** « Gluten, Lait » ; « aucun allergène déclaré » si la liste est vide. */
export const libelleAllergenes = (liste: readonly string[]): string =>
  liste.length ? trierAllergenes(liste).map((c) => ALLERGENES.find((a) => a.code === c)!.libelle).join(", ") : "aucun allergène déclaré";
