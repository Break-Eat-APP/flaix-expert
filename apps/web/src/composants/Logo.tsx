import logoClair from "../assets/logo-clair.svg";
import logoSombre from "../assets/logo-sombre.svg";

/**
 * Logo officiel « eXpert » (docs/marque, versions produites par infra/outils/logo.cjs) : texte noir
 * en thème clair, blanc en thème sombre ; le X violet ne change pas.
 */
export function Logo({ hauteur = 40 }: { hauteur?: number }) {
  return (
    <picture style={{ display: "block", lineHeight: 0 }}>
      <source srcSet={logoSombre} media="(prefers-color-scheme: dark)" />
      <img src={logoClair} alt="FlaiX Expert" style={{ height: hauteur, width: "auto", display: "block" }} />
    </picture>
  );
}
