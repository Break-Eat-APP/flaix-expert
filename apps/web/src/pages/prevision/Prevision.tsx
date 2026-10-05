import { useState } from "react";
import { Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { caissesAuPic, formaterMontant, verdict, type Fourchette, type ReponsePrevision, type Verdict } from "@flaix/domain";
import { api, formaterDateHeure } from "../../api.ts";
import { Carte, Chargement, EntetePage, EtatVide, MessageErreur, Regles } from "../../composants/communs.tsx";

const dateCourte = new Intl.DateTimeFormat("fr-FR", { weekday: "short", day: "numeric", month: "short", timeZone: "Europe/Paris" });
const ETAT = { a_venir: "à venir", ouvert: "en cours", clos: "joué" } as const;
const plage = (f: Fourchette, format: (n: number) => string = (n) => n.toLocaleString("fr-FR")) => (f.bas === f.haut ? format(f.median) : `${format(f.bas)} à ${format(f.haut)}`);
const VERDICT: Record<Verdict, { texte: string; classe: string }> = {
  dans: { texte: "dans la fourchette", classe: "hausse" },
  au_dessus: { texte: "au-dessus", classe: "neutre" },
  en_dessous: { texte: "en dessous", classe: "baisse" },
};

function Chiffre({ etiquette, valeur, detail, misEnAvant }: { etiquette: string; valeur: string; detail?: React.ReactNode; misEnAvant?: boolean }) {
  return (
    <div className={`chiffre-cle${misEnAvant ? " mis-en-avant" : ""}`}>
      <span className="etiquette">{etiquette}</span>
      <span className="valeur">{valeur}</span>
      {detail && <span className="variation neutre">{detail}</span>}
    </div>
  );
}

/**
 * Prévision du prochain événement (dossier §15.143) : ventes, CA, mise en place et caisses à l'heure de pointe,
 * en fourchette, d'après les derniers événements joués ; vérifiée sur les événements déjà joués.
 */
export function Prevision() {
  const [evenementId, setEvenementId] = useState<string | null>(null);
  const q = useQuery({
    queryKey: ["prevision", evenementId],
    queryFn: () => api.get<ReponsePrevision>(`/prevision${evenementId ? `?evenementId=${evenementId}` : ""}`),
    placeholderData: (avant) => avant,
  });
  if (q.isPending) return <Chargement />;
  if (q.error) return <MessageErreur erreur={q.error} />;
  const r = q.data!;
  if (!r.evenement)
    return (
      <>
        <EntetePage fil="Résultats" filLien="/" titre="Prochain événement" />
        <Carte>
          <EtatVide titre="Aucun événement dans la saison">
            La prévision porte sur le prochain événement : crée d'abord la saison dans <Link to="/parametres/saison">Paramètres → Saison</Link>.
          </EtatVide>
        </Carte>
      </>
    );
  const evenement = r.evenement;
  const p = r.prevision;
  const joue = r.realise !== null;

  return (
    <>
      <EntetePage
        fil="Résultats"
        filLien="/"
        titre="Prochain événement"
        description="Ce qui devrait se vendre, en fourchette, d'après tes derniers événements. Un calcul, pas une promesse : à toi de décider la mise en place."
        actions={
          <label className="choix-match">
            Événement
            <select value={evenement.id} onChange={(e) => setEvenementId(e.target.value)}>
              {r.choix.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.libelle} · {dateCourte.format(new Date(c.debut))} ({ETAT[c.etat]})
                </option>
              ))}
            </select>
          </label>
        }
      />
      {!p ? (
        <Carte>
          <EtatVide titre="Pas encore assez d'historique">La prévision demande au moins 2 événements joués avant celui-ci. Elle apparaîtra d'elle-même.</EtatVide>
        </Carte>
      ) : (
        <>
          <p className="note" style={{ marginTop: 0 }}>
            {evenement.libelle}, {formaterDateHeure(evenement.debut)} —{" "}
            {p.base === "affluence" ? (
              <>
                ramenée à l'<strong>affluence prévue de {p.affluencePrevue!.toLocaleString("fr-FR")} spectateurs</strong>, d'après {p.comparables.length} événements joués ({p.comparables.map((c) => `${c.libelle} ${c.spectateurs?.toLocaleString("fr-FR")}`).join(", ")}).
              </>
            ) : (
              <>
                <strong>sans affluence</strong> : « un événement comme les précédents », d'après {p.comparables.length} événements joués ({p.comparables.map((c) => c.libelle).join(", ")}).
                {evenement.etat === "a_venir" && (
                  <>
                    {" "}
                    Saisis l'affluence prévue dans <Link to="/parametres/saison">Paramètres → Saison</Link> pour une prévision plus juste.
                  </>
                )}
              </>
            )}
          </p>
          <div className="chiffres">
            <Chiffre
              etiquette="CA prévu (TTC)"
              valeur={p.ca ? plage(p.ca, formaterMontant) : "—"}
              detail={joue && p.ca ? <span className={`variation ${VERDICT[verdict(r.realise!.ca, p.ca)].classe}`}>réalisé {formaterMontant(r.realise!.ca)} : {VERDICT[verdict(r.realise!.ca, p.ca)].texte}</span> : p.ca ? `médiane ${formaterMontant(p.ca.median)}` : null}
              misEnAvant
            />
            <Chiffre etiquette="Tickets prévus" valeur={p.tickets ? plage(p.tickets) : "—"} detail={joue ? `réalisé ${r.realise!.tickets.toLocaleString("fr-FR")}` : null} />
            <Chiffre etiquette="Événements comparés" valeur={String(p.comparables.length)} detail="les plus récents, joués avant" />
            <Chiffre
              etiquette="Fiabilité"
              valeur={r.fiabilite ? `${r.fiabilite.dansLaFourchette} sur ${r.fiabilite.evenements}` : "—"}
              detail={r.fiabilite ? "CA réel dans la fourchette, sur les derniers événements" : "pas encore vérifiable"}
            />
          </div>
          <Carte titre="Ventes et mise en place, par stand" description="Mise en place proposée = ventes prévues (médiane) − reste compté au stand. « Pour ne pas manquer » : haut de la fourchette − reste.">
            <div className="scroll-x">
              <table className="tableau">
                <thead>
                  <tr>
                    <th>Stand</th>
                    <th>Produit</th>
                    <th className="d">Ventes prévues</th>
                    {joue ? <th className="d">Vendu</th> : <th className="d">Reste au stand</th>}
                    {joue ? <th>Verdict</th> : <th className="d">Mise en place proposée</th>}
                    {!joue && <th className="d">Pour ne pas manquer</th>}
                  </tr>
                </thead>
                <tbody>
                  {p.produits.map((l) => {
                    const cle = `${l.standId}|${l.produitId}`;
                    const reste = r.restes[cle] ?? 0;
                    const vendu = r.realise?.produits[cle] ?? 0;
                    return (
                      <tr key={cle}>
                        <td>{l.stand}</td>
                        <td>{l.produit}</td>
                        <td className="d chiffre">{plage(l.ventes)}</td>
                        {joue ? (
                          <>
                            <td className="d chiffre">{vendu}</td>
                            <td>
                              <span className={`variation ${VERDICT[verdict(vendu, l.ventes)].classe}`}>{VERDICT[verdict(vendu, l.ventes)].texte}</span>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="d chiffre">{reste}</td>
                            <td className="d chiffre">
                              <strong>{Math.max(0, l.ventes.median - reste)}</strong>
                            </td>
                            <td className="d chiffre">{Math.max(0, l.ventes.haut - reste)}</td>
                          </>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {!joue && (
              <p className="note">
                La mise en place se saisit dans <Link to="/stock">Stock → Mise en place</Link>, qui garde sa propre suggestion (moyenne des événements précédents − reste).
              </p>
            )}
          </Carte>
          <Carte titre="À l'heure de pointe, par stand" description="Tickets attendus pendant l'heure la plus chargée ; caisses nécessaires d'après la cadence en file mesurée (temps de prise de commande).">
            <div className="scroll-x">
              <table className="tableau">
                <thead>
                  <tr>
                    <th>Stand</th>
                    <th className="d">Tickets à l'heure de pointe</th>
                    <th className="d">Cadence d'une caisse</th>
                    <th className="d">Caisses nécessaires</th>
                  </tr>
                </thead>
                <tbody>
                  {p.pics.map((x) => {
                    const cadence = r.cadences[x.stand] ?? null;
                    const caisses = caissesAuPic(x.tickets.haut, cadence);
                    return (
                      <tr key={x.standId}>
                        <td>{x.stand}</td>
                        <td className="d chiffre">{plage(x.tickets)}</td>
                        <td className="d chiffre">{cadence === null ? <span className="discret">pas encore mesurée</span> : `${cadence} / h`}</td>
                        <td className="d chiffre">{caisses === null ? "—" : <strong>{caisses}</strong>}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Carte>
        </>
      )}
      <Regles>
        <ul>
          <li><strong>Comparables</strong> : les 8 derniers événements clos qui ont des ventes, joués avant celui-ci. Un produit non vendu lors d'un comparable compte 0.</li>
          <li><strong>Avec l'affluence</strong> (affluence prévue saisie, et au moins 3 comparables avec la leur) : ventes par spectateur de chaque comparable × affluence prévue. <strong>Sans</strong> : les comparables tels quels.</li>
          <li><strong>Fourchette</strong> : du 1er au 3e quartile des comparables dès 4, du plus bas au plus haut avec 2 ou 3 ; pas de prévision en dessous de 2. Valeur centrale : la médiane.</li>
          <li><strong>Caisses nécessaires</strong> : haut de la fourchette des tickets de l'heure de pointe ÷ commandes par heure qu'une caisse tient quand il y a une file (Où je perds de l'argent → Temps de prise de commande).</li>
          <li><strong>Vérification</strong> : pour un événement joué, la prévision est recalculée avec les seuls événements d'avant lui, puis comparée au réalisé ; « Fiabilité » compte combien de fois le CA réel est tombé dans la fourchette.</li>
          <li><strong>Pas encore dans le calcul</strong> : météo, adversaire, vacances, horaire — ils viendront quand l'historique sera assez long pour en mesurer l'effet.</li>
        </ul>
      </Regles>
    </>
  );
}
