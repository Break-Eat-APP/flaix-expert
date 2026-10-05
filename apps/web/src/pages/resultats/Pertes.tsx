import { Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { formaterSecondes, type Periode, type PostePerte, type ReponsePertes, type StatService, type TempsService } from "@flaix/domain";
import { api } from "../../api.ts";
import { Carte, Chargement, EtatVide, MessageErreur } from "../../composants/communs.tsx";
import { euros } from "./graphiques.tsx";

const NATURE: Record<PostePerte["nature"], { libelle: string; puce: string }> = {
  constate: { libelle: "Constaté", puce: "puce-rouge" },
  estime: { libelle: "Estimation", puce: "puce-ambre" },
  piste: { libelle: "Ordre de grandeur", puce: "puce-violet" },
};

const montant = (p: PostePerte) => (!p.montantConnu ? "valeur inconnue" : p.bas === p.haut ? euros(p.haut) : `${euros(p.bas)} à ${euros(p.haut)}`);

/** Barres classées par montant (« tornado » du module 6) ; une estimation montre sa fourchette. */
function Classement({ postes, sorte }: { postes: PostePerte[]; sorte: "perte" | "piste" }) {
  const max = Math.max(...postes.map((p) => p.haut), 1);
  return (
    <div className="tornado">
      {postes.map((p) => (
        <div key={`${p.famille}|${p.titre}`} className={`tornado-ligne ${sorte}`}>
          <div className="texte">
            <span className={`puce ${NATURE[p.nature].puce}`}>{NATURE[p.nature].libelle}</span>
            <strong>{p.titre}</strong>
            <span>{p.detail}</span>
          </div>
          <div className="montant">
            <span>{montant(p)}</span>
            <Link className="btn-lien" to={p.lien}>
              Voir
            </Link>
          </div>
          <div className="tornado-barre" aria-hidden="true">
            {p.bas !== p.haut && <i className="fourchette" style={{ width: `${(p.haut / max) * 100}%` }} />}
            <i style={{ width: `${(p.bas / max) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function Chiffre({ etiquette, valeur, detail, misEnAvant }: { etiquette: string; valeur: string; detail?: string | null; misEnAvant?: boolean }) {
  return (
    <div className={`chiffre-cle${misEnAvant ? " mis-en-avant" : ""}`}>
      <span className="etiquette">{etiquette}</span>
      <span className="valeur">{valeur}</span>
      {detail && <span className="variation neutre">{detail}</span>}
    </div>
  );
}

/** Temps de prise de commande, par stand puis par caisse (§15.139) : jamais par personne. */
function TempsDeService({ t }: { t: TempsService }) {
  const mesures = t.parCaisse.some((c) => c.commandes > 0);
  const ligne = (s: StatService, stand: boolean) => (
    <tr key={s.libelle} style={stand ? { fontWeight: 700 } : undefined}>
      <td>{stand ? s.libelle : <span className="discret">{s.libelle}</span>}</td>
      <td className="d chiffre">{s.commandes}</td>
      <td className="d chiffre">{s.dureeMediane === null ? "—" : formaterSecondes(s.dureeMediane)}</td>
      <td className="d chiffre">{s.mesurables ? `${Math.round((s.enFile / s.mesurables) * 100)} %` : "—"}</td>
      <td className="d chiffre">{s.cadenceEnFile === null ? "—" : `${s.cadenceEnFile} / h`}</td>
    </tr>
  );
  return (
    <Carte
      titre="Temps de prise de commande"
      description="Du premier produit tapé à l'encaissement, par stand et par caisse. Une commande « avec file » : le client suivant a commencé moins de 20 s après l'encaissement. Personne n'est nommé."
    >
      {!mesures ? (
        <div className="discret" style={{ fontSize: 12.5 }}>
          Pas encore de mesure : elle commence quand les tablettes ont reçu la mise à jour qui note l'heure du premier produit tapé.
        </div>
      ) : (
        <div className="scroll-x">
          <table className="tableau">
            <thead>
              <tr>
                <th>Stand / caisse</th>
                <th className="d">Commandes mesurées</th>
                <th className="d">Durée médiane</th>
                <th className="d">Avec file</th>
                <th className="d">Cadence en file</th>
              </tr>
            </thead>
            <tbody>
              {t.parStand.flatMap((s) => [ligne(s, true), ...t.parCaisse.filter((c) => c.libelle.endsWith(`(${s.libelle})`)).map((c) => ligne(c, false))])}
            </tbody>
          </table>
        </div>
      )}
      {mesures && t.sansMesure > 0 && <p className="note">{t.sansMesure} vente{t.sansMesure > 1 ? "s" : ""} sans mesure (tablette pas encore à jour) : hors de ces chiffres.</p>}
      <p className="note">Durée médiane : la moitié des commandes vont plus vite. Cadence en file : commandes encaissées par heure quand des clients attendent, ce qu'une caisse peut tenir au plus fort.</p>
    </Carte>
  );
}

/**
 * Revenue Engine — « Où je perds de l'argent » (dossier §15.138). Tout est calculé par des règles fixes sur
 * les ventes, le stock et les Z ; constaté, estimé et ordres de grandeur ne sont jamais additionnés.
 */
export function VuePertes({ evenementId, periode }: { evenementId?: string; periode?: Periode }) {
  const chemin = evenementId ? `/pertes?evenementId=${evenementId}` : `/pertes?du=${periode!.du}&au=${periode!.au}`;
  const q = useQuery({ queryKey: ["pertes", chemin], queryFn: () => api.get<ReponsePertes>(chemin) });
  if (q.isPending) return <Chargement />;
  if (q.error) return <MessageErreur erreur={q.error} />;
  const { analyse: a, suivi, evenements, service } = q.data!;
  const accorde = a.accorde.offerts + a.accorde.remises + a.accorde.fidelite;
  const rien = a.perdu.length === 0 && a.pistes.length === 0 && a.signes.length === 0;
  const enCours = evenements.some((e) => e.etat === "ouvert");

  return (
    <>
      {(!suivi.stock || !suivi.especes || enCours) && (
        <p className="note" style={{ marginTop: 0 }}>
          {enCours && "Événement en cours : les chiffres bougent encore, les comptages viennent à la clôture. "}
          {!suivi.stock && (
            <>
              Stock non suivi{evenements.length > 1 ? " sur ces événements" : ""} : sans mise en place, ni rupture ni écart de stock ne peut être vu (<Link to="/stock">Stock</Link>).{" "}
            </>
          )}
          {!suivi.especes && "Aucun comptage d'espèces : les manques au tiroir apparaîtront après les Z."}
        </p>
      )}
      <div className="chiffres">
        <Chiffre etiquette="Perdu, constaté" valeur={euros(a.totaux.constate)} detail="écarts de stock, espèces, prix" misEnAvant />
        <Chiffre
          etiquette="Ventes manquées"
          valeur={a.totaux.estimeHaut === 0 ? euros(0) : a.totaux.estimeBas === a.totaux.estimeHaut ? euros(a.totaux.estimeHaut) : `${euros(a.totaux.estimeBas)} à ${euros(a.totaux.estimeHaut)}`}
          detail="estimation, ruptures"
        />
        <Chiffre etiquette="Accordé" valeur={euros(accorde)} detail="offerts, remises, fidélité (TTC)" />
        <Chiffre etiquette="À regarder" valeur={String(a.signes.length)} detail={a.signes.length > 1 ? "signes sans montant" : "signe sans montant"} />
      </div>

      {rien ? (
        <Carte titre="Où je perds de l'argent">
          <EtatVide titre="Rien à signaler">Aucune rupture, aucun écart, aucun manque, aucune piste chiffrée {evenements.length > 1 ? "sur cette période" : "sur cet événement"}.</EtatVide>
        </Carte>
      ) : (
        <>
          <Carte titre="Argent perdu, du plus gros au plus petit" description="Constaté : l'argent manque vraiment. Estimation : ventes qu'une rupture a empêchées, en fourchette.">
            {a.perdu.length ? <Classement postes={a.perdu} sorte="perte" /> : <div className="discret" style={{ fontSize: 12.5 }}>Aucune perte constatée ni estimée.</div>}
          </Carte>
          {a.pistes.length > 0 && (
            <Carte titre="Pistes de gain" description="Des ordres de grandeur, pas des gains promis : ils ne tiennent compte ni du report des ventes vers un autre produit, ni de l'effet d'un prix sur les ventes. Ils ne s'additionnent pas.">
              <Classement postes={a.pistes} sorte="piste" />
            </Carte>
          )}
          {a.signes.length > 0 && (
            <Carte titre="À regarder, sans montant">
              <div className="alertes-liste">
                {a.signes.map((s) => (
                  <div key={s.titre} className="alerte-ligne">
                    <strong>{s.titre}</strong>
                    <span>{s.detail}</span>
                  </div>
                ))}
              </div>
            </Carte>
          )}
        </>
      )}
      {service && <TempsDeService t={service} />}
      {accorde > 0 && (
        <Carte titre="Accordé : des choix, pas des pertes">
          <div className="scroll-x">
            <table className="tableau">
              <tbody>
                <tr>
                  <td>Produits offerts</td>
                  <td className="d chiffre">{euros(a.accorde.offerts)}</td>
                </tr>
                <tr>
                  <td>Remises (abonnés, gestes)</td>
                  <td className="d chiffre">{euros(a.accorde.remises)}</td>
                </tr>
                <tr>
                  <td>Fidélité (points et codes promo)</td>
                  <td className="d chiffre">{euros(a.accorde.fidelite)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Carte>
      )}
    </>
  );
}
