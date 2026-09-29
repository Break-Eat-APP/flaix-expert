import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import { useSession } from "./session.tsx";
import { Coquille } from "./composants/Coquille.tsx";
import { Chargement, MessageErreur } from "./composants/communs.tsx";
import { Connexion } from "./pages/Connexion.tsx";
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
import { Clotures } from "./pages/clotures/Clotures.tsx";

export function App() {
  const session = useSession();
  if (session.isPending) return <Chargement />;
  if (session.error) return <MessageErreur erreur={session.error} />;
  if (!session.data) return <Connexion />;

  if (session.data.role !== "directeur") {
    // L'écran caisse des opérateurs arrive avec la phase 2 (Ma caisse).
    return (
      <div className="page-connexion">
        <div className="carte boite-connexion">
          <h2>Accès opérateur</h2>
          <p>L'écran de caisse n'est pas encore en service. Ton compte n'a pas accès à la configuration du lieu.</p>
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
          <Route path="caisses" element={<MesCaisses />} />
          <Route path="caisses/:caisseId" element={<EcranCaisse />} />
          <Route path="clotures" element={<Clotures />} />
          <Route path="parametres" element={<Parametres />} />
          <Route path="parametres/lieu" element={<Identite />} />
          <Route path="parametres/stands" element={<StandsCaisses />} />
          <Route path="parametres/produits" element={<Produits />} />
          <Route path="parametres/saison" element={<Saison />} />
          <Route path="parametres/conformite" element={<JournalTechnique />} />
          <Route path="compte" element={<Compte />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
