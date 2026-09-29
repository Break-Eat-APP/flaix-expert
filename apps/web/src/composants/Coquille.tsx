import { useEffect, useState, type ComponentType } from "react";
import { NavLink, Outlet, useLocation } from "react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Calculator,
  ChevronRight,
  Flag,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Receipt,
  Rocket,
  Settings2,
  ShieldCheck,
  Ticket,
  Users,
  X,
} from "lucide-react";
import type { SessionInfo, Stand } from "@flaix/domain";
import { api } from "../api.ts";
import { useDeconnexion } from "../session.tsx";

interface Module {
  libelle: string;
  /** Absent = module pas encore construit en production (affiché « à venir »). */
  route?: string;
}
interface Section {
  id: string;
  libelle: string;
  icone: ComponentType<{ size?: number }>;
  modules?: Module[];
}

// Ordre et regroupement validés par Rémi le 2026-09-28 (dossier §15.81, §15.84, §15.85).
const MENU: Section[] = [
  { id: "dashboard", libelle: "Dashboard", icone: LayoutDashboard, modules: [{ libelle: "Ventes & CA" }, { libelle: "Gestion financière" }] },
  { id: "caisses", libelle: "Mes caisses", icone: Receipt },
  {
    id: "configuration",
    libelle: "Configuration",
    icone: Settings2,
    modules: [
      { libelle: "Identité du lieu", route: "/configuration/identite" },
      { libelle: "Gestion des stands & caisses", route: "/configuration/stands" },
      { libelle: "Config produits", route: "/configuration/produits" },
      { libelle: "Click & Collect" },
      { libelle: "Configuration cible & marge" },
      { libelle: "Coûts par buvette" },
    ],
  },
  { id: "stock", libelle: "Stock", icone: Package },
  { id: "personnel", libelle: "Personnel et planning", icone: Users },
  {
    id: "cloture",
    libelle: "Clôture & Pilotage",
    icone: Flag,
    modules: [
      { libelle: "Optimisation" },
      { libelle: "Centre d'alertes" },
      { libelle: "Écart de caisse" },
      { libelle: "Écart de clôture d'événement" },
      { libelle: "Clôtures mensuelle & annuelle" },
      { libelle: "Reporting de soirée" },
      { libelle: "Marges & ratios" },
    ],
  },
  { id: "fidelite", libelle: "Fidélité", icone: Ticket },
  { id: "facturation", libelle: "Facturation", icone: Calculator },
  {
    id: "conformite",
    libelle: "Conformité & Lexique",
    icone: ShieldCheck,
    modules: [{ libelle: "Journal technique", route: "/conformite/journal" }, { libelle: "Attestation & archives" }, { libelle: "Lexique des règles" }],
  },
];

function sectionDeLaRoute(chemin: string): string | undefined {
  return MENU.find((s) => s.modules?.some((m) => m.route && chemin.startsWith(m.route)))?.id;
}

export function Coquille({ session }: { session: SessionInfo }) {
  const { pathname } = useLocation();
  const deconnecter = useDeconnexion();
  const [mobileVisible, setMobileVisible] = useState(false);
  // L'ouverture d'une section ne dépend pas de l'écran affiché : un second clic la referme (correctif §15.49).
  const [ouvertes, setOuvertes] = useState<Set<string>>(() => new Set([sectionDeLaRoute(pathname) ?? "configuration"]));
  const stands = useQuery({ queryKey: ["stands"], queryFn: () => api.get<Stand[]>("/stands"), enabled: session.role === "directeur" });

  useEffect(() => setMobileVisible(false), [pathname]);

  const actifs = stands.data?.filter((s) => s.actif) ?? [];
  const nbCaisses = actifs.reduce((n, s) => n + s.caisses.filter((c) => c.actif).length, 0);

  const basculer = (id: string) =>
    setOuvertes((o) => {
      const n = new Set(o);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

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
          <NavLink to="/" end className={({ isActive }) => `nav-section${isActive ? " active" : ""}`}>
            <Rocket size={17} /> Démarrage du lieu
          </NavLink>
          {MENU.map((section) => {
            const Icone = section.icone;
            const construits = section.modules?.filter((m) => m.route) ?? [];
            if (construits.length === 0) {
              return (
                <button key={section.id} className="nav-section" disabled>
                  <Icone size={17} /> {section.libelle}
                  <span className="etiquette-a-venir" title="Pas encore construit en production">
                    à venir
                  </span>
                </button>
              );
            }
            const ouverte = ouvertes.has(section.id);
            const active = sectionDeLaRoute(pathname) === section.id;
            return (
              <div key={section.id}>
                <button
                  className={`nav-section${ouverte ? " ouverte" : ""}${active ? " active" : ""}`}
                  onClick={() => basculer(section.id)}
                  aria-expanded={ouverte}
                >
                  <Icone size={17} /> {section.libelle}
                  <ChevronRight size={15} className="chevron" />
                </button>
                {ouverte && (
                  <div className="nav-sous">
                    {section.modules!.map((m) =>
                      m.route ? (
                        <NavLink key={m.libelle} to={m.route} className={({ isActive }) => `nav-module${isActive ? " active" : ""}`}>
                          {m.libelle}
                        </NavLink>
                      ) : (
                        <span key={m.libelle} className="nav-module a-venir" title="Pas encore construit en production">
                          {m.libelle} <span className="etiquette-a-venir">à venir</span>
                        </span>
                      ),
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="laterale-pied">
          <div className="utilisateur">
            <strong>{session.utilisateur.nom}</strong>
            <span className="discret">{session.role === "directeur" ? "Directeur" : session.role === "operateur" ? "Opérateur" : "Vérificateur"}</span>
          </div>
          <NavLink to="/compte" className={({ isActive }) => `nav-module${isActive ? " active" : ""}`} style={{ marginLeft: 0 }}>
            <KeyRound size={15} /> Mon mot de passe
          </NavLink>
          <button className="nav-module" onClick={deconnecter}>
            <LogOut size={15} /> Se déconnecter
          </button>
        </div>
      </aside>

      <main className="contenu">
        <Outlet />
      </main>
    </div>
  );
}
