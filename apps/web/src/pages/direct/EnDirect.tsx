import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Box, CircleAlert, MessageCircleQuestion, PackagePlus, RefreshCw, X } from "lucide-react";
import { formaterMontant, regrouperParts, type EtatStand, type Evenement, type Kpi, type PlanStade, type SessionInfo, type SignalStand, type TableauDirect } from "@flaix/domain";
import { api, formaterDateHeure } from "../../api.ts";
import { Carte, Chargement, EtatVide, MessageErreur } from "../../composants/communs.tsx";
import { LIBELLE, LieuEnDirect, PUCE, TEINTE } from "../resultats/PlanStade.tsx";
import { Anneau, CourbeHeures, MiniCourbe } from "../resultats/graphiques.tsx";

const RAFRAICHISSEMENT_MS = 10_000;
const COULEURS = ["var(--c1)", "var(--c2)", "var(--c3)", "var(--c4)", "var(--c5)"];
const ORDRE_COULEUR = ["rouge", "orange", "vert", "gris"];

/** « 1 h 52 », « 18 min ». */
function duree(ms: number): string {
  const min = Math.max(0, Math.floor(ms / 60_000));
  return min < 60 ? `${min} min` : `${Math.floor(min / 60)} h ${String(min % 60).padStart(2, "0")}`;
}
/** « à l'instant », « il y a 4 min ». */
const ilYa = (iso: string, maintenant: number) => {
  const min = Math.max(0, Math.round((maintenant - Date.parse(iso)) / 60_000));
  return min < 1 ? "à l'instant" : `il y a ${duree(min * 60_000)}`;
};
const pct = (pb: number) => `${pb > 0 ? "+" : pb < 0 ? "−" : ""}${Math.round(Math.abs(pb) / 100)} %`;
const RYTHME = { calme: { libelle: "Calme", puce: "puce" }, normal: { libelle: "Normal", puce: "puce-violet" }, soutenu: { libelle: "Soutenu", puce: "puce-vert" } } as const;

/** Téléphone : le stade 3D derrière un bouton (lourd et petit sur un écran étroit). */
function useEtroit(): boolean {
  const requete = "(max-width: 760px)";
  const [etroit, setEtroit] = useState(() => typeof window !== "undefined" && window.matchMedia?.(requete).matches === true);
  useEffect(() => {
    const m = window.matchMedia?.(requete);
    if (!m) return;
    const changer = () => setEtroit(m.matches);
    m.addEventListener("change", changer);
    return () => m.removeEventListener("change", changer);
  }, []);
  return etroit;
}

/**
 * En direct (dossier §15.112, refait aux §15.166 et §15.167 d'après les maquettes de Rémi) : la soirée en cours.
 * En haut, les chiffres clés comparés au match précédent au même moment ; le lieu en 3D, chaque stand avec ses petits
 * chiffres, son détail en grand au clic ; la courbe de la soirée par quart d'heure, les ventes par catégorie, une carte
 * par stand et ce qui se vend le mieux. Mis à jour toutes les 10 secondes pendant l'événement.
 */
