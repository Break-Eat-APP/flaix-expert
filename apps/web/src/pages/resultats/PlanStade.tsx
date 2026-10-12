import { Suspense, lazy, useState } from "react";
import { Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ChevronRight, CircleAlert, CircleCheck } from "lucide-react";
import { TRIBUNES, formaterMontant, type CouleurStand, type EtatStand, type PlanStade as Plan } from "@flaix/domain";
import { api } from "../../api.ts";
import { Carte, MessageErreur } from "../../composants/communs.tsx";

const Stade3D = lazy(() => import("./Stade3D.tsx").then((m) => ({ default: m.Stade3D })));

// Mêmes teintes que la 3D (Stade3D.COULEURS_STADE), recopiées pour ne pas charger three.js avec la page.
const TEINTE: Record<CouleurStand, string> = { vert: "#0ba678", orange: "#f59f00", rouge: "#e5484d", gris: "#b8b3c7" };
const LIBELLE: Record<CouleurStand, string> = { rouge: "Urgent", orange: "À surveiller", vert: "Tout va bien", gris: "Fermé" };
const PUCE: Record<CouleurStand, string> = { rouge: "puce-rouge", orange: "puce-ambre", vert: "puce-vert", gris: "" };
const ORDRE: CouleurStand[] = ["rouge", "orange", "vert", "gris"];
const heure = new Intl.DateTimeFormat("fr-FR", { timeStyle: "medium", timeZone: "Europe/Paris" });
const nomTribune = (s: EtatStand) => TRIBUNES.find((t) => t.code === s.tribune)!.libelle;

/**
 * Le stade en direct (dossier §15.162) : les stands autour d'un stade en 3D, en vert, orange ou rouge ; un clic sur un
 * stand (dans la 3D ou la liste) affiche ses alertes. Mis à jour toutes les 20 secondes pendant l'événement.
 */
export function PlanStade() {
  const plan = useQuery({
    queryKey: ["plan-stade"],
    queryFn: () => api.get<Plan>("/plan-stade"),
    refetchInterval: (q) => (q.state.data?.evenement ? 20_000 : 60_000),
  });
  const [selection, setSelection] = useState<string | null>(null);

  if (plan.error) return <MessageErreur erreur={plan.error} />;
  if (!plan.data || plan.data.stands.length === 0) return null;
  const { stands, evenement } = plan.data;
  const choisi = stands.find((s) => s.id === selection) ?? null;
  const compte = (c: CouleurStand) => stands.filter((s) => s.couleur === c).length;

  return (
    <Carte
      titre="Le stade en direct"
      description={
        evenement
          ? `${evenement.libelle} · mis à jour à ${heure.format(plan.dataUpdatedAt)}`
          : "Aucun événement ouvert : les couleurs s'allument à l'ouverture de l'événement."
      }
      actions={
        <div className="stade-legende" aria-label="Légende">
          {ORDRE.map((c) => (
            <span key={c}>
              <span className="stade-point" style={{ background: TEINTE[c] }} /> {LIBELLE[c]} <strong>{compte(c)}</strong>
            </span>
          ))}
        </div>
      }
    >
      <div className="stade">
        <div className="stade-scene">
          <Suspense fallback={<div className="stade-3d stade-chargement">Construction du stade…</div>}>
            <Stade3D stands={stands} selection={selection} onChoisir={setSelection} />
          </Suspense>
          <span className="stade-aide">Glisse pour tourner · molette ou pince pour zoomer · touche un stand</span>
        </div>
        <aside className="stade-panneau">{choisi ? <FicheStand stand={choisi} retour={() => setSelection(null)} /> : <ListeStands stands={stands} choisir={setSelection} />}</aside>
      </div>
    </Carte>
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
        {nomTribune(s)}
        {!s.tribuneChoisie && (
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
          <span>File d'attente</span>
          <strong>{c.filePct === null ? "—" : `${c.filePct} %`}</strong>
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
