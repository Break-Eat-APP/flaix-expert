import { useEffect, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CircleCheck, Download, TriangleAlert } from "lucide-react";
import { TAUX_TVA, formaterMontant, libelleTauxTva, pieceDuZ, type ApercuExport, type PlanComptes } from "@flaix/domain";
import { api, formaterDateHeure, telechargerFichier } from "../../api.ts";
import { Carte, Chargement, EtatVide, MessageErreur } from "../../composants/communs.tsx";

const dateCourte = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`;

/**
 * Clôtures → Export comptable (dossier §15.110) : le journal des ventes du mois et le récapitulatif
 * par événement, à envoyer à l'expert-comptable. Bâti sur les Z d'événement scellés.
 */
export function ExportComptable() {
  const [mois, setMois] = useState<string | null>(null);
  const apercu = useQuery({
    queryKey: ["export-comptable", mois],
    queryFn: () => api.get<ApercuExport>(`/export-comptable${mois ? `?mois=${mois}` : ""}`),
    refetchOnMount: "always",
  });
  const [telecharge, setTelecharge] = useState<string | null>(null);
  const telecharger = useMutation({
    mutationFn: (fichier: "ecritures" | "recapitulatif") => telechargerFichier("/export-comptable/fichier", { mois: apercu.data!.cle, fichier }),
    onSuccess: setTelecharge,
  });

  if (apercu.isPending) return <Chargement />;
  if (apercu.error) return <MessageErreur erreur={apercu.error} />;
  const a = apercu.data!;
  const somme = (f: (z: ApercuExport["zs"][number]) => number) => a.zs.reduce((s, z) => s + f(z), 0);
  const tva = (z: ApercuExport["zs"][number], pb: number) => z.ventilation.find((v) => v.tauxTva === pb);

  return (
    <>
      <Carte
        titre="Export pour l'expert-comptable"
        description="Les ventes du mois, événement par événement, à partir des Z scellés : un fichier d'écritures à importer et un récapitulatif lisible."
        actions={
          a.moisDisponibles.length > 0 && (
            <select
              value={a.cle ?? ""}
              onChange={(e) => {
                setMois(e.target.value);
                setTelecharge(null);
              }}
              aria-label="Mois à exporter"
            >
              {a.moisDisponibles.map((m) => (
                <option key={m.cle} value={m.cle}>
                  {m.libelle} — {m.zs} événement{m.zs > 1 ? "s" : ""}
                  {m.clos ? " · clôturé" : ""}
                </option>
              ))}
            </select>
          )
        }
      >
        {a.cle === null ? (
          <EtatVide titre="Rien à exporter pour l'instant">L'export se remplit à la clôture du premier événement (son Z).</EtatVide>
        ) : (
          <>
            {a.clos ? (
              <div className="message message-ok" style={{ marginTop: 0 }}>
                {a.libelle} est clôturé : l'export est définitif.
              </div>
            ) : (
              <div className="message message-alerte" style={{ marginTop: 0 }}>
                {a.libelle} n'est pas encore clôturé : l'export est <strong>provisoire</strong> (le nom des fichiers le dit). Clôture le mois dans « Mois & année » pour
                l'export définitif.
              </div>
            )}
            {a.horsExport.length > 0 && (
              <div className="message message-alerte">
                Pas dans l'export, faute de Z : {a.horsExport.map((h) => `${h.libelle} (${formaterDateHeure(h.debut)}, ${h.etat === "ouvert" ? "ouvert" : "à venir"})`).join(" · ")}.
              </div>
            )}

            <div className="scroll-x">
              <table className="tableau">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Événement</th>
                    <th>Z</th>
                    <th className="d">CA TTC</th>
                    {a.taux.map((pb) => (
                      <th key={pb} className="d">
                        HT / TVA {libelleTauxTva(pb)}
                      </th>
                    ))}
                    <th className="d">Espèces</th>
                    <th className="d">Carte</th>
                    <th className="d">Écart de caisse</th>
                  </tr>
                </thead>
                <tbody>
                  {a.zs.map((z) => (
                    <tr key={z.sequence}>
                      <td className="chiffre">{dateCourte(z.date)}</td>
                      <td>{z.libelle}</td>
                      <td className="chiffre">{pieceDuZ(z)}</td>
                      <td className="d chiffre">{formaterMontant(z.totalTtc)}</td>
                      {a.taux.map((pb) => (
                        <td key={pb} className="d chiffre">
                          {formaterMontant(tva(z, pb)?.ht ?? 0)} / {formaterMontant(tva(z, pb)?.tva ?? 0)}
                        </td>
                      ))}
                      <td className="d chiffre">{formaterMontant(z.especes)}</td>
                      <td className="d chiffre">{formaterMontant(z.carte)}</td>
                      <td className="d chiffre">{z.ecartTiroirs + z.ecartCoffre === 0 ? "—" : formaterMontant(z.ecartTiroirs + z.ecartCoffre)}</td>
                    </tr>
                  ))}
                  <tr style={{ fontWeight: 700 }}>
                    <td colSpan={3}>Total {a.libelle}</td>
                    <td className="d chiffre">{formaterMontant(somme((z) => z.totalTtc))}</td>
                    {a.taux.map((pb) => (
                      <td key={pb} className="d chiffre">
                        {formaterMontant(somme((z) => tva(z, pb)?.ht ?? 0))} / {formaterMontant(somme((z) => tva(z, pb)?.tva ?? 0))}
                      </td>
                    ))}
                    <td className="d chiffre">{formaterMontant(somme((z) => z.especes))}</td>
                    <td className="d chiffre">{formaterMontant(somme((z) => z.carte))}</td>
                    <td className="d chiffre">{formaterMontant(somme((z) => z.ecartTiroirs + z.ecartCoffre))}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {a.journal.desequilibres.length === 0 ? (
              <p style={{ display: "flex", gap: 6, alignItems: "center", margin: "12px 0" }}>
                <CircleCheck size={16} style={{ color: "var(--green)" }} /> Journal des ventes : {a.journal.lignes} lignes, débit = crédit = {formaterMontant(a.journal.totalDebit)}.
              </p>
            ) : (
              <div className="message message-erreur">
                <TriangleAlert size={15} /> Écritures déséquilibrées ({a.journal.desequilibres.join(", ")}) : l'export est bloqué. Signale-le à FlaiX Expert.
              </div>
            )}
            <div className="actions" style={{ justifyContent: "flex-start", flexWrap: "wrap" }}>
              <button className="btn" disabled={telecharger.isPending || a.journal.desequilibres.length > 0} onClick={() => telecharger.mutate("ecritures")}>
                <Download size={15} /> Écritures comptables (CSV)
              </button>
              <button className="btn btn-fantome" disabled={telecharger.isPending} onClick={() => telecharger.mutate("recapitulatif")}>
                <Download size={15} /> Récapitulatif par événement (CSV)
              </button>
            </div>
            {telecharge && <div className="message message-ok">Téléchargé : {telecharge}. À joindre à un e-mail pour ton expert-comptable.</div>}
            <MessageErreur erreur={telecharger.error} />
          </>
        )}
      </Carte>

      <PlanDeComptes />
    </>
  );
}

const CHAMPS: { cle: keyof Omit<PlanComptes, "ventes" | "tva">; libelle: string }[] = [
  { cle: "journal", libelle: "Code du journal des ventes" },
  { cle: "caisseEspeces", libelle: "Caisse (espèces)" },
  { cle: "cartesAEncaisser", libelle: "Cartes bancaires à encaisser" },
  { cle: "ecartManquant", libelle: "Écart de caisse — manquant" },
  { cle: "ecartExcedent", libelle: "Écart de caisse — excédent" },
];

function PlanDeComptes() {
  const client = useQueryClient();
  const plan = useQuery({ queryKey: ["plan-comptes"], queryFn: () => api.get<{ plan: PlanComptes; personnalise: boolean }>("/lieu/plan-comptes") });
  const [saisie, setSaisie] = useState<PlanComptes | null>(null);
  useEffect(() => {
    if (plan.data) setSaisie(plan.data.plan);
  }, [plan.data]);
  const enregistrer = useMutation({
    mutationFn: (p: PlanComptes | null) => api.put<{ plan: PlanComptes; personnalise: boolean }>("/lieu/plan-comptes", { plan: p }),
    onSuccess: (r) => {
      client.setQueryData(["plan-comptes"], r);
      void client.invalidateQueries({ queryKey: ["export-comptable"] });
    },
  });
  if (plan.isPending || !saisie) return <Chargement />;
  if (plan.error) return <MessageErreur erreur={plan.error} />;
  const modifie = JSON.stringify(saisie) !== JSON.stringify(plan.data!.plan);
  const envoyer = (e: FormEvent) => {
    e.preventDefault();
    enregistrer.mutate(saisie);
  };
  const champ = (libelle: string, valeur: string, changer: (v: string) => void) => (
    <label className="champ" key={libelle}>
      <span>{libelle}</span>
      <input type="text" value={valeur} onChange={(e) => changer(e.target.value.toUpperCase())} maxLength={20} spellCheck={false} />
    </label>
  );

  return (
    <Carte
      titre="Comptes utilisés dans les écritures"
      description={
        plan.data!.personnalise
          ? "Réglés pour ce lieu."
          : "Valeurs proposées par défaut : à faire valider par ton expert-comptable, qui peut te donner les siennes."
      }
    >
      <form onSubmit={envoyer}>
        <div className="grille-champs">
          {CHAMPS.map((c) => champ(c.libelle, saisie[c.cle], (v) => setSaisie({ ...saisie, [c.cle]: v })))}
          {TAUX_TVA.map((t) => champ(`Ventes TVA ${t.libelle}`, saisie.ventes[t.pb], (v) => setSaisie({ ...saisie, ventes: { ...saisie.ventes, [t.pb]: v } })))}
          {TAUX_TVA.map((t) => champ(`TVA collectée ${t.libelle}`, saisie.tva[t.pb], (v) => setSaisie({ ...saisie, tva: { ...saisie.tva, [t.pb]: v } })))}
        </div>
        <div className="actions" style={{ justifyContent: "flex-start", marginTop: 14 }}>
          <button className="btn" type="submit" disabled={!modifie || enregistrer.isPending}>
            Enregistrer
          </button>
          {plan.data!.personnalise && (
            <button className="btn btn-fantome" type="button" disabled={enregistrer.isPending} onClick={() => enregistrer.mutate(null)}>
              Revenir aux valeurs proposées
            </button>
          )}
        </div>
        <MessageErreur erreur={enregistrer.error} />
      </form>
    </Carte>
  );
}
