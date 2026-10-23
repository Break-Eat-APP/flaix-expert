import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { formaterMontant, libelleTauxTva, type FactureVente } from "@flaix/domain";

/*
 * Facture de vente en PDF (dossier §15.172) : le contenu figé de la facture d'un événement privé (§15.160), mis en
 * page pour le comptable — rien n'est recalculé, tout vient du contenu scellé. Police standard Helvetica : les
 * caractères qu'elle ne sait pas écrire sont remplacés (espaces fines des montants par des espaces).
 */

const A4 = { l: 595.28, h: 841.89 };
const MARGE = 48;
const NOIR = rgb(0.11, 0.09, 0.19);
const GRIS = rgb(0.37, 0.35, 0.45);
const VIOLET = rgb(0.3, 0.02, 0.96);

const dateFr = (iso: string) => iso.slice(0, 10).split("-").reverse().join("/");

export async function pdfFactureVente(f: FactureVente): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle(`Facture ${f.numero}`);
  doc.setCreator("FlaiX Expert");
  const normal = await doc.embedFont(StandardFonts.Helvetica);
  const gras = await doc.embedFont(StandardFonts.HelveticaBold);
  const connus = new Set(normal.getCharacterSet());
  const propre = (t: string) =>
    [...t.replace(/[   ]/g, " ")].map((ch) => (connus.has(ch.codePointAt(0)!) ? ch : ch === "’" ? "'" : "?")).join("");

  let page: PDFPage = doc.addPage([A4.l, A4.h]);
  let y = A4.h - MARGE;
  const ecrire = (texte: string, x: number, taille = 10, police: PDFFont = normal, couleur = NOIR) => page.drawText(propre(texte), { x, y, size: taille, font: police, color: couleur });
  const aDroite = (texte: string, xDroite: number, taille = 10, police: PDFFont = normal) => {
    const t = propre(texte);
    page.drawText(t, { x: xDroite - police.widthOfTextAtSize(t, taille), y, size: taille, font: police, color: NOIR });
  };
  /** Découpe un texte en lignes qui tiennent dans la largeur donnée. */
  const lignes = (texte: string, largeur: number, taille: number, police: PDFFont = normal) => {
    const sortie: string[] = [];
    let courante = "";
    for (const mot of propre(texte).split(" ")) {
      const essai = courante ? `${courante} ${mot}` : mot;
      if (police.widthOfTextAtSize(essai, taille) > largeur && courante) {
        sortie.push(courante);
        courante = mot;
      } else courante = essai;
    }
    if (courante) sortie.push(courante);
    return sortie;
  };
  const place = (hauteur: number) => {
    if (y - hauteur < MARGE) {
      page = doc.addPage([A4.l, A4.h]);
      y = A4.h - MARGE;
    }
  };

  // En-tête : numéro et dates.
  ecrire("FACTURE", MARGE, 22, gras, VIOLET);
  aDroite(`N° ${f.numero}`, A4.l - MARGE, 12, gras);
  y -= 18;
  aDroite(`Émise le ${dateFr(f.emiseLe)}`, A4.l - MARGE, 10);
  y -= 14;
  aDroite(`Échéance : ${dateFr(f.echeance)}`, A4.l - MARGE, 10);
  y -= 30;

  // Vendeur et client, côte à côte.
  const colonne = (titre: string, contenu: (string | null)[], x: number) => {
    let yy = y;
    page.drawText(propre(titre), { x, y: yy, size: 9, font: gras, color: GRIS });
    yy -= 14;
    for (const l of contenu.filter((v): v is string => !!v)) {
      for (const morceau of lignes(l, 230, 10)) {
        page.drawText(morceau, { x, y: yy, size: 10, font: normal, color: NOIR });
        yy -= 13;
      }
    }
    return yy;
  };
  const v = f.vendeur;
  const c = f.client;
  const finVendeur = colonne("ÉMETTEUR", [v.raisonSociale ?? v.nom, v.raisonSociale ? v.nom : null, v.adresse, `SIRET ${v.siret}`, `TVA ${v.tvaIntracom}`], MARGE);
  const finClient = colonne("CLIENT", [c.nom, c.adresse, c.siret ? `SIRET ${c.siret}` : null, c.tvaIntracom ? `TVA ${c.tvaIntracom}` : null], A4.l / 2 + 10);
  y = Math.min(finVendeur, finClient) - 16;
  for (const l of lignes(`Objet : ${f.objet}`, A4.l - 2 * MARGE, 10, gras)) {
    page.drawText(l, { x: MARGE, y, size: 10, font: gras, color: NOIR });
    y -= 14;
  }
  y -= 10;

  // Lignes de la facture.
  const X = { qte: 340, pu: 420, tva: 470, total: A4.l - MARGE };
  const entete = () => {
    page.drawRectangle({ x: MARGE - 4, y: y - 5, width: A4.l - 2 * MARGE + 8, height: 18, color: rgb(0.94, 0.93, 1) });
    ecrire("Désignation", MARGE, 9, gras);
    aDroite("Qté", X.qte, 9, gras);
    aDroite("PU HT", X.pu, 9, gras);
    aDroite("TVA", X.tva, 9, gras);
    aDroite("Total HT", X.total, 9, gras);
    y -= 20;
  };
  entete();
  for (const l of f.lignes) {
    const texte = lignes(l.libelle, 260, 10);
    place(texte.length * 13 + 6);
    aDroite(String(l.quantite), X.qte);
    aDroite(formaterMontant(l.prixUnitaireHt), X.pu);
    aDroite(libelleTauxTva(l.tauxTva), X.tva);
    aDroite(formaterMontant(l.totalHt), X.total);
    for (const morceau of texte) {
      page.drawText(morceau, { x: MARGE, y, size: 10, font: normal, color: NOIR });
      y -= 13;
    }
    y -= 4;
  }

  // Totaux, par taux puis général.
  place(40 + f.parTaux.length * 14);
  y -= 6;
  page.drawLine({ start: { x: A4.l / 2, y: y + 8 }, end: { x: A4.l - MARGE, y: y + 8 }, thickness: 0.6, color: GRIS });
  for (const t of f.parTaux) {
    ecrire(`TVA ${libelleTauxTva(t.taux)} sur ${formaterMontant(t.ht)}`, A4.l / 2, 9, normal, GRIS);
    aDroite(formaterMontant(t.tva), X.total, 9);
    y -= 14;
  }
  for (const [libelle, montant, police] of [
    ["Total HT", f.totalHt, normal],
    ["Total TVA", f.totalTva, normal],
    ["Total TTC", f.totalTtc, gras],
  ] as const) {
    ecrire(libelle, A4.l / 2, 11, police);
    aDroite(formaterMontant(montant), X.total, 11, police);
    y -= 16;
  }
  y -= 14;

  // Mentions (règlement, pénalités…).
  for (const m of f.mentions) {
    for (const morceau of lignes(m, A4.l - 2 * MARGE, 8.5)) {
      place(12);
      page.drawText(morceau, { x: MARGE, y, size: 8.5, font: normal, color: GRIS });
      y -= 11;
    }
    y -= 3;
  }
  return doc.save();
}
