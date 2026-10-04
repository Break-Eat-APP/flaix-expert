/**
 * Génère, à partir de Git, les documents de suivi du développement (même méthode que Break Eat) :
 *   - CHANGELOG.md                              : chaque commit, sa date, son lien GitHub, ses fichiers ;
 *   - docs/developpement/JOURNAL_DES_PHASES.md  : chaque phase, sa décision (§ du dossier), ses
 *     migrations, son code, ses tests et ses commits ;
 *   - docs/developpement/CARTE_DU_CODE.md       : où trouver quoi, avec la ligne exacte des fonctions clés.
 * À relancer après chaque phase :  node infra/outils/journal-developpement.cjs
 * Une phase nouvelle s'ajoute dans PHASES ci-dessous (ses commits par leur hash court).
 */
const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const racine = path.join(__dirname, "..", "..");
const DEPOT = "https://github.com/Break-Eat-APP/flaix-expert";
const git = (...a) => execFileSync("git", a, { cwd: racine, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });

const PHASES = [
  { n: 0, titre: "Socle de production et configuration d'un lieu vide", dossier: "§15.93", commits: ["4a205cb", "40693c8"] },
  { n: 1, titre: "Matchs, caisse, Mes caisses, journal des tickets", dossier: "§15.94", commits: ["f454873"] },
  { n: 2, titre: "Retour de démonstration, organisation en 6 entrées, maquettes", dossier: "§15.95, §15.96, §15.98", commits: ["9c7d7a9", "0ef6cf1", "26237fc", "0219e7e", "6f272dd", "c3c6168"] },
  { n: 3, titre: "Vente sans réseau : la tablette scelle, le serveur vérifie", dossier: "§15.97", commits: ["6fb5840"] },
  { n: 4, titre: "Serveur de test OVH", dossier: "guide-serveur-test-ovh.md", commits: ["249f3f5", "ef7c9fa"] },
  { n: 5, titre: "Comptes des caissières et tablettes enregistrées", dossier: "§15.99, §15.100", commits: ["d51b910", "3f03ee8", "9253115", "9324475"] },
  { n: 6, titre: "Ticket client sur demande et duplicata", dossier: "§15.101", commits: ["911d4b3"] },
  { n: 7, titre: "Clôture du match : Z des tiroirs, rectification signée", dossier: "§15.102", commits: ["c8e6246", "3398ccb", "d3670c6"] },
  { n: 8, titre: "Résultats sur les vraies ventes", dossier: "§15.103", commits: ["d0985d1", "d29e769", "d3194ab"] },
  { n: 9, titre: "Équipe : fiches, planning, masse salariale", dossier: "§15.104", commits: ["40c3f7b", "bbf7f4b", "3509f19"] },
  { n: 10, titre: "Stock : réserve, livraisons au CUMP, mise en place, comptage", dossier: "§15.105", commits: ["d8163c3", "292fe39", "9b43fdd"] },
  { n: 11, titre: "Remontées au coffre et Z du coffre", dossier: "§15.106", commits: ["27be12a", "4aa3109", "2ba4293", "69d161f"] },
  { n: 12, titre: "Clôtures mensuelle et annuelle, total perpétuel", dossier: "§15.107", commits: ["8b02048", "1141f9c", "284f366"] },
  { n: 13, titre: "Exercice par lieu, sauvegardes chiffrées hors serveur", dossier: "§15.108", commits: ["8542bbf", "43fd2f2", "8903b24", "ec9398d"] },
  { n: 14, titre: "Mode formation « FACTICE »", dossier: "§15.109", commits: ["019dbcd", "4711c41", "7c65a1b"] },
  { n: 15, titre: "Export pour l'expert-comptable", dossier: "§15.110", commits: ["187fdf5", "7429ef2"] },
  { n: 16, titre: "Click & Collect : moteur de prix et catalogue", dossier: "§15.111", commits: ["07e608a", "c969d9f", "d9708e0", "d5c624d"] },
  { n: 17, titre: "Vue téléphone « En direct »", dossier: "§15.112", commits: ["8fec2c4"] },
  { n: 18, titre: "Coûts par buvette", dossier: "§15.113", commits: ["66936e8", "5a2fe6a"] },
  { n: 19, titre: "Fidélité, partie gestion", dossier: "§15.114", commits: ["e110233", "f9ce7f4", "bd1b604"] },
  { n: 20, titre: "Factures fournisseurs", dossier: "§15.115", commits: ["be6307c", "e847e75"] },
  { n: 21, titre: "Back-office éditeur, niveau 1", dossier: "§15.116", commits: ["e83eaf3", "a698a23"] },
  { n: 22, titre: "Décisions du 2026-10-01 et recettes", dossier: "§15.117, §15.119", commits: ["3abfb38", "92de462", "c6aae54", "929f16a"] },
  { n: 23, titre: "Options par lieu, application installable, logo", dossier: "§15.118", commits: ["80c5742", "0579d24", "9287bce"] },
  { n: 24, titre: "Adresse du site flaixexpert.flaixlabs.com", dossier: "§15.120", commits: ["e18b9ea", "f6a4820"] },
  { n: 25, titre: "Marque FlaiX Expert ; lieux et directeurs depuis le back-office ; mots de passe", dossier: "§15.121, §15.122", commits: ["c694bbe", "66326dc", "d8d7990"] },
  { n: 26, titre: "Click & Collect neutre, export comptable dans la base, assiette de la commission", dossier: "§15.123, §15.124", commits: ["3979502", "7294651"] },
  { n: 27, titre: "Stock des ingrédients au choix (bière pression)", dossier: "§15.125", commits: ["f5a8b5a"] },
  { n: 28, titre: "Logo officiel v2", dossier: "—", commits: ["1259fb6"] },
  { n: 29, titre: "Dossier de conformité v0.1", dossier: "§15.126", commits: ["f75e8a7", "d26e10e"] },
  { n: 30, titre: "Fidélité à la caisse : code promo et points dans le ticket scellé", dossier: "§15.127", commits: ["87c46b8"] },
  { n: 31, titre: "Suivi du développement et préparation de l'audit Codex", dossier: "§15.128", commits: ["0b59036"] },
];

