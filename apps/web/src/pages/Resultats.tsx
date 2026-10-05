import { Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { BellRing, CheckCircle2, Radio } from "lucide-react";
import type { CentreAlertes, Evenement, Lieu, Produit, SessionInfo, Stand } from "@flaix/domain";
import { api } from "../api.ts";
import { Carte, Chargement, EntetePage, MessageErreur } from "../composants/communs.tsx";
import { Tableaux } from "./resultats/Tableaux.tsx";

/**
 * Résultats — page d'accueil (organisation en 6 entrées, dossier §15.96). En tête, la mise en
 * route d'un lieu qui démarre de zéro, tant qu'elle n'est pas terminée ; puis les tableaux
 * calculés sur les vraies ventes (dossier §15.103).
 */
export function Resultats({ session }: { session: SessionInfo }) {
  const lieu = useQuery({ queryKey: ["lieu"], queryFn: () => api.get<Lieu>("/lieu") });
  const stands = useQuery({ queryKey: ["stands"], queryFn: () => api.get<Stand[]>("/stands") });
  const produits = useQuery({ queryKey: ["produits"], queryFn: () => api.get<Produit[]>("/produits") });
  const evenements = useQuery({ queryKey: ["evenements"], queryFn: () => api.get<Evenement[]>("/evenements") });
  // Centre d'alertes (§15.140) : chargé à part, il ne retarde jamais l'affichage des résultats.
  const alertes = useQuery({ queryKey: ["alertes"], queryFn: () => api.get<CentreAlertes>("/alertes") });

  if (lieu.isPending || stands.isPending || produits.isPending || evenements.isPending) return <Chargement />;
  const erreur = lieu.error ?? stands.error ?? produits.error ?? evenements.error;
  if (erreur) return <MessageErreur erreur={erreur} />;

  const l = lieu.data!;
  const standsActifs = stands.data!.filter((s) => s.actif);
  const caisses = standsActifs.flatMap((s) => s.caisses.filter((c) => c.actif));
  const produitsActifs = produits.data!.filter((p) => p.actif);
  const produitsVendus = produitsActifs.filter((p) => p.standIds.length > 0);
  const nbMatchs = evenements.data!.length;
  const enCours = evenements.data!.find((e) => e.etat === "ouvert") ?? null;

  const etapes = [
    {
      fait: Boolean(l.raisonSociale && l.siret && l.adresse && l.codePostal && l.ville),
      titre: "Renseigner l'identité de l'exploitant",
      texte: "Raison sociale, SIRET, n° de TVA et adresse : ces mentions figureront sur chaque ticket.",
      lien: "/parametres/lieu",
    },
    {
      fait: standsActifs.length > 0,
      titre: "Créer les stands",
      texte: standsActifs.length ? `${standsActifs.length} stand(s) actif(s).` : "Chaque buvette, bar ou point de vente du lieu.",
      lien: "/parametres/stands",
    },
    {
      fait: caisses.length > 0,
      titre: "Ajouter les caisses de chaque stand",
      texte: caisses.length ? `${caisses.length} caisse(s) active(s), numérotées sur tout le lieu.` : "Un stand peut avoir plusieurs caisses.",
      lien: "/parametres/stands",
    },
    {
      fait: produitsVendus.length > 0,
      titre: "Construire le catalogue et les prix",
      texte: produitsActifs.length
        ? `${produitsActifs.length} produit(s), dont ${produitsVendus.length} vendu(s) dans au moins un stand.`
        : "Chaque produit : son prix, son taux de TVA, les stands qui le vendent.",
      lien: "/parametres/produits",
    },
    {
      fait: nbMatchs > 0,
      titre: "Préparer la saison",
      texte: nbMatchs
        ? `${nbMatchs} événement(s) dans la saison. Le jour de l'événement, les caisses des caissières s'ouvrent toutes seules dessus.`
        : "Chaque événement auquel se rattacheront les ventes de la soirée.",
      lien: "/parametres/saison",
    },
  ];
  const faites = etapes.filter((e) => e.fait).length;
  const miseEnRouteTerminee = faites === etapes.length;

  return (
    <>
      <EntetePage
        fil={session.lieu.nom}
        titre="Résultats"
        description={
          session.support
            ? `Support FlaiX Expert, en lecture seule : ${session.utilisateur.nom}.`
            : miseEnRouteTerminee || session.formation
              ? `Bonjour ${session.utilisateur.nom}.`
            : `Bonjour ${session.utilisateur.nom}. Ton espace démarre vide : tu construis toi-même ta configuration, étape par étape.`
        }
      />
      {enCours && (
        <Link to="/direct" className="carte direct-accroche">
          <Radio size={18} />
          <span style={{ minWidth: 0 }}>
            <strong>{enCours.libelle} : événement en cours</strong>
            <span className="discret"> — CA, caisses et ruptures en direct</span>
          </span>
        </Link>
      )}
      {alertes.data && alertes.data.alertes.length > 0 && (
        <Link to="/alertes" className="carte direct-accroche">
          <BellRing size={18} />
          <span style={{ minWidth: 0 }}>
            <strong>
              Centre d'alertes : {alertes.data.alertes.length} alerte{alertes.data.alertes.length > 1 ? "s" : ""}
            </strong>
            <span className="discret">
              {" "}
              — {alertes.data.alertes.filter((a) => a.niveau === "forte").length || "aucune"} forte{alertes.data.alertes.filter((a) => a.niveau === "forte").length > 1 ? "s" : ""} · prix, marges, stock, fournisseurs
            </span>
          </span>
        </Link>
      )}
      {/* En formation, la configuration est celle du vrai lieu : pas de mise en route à faire ici. */}
      {!miseEnRouteTerminee && !session.formation && (
        <Carte titre={`Mise en route du lieu — ${faites} étape${faites > 1 ? "s" : ""} sur ${etapes.length}`}>
          <ol className="etapes">
            {etapes.map((e, i) => (
              <li key={e.titre} className={`etape${e.fait ? " faite" : ""}`}>
                <span className="etape-rond">{e.fait ? <CheckCircle2 size={16} /> : i + 1}</span>
                <div style={{ flex: 1 }}>
                  <strong>{e.titre}</strong>
                  <p>{e.texte}</p>
                </div>
                <Link className={e.fait ? "btn btn-fantome" : "btn"} to={e.lien}>
                  {e.fait ? "Voir" : "Commencer"}
                </Link>
              </li>
            ))}
          </ol>
        </Carte>
      )}
      <Tableaux />
    </>
  );
}
