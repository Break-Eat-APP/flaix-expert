import { useState } from "react";
import { Copy, Eye, EyeOff } from "lucide-react";

/** Champ de mot de passe avec un œil pour afficher ce qu'on tape (demande de Rémi, §15.122). */
export function ChampMotDePasse({
  value,
  onChange,
  autoComplete,
  required = true,
  minLength,
}: {
  value: string;
  onChange: (v: string) => void;
  autoComplete: "current-password" | "new-password";
  required?: boolean;
  minLength?: number;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="mdp">
      <input
        type={visible ? "text" : "password"}
        autoComplete={autoComplete}
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        required={required}
        minLength={minLength}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <button type="button" className="mdp-oeil" onClick={() => setVisible((v) => !v)} aria-pressed={visible} aria-label={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"} title={visible ? "Masquer" : "Afficher"}>
        {visible ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}

/** Mot de passe provisoire remis par le back-office : affiché une seule fois, à transmettre au directeur. */
export function MotDePasseRemis({ email, motDePasse }: { email: string; motDePasse: string }) {
  const [copie, setCopie] = useState(false);
  return (
    <div className="mdp-remis">
      <div>
        Mot de passe provisoire de <strong>{email}</strong> :
      </div>
      <div className="mdp-remis-ligne">
        <code className="mdp-remis-valeur">{motDePasse}</code>
        <button
          type="button"
          className="btn btn-fantome"
          onClick={() =>
            void navigator.clipboard?.writeText(motDePasse).then(
              () => setCopie(true),
              () => setCopie(false),
            )
          }
        >
          <Copy size={14} /> {copie ? "Copié" : "Copier"}
        </button>
      </div>
      <div className="aide" style={{ margin: 0 }}>
        Affiché une seule fois : note-le et transmets-le au directeur. Il le remplace dans « Mon mot de passe » dès sa première connexion.
      </div>
    </div>
  );
}
