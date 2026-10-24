import { Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, TriangleAlert } from "lucide-react";
import { rangHeure, regrouperParts, variation, type Evenement, type ReponsePrevision, type Resultats, type StatsMatch } from "@flaix/domain";
import { api } from "../../api.ts";
import { Carte, EtatVide } from "../../composants/communs.tsx";
import { Anneau, CourbeHeures, MiniCourbe, euros } from "./graphiques.tsx";
import { ChiffresSoiree } from "./ChiffresSoiree.tsx";

/*
 * Vue d'ensemble de Résultats au design de la 2e maquette de Rémi (dossier §15.174) : quatre chiffres clés comparés au
 * match précédent, la courbe de la soirée et les catégories, puis ce qui se vend le mieux, ce qui est à surveiller et
 * le prochain match avec sa prévision. Mêmes calculs qu'avant : rien n'est inventé quand une donnée manque.
 */

const COULEURS = ["var(--c1)", "var(--c2)", "var(--c3)", "var(--c4)", "var(--c5)"];
const AVATARS = ["#ece6ff", "#fff1e6", "#fff4dc", "#ffe8ea", "#e6f6ee", "#e8f1ff", "#f3e8ff"];
const dateLongue = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Paris" });
const heureFr = new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" });
const pct = (v: number) => `${v >= 0 ? "+" : "−"}${Math.abs(v).toLocaleString("fr-FR", { maximumFractionDigits: 0 })} %`;
const partPb = (pb: number) => `${(pb / 100).toLocaleString("fr-FR", { maximumFractionDigits: 0 })} %`;

function Badge({ actuel, avant }: { actuel: number | null; avant: number | null | undefined }) {
  const v = variation(actuel, avant);
  if (v === null) return null;
  return <span className={`badge-evolution ${v >= 0 ? "hausse" : "baisse"}`}>{pct(v)}</span>;
}

function seriesHeures(a: StatsMatch, b: StatsMatch | null) {
  const toutes = [...new Set([...a.parHeure, ...(b?.parHeure ?? [])].map((h) => h.heure))].sort((x, y) => rangHeure(x) - rangHeure(y));
  if (toutes.length === 0) return { heures: [], actuel: [], avant: null };
  const de = rangHeure(toutes[0]!), fin = rangHeure(toutes.at(-1)!);
  const plage: number[] = [];
  for (let h = de; h <= fin; h++) plage.push(h % 24);
  const valeur = (s: StatsMatch, h: number) => s.parHeure.find((x) => x.heure === h)?.ca ?? 0;
  return { heures: plage.map((h) => `${h} h`), actuel: plage.map((h) => valeur(a, h)), avant: b ? plage.map((h) => valeur(b, h)) : null };
}

const court = (e: Evenement) => `${e.libelle} · ${new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", timeZone: "Europe/Paris" }).format(new Date(e.debut))}`;

/** En-tête du bilan : « Bilan de FC Rouen – Le Mans, samedi 3 octobre ». */
export function BilanDe({ d }: { d: Resultats }) {
  if (d.periode) return <p className="bilan-de">Bilan de la période : {d.evenement!.libelle}</p>;
  return (
    <p className="bilan-de">
      Bilan de <strong>{d.evenement!.libelle}</strong>, {dateLongue.format(new Date(d.evenement!.debut))}
    </p>
  );
}

