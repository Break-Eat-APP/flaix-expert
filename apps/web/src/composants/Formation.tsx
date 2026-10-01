import { useEffect } from "react";
import { useNavigate } from "react-router";
import { useBasculeFormation } from "../session.tsx";
import { MessageErreur } from "./communs.tsx";

/**
 * Mention « FACTICE » du mode formation (BOFiP §150, test B3, dossier §15.109) : sur chaque écran,
 * sans bouton pour la masquer. Elle marque aussi toute page imprimée (filigrane, styles.css).
 */
export function BandeauFormation({ quitter = false }: { quitter?: boolean }) {
  const bascule = useBasculeFormation();
  const naviguer = useNavigate();
  useEffect(() => {
    document.body.classList.add("mode-formation");
    return () => document.body.classList.remove("mode-formation");
  }, []);
  return (
    <div className="bandeau-formation" role="alert">
      <span>
        <strong>MODE FORMATION — FACTICE</strong>
        <span className="bandeau-detail"> · rien de ce qui est fait ici n'est réel : ventes, clôtures et stock ne comptent nulle part.</span>
      </span>
      {quitter && (
        <button
          className="btn btn-fantome"
          style={{ fontSize: 12.5, padding: "4px 10px" }}
          disabled={bascule.isPending}
          onClick={() => bascule.mutate("sortie", { onSuccess: () => void naviguer("/parametres/formation") })}
        >
          Quitter la formation
        </button>
      )}
      <MessageErreur erreur={bascule.error} />
    </div>
  );
}
