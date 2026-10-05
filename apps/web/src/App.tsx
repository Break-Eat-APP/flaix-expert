import { lazy, Suspense, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import { useQuery } from "@tanstack/react-query";
import type { AccueilTablette } from "@flaix/domain";
import { api, ErreurApi } from "./api.ts";
import { useSession } from "./session.tsx";
import { Coquille } from "./composants/Coquille.tsx";
import { Chargement, MessageErreur } from "./composants/communs.tsx";
import { Connexion } from "./pages/Connexion.tsx";
import { ConnexionCaissiere } from "./pages/ConnexionCaissiere.tsx";
import { MesCaisses } from "./pages/caisse/MesCaisses.tsx";
import { EcranCaisse } from "./pages/caisse/EcranCaisse.tsx";
import { PosteCaissiere } from "./pages/caisse/PosteCaissiere.tsx";

// Écrans du directeur et back-office chargés à la demande (audit Codex P3-002) : le premier chargement
// d'une tablette reste léger. L'écran de caisse, lui, reste dans le chargement principal : une tablette
// qui perd le réseau ne doit jamais attendre un morceau d'application qu'elle n'a pas encore reçu.
const Resultats = lazy(() => import("./pages/Resultats.tsx").then((m) => ({ default: m.Resultats })));
const Compte = lazy(() => import("./pages/Compte.tsx").then((m) => ({ default: m.Compte })));
const Parametres = lazy(() => import("./pages/parametres/Parametres.tsx").then((m) => ({ default: m.Parametres })));
const Identite = lazy(() => import("./pages/parametres/Identite.tsx").then((m) => ({ default: m.Identite })));
const StandsCaisses = lazy(() => import("./pages/parametres/StandsCaisses.tsx").then((m) => ({ default: m.StandsCaisses })));
const Produits = lazy(() => import("./pages/parametres/Produits.tsx").then((m) => ({ default: m.Produits })));
const Saison = lazy(() => import("./pages/parametres/Saison.tsx").then((m) => ({ default: m.Saison })));
const JournalTechnique = lazy(() => import("./pages/parametres/JournalTechnique.tsx").then((m) => ({ default: m.JournalTechnique })));
const Clotures = lazy(() => import("./pages/clotures/Clotures.tsx").then((m) => ({ default: m.Clotures })));
const Equipe = lazy(() => import("./pages/equipe/Equipe.tsx").then((m) => ({ default: m.Equipe })));
const Stock = lazy(() => import("./pages/stock/Stock.tsx").then((m) => ({ default: m.Stock })));
const Formation = lazy(() => import("./pages/parametres/Formation.tsx").then((m) => ({ default: m.Formation })));
const ClickCollect = lazy(() => import("./pages/parametres/ClickCollect.tsx").then((m) => ({ default: m.ClickCollect })));
const CentreAlertes = lazy(() => import("./pages/alertes/CentreAlertes.tsx").then((m) => ({ default: m.CentreAlertes })));
const EnDirect = lazy(() => import("./pages/direct/EnDirect.tsx").then((m) => ({ default: m.EnDirect })));
const CoutsBuvette = lazy(() => import("./pages/parametres/CoutsBuvette.tsx").then((m) => ({ default: m.CoutsBuvette })));
const Fidelite = lazy(() => import("./pages/fidelite/Fidelite.tsx").then((m) => ({ default: m.Fidelite })));
const Factures = lazy(() => import("./pages/factures/Factures.tsx").then((m) => ({ default: m.Factures })));
const Assistant = lazy(() => import("./pages/Assistant.tsx").then((m) => ({ default: m.Assistant })));
const SupportFlaix = lazy(() => import("./pages/parametres/SupportFlaix.tsx").then((m) => ({ default: m.SupportFlaix })));
const Notifications = lazy(() => import("./pages/parametres/Notifications.tsx").then((m) => ({ default: m.Notifications })));
const Objectifs = lazy(() => import("./pages/parametres/Objectifs.tsx").then((m) => ({ default: m.Objectifs })));
const RapportSoiree = lazy(() => import("./pages/resultats/RapportSoiree.tsx").then((m) => ({ default: m.RapportSoiree })));
const EspaceEditeur = lazy(() => import("./pages/editeur/EspaceEditeur.tsx").then((m) => ({ default: m.EspaceEditeur })));

/** Le back-office FlaiX Expert (/editeur) est un espace à part : autres comptes, autre cookie (dossier §15.116). */
export function App() {
  return window.location.pathname.startsWith("/editeur") ? (
    <Suspense fallback={<Chargement />}>
      <EspaceEditeur />
    </Suspense>
  ) : (
    <AppLieu />
  );
}

function AppLieu() {
  const session = useSession();
  if (session.isPending) return <Chargement />;
  if (session.error) return <MessageErreur erreur={session.error} />;
  if (!session.data) return <Accueil />;

  // Caissière : l'écran de vente de la caisse de sa tablette, rien d'autre (dossier §15.100).
  if (session.data.role === "operateur") return <PosteCaissiere session={session.data} />;

  // Support FlaiX Expert (§15.142) : les écrans du directeur, en lecture seule (bandeau permanent).
  if (session.data.role !== "directeur" && session.data.role !== "support") {
    return (
      <div className="page-connexion">
        <div className="carte boite-connexion">
          <h2>Accès vérificateur</h2>
          <p>L'accès en lecture pour un contrôle n'est pas encore en service.</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Rapport de soirée : un document à part, sans menu, pour l'impression et le PDF (§15.131). */}
        <Route path="rapport-soiree/:evenementId" element={<Suspense fallback={<Chargement />}><RapportSoiree /></Suspense>} />
        <Route element={<Coquille session={session.data} />}>
          {/* Organisation en 6 entrées (dossier §15.96) : Résultats, Caisses, Stock, Équipe, Clôtures, Paramètres. */}
          <Route index element={<Resultats session={session.data} />} />
          <Route path="direct" element={<EnDirect />} />
          <Route path="alertes" element={<CentreAlertes />} />
          <Route path="assistant" element={<Assistant />} />
          <Route path="caisses" element={<MesCaisses />} />
          <Route path="caisses/:caisseId" element={<EcranCaisse />} />
          <Route path="stock" element={<Stock />} />
          <Route path="equipe" element={<Equipe />} />
          <Route path="clotures" element={<Clotures />} />
          <Route path="fidelite" element={<Fidelite />} />
          <Route path="factures" element={<Factures />} />
          <Route path="parametres" element={<Parametres />} />
          <Route path="parametres/lieu" element={<Identite />} />
          <Route path="parametres/stands" element={<StandsCaisses />} />
          <Route path="parametres/produits" element={<Produits />} />
          <Route path="parametres/saison" element={<Saison />} />
          <Route path="parametres/conformite" element={<JournalTechnique />} />
          <Route path="parametres/formation" element={<Formation />} />
          <Route path="parametres/click-collect" element={<ClickCollect />} />
          <Route path="parametres/couts" element={<CoutsBuvette />} />
          <Route path="parametres/objectifs" element={<Objectifs />} />
          <Route path="parametres/notifications" element={<Notifications />} />
          <Route path="parametres/support" element={<SupportFlaix />} />
          <Route path="compte" element={<Compte />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

/** Personne connectée : sur une tablette enregistrée, l'écran des caissières ; ailleurs, la connexion par e-mail. */
function Accueil() {
  const [directeur, setDirecteur] = useState(false);
  const tablette = useQuery({
    queryKey: ["appareil"],
    queryFn: () => api.get<AccueilTablette>("/appareil").catch((e) => (e instanceof ErreurApi && e.statut === 404 ? null : Promise.reject(e))),
    retry: false,
  });
  if (tablette.isPending) return <Chargement />;
  if (tablette.data && !directeur) return <ConnexionCaissiere accueil={tablette.data} versDirecteur={() => setDirecteur(true)} />;
  return <Connexion versCaissieres={tablette.data ? () => setDirecteur(false) : undefined} />;
}
