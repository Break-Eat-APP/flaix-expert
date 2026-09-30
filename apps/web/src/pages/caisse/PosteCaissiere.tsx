import { useState } from "react";
import { BrowserRouter, Route, Routes } from "react-router";
import { LogOut } from "lucide-react";
import type { SessionInfo } from "@flaix/domain";
import { useDeconnexion } from "../../session.tsx";
import { EcranCaisse } from "./EcranCaisse.tsx";
import { BandeauFormation } from "../../composants/Formation.tsx";

/**
 * Poste d'une caissière (dossier §15.100) : l'écran de vente de la caisse de cette tablette,
 * et rien d'autre — ni menu, ni résultats, ni paramètres.
 */
export function PosteCaissiere({ session }: { session: SessionInfo }) {
  const deconnecter = useDeconnexion();
  const [confirmer, setConfirmer] = useState(false);
  const caisseId = session.appareil?.caisseId;
  const horsLigne = typeof navigator !== "undefined" && !navigator.onLine;

  return (
    <BrowserRouter>
      <div className="poste-entete">
        <span className="marque-nom">
          Flai<span>X</span> Expert
        </span>
        <span className="discret" style={{ fontSize: 13 }}>{session.lieu.nom}</span>
        <div className="qui">
          <span>
            Caissière : <strong>{session.utilisateur.nom}</strong>
          </span>
          {confirmer ? (
            <>
              <span className="discret" style={{ fontSize: 12 }}>
                {horsLigne
                  ? "Pas de réseau : personne ne pourra se connecter avant son retour. Changer quand même ?"
                  : "La caisse reste ouverte ; la personne suivante se connecte avec son code."}
              </span>
              <button className="btn" onClick={() => void deconnecter()}>
                Oui, changer
              </button>
              <button className="btn btn-fantome" onClick={() => setConfirmer(false)}>
                Annuler
              </button>
            </>
          ) : (
            <button className="btn btn-fantome" onClick={() => setConfirmer(true)}>
              <LogOut size={15} /> Changer de caissière
            </button>
          )}
        </div>
      </div>
      {session.formation && <BandeauFormation />}
      {session.environnement !== "production" && (
        <div className="bandeau-test" role="note">
          {session.environnement === "test" ? "VERSION DE TEST — aucune vente réelle, aucun encaissement." : "DÉVELOPPEMENT LOCAL — aucune vente réelle."}
        </div>
      )}
      <main className="poste-contenu">
        {caisseId ? (
          <Routes>
            <Route path="*" element={<EcranCaisse caisseId={caisseId} poste />} />
          </Routes>
        ) : (
          <div className="cmd-gate">
            <h3>Tablette non enregistrée</h3>
            <p>Cette connexion n'est liée à aucune caisse. Demande au directeur d'enregistrer la tablette.</p>
          </div>
        )}
      </main>
    </BrowserRouter>
  );
}
