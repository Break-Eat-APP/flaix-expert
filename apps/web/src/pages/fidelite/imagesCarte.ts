import { TAILLE_CONSEILLEE, cadrage, variantesDe, type SorteImage } from "@flaix/domain";

/*
 * Logo et bannière de la carte abonné (dossier §15.148) : l'image choisie par le directeur est retaillée ici, dans le
 * navigateur, à chaque format d'Apple et de Google (PNG). Le serveur reçoit les fichiers prêts et contrôle leur taille :
 * il n'a besoin d'aucune bibliothèque d'images.
 */

export const TYPES_ACCEPTES = "image/png,image/jpeg,image/webp,image/svg+xml";
const POIDS_MAX = 15 * 1024 * 1024;

export interface ImagesPreparees {
  /** Nom du format → PNG en base64. */
  variantes: Record<string, string>;
  /** L'image est plus petite que la taille conseillée : elle sera agrandie, donc un peu floue. */
  petite: boolean;
}

function charger(fichier: File): Promise<HTMLImageElement> {
  return new Promise((resoudre, rejeter) => {
    const url = URL.createObjectURL(fichier);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resoudre(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      rejeter(new Error("Cette image ne s'ouvre pas : choisis un fichier PNG, JPEG ou WebP."));
    };
    image.src = url;
  });
}

const enBase64 = (blob: Blob) =>
  new Promise<string>((resoudre, rejeter) => {
    const lecteur = new FileReader();
    lecteur.onload = () => resoudre(String(lecteur.result).replace(/^data:[^,]*,/, ""));
    lecteur.onerror = () => rejeter(new Error("Lecture de l'image impossible."));
    lecteur.readAsDataURL(blob);
  });

/** L'image choisie, retaillée à tous les formats de sa sorte. */
export async function preparerImages(fichier: File, sorte: SorteImage): Promise<ImagesPreparees> {
  if (!TYPES_ACCEPTES.split(",").includes(fichier.type)) throw new Error("Format non pris en charge : choisis une image PNG, JPEG, WebP ou SVG.");
  if (fichier.size > POIDS_MAX) throw new Error("Image trop lourde (15 Mo au plus).");
  const image = await charger(fichier);
  const largeur = image.naturalWidth;
  const hauteur = image.naturalHeight;
  if (!largeur || !hauteur) throw new Error("Cette image n'a pas de taille lisible : enregistre-la en PNG et réessaie.");
  const variantes: Record<string, string> = {};
  for (const v of variantesDe(sorte)) {
    const c = cadrage(largeur, hauteur, v);
    const toile = document.createElement("canvas");
    toile.width = c.largeur;
    toile.height = c.hauteur;
    const ctx = toile.getContext("2d");
    if (!ctx) throw new Error("Ce navigateur ne sait pas préparer l'image.");
    if (v.fond === "blanc") {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, c.largeur, c.hauteur);
    }
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(image, c.source.x, c.source.y, c.source.l, c.source.h, c.cible.x, c.cible.y, c.cible.l, c.cible.h);
    const blob = await new Promise<Blob>((resoudre, rejeter) => toile.toBlob((b) => (b ? resoudre(b) : rejeter(new Error("Préparation de l'image impossible."))), "image/png"));
    variantes[v.nom] = await enBase64(blob);
  }
  const conseil = TAILLE_CONSEILLEE[sorte];
  const petite = sorte === "logo" ? Math.max(largeur, hauteur) < conseil.largeur : largeur < conseil.largeur;
  return { variantes, petite };
}
