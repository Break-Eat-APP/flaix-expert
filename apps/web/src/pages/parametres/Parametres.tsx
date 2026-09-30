import type { ComponentType } from "react";
import { Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { Building2, CalendarDays, GraduationCap, LayoutGrid, ShieldCheck, ShoppingBag, Tags, Target, UserCog } from "lucide-react";
import type { EtatFormation, Evenement, Lieu, Produit, Stand } from "@flaix/domain";
import { api } from "../../api.ts";
import { EntetePage } from "../../composants/communs.tsx";

interface Tuile {
  titre: string;
  texte: string;
  icone: ComponentType<{ size?: number }>;
  /** Absent = réglage pas encore construit en production (affiché « à venir »). */
  route?: string;
  etat?: string;
}

/** Paramètres : tous les réglages du lieu au même endroit (organisation en 6 entrées, dossier §15.96). */
export function Parametres() {
  const lieu = useQuery({ queryKey: ["lieu"], queryFn: () => api.get<Lieu>("/lieu") });
  const stands = useQuery({ queryKey: ["stands"], queryFn: () => api.get<Stand[]>("/stands") });
  const produits = useQuery({ queryKey: ["produits"], queryFn: () => api.get<Produit[]>("/produits") });
  const evenements = useQuery({ queryKey: ["evenements"], queryFn: () => api.get<Evenement[]>("/evenements") });
  const formation = useQuery({ queryKey: ["formation"], queryFn: () => api.get<EtatFormation>("/formation") });

  const l = lieu.data;
  const standsActifs = stands.data?.filter((s) => s.actif) ?? [];
  const nbCaisses = standsActifs.reduce((n, s) => n + s.caisses.filter((c) => c.actif).length, 0);
  const nbProduits = produits.data?.filter((p) => p.actif).length;
  const nbAVenir = evenements.data?.filter((e) => e.etat === "a_venir").length;
  const pluriel = (n: number, mot: string) => `${n} ${mot}${n > 1 ? "s" : ""}`;

  const tuiles: Tuile[] = [
    {
      titre: "Le lieu",
      texte: "Identité de l'exploitant, réglages de caisse",
      icone: Building2,
      route: "/parametres/lieu",
      etat: l
        ? `${l.raisonSociale && l.siret && l.adresse && l.codePostal && l.ville ? "Identité complète" : "Identité à compléter"} · remise abonné ${
            l.remiseAbonnePb !== null ? `${(l.remiseAbonnePb / 100).toLocaleString("fr-FR")} %` : "non réglée"
          }`
        : undefined,
    },
    {
      titre: "Stands & caisses",
      texte: "Points de vente, caisses, espèces acceptées",
      icone: LayoutGrid,
      route: "/parametres/stands",
      etat: stands.data ? `${pluriel(standsActifs.length, "stand")} · ${pluriel(nbCaisses, "caisse")}` : undefined,
    },
    {
      titre: "Produits & prix",
      texte: "Catalogue, prix datés, TVA, catégories",
      icone: Tags,
      route: "/parametres/produits",
      etat: nbProduits !== undefined ? pluriel(nbProduits, "produit") : undefined,
    },
    {
      titre: "Saison",
      texte: "Calendrier des matchs, spectateurs",
      icone: CalendarDays,
      route: "/parametres/saison",
      etat: nbAVenir !== undefined ? `${pluriel(nbAVenir, "match")} à venir` : undefined,
    },
    {
      titre: "Conformité",
      texte: "Journal technique ; attestation et archives à venir",
      icone: ShieldCheck,
      route: "/parametres/conformite",
      etat: "Journal technique",
    },
    {
      titre: "Mode formation",
      texte: "S'entraîner et former les caissières : tout y est factice",
      icone: GraduationCap,
      route: "/parametres/formation",
      etat: formation.data
        ? formation.data.enFormation
          ? "En cours"
          : `${formation.data.lieuFormation ? "Lieu d'entraînement prêt" : "Jamais utilisé"} · ${pluriel(formation.data.tablettesEnFormation, "tablette")} en formation`
        : undefined,
    },
    { titre: "Click & Collect", texte: "Prix sur l'application, points de retrait", icone: ShoppingBag },
    { titre: "Objectifs & coûts", texte: "Cibles de marge, coûts par buvette", icone: Target },
    { titre: "Accès", texte: "Comptes du directeur et des caissières", icone: UserCog },
  ];

  return (
    <>
      <EntetePage titre="Paramètres" description="Tous les réglages du lieu, au même endroit." />
      <div className="tuiles">
        {tuiles.map((t) => {
          const Icone = t.icone;
          const contenu = (
            <>
              <span className="tuile-icone">
                <Icone size={18} />
              </span>
              <strong>{t.titre}</strong>
              <span className="tuile-texte">{t.texte}</span>
              {t.route ? <em>{t.etat ?? "…"}</em> : <span className="etiquette-a-venir" style={{ marginLeft: 0, justifySelf: "start" }}>à venir</span>}
            </>
          );
          return t.route ? (
            <Link key={t.titre} to={t.route} className="tuile">
              {contenu}
            </Link>
          ) : (
            <div key={t.titre} className="tuile a-venir" title="Pas encore construit en production">
              {contenu}
            </div>
          );
        })}
      </div>
    </>
  );
}
