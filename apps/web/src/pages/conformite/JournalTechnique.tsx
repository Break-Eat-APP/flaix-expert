import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ShieldCheck } from "lucide-react";
import type { EntreeJournalTechnique } from "@flaix/domain";
import { api, formaterDateHeure } from "../../api.ts";
import { Carte, Chargement, EntetePage, EtatVide, MessageErreur, Regles } from "../../composants/communs.tsx";

interface Verification {
  ok: boolean;
  maillons: number;
  numerotationContinue: boolean;
  rupture?: { index: number; raison: string };
}

const PAGE = 50;
const COLONNES = "70px 150px minmax(160px, 1.2fr) 140px minmax(200px, 2fr) 110px";

function valeur(v: unknown): string {
  if (v === null || v === undefined || v === "") return "vide";
  if (typeof v === "boolean") return v ? "oui" : "non";
  if (Array.isArray(v)) return v.length ? v.join(", ") : "aucun";
  return String(v);
}

/** Résumé lisible du contenu d'un événement — le détail complet reste scellé tel quel en base. */
function resume(e: EntreeJournalTechnique): string {
  const d = e.details as Record<string, unknown>;
  const modifications = d.modifications as Record<string, { avant: unknown; apres: unknown }> | undefined;
  const sujet = (d.produit ?? d.stand ?? d.categorie ?? (d.numero ? `Caisse ${d.numero}` : undefined)) as string | undefined;
  if (modifications) {
    const liste = Object.entries(modifications).map(([k, m]) => `${k} : ${valeur(m.avant)} → ${valeur(m.apres)}`);
    return [sujet, liste.join(" ; ")].filter(Boolean).join(" — ");
  }
  switch (e.type) {
    case "tarif_cree":
      return `${d.produit} : ${d.prix} TTC, TVA ${d.tva}, dès le ${formaterDateHeure(String(d.valideDu))}`;
    case "produit_stands_modifies":
      return `${d.produit} — ajouté : ${valeur(d.ajoutes)} ; retiré : ${valeur(d.retires)}`;
    case "caisse_creee":
      return `Caisse ${d.numero} sur « ${d.stand} »${d.especesAutorisees ? ", espèces acceptées" : ", carte uniquement"}`;
    case "verification_integrite":
      return d.ok ? `Chaîne intacte (${d.maillons} événements)` : `Rupture détectée`;
    case "acces_refuse":
      return `Rôle ${d.role} — ${d.methode} ${d.route}`;
    default:
      return (d.nom as string) ?? sujet ?? "";
  }
}

export function JournalTechnique() {
  const client = useQueryClient();
  const journal = useInfiniteQuery({
    queryKey: ["journal-technique"],
    queryFn: ({ pageParam }) => api.get<EntreeJournalTechnique[]>(`/journal-technique?limite=${PAGE}${pageParam ? `&avant=${pageParam}` : ""}`),
    initialPageParam: 0,
    getNextPageParam: (derniere) => (derniere.length === PAGE ? derniere[derniere.length - 1]!.numero : undefined),
  });
  const verifier = useMutation({
    mutationFn: () => api.post<Verification>("/journal-technique/verification"),
    onSuccess: () => client.invalidateQueries({ queryKey: ["journal-technique"] }),
  });

  const entrees = journal.data?.pages.flat() ?? [];
  const v = verifier.data;

  return (
    <>
      <EntetePage
        fil="Conformité & Lexique"
        titre="Journal technique"
        description="Tout ce qui s'est passé sur ce lieu : connexions, créations, modifications, changements de prix. Rien ne s'y efface."
        actions={
          <button className="btn" onClick={() => verifier.mutate()} disabled={verifier.isPending}>
            <ShieldCheck size={16} /> {verifier.isPending ? "Vérification…" : "Vérifier l'intégrité"}
          </button>
        }
      />
      <MessageErreur erreur={verifier.error} />
      {v &&
        (v.ok && v.numerotationContinue ? (
          <div className="message message-ok">Chaîne intacte : {v.maillons} événements relus un par un, numérotation continue, aucune modification détectée.</div>
        ) : (
          <div className="message message-erreur">
            Anomalie détectée{v.rupture ? ` à l'événement n° ${v.rupture.index + 1} (${v.rupture.raison === "chainage_rompu" ? "chaînage rompu" : "contenu modifié"})` : ""}
            {!v.numerotationContinue ? " — numérotation discontinue" : ""}. Préviens l'éditeur.
          </div>
        ))}

      <Carte>
        {journal.isPending ? (
          <Chargement />
        ) : journal.error ? (
          <MessageErreur erreur={journal.error} />
        ) : entrees.length === 0 ? (
          <EtatVide titre="Journal vide" />
        ) : (
          <div className="liste">
            <div className="liste-entete" style={{ gridTemplateColumns: COLONNES }}>
              <span>N°</span>
              <span>Date et heure</span>
              <span>Événement</span>
              <span>Par</span>
              <span>Détail</span>
              <span>Empreinte</span>
            </div>
            {entrees.map((e) => (
              <div key={e.numero} className="liste-ligne" style={{ gridTemplateColumns: COLONNES }}>
                <span className="chiffre">{e.numero}</span>
                <span className="chiffre">{formaterDateHeure(e.horodatage)}</span>
                <strong>{e.libelle}</strong>
                <span>{e.auteur ?? <span className="discret">Break Eat (éditeur)</span>}</span>
                <span style={{ fontSize: 12.5 }}>{resume(e)}</span>
                <span className="empreinte" title={e.empreinte}>
                  {e.empreinte.slice(0, 10)}…
                </span>
              </div>
            ))}
          </div>
        )}
        {journal.hasNextPage && (
          <div className="ligne-actions">
            <button className="btn btn-fantome" onClick={() => journal.fetchNextPage()} disabled={journal.isFetchingNextPage}>
              Voir les événements plus anciens
            </button>
          </div>
        )}
      </Carte>

      <Regles>
        <ul>
          <li>Chaque événement reçoit un numéro qui suit le précédent, sans trou, et une <strong>empreinte</strong> : un code calculé (SHA-256) à partir de son contenu et de l'empreinte de l'événement précédent. Les événements forment ainsi une chaîne.</li>
          <li>Si un événement était modifié, supprimé ou déplacé après coup, son empreinte ne correspondrait plus et la chaîne serait rompue à partir de lui : « Vérifier l'intégrité » relit toute la chaîne et indique l'événement exact.</li>
          <li>La base de données elle-même refuse toute modification ou suppression dans ce journal, y compris pour l'éditeur du logiciel.</li>
          <li>Chaque vérification d'intégrité est elle-même inscrite au journal.</li>
          <li>C'est le « journal des événements techniques » exigé des logiciels de caisse (BOFiP, conditions d'inaltérabilité et de sécurisation).</li>
        </ul>
      </Regles>
    </>
  );
}
