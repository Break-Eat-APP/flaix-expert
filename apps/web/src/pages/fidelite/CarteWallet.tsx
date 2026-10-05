import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, Mail, Share2 } from "lucide-react";
import type { CarteAbonne } from "@flaix/domain";
import { api } from "../../api.ts";
import { Chargement, MessageErreur } from "../../composants/communs.tsx";

/*
 * Carte abonné dans le téléphone, Apple Wallet et Google Wallet (dossier §15.147), côté directeur : le lien
 * personnel de chaque abonné (créer, copier, partager, envoyer par e-mail, renouveler). Le design des cartes du lieu
 * est dans DesignCarte.tsx (§15.148).
 */

export const services = (apple: boolean, google: boolean) =>
  apple && google ? "Apple Wallet et Google Wallet" : apple ? "Apple Wallet (Google Wallet pas encore activé)" : google ? "Google Wallet (Apple Wallet pas encore activé)" : null;

/** Dans le détail d'un abonné. */
export function CarteAbonneBloc({ id, nom, actif }: { id: string; nom: string; actif: boolean }) {
  const client = useQueryClient();
  const cle = ["fidelite-carte", id];
  const carte = useQuery({ queryKey: cle, queryFn: () => api.get<CarteAbonne>(`/fidelite/abonnes/${id}/carte`) });
  const [message, setMessage] = useState<string | null>(null);
  const creer = useMutation({
    mutationFn: () => api.post<CarteAbonne>(`/fidelite/abonnes/${id}/carte`),
    onSuccess: (c, _v) => {
      client.setQueryData(cle, c);
      setMessage(carte.data?.lien ? "Nouveau lien créé : l'ancien ne fonctionne plus." : "Lien créé : transmets-le à l'abonné.");
    },
  });
  const email = useMutation({
    mutationFn: () => api.post<{ statut: "envoye" | "echec" | "sans_service" }>(`/fidelite/abonnes/${id}/carte/email`),
    onSuccess: (r) =>
      setMessage(r.statut === "envoye" ? "E-mail envoyé à l'abonné." : r.statut === "sans_service" ? "Les e-mails ne sont pas encore en service sur ce serveur." : "L'e-mail n'est pas parti : réessaie plus tard."),
  });
  if (carte.isPending) return <Chargement />;
  if (carte.error) return <MessageErreur erreur={carte.error} />;
  const c = carte.data!;
  const copier = async () => {
    try {
      await navigator.clipboard.writeText(c.lien!);
      setMessage("Lien copié.");
    } catch {
      setMessage("Copie impossible ici : sélectionne le lien et copie-le.");
    }
  };
  const partager = () => navigator.share?.({ title: `Ta carte abonné`, text: `Bonjour ${nom}, voici ta carte abonné à ajouter dans ton téléphone :`, url: c.lien! }).catch(() => undefined);
  const pret = services(c.apple, c.google);

  return (
    <div style={{ display: "grid", gap: 8 }}>
      <strong style={{ fontSize: 13 }}>Carte dans le téléphone</strong>
      {!actif ? (
        <p className="discret" style={{ margin: 0 }}>
          Abonné désactivé : sa carte ne s'ouvre plus.
        </p>
      ) : !c.lien ? (
        <div className="actions" style={{ justifyContent: "flex-start", flexWrap: "wrap" }}>
          <span className="discret">Pas encore de lien pour cet abonné.</span>
          <button className="btn btn-fantome" disabled={creer.isPending} onClick={() => creer.mutate()}>
            Créer le lien de sa carte
          </button>
        </div>
      ) : (
        <>
          <input type="text" readOnly value={c.lien} aria-label="Lien de la carte" onFocus={(ev) => ev.target.select()} style={{ width: "100%" }} />
          <div className="actions" style={{ justifyContent: "flex-start", flexWrap: "wrap" }}>
            <button className="btn btn-fantome" onClick={() => void copier()}>
              <Copy size={14} /> Copier
            </button>
            {"share" in navigator && (
              <button className="btn btn-fantome" onClick={() => void partager()}>
                <Share2 size={14} /> Partager (SMS, WhatsApp…)
              </button>
            )}
            <button className="btn btn-fantome" disabled={!c.email || email.isPending} title={c.email ? `À ${c.email}` : "Ajoute d'abord son adresse e-mail"} onClick={() => email.mutate()}>
              <Mail size={14} /> Envoyer par e-mail
            </button>
            <button
              className="btn btn-fantome"
              disabled={creer.isPending}
              onClick={() => {
                if (window.confirm("Renouveler le lien ? L'ancien lien ne fonctionnera plus (une carte déjà ajoutée au téléphone reste valable).")) creer.mutate();
              }}
            >
              Renouveler le lien
            </button>
          </div>
          <span className="discret" style={{ fontSize: 12 }}>
            {pret ? `Ajout possible dans ${pret}.` : "Le lien montre déjà sa carte (n° et points) ; l'ajout dans Apple Wallet et Google Wallet arrive bientôt."}
            {c.appareilsApple > 0 && ` Carte présente sur ${c.appareilsApple} iPhone${c.appareilsApple > 1 ? "s" : ""}.`}
          </span>
        </>
      )}
      {message && <span className="discret" role="status">{message}</span>}
      <MessageErreur erreur={creer.error ?? email.error} />
    </div>
  );
}
