/**
 * Montants — règle de modèle (docs/decisions-architecture-production.md § 4.3) :
 * tout montant est un nombre ENTIER de centimes. Jamais de nombre à virgule
 * flottante pour de l'argent : 0,1 + 0,2 n'y vaut pas exactement 0,3.
 */

export type Centimes = number;

/**
 * Division entière arrondie au plus proche, demi vers l'extérieur de zéro
 * (1,5 → 2 ; −1,5 → −2). Symétrique : un remboursement arrondit comme la vente
 * qu'il annule, ce qui évite un écart d'un centime entre une vente et son annulation.
 */
export function diviserArrondi(numerateur: number, denominateur: number): number {
  if (!Number.isSafeInteger(numerateur) || !Number.isSafeInteger(denominateur) || denominateur <= 0) {
    throw new RangeError("diviserArrondi : entiers attendus, dénominateur strictement positif");
  }
  const signe = numerateur < 0 ? -1 : 1;
  const absolu = Math.abs(numerateur);
  return signe * Math.floor((2 * absolu + denominateur) / (2 * denominateur));
}

/**
 * Lit un montant saisi en euros (« 7 », « 7,5 », « 7,50 », « 7.50 », « 7,50 € »)
 * et le renvoie en centimes. Refuse ce qui n'est pas un montant positif à deux
 * décimales au plus — plutôt que de deviner ce que la personne voulait taper.
 */
export function lireMontant(saisie: string): Centimes | null {
  const propre = saisie.replace(/[\s  €]/g, "").replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(propre)) return null;
  const [euros, decimales = ""] = propre.split(".");
  const centimes = Number(euros) * 100 + Number(decimales.padEnd(2, "0"));
  return Number.isSafeInteger(centimes) ? centimes : null;
}

const formateurEuros = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });

/** 750 → « 7,50 € » (format français). */
export function formaterMontant(centimes: Centimes): string {
  return formateurEuros.format(centimes / 100);
}

/** 750 → « 7,50 » — valeur à remettre dans un champ de saisie. */
export function montantPourSaisie(centimes: Centimes): string {
  return (centimes / 100).toFixed(2).replace(".", ",");
}
