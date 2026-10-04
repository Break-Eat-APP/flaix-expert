/**
 * Dossier de développement par phase, pour un développeur qui reprend le projet (même principe que
 * les « phases générées » de Break Eat) : un document par phase, en Markdown et en Word.
 *   docs/developpement/phases/PHASE_NN_TITRE.md
 *   docs/developpement/phases/word/PHASE_NN_TITRE.docx     (bibliothèque docx : Word n'est pas nécessaire)
 * Contenu : la décision et son raisonnement (texte du dossier projet), les commits (liens GitHub), les
 * fichiers par couche, les cas de test, et comment reprendre. Généré depuis Git : à relancer après chaque
 * phase (node infra/outils/phases-word.cjs), après journal-developpement.cjs.
 */
const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const { PHASES } = require("./phases.cjs");
const { mdVersDocx } = require("./md-vers-docx.cjs");

const racine = path.join(__dirname, "..", "..");
const DEPOT = "https://github.com/Break-Eat-APP/flaix-expert";
const git = (...a) => execFileSync("git", a, { cwd: racine, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
const dossier = fs.readFileSync(path.join(racine, "docs", "flaix-gestion-dossier-projet.md"), "utf8").split("\n");
const aujourdhui = new Date().toLocaleDateString("fr-CA", { timeZone: "Europe/Paris" });

const commits = new Map(
  git("log", "--date=short", "--pretty=format:%H|%h|%ad|%s").trim().split("\n").map((l) => {
    const [hash, court, date, ...m] = l.split("|");
    return [court, { hash, court, date, sujet: m.join("|") }];
  }),
);
const fichiersDe = (hash) =>
  git("show", "--name-status", "--format=", hash).trim().split("\n").filter(Boolean).map((l) => {
    const [statut, ...p] = l.split("\t");
    return { statut: statut[0], chemin: p[p.length - 1] };
  });

/** Texte d'une section « ### 15.x » du dossier projet, jusqu'à la section suivante de même niveau. */
function section(numero) {
  const i = dossier.findIndex((l) => l.startsWith(`### ${numero} `));
  if (i < 0) return null;
  let f = i + 1;
  while (f < dossier.length && !/^#{1,3}\s/.test(dossier[f])) f++;
  return dossier.slice(i, f).join("\n").trim();
}

const COUCHES = [
  ["migrations", "Base de données (migrations)", (p) => p.startsWith("db/migrations/")],
  ["tests", "Tests", (p) => /\.test\.ts$/.test(p)],
  ["moteur", "Moteur de calcul (packages/domain)", (p) => p.startsWith("packages/domain/")],
  ["serveur", "Serveur (apps/api)", (p) => p.startsWith("apps/api/")],
  ["ecrans", "Écrans (apps/web)", (p) => p.startsWith("apps/web/")],
  ["infra", "Serveur OVH et outils (infra)", (p) => p.startsWith("infra/")],
  ["docs", "Documentation", (p) => p.startsWith("docs/") || p.endsWith(".md")],
  ["autres", "Autres", () => true],
];
const STATUT = { A: "créé", M: "modifié", D: "supprimé", R: "renommé" };
const slug = (t) =>
  t.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[«»'’"]/g, "").toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_|_$/g, "").slice(0, 70);

/** Noms des cas de test d'un fichier (describe / it), tels qu'ils sont dans le code actuel. */
function casDeTest(fichier) {
  const chemin = path.join(racine, fichier);
  if (!fs.existsSync(chemin)) return [];
  return fs.readFileSync(chemin, "utf8").split("\n").flatMap((l) => {
    const m = l.match(/^\s*(describe|it)\(\s*["'`](.+?)["'`]\s*,/);
    return m ? [{ niveau: m[1], nom: m[2] }] : [];
  });
}

const dossierPhases = path.join(racine, "docs", "developpement", "phases");
const dossierWord = path.join(dossierPhases, "word");
fs.mkdirSync(dossierWord, { recursive: true });
// Tout ou rien (audit P3-001) : les documents sont d'abord produits en mémoire ; les anciens fichiers
// ne sont remplacés qu'une fois chaque document réussi.
const documents = [];

const index = ["# Dossier de développement par phase — FlaiX Expert", "", `> Généré le ${aujourdhui} par \`node infra/outils/phases-word.cjs\` depuis le dépôt. Un document par phase, en Markdown (ici) et en Word (\`word/\`). Règles du projet : [\`AGENTS.md\`](../../../AGENTS.md).`, "", "| Phase | Document | Décision | État |", "|---|---|---|---|"];

for (const p of PHASES) {
  const cs = p.commits.map((h) => commits.get(h)).filter(Boolean);
  const dernier = cs[cs.length - 1];
  const nom = `PHASE_${String(p.n).padStart(2, "0")}_${slug(p.titre)}`;
  const m = [];
  m.push(`# Phase ${p.n} — ${p.titre}`, "");
  m.push(`> FlaiX Expert · dossier de développement · généré le ${aujourdhui} depuis le dépôt [Break-Eat-APP/flaix-expert](${DEPOT}). Règles du projet : \`AGENTS.md\`.`, "");
  m.push("| | |", "|---|---|");
  m.push(`| Dates | ${[...new Set(cs.map((c) => c.date))].sort().join(", ")} |`);
  m.push(`| Décision | dossier projet ${p.dossier} |`);
  m.push(`| État | ${p.etat ?? "livrée, tests au vert au moment du commit"} |`);
  m.push(`| Commits | ${cs.length} |`, "");

  m.push("## 1. Ce qui a été décidé, et pourquoi", "");
  const numeros = [...p.dossier.matchAll(/§(\d+\.\d+)/g)].map((x) => x[1]);
  if (numeros.length === 0) m.push(`Pas de section propre dans le dossier projet (${p.dossier}). Voir les commits ci-dessous.`, "");
  for (const n of numeros) {
    const s = section(n);
    m.push(s ?? `Section §${n} introuvable dans le dossier projet.`, "");
  }

  m.push("## 2. Ce qui a été construit — commits", "");
  for (const c of cs) m.push(`- [\`${c.court}\`](${DEPOT}/commit/${c.hash}) — ${c.date} — ${c.sujet}`);
  m.push("");

  m.push("## 3. Fichiers, par couche", "");
  const fichiers = new Map();
  for (const c of cs) for (const f of fichiersDe(c.hash)) if (!fichiers.has(f.chemin) || f.statut === "A") fichiers.set(f.chemin, f.statut);
  const restants = new Map(fichiers);
  for (const [, libelle, test] of COUCHES) {
    const liste = [...restants].filter(([chemin]) => test(chemin)).sort(([a], [b]) => a.localeCompare(b));
    if (!liste.length) continue;
    m.push(`### ${libelle}`, "");
    for (const [chemin, statut] of liste) {
      restants.delete(chemin);
      const existe = fs.existsSync(path.join(racine, chemin));
      m.push(`- \`${chemin}\` — ${STATUT[statut] ?? statut}${existe && dernier ? ` — [voir sur GitHub](${DEPOT}/blob/${dernier.hash}/${chemin.replace(/ /g, "%20")})` : existe ? "" : " (n'existe plus)"}`);
    }
    m.push("");
  }

  const tests = [...fichiers.keys()].filter((f) => /\.test\.ts$/.test(f) && fichiers.get(f) === "A");
  m.push("## 4. Tests créés dans cette phase", "");
  if (!tests.length) m.push("Aucun fichier de test créé dans cette phase (les tests modifiés figurent dans la section 3).", "");
  for (const t of tests) {
    m.push(`### \`${t}\``, "");
    for (const c of casDeTest(t)) m.push(c.niveau === "describe" ? `- **${c.nom}**` : `  - ${c.nom}`);
    m.push("");
  }

  m.push("## 5. Pour reprendre ou vérifier cette phase", "");
  m.push("1. `pnpm install`, `pnpm db:up` (PostgreSQL local dans Docker), `pnpm db:migrate`.");
  const testsApi = tests.filter((t) => t.startsWith("apps/api/")).map((t) => t.replace("apps/api/", ""));
  const testsMoteur = tests.filter((t) => t.startsWith("packages/domain/")).map((t) => t.replace("packages/domain/", ""));
  if (testsMoteur.length) m.push(`2. Tests du moteur de cette phase : \`cd packages/domain && ./node_modules/.bin/vitest run ${testsMoteur.join(" ")}\`.`);
  if (testsApi.length) m.push(`${testsMoteur.length ? 3 : 2}. Tests contre la base : \`cd apps/api && ./node_modules/.bin/vitest run ${testsApi.join(" ")}\`.`);
  m.push("- Avant toute modification : lire `AGENTS.md` (règles et invariants), puis la section du dossier projet indiquée ci-dessus. Une migration appliquée ne se modifie jamais ; un refus de la base est voulu.");
  m.push("- Ordre de construction complet : `docs/developpement/JOURNAL_DES_PHASES.md` ; où trouver quoi : `docs/developpement/CARTE_DU_CODE.md`.", "");

  const md = m.join("\n");
  documents.push({ nom, md, enTete: `FlaiX Expert — dossier de développement — Phase ${p.n} — ${p.titre}` });
  index.push(`| ${p.n} | [${p.titre}](${nom}.md) · [Word](word/${nom}.docx) | ${p.dossier} | ${p.etat ? "en cours" : "livrée"} |`);
}
(async () => {
  for (const d of documents) d.docx = await mdVersDocx(d.md, d.enTete);
  for (const f of fs.readdirSync(dossierPhases)) if (f.endsWith(".md")) fs.unlinkSync(path.join(dossierPhases, f));
  for (const f of fs.readdirSync(dossierWord)) if (f.endsWith(".docx")) fs.unlinkSync(path.join(dossierWord, f));
  for (const d of documents) {
    fs.writeFileSync(path.join(dossierPhases, `${d.nom}.md`), d.md);
    fs.writeFileSync(path.join(dossierWord, `${d.nom}.docx`), d.docx);
  }
  fs.writeFileSync(path.join(dossierPhases, "README.md"), index.join("\n") + "\n");
  console.log(`${PHASES.length} phases : Markdown et Word dans docs/developpement/phases`);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
