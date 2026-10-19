import { useEffect, useState } from "react";
import { Link } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Box, CircleAlert, MessageCircleQuestion, PackagePlus, RefreshCw } from "lucide-react";
import { formaterMontant, type EtatStand, type Evenement, type PlanStade, type SessionInfo, type SignalStand } from "@flaix/domain";
import { api, formaterDateHeure } from "../../api.ts";
import { Carte, Chargement, EtatVide, MessageErreur } from "../../composants/communs.tsx";
import { LIBELLE, LieuEnDirect, PUCE, TEINTE } from "../resultats/PlanStade.tsx";

const RAFRAICHISSEMENT_MS = 10_000;

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
 * En direct (dossier §15.112, refait au §15.166 d'après la maquette de Rémi) : la soirée en cours — chiffres et rythme,
 * le lieu en 3D, une carte par stand (ventes des 10 dernières minutes, stock restant) et « À traiter », avec le réassort
 * en deux gestes. Tout vient de GET /api/plan-stade (mêmes règles que le centre d'alertes), mis à jour toutes les
 * 10 secondes pendant l'événement. Hors événement : le lieu en gris, et le placement des stands.
 */
export function EnDirect({ session }: { session: SessionInfo }) {
  const plan = useQuery({
    queryKey: ["plan-stade"],
    queryFn: () => api.get<PlanStade>("/plan-stade"),
    refetchInterval: (q) => (q.state.data?.evenement ? RAFRAICHISSEMENT_MS : 60_000),
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
  const ouvert = evenements.data?.find((e) => e.etat === "ouvert") ?? null;
  const prochain = evenements.data?.filter((e) => e.etat === "a_venir").sort((a, b) => Date.parse(a.debut) - Date.parse(b.debut))[0] ?? null;
  const modifiable = !session.support && !session.formation;
  const choisir = (id: string) => {
    setSelection(id);
    document.getElementById(`stand-${id}`)?.scrollIntoView?.({ behavior: "smooth", block: "center" });
  };
  const signaux = p.stands
    .flatMap((s) => s.signaux.map((x) => ({ stand: s, signal: x })))
    .sort((a, b) => (a.signal.couleur === b.signal.couleur ? 0 : a.signal.couleur === "rouge" ? -1 : 1));

  const lieu = p.stands.length > 0 && (
    <LieuEnDirect
      plan={p}
      selection={selection}
      choisir={choisir}
      modifiable={modifiable}
      aside={<ATraiter signaux={signaux} evenementId={p.evenement?.id ?? null} voirStand={choisir} />}
    />
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
            {d && <span className="puce">ouvert depuis {duree(maintenant - Date.parse(d.ouvertLe))}</span>}
          </div>
          <h1 className="direct-titre">{p.evenement?.libelle ?? "En direct"}</h1>
        </div>
        <div className="en-ligne">
          <span className="discret" style={{ fontSize: 12.5 }}>
            Mis à jour il y a {Math.max(0, Math.round((maintenant - plan.dataUpdatedAt) / 1_000))} s
          </span>
          <button className="btn btn-fantome" aria-label="Mettre à jour" onClick={() => void plan.refetch()}>
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
            L'événement s'ouvre dans <Link to="/caisses">Caisses</Link>. Ici, les couleurs s'allument à son ouverture ; en attendant, tu peux placer tes stands.
          </EtatVide>
        </Carte>
      )}

      {d && (
        <div className="direct-chiffres">
          <div className="direct-chiffre principal">
            <div className="direct-chiffre-tete">
              <span>CA en cours</span>
              {d.comparaison?.ecartPb != null && <span className="direct-ecart">{pct(d.comparaison.ecartPb)}</span>}
            </div>
            <strong>{formaterMontant(d.caNet)}</strong>
            <small>{d.comparaison ? `vs ${formaterMontant(d.comparaison.caNet)} à la même minute de ${d.comparaison.libelle}` : "pas de match précédent à comparer"}</small>
          </div>
          <div className="direct-chiffre">
            <div className="direct-chiffre-tete">
              <span>Tickets</span>
            </div>
            <strong>{d.tickets.toLocaleString("fr-FR")}</strong>
            <small>
              {d.recentes.tickets} ces {d.recentes.minutes} dernières minutes
            </small>
          </div>
          <div className="direct-chiffre">
            <div className="direct-chiffre-tete">
              <span>Ventes par minute</span>
              {d.rythme && <span className={`puce ${RYTHME[d.rythme].puce}`}>{RYTHME[d.rythme].libelle}</span>}
            </div>
            <strong>{formaterMontant(d.caParMinute)}</strong>
            <small>{d.rythme ? "sur les 10 dernières minutes, comparé à la soirée" : "sur les 10 dernières minutes"}</small>
          </div>
          <div className="direct-chiffre">
            <div className="direct-chiffre-tete">
              <span>Caisses ouvertes</span>
              {d.caisses.sansNouvelles > 0 && <span className="puce puce-ambre">{d.caisses.sansNouvelles} sans réseau</span>}
            </div>
            <strong>
              {d.caisses.ouvertes} / {d.caisses.total}
            </strong>
            <small>{d.caisses.sansNouvelles ? "tablette sans nouvelles depuis plus de 2 min" : "toutes les tablettes répondent"}</small>
          </div>
        </div>
      )}

      {lieu &&
        (etroit && !voir3d ? (
          <button className="btn btn-fantome direct-voir-3d" onClick={() => setVoir3d(true)}>
            <Box size={15} /> Voir le lieu en 3D
          </button>
        ) : (
          lieu
        ))}
      {etroit && signaux.length > 0 && !voir3d && <ATraiter signaux={signaux} evenementId={p.evenement?.id ?? null} voirStand={choisir} enCarte />}

      {p.evenement && p.stands.length > 0 && (
        <>
          <h2 className="direct-section">Les stands, maintenant</h2>
          <div className="direct-stands">
            {[...p.stands]
              .sort((a, b) => ["rouge", "orange", "vert", "gris"].indexOf(a.couleur) - ["rouge", "orange", "vert", "gris"].indexOf(b.couleur) || a.nom.localeCompare(b.nom, "fr"))
              .map((s) => (
                <CarteStand key={s.id} stand={s} choisi={s.id === selection} maintenant={maintenant} />
              ))}
          </div>
        </>
      )}
      <p className="discret" style={{ fontSize: 12, textAlign: "center" }}>
        {ouvert ? "Les ruptures arrivent aussi en notification sur ton téléphone. " : ""}Détail dans <Link to="/caisses">Caisses</Link> et <Link to="/stock">Stock</Link>.
      </p>
    </div>
  );
}

function CarteStand({ stand: s, choisi, maintenant }: { stand: EtatStand; choisi: boolean; maintenant: number }) {
  const c = s.chiffres;
  return (
    <section id={`stand-${s.id}`} className={`direct-stand-carte bord-${s.couleur}${choisi ? " choisie" : ""}`}>
      <div className="direct-ligne">
        <h3>{s.nom}</h3>
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
        <div className="direct-barres">
          {s.produits.slice(0, 3).map((x) => {
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

function ATraiter({
  signaux,
  evenementId,
  voirStand,
  enCarte = false,
}: {
  signaux: { stand: EtatStand; signal: SignalStand }[];
  evenementId: string | null;
  voirStand: (id: string) => void;
  enCarte?: boolean;
}) {
  const contenu = (
    <div className="direct-traiter">
      <div className="direct-ligne">
        <h4>À traiter</h4>
        {signaux.length > 0 && <span className="puce puce-rouge">{signaux.length}</span>}
      </div>
      {signaux.length === 0 ? (
        <p className="stade-rien">Rien à traiter pour l'instant.</p>
      ) : (
        <ul>
          {signaux.map(({ stand, signal }) => (
            <AlerteATraiter key={`${stand.id}:${signal.titre}`} stand={stand} signal={signal} evenementId={evenementId} voirStand={voirStand} />
          ))}
        </ul>
      )}
    </div>
  );
  return enCarte ? <Carte>{contenu}</Carte> : contenu;
}

function AlerteATraiter({ stand, signal, evenementId, voirStand }: { stand: EtatStand; signal: SignalStand; evenementId: string | null; voirStand: (id: string) => void }) {
  const client = useQueryClient();
  const [ouvert, setOuvert] = useState(false);
  const [quantite, setQuantite] = useState("");
  const q = Number(quantite);
  const reassort = useMutation({
    mutationFn: () => api.post("/stock/reassort", { evenementId, standId: stand.id, produitId: signal.produitId, quantite: q }),
    onSuccess: () => {
      setOuvert(false);
      setQuantite("");
      void client.invalidateQueries({ queryKey: ["plan-stade"] });
      void client.invalidateQueries({ queryKey: ["stock"] });
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
          <button className="btn btn-fantome" onClick={() => voirStand(stand.id)}>
            Voir le stand
          </button>
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
