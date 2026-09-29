import { useState, type ReactNode } from "react";
import { ChevronDown, ChevronUp, BookOpen } from "lucide-react";

export function EntetePage({ fil, titre, description, actions }: { fil?: string; titre: string; description?: ReactNode; actions?: ReactNode }) {
  return (
    <header className="entete-page">
      <div>
        {fil && <div className="fil">{fil}</div>}
        <h1 className="titre-page">{titre}</h1>
        {description && <p>{description}</p>}
      </div>
      {actions && <div className="en-ligne">{actions}</div>}
    </header>
  );
}

export function Carte({ titre, description, actions, children }: { titre?: string; description?: ReactNode; actions?: ReactNode; children: ReactNode }) {
  return (
    <section className="carte">
      {(titre || actions) && (
        <div className="carte-entete">
          <div>
            {titre && <h2>{titre}</h2>}
            {description && <p>{description}</p>}
          </div>
          {actions && <div className="en-ligne">{actions}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

/**
 * Section « Règles » en bas de chaque module : fermée par défaut, une flèche l'ouvre et
 * la referme (décision du 2026-09-07, après trois essais). C'est du texte produit, pas une
 * note de maquette : il explique comment chaque chiffre est obtenu.
 */
export function Regles({ children }: { children: ReactNode }) {
  const [ouvert, setOuvert] = useState(false);
  return (
    <section className="regles">
      <button type="button" onClick={() => setOuvert(!ouvert)} aria-expanded={ouvert}>
        <BookOpen size={16} /> Règles — comment fonctionne cet écran
        <span>
          {ouvert ? "Masquer" : "Afficher"} {ouvert ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </span>
      </button>
      {ouvert && <div className="regles-contenu">{children}</div>}
    </section>
  );
}

export function EtatVide({ titre, children }: { titre: string; children?: ReactNode }) {
  return (
    <div className="etat-vide">
      <strong>{titre}</strong>
      {children}
    </div>
  );
}

export function MessageErreur({ erreur }: { erreur: unknown }) {
  if (!erreur) return null;
  const texte = erreur instanceof Error ? erreur.message : String(erreur);
  return (
    <div className="message message-erreur" role="alert">
      {texte}
    </div>
  );
}

export function Chargement() {
  return <div className="discret" style={{ padding: 20 }}>Chargement…</div>;
}
