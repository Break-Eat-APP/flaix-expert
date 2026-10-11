import { lazy, Suspense, useState } from "react";
import { BrowserRouter, Route, Routes } from "react-router";
import { LogOut, ShieldCheck, ShoppingCart } from "lucide-react";
import type { SessionInfo } from "@flaix/domain";
import { useDeconnexion, useOptions } from "../../session.tsx";
import { Chargement } from "../../composants/communs.tsx";
import { EcranCaisse } from "./EcranCaisse.tsx";
import { BandeauFormation } from "../../composants/Formation.tsx";
import { Logo } from "../../composants/Logo.tsx";

const Hygiene = lazy(() => import("../hygiene/Hygiene.tsx").then((m) => ({ default: m.Hygiene })));

/**
 * Poste d'une caissière (dossier §15.100) : l'écran de vente de la caisse de cette tablette, et l'hygiène de la
 * journée (§15.159) — ni menu, ni résultats, ni paramètres. Passer à l'hygiène ne ferme pas la caisse : le ticket
 * en cours reste là.
 */
export function PosteCaissiere({ session }: { session: SessionInfo }) {
  const deconnecter = useDeconnexion();
  const options = useOptions();
  const [confirmer, setConfirmer] = useState(false);
  const [hygiene, setHygiene] = useState(false);
  const caisseId = session.appareil?.caisseId;
  const horsLigne = typeof navigator !== "undefined" && !navigator.onLine;

  return (
    <BrowserRouter>
      <div className="poste-entete">
        <Logo hauteur={30} />
        <span className="discret" style={{ fontSize: 13 }}>{session.lieu.nom}</span>
        <div className="qui">
          <span>
            Caissière : <strong>{session.utilisateur.nom}</strong>
          </span>
          {options.hygiene && caisseId && (
            <button className="btn btn-fantome" onClick={() => setHygiene(!hygiene)}>
              {hygiene ? (
                <>
                  <ShoppingCart size={15} /> Retour à la caisse
                </>
              ) : (
                <>
                  <ShieldCheck size={15} /> Hygiène
                </>
              )}
            </button>
          )}
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
          <>
            <div style={hygiene ? { display: "none" } : undefined}>
              <Routes>
                <Route path="*" element={<EcranCaisse caisseId={caisseId} poste />} />
              </Routes>
            </div>
            {hygiene && (
              <Suspense fallback={<Chargement />}>
                <Hygiene equipe />
              </Suspense>
            )}
          </>
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
