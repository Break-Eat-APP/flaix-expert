import { useState } from "react";
import { Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight } from "lucide-react";
import {
  estIdPeriode,
  estJour,
  etatCible,
  libelleTauxTva,
  raccourcisPeriode,
  type Periode,
  tauxMargePb,
  margeParVente,
  margesParCategorie,
  pistesMarges,
  reperesMarges,
  variation,
  type FinancesSoiree,
  type ProduitVendu,
  type Resultats,
  type StatsMatch,
} from "@flaix/domain";
import { api } from "../../api.ts";
import { useOptions } from "../../session.tsx";
import { Carte, Chargement, EtatVide, MessageErreur, Regles } from "../../composants/communs.tsx";
import { Duo, Nuage, euros, eurosAxe } from "./graphiques.tsx";
import { VueFinances } from "./Finances.tsx";
import { VuePertes } from "./Pertes.tsx";
import { EtatCibleMarge } from "../../composants/cibles.tsx";
import { ResteSoiree } from "./ResteSoiree.tsx";
import { VuePrives } from "./Prives.tsx";
import { BilanDe, VueEnsemble } from "./Ensemble.tsx";

type Vue = "ensemble" | "ventes" | "finances" | "marges" | "pertes" | "rapports" | "prives";
const VUES: [Vue, string][] = [
  ["ensemble", "Vue d'ensemble"],
  ["ventes", "Ventes"],
  ["finances", "Finances"],
  ["marges", "Marges"],
  ["pertes", "Où je perds de l'argent"],
  ["rapports", "Rapports de soirée"],
  ["prives", "Événements privés"],
];
const dateCourte = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", timeZone: "Europe/Paris" });
const court = (e: { id?: string; libelle: string; debut: string }) => (e.id && estIdPeriode(e.id) ? e.libelle : `${e.libelle} · ${dateCourte.format(new Date(e.debut))}`);
/** Date courte d'un événement, ou bornes d'une période (« 1 sept. – 30 sept. »). */
function quand(e: { id: string; debut: string }): string {
  if (!estIdPeriode(e.id)) return dateCourte.format(new Date(e.debut));
  const [, du, au] = e.id.split(":") as [string, string, string];
  const f = (j: string) => dateCourte.format(new Date(`${j}T12:00:00Z`));
  return du === au ? f(du) : `${f(du)} – ${f(au)}`;
}
const pourcent = (v: number, d = 1) => `${v >= 0 ? "+" : "−"}${Math.abs(v).toLocaleString("fr-FR", { minimumFractionDigits: d, maximumFractionDigits: d })} %`;

/**
 * Résultats (dossier §15.103) : tout vient du journal de caisse ; une donnée manquante est
 * écrite comme telle (« coût manquant », « affluence manquante »), jamais estimée.
 */
