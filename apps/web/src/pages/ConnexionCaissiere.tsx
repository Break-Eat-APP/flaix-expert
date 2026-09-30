import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Delete } from "lucide-react";
import type { AccueilTablette, SessionInfo } from "@flaix/domain";
import { api } from "../api.ts";
import { MessageErreur } from "../composants/communs.tsx";
import { BandeauFormation } from "../composants/Formation.tsx";

/**
 * Accueil d'une tablette enregistrée comme caisse (dossier §15.100) : la caissière touche son nom,
 * puis tape son code à 4 chiffres. Le code ne fonctionne que sur une tablette enregistrée.
 */
export function ConnexionCaissiere({ accueil, versDirecteur }: { accueil: AccueilTablette; versDirecteur: () => void }) {
  const client = useQueryClient();
  const [choisie, setChoisie] = useState<{ id: string; nom: string } | null>(null);
  const [code, setCode] = useState("");
  const [erreur, setErreur] = useState<unknown>(null);
  const [envoi, setEnvoi] = useState(false);

  async function soumettre(complet: string) {
    if (!choisie) return;
    setEnvoi(true);
    setErreur(null);
    try {
      const session = await api.post<SessionInfo>("/auth/code", { caissiereId: choisie.id, code: complet });
      client.setQueryData(["session"], session);
    } catch (e) {
      setErreur(e);
      setCode("");
    } finally {
      setEnvoi(false);
    }
  }

  // Le code part tout seul au 4e chiffre.
  function taper(chiffre: string) {
    if (envoi || code.length >= 4) return;
    const suivant = code + chiffre;
    setCode(suivant);
    if (suivant.length === 4) void soumettre(suivant);
  }
  const k = accueil.caisse;

  return (
    <div className="page-connexion">
      {accueil.formation && <BandeauFormation />}
      <div className="carte boite-caissiere">
        <div className="marque">
          <div className="marque-logo">X</div>
          <div className="marque-nom">
            Flai<span>X</span> Expert
          </div>
        </div>
        <p className="tablette-caisse">
          {accueil.lieuNom} · <strong>Caisse {k.numero}{k.nom ? ` — ${k.nom}` : ""}</strong> · {k.standNom}
        </p>

        {!choisie ? (
          <>
            <h2 style={{ marginBottom: 12, textAlign: "center" }}>Qui encaisse ?</h2>
            {accueil.caissieres.length === 0 ? (
              <div className="message message-info">Aucune caissière n'est encore créée. Le directeur les ajoute dans Équipe → Fiches.</div>
            ) : (
              <div className="code-noms">
                {accueil.caissieres.map((c) => (
                  <button key={c.id} className="code-nom" onClick={() => { setChoisie(c); setCode(""); setErreur(null); }}>
                    {c.nom}
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            <h2 style={{ marginBottom: 4, textAlign: "center" }}>{choisie.nom}</h2>
            <p className="aide" style={{ textAlign: "center", margin: 0 }}>Tape ton code personnel</p>
            <div className="code-points" aria-label={`${code.length} chiffre(s) saisi(s) sur 4`}>
              {[0, 1, 2, 3].map((i) => (
                <span key={i} className={i < code.length ? "plein" : ""} />
              ))}
            </div>
            <MessageErreur erreur={erreur} />
            <div className="code-pave">
              {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((n) => (
                <button key={n} className="code-touche" disabled={envoi} onClick={() => taper(n)}>
                  {n}
                </button>
              ))}
              <button className="code-touche discrete" onClick={() => { setChoisie(null); setCode(""); setErreur(null); }}>
                Changer de nom
              </button>
              <button className="code-touche" disabled={envoi} onClick={() => taper("0")}>
                0
              </button>
              <button className="code-touche" disabled={envoi || code.length === 0} onClick={() => setCode((c) => c.slice(0, -1))} aria-label="Effacer le dernier chiffre">
                <Delete size={20} />
              </button>
            </div>
          </>
        )}

        <p className="aide" style={{ marginTop: 18, textAlign: "center" }}>
          Chaque connexion est inscrite au journal du lieu. Code oublié ou fiche bloquée : le directeur te donne un nouveau code.
          <br />
          <button className="btn-lien" style={{ marginTop: 8 }} onClick={versDirecteur}>
            Connexion directeur (e-mail)
          </button>
        </p>
      </div>
    </div>
  );
}
