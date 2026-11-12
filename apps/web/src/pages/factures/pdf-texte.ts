import type { TextePdf } from "@flaix/domain";

/**
 * Texte positionné d'une facture PDF (§15.178), lu dans le navigateur : la facture ne quitte pas le poste pour être lue.
 * pdf.js n'est chargé qu'à la première facture PDF, pour ne pas alourdir les autres écrans.
 */
export async function textePdf(fichier: File): Promise<TextePdf[]> {
  const [pdfjs, travailleur] = await Promise.all([import("pdfjs-dist"), import("pdfjs-dist/build/pdf.worker.min.mjs?url")]);
  pdfjs.GlobalWorkerOptions.workerSrc = travailleur.default;
  const chargement = pdfjs.getDocument({ data: new Uint8Array(await fichier.arrayBuffer()) });
  try {
    const doc = await chargement.promise;
    const morceaux: TextePdf[] = [];
    for (let p = 1; p <= Math.min(doc.numPages, 40); p++) {
      const { items } = await (await doc.getPage(p)).getTextContent();
      for (const i of items) if ("str" in i && i.str.trim()) morceaux.push({ page: p, x: i.transform[4], y: i.transform[5], texte: i.str });
    }
    return morceaux;
  } finally {
    await chargement.destroy();
  }
}
