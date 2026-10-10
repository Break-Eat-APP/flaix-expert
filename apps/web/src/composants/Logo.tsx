import logoClair from "../assets/logo-clair.svg";

/**
 * Logo officiel « eXpert » (docs/marque, versions produites par infra/outils/logo.cjs) : texte noir, X violet.
 * FlaiX Expert est toujours en clair (§15.153).
 */
export function Logo({ hauteur = 40 }: { hauteur?: number }) {
  return (
    <img src={logoClair} alt="FlaiX Expert" style={{ height: hauteur, width: "auto", display: "block" }} />
  );
}
