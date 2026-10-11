/**
 * Photo d'une étiquette (§15.159) : prise au téléphone ou à la tablette, réduite ici avant l'envoi (JPEG, 1 600 px au
 * plus du grand côté) pour rester légère — quelques centaines de Ko au lieu de plusieurs Mo.
 */
const COTE_MAX = 1600;

/** Contenu JPEG en base64 (sans l'en-tête « data: »), prêt à envoyer au serveur. */
export async function preparerPhoto(fichier: File): Promise<string> {
  const image = await createImageBitmap(fichier);
  const echelle = Math.min(1, COTE_MAX / Math.max(image.width, image.height));
  const toile = document.createElement("canvas");
  toile.width = Math.round(image.width * echelle);
  toile.height = Math.round(image.height * echelle);
  const ctx = toile.getContext("2d");
  if (!ctx) throw new Error("Cet appareil ne sait pas préparer la photo.");
  ctx.drawImage(image, 0, 0, toile.width, toile.height);
  image.close();
  const url = toile.toDataURL("image/jpeg", 0.75);
  return url.slice(url.indexOf(",") + 1);
}