export function EnDirect({ session }: { session: SessionInfo }) {
  const plan = useQuery({
    queryKey: ["plan-stade"],
    queryFn: () => api.get<PlanStade>("/plan-stade"),
    refetchInterval: (q) => (q.state.data?.evenement ? RAFRAICHISSEMENT_MS : 60_000),
  });
  const tableau = useQuery({
    queryKey: ["direct"],
    queryFn: () => api.get<TableauDirect | null>("/direct"),
    refetchInterval: (q) => (q.state.data ? RAFRAICHISSEMENT_MS : 60_000),
  });
  const evenements = useQuery({ queryKey: ["evenements"], queryFn: () => api.get<Evenement[]>("/evenements") });
  const [selection, setSelection] = useState<string | null>(null);
  const [voir3d, setVoir3d] = useState(false);
  const etroit = useEtroit();
  const [maintenant, setMaintenant] = useState(() => Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setMaintenant(Date.now()), 1_000);
    return () => window.clearInterval(t);
  }, []);

  if (plan.isPending) return <Chargement />;
  if (plan.error) return <MessageErreur erreur={plan.error} />;
  const p = plan.data;
  const d = p.direct;
  const t = tableau.data ?? null;
  const prochain = evenements.data?.filter((e) => e.etat === "a_venir").sort((a, b) => Date.parse(a.debut) - Date.parse(b.debut))[0] ?? null;
  const modifiable = !session.support && !session.formation;
  const choisi = p.stands.find((s) => s.id === selection) ?? null;
  const choisir = (id: string) => {
    setSelection(id);
    if (etroit) setVoir3d(true);
    document.getElementById("lieu-en-direct")?.scrollIntoView?.({ behavior: "smooth", block: "start" });
  };
  const signaux = p.stands
    .flatMap((s) => s.signaux.map((x) => ({ stand: s, signal: x })))
    .sort((a, b) => (a.signal.couleur === b.signal.couleur ? 0 : a.signal.couleur === "rouge" ? -1 : 1));
  const aTraiter = <ATraiter signaux={signaux} evenementId={p.evenement?.id ?? null} voirStand={choisir} />;
  const panneau = choisi ? (
    <FicheStand stand={choisi} caLieu={d?.caNet ?? 0} evenementId={p.evenement?.id ?? null} maintenant={maintenant} fermer={() => setSelection(null)} />
  ) : (
    aTraiter
  );

  return (
    <div className="direct-tableau">
      <div className="direct-entete">
        <div style={{ minWidth: 0 }}>
          <div className="en-ligne" style={{ gap: 8 }}>
            {p.evenement ? (
              <span className="direct-badge">
                <span className="direct-point" /> En direct
              </span>
            ) : (
              <span className="puce">Aucun événement ouvert</span>
            )}
            {d && <span className="puce direct-depuis">ouvert depuis {duree(maintenant - Date.parse(d.ouvertLe))}</span>}
          </div>
          <h1 className="direct-titre">{p.evenement?.libelle ?? "En direct"}</h1>
        </div>
        <div className="en-ligne">
          <span className="discret" style={{ fontSize: 12.5 }}>
            Mis à jour il y a {Math.max(0, Math.round((maintenant - plan.dataUpdatedAt) / 1_000))} s
          </span>
          <button
            className="btn btn-fantome"
            aria-label="Mettre à jour"
            onClick={() => {
              void plan.refetch();
              void tableau.refetch();
            }}
          >
            <RefreshCw size={15} />
          </button>
          <Link className="btn" to="/assistant">
            <MessageCircleQuestion size={15} /> Demander à l'assistant
          </Link>
        </div>
      </div>

      {!p.evenement && (
        <Carte>
          <EtatVide titre="Aucun événement ouvert">
            {prochain ? `Prochain événement : ${prochain.libelle}, le ${formaterDateHeure(prochain.debut)}. ` : ""}
            L'événement s'ouvre dans <Link to="/caisses">Caisses</Link>. Ici, les chiffres et les couleurs s'allument à son ouverture ; en attendant, tu peux placer tes stands. Les événements terminés se comparent dans <Link to="/">Résultats</Link>.
          </EtatVide>
        </Carte>
      )}

      {d && <Chiffres t={t} d={d} />}

      <div id="lieu-en-direct" style={{ scrollMarginTop: 80 }}>
        {p.stands.length > 0 &&
          (etroit && !voir3d ? (
            <>
              <button className="btn btn-fantome direct-voir-3d" onClick={() => setVoir3d(true)}>
                <Box size={15} /> Voir le lieu en 3D
              </button>
              {choisi ? <Carte>{panneau}</Carte> : signaux.length > 0 && <Carte>{aTraiter}</Carte>}
            </>
          ) : (
            <LieuEnDirect plan={p} selection={selection} choisir={choisir} modifiable={modifiable} aside={panneau} />
          ))}
      </div>

      {t && (
        <div className="direct-deux">
          <Carte
            titre="Chiffre d'affaires de la soirée"
            description="Par quart d'heure depuis l'ouverture"
            actions={
              <div className="leg-inline">
                <span>
                  <i className="trait" />
                  Ce match
                </span>
                {t.precedent && (
                  <span>
                    <i className="trait tirets" />
                    {t.precedent}
                  </span>
                )}
              </div>
            }
          >
            <div className="graphe-defile">
              <CourbeHeures heures={t.courbe.libelles} actuel={t.courbe.actuel} avant={t.courbe.precedent} libelleActuel="Ce match" libelleAvant={t.precedent} />
            </div>
          </Carte>
          <Carte titre="Ventes par catégorie" description="Part du CA TTC">
            {t.parCategorie.length ? (
              <Anneau
                parts={regrouperParts(t.parCategorie).map((x, i) => ({ nom: x.nom, v: x.ca, couleur: x.autres ? "var(--gris-graph)" : COULEURS[i]! }))}
                centre={{ valeur: formaterMontant(t.ca.valeur ?? 0), libelle: "CA TTC du match" }}
              />
            ) : (
              <EtatVide titre="Pas encore de vente" />
            )}
          </Carte>
        </div>
      )}

      {p.evenement && p.stands.length > 0 && (
        <div className="direct-deux">
          <div>
            <h2 className="direct-section">Les stands, maintenant</h2>
            <div className="direct-stands">
              {[...p.stands]
                .sort((a, b) => ORDRE_COULEUR.indexOf(a.couleur) - ORDRE_COULEUR.indexOf(b.couleur) || a.nom.localeCompare(b.nom, "fr"))
                .map((s) => (
                  <CarteStand key={s.id} stand={s} choisi={s.id === selection} maintenant={maintenant} ouvrir={() => choisir(s.id)} />
                ))}
            </div>
          </div>
          {t && <MeilleursProduits t={t} />}
        </div>
      )}
      <p className="discret" style={{ fontSize: 12, textAlign: "center" }}>
        Les ruptures arrivent aussi en notification sur ton téléphone. Détail dans <Link to="/caisses">Caisses</Link> et <Link to="/stock">Stock</Link>.
      </p>
    </div>
  );
}

