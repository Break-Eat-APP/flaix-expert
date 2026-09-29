import { Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2 } from "lucide-react";
import type { Evenement, Lieu, Produit, SessionInfo, Stand } from "@flaix/domain";
import { api } from "../api.ts";
import { Carte, Chargement, EntetePage, EtatVide, MessageErreur } from "../composants/communs.tsx";

/**
 * Résultats — page d'accueil (organisation en 6 entrées, dossier §15.96).
 * Les tableaux de résultats ne sont pas encore construits : la page le dit, sans aucun
 * chiffre inventé. Elle reprend la mise en route d'un lieu qui démarre de zéro
 * (ex-« Démarrage du lieu », brief de production §1), tant qu'elle n'est pas terminée.
 */
export function Resultats({ session }: { session: SessionInfo }) {
  const lieu = useQuery({ queryKey: ["lieu"], queryFn: () => api.get<Lieu>("/lieu") });
  const stands = useQuery({ queryKey: ["stands"], queryFn: () => api.get<Stand[]>("/stands") });
  const produits = useQuery({ queryKey: ["produits"], queryFn: () => api.get<Produit[]>("/produits") });
  const evenements = useQuery({ queryKey: ["evenements"], queryFn: () => api.get<Evenement[]>("/evenements") });

  if (lieu.isPending || stands.isPending || produits.isPending || evenements.isPending) return <Chargement />;
  const erreur = lieu.error ?? stands.error ?? produits.error ?? evenements.error;
  if (erreur) return <MessageErreur erreur={erreur} />;

  const l = lieu.data!;
  const standsActifs = stands.data!.filter((s) => s.actif);
  const caisses = standsActifs.flatMap((s) => s.caisses.filter((c) => c.actif));
  const produitsActifs = produits.data!.filter((p) => p.actif);
  const produitsVendus = produitsActifs.filter((p) => p.standIds.length > 0);
  const nbMatchs = evenements.data!.length;
  const nbClos = evenements.data!.filter((e) => e.etat === "clos").length;

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
        ? `${nbMatchs} match(s) dans la saison. Le jour du match, ouvre-le depuis « Caisses », puis ouvre les caisses.`
        : "Chaque match auquel se rattacheront les ventes de la soirée.",
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
          miseEnRouteTerminee
            ? `Bonjour ${session.utilisateur.nom}.`
            : `Bonjour ${session.utilisateur.nom}. Ton espace démarre vide : tu construis toi-même ta configuration, étape par étape.`
        }
      />
      {!miseEnRouteTerminee && (
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
      <Carte titre="Résultats des matchs">
        <EtatVide titre="Bientôt ici">
          {nbClos === 0 ? "Aucun match clos pour l'instant. " : `${nbClos} match${nbClos > 1 ? "s" : ""} clos. `}
          Le chiffre d'affaires, les ventes, les finances, les marges et les rapports de soirée s'afficheront sur cette page : ce module n'est pas encore
          construit dans cette version. En attendant, les chiffres de chaque match sont dans <Link to="/caisses">Caisses</Link>.
        </EtatVide>
      </Carte>
    </>
  );
}
