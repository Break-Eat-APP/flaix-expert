import { Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { TriangleAlert } from "lucide-react";
import type { Evenement } from "@flaix/domain";
import { api } from "../api.ts";

export interface Preparation {
  stockSuivi: boolean;
  standsSansMiseEnPlace: { id: string; nom: string }[];
}

const jourParis = (d: string | Date) => new Date(d).toLocaleDateString("fr-CA", { timeZone: "Europe/Paris" });

/**
 * Rappel du matin même (§15.187), dans En direct avant l'ouverture : l'événement peut s'ouvrir tout seul avec la première
 * caisse d'une caissière ; la mise en place serait alors figée. Rien n'est affiché si tout est prêt ou si ce n'est pas le jour.
 */
export function RappelMiseEnPlace({ evenement }: { evenement: Evenement }) {
  const leJour = evenement.etat === "a_venir" && jourParis(evenement.debut) === jourParis(new Date());
  const q = useQuery({ queryKey: ["preparation", evenement.id], queryFn: () => api.get<Preparation>(`/evenements/${evenement.id}/preparation`), enabled: leJour });
  const sans = q.data?.standsSansMiseEnPlace ?? [];
  if (!leJour || sans.length === 0) return null;
  return (
    <div className="message message-alerte confirmer-ouverture" role="status">
      <TriangleAlert size={16} style={{ verticalAlign: "-3px", marginRight: 6, color: "var(--amber)" }} />
      <strong>
        Mise en place à faire avant l'ouverture : {sans.length} stand{sans.length > 1 ? "s" : ""}
      </strong>{" "}
      ({sans.map((s) => s.nom).join(", ")}). La première caisse d'une caissière ouvrira l'événement et figera la mise en place.{" "}
      <Link to={`/stock?onglet=mep&evenement=${evenement.id}`}>Faire la mise en place</Link>
    </div>
  );
}

/**
 * Confirmation d'ouverture d'un événement, avec garde-fou (§15.187) : si des stands n'ont pas de mise en place, on le
 * dit avant d'ouvrir (la mise en place est figée à l'ouverture) et on propose « Faire la mise en place » ou « Ouvrir quand
 * même ». Rien n'est bloqué ; si la vérification échoue, la confirmation habituelle reste là.
 */
export function ConfirmerOuverture({ evenement, ouvrir, enCours, annuler }: { evenement: Evenement; ouvrir: () => void; enCours: boolean; annuler: () => void }) {
  const q = useQuery({ queryKey: ["preparation", evenement.id], queryFn: () => api.get<Preparation>(`/evenements/${evenement.id}/preparation`), staleTime: 0 });
  const sans = q.data?.standsSansMiseEnPlace ?? [];

  if (q.isPending) return <p className="aide confirmer-ouverture">Vérification de la mise en place des stands…</p>;
  if (sans.length > 0) {
    const n = sans.length;
    return (
      <div className="message message-alerte confirmer-ouverture" role="alert">
        <p style={{ margin: 0 }}>
          <TriangleAlert size={16} style={{ verticalAlign: "-3px", marginRight: 6, color: "var(--amber)" }} />
          <strong>
            Mise en place non faite pour {n} stand{n > 1 ? "s" : ""}
          </strong>{" "}
          : {sans.map((s) => s.nom).join(", ")}.
        </p>
        <p style={{ margin: "6px 0 0" }}>Une fois l'événement ouvert, la mise en place est figée : tu pourras seulement ajouter du réassort.</p>
        <div className="actions">
          <Link className="btn" to={`/stock?onglet=mep&evenement=${evenement.id}`}>
            Faire la mise en place
          </Link>
          <button className="btn btn-fantome" disabled={enCours} onClick={ouvrir}>
            Ouvrir quand même
          </button>
          <button className="btn btn-fantome" onClick={annuler}>
            Annuler
          </button>
        </div>
      </div>
    );
  }
  return (
    <div className="message message-info confirmer-ouverture">
      <p style={{ margin: 0 }}>
        Ouvrir <strong>{evenement.libelle}</strong> maintenant ? {q.data?.stockSuivi ? "La mise en place est faite à chaque stand ; elle sera figée, ensuite on passe par le réassort." : "L'ouverture est définitive."}
      </p>
      <div className="actions">
        <button className="btn" disabled={enCours} onClick={ouvrir}>
          Confirmer l'ouverture
        </button>
        <button className="btn btn-fantome" onClick={annuler}>
          Annuler
        </button>
      </div>
    </div>
  );
}
