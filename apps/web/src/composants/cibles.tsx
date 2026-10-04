import { formaterPourcentage, type EtatCible } from "@flaix/domain";

/**
 * État d'une marge par rapport à sa cible (module 5 ; dossier §15.132) : « tenue » ou « sous la cible »,
 * avec l'écart en points. Sans cible ou sans coût, rien n'est jugé.
 */
export function EtatCibleMarge({ etat }: { etat: EtatCible }) {
  if (etat.statut === "sans_cible") return <span className="discret">aucune</span>;
  if (etat.statut === "inconnu") return <span className="discret">{formaterPourcentage(etat.ciblePb!)} · coût manquant</span>;
  const points = (Math.abs(etat.ecartPb!) / 100).toLocaleString("fr-FR", { maximumFractionDigits: 1 });
  return (
    <span className={`etat-cible ${etat.statut}`} title={`Cible ${formaterPourcentage(etat.ciblePb!)}, réalisé ${formaterPourcentage(etat.tauxPb!)}`}>
      {etat.statut === "tenue" ? "tenue" : "sous la cible"} · {etat.statut === "tenue" ? "+" : "−"}
      {points} pt
    </span>
  );
}
