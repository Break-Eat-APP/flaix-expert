import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { RotateCcw } from "lucide-react";
import { api } from "../../api.ts";
import { Carte, MessageErreur } from "../../composants/communs.tsx";

/**
 * Remise à zéro du stock (dossier §15.165) : les restes comptés jusqu'ici ne passent plus à l'événement suivant, et la
 * réserve (produits et ingrédients) repart d'un inventaire à 0. Rien n'est effacé : la remise est datée, motivée et
 * inscrite au journal. Produits, tarifs et emballages ne bougent pas.
 */
export function RemiseAZero({ fermer }: { fermer: () => void }) {
  const client = useQueryClient();
  const [motif, setMotif] = useState("");
  const remettre = useMutation({
    mutationFn: () => api.post<{ le: string; produits: number; ingredients: number }>("/stock/remise-a-zero", { motif }),
    onSuccess: () => {
      for (const cle of ["stock", "reserve", "stock-ingredients", "reserve-ingredients", "plan-stade", "alertes"]) void client.invalidateQueries({ queryKey: [cle] });
    },
  });

  if (remettre.data)
    return (
      <Carte titre="Stock remis à zéro">
        <p style={{ margin: "0 0 12px" }}>
          Les stands repartent de 0 au prochain événement
          {remettre.data.produits + remettre.data.ingredients > 0
            ? `, et la réserve est à 0 (${remettre.data.produits} produit${remettre.data.produits > 1 ? "s" : ""}${remettre.data.ingredients ? `, ${remettre.data.ingredients} ingrédient${remettre.data.ingredients > 1 ? "s" : ""}` : ""}).`
            : " ; la réserve était déjà vide."}{" "}
          Tu peux saisir ta mise en place et tes livraisons.
        </p>
        <button className="btn btn-fantome" onClick={fermer}>
          Fermer
        </button>
      </Carte>
    );

  return (
    <Carte
      titre="Remettre le stock à zéro"
      description="Pour repartir de rien, par exemple après des essais : les restes comptés aux derniers événements ne passeront plus au prochain, et la réserve repart de 0. Produits, tarifs et emballages ne bougent pas. Rien n'est effacé : la remise est datée et inscrite au journal."
    >
      <label className="champ" style={{ maxWidth: 520 }}>
        <span>Motif *</span>
        <input type="text" value={motif} onChange={(e) => setMotif(e.target.value)} placeholder="Ex. Essais avant l'ouverture de la saison" maxLength={300} />
      </label>
      <MessageErreur erreur={remettre.error} />
      <div className="ligne-actions">
        <button className="btn btn-fantome" onClick={fermer} disabled={remettre.isPending}>
          Annuler
        </button>
        <button className="btn btn-danger" onClick={() => remettre.mutate()} disabled={remettre.isPending || motif.trim().length < 5}>
          <RotateCcw size={15} /> Remettre à zéro
        </button>
      </div>
    </Carte>
  );
}
