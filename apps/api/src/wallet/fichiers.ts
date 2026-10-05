import { crc32, deflateSync } from "node:zlib";

/*
 * Petits formats de fichiers pour la carte wallet (dossier §15.147), sans dépendance :
 *   - une archive zip « stockée » (sans compression), le format du .pkpass d'Apple ;
 *   - une image PNG d'une seule couleur (icône et logo de la carte, aux couleurs du lieu).
 */

/** Archive zip, fichiers stockés tels quels, dans l'ordre donné. */
export function zip(fichiers: Record<string, Buffer>): Buffer {
  const locaux: Buffer[] = [];
  const centraux: Buffer[] = [];
  let decalage = 0;
  for (const [nom, contenu] of Object.entries(fichiers)) {
    const n = Buffer.from(nom, "utf8");
    const crc = crc32(contenu) >>> 0;
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0x0800, 6); // noms en UTF-8
    local.writeUInt16LE(0, 8); // stocké
    local.writeUInt16LE(0, 10);
    local.writeUInt16LE(0x21, 12); // 1980-01-01
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(contenu.length, 18);
    local.writeUInt32LE(contenu.length, 22);
    local.writeUInt16LE(n.length, 26);
    local.writeUInt16LE(0, 28);
    locaux.push(local, n, contenu);
    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0x0800, 8);
    central.writeUInt16LE(0, 10);
    central.writeUInt16LE(0, 12);
    central.writeUInt16LE(0x21, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(contenu.length, 20);
    central.writeUInt32LE(contenu.length, 24);
    central.writeUInt16LE(n.length, 28);
    central.writeUInt32LE(decalage, 42);
    centraux.push(central, n);
    decalage += local.length + n.length + contenu.length;
  }
  const repertoire = Buffer.concat(centraux);
  const fin = Buffer.alloc(22);
  fin.writeUInt32LE(0x06054b50, 0);
  fin.writeUInt16LE(Object.keys(fichiers).length, 8);
  fin.writeUInt16LE(Object.keys(fichiers).length, 10);
  fin.writeUInt32LE(repertoire.length, 12);
  fin.writeUInt32LE(decalage, 16);
  return Buffer.concat([...locaux, repertoire, fin]);
}

/** Lecture d'une archive zip stockée (pour les tests et les vérifications). */
export function dezip(archive: Buffer): Record<string, Buffer> {
  const fichiers: Record<string, Buffer> = {};
  let i = 0;
  while (archive.readUInt32LE(i) === 0x04034b50) {
    const taille = archive.readUInt32LE(i + 18);
    const longueurNom = archive.readUInt16LE(i + 26);
    const extra = archive.readUInt16LE(i + 28);
    const nom = archive.subarray(i + 30, i + 30 + longueurNom).toString("utf8");
    const debut = i + 30 + longueurNom + extra;
    fichiers[nom] = archive.subarray(debut, debut + taille);
    i = debut + taille;
  }
  return fichiers;
}

function morceau(type: string, donnees: Buffer): Buffer {
  const t = Buffer.from(type, "ascii");
  const longueur = Buffer.alloc(4);
  longueur.writeUInt32BE(donnees.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([t, donnees])) >>> 0);
  return Buffer.concat([longueur, t, donnees, crc]);
}

/** Image PNG unie (« #rrggbb »), de la taille donnée. */
export function pngUni(couleur: string, largeur: number, hauteur: number): Buffer {
  const n = parseInt(couleur.slice(1), 16);
  const pixel = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  const ligne = Buffer.from([0, ...Array.from({ length: largeur }, () => pixel).flat()]);
  const brut = Buffer.concat(Array.from({ length: hauteur }, () => ligne));
  const entete = Buffer.alloc(13);
  entete.writeUInt32BE(largeur, 0);
  entete.writeUInt32BE(hauteur, 4);
  entete[8] = 8; // 8 bits par canal
  entete[9] = 2; // couleurs RVB
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), morceau("IHDR", entete), morceau("IDAT", deflateSync(brut)), morceau("IEND", Buffer.alloc(0))]);
}
