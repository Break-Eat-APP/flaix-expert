import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BellOff, BellRing, Send } from "lucide-react";
import type { ReglagesAlertesPoussees } from "@flaix/domain";
import { api } from "../../api.ts";
import { useSession } from "../../session.tsx";
import { Carte, EntetePage, MessageErreur, Regles } from "../../composants/communs.tsx";
import { EmailsLieu } from "./EmailsLieu.tsx";

/** Clé publique du serveur (base64url) → octets attendus par le navigateur. */
function versOctets(base64url: string): Uint8Array<ArrayBuffer> {
  const base64 = (base64url + "=".repeat((4 - (base64url.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  const brut = atob(base64);
  const octets = new Uint8Array(new ArrayBuffer(brut.length));
  for (let i = 0; i < brut.length; i++) octets[i] = brut.charCodeAt(i);
  return octets;
}

const nomAppareil = () => (/iPhone|iPad/.test(navigator.userAgent) ? "iPhone" : /Android/.test(navigator.userAgent) ? "Android" : "Ordinateur");
const possible = () => "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;

async function enregistrement(): Promise<ServiceWorkerRegistration> {
  return (await navigator.serviceWorker.getRegistration()) ?? (await navigator.serviceWorker.register("/sw.js"));
}

/** Ruptures et stocks faibles poussés en direct (§15.140) : réglage du lieu, pour tous ses directeurs. */
function AlertesStock() {
  const client = useQueryClient();
  const formation = !!useSession().data?.formation;
  const q = useQuery({ queryKey: ["alertes-reglages"], queryFn: () => api.get<ReglagesAlertesPoussees>("/alertes/reglages") });
  const m = useMutation({
    mutationFn: (r: ReglagesAlertesPoussees) => api.put<ReglagesAlertesPoussees>("/alertes/reglages", r),
    onSuccess: (r) => client.setQueryData(["alertes-reglages"], r),
  });
  const r = q.data;
  return (
    <Carte titre="Stock en direct, pendant l'événement" description="Une notification dès qu'un produit suivi en stock passe sous 15 % de sa mise en place, ou tombe à zéro, à un stand. Une seule par niveau, jusqu'au prochain réassort.">
      {r ? (
        <div style={{ display: "grid", gap: 8 }}>
          <label className="en-ligne" style={{ gap: 8 }}>
            <input type="checkbox" checked={r.rupture} disabled={m.isPending || formation} onChange={(e) => m.mutate({ ...r, rupture: e.target.checked })} />
            Ruptures (stock à zéro)
          </label>
          <label className="en-ligne" style={{ gap: 8 }}>
            <input type="checkbox" checked={r.faible} disabled={m.isPending || formation} onChange={(e) => m.mutate({ ...r, faible: e.target.checked })} />
            Stocks faibles (15 % de la mise en place ou moins)
          </label>
        </div>
      ) : (
        <MessageErreur erreur={q.error} />
      )}
      <MessageErreur erreur={m.error} />
      <p className="note">Réglage du lieu, pour tous ses directeurs ; chaque téléphone doit aussi avoir activé les notifications ci-dessus. Une tablette restée sans réseau n'envoie ses tickets qu'au retour du réseau : l'alerte arrive alors en retard. Le mode formation n'envoie aucune notification.</p>
    </Carte>
  );
}

/**
 * Notifications sur ce téléphone (dossier §15.135) : le brief de fin de soirée arrive à chaque clôture
 * d'événement. Réglage propre à chaque appareil.
 */
export function Notifications() {
  const [etat, setEtat] = useState<"inconnu" | "impossible" | "refusees" | "inactives" | "actives">("inconnu");
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<unknown>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!possible()) return setEtat("impossible");
    if (Notification.permission === "denied") return setEtat("refusees");
    void enregistrement()
      .then((r) => r.pushManager.getSubscription())
      .then((s) => setEtat(s ? "actives" : "inactives"))
      .catch(() => setEtat("inactives"));
  }, []);

  async function agir(f: () => Promise<void>) {
    setEnCours(true);
    setErreur(null);
    setMessage(null);
    try {
      await f();
    } catch (e) {
      setErreur(e);
    } finally {
      setEnCours(false);
    }
  }

  const activer = () =>
    agir(async () => {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setEtat(permission === "denied" ? "refusees" : "inactives");
        return;
      }
      const r = await enregistrement();
      const { cle } = await api.get<{ cle: string }>("/notifications");
      const abonnement = (await r.pushManager.getSubscription()) ?? (await r.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: versOctets(cle) }));
      const json = abonnement.toJSON();
      await api.post("/notifications/abonnement", { endpoint: json.endpoint, keys: json.keys, appareil: nomAppareil() });
      setEtat("actives");
      setMessage("Notifications activées sur cet appareil.");
    });

  const desactiver = () =>
    agir(async () => {
      const abonnement = await (await enregistrement()).pushManager.getSubscription();
      if (abonnement) {
        await api.post("/notifications/desabonnement", { endpoint: abonnement.endpoint });
        await abonnement.unsubscribe();
      }
      setEtat("inactives");
      setMessage("Notifications désactivées sur cet appareil.");
    });

  const essayer = () =>
    agir(async () => {
      const r = await api.post<{ envoyees: number }>("/notifications/essai");
      setMessage(r.envoyees > 0 ? `Notification d'essai envoyée à ${r.envoyees} appareil${r.envoyees > 1 ? "s" : ""}.` : "La notification n'a pas pu être envoyée : réactive les notifications sur ce téléphone.");
    });

  return (
    <>
      <EntetePage fil="Paramètres" filLien="/parametres" titre="Notifications" description="Sur ton téléphone : les ruptures de stock pendant l'événement et le brief de fin de soirée. Par e-mail : le rapport de soirée et les rectifications." />
      <Carte titre="Sur cet appareil">
        {etat === "impossible" ? (
          <div className="message message-alerte" style={{ marginTop: 0 }}>
            Ce navigateur ne reçoit pas de notifications. Sur iPhone : ouvre FlaiX Expert dans Safari, touche « Partager » puis « Sur l'écran d'accueil », et rouvre l'application depuis son icône.
          </div>
        ) : etat === "refusees" ? (
          <div className="message message-alerte" style={{ marginTop: 0 }}>
            Les notifications sont bloquées pour FlaiX Expert dans les réglages de ce téléphone ou de ce navigateur : autorise-les, puis reviens ici.
          </div>
        ) : (
          <div className="en-ligne" style={{ gap: 10 }}>
            {etat === "actives" ? (
              <>
                <span className="puce puce-vert">
                  <BellRing size={13} /> Activées
                </span>
                <button className="btn" disabled={enCours} onClick={() => void essayer()}>
                  <Send size={15} /> Envoyer une notification d'essai
                </button>
                <button className="btn btn-fantome" disabled={enCours} onClick={() => void desactiver()}>
                  <BellOff size={15} /> Désactiver
                </button>
              </>
            ) : (
              <button className="btn" disabled={enCours || etat === "inconnu"} onClick={() => void activer()}>
                <BellRing size={15} /> Recevoir les notifications ici
              </button>
            )}
          </div>
        )}
        {message && <div className="message message-ok">{message}</div>}
        <MessageErreur erreur={erreur} />
      </Carte>
      <AlertesStock />
      <EmailsLieu />
      <Regles>
        <ul>
          <li><strong>Brief de fin de soirée</strong> : envoyé à la clôture de l'événement, sur chaque appareil où un directeur a activé les notifications. Il reprend les chiffres du rapport de soirée figé, sans en inventer : encaissé, tickets, panier moyen, marge nette face à sa cible, évolution par rapport à l'événement précédent, et ce qui demande une vérification (écart d'espèces, écart de stock). Le toucher ouvre le rapport complet.</li>
          <li><strong>Stock en direct</strong> : quand une tablette envoie ses tickets, le serveur recalcule le stock des produits vendus, au stand de la caisse (même règle que Stock : faible à 15 % du départ, rupture à zéro). La notification ouvre « En direct », où le réassort se fait en deux gestes. Seuls les produits dont le stock est suivi (mise en place faite) peuvent alerter.</li>
          <li><strong>Un réglage par appareil</strong> : active-le sur chaque téléphone qui doit le recevoir. Sur iPhone, l'application doit être ajoutée à l'écran d'accueil.</li>
          <li><strong>Aucun service extérieur</strong> : la notification passe par le service de notification du téléphone (Apple ou Google), sans compte à créer.</li>
        </ul>
      </Regles>
    </>
  );
}
