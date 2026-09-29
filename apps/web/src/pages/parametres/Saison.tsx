import { useState, type FormEvent } from "react";
import { Link } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import type { Evenement } from "@flaix/domain";
import { api, formaterDateHeure } from "../../api.ts";
import { Carte, Chargement, EntetePage, EtatVide, MessageErreur, Regles } from "../../composants/communs.tsx";

const ETAT: Record<Evenement["etat"], { libelle: string; puce: string }> = {
  a_venir: { libelle: "À venir", puce: "puce" },
  ouvert: { libelle: "Ouvert", puce: "puce puce-vert" },
  clos: { libelle: "Clos", puce: "puce puce-violet" },
};

/** Valeur pour un champ datetime-local, à l'heure locale du poste. */
function versChampLocal(iso: string): string {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

/**
 * Saison (ex-« Calendrier des matchs ») : on y prépare les matchs. Depuis le 2026-09-29
 * (dossier §15.96), l'ouverture du match se fait dans Caisses et sa clôture dans Clôtures.
 */
export function Saison() {
  const client = useQueryClient();
  const evenements = useQuery({ queryKey: ["evenements"], queryFn: () => api.get<Evenement[]>("/evenements") });
  const maj = (l: Evenement[]) => {
    client.setQueryData(["evenements"], l);
    client.invalidateQueries({ queryKey: ["tableau-caisses"] });
  };
  const [libelle, setLibelle] = useState("");
  const [debut, setDebut] = useState("");
  const [spectateurs, setSpectateurs] = useState("");
  const creer = useMutation({
    mutationFn: (corps: unknown) => api.post<Evenement[]>("/evenements", corps),
    onSuccess: (l) => {
      maj(l);
      setLibelle("");
      setDebut("");
      setSpectateurs("");
    },
  });
  if (evenements.isPending) return <Chargement />;
  if (evenements.error) return <MessageErreur erreur={evenements.error} />;
  const liste = evenements.data!;
  const spectateursNombre = spectateurs.trim() === "" ? null : Number(spectateurs.replace(/\s/g, ""));
  const spectateursValide = spectateursNombre === null || (Number.isInteger(spectateursNombre) && spectateursNombre >= 0);

  function soumettre(e: FormEvent) {
    e.preventDefault();
    if (!libelle.trim() || !debut || !spectateursValide) return;
    creer.mutate({ libelle, debut: new Date(debut).toISOString(), spectateurs: spectateursNombre });
  }

  return (
    <>
      <EntetePage
        fil="Paramètres"
        filLien="/parametres"
        titre="Saison"
        description="Le calendrier des matchs du lieu : c'est à chaque match que se rattachent les ventes, le stock et le personnel de la soirée."
      />
      <Carte titre="Ajouter un match" description="Tu peux préparer les matchs de la saison à l'avance.">
        <form onSubmit={soumettre}>
          <div className="grille-champs">
            <label className="champ">
              <span>Libellé *</span>
              <input type="text" value={libelle} onChange={(e) => setLibelle(e.target.value)} placeholder="Ex. Spartiates – Adversaire" maxLength={120} required />
            </label>
            <label className="champ">
              <span>Date et heure *</span>
              <input type="datetime-local" value={debut} onChange={(e) => setDebut(e.target.value)} required />
            </label>
            <label className="champ">
              <span>Spectateurs</span>
              <input type="text" inputMode="numeric" value={spectateurs} onChange={(e) => setSpectateurs(e.target.value)} placeholder="Facultatif, à compléter après le match" aria-invalid={!spectateursValide} />
            </label>
          </div>
          <MessageErreur erreur={creer.error} />
          <div className="ligne-actions">
            <button className="btn" disabled={creer.isPending || !libelle.trim() || !debut || !spectateursValide}>
              <Plus size={16} /> Ajouter le match
            </button>
          </div>
        </form>
      </Carte>

      <Carte titre="Matchs">
        {liste.length === 0 ? (
          <EtatVide titre="Aucun match pour l'instant" />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {liste.map((e) => (
              <LigneMatch key={e.id} evenement={e} maj={maj} />
            ))}
          </div>
        )}
      </Carte>

      <Regles>
        <ul>
          <li><strong>Un match suit toujours le même chemin</strong> : à venir → ouvert (le jour du match, depuis <strong>Caisses</strong>) → clos (depuis <strong>Clôtures</strong>). Il ne revient jamais en arrière.</li>
          <li><strong>Un seul match ouvert à la fois</strong> : chaque ticket sait ainsi, sans ambiguïté, à quel match il appartient.</li>
          <li>Les caisses ne s'ouvrent que pendant un match ouvert. Un match ne se clôt qu'une fois toutes ses caisses clôturées ; sa clôture est définitive.</li>
          <li>Le libellé et la date se modifient tant que le match est à venir. Le <strong>nombre de spectateurs</strong> peut être complété à tout moment (il sert au CA par spectateur, il n'est pas une donnée fiscale).</li>
          <li>Chaque création, ouverture, clôture et modification est inscrite au journal technique, avec son auteur et l'heure.</li>
        </ul>
      </Regles>
    </>
  );
}

function LigneMatch({ evenement: e, maj }: { evenement: Evenement; maj: (l: Evenement[]) => void }) {
  const [edition, setEdition] = useState(false);
  const [libelle, setLibelle] = useState(e.libelle);
  const [debut, setDebut] = useState(versChampLocal(e.debut));
  const [spectateurs, setSpectateurs] = useState(e.spectateurs?.toString() ?? "");
  const modifier = useMutation({
    mutationFn: (corps: unknown) => api.patch<Evenement[]>(`/evenements/${e.id}`, corps),
    onSuccess: (l) => {
      maj(l);
      setEdition(false);
    },
  });
  const nb = spectateurs.trim() === "" ? null : Number(spectateurs.replace(/\s/g, ""));

  return (
    <div className="caisse" style={{ alignItems: "flex-start" }}>
      {edition ? (
        <form
          className="en-ligne"
          style={{ alignItems: "flex-end", flex: 1 }}
          onSubmit={(ev) => {
            ev.preventDefault();
            modifier.mutate(e.etat === "a_venir" ? { libelle, debut: new Date(debut).toISOString(), spectateurs: nb } : { spectateurs: nb });
          }}
        >
          {e.etat === "a_venir" && (
            <>
              <label className="champ" style={{ flex: "1 1 220px" }}>
                <span>Libellé</span>
                <input type="text" value={libelle} onChange={(ev) => setLibelle(ev.target.value)} maxLength={120} />
              </label>
              <label className="champ">
                <span>Date et heure</span>
                <input type="datetime-local" value={debut} onChange={(ev) => setDebut(ev.target.value)} />
              </label>
            </>
          )}
          <label className="champ" style={{ width: 160 }}>
            <span>Spectateurs</span>
            <input type="text" inputMode="numeric" value={spectateurs} onChange={(ev) => setSpectateurs(ev.target.value)} />
          </label>
          <button className="btn" disabled={modifier.isPending || (nb !== null && (!Number.isInteger(nb) || nb < 0))}>Enregistrer</button>
          <button type="button" className="btn btn-fantome" onClick={() => setEdition(false)}>Annuler</button>
          <MessageErreur erreur={modifier.error} />
        </form>
      ) : (
        <>
          <div style={{ flex: 1 }}>
            <strong>{e.libelle}</strong>
            <div className="discret" style={{ fontSize: 12.5 }}>
              {formaterDateHeure(e.debut)} · {e.spectateurs !== null ? `${e.spectateurs.toLocaleString("fr-FR")} spectateurs` : "spectateurs non saisis"}
              {e.etat === "ouvert" && ` · ${e.caissesOuvertes} caisse(s) ouverte(s)`}
              {e.closLe && ` · clos le ${formaterDateHeure(e.closLe)}`}
            </div>
          </div>
          <span className={ETAT[e.etat].puce}>{ETAT[e.etat].libelle}</span>
          <div className="actions">
            <button className="btn btn-fantome" onClick={() => setEdition(true)}>
              Modifier
            </button>
            {e.etat === "a_venir" && (
              <Link className="btn btn-fantome" to="/caisses" title="Le match s'ouvre le jour J depuis Caisses">
                S'ouvre depuis Caisses
              </Link>
            )}
            {e.etat === "ouvert" && (
              <>
                <Link className="btn btn-fantome" to={`/caisses?match=${e.id}`}>
                  Caisses
                </Link>
                <Link className="btn btn-fantome" to="/clotures">
                  Clôturer
                </Link>
              </>
            )}
            {e.etat === "clos" && (
              <Link className="btn btn-fantome" to={`/caisses?match=${e.id}&vue=tickets`}>
                Voir les tickets
              </Link>
            )}
          </div>
        </>
      )}
    </div>
  );
}
