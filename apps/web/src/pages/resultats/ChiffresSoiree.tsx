import type { ReactNode } from "react";
import { Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { FAMILLES_CATEGORIE, type FinancesSoiree, type ReponsePertes, type Resultats } from "@flaix/domain";
import { api } from "../../api.ts";
import { Carte } from "../../composants/communs.tsx";
import { euros } from "./graphiques.tsx";

const pctPb = (pb: number | null) => (pb === null ? null : `${(pb / 100).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`);
const heure = (hhmm: string) => hhmm.replace(":", " h ");

function Tuile({ titre, valeur, detail }: { titre: string; valeur: ReactNode; detail?: ReactNode }) {
  return (
    <div className="chiffre-soiree">
      <span className="etiquette">{titre}</span>
      <span className="valeur">{valeur}</span>
      {detail && <span className="cs-detail">{detail}</span>}
    </div>
  );
}

const manque = (texte: string, lien: string, quoi: string) => (
  <span className="manque">
    {texte} <Link to={lien}>{quoi}</Link>
  </span>
);

/**
 * Les chiffres de la soirée (§15.171) : ce que les ventes disent du public et du service. Un chiffre dont la donnée
 * manque le dit, avec le lien où la compléter ; rien n'est supposé.
 */
export function ChiffresSoiree({ d }: { d: Resultats }) {
  const c = d.actuel?.chiffres;
  const cle = d.periode ? `${d.periode.du}:${d.periode.au}` : d.evenement!.id;
  const finances = useQuery({
    queryKey: ["finances", cle],
    queryFn: () => api.get<FinancesSoiree>(d.periode ? `/finances?du=${d.periode.du}&au=${d.periode.au}` : `/finances?evenementId=${d.evenement!.id}`),
  });
  const cheminPertes = d.periode ? `/pertes?du=${d.periode.du}&au=${d.periode.au}` : `/pertes?evenementId=${d.evenement!.id}`;
  const pertes = useQuery({ queryKey: ["pertes", cheminPertes], queryFn: () => api.get<ReponsePertes>(cheminPertes) });
  if (!c) return null;
  const a = d.actuel!;
  const f = finances.data;
  const ruptures = pertes.data?.analyse.perdu.filter((p) => p.famille === "rupture") ?? [];
  const rupture = ruptures.reduce((s, p) => ({ bas: s.bas + p.bas, haut: s.haut + p.haut }), { bas: 0, haut: 0 });
  const sansAffluence = manque("Affluence manquante :", "/parametres/saison", "Saison");
  const cc = c.clickCollect;

  return (
    <Carte titre="Les chiffres de la soirée" description="Ce que les ventes disent du public et du service. Chaque chiffre dit ce qui lui manque.">
      <div className="chiffres-soiree">
        <Tuile
          titre="Spectateurs qui achètent"
          valeur={c.conversion === null ? "—" : pctPb(c.conversion)}
          detail={c.conversion === null ? sansAffluence : `${a.tickets.toLocaleString("fr-FR")} tickets pour ${a.spectateurs!.toLocaleString("fr-FR")} spectateurs`}
        />
        <Tuile titre="Articles par ticket" valeur={c.articlesParTicket === null ? "—" : c.articlesParTicket.toLocaleString("fr-FR")} detail={`${c.articles.toLocaleString("fr-FR")} articles vendus`} />
        <Tuile
          titre="Le moment le plus fort"
          valeur={c.pic ? `${heure(c.pic.debut)} – ${heure(c.pic.fin)}` : "—"}
          detail={
            c.pic
              ? `${pctPb(c.pic.part)} du CA en un quart d'heure (${euros(c.pic.ca)})${c.meilleureMinute ? ` · meilleure minute ${heure(c.meilleureMinute.heure)} : ${euros(c.meilleureMinute.ca)}` : ""}`
              : d.periode
                ? "Pour un événement à la fois"
                : null
          }
        />
        <Tuile
          titre="CA HT par heure de personnel"
          valeur={c.personnel.caHtParHeure === null ? "—" : euros(c.personnel.caHtParHeure)}
          detail={
            c.personnel.heures === 0
              ? manque("Aucune heure au planning :", "/equipe", "Équipe")
              : `${c.personnel.heures.toLocaleString("fr-FR")} h de personnel${c.personnel.partCa !== null ? ` · coût = ${pctPb(c.personnel.partCa)} du CA HT` : " · taux horaire manquant"}`
          }
        />
        <Tuile
          titre="Pertes de stock"
          valeur={!f ? "…" : f.ecartStock === null ? "—" : f.ecartStock >= 0 ? "Aucune" : pctPb(Math.round((-f.ecartStock / Math.max(f.caHt, 1)) * 10_000))}
          detail={
            !f ? null : f.ecartStock === null ? "Stock non compté sur cet événement" : f.ecartStock >= 0 ? "Rien ne manquait au comptage" : `${euros(-f.ecartStock)} manquants au comptage, en % du CA HT`
          }
        />
        <Tuile
          titre="Ventes manquées par rupture"
          valeur={!pertes.data ? "…" : ruptures.length === 0 ? "Aucune" : rupture.bas === rupture.haut ? euros(rupture.haut) : `${euros(rupture.bas)} à ${euros(rupture.haut)}`}
          detail={ruptures.length ? `${ruptures.length} rupture${ruptures.length > 1 ? "s" : ""} chiffrée${ruptures.length > 1 ? "s" : ""} · onglet « Où je perds de l'argent »` : "Estimées au rythme du stand avant la rupture"}
        />
        <Tuile
          titre="Tickets d'abonnés"
          valeur={c.fidelite.part === null ? "—" : pctPb(c.fidelite.part)}
          detail={
            c.fidelite.tickets === 0
              ? "Aucun ticket avec une carte d'abonné"
              : `Panier abonné ${c.fidelite.panierAbonnes === null ? "—" : euros(c.fidelite.panierAbonnes)} contre ${c.fidelite.panierAutres === null ? "—" : euros(c.fidelite.panierAutres)} pour les autres`
          }
        />
        <Tuile
          titre="Boissons / nourriture"
          valeur={c.familles.length ? c.familles.map((x) => `${pctPb(x.partCa)}`).join(" / ") : "—"}
          detail={
            c.familles.length ? (
              <>
                {c.familles
                  .map((x) => `${FAMILLES_CATEGORIE.find((k) => k.cle === x.famille)!.libelle} : ${pctPb(x.partCa)} du CA${x.partMarge !== null ? `, ${pctPb(x.partMarge)} de la marge` : ""}`)
                  .join(" · ")}{" "}
                · <Link to="/parametres/produits">Familles des catégories</Link>
              </>
            ) : null
          }
        />
      </div>

      <h4 className="chiffres-soiree-titre">Click & Collect</h4>
      {cc === null ? (
        <p className="discret" style={{ margin: 0 }}>
          Aucune vente Click & Collect reçue. Dépose l'export de l'application Break Eat dans{" "}
          <Link to="/caisses-connectees">Caisses connectées</Link> (système « Click & Collect (application Break Eat) ») : la part du Click & Collect dans le CA, les tickets et les
          spectateurs s'affichera ici.
        </p>
      ) : (
        <div className="chiffres-soiree">
          <Tuile titre="Part du CA" valeur={pctPb(cc.partCa) ?? "—"} detail={`${euros(cc.ca)} en ${cc.commandes.toLocaleString("fr-FR")} commande${cc.commandes > 1 ? "s" : ""}`} />
          <Tuile titre="Commandes / tickets" valeur={pctPb(cc.partTickets) ?? "—"} detail="Part des commandes Click & Collect dans les tickets de la soirée" />
          <Tuile titre="Spectateurs qui commandent" valeur={cc.conversion === null ? "—" : pctPb(cc.conversion)} detail={cc.conversion === null ? sansAffluence : "Commandes ÷ spectateurs"} />
          <Tuile
            titre="Panier Click & Collect"
            valeur={cc.panier === null ? "—" : euros(cc.panier)}
            detail={cc.panierComptoir === null ? null : `contre ${euros(cc.panierComptoir)} au comptoir`}
          />
        </div>
      )}
    </Carte>
  );
}
