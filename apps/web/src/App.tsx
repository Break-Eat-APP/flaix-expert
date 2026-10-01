import { useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import { useQuery } from "@tanstack/react-query";
import type { AccueilTablette } from "@flaix/domain";
import { api, ErreurApi } from "./api.ts";
import { useSession } from "./session.tsx";
import { Coquille } from "./composants/Coquille.tsx";
import { Chargement, MessageErreur } from "./composants/communs.tsx";
import { Connexion } from "./pages/Connexion.tsx";
import { ConnexionCaissiere } from "./pages/ConnexionCaissiere.tsx";
import { Resultats } from "./pages/Resultats.tsx";
import { Compte } from "./pages/Compte.tsx";
import { Parametres } from "./pages/parametres/Parametres.tsx";
import { Identite } from "./pages/parametres/Identite.tsx";
import { StandsCaisses } from "./pages/parametres/StandsCaisses.tsx";
import { Produits } from "./pages/parametres/Produits.tsx";
import { Saison } from "./pages/parametres/Saison.tsx";
import { JournalTechnique } from "./pages/parametres/JournalTechnique.tsx";
import { MesCaisses } from "./pages/caisse/MesCaisses.tsx";
import { EcranCaisse } from "./pages/caisse/EcranCaisse.tsx";
import { PosteCaissiere } from "./pages/caisse/PosteCaissiere.tsx";
import { Clotures } from "./pages/clotures/Clotures.tsx";
import { Equipe } from "./pages/equipe/Equipe.tsx";
import { Stock } from "./pages/stock/Stock.tsx";
import { Formation } from "./pages/parametres/Formation.tsx";
import { ClickCollect } from "./pages/parametres/ClickCollect.tsx";
import { EnDirect } from "./pages/direct/EnDirect.tsx";
import { CoutsBuvette } from "./pages/parametres/CoutsBuvette.tsx";
import { Fidelite } from "./pages/fidelite/Fidelite.tsx";

export function App() {
  const session = useSession();
  if (session.isPending) return <Chargement />;
  if (session.error) return <MessageErreur erreur={session.error} />;
  if (!session.data) return <Accueil />;

  // Caissière : l'écran de vente de la caisse de sa tablette, rien d'autre (dossier §15.100).
  if (session.data.role === "operateur") return <PosteCaissiere session={session.data} />;

  if (session.data.role !== "directeur") {
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
        <Route element={<Coquille session={session.data} />}>
          {/* Organisation en 6 entrées (dossier §15.96) : Résultats, Caisses, Stock, Équipe, Clôtures, Paramètres. */}
          <Route index element={<Resultats session={session.data} />} />
          <Route path="direct" element={<EnDirect />} />
          <Route path="caisses" element={<MesCaisses />} />
          <Route path="caisses/:caisseId" element={<EcranCaisse />} />
          <Route path="stock" element={<Stock />} />
          <Route path="equipe" element={<Equipe />} />
          <Route path="clotures" element={<Clotures />} />
          <Route path="fidelite" element={<Fidelite />} />
          <Route path="parametres" element={<Parametres />} />
          <Route path="parametres/lieu" element={<Identite />} />
          <Route path="parametres/stands" element={<StandsCaisses />} />
          <Route path="parametres/produits" element={<Produits />} />
          <Route path="parametres/saison" element={<Saison />} />
          <Route path="parametres/conformite" element={<JournalTechnique />} />
          <Route path="parametres/formation" element={<Formation />} />
          <Route path="parametres/click-collect" element={<ClickCollect />} />
          <Route path="parametres/couts" element={<CoutsBuvette />} />
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
