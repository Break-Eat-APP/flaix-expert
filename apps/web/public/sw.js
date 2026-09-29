/*
 * Service worker de FlaiX Expert (vente sans réseau, dossier §15.97).
 * Garde les fichiers de l'application sur l'appareil pour qu'un écran de caisse rechargé sans
 * réseau s'ouvre encore. Les appels au serveur (/api) ne passent JAMAIS par ce cache : les
 * ventes sont gardées par l'écran de caisse lui-même, dans sa propre mémoire.
 */
const CACHE = "flaix-application-v1";

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (evenement) => {
  evenement.waitUntil(
    caches
      .keys()
      .then((cles) => Promise.all(cles.filter((c) => c !== CACHE).map((c) => caches.delete(c))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (evenement) => {
  const requete = evenement.request;
  const url = new URL(requete.url);
  if (requete.method !== "GET" || url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;

  // Pages : le réseau d'abord (version à jour), la dernière copie de l'application sinon.
  if (requete.mode === "navigate") {
    evenement.respondWith(
      fetch(requete)
        .then((reponse) => {
          if (reponse.ok) {
            const copie = reponse.clone();
            void caches.open(CACHE).then((cache) => cache.put("/", copie));
          }
          return reponse;
        })
        .catch(() => caches.match("/").then((r) => r ?? Response.error())),
    );
    return;
  }

  // Fichiers de l'application (noms uniques à chaque version) : la copie locale d'abord.
  if (url.pathname.startsWith("/assets/") || url.pathname === "/favicon.svg") {
    evenement.respondWith(
      caches.match(requete).then(
        (enCache) =>
          enCache ??
          fetch(requete).then((reponse) => {
            if (reponse.ok) {
              const copie = reponse.clone();
              void caches.open(CACHE).then((cache) => cache.put(requete, copie));
            }
            return reponse;
          }),
      ),
    );
  }
});
