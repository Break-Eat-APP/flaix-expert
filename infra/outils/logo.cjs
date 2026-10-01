/**
 * Logo de l'application (« eXpert », fichier officiel de Rémi : docs/marque/logo-expert-officiel.svg).
 * Produit deux versions pour les écrans, sans toucher au dessin :
 *   - fond blanc retiré (le logo se pose sur n'importe quel fond),
 *   - cadrage resserré sur le dessin (le fichier d'origine est une grande page presque vide),
 *   - texte noir (thème clair) ou blanc (thème sombre) ; le X violet ne change pas.
 *   node infra/outils/logo.cjs
 */
const fs = require("fs");
const path = require("path");

const racine = path.join(__dirname, "..", "..");
const source = fs.readFileSync(path.join(racine, "docs", "marque", "logo-expert-officiel.svg"), "utf8");
const CADRAGE = process.env.CADRAGE ?? "512 640 412 240";

const fond = /<g clip-path="url\(#58ea1121c9\)"><path fill="#ffffff"[^>]*\/><\/g>/;
if (!fond.test(source)) throw new Error("Fond blanc introuvable : le fichier source a changé.");
const base = source
  .replace(fond, "")
  .replace(/ width="1739"/, "")
  .replace(/ height="1928"/, "")
  .replace(/viewBox="0 0 1304\.25 1445\.999935"/, `viewBox="${CADRAGE}"`);

for (const [nom, texte] of [
  ["logo-clair.svg", "#000000"],
  ["logo-sombre.svg", "#ffffff"],
]) {
  const svg = base.replace(/fill="#000000"/g, `fill="${texte}"`);
  fs.writeFileSync(path.join(racine, "apps", "web", "src", "assets", nom), svg);
  console.log(nom, Math.round(svg.length / 1024), "Ko");
}