/** Fonctions et routes clés : la carte du code donne leur ligne exacte (recalculée à chaque génération). */
const CLES = [
  ["Scellement", "packages/domain/src/chaine.ts", ["jsonCanonique", "calculerEmpreinte", "verifierChaine"]],
  ["Scellement", "packages/domain/src/journal-caisse.ts", ["champsScellesCaisse", "empreinteCaisse"]],
  ["Vente sans réseau", "packages/domain/src/caisse-scellee.ts", ["scellerVente", "scellerAnnulation", "controlerEvenementTablette", "apercuFidelite"]],
  ["Calcul du ticket", "packages/domain/src/ticket.ts", ["calculerTicket", "erreurAjustement", "numeroJustificatif"]],
  ["Journal technique", "packages/domain/src/journal-technique.ts", ["TYPES_JET"]],
  ["Journal technique", "apps/api/src/journal-technique.ts", ["inscrireJet", "verifierJet"]],
  ["Journal de caisse", "apps/api/src/journal-caisse.ts", ["inscrireEvenementTablette", "verifierCaisses"]],
  ["Base et isolement", "apps/api/src/base.ts", ["transaction", "changerLieu", "verrouiller"]],
  ["Accès", "apps/api/src/auth/contexte.ts", ["exigerSession", "exigerAccesCaisse", "exigerDirecteur"]],
  ["Formation", "apps/api/src/serveur.ts", ["CONFIGURATION"]],
  ["Caisse (serveur)", "apps/api/src/routes/caisse.ts", ["/api/caisses/:id/journal", "/api/caisses/:id/ouverture", "/api/caisses/:id/cloture", "insererLignes"]],
  ["Clôtures", "apps/api/src/routes/evenements.ts", ["/api/evenements/:id/cloture"]],
  ["Clôtures", "apps/api/src/routes/periodes.ts", ["zDuMatch", "verifierClotures"]],
  ["Stock", "packages/domain/src/stock.ts", ["cump", "alerteStock", "suggestionMiseEnPlace"]],
  ["Stock", "apps/api/src/routes/stock.ts", ["stockDuMatch", "restesDuMatch"]],
  ["Stock des ingrédients", "apps/api/src/routes/stock-ingredients.ts", ["stockIngredientsDuMatch", "figerConsommationIngredients"]],
  ["Recettes", "apps/api/src/routes/recettes.ts", ["recalculerCoutsRecettes", "aUneRecette"]],
  ["Click & Collect", "packages/domain/src/click-collect.ts", ["prixAppExact", "resteApp", "cascadeEncaissement"]],
  ["Fidélité", "packages/domain/src/fidelite.ts", ["remiseCodePromo", "etatCodePromo", "pointsDuTicket"]],
  ["Fidélité à la caisse", "apps/api/src/routes/fidelite-caisse.ts", ["soldePoints", "consommerFidelite", "/api/caisses/:id/fidelite/points", "/api/caisses/:id/fidelite/codes"]],
  ["Back-office", "apps/api/src/routes/editeur.ts", ["exigerEditeur", "/api/editeur/lieux", "/api/editeur/lieux/:id/verification"]],
  ["Options", "packages/domain/src/editeur.ts", ["optionDeLaRoute", "OPTIONS_LIEU"]],
  ["Mots de passe", "packages/domain/src/mot-de-passe.ts", ["refusMotDePasse"]],
  ["Tablette", "apps/web/src/pages/caisse/memoire.ts", ["memoriserTicket", "envoyer"]],
];

