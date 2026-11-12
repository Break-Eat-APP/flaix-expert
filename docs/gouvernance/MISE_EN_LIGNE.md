# FlaiX Expert — mise en ligne, sauvegardes et retour arrière

Tenu selon la gouvernance (`GOUVERNANCE_FLAIX_EXPERT.md`, § 16). Créé le 2026-11-13. Le détail de l'installation du
serveur est dans `docs/guide-serveur-test-ovh.md` et `infra/vps/`.

## 1. Environnements

| Environnement | Où | Base |
|---|---|---|
| Local | poste de Rémi, `C:\Users\notta\dev\flaix-expert` | Docker : `flaix` (développement), `flaix_test` (tests) |
| Test | `https://flaixexpert.flaixlabs.com` (VPS OVHcloud) | PostgreSQL du serveur |
| Production | à créer au passage en production, base neuve | — |

## 2. Règle de mise en ligne

- **Serveur de test : automatique** après chaque fonction terminée et vérifiée (décision de Rémi, 2026-11-12).
- **Production : feu vert de Rémi à chaque fois** — proposée, à confirmer au passage en production.

## 3. Procédure (serveur de test)

Depuis le poste, avec la clé SSH du serveur (`C:\Users\notta\.ssh\flaix_ovh`) :

1. **Sauvegarde** : `ssh … 'sudo -n /usr/local/sbin/sauvegarde-flaix.sh'` (code de sortie 0 attendu).
2. **Archive du commit** : `git archive --format=tar.gz -o flaix-<commit>.tar.gz HEAD`, copiée dans `/tmp` du serveur.
3. **Mise en ligne** : `ssh … 'sudo -n /usr/local/sbin/deployer-flaix.sh /tmp/flaix-<commit>.tar.gz'`. Le script installe
   les dépendances (contrôle de la chaîne d'approvisionnement), construit l'écran, applique les migrations nouvelles,
   bascule `/srv/flaix/app` vers la nouvelle version (`/srv/flaix/versions/<date>`), redémarre le service.
4. **Contrôle** : `https://flaixexpert.flaixlabs.com/api/sante` doit répondre `{"ok":true}` (quelques secondes de 502
   pendant le redémarrage sont normales) ; lire dans le journal de mise en ligne les migrations appliquées et
   l'absence d'avertissement.
5. **Trace** : la section §15.x du dossier projet dit la date, le commit et les migrations.

Le script « TERMINE » ne suffit pas : le contrôle de santé, et au besoin un contrôle à l'écran, valident la mise en ligne.

## 4. Sauvegardes

- Quotidienne (minuterie `sauvegarde-flaix.timer`), plus une avant chaque mise en ligne ; 14 jours gardés sur le
  serveur, celle du 1er de chaque mois sans limite (tickets conservés sans limite, dossier §15.106).
- Copie chiffrée hors serveur chez OVHcloud, une fois réglée par Rémi (`sudo flaix-admin sauvegarde-externe`) — **état à
  confirmer**.
- **Restauration : jamais testée à ce jour.** À faire avant la production, sur une base à part, en notant la durée et les
  vérifications. Une sauvegarde non restaurée n'est pas une reprise garantie.

## 5. Retour arrière

1. Mettre en ligne l'archive du **commit précédent** stable, avec la même procédure (§ 3) ; les versions précédentes restent
   aussi dans `/srv/flaix/versions/`.
2. **Un retour arrière du code n'annule pas une migration.** Une migration déjà passée se corrige par une nouvelle
   migration ; les données déjà écrites se traitent explicitement (jamais de suppression directe en production).
3. Vérifier le contrôle de santé et les écrans touchés ; inscrire l'événement au registre des bugs et incidents.

## 6. Ce qui manque avant la production

- Serveur de production distinct du serveur de test (coût à valider par Rémi).
- Restauration testée ; copie hors serveur réglée.
- Outil de suivi des erreurs (à choisir).
- Règle de feu vert pour la production confirmée.
