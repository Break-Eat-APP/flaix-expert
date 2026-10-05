/**
 * E-mails de FlaiX Expert par Brevo (dossier §15.146) : rapport de soirée à la clôture de l'événement,
 * notification d'une rectification de Z. Le contenu est écrit ici, sans rien recalculer : le rapport reprend le
 * brief de fin de soirée (§15.135), lui-même recopié du rapport figé ; la rectification reprend ce qui vient
 * d'être enregistré et scellé.
 */
import { formaterMontant, type Centimes } from "./argent.ts";
import type { BriefSoiree } from "./brief.ts";

/** Adresses ajoutées par le lieu, en plus de ses directeurs. */
export const EMAILS_SUPPLEMENTAIRES_MAX = 5;

export interface ReglagesEmails {
  rapport: boolean;
  rectification: boolean;
  supplementaires: string[];
}

export interface EmailEnvoye {
  type: "rapport_soiree" | "rectification" | "essai" | "carte_wallet";
  sujet: string;
  destinataires: number;
  statut: "envoye" | "echec" | "sans_service";
  erreur: string | null;
  le: string;
}

/** Réponse de GET /api/emails. */
export interface EtatEmails {
  /** Brevo est-il réglé sur le serveur (clé et adresse d'expédition) ? */
  service: boolean;
  expediteur: string | null;
  reglages: ReglagesEmails;
  /** Directeurs du lieu qui reçoivent les e-mails. */
  directeurs: { nom: string; email: string }[];
  derniers: EmailEnvoye[];
}

export interface Email {
  sujet: string;
  texte: string;
  html: string;
}

const echapper = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Adresse e-mail plausible (contrôle de forme, pas de vérification d'existence). */
export const emailValide = (s: string) => /^[^\s@<>"]{1,64}@[^\s@<>"]{1,190}\.[a-z]{2,24}$/i.test(s.trim());

function page(titre: string, paragraphes: string[], lien: { texte: string; url: string }, pied: string): string {
  return `<!doctype html><html lang="fr"><body style="margin:0;padding:24px;background:#f6f4fb;font-family:Arial,Helvetica,sans-serif;color:#1c1730">
<div style="max-width:560px;margin:0 auto;background:#fff;border-radius:14px;padding:24px">
<div style="font-weight:700;color:#4d04f4;font-size:13px;letter-spacing:.04em">FLAIX EXPERT</div>
<h1 style="font-size:19px;margin:10px 0 14px">${echapper(titre)}</h1>
${paragraphes.map((p) => `<p style="font-size:14px;line-height:1.5;margin:0 0 10px">${echapper(p)}</p>`).join("\n")}
<p style="margin:18px 0"><a href="${echapper(lien.url)}" style="background:#4d04f4;color:#fff;text-decoration:none;padding:10px 16px;border-radius:10px;font-weight:700;font-size:14px">${echapper(lien.texte)}</a></p>
<p style="font-size:12px;color:#5f5973;margin:16px 0 0">${echapper(pied)}</p>
</div></body></html>`;
}

/** Rapport de soirée : le brief (mêmes chiffres que le rapport figé) et le lien vers le rapport complet. */
export function emailRapportSoiree(b: BriefSoiree, adresseSite: string, lieu: string, formation = false): Email {
  const url = `${adresseSite}${b.lien}`;
  const prefixe = formation ? "[FORMATION — FACTICE] " : "";
  const lignes = [b.resume, ...b.points.map((p) => `• ${p.texte}`)];
  const pied = `${lieu} — e-mail envoyé par FlaiX Expert à la clôture de l'événement. Le rapport complet demande une connexion : aucun chiffre détaillé ne circule par e-mail.`;
  return {
    sujet: `${prefixe}Rapport de soirée — ${b.titre}`,
    texte: [b.titre, "", ...lignes, "", `Rapport complet : ${url}`, "", pied].join("\n"),
    html: page(b.titre, lignes, { texte: "Ouvrir le rapport de soirée", url }, pied),
  };
}

export interface Rectification {
  lieu: string;
  /** « Caisse 3 (Buvette Nord) » ou « Coffre ». */
  objet: string;
  evenement: string;
  compteAvant: Centimes;
  ecartAvant: Centimes;
  compte: Centimes;
  ecart: Centimes;
  motif: string;
  signature: string;
  par: string;
  le: string;
}

const signe = (c: Centimes) => `${c > 0 ? "+" : c < 0 ? "−" : ""}${formaterMontant(Math.abs(c))}`;

/** Notification d'une rectification de Z (module 7 : « notifiée par e-mail au moment de l'enregistrement »). */
export function emailRectification(r: Rectification, adresseSite: string): Email {
  const titre = `Rectification du Z — ${r.objet}, ${r.evenement}`;
  const quand = new Date(r.le).toLocaleString("fr-FR", { dateStyle: "long", timeStyle: "short", timeZone: "Europe/Paris" });
  const lignes = [
    `Compté : ${formaterMontant(r.compteAvant)} → ${formaterMontant(r.compte)}.`,
    `Écart : ${signe(r.ecartAvant)} → ${signe(r.ecart)}.`,
    `Motif : ${r.motif}`,
    `Signé « ${r.signature} » par ${r.par}, le ${quand}.`,
    "Le Z d'origine reste inchangé et lisible : la rectification s'y ajoute, scellée.",
  ];
  const url = `${adresseSite}/clotures`;
  const pied = `${r.lieu} — e-mail envoyé par FlaiX Expert à l'enregistrement de la rectification.`;
  return { sujet: titre, texte: [titre, "", ...lignes, "", `Clôtures : ${url}`, "", pied].join("\n"), html: page(titre, lignes, { texte: "Voir les clôtures", url }, pied) };
}

/** E-mail d'essai, envoyé depuis Paramètres pour vérifier le réglage. */
export function emailEssai(lieu: string, adresseSite: string): Email {
  const titre = "E-mail d'essai";
  const lignes = [`Si tu lis ce message, les e-mails de FlaiX Expert arrivent bien pour ${lieu}.`];
  return { sujet: `FlaiX Expert — ${titre}`, texte: [titre, "", ...lignes, "", adresseSite].join("\n"), html: page(titre, lignes, { texte: "Ouvrir FlaiX Expert", url: adresseSite }, `${lieu} — envoyé depuis Paramètres → Notifications.`) };
}

/** Lien de la carte abonné (Apple Wallet, Google Wallet), envoyé à l'abonné par le directeur (§15.147). */
export function emailLienCarte(lieu: string, nom: string, lien: string): Email {
  const titre = `Ta carte abonné — ${lieu}`;
  const lignes = [`Bonjour ${nom},`, `Voici ta carte abonné ${lieu}, à ajouter dans ton téléphone (Apple Wallet ou Google Wallet). À la buvette, présente son QR code à la caissière.`, "Ce lien est personnel : ne le transmets pas."];
  return { sujet: titre, texte: [titre, "", ...lignes, "", lien].join("\n"), html: page(titre, lignes, { texte: "Ajouter ma carte", url: lien }, `${lieu} — e-mail envoyé par FlaiX Expert à la demande du lieu.`) };
}

