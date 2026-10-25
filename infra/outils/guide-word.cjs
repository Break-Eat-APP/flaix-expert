#!/usr/bin/env node
/**
 * Version Word des documents de reprise (dossier §15.175) : régénère, depuis leur Markdown,
 *   - docs/developpement/GUIDE_DE_REPRISE.docx
 *   - docs/audits/<dernier audit>.docx (le plus récent de docs/audits/AUDIT_*.md)
 * À lancer après chaque modification de ces documents : `node infra/outils/guide-word.cjs`.
 */
const fs = require("node:fs");
const path = require("node:path");
const { mdVersDocx } = require("./md-vers-docx.cjs");

const racine = path.resolve(__dirname, "..", "..");
const audits = fs
  .readdirSync(path.join(racine, "docs", "audits"))
  .filter((f) => /^AUDIT_.*\.md$/.test(f))
  .sort();
const documents = [
  { md: path.join(racine, "docs", "developpement", "GUIDE_DE_REPRISE.md"), enTete: "FlaiX Expert — guide de reprise pour un développeur" },
  ...(audits.length ? [{ md: path.join(racine, "docs", "audits", audits.at(-1)), enTete: `FlaiX Expert — ${audits.at(-1).replace(/\.md$/, "")}` }] : []),
];

(async () => {
  for (const d of documents) {
    const docx = await mdVersDocx(fs.readFileSync(d.md, "utf8"), d.enTete);
    const sortie = d.md.replace(/\.md$/, ".docx");
    fs.writeFileSync(sortie, docx);
    console.log(`Word : ${path.relative(racine, sortie)}`);
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