const commitsTous = git("log", "--reverse", "--date=short", "--pretty=format:%H|%h|%ad|%s").trim().split("\n").map((l) => {
  const [hash, court, date, ...m] = l.split("|");
  return { hash, court, date, sujet: m.join("|") };
});
const parCourt = new Map(commitsTous.map((c) => [c.court, c]));
const fichiersDe = (hash) =>
  git("show", "--name-status", "--format=", hash)
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((l) => {
      const [statut, ...p] = l.split("\t");
      return { statut: statut[0], chemin: p[p.length - 1] };
    });
const lienCommit = (c) => `[\`${c.court}\`](${DEPOT}/commit/${c.hash})`;
const lienFichier = (p, profondeur) => `[\`${p}\`](${"../".repeat(profondeur)}${p.replace(/ /g, "%20")})`;
const STATUT = { A: "créé", M: "modifié", D: "supprimé", R: "renommé" };

// ---------------------------------------------------------------- CHANGELOG
const sortie = [];
sortie.push("# CHANGELOG — FlaiX Expert", "");
sortie.push("> Généré par `node infra/outils/journal-developpement.cjs` à partir de Git. Ne pas modifier à la main.");
sortie.push(`> Chaque entrée : date, commit (lien GitHub), message, fichiers créés ou modifiés. Le plus récent en premier. Phases : [docs/developpement/JOURNAL_DES_PHASES.md](docs/developpement/JOURNAL_DES_PHASES.md).`, "");
let jour = "";
for (const c of [...commitsTous].reverse()) {
  if (c.date !== jour) {
    jour = c.date;
    sortie.push(`## ${jour}`, "");
  }
  const phase = PHASES.find((p) => p.commits.includes(c.court));
  sortie.push(`### ${lienCommit(c)} — ${c.sujet}${phase ? ` *(phase ${phase.n})*` : ""}`, "");
  for (const f of fichiersDe(c.hash)) sortie.push(`- ${STATUT[f.statut] ?? f.statut} : \`${f.chemin}\``);
  sortie.push("");
}
fs.writeFileSync(path.join(racine, "CHANGELOG.md"), sortie.join("\n"));

// ---------------------------------------------------------------- Journal des phases
const classer = (p) =>
  p.startsWith("db/migrations/") ? "migrations"
  : /\.test\.ts$/.test(p) ? "tests"
  : p.startsWith("apps/api/") ? "serveur"
  : p.startsWith("apps/web/") ? "ecrans"
  : p.startsWith("packages/domain/") ? "moteur"
  : p.startsWith("infra/") ? "infra"
  : p.startsWith("docs/") || p.endsWith(".md") ? "docs"
  : "autres";
const LIBELLES = { migrations: "Migrations (base)", moteur: "Moteur de calcul (packages/domain)", serveur: "Serveur (apps/api)", ecrans: "Écrans (apps/web)", tests: "Tests", infra: "Serveur et outils (infra)", docs: "Documentation", autres: "Autres" };

