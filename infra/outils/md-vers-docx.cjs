/**
 * Markdown → document Word (.docx), sans Word : bibliothèque `docx`. Gère le sous-ensemble utilisé par
 * les documents du projet : titres, paragraphes, gras, italique, code, liens, listes (deux niveaux),
 * tableaux, citations, blocs de code. Utilisé par phases-word.cjs.
 */
const {
  AlignmentType,
  BorderStyle,
  Document,
  ExternalHyperlink,
  Footer,
  Header,
  HeadingLevel,
  LevelFormat,
  Packer,
  PageNumber,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} = require("docx");

const VIOLET = "4D04F4";
const LARGEUR = 11906 - 2 * 1134; // A4 moins 2 cm de marge de chaque côté, en vingtièmes de point
const POLICE = "Calibri";
const CODE = "Consolas";

/** Gras, italique, code et liens d'une ligne → morceaux de texte Word. */
function enLigne(texte, base = {}) {
  const morceaux = [];
  const re = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)\s]+\)|(?<![\w*])\*[^*\s][^*]*?\*(?![\w*]))/g;
  let dernier = 0;
  for (const m of texte.matchAll(re)) {
    if (m.index > dernier) morceaux.push(new TextRun({ text: texte.slice(dernier, m.index), ...base }));
    const t = m[0];
    if (t.startsWith("**")) morceaux.push(...enLigne(t.slice(2, -2), { ...base, bold: true }));
    else if (t.startsWith("`")) morceaux.push(new TextRun({ text: t.slice(1, -1), ...base, font: CODE, size: 18, color: "3B2F8F" }));
    else if (t.startsWith("[")) {
      const [, libelle, url] = t.match(/^\[([^\]]+)\]\(([^)\s]+)\)$/);
      if (/^https?:/.test(url)) morceaux.push(new ExternalHyperlink({ link: url, children: [new TextRun({ text: libelle.replace(/`/g, ""), ...base, style: "Hyperlink" })] }));
      else morceaux.push(...enLigne(libelle, base));
    } else morceaux.push(...enLigne(t.slice(1, -1), { ...base, italics: true }));
    dernier = m.index + t.length;
  }
  if (dernier < texte.length) morceaux.push(new TextRun({ text: texte.slice(dernier), ...base }));
  return morceaux;
}

const bordure = { style: BorderStyle.SINGLE, size: 4, color: "D9D3F7" };
const bordures = { top: bordure, bottom: bordure, left: bordure, right: bordure };

function tableau(rangs) {
  const cellules = (r) => r.replace(/^\|/, "").replace(/\|\s*$/, "").split("|").map((c) => c.trim());
  const tete = cellules(rangs[0]);
  const corps = rangs.slice(2).map(cellules);
  const n = tete.length;
  const largeurs = Array.from({ length: n }, () => Math.floor(LARGEUR / n));
  largeurs[n - 1] += LARGEUR - largeurs.reduce((a, b) => a + b, 0);
  const rang = (valeurs, entete) =>
    new TableRow({
      tableHeader: entete,
      children: largeurs.map(
        (w, i) =>
          new TableCell({
            width: { size: w, type: WidthType.DXA },
            borders: bordures,
            shading: entete ? { fill: "EFEAFE", type: ShadingType.CLEAR, color: "auto" } : undefined,
            margins: { top: 50, bottom: 50, left: 90, right: 90 },
            children: [new Paragraph({ children: enLigne(valeurs[i] ?? "", { size: 18, bold: entete || undefined }) })],
          }),
      ),
    });
  return new Table({ width: { size: LARGEUR, type: WidthType.DXA }, columnWidths: largeurs, rows: [rang(tete, true), ...corps.map((r) => rang(r, false))] });
}

function blocs(md, listes) {
  const lignes = md.replace(/\r\n/g, "\n").split("\n");
  const sortie = [];
  let i = 0;
  const debutBloc = /^(#{1,4}\s|\||>|```|---\s*$|\s*[-*]\s|\d+\.\s|<a id=)/;
  while (i < lignes.length) {
    const l = lignes[i];
    if (/^\s*$/.test(l) || /^<a id=/.test(l)) { i++; continue; }
    if (/^```/.test(l)) {
      const bloc = [];
      i++;
      while (i < lignes.length && !/^```/.test(lignes[i])) bloc.push(lignes[i++]);
      i++;
      for (const b of bloc.length ? bloc : [""]) {
        sortie.push(new Paragraph({ shading: { fill: "F6F5FB", type: ShadingType.CLEAR, color: "auto" }, spacing: { after: 0 }, children: [new TextRun({ text: b || " ", font: CODE, size: 16 })] }));
      }
      sortie.push(new Paragraph({ children: [] }));
      continue;
    }
    if (/^---\s*$/.test(l)) {
      sortie.push(new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "D9D3F7", space: 1 } }, children: [] }));
      i++;
      continue;
    }
    const h = l.match(/^(#{1,4})\s+(.*)$/);
    if (h) {
      const niveaux = [HeadingLevel.HEADING_1, HeadingLevel.HEADING_2, HeadingLevel.HEADING_3, HeadingLevel.HEADING_4];
      sortie.push(new Paragraph({ heading: niveaux[h[1].length - 1], children: enLigne(h[2]) }));
      i++;
      continue;
    }
    if (l.startsWith("|")) {
      const rangs = [];
      while (i < lignes.length && lignes[i].startsWith("|")) rangs.push(lignes[i++]);
      if (rangs.length >= 2) sortie.push(tableau(rangs), new Paragraph({ children: [] }));
      continue;
    }
    if (l.startsWith(">")) {
      const bloc = [];
      while (i < lignes.length && lignes[i].startsWith(">")) bloc.push(lignes[i++].replace(/^>\s?/, ""));
      sortie.push(
        new Paragraph({
          shading: { fill: "F6F3FF", type: ShadingType.CLEAR, color: "auto" },
          border: { left: { style: BorderStyle.SINGLE, size: 18, color: VIOLET, space: 6 } },
          children: enLigne(bloc.join(" ")),
        }),
      );
      continue;
    }
    const liste = (re, reference) => {
      while (i < lignes.length && re.test(lignes[i])) {
        let item = lignes[i++].replace(re, "");
        const sous = [];
        while (i < lignes.length && /^\s{2,}\S/.test(lignes[i]) && !re.test(lignes[i])) {
          if (/^\s+[-*]\s+/.test(lignes[i])) sous.push(lignes[i].replace(/^\s+[-*]\s+/, ""));
          else if (sous.length) sous[sous.length - 1] += " " + lignes[i].trim();
          else item += " " + lignes[i].trim();
          i++;
        }
        sortie.push(new Paragraph({ numbering: { reference, level: 0 }, children: enLigne(item) }));
        for (const s of sous) sortie.push(new Paragraph({ numbering: { reference: "puces", level: 1 }, children: enLigne(s) }));
      }
    };
    if (/^[-*]\s+/.test(l)) { liste(/^[-*]\s+/, "puces"); continue; }
    if (/^\d+\.\s+/.test(l)) {
      listes.push(`numeros-${i}`);
      liste(/^\d+\.\s+/, `numeros-${i}`);
      continue;
    }
    const para = [l];
    i++;
    while (i < lignes.length && !/^\s*$/.test(lignes[i]) && !debutBloc.test(lignes[i])) para.push(lignes[i++]);
    sortie.push(new Paragraph({ children: enLigne(para.join(" ")) }));
  }
  return sortie;
}

/** Le document Word d'un texte Markdown. `enTete` : texte de l'en-tête de page. */
async function mdVersDocx(md, enTete) {
  // Chaque liste numérotée repart à 1 : une référence de numérotation par liste.
  const listes = [];
  const enfants = blocs(md, listes);
  const numerotation = [
    {
      reference: "puces",
      levels: [
        { level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 270 } } } },
        { level: 1, format: LevelFormat.BULLET, text: "◦", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 1000, hanging: 270 } } } },
      ],
    },
    ...listes.map((reference) => ({
      reference,
      levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 300 } } } }],
    })),
  ];
  const doc = new Document({
    creator: "FlaiX Expert",
    title: enTete,
    styles: {
      default: { document: { run: { font: POLICE, size: 21 }, paragraph: { spacing: { after: 100, line: 276 } } } },
      paragraphStyles: [
        { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 36, bold: true, color: VIOLET, font: POLICE }, paragraph: { spacing: { before: 120, after: 160 }, outlineLevel: 0 } },
        { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 28, bold: true, color: VIOLET, font: POLICE }, paragraph: { spacing: { before: 280, after: 120 }, outlineLevel: 1 } },
        { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 24, bold: true, color: "2B2540", font: POLICE }, paragraph: { spacing: { before: 200, after: 80 }, outlineLevel: 2 } },
        { id: "Heading4", name: "Heading 4", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 22, bold: true, color: "2B2540", font: POLICE }, paragraph: { spacing: { before: 160, after: 60 }, outlineLevel: 3 } },
      ],
    },
    numbering: { config: numerotation },
    sections: [
      {
        properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1134, bottom: 1134, left: 1134, right: 1134 } } },
        headers: { default: new Header({ children: [new Paragraph({ children: [new TextRun({ text: enTete, size: 16, color: "808080" })] })] }) },
        footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ children: ["Page ", PageNumber.CURRENT, " / ", PageNumber.TOTAL_PAGES], size: 16, color: "808080" })] })] }) },
        children: enfants,
      },
    ],
  });
  return Packer.toBuffer(doc);
}

module.exports = { mdVersDocx };
