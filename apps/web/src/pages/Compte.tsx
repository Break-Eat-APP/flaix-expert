import { useState, type FormEvent } from "react";
import { api } from "../api.ts";
import { LONGUEUR_MIN_MOT_DE_PASSE } from "@flaix/domain";
import { Carte, EntetePage, MessageErreur } from "../composants/communs.tsx";
import { ChampMotDePasse } from "../composants/MotDePasse.tsx";

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
      <Carte titre="Changer de mot de passe" description={`${LONGUEUR_MIN_MOT_DE_PASSE} caractères au minimum, pas un des plus courants (123456, azerty…). Les autres sessions ouvertes avec l'ancien mot de passe sont fermées.`}>
        <form onSubmit={soumettre} style={{ maxWidth: 420 }}>
          <label className="champ">
            <span>Mot de passe actuel</span>
            <ChampMotDePasse autoComplete="current-password" value={actuel} onChange={setActuel} />
          </label>
          <label className="champ" style={{ marginTop: 12 }}>
            <span>Nouveau mot de passe</span>
            <ChampMotDePasse autoComplete="new-password" minLength={LONGUEUR_MIN_MOT_DE_PASSE} value={nouveau} onChange={setNouveau} />
          </label>
          <label className="champ" style={{ marginTop: 12 }}>
            <span>Confirmer le nouveau mot de passe</span>
            <ChampMotDePasse autoComplete="new-password" value={confirmation} onChange={setConfirmation} />
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
