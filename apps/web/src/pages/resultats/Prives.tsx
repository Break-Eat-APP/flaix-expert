import { Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { dansPeriode, type Periode, type ResumePrive } from "@flaix/domain";
import { api, formaterDateHeure } from "../../api.ts";
import { Carte, Chargement, EtatVide, MessageErreur } from "../../composants/communs.tsx";
import { euros } from "./graphiques.tsx";

const pctPb = (pb: number | null) => (pb === null ? "—" : `${(pb / 100).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`);

/**
 * Événements privés dans Résultats (§15.171) : budget utilisé (en % et ce qu'il en reste), marchandise au coût d'achat,
 * frais, et ce qu'il te reste de chaque événement ; sur la période choisie, sinon tous.
 */
export function VuePrives({ periode }: { periode?: Periode }) {
  const q = useQuery({ queryKey: ["evenements-prives"], queryFn: () => api.get<ResumePrive[]>("/evenements-prives") });
  if (q.isPending) return <Chargement />;
  if (q.error) return <MessageErreur erreur={q.error} />;
  const liste = q.data.filter((e) => !periode || dansPeriode(e.debut, periode));
  if (liste.length === 0)
    return (
      <Carte>
        <EtatVide titre={periode ? "Aucun événement privé sur la période" : "Aucun événement privé"}>
          Ils se créent dans <Link to="/prives">Événements privés</Link>.
        </EtatVide>
      </Carte>
    );
  const somme = (f: (e: ResumePrive) => number | null) => (liste.every((e) => f(e) !== null) ? liste.reduce((s, e) => s + f(e)!, 0) : null);
  const total = { ttc: somme((e) => e.totalTtc), marchandise: somme((e) => e.coutMarchandise), frais: somme((e) => e.frais), reste: somme((e) => e.reste) };
  return (
    <Carte
      titre="Événements privés"
      description="Le budget se consomme au prix de vente (TTC) ; la marchandise est comptée au coût d'achat. Ce qu'il te reste = CA HT − marchandise − frais."
    >
      <div className="scroll-x">
        <table className="tableau">
          <thead>
            <tr>
              <th>Événement</th>
              <th className="d">Budget</th>
              <th className="d">Consommé TTC</th>
              <th className="d">Budget utilisé</th>
              <th className="d">Reste du budget</th>
              <th className="d">Marchandise</th>
              <th className="d">Frais</th>
              <th className="d">Ce qu'il te reste</th>
            </tr>
          </thead>
          <tbody>
            {liste.map((e) => (
              <tr key={e.id}>
                <td>
                  <Link to={`/prives/${e.id}`}>{e.nom}</Link>
                  <div className="discret" style={{ fontSize: 12 }}>
                    {formaterDateHeure(e.debut)}
                    {e.etat === "prevu" ? " · en cours" : ""}
                  </div>
                </td>
                <td className="d chiffre">{e.budget === null ? "—" : euros(e.budget)}</td>
                <td className="d chiffre">{euros(e.totalTtc)}</td>
                <td className="d chiffre">
                  <span className={`budget-${e.niveauBudget}`}>{pctPb(e.budgetPb)}</span>
                </td>
                <td className="d chiffre">{e.budget === null ? "—" : euros(e.budget - e.totalTtc)}</td>
                <td className="d chiffre">{e.coutMarchandise === null ? <span className="cout-manquant">coût manquant</span> : euros(e.coutMarchandise)}</td>
                <td className="d chiffre">{euros(e.frais)}</td>
                <td className="d chiffre">{e.reste === null ? "—" : <strong>{euros(e.reste)}</strong>}</td>
              </tr>
            ))}
            <tr>
              <td>
                <strong>Total</strong>
              </td>
              <td />
              <td className="d chiffre">
                <strong>{total.ttc === null ? "—" : euros(total.ttc)}</strong>
              </td>
              <td />
              <td />
              <td className="d chiffre">{total.marchandise === null ? "—" : euros(total.marchandise)}</td>
              <td className="d chiffre">{total.frais === null ? "—" : euros(total.frais)}</td>
              <td className="d chiffre">
                <strong>{total.reste === null ? "—" : euros(total.reste)}</strong>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </Carte>
  );
}
