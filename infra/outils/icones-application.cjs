/**
 * Génère les icônes de l'application installable (dossier §15.117) : un X blanc sur fond violet
 * FlaiX (#4D04F4), sans aucune dépendance (PNG écrit à la main, compressé avec zlib).
 *   node infra/outils/icones-application.cjs
 */
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const VIOLET = [0x4d, 0x04, 0xf4];
const BLANC = [0xff, 0xff, 0xff];

function crc32(buf) {
  let c, crc = 0xffffffff;
  for (let n = 0; n < buf.length; n++) {
    c = (crc ^ buf[n]) & 0xff;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crc = (crc >>> 8) ^ c;
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function bloc(type, donnees) {
  const longueur = Buffer.alloc(4);
  longueur.writeUInt32BE(donnees.length);
  const corps = Buffer.concat([Buffer.from(type, "ascii"), donnees]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(corps));
  return Buffer.concat([longueur, corps, crc]);
}

/** Icône carrée de `taille` px ; `marge` : part laissée autour du X (icône « maskable » : plus de marge). */
function icone(taille, marge) {
  const lignes = [];
  const epaisseur = taille * 0.11;
  const a = taille * marge, b = taille * (1 - marge);
  for (let y = 0; y < taille; y++) {
    const ligne = Buffer.alloc(1 + taille * 3);
    for (let x = 0; x < taille; x++) {
      const cx = x + 0.5, cy = y + 0.5;
      const dansX = cx >= a && cx <= b && cy >= a && cy <= b && (Math.abs(cx - cy) < epaisseur / Math.SQRT1_2 / 2 || Math.abs(cx + cy - taille) < epaisseur / Math.SQRT1_2 / 2);
      const [r, g, bl] = dansX ? BLANC : VIOLET;
      ligne[1 + x * 3] = r;
      ligne[2 + x * 3] = g;
      ligne[3 + x * 3] = bl;
    }
    lignes.push(ligne);
  }
  const entete = Buffer.alloc(13);
  entete.writeUInt32BE(taille, 0);
  entete.writeUInt32BE(taille, 4);
  entete[8] = 8; // 8 bits par canal
  entete[9] = 2; // RVB
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), bloc("IHDR", entete), bloc("IDAT", zlib.deflateSync(Buffer.concat(lignes), { level: 9 })), bloc("IEND", Buffer.alloc(0))]);
}

const sortie = path.join(__dirname, "..", "..", "apps", "web", "public");
for (const [nom, taille, marge] of [
  ["icone-192.png", 192, 0.28],
  ["icone-512.png", 512, 0.28],
  ["icone-masquable-512.png", 512, 0.34],
  ["apple-touch-icon.png", 180, 0.28],
]) {
  fs.writeFileSync(path.join(sortie, nom), icone(taille, marge));
  console.log(nom);
}
