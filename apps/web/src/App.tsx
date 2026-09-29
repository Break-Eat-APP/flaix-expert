import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import { useSession } from "./session.tsx";
import { Coquille } from "./composants/Coquille.tsx";
import { Chargement, MessageErreur } from "./composants/communs.tsx";
import { Connexion } from "./pages/Connexion.tsx";
import { Demarrage } from "./pages/Demarrage.tsx";
import { Compte } from "./pages/Compte.tsx";
import { Identite } from "./pages/configuration/Identite.tsx";
import { StandsCaisses } from "./pages/configuration/StandsCaisses.tsx";
import { Produits } from "./pages/configuration/Produits.tsx";
import { JournalTechnique } from "./pages/conformite/JournalTechnique.tsx";
import { Matchs } from "./pages/configuration/Matchs.tsx";
import { MesCaisses } from "./pages/caisse/MesCaisses.tsx";
import { EcranCaisse } from "./pages/caisse/EcranCaisse.tsx";

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
          <Route index element={<Demarrage session={session.data} />} />
          <Route path="caisses" element={<MesCaisses />} />
          <Route path="caisses/:caisseId" element={<EcranCaisse />} />
          <Route path="configuration/matchs" element={<Matchs />} />
          <Route path="configuration/identite" element={<Identite />} />
          <Route path="configuration/stands" element={<StandsCaisses />} />
          <Route path="configuration/produits" element={<Produits />} />
          <Route path="conformite/journal" element={<JournalTechnique />} />
          <Route path="compte" element={<Compte />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