export function VueEnsemble({ d, haut }: { d: Resultats; haut: React.ReactNode }) {
  const a = d.actuel!, p = d.precedent, c = d.comparaison;
  const heuresA = [...a.parHeure].sort((x, y) => rangHeure(x.heure) - rangHeure(y.heure));
  const auPrecedent = (v: string | null) => (p && v ? `${v} ${d.periode ? "à la période précédente" : "au match précédent"}` : c ? "pas de comparaison possible" : "aucun événement de comparaison");
  const tauxMarge = a.margeBrute !== null && a.caHt > 0 ? Math.round((a.margeBrute / a.caHt) * 100) : null;
  const series = seriesHeures(a, p);
  const parts = regrouperParts(a.parCategorie).map((x, i) => ({ nom: x.nom, v: x.ca, couleur: x.autres ? "var(--gris-graph)" : COULEURS[i]! }));
  const meilleurs = [...a.produits].filter((x) => x.caTtc > 0).sort((x, y) => y.caTtc - x.caTtc).slice(0, 5);
  const maxCa = meilleurs[0]?.caTtc ?? 1;
  const pic = a.chiffres?.pic;

  return (
    <>
      {haut}
      <div className="chiffres">
        <div className="chiffre-cle mis-en-avant">
          <div className="chiffre-haut">
            <span className="etiquette">Chiffre d'affaires TTC</span>
            <Badge actuel={a.caTtc} avant={p?.caTtc} />
          </div>
          <span className="valeur">{euros(a.caTtc)}</span>
          <div className="chiffre-bas">
            <span className="sous">{a.margeBrute === null ? "Marge brute : coût manquant" : `Marge brute ${euros(a.margeBrute)}${tauxMarge !== null ? ` · ${tauxMarge} %` : ""}`}</span>
            <MiniCourbe serie={heuresA.map((h) => h.ca)} clair />
          </div>
        </div>
        <div className="chiffre-cle">
          <div className="chiffre-haut">
            <span className="etiquette">Tickets</span>
            <Badge actuel={a.tickets} avant={p?.tickets} />
          </div>
          <span className="valeur">{a.tickets.toLocaleString("fr-FR")}</span>
          <div className="chiffre-bas">
            <span className="sous">{auPrecedent(p ? p.tickets.toLocaleString("fr-FR") : null)}</span>
            <MiniCourbe serie={heuresA.map((h) => h.tickets)} clair={false} />
          </div>
        </div>
        <div className="chiffre-cle">
          <div className="chiffre-haut">
            <span className="etiquette">Panier moyen</span>
            <Badge actuel={a.panierMoyen} avant={p?.panierMoyen} />
          </div>
          <span className="valeur">{a.panierMoyen === null ? "—" : euros(a.panierMoyen)}</span>
          <div className="chiffre-bas">
            <span className="sous">{auPrecedent(p?.panierMoyen ? euros(p.panierMoyen) : null)}</span>
            <MiniCourbe serie={heuresA.map((h) => (h.tickets > 0 ? h.ca / h.tickets : 0))} clair={false} />
          </div>
        </div>
        <div className="chiffre-cle">
          <div className="chiffre-haut">
            <span className="etiquette">CA par spectateur</span>
            <Badge actuel={a.caParSpectateur} avant={p?.caParSpectateur} />
          </div>
          <span className="valeur" style={a.caParSpectateur === null ? { fontSize: 17, paddingBlock: 6 } : undefined}>
            {a.caParSpectateur === null ? "Affluence manquante" : euros(a.caParSpectateur)}
          </span>
          <div className="chiffre-bas">
            <span className="sous">{a.spectateurs ? `${a.spectateurs.toLocaleString("fr-FR")} spectateurs` : <Link to="/parametres/saison">Saisir l'affluence</Link>}</span>
            {a.spectateurs ? <MiniCourbe serie={heuresA.map((h) => h.ca)} clair={false} /> : null}
          </div>
        </div>
      </div>

      <div className="ensemble-rangee">
        <Carte
          titre="Chiffre d'affaires par heure"
          description={pic ? `Le moment le plus fort (${pic.debut.replace(":", " h ")} – ${pic.fin.replace(":", " h ")}) fait ${partPb(pic.part)} de la soirée` : undefined}
          actions={
            <div className="leg-inline">
              <span>
                <i className="trait" />
                {d.periode ? "Cette période" : "Ce match"}
              </span>
              {c && (
                <span>
                  <i className="trait tirets" />
                  {d.periode ? "Période précédente" : "Match précédent"}
                </span>
              )}
            </div>
          }
        >
          <div className="graphe-defile">
            <CourbeHeures heures={series.heures} actuel={series.actuel} avant={series.avant} libelleActuel={court(d.evenement!)} libelleAvant={c ? court(c) : null} />
          </div>
        </Carte>
        <Carte titre="Ventes par catégorie" actions={<Link className="btn-rond" to="/parametres/produits" aria-label="Catégories des produits"><ArrowUpRight size={16} /></Link>}>
          {parts.length ? (
            <div className="anneau-tuiles">
              <Anneau parts={parts} centre={{ valeur: euros(a.caTtc), libelle: d.periode ? "CA TTC de la période" : "CA TTC du match" }} />
            </div>
          ) : (
            <EtatVide titre="Aucune vente" />
          )}
        </Carte>
      </div>

      <div className="ensemble-trois">
        <Carte titre="Ce qui se vend le mieux" actions={<span className="btn-lien">CA TTC</span>}>
          {meilleurs.length === 0 ? (
            <EtatVide titre="Aucune vente" />
          ) : (
            <ul className="meilleurs">
              {meilleurs.map((x, i) => (
                <li key={x.produitId}>
                  <span className="avatar" style={{ background: AVATARS[i % AVATARS.length] }}>
                    {x.nom.trim().charAt(0).toUpperCase()}
                  </span>
                  <span className="meilleur-corps">
                    <span className="meilleur-ligne">
                      <strong>{x.nom}</strong>
                      <span className="chiffre">{euros(x.caTtc)}</span>
                    </span>
                    <span className="barre">
                      <i style={{ width: `${Math.max(4, (x.caTtc / maxCa) * 100)}%` }} />
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Carte>
        <Carte titre="À surveiller" actions={d.alertes.length ? <span className="badge-points">{d.alertes.length} point{d.alertes.length > 1 ? "s" : ""}</span> : undefined}>
          {d.alertes.length === 0 ? (
            <p className="discret" style={{ margin: 0 }}>Rien à signaler sur {d.periode ? "cette période" : "ce match"}.</p>
          ) : (
            <ul className="surveiller">
              {d.alertes.slice(0, 4).map((x) => (
                <li key={x.titre} className={x.niveau === "forte" ? "forte" : "normale"}>
                  <TriangleAlert size={16} />
                  <span>
                    <strong>{x.titre}</strong>
                    <span>{x.detail}</span>
                  </span>
                </li>
              ))}
              {d.alertes.length > 4 && (
                <li className="encore">
                  <Link to="/alertes">… et {d.alertes.length - 4} autre{d.alertes.length - 4 > 1 ? "s" : ""} dans le centre d'alertes</Link>
                </li>
              )}
            </ul>
          )}
        </Carte>
        <ProchainMatch prochain={d.prochains[0] ?? null} />
      </div>

      <ChiffresSoiree d={d} />
    </>
  );
}

/** Le prochain match et ce que la prévision en attend (médiane des événements comparables). */
function ProchainMatch({ prochain }: { prochain: { id: string; libelle: string; debut: string } | null }) {
  const q = useQuery({
    queryKey: ["prevision", prochain?.id],
    queryFn: () => api.get<ReponsePrevision>(`/prevision?evenementId=${prochain!.id}`),
    enabled: !!prochain,
  });
  if (!prochain)
    return (
      <div className="carte prochain-match">
        <span className="prochain-etiquette">Prochain match</span>
        <p className="discret">Aucun événement à venir.</p>
        <Link className="btn" to="/parametres/saison">
          Préparer la saison
        </Link>
      </div>
    );
  const jours = Math.max(0, Math.round((Date.parse(prochain.debut) - Date.now()) / 86_400_000));
  const prev = q.data?.prevision ?? null;
  const parProduit = new Map<string, number>();
  for (const l of prev?.produits ?? []) parProduit.set(l.produit, (parProduit.get(l.produit) ?? 0) + l.ventes.median);
  const premier = [...parProduit].sort((x, y) => y[1] - x[1])[0];
  return (
    <div className="carte prochain-match">
      <div className="chiffre-haut">
        <span className="prochain-etiquette">Prochain match</span>
        <span className="badge-points violet">{jours === 0 ? "aujourd'hui" : jours === 1 ? "demain" : `dans ${jours} jours`}</span>
      </div>
      <h3>{prochain.libelle}</h3>
      <span className="discret">
        {dateLongue.format(new Date(prochain.debut))} · {heureFr.format(new Date(prochain.debut)).replace(":", " h ")}
      </span>
      <div className="prochain-tuiles">
        <div>
          <span>Chiffre attendu</span>
          <strong>{prev?.ca ? `≈ ${euros(Math.round(prev.ca.median / 100) * 100)}` : "—"}</strong>
        </div>
        <div>
          <span>{premier ? premier[0] : "Le plus vendu"}</span>
          <strong>{premier ? `≈ ${Math.round(premier[1]).toLocaleString("fr-FR")}` : "—"}</strong>
        </div>
      </div>
      {!prev && q.isSuccess && <p className="discret" style={{ margin: 0, fontSize: 12.5 }}>Pas encore assez d'événements terminés pour prévoir.</p>}
      <div className="prochain-actions">
        <Link className="btn" to="/stock">
          Préparer le stock
        </Link>
        <Link className="btn btn-fantome" to="/prevision">
          Voir la prévision
        </Link>
      </div>
    </div>
  );
}
