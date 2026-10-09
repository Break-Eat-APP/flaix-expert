import { Suspense, useEffect, useState, type ComponentType } from "react";
import { NavLink, Outlet, useLocation } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { Cable, ChartLine, FileText, Heart, KeyRound, Lock, LogOut, Menu, Package, Receipt, SlidersHorizontal, Sparkles, Users, X } from "lucide-react";
import type { OptionLieu, OptionsLieu, SessionInfo, Stand } from "@flaix/domain";
import { api } from "../api.ts";
import { useDeconnexion, useOptions } from "../session.tsx";
import { BandeauFormation } from "./Formation.tsx";
import { Logo } from "./Logo.tsx";
import { Chargement } from "./communs.tsx";

interface Entree {
  id: string;
  libelle: string;
  icone: ComponentType<{ size?: number }>;
  /** Absent = entrée pas encore construite en production (affichée « à venir »). */
  route?: string;
  /** Option du lieu dont dépend l'entrée (activée par FlaiX Expert, §15.118). */
  option?: OptionLieu;
}

// Organisation en 6 entrées validée par Rémi le 2026-09-29 (dossier §15.95), appliquée au §15.96.
// Chaque entrée ouvre un seul écran ; les sous-parties sont des onglets ou des tuiles dans l'écran.
const MENU: Entree[] = [
  { id: "resultats", libelle: "Résultats", icone: ChartLine, route: "/" },
  { id: "assistant", libelle: "Assistant", icone: Sparkles, route: "/assistant", option: "assistant" },
  { id: "caisses", libelle: "Caisses", icone: Receipt, route: "/caisses" },
  { id: "caisses-connectees", libelle: "Caisses connectées", icone: Cable, route: "/caisses-connectees", option: "caisses_connectees" },
  { id: "stock", libelle: "Stock", icone: Package, route: "/stock", option: "stock" },
  { id: "equipe", libelle: "Équipe", icone: Users, route: "/equipe" },
  { id: "clotures", libelle: "Clôtures", icone: Lock, route: "/clotures" },
  { id: "fidelite", libelle: "Fidélité", icone: Heart, route: "/fidelite", option: "fidelite" },
  { id: "factures", libelle: "Factures", icone: FileText, route: "/factures", option: "factures" },
  { id: "parametres", libelle: "Paramètres", icone: SlidersHorizontal, route: "/parametres" },
];

/** Entrées du menu pour les options du lieu : une option désactivée par FlaiX Expert disparaît du menu. */
export function menuDuLieu(options: OptionsLieu): Entree[] {
  return MENU.filter((e) => !e.option || options[e.option]);
}

export function Coquille({ session }: { session: SessionInfo }) {
  const { pathname } = useLocation();
  const deconnecter = useDeconnexion();
  const options = useOptions();
  const [mobileVisible, setMobileVisible] = useState(false);
  const stands = useQuery({ queryKey: ["stands"], queryFn: () => api.get<Stand[]>("/stands"), enabled: session.role === "directeur" || session.role === "support" });

  useEffect(() => setMobileVisible(false), [pathname]);

  const actifs = stands.data?.filter((s) => s.actif) ?? [];
  const nbCaisses = actifs.reduce((n, s) => n + s.caisses.filter((c) => c.actif).length, 0);

  return (
    <div className="coquille">
      <div className="barre-mobile">
        <Logo hauteur={30} />
        <button className="btn-fantome btn" onClick={() => setMobileVisible(true)} aria-label="Ouvrir le menu">
          <Menu size={18} />
        </button>
      </div>

      <aside className={`laterale${mobileVisible ? " visible" : ""}`}>
        <div className="en-ligne" style={{ justifyContent: "space-between" }}>
          <div className="marque">
            <Logo hauteur={50} />
          </div>
          {mobileVisible && (
            <button className="btn-lien" onClick={() => setMobileVisible(false)} aria-label="Fermer le menu">
              <X size={20} />
            </button>
          )}
        </div>

        <NavLink to="/" className="lieu-actif" style={{ textDecoration: "none" }}>
          <strong>{session.lieu.nom}</strong>
          {session.formation && <span className="puce puce-ambre" style={{ display: "table", margin: "4px 0" }}>Lieu d&apos;entraînement — factice</span>}
          <small>
            {stands.data
              ? `${actifs.length} stand${actifs.length > 1 ? "s" : ""} · ${nbCaisses} caisse${nbCaisses > 1 ? "s" : ""}`
              : "…"}
          </small>
        </NavLink>

        <nav className="nav" aria-label="Menu principal">
          {menuDuLieu(options).map((entree) => {
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
            <b>Plus tard</b>Campagnes · Wallet
          </div>
        </nav>

        <div className="laterale-pied">
          <div className="utilisateur">
            <strong>{session.utilisateur.nom}</strong>
            <span className="discret">{session.role === "directeur" ? "Directeur" : session.role === "operateur" ? "Caissière" : session.role === "support" ? "Support FlaiX Expert" : "Vérificateur"}</span>
          </div>
          {session.role !== "support" && (
            <NavLink to="/compte" className={({ isActive }) => `nav-module${isActive ? " active" : ""}`} style={{ marginLeft: 0 }}>
              <KeyRound size={15} /> Mon mot de passe
            </NavLink>
          )}
          <button className="nav-module" onClick={deconnecter}>
            <LogOut size={15} /> Se déconnecter
          </button>
        </div>
      </aside>

      <div>
        {session.formation && <BandeauFormation quitter={session.role === "directeur"} />}
        {session.support && (
          <div className="bandeau-formation" role="alert">
            <span>
              <strong>SUPPORT FLAIX EXPERT — LECTURE SEULE</strong>
              <span className="bandeau-detail"> · autorisé par le lieu jusqu'à {new Date(session.support.jusqua).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" })} ; chaque écran consulté est inscrit à son journal. Rien ne peut être modifié.</span>
            </span>
            <button className="btn btn-fantome" style={{ fontSize: 12.5, padding: "4px 10px" }} onClick={deconnecter}>
              Quitter
            </button>
          </div>
        )}
        {session.formation && pathname.startsWith("/parametres/") && !["/parametres/formation", "/parametres/saison"].includes(pathname) && (
          <div className="message message-alerte" style={{ margin: "12px 24px 0" }}>
            En formation, la configuration est celle du vrai lieu : consultation seulement. Elle se modifie après être sorti de la formation.
          </div>
        )}
        {session.environnement !== "production" && (
          <div className="bandeau-test" role="note">
            {session.environnement === "test"
              ? "VERSION DE TEST — aucune vente réelle, aucun encaissement : les chiffres saisis ici servent uniquement à essayer le logiciel."
              : "DÉVELOPPEMENT LOCAL — base de données de développement, aucune vente réelle."}
          </div>
        )}
        <main className="contenu">
          <Suspense fallback={<Chargement />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
