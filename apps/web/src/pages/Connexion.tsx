import { useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { SessionInfo } from "@flaix/domain";
import { api } from "../api.ts";
import { MessageErreur } from "../composants/communs.tsx";

/** Connexion par e-mail (directeur). Sur une tablette enregistrée, un lien ramène à l'écran des caissières. */
export function Connexion({ versCaissieres }: { versCaissieres?: () => void }) {
  const client = useQueryClient();
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [erreur, setErreur] = useState<unknown>(null);
  const [envoi, setEnvoi] = useState(false);

  async function soumettre(e: FormEvent) {
    e.preventDefault();
    setEnvoi(true);
    setErreur(null);
    try {
      const session = await api.post<SessionInfo>("/auth/connexion", { email, motDePasse });
      client.setQueryData(["session"], session);
    } catch (err) {
      setErreur(err);
      setMotDePasse("");
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <div className="page-connexion">
      <form className="carte boite-connexion" onSubmit={soumettre}>
        <div className="marque">
          <div className="marque-logo">X</div>
          <div className="marque-nom">
            Flai<span>X</span> Expert
          </div>
        </div>
        <h2 style={{ marginBottom: 14 }}>Connexion</h2>
        <label className="champ">
          <span>Adresse e-mail</span>
          <input type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="champ" style={{ marginTop: 12 }}>
          <span>Mot de passe</span>
          <input type="password" autoComplete="current-password" required value={motDePasse} onChange={(e) => setMotDePasse(e.target.value)} />
        </label>
        <MessageErreur erreur={erreur} />
        <button className="btn btn-bloc" style={{ marginTop: 16 }} disabled={envoi}>
          {envoi ? "Connexion…" : "Se connecter"}
        </button>
        <p className="aide" style={{ marginTop: 14 }}>
          Chaque connexion est inscrite au journal technique de ton lieu (date, heure, personne).
        </p>
        {versCaissieres && (
          <p className="aide" style={{ textAlign: "center" }}>
            <button type="button" className="btn-lien" onClick={versCaissieres}>
              ← Connexion des caissières (code)
            </button>
          </p>
        )}
      </form>
    </div>
  );
}
