import { tailleAcceptable, variantesDe, type SorteImage } from "@flaix/domain";
import type { Client } from "../base.ts";
import { ErreurMetier } from "../erreurs.ts";

/*
 * Images de la carte abonné (dossier §15.148) : logo et bannière du lieu, déjà retaillés par l'écran du directeur
 * à chaque format d'Apple et de Google. Le serveur ne retouche rien : il contrôle que chaque fichier est un PNG de la
 * bonne taille, le range dans la base et le sert.
 */

const SIGNATURE_PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
/** Un fichier par format ; la bannière Apple 3x d'une photo dépasse rarement 1,5 Mo. */
export const TAILLE_MAX_FICHIER = 2_500_000;

/** Largeur et hauteur d'un PNG (en-tête IHDR) ; null si ce n'est pas un PNG. */
export function taillePng(b: Buffer): { largeur: number; hauteur: number } | null {
  if (b.length < 33 || !b.subarray(0, 8).equals(SIGNATURE_PNG) || b.toString("ascii", 12, 16) !== "IHDR") return null;
  return { largeur: b.readUInt32BE(16), hauteur: b.readUInt32BE(20) };
}

/** Contrôle des fichiers reçus pour une sorte d'image : tous les formats, chacun un PNG de la bonne taille. */
export function controlerImages(sorte: SorteImage, recus: Record<string, string>): { variante: string; contenu: Buffer; largeur: number; hauteur: number }[] {
  const attendues = variantesDe(sorte);
  const inconnus = Object.keys(recus).filter((n) => !attendues.some((x) => x.nom === n));
  if (inconnus.length) throw new ErreurMetier(400, `Format d'image inconnu : ${inconnus[0]}.`);
  return attendues.map((x) => {
    const base64 = recus[x.nom];
    if (!base64) throw new ErreurMetier(400, `Image incomplète : il manque le format ${x.nom}.`);
    const contenu = Buffer.from(base64, "base64");
    if (contenu.length > TAILLE_MAX_FICHIER) throw new ErreurMetier(413, "Image trop lourde : choisis une image plus légère.");
    const taille = taillePng(contenu);
    if (!taille) throw new ErreurMetier(400, "Le fichier reçu n'est pas une image PNG.");
    if (!tailleAcceptable(x, taille.largeur, taille.hauteur)) throw new ErreurMetier(400, `Taille d'image inattendue pour ${x.nom} (${taille.largeur} × ${taille.hauteur}).`);
    return { variante: x.nom, contenu, ...taille };
  });
}

/** Date du dernier dépôt de chaque sorte d'image (sert de version dans les adresses des images). */
export async function versionsImages(c: Client, lieuId: string): Promise<Record<SorteImage, number | null>> {
  const { rows } = await c.query<{ sorte: SorteImage; le: Date }>("SELECT sorte, max(depose_le) AS le FROM carte_image WHERE lieu_id = $1 GROUP BY sorte", [lieuId]);
  const version = (s: SorteImage) => rows.find((r) => r.sorte === s)?.le.getTime() ?? null;
  return { logo: version("logo"), banniere: version("banniere") };
}

/** Une image d'un format donné, ou null. */
export async function imageCarte(c: Client, lieuId: string, variante: string): Promise<Buffer | null> {
  const { rows } = await c.query<{ contenu: Buffer }>("SELECT contenu FROM carte_image WHERE lieu_id = $1 AND variante = $2", [lieuId, variante]);
  return rows[0]?.contenu ?? null;
}

// Les images Apple entrent dans chaque carte fabriquée (téléchargement, mise à jour) : gardées en mémoire tant que
// le lieu n'en dépose pas de nouvelles.
const cache = new Map<string, { cle: string; images: Record<string, Buffer> }>();

/** Images Apple du lieu (logo, icônes, bande), par nom de fichier sans « .png ». */
export async function imagesApple(c: Client, lieuId: string): Promise<Record<string, Buffer>> {
  const v = await versionsImages(c, lieuId);
  const cle = `${v.logo ?? 0}-${v.banniere ?? 0}`;
  const enMemoire = cache.get(lieuId);
  if (enMemoire?.cle === cle) return enMemoire.images;
  const { rows } = await c.query<{ variante: string; contenu: Buffer }>("SELECT variante, contenu FROM carte_image WHERE lieu_id = $1 AND variante NOT LIKE 'google-%'", [lieuId]);
  const images = Object.fromEntries(rows.map((r) => [r.variante, r.contenu]));
  cache.set(lieuId, { cle, images });
  return images;
}
