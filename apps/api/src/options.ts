import { OPTIONS_LIEU, OPTIONS_PAR_DEFAUT, type OptionLieu, type OptionsLieu } from "@flaix/domain";
import type { Client } from "./base.ts";
import { ErreurMetier } from "./erreurs.ts";

/**
 * Options du lieu activées par FlaiX Expert (dossier §15.118). Un lieu de formation suit son vrai lieu.
 * Une option sans réglage est active.
 */
export async function lireOptions(c: Client, lieuId: string): Promise<OptionsLieu> {
  const { rows } = await c.query<{ option: OptionLieu; active: boolean }>(
    "SELECT option, active FROM option_lieu WHERE lieu_id = coalesce((SELECT formation_de FROM lieu WHERE id = $1), $1)",
    [lieuId],
  );
  return { ...OPTIONS_PAR_DEFAUT, ...Object.fromEntries(rows.map((r) => [r.option, r.active])) };
}

export function optionInactive(option: OptionLieu): ErreurMetier {
  const libelle = OPTIONS_LIEU.find((o) => o.cle === option)?.libelle ?? option;
  return new ErreurMetier(403, `L'option « ${libelle} » n'est pas activée pour ce lieu : à demander à FlaiX Expert.`);
}
