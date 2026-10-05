import { useQuery } from "@tanstack/react-query";
import { couleurTexte, type CartePublique } from "@flaix/domain";
import { api } from "../../api.ts";
import { Chargement, MessageErreur } from "../../composants/communs.tsx";

/** Le jeton du lien /carte/<jeton> (vide si l'adresse n'a pas la bonne forme). */
export function jetonDeLAdresse(chemin: string): string {
  return /^\/carte\/([A-Za-z0-9_-]{40,64})\/?$/.exec(chemin)?.[1] ?? "";
}

/**
 * Page de la carte abonné (dossier §15.147), ouverte par l'abonné depuis le lien que le lieu lui a envoyé :
 * sans connexion, elle montre sa carte et propose de l'ajouter à Apple Wallet ou Google Wallet.
 */
export function PageCarte({ jeton = jetonDeLAdresse(window.location.pathname) }: { jeton?: string }) {
  const carte = useQuery({ queryKey: ["carte", jeton], queryFn: () => api.get<CartePublique>(`/carte/${jeton}`), enabled: jeton !== "" });
  const ios = /iPhone|iPad|iPod|Macintosh/.test(navigator.userAgent);
  return (
    <div className="page-connexion">
      <div className="boite-connexion" style={{ maxWidth: 420 }}>
        {!jeton ? (
          <MessageErreur erreur="Ce lien de carte n'est pas complet : rouvre-le depuis le message reçu." />
        ) : carte.isPending ? (
          <Chargement />
        ) : carte.error ? (
          <MessageErreur erreur={carte.error} />
        ) : (
          <Contenu c={carte.data!} jeton={jeton} ios={ios} />
        )}
      </div>
    </div>
  );
}

function Contenu({ c, jeton, ios }: { c: CartePublique; jeton: string; ios: boolean }) {
  const texte = couleurTexte(c.couleur);
  const apple = c.apple && (
    <a key="apple" className="btn bouton-wallet" href={`/api/carte/${jeton}/apple`} style={{ background: "#000", color: "#fff" }}>
      Ajouter à Apple Wallet
    </a>
  );
  const google = c.google && (
    <a key="google" className="btn bouton-wallet" href={`/api/carte/${jeton}/google`} style={{ background: "#1f1f1f", color: "#fff" }}>
      Ajouter à Google Wallet
    </a>
  );
  return (
    <div style={{ display: "grid", gap: 16 }}>
      <section aria-label="Carte abonné" style={{ background: c.couleur, color: texte, borderRadius: 18, padding: 20, display: "grid", gap: 14, boxShadow: "0 10px 30px rgba(0,0,0,.18)" }}>
        <div style={{ fontWeight: 800, fontSize: 18 }}>{c.lieu}</div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end", gap: 12 }}>
          <div>
            <div style={{ fontSize: 12, opacity: 0.8 }}>Abonné</div>
            <div style={{ fontWeight: 700, fontSize: 17 }}>{c.nom}</div>
          </div>
          {c.points !== null && (
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 12, opacity: 0.8 }}>Points</div>
              <div style={{ fontWeight: 800, fontSize: 26 }}>{c.points.toLocaleString("fr-FR")}</div>
            </div>
          )}
        </div>
        <div>
          <div style={{ fontSize: 12, opacity: 0.8 }}>N° d'abonné</div>
          <div style={{ fontWeight: 800, fontSize: 22, letterSpacing: ".06em" }}>{c.numero}</div>
        </div>
      </section>

      {c.apple || c.google ? (
        <div style={{ display: "grid", gap: 10 }}>{ios ? [apple, google] : [google, apple]}</div>
      ) : (
        <p className="discret" style={{ margin: 0 }}>
          L'ajout dans le téléphone (Apple Wallet, Google Wallet) arrive bientôt. En attendant, garde cette page dans tes favoris.
        </p>
      )}
      <p className="discret" style={{ margin: 0, fontSize: 13 }}>
        À la buvette, montre ta carte à la caissière : ton n° d'abonné donne ta remise et tes points.
        {(c.apple || c.google) && " Une fois dans ton téléphone, la carte se met à jour toute seule."}
      </p>
      <p className="discret" style={{ margin: 0, fontSize: 12 }}>Ce lien est personnel : ne le transmets pas.</p>
    </div>
  );
}
