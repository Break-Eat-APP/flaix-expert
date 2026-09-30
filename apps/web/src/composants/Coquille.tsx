import { useEffect, useState, type ComponentType } from "react";
import { NavLink, Outlet, useLocation } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { ChartLine, KeyRound, Lock, LogOut, Menu, Package, Receipt, SlidersHorizontal, Users, X } from "lucide-react";
import type { SessionInfo, Stand } from "@flaix/domain";
import { api } from "../api.ts";
import { useDeconnexion } from "../session.tsx";

interface Entree {
  id: string;
  libelle: string;
  icone: ComponentType<{ size?: number }>;
  /** Absent = entrée pas encore construite en production (affichée « à venir »). */
  route?: string;
}

// Organisation en 6 entrées validée par Rémi le 2026-09-29 (dossier §15.95), appliquée au §15.96.
// Chaque entrée ouvre un seul écran ; les sous-parties sont des onglets ou des tuiles dans l'écran.
const MENU: Entree[] = [
  { id: "resultats", libelle: "Résultats", icone: ChartLine, route: "/" },
  { id: "caisses", libelle: "Caisses", icone: Receipt, route: "/caisses" },
  { id: "stock", libelle: "Stock", icone: Package, route: "/stock" },
  { id: "equipe", libelle: "Équipe", icone: Users, route: "/equipe" },
  { id: "clotures", libelle: "Clôtures", icone: Lock, route: "/clotures" },
  { id: "parametres", libelle: "Paramètres", icone: SlidersHorizontal, route: "/parametres" },
];

export function Coquille({ session }: { session: SessionInfo }) {
  const { pathname } = useLocation();
  const deconnecter = useDeconnexion();
  const [mobileVisible, setMobileVisible] = useState(false);
  const stands = useQuery({ queryKey: ["stands"], queryFn: () => api.get<Stand[]>("/stands"), enabled: session.role === "directeur" });

  useEffect(() => setMobileVisible(false), [pathname]);

  const actifs = stands.data?.filter((s) => s.actif) ?? [];
  const nbCaisses = actifs.reduce((n, s) => n + s.caisses.filter((c) => c.actif).length, 0);

  return (
    <div className="coquille">
      <div className="barre-mobile">
        <span className="marque-nom">
          Flai<span>X</span> Expert
        </span>
        <button className="btn-fantome btn" onClick={() => setMobileVisible(true)} aria-label="Ouvrir le menu">
          <Menu size={18} />
        </button>
      </div>

      <aside className={`laterale${mobileVisible ? " visible" : ""}`}>
        <div className="en-ligne" style={{ justifyContent: "space-between" }}>
          <div className="marque">
            <div className="marque-logo">X</div>
            <div className="marque-nom">
              Flai<span>X</span> Expert
            </div>
          </div>
          {mobileVisible && (
            <button className="btn-lien" onClick={() => setMobileVisible(false)} aria-label="Fermer le menu">
              <X size={20} />
            </button>
          )}
        </div>

        <NavLink to="/" className="lieu-actif" style={{ textDecoration: "none" }}>
          <strong>{session.lieu.nom}</strong>
          <small>
            {stands.data
              ? `${actifs.length} stand${actifs.length > 1 ? "s" : ""} · ${nbCaisses} caisse${nbCaisses > 1 ? "s" : ""}`
              : "…"}
          </small>
        </NavLink>

        <nav className="nav" aria-label="Menu principal">
          {MENU.map((entree) => {
            const Icone = entree.icone;
            return entree.route ? (
              <NavLink key={entree.id} to={entree.route} end={entree.route === "/"} className={({ isActive }) => `nav-section${isActive ? " active" : ""}`}>
                <Icone size={17} /> {entree.libelle}
              </NavLink>
            ) : (
              <button key={entree.id} className="nav-section" disabled>
                <Icone size={17} /> {entree.libelle}
                <span className="etiquette-a-venir" title="Pas encore construit en production">
                  à venir
                </span>
              </button>
            );
          })}
          <div className="plus-tard">
            <b>Plus tard</b>Fidélité · Facturation
          </div>
        </nav>

        <div className="laterale-pied">
          <div className="utilisateur">
            <strong>{session.utilisateur.nom}</strong>
            <span className="discret">{session.role === "directeur" ? "Directeur" : session.role === "operateur" ? "Caissière" : "Vérificateur"}</span>
          </div>
          <NavLink to="/compte" className={({ isActive }) => `nav-module${isActive ? " active" : ""}`} style={{ marginLeft: 0 }}>
            <KeyRound size={15} /> Mon mot de passe
          </NavLink>
          <button className="nav-module" onClick={deconnecter}>
            <LogOut size={15} /> Se déconnecter
          </button>
        </div>
      </aside>

      <div>
        {session.environnement !== "production" && (
          <div className="bandeau-test" role="note">
            {session.environnement === "test"
              ? "VERSION DE TEST — aucune vente réelle, aucun encaissement : les chiffres saisis ici servent uniquement à essayer le logiciel."
              : "DÉVELOPPEMENT LOCAL — base de données de développement, aucune vente réelle."}
          </div>
        )}
        <main className="contenu">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
