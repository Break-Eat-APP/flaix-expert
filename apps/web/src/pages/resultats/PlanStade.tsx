import { Suspense, lazy, useState } from "react";
import { Link } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ChevronRight, CircleAlert, CircleCheck, Move, RotateCcw } from "lucide-react";
import { MODELES_LIEU, TRIBUNES, formaterMontant, type CouleurStand, type EtatStand, type ModeleLieu, type PlanStade as Plan, type PositionPlan } from "@flaix/domain";
import { api } from "../../api.ts";
import { Carte, MessageErreur } from "../../composants/communs.tsx";
import { TITRES_PLAN } from "./modeles-plan.ts";

const Stade3D = lazy(() => import("./Stade3D.tsx").then((m) => ({ default: m.Stade3D })));

// Mêmes teintes que la 3D (Stade3D.COULEURS_STADE), recopiées pour ne pas charger three.js avec la page.
const TEINTE: Record<CouleurStand, string> = { vert: "#0ba678", orange: "#f59f00", rouge: "#e5484d", gris: "#b8b3c7" };
const LIBELLE: Record<CouleurStand, string> = { rouge: "Urgent", orange: "À surveiller", vert: "Tout va bien", gris: "Fermé" };
const PUCE: Record<CouleurStand, string> = { rouge: "puce-rouge", orange: "puce-ambre", vert: "puce-vert", gris: "" };
const ORDRE: CouleurStand[] = ["rouge", "orange", "vert", "gris"];
const heure = new Intl.DateTimeFormat("fr-FR", { timeStyle: "medium", timeZone: "Europe/Paris" });
const nomTribune = (s: EtatStand) => TRIBUNES.find((t) => t.code === s.tribune)!.libelle;
/** « à l'instant », « il y a 4 min », « il y a 1 h 05 ». */
function ilYa(iso: string): string {
  const min = Math.max(0, Math.round((Date.now() - Date.parse(iso)) / 60_000));
  return min < 1 ? "à l'instant" : min < 60 ? `il y a ${min} min` : `il y a ${Math.floor(min / 60)} h ${String(min % 60).padStart(2, "0")}`;
}

/** Ce que le directeur prépare en mode « Placer les stands », avant d'enregistrer. */
interface Brouillon {
  modele: ModeleLieu;
  /** Stands déplacés (position) ou remis en automatique (null). */
  positions: Record<string, PositionPlan | null>;
}

/**
 * Le lieu en direct (dossier §15.162 à §15.164) : les stands autour du lieu en 3D (stade, patinoire, arène, salle), en
 * vert, orange ou rouge ; un clic sur un stand (dans la 3D ou la liste) affiche ses alertes. Mis à jour toutes les
 * 20 secondes pendant l'événement. Le directeur choisit le décor et pose les stands à la main (« Placer les stands »).
 */
