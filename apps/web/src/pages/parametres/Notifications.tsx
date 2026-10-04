import { useEffect, useState } from "react";
import { BellOff, BellRing, Send } from "lucide-react";
import { api } from "../../api.ts";
import { Carte, EntetePage, MessageErreur, Regles } from "../../composants/communs.tsx";

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
      <EntetePage fil="Paramètres" filLien="/parametres" titre="Notifications" description="Le brief de fin de soirée sur ton téléphone, à chaque clôture d'événement." />
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
                <BellRing size={15} /> Recevoir le brief de fin de soirée ici
              </button>
            )}
          </div>
        )}
        {message && <div className="message message-ok">{message}</div>}
        <MessageErreur erreur={erreur} />
      </Carte>
      <Regles>
        <ul>
          <li><strong>Brief de fin de soirée</strong> : envoyé à la clôture de l'événement, sur chaque appareil où un directeur a activé les notifications. Il reprend les chiffres du rapport de soirée figé, sans en inventer : encaissé, tickets, panier moyen, marge nette face à sa cible, évolution par rapport à l'événement précédent, et ce qui demande une vérification (écart d'espèces, écart de stock). Le toucher ouvre le rapport complet.</li>
          <li><strong>Un réglage par appareil</strong> : active-le sur chaque téléphone qui doit le recevoir. Sur iPhone, l'application doit être ajoutée à l'écran d'accueil.</li>
          <li><strong>Aucun service extérieur</strong> : la notification passe par le service de notification du téléphone (Apple ou Google), sans compte à créer.</li>
        </ul>
      </Regles>
    </>
  );
}
