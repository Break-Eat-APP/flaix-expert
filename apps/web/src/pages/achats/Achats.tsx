import { useSearchParams } from "react-router";
import { EntetePage } from "../../composants/communs.tsx";
import { useOptions } from "../../session.tsx";
import { Factures } from "../factures/Factures.tsx";
import { PrixFournisseurs } from "../stock/PrixFournisseurs.tsx";
import { Correspondances } from "./Correspondances.tsx";
import { Livraisons } from "./Livraisons.tsx";

type Onglet = "factures" | "correspondances" | "livraisons" | "fournisseurs";

/**
 * Achats (§15.172, choix de Rémi du 2026-10-23) : tout ce qui touche aux fournisseurs au même endroit — leurs factures,
 * leurs livraisons (qui entrent en réserve centrale) et la comparaison de leurs prix. Stock ne parle plus que de ce
 * que le lieu a et où il se trouve.
 */
export function Achats() {
  const options = useOptions();
  const [params, setParams] = useSearchParams();
  const onglets: [Onglet, string][] = [
    ...(options.factures
      ? ([
          ["factures", "Factures"],
          ["correspondances", "Correspondances"],
        ] as [Onglet, string][])
      : []),
    ...(options.stock
      ? ([
          ["livraisons", "Livraisons"],
          ["fournisseurs", "Prix fournisseurs"],
        ] as [Onglet, string][])
      : []),
  ];
  const demande = params.get("onglet") as Onglet | null;
  const onglet = onglets.find(([id]) => id === demande)?.[0] ?? onglets[0]?.[0] ?? null;
  return (
    <>
      <EntetePage titre="Achats" description="Les fournisseurs : leurs factures, leurs livraisons qui entrent en réserve centrale, et leurs prix comparés." />
      <div className="onglets">
        {onglets.map(([id, libelle]) => (
          <button key={id} className={`onglet${onglet === id ? " actif" : ""}`} onClick={() => setParams({ onglet: id }, { replace: true })}>
            {libelle}
          </button>
        ))}
      </div>
      {onglet === "factures" && <Factures integre />}
      {onglet === "correspondances" && <Correspondances />}
      {onglet === "livraisons" && <Livraisons />}
      {onglet === "fournisseurs" && <PrixFournisseurs />}
    </>
  );
}