export function PlanStade({ modifiable = false }: { modifiable?: boolean }) {
  const client = useQueryClient();
  const plan = useQuery({
    queryKey: ["plan-stade"],
    queryFn: () => api.get<Plan>("/plan-stade"),
    refetchInterval: (q) => (q.state.data?.evenement ? 20_000 : 60_000),
  });
  const [selection, setSelection] = useState<string | null>(null);
  const [brouillon, setBrouillon] = useState<Brouillon | null>(null);
  const enregistrer = useMutation({
    mutationFn: (b: Brouillon) =>
      api.put<Plan>("/plan-stade", { modele: b.modele, positions: Object.entries(b.positions).map(([standId, position]) => ({ standId, position })) }),
    onSuccess: (p) => {
      client.setQueryData(["plan-stade"], p);
      setBrouillon(null);
    },
  });

  if (plan.error) return <MessageErreur erreur={plan.error} />;
  if (!plan.data || plan.data.stands.length === 0) return null;
  const donnees = plan.data;
  const modele = brouillon?.modele ?? donnees.modele;
  const stands = brouillon ? donnees.stands.map((s) => (s.id in brouillon.positions ? { ...s, position: brouillon.positions[s.id]! } : s)) : donnees.stands;
  const choisi = stands.find((s) => s.id === selection) ?? null;
  const compte = (c: CouleurStand) => stands.filter((s) => s.couleur === c).length;
  const placer = (positions: Record<string, PositionPlan | null>) => setBrouillon((b) => b && { ...b, positions: { ...b.positions, ...positions } });

  return (
    <Carte
      titre={TITRES_PLAN[modele]}
      description={
        brouillon
          ? "Placer les stands : attrape une buvette dans la 3D et pose-la où tu veux, puis enregistre."
          : donnees.evenement
            ? `${donnees.evenement.libelle} · mis à jour à ${heure.format(plan.dataUpdatedAt)}`
            : "Aucun événement ouvert : les couleurs s'allument à l'ouverture de l'événement."
      }
      actions={
        <>
          <div className="stade-legende" aria-label="Légende">
            {ORDRE.map((c) => (
              <span key={c}>
                <span className="stade-point" style={{ background: TEINTE[c] }} /> {LIBELLE[c]} <strong>{compte(c)}</strong>
              </span>
            ))}
          </div>
          {modifiable && !brouillon && (
            <button type="button" className="btn btn-fantome" onClick={() => setBrouillon({ modele: donnees.modele, positions: {} })}>
              <Move size={15} /> Placer les stands
            </button>
          )}
        </>
      }
    >
      <div className="stade">
        <div className="stade-scene">
          <Suspense fallback={<div className="stade-3d stade-chargement">Construction du lieu…</div>}>
            <Stade3D
              modele={modele}
              stands={stands}
              selection={selection}
              edition={brouillon !== null}
              onChoisir={setSelection}
              onDeplacer={(id, p) => {
                placer({ [id]: p });
                setSelection(id);
              }}
            />
          </Suspense>
          <span className="stade-aide">
            {brouillon ? "Attrape une buvette (souris ou doigt) et pose-la · glisse ailleurs pour tourner" : "Glisse pour tourner · molette ou pince pour zoomer · touche un stand"}
          </span>
        </div>
        <aside className="stade-panneau">
          {brouillon ? (
            <PanneauPlacement
              brouillon={brouillon}
              stands={stands}
              choisi={selection}
              changerModele={(m) => setBrouillon({ ...brouillon, modele: m })}
              placer={placer}
              annuler={() => {
                setBrouillon(null);
                enregistrer.reset();
              }}
              enregistrer={() => enregistrer.mutate(brouillon)}
              enCours={enregistrer.isPending}
              erreur={enregistrer.error}
            />
          ) : choisi ? (
            <FicheStand stand={choisi} retour={() => setSelection(null)} />
          ) : (
            <ListeStands stands={stands} choisir={setSelection} />
          )}
        </aside>
      </div>
    </Carte>
  );
}

function PanneauPlacement({
  brouillon,
  stands,
  choisi,
  changerModele,
  placer,
  annuler,
  enregistrer,
  enCours,
  erreur,
}: {
  brouillon: Brouillon;
  stands: readonly EtatStand[];
  choisi: string | null;
  changerModele: (m: ModeleLieu) => void;
  placer: (p: Record<string, PositionPlan | null>) => void;
  annuler: () => void;
  enregistrer: () => void;
  enCours: boolean;
  erreur: unknown;
}) {
  const aLaMain = stands.filter((s) => s.position !== null);
  return (
    <div className="stade-placement">
      <h4>Type de lieu</h4>
      <div className="stade-modeles" role="radiogroup" aria-label="Type de lieu">
        {MODELES_LIEU.map((m) => (
          <button
            key={m.code}
            type="button"
            role="radio"
            aria-checked={brouillon.modele === m.code}
            className={brouillon.modele === m.code ? "actif" : ""}
            onClick={() => changerModele(m.code)}
          >
            <strong>{m.libelle}</strong>
            <span>{m.detail}</span>
          </button>
        ))}
      </div>
      <h4>Place des stands</h4>
      <p className="note" style={{ margin: "0 0 8px" }}>
        Les stands que tu ne déplaces pas sont placés tout seuls, sur leur tribune (Stands & caisses).
      </p>
      <ul className="stade-places">
        {[...stands]
          .sort((a, b) => a.nom.localeCompare(b.nom, "fr"))
          .map((s) => (
            <li key={s.id} className={s.id === choisi ? "choisi" : ""}>
              <span style={{ minWidth: 0, flex: 1 }}>
                <strong>{s.nom}</strong>
                <span className="discret">{s.position ? "Posé à la main" : `Automatique · ${nomTribune(s)}`}</span>
              </span>
              {s.position && (
                <button type="button" className="btn btn-fantome" aria-label={`Remettre ${s.nom} en automatique`} title="Remettre en automatique" onClick={() => placer({ [s.id]: null })}>
                  <RotateCcw size={14} />
                </button>
              )}
            </li>
          ))}
      </ul>
      {aLaMain.length > 1 && (
        <button type="button" className="btn btn-fantome" style={{ marginTop: 8 }} onClick={() => placer(Object.fromEntries(aLaMain.map((s) => [s.id, null])))}>
          <RotateCcw size={14} /> Tout en automatique
        </button>
      )}
      <MessageErreur erreur={erreur} />
      <div className="stade-placement-actions">
        <button type="button" className="btn btn-fantome" onClick={annuler} disabled={enCours}>
          Annuler
        </button>
        <button type="button" className="btn" onClick={enregistrer} disabled={enCours}>
          Enregistrer
        </button>
      </div>
    </div>
  );
}