/** Les chiffres clés, au design des cartes de Résultats : valeur, écart au match précédent au même moment, petite courbe. */
function Chiffres({ t, d }: { t: TableauDirect | null; d: NonNullable<PlanStade["direct"]> }) {
  const ecart = (k: Kpi | undefined) =>
    !t?.precedent ? (
      <span className="variation neutre">pas de match précédent</span>
    ) : k?.ecartPb == null ? (
      <span className="variation neutre">pas de comparaison possible</span>
    ) : (
      <span className={`variation ${k.ecartPb >= 0 ? "hausse" : "baisse"}`}>
        {pct(k.ecartPb)} vs {t.precedent} au même moment
      </span>
    );
  const carte = (etiquette: string, valeur: ReactNode, pied: ReactNode, serie?: number[], principal = false, badge?: ReactNode) => (
    <div className={`chiffre-cle${principal ? " mis-en-avant" : ""}`}>
      <span className="etiquette direct-etiquette">
        {etiquette}
        {badge}
      </span>
      <span className="valeur">{valeur}</span>
      {pied}
      {serie && <MiniCourbe serie={serie} clair={principal} />}
    </div>
  );
  const prev = t?.prevision ?? null;
  return (
    <div className="chiffres direct-chiffres-cles">
      {carte("CA en cours", formaterMontant(t?.ca.valeur ?? d.caNet), ecart(t?.ca), t?.ca.serie, true)}
      {carte("Tickets", (t?.tickets.valeur ?? d.tickets).toLocaleString("fr-FR"), ecart(t?.tickets), t?.tickets.serie)}
      {carte("Panier moyen", t?.panier.valeur != null ? formaterMontant(t.panier.valeur) : "—", ecart(t?.panier), t?.panier.serie)}
      {carte(
        "Marge brute",
        t?.marge.valeur != null ? formaterMontant(t.marge.valeur) : "—",
        t?.marge.valeur != null ? (
          <span className="variation neutre">
            {Math.round((t.marge.tauxPb ?? 0) / 100)} % du CA HT{t.marge.produitsSansCout ? ` · ${t.marge.produitsSansCout} coût manquant` : ""}
          </span>
        ) : (
          <span className="variation neutre">
            <Link to="/parametres/produits">coût manquant : saisis-le</Link>
          </span>
        ),
      )}
      {carte(
        "Ventes par minute",
        formaterMontant(d.caParMinute),
        <span className="variation neutre">sur les 10 dernières minutes</span>,
        undefined,
        false,
        d.rythme ? <span className={`puce ${RYTHME[d.rythme].puce}`}>{RYTHME[d.rythme].libelle}</span> : undefined,
      )}
      {carte(
        "Prévision de fin de soirée",
        prev ? `≈ ${formaterMontant(prev.median)}` : "—",
        prev ? (
          <span className="variation neutre">
            {prev.avancementPb !== null ? `déjà ${Math.round(prev.avancementPb / 100)} % atteints · ` : ""}entre {formaterMontant(prev.bas)} et {formaterMontant(prev.haut)}
          </span>
        ) : (
          <span className="variation neutre">pas assez de matchs passés pour prévoir</span>
        ),
      )}
      {carte(
        "CA par spectateur",
        t?.caParSpectateur != null ? formaterMontant(t.caParSpectateur) : "—",
        t?.spectateurs ? (
          <span className="variation neutre">{t.spectateurs.toLocaleString("fr-FR")} spectateurs</span>
        ) : (
          <span className="variation neutre">
            <Link to="/parametres/saison">Saisir l'affluence</Link>
          </span>
        ),
      )}
      {carte(
        "Caisses ouvertes",
        `${d.caisses.ouvertes} / ${d.caisses.total}`,
        <span className="variation neutre">{d.caisses.sansNouvelles ? "tablette sans nouvelles depuis plus de 2 min" : "toutes les tablettes répondent"}</span>,
        undefined,
        false,
        d.caisses.sansNouvelles > 0 ? <span className="puce puce-ambre">{d.caisses.sansNouvelles} sans réseau</span> : undefined,
      )}
    </div>
  );
}

