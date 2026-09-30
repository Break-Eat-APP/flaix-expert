import { useState } from "react";
import { Link } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Lock, ShieldCheck } from "lucide-react";
import { formaterMontant, libelleTauxTva, type ClotureVue, type EtatClotures, type PeriodeACloturer } from "@flaix/domain";
import { api, formaterDateHeure } from "../../api.ts";
import { Carte, Chargement, EtatVide, MessageErreur } from "../../composants/communs.tsx";

const NIVEAU = { match: "Z du match", mois: "Mois", exercice: "Exercice" } as const;
const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];

/**
 * Clôtures → Mois & année (dossier §15.107) : clôtures mensuelle et annuelle, grand total de la
 * période et total perpétuel du lieu, chaîne des clôtures scellées.
 */
export function Periodes() {
  const client = useQueryClient();
  const etat = useQuery({ queryKey: ["periodes"], queryFn: () => api.get<EtatClotures>("/clotures/periodes"), refetchOnMount: "always" });
  const [confirmer, setConfirmer] = useState<string | null>(null);
  const [verification, setVerification] = useState<{ ok: boolean; maillons: number; rupture: { sequence: number; raison: string } | null } | null>(null);
  const cloturer = useMutation({
    mutationFn: (x: { niveau: "mois" | "exercice"; cle: string }) =>
      x.niveau === "mois" ? api.post<EtatClotures>("/clotures/mois", { mois: x.cle }) : api.post<EtatClotures>("/clotures/exercice", { premierMois: x.cle }),
    onSuccess: (e) => {
      client.setQueryData(["periodes"], e);
      setConfirmer(null);
      setVerification(null);
    },
  });
  const verifier = useMutation({ mutationFn: () => api.post<NonNullable<typeof verification>>("/clotures/verification"), onSuccess: setVerification });

  if (etat.isPending) return <Chargement />;
  if (etat.error) return <MessageErreur erreur={etat.error} />;
  const e = etat.data!;
  const dernierMois = e.mois.find((m) => m.cloture);

  const ligne = (p: PeriodeACloturer, niveau: "mois" | "exercice") => {
    const clos = p.matchs.filter((m) => m.etat === "clos").length;
    return (
      <div key={p.cle} className="caisse">
        <div style={{ minWidth: 150 }}>
          <strong>{p.libelle}</strong>
          <div className="discret" style={{ fontSize: 12 }}>
            {p.matchs.length ? `${clos} / ${p.matchs.length} match${p.matchs.length > 1 ? "s" : ""} clos` : "aucun match"}
          </div>
        </div>
        <span className="chiffre" style={{ fontSize: 13 }}>
          {p.cloture ? "Grand total " : "À ce jour "}
          <strong>{formaterMontant(p.totalTtc)}</strong>
        </span>
        {p.etat === "clos" ? (
          <span className="puce puce-violet">Clôturé</span>
        ) : p.etat === "cloturable" ? (
          <span className="puce puce-vert">Prêt à clôturer</span>
        ) : (
          <span className="discret" style={{ fontSize: 12 }}>{p.raison}</span>
        )}
        <div className="actions">
          {p.cloture ? (
            <span className="discret" style={{ fontSize: 12 }}>
              le {formaterDateHeure(p.cloture.le)} par {p.cloture.par} · perpétuel {formaterMontant(p.cloture.perpetuelApres)}
            </span>
          ) : p.etat === "cloturable" ? (
            confirmer === `${niveau}:${p.cle}` ? (
              <>
                <span className="discret" style={{ fontSize: 12 }}>Définitif.</span>
                <button className="btn btn-danger" disabled={cloturer.isPending} onClick={() => cloturer.mutate({ niveau, cle: p.cle })}>
                  Confirmer
                </button>
                <button className="btn btn-fantome" onClick={() => setConfirmer(null)}>
                  Retour
                </button>
              </>
            ) : (
              <button className="btn" onClick={() => setConfirmer(`${niveau}:${p.cle}`)}>
                <Lock size={14} /> Clôturer {niveau === "mois" ? "le mois" : "l'exercice"}
              </button>
            )
          ) : null}
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="kpis">
        <div className="kpi">
          <div className="kpi-libelle">Total perpétuel du lieu</div>
          <div className="kpi-valeur">{formaterMontant(e.perpetuel)}</div>
          <div className="aide">depuis la mise en service, jamais remis à zéro</div>
        </div>
        <div className="kpi">
          <div className="kpi-libelle">Dernier mois clôturé</div>
          <div className="kpi-valeur" style={{ fontSize: 18 }}>{dernierMois ? dernierMois.libelle : "—"}</div>
        </div>
        <div className="kpi">
          <div className="kpi-libelle">Exercice comptable</div>
          <div className="kpi-valeur" style={{ fontSize: 18, color: e.moisDebutExercice === null ? "var(--amber)" : undefined }}>
            {e.moisDebutExercice === null ? "à régler" : `à partir de ${MOIS[e.moisDebutExercice - 1]}`}
          </div>
          <div className="aide">
            <Link to="/parametres/lieu">réglage du lieu</Link>
          </div>
        </div>
      </div>
      <MessageErreur erreur={cloturer.error} />

      <Carte titre="Mois" description="Un mois se clôture une fois terminé, tous ses matchs clos, et après le mois précédent.">
        {e.mois.every((m) => m.matchs.length === 0) ? (
          <EtatVide titre="Aucun match pour l'instant" />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>{e.mois.filter((m) => m.matchs.length > 0 || !m.cloture).map((m) => ligne(m, "mois"))}</div>
        )}
      </Carte>

      <Carte titre="Exercices" description="Un exercice se clôture une fois terminé et tous ses mois clôturés.">
        {e.moisDebutExercice === null ? (
          <div className="message message-alerte" style={{ margin: 0 }}>
            Premier mois de l'exercice comptable pas encore réglé : il se règle dans <Link to="/parametres/lieu">Paramètres → Le lieu</Link>, avec l'expert-comptable du lieu. Les mois se clôturent en attendant.
          </div>
        ) : e.exercices.length === 0 ? <EtatVide titre="Aucun exercice avec des matchs" /> : <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>{e.exercices.map((x) => ligne(x, "exercice"))}</div>}
      </Carte>

      <Carte
        titre="Clôtures scellées"
        description="Chaque Z de match, mois et exercice, chaîné au précédent. Aucune ne se modifie ni ne se supprime."
        actions={
          <button className="btn btn-fantome" disabled={verifier.isPending} onClick={() => verifier.mutate()}>
            <ShieldCheck size={15} /> Vérifier l'intégrité
          </button>
        }
      >
        {verification &&
          (verification.ok ? (
            <div className="message message-ok" style={{ marginTop: 0 }}>
              Chaîne intacte : {verification.maillons} clôture{verification.maillons > 1 ? "s" : ""} vérifiée{verification.maillons > 1 ? "s" : ""}.
            </div>
          ) : (
            <div className="message message-erreur" style={{ marginTop: 0 }}>
              Rupture au maillon n° {verification.rupture!.sequence} : {verification.rupture!.raison}.
            </div>
          ))}
        <MessageErreur erreur={verifier.error} />
        {e.historique.length === 0 ? (
          <EtatVide titre="Aucune clôture pour l'instant">Le premier Z est créé à la clôture du premier match.</EtatVide>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {e.historique.map((h) => (
              <Historique key={h.id} h={h} />
            ))}
          </div>
        )}
      </Carte>
    </>
  );
}

function Historique({ h }: { h: ClotureVue }) {
  return (
    <details className="inventaire">
      <summary>
        <span className={`puce ${h.niveau === "match" ? "" : "puce-violet"}`} style={{ marginRight: 8 }}>
          {NIVEAU[h.niveau]}
        </span>
        <strong>{h.libelle}</strong> · {formaterMontant(h.totalTtc)} · perpétuel {formaterMontant(h.perpetuelApres)}
        <span className="discret" style={{ fontSize: 12 }}> · n° {h.sequence}, le {formaterDateHeure(h.le)}</span>
      </summary>
      <div className="grille-champs" style={{ marginTop: 10 }}>
        <div>
          <div className="bilan-ligne"><span>Tickets</span><span className="chiffre">{h.tickets}</span></div>
          <div className="bilan-ligne"><span>Annulations</span><span className="chiffre">{h.annulations}</span></div>
          <div className="bilan-ligne"><span>Espèces</span><span className="chiffre">{formaterMontant(h.especes)}</span></div>
          <div className="bilan-ligne"><span>Carte</span><span className="chiffre">{formaterMontant(h.carte)}</span></div>
          <div className="bilan-ligne fort"><span>Grand total</span><span className="chiffre">{formaterMontant(h.totalTtc)}</span></div>
          <div className="bilan-ligne"><span>Perpétuel avant → après</span><span className="chiffre">{formaterMontant(h.perpetuelAvant)} → {formaterMontant(h.perpetuelApres)}</span></div>
        </div>
        <div>
          {h.ventilation.map((v) => (
            <div key={v.tauxTva} className="bilan-ligne">
              <span>TVA {libelleTauxTva(v.tauxTva)}</span>
              <span className="chiffre">{formaterMontant(v.tva)} sur {formaterMontant(v.ht)} HT</span>
            </div>
          ))}
          {h.parCaisse.map((k) => (
            <div key={k.caisseId} className="bilan-ligne">
              <span>Caisse {k.numero}</span>
              <span className="chiffre">{formaterMontant(k.total)} · perpétuel {formaterMontant(k.perpetuel)}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="empreinte" style={{ marginTop: 6 }}>Empreinte {h.empreinte}</div>
    </details>
  );
}
