import { Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2 } from "lucide-react";
import type { Evenement, Lieu, Produit, SessionInfo, Stand } from "@flaix/domain";
import { api } from "../api.ts";
import { Carte, Chargement, EntetePage, MessageErreur } from "../composants/communs.tsx";

/**
 * Point d'entrée d'un lieu qui démarre de zéro : aucune donnée n'est préchargée
 * (brief de production §1). L'écran dit simplement ce qui reste à faire, dans l'ordre.
 */
export function Demarrage({ session }: { session: SessionInfo }) {
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

  const etapes = [
    {
      fait: Boolean(l.raisonSociale && l.siret && l.adresse && l.codePostal && l.ville),
      titre: "Renseigner l'identité de l'exploitant",
      texte: "Raison sociale, SIRET, n° de TVA et adresse : ces mentions figureront sur chaque ticket.",
      lien: "/configuration/identite",
    },
    {
      fait: standsActifs.length > 0,
      titre: "Créer les stands",
      texte: standsActifs.length ? `${standsActifs.length} stand(s) actif(s).` : "Chaque buvette, bar ou point de vente du lieu.",
      lien: "/configuration/stands",
    },
    {
      fait: caisses.length > 0,
      titre: "Ajouter les caisses de chaque stand",
      texte: caisses.length ? `${caisses.length} caisse(s) active(s), numérotées sur tout le lieu.` : "Un stand peut avoir plusieurs caisses.",
      lien: "/configuration/stands",
    },
    {
      fait: produitsVendus.length > 0,
      titre: "Construire le catalogue et les prix",
      texte: produitsActifs.length
        ? `${produitsActifs.length} produit(s), dont ${produitsVendus.length} vendu(s) dans au moins un stand.`
        : "Chaque produit : son prix, son taux de TVA, les stands qui le vendent.",
      lien: "/configuration/produits",
    },
    {
      fait: evenements.data!.length > 0,
      titre: "Préparer le calendrier des matchs",
      texte: evenements.data!.length
        ? `${evenements.data!.length} match(s) au calendrier. Ouvre un match, puis une caisse depuis « Mes caisses ».`
        : "Chaque match auquel se rattacheront les ventes de la soirée.",
      lien: "/configuration/matchs",
    },
  ];
  const faites = etapes.filter((e) => e.fait).length;

  return (
    <>
      <EntetePage
        fil={session.lieu.nom}
        titre="Démarrage du lieu"
        description={`Bonjour ${session.utilisateur.nom}. Ton espace démarre vide : tu construis toi-même ta configuration, étape par étape.`}
      />
      <Carte titre={`Mise en route — ${faites} étape${faites > 1 ? "s" : ""} sur ${etapes.length}`}>
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
      <div className="message message-info">
        Les modules suivants (stock, personnel, tableaux de bord…) apparaîtront dans le menu au fur et à mesure de leur mise en production.
      </div>
    </>
  );
}