/** Le détail d'un stand en grand, à côté du lieu en 3D. */
function FicheStand({ stand: s, caLieu, evenementId, maintenant, fermer }: { stand: EtatStand; caLieu: number; evenementId: string | null; maintenant: number; fermer: () => void }) {
  const c = s.chiffres;
  const tuile = (l: string, v: ReactNode) => (
    <div>
      <span>{l}</span>
      <strong>{v}</strong>
    </div>
  );
  return (
    <div className="direct-fiche">
      <div className="direct-ligne">
        <h3>{s.nom}</h3>
        <span className="en-ligne" style={{ gap: 6 }}>
          <span className={`puce ${PUCE[s.couleur]}`}>{LIBELLE[s.couleur]}</span>
          <button className="btn btn-fantome direct-fermer" aria-label="Fermer le détail du stand" onClick={fermer}>
            <X size={14} />
          </button>
        </span>
      </div>
      <div className="direct-fiche-chiffres">
        {tuile("CA", formaterMontant(c.caNet))}
        {tuile("Tickets", c.tickets)}
        {tuile("Panier moyen", c.tickets > 0 ? formaterMontant(Math.round(c.caNet / c.tickets)) : "—")}
        {tuile("10 dernières min", `${s.recentes.tickets} tickets · ${formaterMontant(s.recentes.caNet)}`)}
        {tuile("Part du CA du lieu", caLieu > 0 ? `${Math.round((c.caNet / caLieu) * 100)} %` : "—")}
        {tuile("Dernière vente", c.derniereVente ? ilYa(c.derniereVente, maintenant) : "—")}
      </div>
      <h4>{s.signaux.length ? `Alertes (${s.signaux.length})` : "Alertes"}</h4>
      {s.signaux.length ? (
        <ul className="direct-traiter-liste">
          {s.signaux.map((x) => (
            <AlerteATraiter key={x.titre} stand={s} signal={x} evenementId={evenementId} />
          ))}
        </ul>
      ) : (
        <p className="stade-rien">Rien à signaler.</p>
      )}
      {s.produits.length > 0 && (
        <>
          <h4>Stock restant</h4>
          <Barres produits={s.produits} />
        </>
      )}
      <div className="discret direct-stand-pied">
        {c.caissesOuvertes} caisse{c.caissesOuvertes > 1 ? "s" : ""} ouverte{c.caissesOuvertes > 1 ? "s" : ""} sur {c.caisses}
      </div>
    </div>
  );
}

