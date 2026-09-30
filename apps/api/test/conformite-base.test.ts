/**
 * Tests de conformité exécutés contre la VRAIE base PostgreSQL (plan §15.19 du dossier).
 * Les tests [F] (falsification) provoquent réellement la fraude qu'ils doivent détecter :
 * ils ne réussissent que si la base elle-même la refuse — pas l'application.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Base } from "../src/base.ts";
import { inscrireJet, verifierJet } from "../src/journal-technique.ts";
import { basesDeTest, codeErreur, creerLieuDeTest } from "./aide.ts";

let proprietaire: Base;
let app: Base;
let A: { lieuId: string; utilisateurId: string };
let B: { lieuId: string; utilisateurId: string };
let produitA: string;

beforeAll(async () => {
  ({ proprietaire, app } = basesDeTest());
  A = await creerLieuDeTest(proprietaire);
  B = await creerLieuDeTest(proprietaire);
  // Lieu A : un stand, un produit, un tarif — écrits avec le compte du serveur, comme en vrai.
  produitA = await app.transaction({ lieuId: A.lieuId, utilisateurId: A.utilisateurId }, async (c) => {
    await c.query("INSERT INTO stand (lieu_id, nom) VALUES ($1, 'Buvette A')", [A.lieuId]);
    const { rows } = await c.query<{ id: string }>("INSERT INTO produit (lieu_id, nom) VALUES ($1, 'Produit A') RETURNING id", [A.lieuId]);
    await c.query(
      "INSERT INTO produit_tarif (lieu_id, produit_id, prix_ttc_centimes, taux_tva_pb, valide_du, saisi_par) VALUES ($1, $2, 700, 1000, now(), $3)",
      [A.lieuId, rows[0]!.id, A.utilisateurId],
    );
    await inscrireJet(c, { lieuId: A.lieuId, type: "tarif_cree", utilisateurId: A.utilisateurId, details: { prixTtc: 700 } });
    return rows[0]!.id;
  });
  await app.transaction({ lieuId: B.lieuId, utilisateurId: B.utilisateurId }, (c) =>
    c.query("INSERT INTO stand (lieu_id, nom) VALUES ($1, 'Buvette B')", [B.lieuId]),
  );
});

afterAll(async () => {
  await proprietaire.fermer();
  await app.fermer();
});

const ctxA = () => ({ lieuId: A.lieuId, utilisateurId: A.utilisateurId });

describe("Groupe A — inaltérabilité, imposée par la base", () => {
  it("A1 [F] — UPDATE sur le journal technique avec le compte du serveur : refusé par PostgreSQL", async () => {
    const code = await codeErreur(app.transaction(ctxA(), (c) => c.query("UPDATE journal_technique SET type = 'falsifie' WHERE lieu_id = $1", [A.lieuId])));
    expect(code).toBe("42501");
  });

  it("A2 [F] — DELETE sur le journal technique : refusé par PostgreSQL", async () => {
    const code = await codeErreur(app.transaction(ctxA(), (c) => c.query("DELETE FROM journal_technique WHERE lieu_id = $1", [A.lieuId])));
    expect(code).toBe("42501");
  });

  it("A1 [F] — un prix ne peut pas être réécrit en place (tarifs datés) : UPDATE et DELETE refusés", async () => {
    expect(await codeErreur(app.transaction(ctxA(), (c) => c.query("UPDATE produit_tarif SET prix_ttc_centimes = 1 WHERE produit_id = $1", [produitA])))).toBe("42501");
    expect(await codeErreur(app.transaction(ctxA(), (c) => c.query("DELETE FROM produit_tarif WHERE produit_id = $1", [produitA])))).toBe("42501");
  });

  it("[F] — même le propriétaire des tables ne peut ni modifier, ni supprimer, ni vider le journal", async () => {
    expect(await codeErreur(proprietaire.transaction({}, (c) => c.query("UPDATE journal_technique SET type = 'falsifie' WHERE lieu_id = $1", [A.lieuId])))).toBe("42501");
    expect(await codeErreur(proprietaire.transaction({}, (c) => c.query("DELETE FROM journal_technique WHERE lieu_id = $1", [A.lieuId])))).toBe("42501");
    expect(await codeErreur(proprietaire.transaction({}, (c) => c.query("TRUNCATE journal_technique")))).toBe("42501");
    expect(await codeErreur(proprietaire.transaction({}, (c) => c.query("UPDATE produit_tarif SET prix_ttc_centimes = 1")))).toBe("42501");
  });

  it("[F] — Z de caisse (comptage des espèces, §15.102) : écriture seule, même pour le propriétaire, et jamais vidé", async () => {
    // Refus par les droits (serveur) et par déclencheur (propriétaire), avant même de toucher une ligne.
    expect(await codeErreur(app.transaction(ctxA(), (c) => c.query("UPDATE comptage_especes SET ecart_centimes = 0")))).toBe("42501");
    expect(await codeErreur(app.transaction(ctxA(), (c) => c.query("DELETE FROM comptage_especes")))).toBe("42501");
    expect(await codeErreur(proprietaire.transaction({}, (c) => c.query("TRUNCATE comptage_especes")))).toBe("42501");
    // Les cas sur des Z réels (écart faux, motif manquant, second Z, rectification) : test/clotures.test.ts.
  });

  it("A8 [F] — deux événements ne peuvent pas porter le même numéro : contrainte d'unicité", async () => {
    const code = await codeErreur(
      app.transaction(ctxA(), (c) =>
        c.query(
          `INSERT INTO journal_technique (lieu_id, numero, horodatage, type, empreinte_precedente, empreinte)
           VALUES ($1, 1, now(), 'doublon', repeat('0', 64), repeat('a', 64))`,
          [A.lieuId],
        ),
      ),
    );
    expect(code).toBe("23505");
  });

  it("[F] — le serveur ne peut pas changer l'identifiant d'un lieu ni déplacer un stand vers un autre lieu", async () => {
    expect(await codeErreur(app.transaction(ctxA(), (c) => c.query("UPDATE lieu SET id = gen_random_uuid() WHERE id = $1", [A.lieuId])))).toBe("42501");
    expect(await codeErreur(app.transaction(ctxA(), (c) => c.query("UPDATE stand SET lieu_id = $2 WHERE lieu_id = $1", [A.lieuId, B.lieuId])))).toBe("42501");
  });

  it("la chaîne du journal technique est intacte et numérotée sans trou", async () => {
    const r = await app.transaction(ctxA(), (c) => verifierJet(c, A.lieuId));
    expect(r).toMatchObject({ ok: true, numerotationContinue: true });
    expect(r.maillons).toBeGreaterThanOrEqual(2);
  });

  it("vingt inscriptions simultanées restent numérotées sans trou ni doublon, chaîne intacte", async () => {
    await Promise.all(
      Array.from({ length: 20 }, (_, i) =>
        app.transaction(ctxA(), (c) => inscrireJet(c, { lieuId: A.lieuId, type: "verification_integrite", utilisateurId: A.utilisateurId, details: { i } })),
      ),
    );
    const r = await app.transaction(ctxA(), (c) => verifierJet(c, A.lieuId));
    expect(r).toMatchObject({ ok: true, numerotationContinue: true });
  });
});

describe("Isolement des lieux (sécurité par ligne)", () => {
  it("[F] — depuis le lieu A, les stands du lieu B sont invisibles", async () => {
    const { rows } = await app.transaction(ctxA(), (c) => c.query("SELECT id FROM stand WHERE lieu_id = $1", [B.lieuId]));
    expect(rows).toHaveLength(0);
  });

  it("[F] — depuis le lieu A, impossible d'écrire dans le lieu B", async () => {
    const code = await codeErreur(app.transaction(ctxA(), (c) => c.query("INSERT INTO stand (lieu_id, nom) VALUES ($1, 'Intrus')", [B.lieuId])));
    expect(code).toBe("42501");
  });

  it("[F] — depuis le lieu A, le journal et les comptes du lieu B sont invisibles", async () => {
    const jet = await app.transaction(ctxA(), (c) => c.query("SELECT 1 FROM journal_technique WHERE lieu_id = $1", [B.lieuId]));
    const comptes = await app.transaction(ctxA(), (c) => c.query("SELECT 1 FROM utilisateur WHERE id = $1", [B.utilisateurId]));
    expect(jet.rows).toHaveLength(0);
    expect(comptes.rows).toHaveLength(0);
  });

  it("sans contexte de lieu, le serveur ne voit aucune donnée de lieu", async () => {
    const { rows } = await app.transaction({}, (c) => c.query("SELECT id FROM lieu"));
    expect(rows).toHaveLength(0);
  });

  it("[F] — le serveur ne peut pas créer de lieu (réservé à l'éditeur)", async () => {
    const code = await codeErreur(app.transaction(ctxA(), (c) => c.query("INSERT INTO lieu (id, nom) VALUES ($1, 'Faux lieu')", [A.lieuId])));
    expect(code).toBe("42501");
  });
});