const j = [];
j.push("# Journal des phases de développement — FlaiX Expert", "");
j.push("> Généré par `node infra/outils/journal-developpement.cjs` à partir de Git : à relancer après chaque phase. Ne pas modifier à la main (ajouter la phase dans le script).");
j.push("> Pour chaque phase : la **décision** (section du dossier projet `docs/flaix-gestion-dossier-projet.md`), les **commits** (liens GitHub), puis les fichiers touchés, rangés par couche. Les règles du projet sont dans [`AGENTS.md`](../../AGENTS.md), la carte du code dans [`CARTE_DU_CODE.md`](CARTE_DU_CODE.md).", "");
j.push("| Phase | Sujet | Décision | Commits | État |", "|---|---|---|---|---|");
for (const p of PHASES) {
  const cs = p.commits.map((h) => parCourt.get(h)).filter(Boolean);
  j.push(`| ${p.n} | [${p.titre}](#phase-${p.n}) | ${p.dossier} | ${cs.map(lienCommit).join(" ")} | ${p.etat ? "en cours" : "livrée"} |`);
}
j.push("");
for (const p of PHASES) {
  const cs = p.commits.map((h) => parCourt.get(h)).filter(Boolean);
  j.push(`<a id="phase-${p.n}"></a>`, `## Phase ${p.n} — ${p.titre}`, "");
  j.push(`- **Dates** : ${[...new Set(cs.map((c) => c.date))].join(", ")}`);
  j.push(`- **Décision et raisonnement** : dossier projet ${p.dossier}`);
  j.push(`- **État** : ${p.etat ?? "livrée (tests au vert au moment du commit)"}`);
  j.push("- **Commits** :");
  for (const c of cs) j.push(`  - ${lienCommit(c)} ${c.date} — ${c.sujet}`);
  const fichiers = new Map();
  for (const c of cs) for (const f of fichiersDe(c.hash)) if (!fichiers.has(f.chemin) || f.statut === "A") fichiers.set(f.chemin, f.statut);
  const groupes = {};
  for (const [chemin, statut] of fichiers) (groupes[classer(chemin)] ??= []).push({ chemin, statut });
  for (const g of Object.keys(LIBELLES)) {
    if (!groupes[g]) continue;
    j.push(`- **${LIBELLES[g]}** :`);
    for (const f of groupes[g].sort((a, b) => a.chemin.localeCompare(b.chemin))) {
      const existe = fs.existsSync(path.join(racine, f.chemin));
      j.push(`  - ${existe ? lienFichier(f.chemin, 2) : `\`${f.chemin}\` (n'existe plus)`} — ${STATUT[f.statut] ?? f.statut}`);
    }
  }
  j.push("");
}
const horsPhase = commitsTous.filter((c) => !PHASES.some((p) => p.commits.includes(c.court)));
if (horsPhase.length) {
  j.push("## Commits non rattachés à une phase", "");
  for (const c of horsPhase) j.push(`- ${lienCommit(c)} ${c.date} — ${c.sujet}`);
  j.push("");
}
fs.mkdirSync(path.join(racine, "docs", "developpement"), { recursive: true });
fs.writeFileSync(path.join(racine, "docs", "developpement", "JOURNAL_DES_PHASES.md"), j.join("\n"));

// ---------------------------------------------------------------- Carte du code (lignes exactes)
const tete = git("rev-parse", "HEAD").trim();
const intro = fs.readFileSync(path.join(__dirname, "carte-du-code-intro.md"), "utf8");
const k = [intro.trimEnd(), "", "## Fonctions et routes clés — ligne exacte", ""];
k.push(`> Lignes relevées sur le commit [\`${tete.slice(0, 7)}\`](${DEPOT}/commit/${tete}) ; le lien GitHub pointe sur ce commit, le lien local sur le fichier actuel.`, "");
k.push("| Sujet | Fichier | Symbole | Ligne |", "|---|---|---|---|");
for (const [sujet, fichier, symboles] of CLES) {
  const chemin = path.join(racine, fichier);
  if (!fs.existsSync(chemin)) continue;
  const lignes = fs.readFileSync(chemin, "utf8").split("\n");
  for (const s of symboles) {
    const route = s.startsWith("/api/");
    const i = lignes.findIndex((l) =>
      route
        ? l.includes(`"${s}"`) && /app\.(get|post|put|patch|delete)\(/.test(l)
        : new RegExp(`(function|const|let|class|interface|type)\\s+${s}\\b|async function ${s}\\b|export async function ${s}\\b`).test(l) || new RegExp(`^\\s*(async\\s+)?${s}\\s*[(<]`).test(l),
    );
    if (i < 0) continue;
    k.push(`| ${sujet} | \`${fichier}\` | \`${s}\` | [${i + 1}](${DEPOT}/blob/${tete}/${fichier}#L${i + 1}) · [local](../../${fichier}) |`);
  }
}
k.push("");
fs.writeFileSync(path.join(racine, "docs", "developpement", "CARTE_DU_CODE.md"), k.join("\n"));
console.log(`CHANGELOG : ${commitsTous.length} commits · phases : ${PHASES.length} · hors phase : ${horsPhase.length}`);
