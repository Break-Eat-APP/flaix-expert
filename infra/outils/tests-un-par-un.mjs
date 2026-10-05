// Tests du serveur, un fichier par processus : pour un poste à peu de mémoire (6 Go), où la suite lancée d'un bloc
// peut faire tomber Node (« out of memory »). Chaque fichier repart d'une base de test neuve. Résumé à la fin.
// Usage (depuis apps/api) : pnpm test:un-par-un
import { readdirSync } from "node:fs";
import { spawnSync } from "node:child_process";

const fichiers = readdirSync("test").filter((f) => f.endsWith(".test.ts")).sort();
const echecs = [];
for (const f of fichiers) {
  console.log(`\n=== ${f}`);
  const r = spawnSync("npx", ["vitest", "run", `test/${f}`, "--pool=forks", "--maxWorkers=1"], { stdio: "inherit", shell: true });
  if (r.status !== 0) echecs.push(f);
}
console.log(echecs.length ? `\nFichiers en échec (${echecs.length}) : ${echecs.join(", ")}` : `\nTous les fichiers passent (${fichiers.length}).`);
process.exit(echecs.length ? 1 : 0);
