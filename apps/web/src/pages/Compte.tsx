import { useState, type FormEvent } from "react";
import { api } from "../api.ts";
import { Carte, EntetePage, MessageErreur } from "../composants/communs.tsx";

export function Compte() {
  const [actuel, setActuel] = useState("");
  const [nouveau, setNouveau] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [erreur, setErreur] = useState<unknown>(null);
  const [ok, setOk] = useState(false);

  async function soumettre(e: FormEvent) {
    e.preventDefault();
    setErreur(null);
    setOk(false);
    if (nouveau !== confirmation) {
      setErreur(new Error("Les deux saisies du nouveau mot de passe ne correspondent pas."));
      return;
    }
    try {
      await api.post("/auth/mot-de-passe", { actuel, nouveau });
      setOk(true);
      setActuel("");
      setNouveau("");
      setConfirmation("");
    } catch (err) {
      setErreur(err);
    }
  }

  return (
    <>
      <EntetePage titre="Mon mot de passe" description="Remplace ici le mot de passe provisoire reçu à la création de ton compte." />
      <Carte titre="Changer de mot de passe" description="12 caractères au minimum. Les autres sessions ouvertes avec l'ancien mot de passe sont fermées.">
        <form onSubmit={soumettre} style={{ maxWidth: 420 }}>
          <label className="champ">
            <span>Mot de passe actuel</span>
            <input type="password" autoComplete="current-password" required value={actuel} onChange={(e) => setActuel(e.target.value)} />
          </label>
          <label className="champ" style={{ marginTop: 12 }}>
            <span>Nouveau mot de passe</span>
            <input type="password" autoComplete="new-password" required minLength={12} value={nouveau} onChange={(e) => setNouveau(e.target.value)} />
          </label>
          <label className="champ" style={{ marginTop: 12 }}>
            <span>Confirmer le nouveau mot de passe</span>
            <input type="password" autoComplete="new-password" required value={confirmation} onChange={(e) => setConfirmation(e.target.value)} />
          </label>
          <MessageErreur erreur={erreur} />
          {ok && <div className="message message-ok">Mot de passe modifié.</div>}
          <div className="ligne-actions">
            <button className="btn">Enregistrer</button>
          </div>
        </form>
      </Carte>
    </>
  );
}
