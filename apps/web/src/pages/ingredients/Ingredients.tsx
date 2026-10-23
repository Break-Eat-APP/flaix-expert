import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Evenement } from "@flaix/domain";
import { api } from "../../api.ts";
import { Chargement, EntetePage, MessageErreur } from "../../composants/communs.tsx";
import { StockIngredients } from "../stock/StockIngredients.tsx";

/**
 * Ingrédients (§15.172, choix de Rémi du 2026-10-23) : le stock des ingrédients suivis (fûts, matières), à part du stock
 * des produits pour que Stock reste simple. Réserve, mise en place et comptage au litre, au kilo ou à la pièce ; le
 * consommé vient des recettes des produits vendus.
 */
export function Ingredients() {
  const evenements = useQuery({ queryKey: ["evenements"], queryFn: () => api.get<Evenement[]>("/evenements") });
  const [evenementId, setEvenementId] = useState<string | null>(null);
  return (
    <>
      <EntetePage titre="Ingrédients" description="Fûts et matières suivis au litre, au kilo ou à la pièce : déduits par les recettes des produits vendus." />
      {evenements.isPending ? (
        <Chargement />
      ) : evenements.error ? (
        <MessageErreur erreur={evenements.error} />
      ) : (
        <StockIngredients evenements={evenements.data} evenementId={evenementId} choisir={setEvenementId} />
      )}
    </>
  );
}
