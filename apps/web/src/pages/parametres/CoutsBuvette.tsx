import { useEffect, useState } from "react";
import { Link } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { POSTES_STRUCTURE, formaterMontant, fraisDuMois, libelleMois, lireMontant, montantPourSaisie, repartitionCouts, totalFrais, type CoutsBuvette as Etat, type PosteStructure } from "@flaix/domain";
import { api } from "../../api.ts";
import { Carte, Chargement, EntetePage, EtatVide, MessageErreur, Regles } from "../../composants/communs.tsx";
import { Anneau } from "../resultats/graphiques.tsx";

const COULEURS = ["var(--c1)", "var(--c2)", "var(--c3)", "var(--c4)", "var(--c5)"];

/** Mois courant, heure de Paris : « AAAA-MM ». */
function moisCourant(): string {
  const p = new Intl.DateTimeFormat("fr-CA", { year: "numeric", month: "2-digit", timeZone: "Europe/Paris" }).formatToParts(new Date());
  return `${p.find((x) => x.type === "year")!.value}-${p.find((x) => x.type === "month")!.value}`;
}
/** Les 12 mois avant et les 12 mois après le mois courant, pour « à partir de ». */
function moisProches(): string[] {
  const [a, m] = moisCourant().split("-").map(Number) as [number, number];
  return Array.from({ length: 25 }, (_, i) => {
    const d = new Date(Date.UTC(a, m - 1 + i - 12, 1));
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
  }).reverse();
}

/**
 * Paramètres → Coûts par buvette (module 8 ; dossier §15.83, §15.84, §15.113) : les frais de chaque
 * stand, et ce que coûte chaque stand sur un mois (matière, personnel, frais), face à son CA HT.
 */
export function CoutsBuvette() {
  const [mois, setMois] = useState<string | null>(null);
  const etat = useQuery({ queryKey: ["couts-buvette", mois], queryFn: () => api.get<Etat>(`/couts-buvette${mois ? `?mois=${mois}` : ""}`), refetchOnMount: "always" });
  if (etat.isPending) return <Chargement />;
  if (etat.error) return <MessageErreur erreur={etat.error} />;
  const e = etat.data!;

  return (
    <>
      <EntetePage fil="Paramètres" filLien="/parametres" titre="Coûts par buvette" description="Les frais de chaque stand, et ce que chaque stand coûte sur un mois." />
      <Consolidation e={e} changerMois={setMois} />
      <Frais e={e} />
      <Regles>
        <ul>
          <li>
            <strong>Frais d'un stand</strong> : loyer, logiciel, abonnement, TPE — montants <strong>par mois</strong>, propres au stand, saisis directement (pas de clé
            de répartition). Ils valent à partir du mois choisi et jusqu'au prochain changement : modifier un frais en cours de saison ne réécrit pas les mois passés.
            Rien n'est prérempli : un stand sans saisie a des frais à 0. Chaque changement est inscrit au journal technique.
          </li>
          <li>
            <strong>Coût matière</strong> = quantités vendues au stand × coût matière du produit (celui de la fiche produit, mis à jour par les livraisons du Stock),
            comme dans Résultats. Un produit sans coût n'est pas compté 0 en silence : il est signalé.
          </li>
          <li>
            <strong>Masse salariale</strong> = coût réel des affectations du stand (heures réelles × taux figé à l'affectation), comme dans Équipe. Le personnel affecté
            sans stand (Click & Collect, renfort) est compté dans le total du lieu.
          </li>
          <li>
            <strong>Reste</strong> = CA HT du stand − (coût matière + masse salariale + frais du mois). Ce n'est <strong>pas</strong> le bénéfice : la commission Break
            Eat et les charges du lieu non saisies ici (assurance, salaires permanents, électricité…) n'y sont pas.
          </li>
          <li>
            <strong>Mois</strong> : les matchs ouverts ou clos du mois (heure de Paris). Un mois avec un match en cours change encore.
          </li>
        </ul>
      </Regles>
    </>
  );
}

