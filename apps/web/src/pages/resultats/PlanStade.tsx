import { Suspense, lazy, useState, type ReactNode } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Move, RotateCcw } from "lucide-react";
import { MODELES_LIEU, TRIBUNES, type CouleurStand, type EtatStand, type ModeleLieu, type PlanStade as Plan, type PositionPlan } from "@flaix/domain";
import { api } from "../../api.ts";
import { Carte, MessageErreur } from "../../composants/communs.tsx";
import { TITRES_PLAN } from "./modeles-plan.ts";

const Stade3D = lazy(() => import("./Stade3D.tsx").then((m) => ({ default: m.Stade3D })));

// Mêmes teintes que la 3D (Stade3D.COULEURS_STADE), recopiées pour ne pas charger three.js avec la page.
export const TEINTE: Record<CouleurStand, string> = { vert: "#0ba678", orange: "#f59f00", rouge: "#e5484d", gris: "#b8b3c7" };
export const LIBELLE: Record<CouleurStand, string> = { rouge: "Urgent", orange: "À surveiller", vert: "Tout va bien", gris: "Fermé" };
export const PUCE: Record<CouleurStand, string> = { rouge: "puce-rouge", orange: "puce-ambre", vert: "puce-vert", gris: "" };
export const ORDRE: CouleurStand[] = ["rouge", "orange", "vert", "gris"];
const nomTribune = (s: EtatStand) => TRIBUNES.find((t) => t.code === s.tribune)!.libelle;

/** Ce que le directeur prépare en mode « Placer les stands », avant d'enregistrer. */
interface Brouillon {
  modele: ModeleLieu;
  /** Stands déplacés (position) ou remis en automatique (null). */
  positions: Record<string, PositionPlan | null>;
}

/**
 * Le lieu en 3D dans En direct (dossier §15.162 à §15.166) : le décor choisi (stade, patinoire, arène, salle) et ses
 * stands en vert, orange, rouge ou gris ; un clic sur un stand le choisit (En direct fait défiler jusqu'à sa carte). À
 * côté : ce que la page y met (« À traiter »), ou le panneau « Placer les stands » (directeur : décor, glisser-déposer).
 */
export function LieuEnDirect({
  plan,
  selection,
  choisir,
  modifiable = false,
  aside,
}: {
  plan: Plan;
  selection: string | null;
  choisir: (id: string) => void;
  modifiable?: boolean;
  aside: ReactNode;
}) {
  const client = useQueryClient();
  const [brouillon, setBrouillon] = useState<Brouillon | null>(null);
  const enregistrer = useMutation({
    mutationFn: (b: Brouillon) =>
      api.put<Plan>("/plan-stade", { modele: b.modele, positions: Object.entries(b.positions).map(([standId, position]) => ({ standId, position })) }),
    onSuccess: (p) => {
      client.setQueryData(["plan-stade"], p);
      setBrouillon(null);
    },
  });

  // Le décor s'enregistre dès qu'on le choisit (§15.169) : il ne dépend plus du bouton « Enregistrer » du placement,
  // oublié en quittant la page, et la patinoire revenait au stade.
  const choisirDecor = useMutation({
    mutationFn: (m: ModeleLieu) => api.put<Plan>("/plan-stade", { modele: m, positions: [] }),
    onSuccess: (p) => client.setQueryData(["plan-stade"], p),
  });

  const modele = brouillon?.modele ?? plan.modele;
  const stands = brouillon ? plan.stands.map((s) => (s.id in brouillon.positions ? { ...s, position: brouillon.positions[s.id]! } : s)) : plan.stands;
  const compte = (c: CouleurStand) => stands.filter((s) => s.couleur === c).length;
  const placer = (positions: Record<string, PositionPlan | null>) => setBrouillon((b) => b && { ...b, positions: { ...b.positions, ...positions } });

  return (
    <Carte
      titre={TITRES_PLAN[modele]}
      description={brouillon ? "Placer les stands : attrape une buvette dans la 3D et pose-la où tu veux, puis enregistre." : "Touche un stand pour aller à sa carte."}
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
            <button type="button" className="btn btn-fantome" onClick={() => setBrouillon({ modele: plan.modele, positions: {} })}>
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
              onChoisir={choisir}
              onDeplacer={(id, p) => placer({ [id]: p })}
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
              changerModele={(m) => {
                setBrouillon({ ...brouillon, modele: m });
                choisirDecor.mutate(m);
              }}
              decorEnregistre={choisirDecor.isSuccess && !choisirDecor.isPending}
              placer={placer}
              annuler={() => {
                setBrouillon(null);
                enregistrer.reset();
              }}
              enregistrer={() => enregistrer.mutate(brouillon)}
              enCours={enregistrer.isPending}
              erreur={enregistrer.error ?? choisirDecor.error}
            />
          ) : (
            aside
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
  decorEnregistre,
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
  decorEnregistre: boolean;
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
      <p className="note" style={{ margin: "6px 0 0" }}>{decorEnregistre ? "✓ Décor enregistré : il reste le même à chaque connexion." : "Le décor choisi s'enregistre tout de suite."}</p>
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
