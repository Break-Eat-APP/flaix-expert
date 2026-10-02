/**
 * Outil d'administration FlaiX Expert (éditeur), en attendant le back-office éditeur (§15.13).
 * Il se connecte avec le rôle propriétaire : il ne doit jamais être exposé sur Internet.
 *
 *   pnpm cli creer-lieu --nom "Nom du lieu" --email directeur@exemple.fr --directeur "Prénom Nom"
 *   pnpm cli nouveau-mot-de-passe --email directeur@exemple.fr
 *   pnpm cli creer-editeur --email prenom@flaixlabs.com --nom "Prénom Nom"   (compte du back-office éditeur, §15.116)
 *
 * Un lieu est créé VIDE : aucun stand, aucune caisse, aucun produit. Le directeur construit
 * tout lui-même depuis l'application (exigence du brief de production §1).
 */
import { parseArgs } from "node:util";
import { ouvrirBase } from "../base.ts";
import { config } from "../config.ts";
import { inscrireJet } from "../journal-technique.ts";
import { genererMotDePasseProvisoire, hacherMotDePasse } from "../auth/secrets.ts";

const [commande, ...reste] = process.argv.slice(2);
const { values } = parseArgs({
  args: reste,
  options: {
    nom: { type: "string" },
    email: { type: "string" },
    directeur: { type: "string" },
  },
});

function exiger(valeur: string | undefined, option: string): string {
  if (!valeur?.trim()) {
    console.error(`Option manquante : --${option}`);
    process.exit(1);
  }
  return valeur.trim();
}

const base = ouvrirBase(config.databaseOwnerUrl, 1);
const ORIGINE = "outil d'administration FlaiX Expert";

try {
  if (commande === "creer-lieu") {
    const nomLieu = exiger(values.nom, "nom");
    const email = exiger(values.email, "email").toLowerCase();
    const nomDirecteur = exiger(values.directeur, "directeur");
    const motDePasse = genererMotDePasseProvisoire();

    const resultat = await base.transaction({}, async (c) => {
      const { rows: lieu } = await c.query<{ id: string }>("INSERT INTO lieu (nom) VALUES ($1) RETURNING id", [nomLieu]);
      const lieuId = lieu[0]!.id;
      const { rows: existant } = await c.query<{ id: string }>("SELECT id FROM utilisateur WHERE lower(email) = $1", [email]);
      let utilisateurId = existant[0]?.id;
      const nouveauCompte = !utilisateurId;
      if (!utilisateurId) {
        const { rows } = await c.query<{ id: string }>(
          "INSERT INTO utilisateur (email, nom, mot_de_passe_hash) VALUES ($1, $2, $3) RETURNING id",
          [email, nomDirecteur, await hacherMotDePasse(motDePasse)],
        );
        utilisateurId = rows[0]!.id;
      }
      await c.query("INSERT INTO membre (lieu_id, utilisateur_id, role) VALUES ($1, $2, 'directeur')", [lieuId, utilisateurId]);
      await inscrireJet(c, {
        lieuId,
        type: "lieu_cree",
        utilisateurId: null,
        details: { nom: nomLieu, directeur: nomDirecteur, email, par: ORIGINE },
      });
      return { lieuId, nouveauCompte };
    });

    console.log(`\nLieu créé (vide) : ${nomLieu}`);
    console.log(`Directeur : ${nomDirecteur} <${email}>`);
    if (resultat.nouveauCompte) {
      console.log(`Mot de passe provisoire (affiché une seule fois, à changer dès la première connexion) :\n\n    ${motDePasse}\n`);
    } else {
      console.log("Ce compte existait déjà : il est rattaché au nouveau lieu avec son mot de passe actuel.\n");
    }
  } else if (commande === "nouveau-mot-de-passe") {
    const email = exiger(values.email, "email").toLowerCase();
    const motDePasse = genererMotDePasseProvisoire();
    await base.transaction({}, async (c) => {
      const { rows } = await c.query<{ id: string }>(
        "UPDATE utilisateur SET mot_de_passe_hash = $2 WHERE lower(email) = $1 RETURNING id",
        [email, await hacherMotDePasse(motDePasse)],
      );
      const utilisateurId = rows[0]?.id;
      if (!utilisateurId) throw new Error(`Aucun compte pour ${email}.`);
      await c.query("UPDATE session SET revoquee_le = now() WHERE utilisateur_id = $1 AND revoquee_le IS NULL", [utilisateurId]);
      const { rows: lieux } = await c.query<{ lieu_id: string }>("SELECT lieu_id FROM membre WHERE utilisateur_id = $1", [utilisateurId]);
      for (const { lieu_id } of lieux) {
        await inscrireJet(c, { lieuId: lieu_id, type: "mot_de_passe_modifie", utilisateurId, details: { par: ORIGINE } });
      }
    });
    console.log(`\nNouveau mot de passe provisoire pour ${email} (affiché une seule fois) :\n\n    ${motDePasse}\n`);
  } else if (commande === "creer-editeur") {
    // Compte FlaiX Expert du back-office : membre d'aucun lieu, il ne voit que la supervision technique (§15.13).
    const email = exiger(values.email, "email").toLowerCase();
    const nom = exiger(values.nom, "nom");
    const motDePasse = genererMotDePasseProvisoire();
    await base.transaction({}, async (c) => {
      const { rows: existant } = await c.query<{ id: string }>("SELECT id FROM utilisateur WHERE lower(email) = $1", [email]);
      if (existant[0]) {
        const { rows: membres } = await c.query("SELECT 1 FROM membre WHERE utilisateur_id = $1", [existant[0].id]);
        if (membres[0]) throw new Error("Ce compte est celui d'un lieu : un compte éditeur doit être distinct.");
        throw new Error("Ce compte existe déjà.");
      }
      const { rows } = await c.query<{ id: string }>("INSERT INTO utilisateur (email, nom, mot_de_passe_hash) VALUES ($1, $2, $3) RETURNING id", [
        email,
        nom,
        await hacherMotDePasse(motDePasse),
      ]);
      await c.query("INSERT INTO compte_editeur (utilisateur_id) VALUES ($1)", [rows[0]!.id]);
    });
    console.log(`\nCompte éditeur créé : ${nom} <${email}>`);
    console.log(`Mot de passe provisoire (affiché une seule fois, à changer dès la première connexion sur /editeur) :\n\n    ${motDePasse}\n`);
  } else {
    console.log('Commandes : creer-lieu --nom "…" --email … --directeur "…" | nouveau-mot-de-passe --email … | creer-editeur --email … --nom "…"');
    process.exitCode = 1;
  }
} catch (erreur) {
  console.error(`Erreur : ${(erreur as Error).message}`);
  process.exitCode = 1;
} finally {
  await base.fermer();
}