export function Tableaux() {
  const [vue, setVue] = useState<Vue>("ensemble");
  // Onglet Événements privés seulement avec l'option du lieu (audit §15.175).
  const options = useOptions();
  const vues = VUES.filter(([id]) => id !== "prives" || options.evenements_prives !== false);
  const [evenementId, setEvenementId] = useState<string | null>(null);
  const [comparaisonId, setComparaisonId] = useState<string | null>(null);
  // Bilan d'un événement, ou d'une période « du … au … » (§15.133).
  const [mode, setMode] = useState<"evenement" | "periode">("evenement");
  const [periode, setPeriode] = useState<Periode>(() => raccourcisPeriode()[0]!.periode);
  const q = new URLSearchParams();
  if (mode === "periode") {
    q.set("du", periode.du);
    q.set("au", periode.au);
  } else {
    if (evenementId) q.set("evenementId", evenementId);
    if (comparaisonId) q.set("comparaison", comparaisonId);
  }
  const r = useQuery({ queryKey: ["resultats", mode, q.toString()], queryFn: () => api.get<Resultats>(`/resultats?${q}`), placeholderData: (avant) => avant });

  if (r.isPending) return <Chargement />;
  if (r.error) return <MessageErreur erreur={r.error} />;
  const d = r.data!;
  if ((!d.evenement || !d.actuel) && mode === "evenement") {
    return (
      <Carte titre="Résultats des événements">
        <EtatVide titre="Aucune vente pour l'instant">
          Les résultats apparaissent dès le premier ticket du premier événement. L'événement du jour s'ouvre dans <Link to="/caisses">Caisses</Link>.
        </EtatVide>
      </Carte>
    );
  }
  const e = d.evenement!;
  const enPeriode = !!d.periode;
  const autres = enPeriode ? [] : d.matchs.filter((m) => m.id !== e.id);

  return (
    <>
      <BilanDe d={d} />
      <div className="en-ligne" style={{ justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 10 }}>
        <div className="onglets" style={{ marginBottom: 0 }}>
          {vues.map(([id, libelle]) => (
            <button key={id} className={`onglet${vue === id ? " actif" : ""}`} onClick={() => setVue(id)}>
              {libelle}
            </button>
          ))}
        </div>
        <div className="choix-bilan">
          <div className="bascule" role="group" aria-label="Bilan">
            <button aria-pressed={mode === "evenement"} onClick={() => setMode("evenement")}>
              Un événement
            </button>
            <button aria-pressed={mode === "periode"} onClick={() => setMode("periode")}>
              Une période
            </button>
          </div>
          {mode === "evenement" ? (
            <label className="choix-match">
              Événement
              <select
                value={e.id}
                onChange={(ev) => {
                  setEvenementId(ev.target.value);
                  setComparaisonId(null);
                }}
              >
                {d.matchs.map((m) => (
                  <option key={m.id} value={m.id}>
                    {court(m)}
                    {m.etat === "ouvert" ? " (en cours)" : ""}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <ChoixPeriode periode={periode} changer={setPeriode} />
          )}
          {d.comparaison && (
            <button type="button" className="pastille-comparaison" onClick={() => setVue("ventes")} title="Choisir l'événement de comparaison (onglet Ventes)">
              Comparé à {d.periode ? "la période précédente" : court(d.comparaison)}
            </button>
          )}
          {!d.periode && e.etat === "clos" && (
            <Link className="btn" to={`/rapport-soiree/${e.id}`}>
              Rapport de soirée <ArrowUpRight size={15} />
            </Link>
          )}
        </div>
      </div>
      {d.periode && (
        <p className="note" style={{ marginTop: 0 }}>
          Bilan {e.libelle} : {d.periode.evenements.length === 0 ? "aucun événement dans cette période." : `${d.periode.evenements.length} événement${d.periode.evenements.length > 1 ? "s" : ""} (${d.periode.evenements.map((m) => court(m)).join(", ")}).`}{" "}
          Comparé à la période précédente de même durée{d.comparaison ? ` (${d.comparaison.libelle})` : " : aucune vente, pas de comparaison"}.
        </p>
      )}

      <div className="resultats-colonne">
          {vue === "ensemble" && <VueEnsemble d={d} haut={<ResteEnBref d={d} voirFinances={() => setVue("finances")} />} />}
          {vue === "ventes" && <VueVentes d={d} autres={autres} choisir={setComparaisonId} />}
          {vue === "finances" && (d.periode ? <VueFinances periode={{ du: d.periode.du, au: d.periode.au }} s={d.actuel!} /> : <VueFinances evenementId={e.id} s={d.actuel!} />)}
          {vue === "marges" && <VueMarges s={d.actuel!} />}
          {vue === "pertes" && (d.periode ? <VuePertes periode={{ du: d.periode.du, au: d.periode.au }} /> : <VuePertes evenementId={e.id} />)}
          {vue === "prives" && <VuePrives periode={d.periode ? { du: d.periode.du, au: d.periode.au } : undefined} />}
          {vue === "rapports" && <VueRapports d={d} choisir={(id) => { setEvenementId(id); setComparaisonId(null); }} />}
      </div>

      <Regles>
        <ul>
          <li><strong>Source</strong> : le journal de caisse de l'événement (ventes moins annulations). Rien n'est saisi ni estimé sur cet écran.</li>
          <li><strong>Tickets</strong> = ventes − annulations. <strong>Panier moyen</strong> = CA TTC ÷ tickets. <strong>CA par spectateur</strong> = CA TTC ÷ affluence saisie dans Paramètres → Saison ; sans affluence, il n'est pas calculé.</li>
          <li><strong>Évolution</strong> : par rapport à l'événement de comparaison (par défaut l'événement précédent qui a des ventes ; il se choisit dans l'onglet Ventes). Aucune évolution n'est affichée si la comparaison manque.</li>
          <li><strong>Une période</strong> (« du … au … ») : additionne les événements dont la date de début (heure de Paris) tombe entre ces deux jours inclus, comme les clôtures mensuelles. Elle se compare à la période précédente de même durée. CA par spectateur seulement si l'affluence est saisie pour chaque événement de la période.</li>
          <li><strong>Heures</strong> : heure de Paris ; une soirée qui passe minuit reste dans l'ordre.</li>
          <li><strong>CA HT et TVA</strong> : somme des lignes de ticket, TVA calculée à chaque vente selon le taux du produit.</li>
          <li><strong>Coût matière</strong> = quantité vendue × coût saisi aujourd'hui sur la fiche produit (Paramètres → Produits & prix). FlaiX ne garde pas encore l'historique des coûts : si un coût change, la marge des événements passés change aussi. <strong>Si un produit vendu n'a pas de coût, la marge brute n'est pas calculée</strong> (« coût manquant »), jamais affichée à 100 %.</li>
          <li><strong>Marge brute</strong> = CA HT − coût matière. <strong>Ce qu'il te reste</strong> = marge brute ± écarts de stock comptés − personnel − frais de la soirée − part des frais du mois (Paramètres → Mes frais), avant impôt ; le détail est dans Finances.</li>
          <li><strong>Où je perds de l'argent</strong> : règles fixes, sans IA. Constaté = écarts de stock (les stands se compensent), manques d'espèces du comptage qui fait foi, ventes sous le tarif. Estimation = ventes manquées par une rupture, au rythme du stand (unités par ticket avant la rupture × tickets du stand après), en fourchette ; non chiffrée sous 20 tickets avant la rupture. Pistes = ordres de grandeur (sous la cible, volume × marge, écarts entre stands pour 100 tickets). Caisse à plein régime : 85 % de son maximum pendant 15 min, sans montant. Ces familles ne s'additionnent jamais.</li>
          <li><strong>Marges</strong> : les repères du nuage sont les médianes de l'événement (ventes et marge par vente des produits dont le coût est connu). « À revoir » = vendu plus que la médiane pour une marge par vente sous la médiane. Les pistes sont des calculs « à volume égal », pas des conseils.</li>
        </ul>
      </Regles>
    </>
  );
}

/** « Ce qu'il te reste » en tête de l'accueil (§15.154) : le chiffre que le logiciel doit donner avant tout. */
function ResteEnBref({ d, voirFinances }: { d: Resultats; voirFinances: () => void }) {
  const cle = d.periode ? `${d.periode.du}:${d.periode.au}` : d.evenement!.id;
  const chemin = d.periode ? `/finances?du=${d.periode.du}&au=${d.periode.au}` : `/finances?evenementId=${d.evenement!.id}`;
  const q = useQuery({ queryKey: ["finances", cle], queryFn: () => api.get<FinancesSoiree>(chemin) });
  if (!q.data) return null;
  return (
    <ResteSoiree
      f={q.data}
      periode={!!d.periode}
      action={
        <button className="btn" onClick={voirFinances}>
          Voir le détail
        </button>
      }
    />
  );
}

function VueVentes({ d, autres, choisir }: { d: Resultats; autres: Resultats["matchs"]; choisir: (id: string) => void }) {
  const a = d.actuel!, p = d.precedent, c = d.comparaison, e = d.evenement!;
  const cmp = [
    { etiquette: "Chiffre d'affaires", v: euros(a.caTtc), x: a.caTtc, y: p?.caTtc, avant: p ? euros(p.caTtc) : "—" },
    { etiquette: "Tickets", v: a.tickets.toLocaleString("fr-FR"), x: a.tickets, y: p?.tickets, avant: p ? p.tickets.toLocaleString("fr-FR") : "—" },
    { etiquette: "Panier moyen", v: a.panierMoyen === null ? "—" : euros(a.panierMoyen), x: a.panierMoyen, y: p?.panierMoyen, avant: p?.panierMoyen ? euros(p.panierMoyen) : "—" },
    { etiquette: "Spectateurs", v: a.spectateurs === null ? "non saisi" : a.spectateurs.toLocaleString("fr-FR"), x: a.spectateurs, y: p?.spectateurs, avant: p?.spectateurs ? p.spectateurs.toLocaleString("fr-FR") : "non saisi" },
  ];
  const noms = [...new Set([...a.parStand.map((s) => s.nom), ...(p?.parStand.map((s) => s.nom) ?? [])])];
  const stands = noms
    .map((nom) => ({ nom, a: p?.parStand.find((s) => s.nom === nom)?.ca ?? 0, b: a.parStand.find((s) => s.nom === nom)?.ca ?? 0 }))
    .sort((x, y) => y.b - x.b);
  const produits = [...new Set([...a.produits.map((x) => x.produitId), ...(p?.produits.map((x) => x.produitId) ?? [])])]
    .map((id) => ({ ici: a.produits.find((x) => x.produitId === id), la: p?.produits.find((x) => x.produitId === id) }))
    .sort((x, y) => (y.ici?.caTtc ?? 0) - (x.ici?.caTtc ?? 0));

  return (
    <>
      <Carte
        titre={`${e.libelle} comparé à…`}
        actions={
          autres.length ? (
            <div className="puces-choix">
              {autres.slice(0, 8).map((m) => (
                <button key={m.id} className="puce-choix" aria-pressed={c?.id === m.id} onClick={() => choisir(m.id)}>
                  {court(m)}
                </button>
              ))}
            </div>
          ) : undefined
        }
      >
        {!c ? (
          <EtatVide titre={enPeriodeId(e.id) ? "Aucune vente sur la période précédente" : "Aucun autre événement avec des ventes"}>
            {enPeriodeId(e.id) ? "La comparaison porte sur la période précédente de même durée." : "La comparaison sera possible dès le deuxième événement."}
          </EtatVide>
        ) : (
          <div className="comparaison">
            {cmp.map((k) => {
              const v = variation(k.x, k.y);
              return (
                <div key={k.etiquette} className="cmp">
                  <span className="etiquette">{k.etiquette}</span>
                  <span className="valeur">{k.v}</span>
                  {v === null ? <span className="variation neutre">—</span> : <span className={`variation ${v >= 0 ? "hausse" : "baisse"}`}>{pourcent(v)}</span>}
                  <span className="avant">
                    {quand(c)} : {k.avant}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </Carte>

      {c && (
        <Carte
          titre="Par stand, d'un événement à l'autre"
          actions={
            <div className="leg-inline">
              <span>
                <i className="pastille" style={{ background: "var(--gris-graph)", borderRadius: "50%" }} />
                {quand(c)}
              </span>
              <span>
                <i className="pastille" style={{ background: "var(--violet)", borderRadius: "50%" }} />
                {quand(e)}
              </span>
            </div>
          }
        >
          <Duo lignes={stands} libelleA={quand(c)} libelleB={quand(e)} />
        </Carte>
      )}

      <Carte titre="Produit par produit">
        <div className="scroll-x">
          <table className="tableau">
            <thead>
              <tr>
                <th>Produit</th>
                <th className="d">Vendus</th>
                {c && <th className="d">{quand(c)}</th>}
                <th className="d">CA TTC</th>
                {c && <th className="d">Évolution</th>}
              </tr>
            </thead>
            <tbody>
              {produits.map(({ ici, la }) => {
                const v = variation(ici?.caTtc ?? 0, la?.caTtc);
                return (
                  <tr key={(ici ?? la)!.produitId}>
                    <td>{(ici ?? la)!.nom}</td>
                    <td className="d chiffre">{ici?.quantite ?? 0}</td>
                    {c && <td className="d chiffre discret">{la?.quantite ?? 0}</td>}
                    <td className="d chiffre">{euros(ici?.caTtc ?? 0)}</td>
                    {c && <td className="d">{v === null ? <span className="variation neutre">nouveau</span> : <span className={`variation ${v >= 0 ? "hausse" : "baisse"}`}>{pourcent(v)}</span>}</td>}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Carte>
    </>
  );
}

function VueMarges({ s }: { s: StatsMatch }) {
  const repere = reperesMarges(s.produits);
  const pistes = pistesMarges(s.produits, euros);
  const lignes = [...s.produits].filter((p) => p.quantite !== 0).sort((a, b) => (b.marge ?? -Infinity) - (a.marge ?? -Infinity));
  return (
    <>
      <Carte
        titre="Ce qui se vend, ce qui rapporte"
        description={repere ? `Repères : médianes de l'événement, ${Math.round(repere.quantite)} ventes et ${euros(Math.round(repere.margeParVente))} de marge par vente` : undefined}
      >
        {repere ? (
          <div className="graphe-defile">
            <Nuage produits={s.produits} repere={repere} />
          </div>
        ) : (
          <EtatVide titre="Coûts à saisir">Le nuage des marges apparaît dès que les produits vendus ont un coût matière.</EtatVide>
        )}
        {s.produitsSansCout.length > 0 && (
          <div className="message message-alerte">
            <strong>Coût manquant</strong>, absents du nuage : {s.produitsSansCout.join(", ")}. <Link to="/parametres/produits">Saisir les coûts</Link>
          </div>
        )}
      </Carte>
      {pistes.length > 0 && (
        <Carte titre="Pistes pour le prochain événement" description="Calculées sur tes ventes et tes coûts, à toi de décider.">
          <div className="pistes">
            {pistes.map((p) => (
              <div key={p.produit} className="piste-item">
                <strong>{p.produit}</strong>
                <span>{p.constat}</span>
                <em>{p.calcul}</em>
              </div>
            ))}
          </div>
        </Carte>
      )}
      <MargeParCategorie produits={lignes} />
      <Carte titre="Marge produit par produit">
        <div className="scroll-x">
          <table className="tableau">
            <thead>
              <tr>
                <th>Produit</th>
                <th className="d">Vendus</th>
                <th className="d">CA HT</th>
                <th className="d">Coût unitaire</th>
                <th className="d">Marge / vente</th>
                <th className="d">Marge %</th>
                <th className="d">Marge totale</th>
                <th>Cible</th>
              </tr>
            </thead>
            <tbody>
              {lignes.map((p: ProduitVendu) => (
                <tr key={p.produitId}>
                  <td>{p.nom}</td>
                  <td className="d chiffre">{p.quantite}</td>
                  <td className="d chiffre">{euros(p.caHt)}</td>
                  {p.coutUnitaire === null ? (
                    <td className="d" colSpan={4}>
                      <span className="cout-manquant">coût manquant</span>
                    </td>
                  ) : (
                    <>
                      <td className="d chiffre">{euros(p.coutUnitaire)}</td>
                      <td className="d chiffre">{euros(Math.round(margeParVente(p)!))}</td>
                      <td className="d chiffre">{p.caHt > 0 ? `${((p.marge! / p.caHt) * 100).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %` : "—"}</td>
                      <td className="d chiffre">{euros(p.marge!)}</td>
                    </>
                  )}
                  <td>
                    <EtatCibleMarge etat={etatCible(tauxMargePb(p.marge, p.caHt), p.cibleMarge ?? null)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Carte>
    </>
  );
}

/** Marge totale de chaque catégorie (§15.169), avec sa cible quand elle est la même pour tous ses produits. */
function MargeParCategorie({ produits }: { produits: readonly ProduitVendu[] }) {
  const cats = margesParCategorie(produits);
  if (cats.length === 0) return null;
  const total = cats.reduce((t, c) => ({ caHt: t.caHt + c.caHt, marge: t.marge + c.marge, base: t.base + c.caHtAvecCout, sansCout: t.sansCout + c.sansCout }), { caHt: 0, marge: 0, base: 0, sansCout: 0 });
  const taux = (marge: number, base: number) => (base > 0 ? `${((marge / base) * 100).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %` : "—");
  return (
    <Carte titre="Marge par catégorie" description="Marge = CA HT − coût matière et conditionnement. Le taux se calcule sur les produits dont le coût est saisi.">
      <div className="scroll-x">
        <table className="tableau">
          <thead>
            <tr>
              <th>Catégorie</th>
              <th className="d">Vendus</th>
              <th className="d">CA HT</th>
              <th className="d">Marge totale</th>
              <th className="d">Marge %</th>
              <th>Cible</th>
            </tr>
          </thead>
          <tbody>
            {cats.map((c) => (
              <tr key={c.categorie}>
                <td>
                  {c.categorie}
                  {c.sansCout > 0 && (
                    <span className="cout-manquant" style={{ marginLeft: 8 }}>
                      {c.sansCout} sans coût
                    </span>
                  )}
                </td>
                <td className="d chiffre">{c.quantite}</td>
                <td className="d chiffre">{euros(c.caHt)}</td>
                <td className="d chiffre">{c.caHtAvecCout > 0 ? euros(c.marge) : "—"}</td>
                <td className="d chiffre">{taux(c.marge, c.caHtAvecCout)}</td>
                <td>{c.caHtAvecCout > 0 ? <EtatCibleMarge etat={etatCible(tauxMargePb(c.marge, c.caHtAvecCout), c.cible)} /> : null}</td>
              </tr>
            ))}
            <tr className="total">
              <td>
                <strong>Total</strong>
              </td>
              <td />
              <td className="d chiffre">
                <strong>{euros(total.caHt)}</strong>
              </td>
              <td className="d chiffre">
                <strong>{total.base > 0 ? euros(total.marge) : "—"}</strong>
              </td>
              <td className="d chiffre">
                <strong>{taux(total.marge, total.base)}</strong>
              </td>
              <td />
            </tr>
          </tbody>
        </table>
      </div>
    </Carte>
  );
}

function VueRapports({ d, choisir }: { d: Resultats; choisir: (id: string) => void }) {
  const dans = d.periode ? new Set(d.periode.evenements.map((m) => m.id)) : null;
  const liste = dans ? d.matchs.filter((m) => dans.has(m.id)) : d.matchs;
  const chrono = [...liste].sort((a, b) => Date.parse(a.debut) - Date.parse(b.debut));
  const total = chrono.reduce((s, m) => s + m.caTtc, 0);
  const max = Math.max(...chrono.map((m) => m.caTtc), 1);
  return (
    <>
      <Carte titre="La saison, événement par événement" description={`${euros(total)} sur ${chrono.length} événement${chrono.length > 1 ? "s" : ""} · moyenne ${euros(Math.round(total / Math.max(chrono.length, 1)))}`}>
        <div className="saison" role="img" aria-label={chrono.map((m) => `${m.libelle} ${euros(m.caTtc)}`).join(", ")}>
          {chrono.map((m) => (
            <button key={m.id} className={`col${m.id === d.evenement!.id ? " actif" : ""}`} onClick={() => choisir(m.id)} title={`${m.libelle} : ${euros(m.caTtc)}`}>
              <span className="v">{eurosAxe(m.caTtc)}</span>
              <span className="b" style={{ height: `${(m.caTtc / max) * 140}px` }} />
              <span className="m">{dateCourte.format(new Date(m.debut))}</span>
            </button>
          ))}
        </div>
      </Carte>
      <Carte titre="Événements" description="Chiffres clés de chaque événement. Le rapport de soirée d'un événement clos est figé à sa clôture : à lire, imprimer ou enregistrer en PDF.">
        <div className="scroll-x">
          <table className="tableau">
            <thead>
              <tr>
                <th>Événement</th>
                <th>État</th>
                <th className="d">CA TTC</th>
                <th className="d">Tickets</th>
                <th className="d">Panier moyen</th>
                <th className="d">Spectateurs</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {liste.map((m) => (
                <tr key={m.id}>
                  <td>{court(m)}</td>
                  <td>{m.etat === "clos" ? <span className="puce puce-violet">Clos</span> : <span className="puce puce-vert">En cours</span>}</td>
                  <td className="d chiffre">{euros(m.caTtc)}</td>
                  <td className="d chiffre">{m.tickets}</td>
                  <td className="d chiffre">{m.tickets > 0 ? euros(Math.round(m.caTtc / m.tickets)) : "—"}</td>
                  <td className="d chiffre">{m.spectateurs?.toLocaleString("fr-FR") ?? "non saisi"}</td>
                  <td className="d">
                    <span className="en-ligne" style={{ gap: 10, justifyContent: "flex-end" }}>
                      <button className="btn-lien" onClick={() => choisir(m.id)}>
                        Voir
                      </button>
                      {m.etat === "clos" && (
                        <Link className="btn-lien" to={`/rapport-soiree/${m.id}`}>
                          Rapport de soirée
                        </Link>
                      )}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Carte>
    </>
  );
}

const enPeriodeId = (id: string) => estIdPeriode(id);

/** Choix d'une période « du … au … », avec quelques raccourcis (§15.133). */
function ChoixPeriode({ periode, changer }: { periode: Periode; changer: (p: Periode) => void }) {
  const [du, setDu] = useState(periode.du);
  const [au, setAu] = useState(periode.au);
  const valide = estJour(du) && estJour(au) && du <= au;
  const appliquer = (p: Periode) => {
    setDu(p.du);
    setAu(p.au);
    changer(p);
  };
  return (
    <div className="choix-periode">
      <label>
        Du
        <input type="date" value={du} onChange={(e) => setDu(e.target.value)} onBlur={() => valide && changer({ du, au })} aria-label="Premier jour" />
      </label>
      <label>
        au
        <input type="date" value={au} onChange={(e) => setAu(e.target.value)} onBlur={() => valide && changer({ du, au })} aria-label="Dernier jour" />
      </label>
      <button className="btn" disabled={!valide || (du === periode.du && au === periode.au)} onClick={() => changer({ du, au })}>
        Voir
      </button>
      {!valide && <span className="texte-ambre">Dates à vérifier</span>}
      <div className="raccourcis-periode">
        {raccourcisPeriode().map((r) => (
          <button key={r.libelle} className="puce-choix" aria-pressed={r.periode.du === periode.du && r.periode.au === periode.au} onClick={() => appliquer(r.periode)}>
            {r.libelle}
          </button>
        ))}
      </div>
    </div>
  );
}
