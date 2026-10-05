import { useRef, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ImagePlus, Trash2 } from "lucide-react";
import {
  COULEUR_CARTE_DEFAUT,
  DESIGN_CARTE_DEFAUT,
  LIMITES_DESIGN,
  TAILLE_CONSEILLEE,
  couleursCarte,
  emailValide,
  formaterRemise,
  libellePointsCarte,
  lienValide,
  reductionDisponible,
  telephoneValide,
  titreCarte,
  type DesignCarte,
  type EtatWallet,
  type SorteImage,
} from "@flaix/domain";
import { api } from "../../api.ts";
import { ApercuCarte, type ContenuApercu } from "../../composants/ApercuCarte.tsx";
import { Carte, Chargement, MessageErreur } from "../../composants/communs.tsx";
import { services } from "./CarteWallet.tsx";
import { TYPES_ACCEPTES, preparerImages } from "./imagesCarte.ts";

/*
 * Design de la carte abonné (dossier §15.148), Fidélité → onglet « Carte téléphone » : tout ce qu'Apple et Google
 * laissent personnaliser — logo, bannière, couleurs, nom du programme, nom des points, informations affichées,
 * message et liens au dos — avec un aperçu iPhone et Android. Un changement part sur les cartes déjà ajoutées.
 */

type Brouillon = { couleur: string; design: DesignCarte };

const egal = (a: Brouillon, b: Brouillon) => JSON.stringify(a) === JSON.stringify(b);

/** Erreurs de saisie repérées avant l'envoi (le serveur contrôle les mêmes règles). */
function erreurs(d: DesignCarte): Partial<Record<keyof DesignCarte, string>> {
  const e: Partial<Record<keyof DesignCarte, string>> = {};
  if (d.siteWeb && !lienValide(d.siteWeb)) e.siteWeb = "Le lien doit commencer par https://";
  if (d.lienApp && !lienValide(d.lienApp)) e.lienApp = "Le lien doit commencer par https://";
  if (d.telephone && !telephoneValide(d.telephone)) e.telephone = "Numéro de téléphone invalide";
  if (d.email && !emailValide(d.email)) e.email = "Adresse e-mail invalide";
  return e;
}

export function EditeurDesignCarte() {
  const etat = useQuery({ queryKey: ["wallet"], queryFn: () => api.get<EtatWallet>("/wallet") });
  if (etat.isPending) return <Chargement />;
  if (etat.error) return <MessageErreur erreur={etat.error} />;
  return <Editeur e={etat.data!} />;
}

