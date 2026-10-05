import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LifeBuoy, ShieldOff } from "lucide-react";
import { DUREES_SUPPORT, type AutorisationSupport, type EtatSupport } from "@flaix/domain";
import { api, formaterDateHeure } from "../../api.ts";
import { Carte, Chargement, EntetePage, EtatVide, MessageErreur, Regles } from "../../composants/communs.tsx";
import { useSession } from "../../session.tsx";

const heure = new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" });
const duree = (h: number) => (h === 1 ? "1 heure" : `${h} heures`);

function Consultations({ a }: { a: AutorisationSupport }) {
  if (a.consultations.length === 0) return <span className="discret">Aucun écran consulté.</span>;
  return (
    <ul className="liste-simple">
      {a.consultations.map((c) => (
        <li key={`${c.route}:${c.le}`}>
          {heure.format(new Date(c.le))} · <strong>{c.ecran}</strong> <span className="discret">({c.route}) — {c.par}</span>
        </li>
      ))}
    </ul>
  );
}

/**
 * Support FlaiX Expert sur autorisation du lieu (back-office niveau 2 ; dossier §15.13, §15.142) : le directeur
 * ouvre un accès en lecture seule, limité dans le temps, le retire quand il veut, et voit ce qui a été consulté.
 */
export function SupportFlaix() {
  const client = useQueryClient();
  const formation = !!useSession().data?.formation;
  const [heures, setHeures] = useState<number>(4);
  const [motif, setMotif] = useState("");
  const q = useQuery({ queryKey: ["support"], queryFn: () => api.get<EtatSupport>("/support") });
  const autoriser = useMutation({
    mutationFn: () => api.post<EtatSupport>("/support/autorisation", { heures, motif: motif.trim() || null }),
    onSuccess: (r) => {
      client.setQueryData(["support"], r);
      setMotif("");
    },
  });
  const retirer = useMutation({ mutationFn: () => api.post<EtatSupport>("/support/retrait"), onSuccess: (r) => client.setQueryData(["support"], r) });
  if (q.isPending) return <Chargement />;
  if (q.error) return <MessageErreur erreur={q.error} />;
  const e = q.data!;
  const passees = e.historique.filter((a) => !a.active);

  return (
    <>
      <EntetePage fil="Paramètres" filLien="/parametres" titre="Support FlaiX Expert" description="Ouvre un accès en lecture seule à l'équipe FlaiX Expert, pour une durée limitée, quand tu as besoin d'aide." />
      <Carte titre={e.active ? "Le support est autorisé" : "Autoriser le support"}>
        {e.active ? (
          <>
            <p style={{ marginTop: 0 }}>
              Jusqu'à <strong>{heure.format(new Date(e.active.fin))}</strong> ({formaterDateHeure(e.active.fin)}), autorisé par {e.active.accordeePar}
              {e.active.motif ? ` — « ${e.active.motif} »` : ""}.
            </p>
            <button className="btn btn-danger" disabled={retirer.isPending || formation} onClick={() => retirer.mutate()}>
              <ShieldOff size={15} /> Retirer l'autorisation maintenant
            </button>
            <MessageErreur erreur={retirer.error} />
            <h4 style={{ marginBottom: 6 }}>Ce que le support a consulté</h4>
            <Consultations a={e.active} />
          </>
        ) : formation ? (
          <div className="message message-alerte" style={{ marginTop: 0 }}>Mode formation : le support s'autorise depuis le vrai lieu.</div>
        ) : (
          <div style={{ display: "grid", gap: 10, maxWidth: 520 }}>
            <div className="bascule" role="group" aria-label="Durée">
              {DUREES_SUPPORT.map((h) => (
                <button key={h} aria-pressed={heures === h} onClick={() => setHeures(h)}>
                  {duree(h)}
                </button>
              ))}
            </div>
            <label className="champ">
              <span>Motif (facultatif)</span>
              <input value={motif} maxLength={200} placeholder="Ex. problème de clôture" onChange={(ev) => setMotif(ev.target.value)} />
            </label>
            <div>
              <button className="btn" disabled={autoriser.isPending} onClick={() => autoriser.mutate()}>
                <LifeBuoy size={15} /> Autoriser le support pour {duree(heures)}
              </button>
            </div>
            <MessageErreur erreur={autoriser.error} />
          </div>
        )}
      </Carte>
      <Carte titre="Autorisations passées">
        {passees.length === 0 ? (
          <EtatVide titre="Aucune">Le support n'a jamais eu accès à ton lieu.</EtatVide>
        ) : (
          <div style={{ display: "grid", gap: 14 }}>
            {passees.map((a) => (
              <div key={a.id}>
                <strong>
                  {formaterDateHeure(a.debut)} → {a.retireeLe ? `retirée ${formaterDateHeure(a.retireeLe)} par ${a.retireePar}` : `fin ${formaterDateHeure(a.fin)}`}
                </strong>
                <div className="discret" style={{ fontSize: 12.5 }}>
                  Autorisée par {a.accordeePar}
                  {a.motif ? ` — « ${a.motif} »` : ""}
                </div>
                <Consultations a={a} />
              </div>
            ))}
          </div>
        )}
      </Carte>
      <Regles>
        <ul>
          <li><strong>Ce que le support voit</strong> : tous les écrans du directeur, en lecture — ventes, tickets, clôtures, stock, équipe, abonnés, réglages.</li>
          <li><strong>Ce qu'il ne peut jamais faire</strong> : rien modifier, rien supprimer, rien encaisser. La base de données elle-même refuse toute écriture pendant sa session, quel que soit l'écran.</li>
          <li><strong>Durée</strong> : 1, 4 ou 24 heures ; tu peux retirer l'accès à tout moment, il s'arrête aussitôt. FlaiX Expert ne peut jamais s'ouvrir l'accès sans ton autorisation.</li>
          <li><strong>Trace</strong> : l'autorisation, l'ouverture de la session, chaque écran consulté (une fois par session) et le retrait sont inscrits au journal technique de ton lieu (Paramètres → Conformité), avec le nom de la personne de FlaiX Expert.</li>
        </ul>
      </Regles>
    </>
  );
}
