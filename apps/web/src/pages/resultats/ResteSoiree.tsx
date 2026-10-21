import type { ReactNode } from "react";
import { Link } from "react-router";
import type { FinancesSoiree } from "@flaix/domain";
import { euros } from "./graphiques.tsx";

/** Libellés courts des lignes de la cascade, pour la phrase « encaissé − TVA − marchandise … = reste ». */
const COURT: [RegExp, string][] = [
  [/^TVA/, "TVA"],
  [/^Coût matière/, "marchandise"],
  [/^Conditionnement/, "emballages"],
  [/^Écarts de stock/, "pertes de stock"],
  [/^Personnel/, "personnel"],
  [/^Dépenses de la soirée/, "frais de la soirée"],
  [/^Part des frais du mois/, "part des frais du mois"],
];
const court = (libelle: string) => COURT.find(([r]) => r.test(libelle))?.[1] ?? libelle.toLowerCase();

/**
 * « Ce qu'il te reste » en clair (§15.170) : la phrase (« Cette soirée t'a laissé 1 240 € »), le calcul en une ligne,
 * et ce qui manque pour le calculer, avec le lien où le compléter. Sert en tête de Résultats et dans En direct.
 */
export function ResteSoiree({ f, enDirect = false, periode = false, action }: { f: FinancesSoiree; enDirect?: boolean; periode?: boolean; action?: ReactNode }) {
  const m = f.margeNette;
  const part = m !== null && f.caHt > 0 ? `${((m / f.caHt) * 100).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} % du CA HT` : null;
  const phrase =
    m === null
      ? "Pas encore calculable"
      : m < 0
        ? `${enDirect ? "Pour l'instant, la soirée te coûte" : periode ? "La période t'a coûté" : "Cette soirée t'a coûté"} ${euros(-m)}`
        : `${enDirect ? "En ce moment, il te reste" : periode ? "La période t'a laissé" : "Cette soirée t'a laissé"} ${euros(m)}`;
  const retraits = f.cascade.filter((l) => l.sorte === "retire" && l.montant !== null && l.montant !== 0);
  const manques: ReactNode[] = [];
  if (f.produitsSansCout.length > 0) {
    const noms = f.produitsSansCout.slice(0, 3).join(", ") + (f.produitsSansCout.length > 3 ? ` et ${f.produitsSansCout.length - 3} autre${f.produitsSansCout.length > 4 ? "s" : ""}` : "");
    manques.push(
      <>
        coût d'achat de {noms} : <Link to="/parametres/produits">Produits & prix</Link>
      </>,
    );
  }
  if (f.personnel.reel === null && f.personnel.tauxManquants > 0)
    manques.push(
      <>
        taux horaire de {f.personnel.tauxManquants} personne{f.personnel.tauxManquants > 1 ? "s" : ""} : <Link to="/equipe">Équipe</Link>
      </>,
    );
  const sansFrais = f.totalDepenses === 0 && f.totalFraisMois === 0;

  return (
    <div className={`carte reste-bref${m !== null && m < 0 ? " perte" : ""}`}>
      <div>
        <span className="etiquette">{enDirect ? "Ce qu'il te reste, en direct" : periode ? "Ce qu'il te reste sur la période" : "Ce qu'il te reste de la soirée"}</span>
        <span className="montant">{phrase}</span>
        {m !== null && (
          <span className="reste-calcul">
            <span>{euros(f.encaisseTtc)} encaissés</span>
            {retraits.map((l) => (
              <span key={l.libelle}>
                {" "}
                − {euros(l.montant!)} {court(l.libelle)}
              </span>
            ))}{" "}
            <span>
              = <strong>{euros(m)}</strong>
            </span>
            {part ? ` · ${part}` : ""} · avant impôt
          </span>
        )}
        {manques.length > 0 && (
          <span className="reste-manque">
            Pour le calculer, il manque :{" "}
            {manques.map((x, i) => (
              <span key={i}>
                {i > 0 ? " ; " : ""}
                {x}
              </span>
            ))}
            .
          </span>
        )}
        {m !== null && sansFrais && (
          <span className="reste-manque">
            Aucun frais saisi (commission du club, carte bancaire, loyer…) : ce reste est trop beau. <Link to="/parametres/frais">Renseigner Mes frais</Link>.
          </span>
        )}
        {f.fraisAVerifier > 0 && (
          <span className="discret">
            <Link to="/parametres/frais">
              {f.fraisAVerifier} frais à vérifier
            </Link>
          </span>
        )}
      </div>
      {action}
    </div>
  );
}
