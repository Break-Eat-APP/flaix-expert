# Phase 61 — Événements privés

> FlaiX Expert · dossier de développement · généré le 2026-10-23 depuis le dépôt [Break-Eat-APP/flaix-expert](https://github.com/Break-Eat-APP/flaix-expert). Règles du projet : `AGENTS.md`.

| | |
|---|---|
| Dates | 2026-10-11, 2026-10-12 |
| Décision | dossier projet §15.160 |
| État | livrée, tests au vert au moment du commit |
| Commits | 2 |

## 1. Ce qui a été décidé, et pourquoi

### 15.160 Événements privés (2026-10-12)

**Demande de Rémi** (2026-10-11) : *« le directeur gère aussi des events ou des salons privés avec de la food et de
l'alcool… le Bar clandestin vient à 15 personnes, boit et mange, ils ont un budget pour la soirée… pour le faire
simple et ne pas compliquer ce que nous avons déjà développé »*. Réponses : paiement **au budget**, facture à la société
**parfois**, **pas d'acompte**. Puis : *« go… pour les événements privés c'est que de la gestion, c'est le directeur qui
gère lui directement et non la caissière »*.

**Décisions** :
- **Hors caisse** : rien ne passe par les tickets (Z, clôtures, TVA et rapport des buvettes intacts) ; ni note ouverte
  ni accès caissière. Module à part, option « Événements privés » (active par défaut), entrée du menu.
- **Fiche** : nom, date, salon, invités, budget TTC, client (personne, contact), société facultative (raison sociale,
  adresse, SIRET, n° de TVA), notes (menu prévu).
- **Consommations** notées par le directeur : produits du catalogue au prix en vigueur (le même produit au même prix
  s'ajoute à sa ligne, +/−), ou lignes libres (location du salon, service, plateau ; coût d'achat facultatif — sans
  coût, c'est un service). **Jauge du budget** : attention dès 80 %, dépassé au-delà de 100 % (à voir avec le client).
- **Frais** : libres, et calcul du personnel (personnes × heures × taux horaire chargé).
- **Ce qu'il te reste** = CA HT − marchandise (coût matière + conditionnement) − frais ; coût manquant → non calculé.
  TVA ventilée ligne par ligne comme à la caisse (HT + TVA = TTC exactement).
- **Clôture** (confirmée) : consommations, frais, coûts, budget et date sont figés — verrou dans la base (déclencheurs) ;
  le client, les notes et le règlement se complètent encore.
- **Règlement** : mode (virement, carte, espèces, chèque) et date.
- **Facture** (si le client la demande) : seulement après clôture ; identité de l'exploitant exigée (adresse, SIRET,
  n° de TVA) ; nom du client ou de sa société, adresse obligatoire pour une société ; **numérotation continue par lieu
  et par année** (FP-2026-0001…), sans trou ni doublon (verrou de la base) ; une seule facture par événement ; contenu
  figé, **scellé par son empreinte**, en écriture seule, relu avec un contrôle d'intégrité ; mentions : pas d'escompte,
  pénalités et indemnité forfaitaire de 40 € pour un professionnel, « acquittée le … par … » si le règlement est noté,
  sinon échéance à 30 jours (jour de Paris). Imprimable ou en PDF. Pas de facture en mode formation.
- Pas dans ce module (plus tard si besoin) : sortie de stock des consommations, rattachement au planning d'Équipe,
  bilans de période de Résultats, facture électronique (réforme : réception obligatoire depuis septembre 2026, émission
  pour les petites entreprises à partir de septembre 2027 — à préparer avec l'expert-comptable).

**Réalisé le 2026-10-12** : migrations 0049 et 0050 ; moteur (bilan, jauge, personnel, facture, empreinte) ; serveur
(fiche, lignes, frais, clôture, règlement, facture, lecture contrôlée) ; écrans (liste, fiche, facture). **Tests** :
moteur 3, serveur 6 (cumul d'un produit, jauge, ce qu'il te reste, clôture qui fige même en base, client complété après
clôture, identité exigée, série FP-…-0001 puis 0002, contenu modifié détecté, aucune vente en caisse, facture
indélébile), écran 2 ; essayé dans le navigateur (40 pressions sur 300 €, clôture, client complété, facture émise et
relue « contenu intact »). Corrigés à l'essai : client non modifiable après clôture ; modification partielle de la fiche
qui vidait les autres champs ; échéance calculée en temps universel.

## 2. Ce qui a été construit — commits

- [`8fa7985`](https://github.com/Break-Eat-APP/flaix-expert/commit/8fa79850a868d8541d787e41ab4968e1edf55c95) — 2026-10-11 — Événements privés : moteur et serveur (dossier §15.160)
- [`f03bba1`](https://github.com/Break-Eat-APP/flaix-expert/commit/f03bba194965bff68ffbbdf9915154eeebea75ad) — 2026-10-12 — Événements privés : écrans (dossier §15.160)

## 3. Fichiers, par couche

### Base de données (migrations)

- `db/migrations/0049_evenements_prives.sql` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/f03bba194965bff68ffbbdf9915154eeebea75ad/db/migrations/0049_evenements_prives.sql)
- `db/migrations/0050_prive_client_apres_cloture.sql` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/f03bba194965bff68ffbbdf9915154eeebea75ad/db/migrations/0050_prive_client_apres_cloture.sql)

### Tests

- `apps/api/test/evenements-prives.test.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/f03bba194965bff68ffbbdf9915154eeebea75ad/apps/api/test/evenements-prives.test.ts)
- `apps/web/src/composants/Coquille.test.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/f03bba194965bff68ffbbdf9915154eeebea75ad/apps/web/src/composants/Coquille.test.ts)
- `packages/domain/src/evenements-prives.test.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/f03bba194965bff68ffbbdf9915154eeebea75ad/packages/domain/src/evenements-prives.test.ts)

### Moteur de calcul (packages/domain)

- `packages/domain/src/editeur.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/f03bba194965bff68ffbbdf9915154eeebea75ad/packages/domain/src/editeur.ts)
- `packages/domain/src/evenements-prives.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/f03bba194965bff68ffbbdf9915154eeebea75ad/packages/domain/src/evenements-prives.ts)
- `packages/domain/src/index.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/f03bba194965bff68ffbbdf9915154eeebea75ad/packages/domain/src/index.ts)
- `packages/domain/src/journal-technique.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/f03bba194965bff68ffbbdf9915154eeebea75ad/packages/domain/src/journal-technique.ts)

### Serveur (apps/api)

- `apps/api/src/routes/evenements-prives.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/f03bba194965bff68ffbbdf9915154eeebea75ad/apps/api/src/routes/evenements-prives.ts)
- `apps/api/src/serveur.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/f03bba194965bff68ffbbdf9915154eeebea75ad/apps/api/src/serveur.ts)

### Écrans (apps/web)

- `apps/web/src/App.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/f03bba194965bff68ffbbdf9915154eeebea75ad/apps/web/src/App.tsx)
- `apps/web/src/composants/Coquille.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/f03bba194965bff68ffbbdf9915154eeebea75ad/apps/web/src/composants/Coquille.tsx)
- `apps/web/src/pages/prives/EvenementPrive.test.tsx` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/f03bba194965bff68ffbbdf9915154eeebea75ad/apps/web/src/pages/prives/EvenementPrive.test.tsx)
- `apps/web/src/pages/prives/EvenementPrive.tsx` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/f03bba194965bff68ffbbdf9915154eeebea75ad/apps/web/src/pages/prives/EvenementPrive.tsx)
- `apps/web/src/pages/prives/EvenementsPrives.tsx` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/f03bba194965bff68ffbbdf9915154eeebea75ad/apps/web/src/pages/prives/EvenementsPrives.tsx)
- `apps/web/src/pages/prives/FactureVente.tsx` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/f03bba194965bff68ffbbdf9915154eeebea75ad/apps/web/src/pages/prives/FactureVente.tsx)
- `apps/web/src/styles.css` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/f03bba194965bff68ffbbdf9915154eeebea75ad/apps/web/src/styles.css)

## 4. Tests créés dans cette phase

### `apps/api/test/evenements-prives.test.ts`

- **événements privés**
  - fiche créée avec son budget et sa société ; SIRET invalide refusé
  - consommations : même produit cumulé, ligne libre, quantité changée ou retirée ; jauge du budget
  - frais et ce qu'il te reste ; facture avant la clôture refusée
  - clôture : coûts figés même si un coût change ensuite ; plus de consommation, même directement en base
  - facture : identité de l'exploitant exigée, puis série continue ; contenu scellé et relu ; règlement noté
  - rien ne passe par la caisse ; l'application ne peut ni modifier ni effacer une facture

### `packages/domain/src/evenements-prives.test.ts`

- **événements privés (§15.160)**
  - bilan : TVA ventilée par ligne (HT + TVA = TTC), marchandise, frais, ce qu'il te reste ; ligne libre = service
  - produit sans coût : marchandise inconnue, rien d'inventé ; jauge du budget ; coût du personnel
  - facture : numéro de série, lignes HT, totaux par taux, mentions d'un professionnel, échéance ou acquit ; empreinte

## 5. Pour reprendre ou vérifier cette phase

1. `pnpm install`, `pnpm db:up` (PostgreSQL local dans Docker), `pnpm db:migrate`.
2. Tests du moteur de cette phase : `cd packages/domain && ./node_modules/.bin/vitest run src/evenements-prives.test.ts`.
3. Tests contre la base : `cd apps/api && ./node_modules/.bin/vitest run test/evenements-prives.test.ts`.
- Avant toute modification : lire `AGENTS.md` (règles et invariants), puis la section du dossier projet indiquée ci-dessus. Une migration appliquée ne se modifie jamais ; un refus de la base est voulu.
- Ordre de construction complet : `docs/developpement/JOURNAL_DES_PHASES.md` ; où trouver quoi : `docs/developpement/CARTE_DU_CODE.md`.