function Consolidation({ e, changerMois }: { e: Etat; changerMois: (m: string) => void }) {
  if (!e.cle) {
    return (
      <Carte titre="Coûts du mois">
        <EtatVide titre="Aucun match joué pour l'instant">Les coûts du mois apparaissent avec le premier match ouvert.</EtatVide>
      </Carte>
    );
  }
  const repartition = repartitionCouts(e.stands, e.horsStand.masseSalariale);
  const parts = [
    repartition[0]!,
    repartition[1]!,
    repartition[2]!,
    { libelle: "Logiciel et abonnement", montant: repartition[3]!.montant + repartition[4]!.montant },
    repartition[5]!,
  ]
    .map((p, i) => ({ nom: p.libelle, v: p.montant, couleur: COULEURS[i]! }))
    .filter((p) => p.v > 0);
  const total = parts.reduce((s, p) => s + p.v, 0);
  const sansCout = [...new Set(e.stands.flatMap((s) => s.produitsSansCout))];
  const sansTaux = e.stands.reduce((s, x) => s + x.affectationsSansTaux, 0);
  const somme = (f: (s: Etat["stands"][number]) => number) => e.stands.reduce((t, s) => t + f(s), 0);

  return (
    <>
      <Carte
        titre={`Coûts du mois — ${e.libelle}`}
        description={`${e.matchs} match${e.matchs > 1 ? "s" : ""} ce mois-ci.`}
        actions={
          <select value={e.cle} onChange={(ev) => changerMois(ev.target.value)} aria-label="Mois">
            {e.moisDisponibles.map((m) => (
              <option key={m.cle} value={m.cle}>
                {m.libelle}
              </option>
            ))}
          </select>
        }
      >
        {sansCout.length > 0 && (
          <div className="message message-alerte" style={{ marginTop: 0 }}>
            Coût matière manquant pour {sansCout.join(", ")} : leur coût n'est pas dans les totaux. Il se règle dans <Link to="/parametres/produits">Produits & prix</Link> ou
            par une livraison dans le Stock.
          </div>
        )}
        {sansTaux > 0 && (
          <div className="message message-alerte">
            {sansTaux} affectation{sansTaux > 1 ? "s" : ""} sans taux horaire : {sansTaux > 1 ? "leur coût manque" : "son coût manque"} dans la masse salariale (
            <Link to="/equipe">Équipe</Link>).
          </div>
        )}
        <div className="scroll-x">
          <table className="tableau">
            <thead>
              <tr>
                <th>Stand</th>
                <th className="d">CA HT</th>
                <th className="d">Coût matière</th>
                <th className="d">Masse salariale</th>
                <th className="d">Frais du mois</th>
                <th className="d">Total des coûts</th>
                <th className="d">Reste</th>
              </tr>
            </thead>
            <tbody>
              {e.stands.map((s) => (
                <tr key={s.standId}>
                  <td>
                    {s.nom}
                    {!s.actif && <span className="discret"> (désactivé)</span>}
                  </td>
                  <td className="d chiffre">{formaterMontant(s.caHt)}</td>
                  <td className="d chiffre">{formaterMontant(s.coutMatiere)}</td>
                  <td className="d chiffre">{formaterMontant(s.masseSalariale)}</td>
                  <td className="d chiffre">{formaterMontant(totalFrais(s.frais))}</td>
                  <td className="d chiffre">{formaterMontant(s.total)}</td>
                  <td className="d chiffre" style={{ color: s.reste < 0 ? "var(--red)" : undefined, fontWeight: 600 }}>
                    {formaterMontant(s.reste)}
                  </td>
                </tr>
              ))}
              {e.horsStand.affectations > 0 && (
                <tr>
                  <td>
                    Personnel sans stand <span className="discret">({e.horsStand.affectations})</span>
                  </td>
                  <td />
                  <td />
                  <td className="d chiffre">{formaterMontant(e.horsStand.masseSalariale)}</td>
                  <td />
                  <td className="d chiffre">{formaterMontant(e.horsStand.masseSalariale)}</td>
                  <td className="d chiffre">{formaterMontant(-e.horsStand.masseSalariale)}</td>
                </tr>
              )}
              <tr style={{ fontWeight: 700 }}>
                <td>Total du lieu</td>
                <td className="d chiffre">{formaterMontant(somme((s) => s.caHt))}</td>
                <td className="d chiffre">{formaterMontant(somme((s) => s.coutMatiere))}</td>
                <td className="d chiffre">{formaterMontant(somme((s) => s.masseSalariale) + e.horsStand.masseSalariale)}</td>
                <td className="d chiffre">{formaterMontant(somme((s) => totalFrais(s.frais)))}</td>
                <td className="d chiffre">{formaterMontant(total)}</td>
                <td className="d chiffre">{formaterMontant(somme((s) => s.caHt) - total)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Carte>
      <Carte titre="Répartition des coûts du mois" description="Pour tout le lieu.">
        {total > 0 ? <Anneau parts={parts} centre={{ valeur: formaterMontant(total), libelle: `coûts — ${e.libelle}` }} /> : <EtatVide titre="Aucun coût ce mois-ci" />}
      </Carte>
    </>
  );
}

function Frais({ e }: { e: Etat }) {
  const client = useQueryClient();
  const [aPartirDe, setAPartirDe] = useState(moisCourant);
  const stands = e.stands.length ? e.stands : [];
  const enVigueur = (standId: string, poste: PosteStructure) => fraisDuMois(e.frais, standId, aPartirDe)[poste];
  const initial = () => Object.fromEntries(stands.flatMap((s) => POSTES_STRUCTURE.map((p) => [`${s.standId}:${p.cle}`, montantPourSaisie(enVigueur(s.standId, p.cle))])));
  const [saisie, setSaisie] = useState<Record<string, string>>(initial);
  useEffect(() => setSaisie(initial()), [e.frais, aPartirDe, e.stands.length]); // eslint-disable-line react-hooks/exhaustive-deps
  const enregistrer = useMutation({
    mutationFn: (frais: { standId: string; poste: PosteStructure; montant: number }[]) => api.put<Etat>("/couts-buvette/frais", { aPartirDe, frais }),
    onSuccess: () => void client.invalidateQueries({ queryKey: ["couts-buvette"] }),
  });
  const changes = stands.flatMap((s) =>
    POSTES_STRUCTURE.flatMap((p) => {
      const v = lireMontant(saisie[`${s.standId}:${p.cle}`] ?? "");
      return v !== null && v !== enVigueur(s.standId, p.cle) ? [{ standId: s.standId, poste: p.cle, montant: v }] : [];
    }),
  );
  const invalide = stands.some((s) => POSTES_STRUCTURE.some((p) => lireMontant(saisie[`${s.standId}:${p.cle}`] ?? "") === null));

  return (
    <Carte
      titre="Frais par stand (par mois)"
      description="Saisis les frais propres à chaque stand. Ils s'appliquent à partir du mois choisi."
      actions={
        <label style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 13, whiteSpace: "nowrap" }}>
          À partir de
          <select value={aPartirDe} onChange={(ev) => setAPartirDe(ev.target.value)}>
            {moisProches().map((m) => (
              <option key={m} value={m}>
                {libelleMois(m)}
              </option>
            ))}
          </select>
        </label>
      }
    >
      {stands.length === 0 ? (
        <EtatVide titre="Aucun stand">
          Crée d'abord les stands dans <Link to="/parametres/stands">Stands & caisses</Link>.
        </EtatVide>
      ) : (
        <>
          <div className="scroll-x">
            <table className="tableau">
              <thead>
                <tr>
                  <th>Stand</th>
                  {POSTES_STRUCTURE.map((p) => (
                    <th key={p.cle}>{p.libelle} (€)</th>
                  ))}
                  <th className="d">Total / mois</th>
                </tr>
              </thead>
              <tbody>
                {stands.map((s) => (
                  <tr key={s.standId}>
                    <td>{s.nom}</td>
                    {POSTES_STRUCTURE.map((p) => {
                      const cle = `${s.standId}:${p.cle}`;
                      return (
                        <td key={p.cle}>
                          <input
                            type="text"
                            inputMode="decimal"
                            value={saisie[cle] ?? ""}
                            onChange={(ev) => setSaisie({ ...saisie, [cle]: ev.target.value })}
                            aria-label={`${p.libelle} du stand ${s.nom}, par mois`}
                            aria-invalid={lireMontant(saisie[cle] ?? "") === null}
                            style={{ width: 96 }}
                          />
                        </td>
                      );
                    })}
                    <td className="d chiffre">
                      {formaterMontant(POSTES_STRUCTURE.reduce((t, p) => t + (lireMontant(saisie[`${s.standId}:${p.cle}`] ?? "") ?? 0), 0))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="actions" style={{ justifyContent: "flex-start", marginTop: 12 }}>
            <button className="btn" disabled={changes.length === 0 || invalide || enregistrer.isPending} onClick={() => enregistrer.mutate(changes)}>
              Enregistrer à partir de {libelleMois(aPartirDe).toLowerCase()}
            </button>
            {changes.length > 0 && (
              <span className="discret">
                {changes.length} montant{changes.length > 1 ? "s" : ""} modifié{changes.length > 1 ? "s" : ""}
              </span>
            )}
          </div>
          <MessageErreur erreur={enregistrer.error} />
        </>
      )}
    </Carte>
  );
}
