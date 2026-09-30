import { useState } from "react";
import { Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import {
  libelleTauxTva,
  margeParVente,
  pistesMarges,
  rangHeure,
  regrouperParts,
  reperesMarges,
  variation,
  type Evenement,
  type ProduitVendu,
  type Resultats,
  type StatsMatch,
} from "@flaix/domain";
import { api, formaterDateHeure } from "../../api.ts";
import { Carte, Chargement, EtatVide, MessageErreur, Regles } from "../../composants/communs.tsx";
import { Anneau, Cascade, CourbeHeures, Duo, Empile, MiniCourbe, Nuage, euros, eurosAxe, type EtapeCascade } from "./graphiques.tsx";

type Vue = "ensemble" | "ventes" | "finances" | "marges" | "rapports";
const VUES: [Vue, string][] = [
  ["ensemble", "Vue d'ensemble"],
  ["ventes", "Ventes"],
  ["finances", "Finances"],
  ["marges", "Marges"],
  ["rapports", "Rapports de soirée"],
];
const COULEURS = ["var(--c1)", "var(--c2)", "var(--c3)", "var(--c4)", "var(--c5)"];
const dateCourte = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", timeZone: "Europe/Paris" });
const court = (e: { libelle: string; debut: string }) => `${e.libelle} · ${dateCourte.format(new Date(e.debut))}`;
const pourcent = (v: number, d = 1) => `${v >= 0 ? "+" : "−"}${Math.abs(v).toLocaleString("fr-FR", { minimumFractionDigits: d, maximumFractionDigits: d })} %`;

/** Évolution écrite en toutes lettres : jamais un pourcentage inventé quand la comparaison manque. */
function Evolution({ actuel, avant, comparaison }: { actuel: number | null; avant: number | null | undefined; comparaison: Evenement | null }) {
  if (!comparaison) return <span className="variation neutre">aucun match de comparaison</span>;
  const v = variation(actuel, avant);
  if (v === null) return <span className="variation neutre">pas de comparaison possible</span>;
  return <span className={`variation ${v >= 0 ? "hausse" : "baisse"}`}>{pourcent(v)} vs {dateCourte.format(new Date(comparaison.debut))}</span>;
}

/**
 * Résultats (dossier §15.103) : tout vient du journal de caisse ; une donnée manquante est
 * écrite comme telle (« coût manquant », « affluence manquante »), jamais estimée.
 */
export function Tableaux() {
  const [vue, setVue] = useState<Vue>("ensemble");
  const [evenementId, setEvenementId] = useState<string | null>(null);
  const [comparaisonId, setComparaisonId] = useState<string | null>(null);
  const q = new URLSearchParams();
  if (evenementId) q.set("evenementId", evenementId);
  if (comparaisonId) q.set("comparaison", comparaisonId);
  const r = useQuery({ queryKey: ["resultats", evenementId, comparaisonId], queryFn: () => api.get<Resultats>(`/resultats?${q}`), placeholderData: (avant) => avant });

  if (r.isPending) return <Chargement />;
  if (r.error) return <MessageErreur erreur={r.error} />;
  const d = r.data!;
  if (!d.evenement || !d.actuel) {
    return (
      <Carte titre="Résultats des matchs">
        <EtatVide titre="Aucune vente pour l'instant">
          Les résultats apparaissent dès le premier ticket du premier match. Le match du jour s'ouvre dans <Link to="/caisses">Caisses</Link>.
        </EtatVide>
      </Carte>
    );
  }
  const e = d.evenement;
  const autres = d.matchs.filter((m) => m.id !== e.id);

  return (
    <>
      <div className="en-ligne" style={{ justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 10 }}>
        <div className="onglets" style={{ marginBottom: 0 }}>
          {VUES.map(([id, libelle]) => (
            <button key={id} className={`onglet${vue === id ? " actif" : ""}`} onClick={() => setVue(id)}>
              {libelle}
            </button>
          ))}
        </div>
        <label className="choix-match">
          Match
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
      </div>

      <div className="resultats-grille">
        <div className="resultats-colonne">
          {vue === "ensemble" && <VueEnsemble d={d} />}
          {vue === "ventes" && <VueVentes d={d} autres={autres} choisir={setComparaisonId} />}
          {vue === "finances" && <VueFinances s={d.actuel} />}
          {vue === "marges" && <VueMarges s={d.actuel} />}
          {vue === "rapports" && <VueRapports d={d} choisir={(id) => { setEvenementId(id); setComparaisonId(null); }} />}
        </div>
        <aside className="resultats-panneau">
          <Carte titre="À surveiller">
            {d.alertes.length === 0 ? (
              <div className="discret" style={{ fontSize: 12.5 }}>Rien à signaler sur ce match.</div>
            ) : (
              <div className="alertes-liste">
                {d.alertes.map((a) => (
                  <div key={a.titre} className={`alerte-ligne${a.niveau === "forte" ? " forte" : ""}`}>
                    <strong>{a.titre}</strong>
                    <span>{a.detail}</span>
                  </div>
                ))}
              </div>
            )}
          </Carte>
          <Carte titre="Prochains matchs">
            {d.prochains.length === 0 ? (
              <div className="discret" style={{ fontSize: 12.5 }}>
                Aucun match à venir. <Link to="/parametres/saison">Préparer la saison</Link>
              </div>
            ) : (
              <div className="alertes-liste">
                {d.prochains.map((p) => (
                  <div key={p.id} className="alerte-ligne">
                    <strong>{p.libelle}</strong>
                    <span>{formaterDateHeure(p.debut)}</span>
                  </div>
                ))}
              </div>
            )}
          </Carte>
        </aside>
      </div>

      <Regles>
        <ul>
          <li><strong>Source</strong> : le journal de caisse du match (ventes moins annulations). Rien n'est saisi ni estimé sur cet écran.</li>
          <li><strong>Tickets</strong> = ventes − annulations. <strong>Panier moyen</strong> = CA TTC ÷ tickets. <strong>CA par spectateur</strong> = CA TTC ÷ affluence saisie dans Paramètres → Saison ; sans affluence, il n'est pas calculé.</li>
          <li><strong>Évolution</strong> : par rapport au match de comparaison (par défaut le match précédent qui a des ventes ; il se choisit dans l'onglet Ventes). Aucune évolution n'est affichée si la comparaison manque.</li>
          <li><strong>Heures</strong> : heure de Paris ; une soirée qui passe minuit reste dans l'ordre.</li>
          <li><strong>CA HT et TVA</strong> : somme des lignes de ticket, TVA calculée à chaque vente selon le taux du produit.</li>
          <li><strong>Coût matière</strong> = quantité vendue × coût saisi aujourd'hui sur la fiche produit (Paramètres → Produits & prix). FlaiX ne garde pas encore l'historique des coûts : si un coût change, la marge des matchs passés change aussi. <strong>Si un produit vendu n'a pas de coût, la marge brute n'est pas calculée</strong> (« coût manquant »), jamais affichée à 100 %.</li>
          <li><strong>Marge brute</strong> = CA HT − coût matière. Le personnel, la commission, les frais et les autres dépenses ne sont pas encore saisis dans FlaiX : la marge nette de la soirée viendra avec eux.</li>
          <li><strong>Marges</strong> : les repères du nuage sont les médianes du match (ventes et marge par vente des produits dont le coût est connu). « À revoir » = vendu plus que la médiane pour une marge par vente sous la médiane. Les pistes sont des calculs « à volume égal », pas des conseils.</li>
        </ul>
      </Regles>
    </>
  );
}

/** Heures de la soirée (union des deux matchs, dans l'ordre de la soirée) et CA de chaque match par heure. */
function seriesHeures(a: StatsMatch, b: StatsMatch | null) {
  const toutes = [...new Set([...a.parHeure, ...(b?.parHeure ?? [])].map((h) => h.heure))].sort((x, y) => rangHeure(x) - rangHeure(y));
  if (toutes.length === 0) return { heures: [], actuel: [], avant: null };
  const de = rangHeure(toutes[0]!), a2 = rangHeure(toutes.at(-1)!);
  const plage: number[] = [];
  for (let h = de; h <= a2; h++) plage.push(h % 24);
  const valeur = (s: StatsMatch, h: number) => s.parHeure.find((x) => x.heure === h)?.ca ?? 0;
  return { heures: plage.map((h) => `${h} h`), actuel: plage.map((h) => valeur(a, h)), avant: b ? plage.map((h) => valeur(b, h)) : null };
}

function VueEnsemble({ d }: { d: Resultats }) {
  const a = d.actuel!, p = d.precedent, c = d.comparaison;
  const heuresA = [...a.parHeure].sort((x, y) => rangHeure(x.heure) - rangHeure(y.heure));
  const chiffres = [
    { etiquette: "Chiffre d'affaires TTC", valeur: euros(a.caTtc), actuel: a.caTtc, avant: p?.caTtc, serie: heuresA.map((h) => h.ca) },
    { etiquette: "Tickets", valeur: a.tickets.toLocaleString("fr-FR"), actuel: a.tickets, avant: p?.tickets, serie: heuresA.map((h) => h.tickets) },
    { etiquette: "Panier moyen", valeur: a.panierMoyen === null ? "—" : euros(a.panierMoyen), actuel: a.panierMoyen, avant: p?.panierMoyen, serie: heuresA.map((h) => (h.tickets > 0 ? h.ca / h.tickets : 0)) },
    {
      etiquette: "CA par spectateur",
      valeur: a.caParSpectateur === null ? "Affluence manquante" : euros(a.caParSpectateur),
      actuel: a.caParSpectateur,
      avant: p?.caParSpectateur,
      serie: a.spectateurs ? heuresA.map((h) => h.ca) : [],
    },
  ];
  const series = seriesHeures(a, p);
  const parts = regrouperParts(a.parCategorie).map((x, i) => ({ nom: x.nom, v: x.ca, couleur: x.autres ? "var(--gris-graph)" : COULEURS[i]! }));
  const meilleurs = [...a.produits].filter((x) => x.caTtc > 0).sort((x, y) => y.caTtc - x.caTtc).slice(0, 7);
  const maxCa = meilleurs[0]?.caTtc ?? 1;

  return (
    <>
      <div className="chiffres">
        {chiffres.map((k, i) => (
          <div key={k.etiquette} className={`chiffre-cle${i === 0 ? " mis-en-avant" : ""}`}>
            <span className="etiquette">{k.etiquette}</span>
            <span className="valeur" style={k.actuel === null ? { fontSize: 16, paddingBlock: 5 } : undefined}>
              {k.valeur}
            </span>
            {k.actuel === null && k.etiquette === "CA par spectateur" ? (
              <span className="variation neutre">
                <Link to="/parametres/saison">Saisir l'affluence</Link>
              </span>
            ) : (
              <Evolution actuel={k.actuel} avant={k.avant} comparaison={c} />
            )}
            <MiniCourbe serie={k.serie} clair={i === 0} />
          </div>
        ))}
      </div>

      <Carte
        titre="Chiffre d'affaires par heure"
        actions={
          <div className="leg-inline">
            <span>
              <i className="trait" />
              {court(d.evenement!)}
            </span>
            {c && (
              <span>
                <i className="trait tirets" />
                {court(c)}
              </span>
            )}
          </div>
        }
      >
        <div className="graphe-defile">
          <CourbeHeures heures={series.heures} actuel={series.actuel} avant={series.avant} libelleActuel={dateCourte.format(new Date(d.evenement!.debut))} libelleAvant={c ? dateCourte.format(new Date(c.debut)) : null} />
        </div>
      </Carte>

      <div className="deux">
        <Carte titre="Ventes par catégorie" description="Part du CA TTC">
          {parts.length ? <Anneau parts={parts} centre={{ valeur: euros(a.caTtc), libelle: "CA TTC du match" }} /> : <EtatVide titre="Aucune vente" />}
        </Carte>
        <Carte titre="Meilleurs produits du match">
          <div className="scroll-x">
            <table className="tableau">
              <thead>
                <tr>
                  <th>Produit</th>
                  <th className="d">Vendus</th>
                  <th className="d">CA TTC</th>
                  <th className="d">Marge / vente</th>
                </tr>
              </thead>
              <tbody>
                {meilleurs.map((x) => (
                  <tr key={x.produitId}>
                    <td>{x.nom}</td>
                    <td className="d chiffre">{x.quantite}</td>
                    <td className="d chiffre">
                      <span className="db">
                        <i style={{ width: `${(x.caTtc / maxCa) * 100}%` }} />
                      </span>
                      {euros(x.caTtc)}
                    </td>
                    <td className="d chiffre">{margeParVente(x) === null ? <span className="cout-manquant">coût manquant</span> : euros(Math.round(margeParVente(x)!))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Carte>
      </div>
    </>
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
          <EtatVide titre="Aucun autre match avec des ventes">La comparaison sera possible dès le deuxième match.</EtatVide>
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
                    {dateCourte.format(new Date(c.debut))} : {k.avant}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </Carte>

      {c && (
        <Carte
          titre="Par stand, d'un match à l'autre"
          actions={
            <div className="leg-inline">
              <span>
                <i className="pastille" style={{ background: "var(--gris-graph)", borderRadius: "50%" }} />
                {dateCourte.format(new Date(c.debut))}
              </span>
              <span>
                <i className="pastille" style={{ background: "var(--violet)", borderRadius: "50%" }} />
                {dateCourte.format(new Date(e.debut))}
              </span>
            </div>
          }
        >
          <Duo lignes={stands} libelleA={dateCourte.format(new Date(c.debut))} libelleB={dateCourte.format(new Date(e.debut))} />
        </Carte>
      )}

      <Carte titre="Produit par produit">
        <div className="scroll-x">
          <table className="tableau">
            <thead>
              <tr>
                <th>Produit</th>
                <th className="d">Vendus</th>
                {c && <th className="d">{dateCourte.format(new Date(c.debut))}</th>}
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

function VueFinances({ s }: { s: StatsMatch }) {
  const etapes: EtapeCascade[] = [
    { l1: "Encaissé", l2: "TTC", v: s.caTtc, total: true, aide: "Carte et espèces, annulations déduites" },
    { l1: "TVA", l2: "collectée", v: -s.tva, total: false, aide: "Collectée pour l'État" },
    { l1: "CA HT", v: s.caHt, total: true, aide: "Ce qui revient au lieu" },
  ];
  if (s.coutMatiere !== null && s.margeBrute !== null) {
    etapes.push({ l1: "Coût", l2: "matière", v: -s.coutMatiere, total: false, aide: "Quantités vendues × coût de la fiche produit" });
    etapes.push({ l1: "Marge", l2: "brute", v: s.margeBrute, total: true, aide: s.caHt > 0 ? `${((s.margeBrute / s.caHt) * 100).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} % du CA HT` : "" });
    // Personnel lu dans le planning d'Équipe (§15.104) : seulement s'il est saisi et complet.
    if (s.personnel.affectations > 0 && s.personnel.reel !== null) {
      const apres = s.margeBrute - s.personnel.reel;
      etapes.push({ l1: "Personnel", l2: "planning", v: -s.personnel.reel, total: false, aide: `${s.personnel.affectations} affectation${s.personnel.affectations > 1 ? "s" : ""}, heures réelles × taux` });
      etapes.push({ l1: "Après", l2: "personnel", v: apres, total: true, aide: s.caHt > 0 ? `${((apres / s.caHt) * 100).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} % du CA HT` : "" });
    }
  }
  return (
    <>
      <Carte
        titre={s.margeBrute === null ? "De l'encaissé au chiffre d'affaires HT" : s.personnel.affectations > 0 && s.personnel.reel !== null ? "De l'encaissé à la marge après personnel" : "De l'encaissé à la marge brute"}
        actions={
          <div className="leg-inline">
            <span>
              <i className="pastille" style={{ background: "var(--violet)" }} />
              Totaux
            </span>
            <span>
              <i className="pastille" style={{ background: "var(--gris-graph)" }} />
              Ce qui est retiré
            </span>
          </div>
        }
      >
        <div className="graphe-defile">
          <Cascade etapes={etapes} />
        </div>
        {s.margeBrute === null && (
          <div className="message message-alerte">
            <strong>Coût manquant</strong> sur {s.produitsSansCout.join(", ")} ({s.caHt > 0 ? Math.round((s.caHtSansCout / s.caHt) * 100) : 0} % du CA HT) : la marge brute n'est pas calculée.{" "}
            <Link to="/parametres/produits">Saisir les coûts</Link>
          </div>
        )}
        {s.personnel.affectations > 0 && s.personnel.reel === null && (
          <div className="message message-alerte">
            <strong>Taux manquant</strong> sur {s.personnel.tauxManquants} affectation{s.personnel.tauxManquants > 1 ? "s" : ""} du planning : le personnel n'est pas déduit. <Link to="/equipe">Compléter les fiches</Link>
          </div>
        )}
        <p className="note">
          Coût matière = coût saisi aujourd'hui sur chaque fiche produit.{" "}
          {s.personnel.affectations === 0 ? "Aucun planning saisi pour ce match : le personnel n'est pas déduit (Équipe → Planning). " : "Personnel = heures réelles du planning × taux de chaque affectation. "}
          Commission, frais et autres dépenses ne sont pas encore saisis dans FlaiX : ce n'est pas la marge nette de la soirée.
        </p>
      </Carte>
      <div className="deux egal">
        <Carte titre="TVA collectée par taux">
          <div className="scroll-x">
            <table className="tableau">
              <thead>
                <tr>
                  <th>Taux</th>
                  <th className="d">HT</th>
                  <th className="d">TVA</th>
                  <th className="d">TTC</th>
                </tr>
              </thead>
              <tbody>
                {s.parTaux.map((t) => (
                  <tr key={t.tauxTva}>
                    <td>{libelleTauxTva(t.tauxTva)}</td>
                    <td className="d chiffre">{euros(t.ht)}</td>
                    <td className="d chiffre">{euros(t.tva)}</td>
                    <td className="d chiffre">{euros(t.ttc)}</td>
                  </tr>
                ))}
                <tr>
                  <td><strong>Total</strong></td>
                  <td className="d chiffre"><strong>{euros(s.caHt)}</strong></td>
                  <td className="d chiffre"><strong>{euros(s.tva)}</strong></td>
                  <td className="d chiffre"><strong>{euros(s.caTtc)}</strong></td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="note">Contribution du match à la déclaration de TVA, à remettre à l'expert-comptable : il y manque la TVA déductible sur les achats.</p>
        </Carte>
        <Carte titre="Comment les clients ont payé" description={`${euros(s.caTtc)} TTC`}>
          <Empile
            parts={[
              { nom: "Carte (TPE du lieu)", v: s.parMode.carte, couleur: "var(--c1)" },
              { nom: "Espèces", v: s.parMode.especes, couleur: "var(--c3)" },
            ]}
          />
          <p className="note">La carte passe par le TPE du lieu, non relié à FlaiX : la caisse enregistre « carte », sans encaisser.</p>
        </Carte>
      </div>
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
        description={repere ? `Repères : médianes du match, ${Math.round(repere.quantite)} ventes et ${euros(Math.round(repere.margeParVente))} de marge par vente` : undefined}
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
        <Carte titre="Pistes pour le prochain match" description="Calculées sur tes ventes et tes coûts, à toi de décider.">
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Carte>
    </>
  );
}

function VueRapports({ d, choisir }: { d: Resultats; choisir: (id: string) => void }) {
  const chrono = [...d.matchs].sort((a, b) => Date.parse(a.debut) - Date.parse(b.debut));
  const total = chrono.reduce((s, m) => s + m.caTtc, 0);
  const max = Math.max(...chrono.map((m) => m.caTtc), 1);
  return (
    <>
      <Carte titre="La saison, match par match" description={`${euros(total)} sur ${chrono.length} match${chrono.length > 1 ? "s" : ""} · moyenne ${euros(Math.round(total / Math.max(chrono.length, 1)))}`}>
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
      <Carte titre="Matchs" description="Chiffres clés de chaque match ; le rapport de soirée imprimable viendra ensuite.">
        <div className="scroll-x">
          <table className="tableau">
            <thead>
              <tr>
                <th>Match</th>
                <th>État</th>
                <th className="d">CA TTC</th>
                <th className="d">Tickets</th>
                <th className="d">Panier moyen</th>
                <th className="d">Spectateurs</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {d.matchs.map((m) => (
                <tr key={m.id}>
                  <td>{court(m)}</td>
                  <td>{m.etat === "clos" ? <span className="puce puce-violet">Clos</span> : <span className="puce puce-vert">En cours</span>}</td>
                  <td className="d chiffre">{euros(m.caTtc)}</td>
                  <td className="d chiffre">{m.tickets}</td>
                  <td className="d chiffre">{m.tickets > 0 ? euros(Math.round(m.caTtc / m.tickets)) : "—"}</td>
                  <td className="d chiffre">{m.spectateurs?.toLocaleString("fr-FR") ?? "non saisi"}</td>
                  <td className="d">
                    <button className="btn-lien" onClick={() => choisir(m.id)}>
                      Voir
                    </button>
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
