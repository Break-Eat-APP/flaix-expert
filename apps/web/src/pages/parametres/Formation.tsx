import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { GraduationCap, RotateCcw } from "lucide-react";
import type { EtatFormation } from "@flaix/domain";
import { api, formaterDateHeure } from "../../api.ts";
import { Carte, Chargement, EntetePage, MessageErreur } from "../../composants/communs.tsx";
import { useBasculeFormation, useSession } from "../../session.tsx";

/**
 * Paramètres → Mode formation (BOFiP §150, tests B3/B4, dossier §15.109) : s'entraîner et former
 * les caissières dans un lieu d'entraînement à part, sans jamais toucher aux vrais chiffres.
 */
export function Formation() {
  const session = useSession().data!;
  const client = useQueryClient();
  const naviguer = useNavigate();
  const etat = useQuery({ queryKey: ["formation"], queryFn: () => api.get<EtatFormation>("/formation"), refetchOnMount: "always" });
  const bascule = useBasculeFormation();
  const [confirmer, setConfirmer] = useState(false);
  const remise = useMutation({
    mutationFn: () => api.post<EtatFormation>("/formation/remise-a-zero"),
    onSuccess: (e) => {
      client.setQueryData(["formation"], e);
      setConfirmer(false);
    },
  });

  if (etat.isPending) return <Chargement />;
  if (etat.error) return <MessageErreur erreur={etat.error} />;
  const e = etat.data!;
  const n = e.tablettesEnFormation;

  return (
    <>
      <EntetePage titre="Mode formation" description="S'entraîner et former les caissières sans jamais toucher aux vrais chiffres." />

      <Carte titre={session.formation ? "Tu es en formation" : "Ton poste"}>
        {session.formation ? (
          <p style={{ marginTop: 0 }}>
            Tout ce que tu fais ici est factice. Pour revenir aux vrais chiffres, clique sur « Quitter la formation » dans le bandeau en haut de l'écran.
          </p>
        ) : (
          <>
            <p style={{ marginTop: 0 }}>
              Tu passes dans le lieu d'entraînement, avec ta configuration du moment. Tu y retrouves tous les écrans : crée un match d'entraînement (Paramètres → Saison),
              ouvre-le, vends, clôture.
            </p>
            <button
              className="btn"
              disabled={bascule.isPending}
              onClick={() => bascule.mutate("entree", { onSuccess: () => void naviguer("/") })}
            >
              <GraduationCap size={15} /> Entrer en mode formation
            </button>
            <MessageErreur erreur={bascule.error} />
          </>
        )}
      </Carte>

      <Carte titre="Tablettes des caissières">
        <p style={{ marginTop: 0 }}>
          {n === 0 ? "Aucune tablette en formation." : `${n} tablette${n > 1 ? "s" : ""} en formation.`} Une tablette se met en formation dans{" "}
          <Link to="/equipe">Équipe → Tablettes</Link> : toute caissière qui s'y connecte vend alors en factice, sur la même caisse d'entraînement. Il faut un match
          d'entraînement ouvert, que tu ouvres toi-même en formation.
        </p>
        <p className="discret" style={{ marginBottom: 0 }}>
          Une tablette dont la vraie caisse est ouverte ne passe pas en formation : clôture la caisse d'abord. Pense à la sortir de la formation avant le vrai match.
        </p>
      </Carte>

      <Carte titre="Repartir de zéro" description="Pour une nouvelle séance avec des caissières, sur un lieu d'entraînement vierge.">
        {e.lieuFormation ? (
          <>
            <p style={{ marginTop: 0 }}>
              Lieu d'entraînement créé le {formaterDateHeure(e.lieuFormation.creeLe)}. Recommencer le met de côté (rien n'est effacé) : la prochaine entrée repart
              d'un lieu vierge, sans match ni vente d'entraînement.
            </p>
            {session.formation ? (
              <p className="discret" style={{ marginBottom: 0 }}>
                Quitte d'abord la formation pour la recommencer.
              </p>
            ) : confirmer ? (
              <div className="actions" style={{ justifyContent: "flex-start" }}>
                <button className="btn btn-danger" disabled={remise.isPending} onClick={() => remise.mutate()}>
                  Confirmer
                </button>
                <button className="btn btn-fantome" onClick={() => setConfirmer(false)}>
                  Annuler
                </button>
              </div>
            ) : (
              <button className="btn btn-fantome" onClick={() => setConfirmer(true)}>
                <RotateCcw size={15} /> Recommencer la formation
              </button>
            )}
            <MessageErreur erreur={remise.error} />
          </>
        ) : (
          <p style={{ margin: 0 }}>Le lieu d'entraînement sera créé à ta première entrée en formation.</p>
        )}
      </Carte>

      <Carte titre="Comment ça marche">
        <ul style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 6, lineHeight: 1.5 }}>
          <li>
            La formation se passe dans un <strong>lieu d'entraînement à part</strong>, copie de ta configuration (identité, stands, caisses, produits et prix, équipe),
            remise à jour à chaque entrée.
          </li>
          <li>
            Tout y fonctionne comme en vrai : matchs, ventes, annulations, tickets, clôtures, stock, planning. <strong>Rien n'en sort</strong> : aucune vente, aucun Z,
            aucun compteur du vrai lieu n'est touché. C'est la base de données elle-même qui sépare les deux lieux.
          </li>
          <li>
            Chaque écran et chaque ticket porte la mention <strong>« FACTICE »</strong>, qu'on ne peut pas masquer. Chaque entrée, sortie et remise à zéro est inscrite
            au journal technique du vrai lieu.
          </li>
          <li>La configuration ne se modifie pas en formation : change-la dans le vrai lieu, elle sera recopiée à ta prochaine entrée.</li>
        </ul>
      </Carte>
    </>
  );
}