function Barres({ produits }: { produits: EtatStand["produits"] }) {
  return (
    <div className="direct-barres">
      {produits.map((x) => {
        const part = Math.round((x.restant / x.sur) * 100);
        const couleur = x.alerte === "rupture" ? "rouge" : x.alerte === "faible" ? "orange" : "vert";
        return (
          <div key={x.produitId} className="direct-barre">
            <div className="direct-ligne">
              <span>{x.nom}</span>
              <strong style={{ color: TEINTE[couleur] }}>{x.alerte === "rupture" ? "Rupture" : `${part} %`}</strong>
            </div>
            <div className="direct-jauge" role="meter" aria-label={`${x.nom} : ${part} % restant`} aria-valuenow={part} aria-valuemin={0} aria-valuemax={100}>
              <span style={{ width: `${Math.max(x.alerte === "rupture" ? 3 : 0, part)}%`, background: TEINTE[couleur] }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CarteStand({ stand: s, choisi, maintenant, ouvrir }: { stand: EtatStand; choisi: boolean; maintenant: number; ouvrir: () => void }) {
  const c = s.chiffres;
  return (
    <section id={`stand-${s.id}`} className={`direct-stand-carte bord-${s.couleur}${choisi ? " choisie" : ""}`}>
      <div className="direct-ligne">
        <h3>
          <button className="direct-stand-nom" onClick={ouvrir} title="Voir le détail sur le lieu">
            {s.nom}
          </button>
        </h3>
        <span className={`puce ${PUCE[s.couleur]}`}>{LIBELLE[s.couleur]}</span>
      </div>
      <div className="direct-stand-chiffres">
        <div>
          <span>CA</span>
          <strong>{formaterMontant(c.caNet)}</strong>
        </div>
        <div>
          <span>Tickets</span>
          <strong>{c.tickets}</strong>
        </div>
        <div>
          <span>10 dernières min</span>
          <strong>{s.recentes.tickets} tickets</strong>
          <small>{formaterMontant(s.recentes.caNet)}</small>
        </div>
      </div>
      {s.produits.length > 0 ? (
        <Barres produits={s.produits.slice(0, 3)} />
      ) : (
        <p className="discret" style={{ fontSize: 12.5, margin: 0 }}>
          Pas de stock suivi à ce stand : la mise en place se saisit dans <Link to="/stock">Stock</Link>.
        </p>
      )}
      <div className="discret direct-stand-pied">
        {c.caissesOuvertes} caisse{c.caissesOuvertes > 1 ? "s" : ""} ouverte{c.caissesOuvertes > 1 ? "s" : ""} sur {c.caisses} · {c.derniereVente ? `dernière vente ${ilYa(c.derniereVente, maintenant)}` : "aucune vente"}
      </div>
    </section>
  );
}

/** Ce qui se vend le mieux, comme dans Résultats : initiale, barre et CA. */
function MeilleursProduits({ t }: { t: TableauDirect }) {
  const max = t.meilleurs[0]?.caTtc || 1;
  const teintes = ["violet", "orange", "jaune", "rouge", "vert"];
  return (
    <Carte titre="Ce qui se vend le mieux">
      {t.meilleurs.length === 0 ? (
        <EtatVide titre="Pas encore de vente" />
      ) : (
        <ul className="direct-top">
          {t.meilleurs.map((x, i) => (
            <li key={x.nom}>
              <span className={`direct-initiale ${teintes[i]}`}>{x.nom.slice(0, 1).toUpperCase()}</span>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div className="direct-ligne">
                  <strong>{x.nom}</strong>
                  <strong className="chiffre">{formaterMontant(x.caTtc)}</strong>
                </div>
                <div className="direct-jauge">
                  <span style={{ width: `${(x.caTtc / max) * 100}%`, background: "var(--violet)" }} />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Carte>
  );
}

function ATraiter({ signaux, evenementId, voirStand }: { signaux: { stand: EtatStand; signal: SignalStand }[]; evenementId: string | null; voirStand: (id: string) => void }) {
  return (
    <div className="direct-traiter">
      <div className="direct-ligne">
        <h4>À traiter</h4>
        {signaux.length > 0 && <span className="puce puce-rouge">{signaux.length}</span>}
      </div>
      {signaux.length === 0 ? (
        <p className="stade-rien">Rien à traiter pour l'instant.</p>
      ) : (
        <ul className="direct-traiter-liste">
          {signaux.map(({ stand, signal }) => (
            <AlerteATraiter key={`${stand.id}:${signal.titre}`} stand={stand} signal={signal} evenementId={evenementId} voirStand={voirStand} />
          ))}
        </ul>
      )}
      <p className="discret direct-note">Touche un stand sur le lieu pour voir son détail en grand.</p>
    </div>
  );
}

function AlerteATraiter({ stand, signal, evenementId, voirStand }: { stand: EtatStand; signal: SignalStand; evenementId: string | null; voirStand?: (id: string) => void }) {
  const client = useQueryClient();
  const [ouvert, setOuvert] = useState(false);
  const [quantite, setQuantite] = useState("");
  const q = Number(quantite);
  const reassort = useMutation({
    mutationFn: () => api.post("/stock/reassort", { evenementId, standId: stand.id, produitId: signal.produitId, quantite: q }),
    onSuccess: () => {
      setOuvert(false);
      setQuantite("");
      for (const cle of ["plan-stade", "direct", "stock"]) void client.invalidateQueries({ queryKey: [cle] });
    },
  });
  return (
    <li className={`direct-a-traiter ${signal.couleur}`}>
      <div className="direct-ligne" style={{ alignItems: "flex-start", flexWrap: "nowrap" }}>
        <CircleAlert size={15} style={{ color: TEINTE[signal.couleur], flex: "none", marginTop: 2 }} />
        <div style={{ minWidth: 0, flex: 1 }}>
          <strong>{signal.titre}</strong>
          <p>
            {stand.nom} · {signal.detail}
          </p>
        </div>
      </div>
      {ouvert ? (
        <form
          className="direct-ligne"
          onSubmit={(e) => {
            e.preventDefault();
            if (Number.isInteger(q) && q > 0) reassort.mutate();
          }}
        >
          <input
            type="text"
            inputMode="numeric"
            autoFocus
            value={quantite}
            onChange={(e) => setQuantite(e.target.value.replace(/\D/g, ""))}
            placeholder="Quantité apportée"
            aria-label={`Quantité apportée au stand ${stand.nom}`}
            style={{ flex: 1, minWidth: 0 }}
          />
          <button className="btn" type="submit" disabled={!(q > 0) || reassort.isPending}>
            Valider
          </button>
          <button className="btn btn-fantome" type="button" onClick={() => setOuvert(false)}>
            Annuler
          </button>
        </form>
      ) : (
        <div className="en-ligne">
          {signal.produitId && evenementId && (
            <button className="btn btn-fantome" onClick={() => setOuvert(true)}>
              <PackagePlus size={14} /> Préparer un réassort
            </button>
          )}
          {voirStand && (
            <button className="btn btn-fantome" onClick={() => voirStand(stand.id)}>
              Voir le stand
            </button>
          )}
          {!signal.produitId && (
            <Link className="btn btn-fantome" to={signal.lien}>
              Y aller
            </Link>
          )}
        </div>
      )}
      <MessageErreur erreur={reassort.error} />
    </li>
  );
}