function Editeur({ e }: { e: EtatWallet }) {
  const client = useQueryClient();
  const enregistre: Brouillon = { couleur: e.couleur, design: e.design };
  const [b, setB] = useState<Brouillon>(enregistre);
  const [modele, setModele] = useState<"apple" | "google">("apple");
  const [message, setMessage] = useState<string | null>(null);
  const d = b.design;
  const changer = (m: Partial<DesignCarte>) => setB({ ...b, design: { ...d, ...m } });
  const texte = (v: string) => (v.trim() === "" ? null : v);
  const fautes = erreurs(d);
  const modifie = !egal(b, enregistre);

  const enregistrer = useMutation({
    mutationFn: () => api.put<EtatWallet>("/wallet/design", b),
    onSuccess: (r) => {
      client.setQueryData(["wallet"], r);
      setB({ couleur: r.couleur, design: r.design });
      setMessage(
        r.cartes === 0 ? "Enregistré." : r.cartes === 1 ? "Enregistré : la carte déjà distribuée se met à jour." : `Enregistré : les ${r.cartes} cartes déjà distribuées se mettent à jour.`,
      );
    },
  });

  const exemplePoints = e.regles ? 240 : null;
  const contenu: ContenuApercu = {
    lieu: e.lieu,
    couleurs: couleursCarte(b.couleur, d),
    titre: titreCarte(d),
    afficherNomLieu: d.afficherNomLieu,
    libellePoints: libellePointsCarte(d),
    nom: "Camille Martin",
    numero: "AB-1024",
    points: exemplePoints,
    reduction: d.afficherReduction ? reductionDisponible(exemplePoints, e.regles) : null,
    remise: d.afficherRemise && e.remisePb ? formaterRemise(e.remisePb) : null,
    logo: e.images.logo ? e.images.logo[modele] : null,
    banniere: e.images.banniere ? e.images.banniere[modele] : null,
  };
  const pret = services(e.apple, e.google);

  return (
    <div className="design-carte">
      <div style={{ display: "grid", gap: 16, minWidth: 0 }}>
        <Carte titre="Images" description="Le logo et la bannière du club. Chaque image est retaillée automatiquement aux formats d'Apple et de Google.">
          <div className="grille-champs">
            <DepotImage sorte="logo" e={e} titre="Logo" aide={`Carré de préférence, fond transparent, ${TAILLE_CONSEILLEE.logo.largeur} × ${TAILLE_CONSEILLEE.logo.hauteur} pixels ou plus.`} />
            <DepotImage
              sorte="banniere"
              e={e}
              titre="Bannière"
              aide={`Image en largeur (stade, buvette, visuel du club), ${TAILLE_CONSEILLEE.banniere.largeur} × ${TAILLE_CONSEILLEE.banniere.hauteur} pixels ou plus ; recadrée au centre. Sur iPhone, les points s'écrivent par-dessus : préfère une image sans texte.`}
            />
          </div>
        </Carte>

        <form
          style={{ display: "grid", gap: 16 }}
          onSubmit={(ev) => {
            ev.preventDefault();
            setMessage(null);
            if (Object.keys(fautes).length === 0) enregistrer.mutate();
          }}
        >
          <Carte titre="Couleurs">
            <div className="grille-champs">
              <ChampCouleur titre="Fond de la carte" valeur={b.couleur} onChange={(c) => setB({ ...b, couleur: c ?? b.couleur })} />
              <ChampCouleur
                titre="Texte"
                valeur={d.couleurTexte}
                automatique={couleursCarte(b.couleur, { ...d, couleurTexte: null }).texte}
                libelleAuto="Automatique (lisible sur le fond)"
                onChange={(c) => changer({ couleurTexte: c })}
              />
              <ChampCouleur
                titre="Intitulés (iPhone)"
                valeur={d.couleurLibelles}
                automatique={couleursCarte(b.couleur, { ...d, couleurLibelles: null }).libelles}
                libelleAuto="Comme le texte"
                onChange={(c) => changer({ couleurLibelles: c })}
              />
            </div>
          </Carte>

          <Carte titre="Textes">
            <div className="grille-champs">
              <label className="champ">
                <span>Nom du programme</span>
                <input type="text" value={d.titre ?? ""} maxLength={LIMITES_DESIGN.titre} placeholder="Carte abonné" onChange={(ev) => changer({ titre: texte(ev.target.value) })} />
              </label>
              <label className="champ">
                <span>Nom des points</span>
                <input type="text" value={d.libellePoints ?? ""} maxLength={LIMITES_DESIGN.libellePoints} placeholder="Points" onChange={(ev) => changer({ libellePoints: texte(ev.target.value) })} />
              </label>
            </div>
            <label className="case" style={{ marginTop: 12 }}>
              <input type="checkbox" checked={d.afficherNomLieu} onChange={(ev) => changer({ afficherNomLieu: ev.target.checked })} />
              Nom du lieu à côté du logo (à décocher si le logo contient déjà le nom)
            </label>
            <label className="champ" style={{ marginTop: 12 }}>
              <span>Message au dos de la carte (avantages, conditions)</span>
              <textarea rows={3} value={d.message ?? ""} maxLength={LIMITES_DESIGN.message} placeholder="Ex. : une boisson offerte le jour de ton anniversaire." onChange={(ev) => changer({ message: texte(ev.target.value) })} />
            </label>
          </Carte>

          <Carte titre="Informations sur la carte">
            <div style={{ display: "grid", gap: 10 }}>
              <label className="case">
                <input type="checkbox" checked={d.afficherRemise} onChange={(ev) => changer({ afficherRemise: ev.target.checked })} />
                Remise abonné {e.remisePb ? `(${formaterRemise(e.remisePb)})` : "— pas encore réglée dans la caisse"}
              </label>
              <label className="case">
                <input type="checkbox" checked={d.afficherReduction} onChange={(ev) => changer({ afficherReduction: ev.target.checked })} />
                Réduction disponible (paliers de points atteints) {e.regles ? "" : "— règles des points pas encore réglées"}
              </label>
              <span className="discret" style={{ fontSize: 12 }}>
                Toujours sur la carte : nom de l'abonné, n° d'abonné en QR code, solde de points (si les règles sont réglées) et, au dos, la règle des points.
              </span>
            </div>
          </Carte>

          <Carte titre="Liens au dos de la carte" description="Facultatifs ; l'abonné les touche pour ouvrir le site, appeler ou écrire.">
            <div className="grille-champs">
              <ChampTexte titre="Site du club" valeur={d.siteWeb} placeholder="https://…" mode="url" faute={fautes.siteWeb} onChange={(v) => changer({ siteWeb: v })} />
              <ChampTexte titre="Téléphone" valeur={d.telephone} placeholder="04 91 00 00 00" mode="tel" faute={fautes.telephone} onChange={(v) => changer({ telephone: v })} />
              <ChampTexte titre="E-mail de contact" valeur={d.email} placeholder="contact@club.fr" mode="email" faute={fautes.email} onChange={(v) => changer({ email: v })} />
              <ChampTexte titre="Lien vers une application" valeur={d.lienApp} placeholder="https://apps.apple.com/…" mode="url" faute={fautes.lienApp} onChange={(v) => changer({ lienApp: v })} />
            </div>
          </Carte>

          <div className="actions" style={{ justifyContent: "flex-start", flexWrap: "wrap" }}>
            <button className="btn" type="submit" disabled={!modifie || Object.keys(fautes).length > 0 || enregistrer.isPending}>
              Enregistrer le design
            </button>
            <button className="btn btn-fantome" type="button" disabled={!modifie} onClick={() => setB(enregistre)}>
              Annuler les changements
            </button>
            <button
              className="btn btn-fantome"
              type="button"
              disabled={egal(b, { couleur: COULEUR_CARTE_DEFAUT, design: DESIGN_CARTE_DEFAUT })}
              onClick={() => setB({ couleur: COULEUR_CARTE_DEFAUT, design: DESIGN_CARTE_DEFAUT })}
            >
              Revenir au design d'origine
            </button>
            {message && (
              <span className="discret" role="status">
                {message}
              </span>
            )}
          </div>
          <MessageErreur erreur={enregistrer.error} />
        </form>
      </div>

      <aside className="design-carte-apercu">
        <div className="onglets" style={{ marginBottom: 12 }}>
          <button type="button" className={`onglet${modele === "apple" ? " actif" : ""}`} onClick={() => setModele("apple")}>
            iPhone
          </button>
          <button type="button" className={`onglet${modele === "google" ? " actif" : ""}`} onClick={() => setModele("google")}>
            Android
          </button>
        </div>
        <ApercuCarte c={contenu} modele={modele} />
        <p className="discret" style={{ fontSize: 12 }}>
          Aperçu approché{modifie ? ", avec tes changements pas encore enregistrés" : ""}. {pret ? `En service : ${pret}.` : "L'ajout dans Apple Wallet et Google Wallet n'est pas encore activé par FlaiX Expert."}
        </p>
      </aside>
    </div>
  );
}

