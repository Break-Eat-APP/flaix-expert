import { useState } from "react";
import { Link } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Lock } from "lucide-react";
import type { Evenement } from "@flaix/domain";
import { api, formaterDateHeure } from "../../api.ts";
import { Carte, Chargement, EntetePage, EtatVide, MessageErreur, Regles } from "../../composants/communs.tsx";

type Onglet = "match" | "periode" | "archives";

/**
 * Clôtures (organisation en 6 entrées, dossier §15.96). Porte la clôture définitive du
 * match, déplacée du calendrier. Le reste de l'assistant (écart de caisse, restes comptés),
 * les clôtures de période et les archives arriveront avec le module Clôtures.
 */
export function Clotures() {
  const client = useQueryClient();
  // Relu à chaque visite : le nombre de caisses encore ouvertes doit être à jour.
  const evenements = useQuery({ queryKey: ["evenements"], queryFn: () => api.get<Evenement[]>("/evenements"), refetchOnMount: "always" });
  const [onglet, setOnglet] = useState<Onglet>("match");
  const [confirmer, setConfirmer] = useState(false);
  const clore = useMutation({
    mutationFn: (id: string) => api.post<Evenement[]>(`/evenements/${id}/cloture`),
    onSuccess: (l) => {
      client.setQueryData(["evenements"], l);
      client.invalidateQueries({ queryKey: ["tableau-caisses"] });
      setConfirmer(false);
    },
  });

  if (evenements.isPending) return <Chargement />;
  if (evenements.error) return <MessageErreur erreur={evenements.error} />;
  const evts = evenements.data!;
  const ouvert = evts.find((e) => e.etat === "ouvert");
  const clos = evts
    .filter((e) => e.etat === "clos")
    .sort((a, b) => new Date(b.closLe ?? b.debut).getTime() - new Date(a.closLe ?? a.debut).getTime());

  const bouton = (id: Onglet, libelle: string, aVenir = false) => (
    <button className={`onglet${onglet === id ? " actif" : ""}`} onClick={() => setOnglet(id)}>
      {libelle}
      {aVenir && <span className="etiquette-a-venir" style={{ marginLeft: 8 }}>à venir</span>}
    </button>
  );

  return (
    <>
      <EntetePage titre="Clôtures" description="Boucler la soirée, puis le mois et l'année." />
      <div className="onglets">
        {bouton("match", "Clôture du match")}
        {bouton("periode", "Mois & année", true)}
        {bouton("archives", "Archives & contrôle", true)}
      </div>

      {onglet === "match" ? (
        <>
          <Carte titre="Match en cours">
            {!ouvert ? (
              <EtatVide titre="Aucun match ouvert">
                Le match du jour s'ouvre dans <Link to="/caisses">Caisses</Link>.
              </EtatVide>
            ) : (
              <>
                <div className="caisse">
                  <div style={{ flex: 1 }}>
                    <strong>{ouvert.libelle}</strong>
                    <div className="discret" style={{ fontSize: 12.5 }}>
                      {formaterDateHeure(ouvert.debut)} · {ouvert.caissesOuvertes} caisse{ouvert.caissesOuvertes > 1 ? "s" : ""} encore ouverte
                      {ouvert.caissesOuvertes > 1 ? "s" : ""}
                    </div>
                  </div>
                  <span className="puce puce-vert">Ouvert</span>
                </div>
                {ouvert.caissesOuvertes > 0 && (
                  <div className="message message-alerte">
                    Clôture d'abord chaque caisse depuis son écran de caisse. <Link to={`/caisses?match=${ouvert.id}`}>Voir les caisses</Link>
                  </div>
                )}
                <div className="ligne-actions">
                  {confirmer ? (
                    <>
                      <button className="btn btn-danger" disabled={clore.isPending} onClick={() => clore.mutate(ouvert.id)}>
                        Confirmer la clôture définitive
                      </button>
                      <button className="btn btn-fantome" onClick={() => setConfirmer(false)}>
                        Retour
                      </button>
                    </>
                  ) : (
                    <button className="btn btn-danger" disabled={ouvert.caissesOuvertes > 0} onClick={() => setConfirmer(true)}>
                      <Lock size={15} /> Clore le match
                    </button>
                  )}
                </div>
                <MessageErreur erreur={clore.error} />
              </>
            )}
          </Carte>

          <div className="message message-info">
            Les autres étapes de la clôture — comptage des espèces, rapprochement de la carte, écart de caisse, restes du stock — arriveront avec le module Clôtures. Elles se feront ici, dans l'ordre, avant la clôture définitive.
          </div>

          <Carte titre="Matchs clos">
            {clos.length === 0 ? (
              <EtatVide titre="Aucun match clos pour l'instant" />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {clos.map((e) => (
                  <div key={e.id} className="caisse">
                    <div style={{ flex: 1 }}>
                      <strong>{e.libelle}</strong>
                      <div className="discret" style={{ fontSize: 12.5 }}>
                        {formaterDateHeure(e.debut)}
                        {e.closLe && ` · clos le ${formaterDateHeure(e.closLe)}`}
                      </div>
                    </div>
                    <span className="puce puce-violet">Clos</span>
                    <div className="actions">
                      <Link className="btn btn-fantome" to={`/caisses?match=${e.id}&vue=tickets`}>
                        Voir les tickets
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Carte>
        </>
      ) : (
        <Carte>
          <EtatVide titre="Pas encore construit">
            {onglet === "periode"
              ? "Clôtures mensuelle et annuelle : les totaux de la période seront figés et scellés ici."
              : "Archives annuelles et accès d'un vérificateur de l'administration : ils seront préparés ici."}
          </EtatVide>
        </Carte>
      )}

      <Regles>
        <ul>
          <li><strong>Clore le match est définitif</strong> : un match clos ne se rouvre jamais. Ses ventes et ses annulations ne bougent plus ; ses chiffres deviennent définitifs.</li>
          <li>Un match ne se clôt qu'une fois <strong>toutes ses caisses clôturées</strong> (chacune depuis son écran de caisse). Le serveur le vérifie lui-même.</li>
          <li>Chaque clôture est inscrite au journal technique du lieu, avec son auteur et l'heure.</li>
        </ul>
      </Regles>
    </>
  );
}
