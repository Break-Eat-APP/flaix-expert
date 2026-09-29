/** Erreur métier : message en français destiné à l'écran, code HTTP associé. */
export class ErreurMetier extends Error {
  constructor(
    public readonly statut: number,
    message: string,
  ) {
    super(message);
  }
}

export const nonAutorise = () => new ErreurMetier(401, "Session expirée ou absente : reconnecte-toi.");
export const interdit = () => new ErreurMetier(403, "Ton compte n'a pas accès à cette fonction.");
export const introuvable = (quoi: string) => new ErreurMetier(404, `${quoi} introuvable.`);

/** Messages lisibles pour les contraintes d'unicité de la base (code PostgreSQL 23505). */
const DOUBLONS: Record<string, string> = {
  stand_nom_unique: "Un stand porte déjà ce nom dans ce lieu.",
  categorie_nom_unique: "Une catégorie porte déjà ce nom.",
  produit_nom_unique: "Un produit porte déjà ce nom. Pour le vendre dans un autre stand, coche ce stand sur la fiche existante.",
  caisse_numero_unique: "Ce numéro de caisse est déjà utilisé.",
  produit_tarif_date_unique: "Un tarif existe déjà à cette date d'effet exacte pour ce produit.",
  utilisateur_email_unique: "Un compte existe déjà avec cette adresse e-mail.",
};

export function traduireErreurBase(erreur: unknown): ErreurMetier | null {
  if (typeof erreur !== "object" || erreur === null || !("code" in erreur)) return null;
  const e = erreur as { code?: string; constraint?: string };
  if (e.code === "23505") {
    return new ErreurMetier(409, (e.constraint && DOUBLONS[e.constraint]) || "Cet élément existe déjà.");
  }
  if (e.code === "23503") return new ErreurMetier(400, "Référence inconnue dans ce lieu.");
  if (e.code === "23514") return new ErreurMetier(400, "Valeur refusée : format ou longueur invalide.");
  return null;
}