function ChampCouleur({
  titre,
  valeur,
  automatique,
  libelleAuto,
  onChange,
}: {
  titre: string;
  valeur: string | null;
  automatique?: string;
  libelleAuto?: string;
  onChange: (c: string | null) => void;
}) {
  const auto = automatique !== undefined && valeur === null;
  return (
    <div className="champ">
      <span>{titre}</span>
      <div className="en-ligne" style={{ gap: 8, flexWrap: "wrap" }}>
        <input
          type="color"
          aria-label={titre}
          value={valeur ?? automatique ?? COULEUR_CARTE_DEFAUT}
          onChange={(ev) => onChange(ev.target.value.toLowerCase())}
          style={{ width: 52, height: 34, padding: 2, opacity: auto ? 0.6 : 1 }}
        />
        {automatique !== undefined && (
          <label className="case" style={{ fontWeight: 400 }}>
            <input type="checkbox" checked={auto} onChange={(ev) => onChange(ev.target.checked ? null : automatique)} />
            {libelleAuto}
          </label>
        )}
      </div>
    </div>
  );
}

function ChampTexte({ titre, valeur, placeholder, mode, faute, onChange }: { titre: string; valeur: string | null; placeholder: string; mode: "url" | "tel" | "email"; faute?: string; onChange: (v: string | null) => void }) {
  return (
    <label className="champ">
      <span>{titre}</span>
      <input type="text" inputMode={mode} value={valeur ?? ""} placeholder={placeholder} aria-invalid={!!faute} onChange={(ev) => onChange(ev.target.value.trim() === "" ? null : ev.target.value)} />
      {faute && <small style={{ color: "var(--red)" }}>{faute}</small>}
    </label>
  );
}