function ListeStands({ stands, choisir }: { stands: readonly EtatStand[]; choisir: (id: string) => void }) {
  const tries = [...stands].sort((a, b) => ORDRE.indexOf(a.couleur) - ORDRE.indexOf(b.couleur) || a.nom.localeCompare(b.nom, "fr"));
  return (
    <ul className="stade-liste">
      {tries.map((s) => (
        <li key={s.id}>
          <button type="button" onClick={() => choisir(s.id)}>
            <span className="stade-point" style={{ background: TEINTE[s.couleur] }} />
            <span style={{ minWidth: 0, flex: 1 }}>
              <strong>{s.nom}</strong>
              <span className="discret">{s.resume}</span>
            </span>
            <ChevronRight size={16} className="discret" />
          </button>
        </li>
      ))}
    </ul>
  );
}

function FicheStand({ stand: s, retour }: { stand: EtatStand; retour: () => void }) {
  const c = s.chiffres;
  return (
    <div className="stade-fiche">
      <button type="button" className="btn btn-fantome stade-retour" onClick={retour}>
        <ArrowLeft size={14} /> Tous les stands
      </button>
      <div className="stade-fiche-titre">
        <h3>{s.nom}</h3>
        <span className={`puce ${PUCE[s.couleur]}`}>{LIBELLE[s.couleur]}</span>
      </div>
      <div className="discret" style={{ fontSize: 12.5 }}>
        {s.position ? "Posé à la main sur le plan" : nomTribune(s)}
        {!s.position && !s.tribuneChoisie && (
          <>
            {" "}
            · placée d'après le nom (<Link to="/parametres/stands">à changer dans Stands & caisses</Link>)
          </>
        )}
      </div>
      <div className="stade-chiffres">
        <div>
          <span>CA TTC</span>
          <strong>{formaterMontant(c.caNet)}</strong>
        </div>
        <div>
          <span>Tickets</span>
          <strong>{c.tickets}</strong>
        </div>
        <div>
          <span>Caisses ouvertes</span>
          <strong>
            {c.caissesOuvertes} / {c.caisses}
          </strong>
        </div>
        <div>
          <span>Dernière vente</span>
          <strong>{c.derniereVente ? ilYa(c.derniereVente) : "—"}</strong>
        </div>
      </div>
      <h4>{s.signaux.length ? `Alertes du stand (${s.signaux.length})` : "Alertes du stand"}</h4>
      {s.signaux.length === 0 ? (
        <p className="stade-rien">
          <CircleCheck size={16} /> Rien à signaler.
        </p>
      ) : (
        <ul className="stade-signaux">
          {s.signaux.map((x) => (
            <li key={x.titre} className={x.couleur}>
              <CircleAlert size={16} style={{ color: TEINTE[x.couleur], flex: "none", marginTop: 2 }} />
              <div style={{ minWidth: 0 }}>
                <strong>{x.titre}</strong>
                <p>{x.detail}</p>
                <Link to={x.lien}>Y aller</Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
