import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Mail, Send } from "lucide-react";
import { EMAILS_SUPPLEMENTAIRES_MAX, emailValide, type EtatEmails, type ReglagesEmails } from "@flaix/domain";
import { api, formaterDateHeure } from "../../api.ts";
import { useSession } from "../../session.tsx";
import { Carte, MessageErreur } from "../../composants/communs.tsx";

const TYPE = { rapport_soiree: "Rapport de soirée", rectification: "Rectification", essai: "Essai" } as const;
const STATUT = { envoye: { texte: "envoyé", puce: "puce-vert" }, echec: { texte: "échec", puce: "puce-rouge" }, sans_service: { texte: "non envoyé (Brevo non réglé)", puce: "puce-ambre" } } as const;

/**
 * E-mails du lieu par Brevo (dossier §15.146) : rapport de soirée à la clôture, notification des rectifications
 * de Z ; destinataires = directeurs du lieu + quelques adresses ajoutées ; essai et derniers envois.
 */
export function EmailsLieu() {
  const client = useQueryClient();
  const formation = !!useSession().data?.formation;
  const q = useQuery({ queryKey: ["emails"], queryFn: () => api.get<EtatEmails>("/emails") });
  const [saisie, setSaisie] = useState("");
  useEffect(() => {
    if (q.data) setSaisie(q.data.reglages.supplementaires.join(", "));
  }, [q.data]);
  const regler = useMutation({ mutationFn: (r: ReglagesEmails) => api.put<EtatEmails>("/emails/reglages", r), onSuccess: (r) => client.setQueryData(["emails"], r) });
  const essai = useMutation({ mutationFn: () => api.post<EtatEmails>("/emails/essai"), onSuccess: (r) => client.setQueryData(["emails"], r) });
  if (!q.data) return <Carte titre="E-mails">{q.error ? <MessageErreur erreur={q.error} /> : <span className="discret">Chargement…</span>}</Carte>;
  const e = q.data;
  const adresses = saisie
    .split(/[,;\s]+/)
    .map((x) => x.trim().toLowerCase())
    .filter(Boolean);
  const adressesValides = adresses.length <= EMAILS_SUPPLEMENTAIRES_MAX && adresses.every(emailValide);
  const modifiees = adresses.join(",") !== e.reglages.supplementaires.join(",");
  const enregistrer = (r: Partial<ReglagesEmails>) => regler.mutate({ ...e.reglages, ...r });

  return (
    <Carte titre="E-mails" description="Le rapport de soirée à la clôture de chaque événement, et chaque rectification d'un Z au moment où elle est enregistrée.">
      {!e.service && (
        <div className="message message-alerte" style={{ marginTop: 0 }}>
          Le service d'e-mails (Brevo) n'est pas encore réglé sur le serveur : rien ne part pour l'instant. FlaiX Expert le règle avec sa clé Brevo.
        </div>
      )}
      <div style={{ display: "grid", gap: 8 }}>
        <label className="en-ligne" style={{ gap: 8 }}>
          <input type="checkbox" checked={e.reglages.rapport} disabled={regler.isPending || formation} onChange={(ev) => enregistrer({ rapport: ev.target.checked })} />
          Rapport de soirée à la clôture de l'événement
        </label>
        <label className="en-ligne" style={{ gap: 8 }}>
          <input type="checkbox" checked={e.reglages.rectification} disabled={regler.isPending || formation} onChange={(ev) => enregistrer({ rectification: ev.target.checked })} />
          Rectification d'un Z (tiroir ou coffre)
        </label>
      </div>
      <p className="note">
        Destinataires : {e.directeurs.length ? e.directeurs.map((d) => `${d.nom} <${d.email}>`).join(", ") : "aucun directeur avec une adresse e-mail"}
        {e.reglages.supplementaires.length ? `, plus ${e.reglages.supplementaires.join(", ")}` : ""}.
      </p>
      <label className="champ">
        <span>Adresses en plus (l'expert-comptable, par exemple ; {EMAILS_SUPPLEMENTAIRES_MAX} au plus, séparées par des virgules)</span>
        <input value={saisie} disabled={formation} placeholder="cabinet@exemple.fr" onChange={(ev) => setSaisie(ev.target.value)} />
      </label>
      <div className="en-ligne" style={{ gap: 10, marginTop: 8, flexWrap: "wrap" }}>
        <button className="btn" disabled={!modifiees || !adressesValides || regler.isPending || formation} onClick={() => enregistrer({ supplementaires: adresses })}>
          <Mail size={15} /> Enregistrer les adresses
        </button>
        <button className="btn btn-fantome" disabled={!e.service || essai.isPending || formation} onClick={() => essai.mutate()}>
          <Send size={15} /> M'envoyer un e-mail d'essai
        </button>
        {!adressesValides && <span className="texte-ambre">Adresse à vérifier</span>}
      </div>
      <MessageErreur erreur={regler.error ?? essai.error} />
      {e.derniers.length > 0 && (
        <div className="scroll-x" style={{ marginTop: 12 }}>
          <table className="tableau">
            <thead>
              <tr>
                <th>Quand</th>
                <th>E-mail</th>
                <th className="d">Destinataires</th>
                <th>Résultat</th>
              </tr>
            </thead>
            <tbody>
              {e.derniers.map((x) => (
                <tr key={`${x.le}:${x.sujet}`}>
                  <td className="discret">{formaterDateHeure(x.le)}</td>
                  <td>
                    {TYPE[x.type]} <span className="discret">— {x.sujet}</span>
                  </td>
                  <td className="d chiffre">{x.destinataires}</td>
                  <td>
                    <span className={`puce ${STATUT[x.statut].puce}`}>{STATUT[x.statut].texte}</span> {x.erreur && <span className="discret">{x.erreur}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="note">
        {e.expediteur ? `Expéditeur : FlaiX Expert <${e.expediteur}>. ` : ""}Le rapport par e-mail reprend le brief de la soirée et un lien vers le rapport complet (connexion nécessaire) : aucun chiffre détaillé ne circule par e-mail. Le mode formation n'envoie aucun e-mail.
      </p>
    </Carte>
  );
}