function DepotImage({ sorte, e, titre, aide }: { sorte: SorteImage; e: EtatWallet; titre: string; aide: ReactNode }) {
  const client = useQueryClient();
  const fichier = useRef<HTMLInputElement>(null);
  const [avis, setAvis] = useState<string | null>(null);
  const deposer = useMutation({
    mutationFn: async (f: File) => {
      const { variantes, petite } = await preparerImages(f, sorte);
      const r = await api.put<EtatWallet>(`/wallet/images/${sorte}`, { variantes });
      return { r, petite };
    },
    onSuccess: ({ r, petite }) => {
      client.setQueryData(["wallet"], r);
      setAvis(petite ? "Image enregistrée. Elle est petite : elle risque d'être un peu floue sur la carte." : "Image enregistrée.");
    },
  });
  const retirer = useMutation({
    mutationFn: () => api.supprimer<EtatWallet>(`/wallet/images/${sorte}`),
    onSuccess: (r) => {
      client.setQueryData(["wallet"], r);
      setAvis("Image retirée.");
    },
  });
  const actuelle = e.images[sorte];
  return (
    <div className="champ">
      <span>{titre}</span>
      <div className="depot-image" style={{ aspectRatio: sorte === "logo" ? "1 / 1" : "1125 / 369" }}>
        {actuelle ? <img src={actuelle.google} alt={`${titre} actuel`} /> : <span className="discret">Pas encore d'image</span>}
      </div>
      <input
        ref={fichier}
        type="file"
        accept={TYPES_ACCEPTES}
        hidden
        aria-label={`Choisir ${titre.toLowerCase()}`}
        onChange={(ev) => {
          const f = ev.target.files?.[0];
          ev.target.value = "";
          setAvis(null);
          if (f) deposer.mutate(f);
        }}
      />
      <div className="en-ligne" style={{ gap: 8, flexWrap: "wrap" }}>
        <button type="button" className="btn btn-fantome" disabled={deposer.isPending} onClick={() => fichier.current?.click()}>
          <ImagePlus size={14} /> {deposer.isPending ? "Préparation…" : actuelle ? "Remplacer" : "Choisir une image"}
        </button>
        {actuelle && (
          <button type="button" className="btn btn-fantome" disabled={retirer.isPending} onClick={() => retirer.mutate()}>
            <Trash2 size={14} /> Retirer
          </button>
        )}
      </div>
      <small className="discret">{aide}</small>
      {avis && (
        <small className="discret" role="status">
          {avis}
        </small>
      )}
      <MessageErreur erreur={deposer.error ?? retirer.error} />
    </div>
  );
}
