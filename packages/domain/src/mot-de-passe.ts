/**
 * Règle des mots de passe (comptes directeur et FlaiX Expert ; dossier §15.122). Rémi : « pas besoin
 * de douze caractères, six suffit ». En contrepartie, les mots de passe les plus utilisés sont refusés :
 * avec six caractères, « 123456 » ou « azerty » sont les premiers essayés. Les tentatives de connexion
 * sont par ailleurs limitées (10 par quart d'heure).
 */
export const LONGUEUR_MIN_MOT_DE_PASSE = 6;
export const LONGUEUR_MAX_MOT_DE_PASSE = 200;

const TROP_UTILISES = new Set([
  "azerty", "azerty1", "azerty12", "azerty123", "azertyuiop", "qwerty", "qwerty123", "qwertyuiop",
  "password", "password1", "motdepasse", "mot-de-passe", "123123", "123321", "112233", "121212",
  "abc123", "abcd1234", "soleil", "doudou", "loulou", "chouchou", "bonjour", "coucou", "jetaime",
  "iloveyou", "football", "marseille", "flaix", "flaixexpert", "flaix-expert",
]);

/** Une suite régulière : 123456, 987654, abcdef… */
function estUneSuite(m: string): boolean {
  const pas = m.charCodeAt(1) - m.charCodeAt(0);
  if (Math.abs(pas) !== 1) return false;
  for (let i = 2; i < m.length; i++) if (m.charCodeAt(i) - m.charCodeAt(i - 1) !== pas) return false;
  return true;
}

/** La raison du refus d'un nouveau mot de passe, ou null s'il convient. */
export function refusMotDePasse(motDePasse: string): string | null {
  if (motDePasse.length < LONGUEUR_MIN_MOT_DE_PASSE) return `Le mot de passe doit contenir au moins ${LONGUEUR_MIN_MOT_DE_PASSE} caractères.`;
  if (motDePasse.length > LONGUEUR_MAX_MOT_DE_PASSE) return `Le mot de passe : ${LONGUEUR_MAX_MOT_DE_PASSE} caractères au maximum.`;
  const m = motDePasse.toLowerCase();
  if (/^(.)\1+$/.test(m) || estUneSuite(m) || TROP_UTILISES.has(m)) return "Ce mot de passe fait partie des plus utilisés : choisis-en un autre.";
  return null;
}
