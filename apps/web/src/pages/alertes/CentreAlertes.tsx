import { useState } from "react";
import { Link } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BellRing, Radio } from "lucide-react";
import { formaterMontant, lireMontant, montantPourSaisie, type AlerteCentre, type CentreAlertes as Centre, type LigneMercuriale } from "@flaix/domain";
import { api, formaterDateHeure } from "../../api.ts";
import { Carte, Chargement, EntetePage, EtatVide, MessageErreur, Regles } from "../../composants/communs.tsx";
import { useSession } from "../../session.tsx";

const SOURCE: Record<AlerteCentre["source"], string> = { en_direct: "En direct", lue: "Lue", calculee: "Calculée ici" };
const pct = (pb: number) => `${pb > 0 ? "+" : pb < 0 ? "−" : ""}${(Math.abs(pb) / 100).toLocaleString("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} %`;
const unite = (l: LigneMercuriale) => (l.unite === null ? "par portion" : l.unite === "piece" ? "la pièce" : l.unite === "l" ? "le litre" : "le kilo");

function Liste({ alertes }: { alertes: AlerteCentre[] }) {
  return (
    <div className="alertes-liste">
      {alertes.map((a) => (
        <div key={a.id} className={`alerte-ligne${a.niveau === "forte" ? " forte" : ""}`}>
          <div className="en-ligne" style={{ justifyContent: "space-between", gap: 10, alignItems: "baseline" }}>
            <strong>{a.titre}</strong>
            {a.impact !== null && <strong className="chiffre" style={{ whiteSpace: "nowrap" }}>{formaterMontant(a.impact)}</strong>}
          </div>
          <span>
            {a.detail} <Link to={a.lien}>Voir</Link> · <em>{SOURCE[a.source]}</em>
          </span>
        </div>
      ))}
    </div>
  );
}

/** Prix de référence d'une ligne : saisi ici et nulle part ailleurs (module 18). */
function LigneReference({ l, formation }: { l: LigneMercuriale; formation: boolean }) {
  const client = useQueryClient();
  const [saisie, setSaisie] = useState(l.reference === null ? "" : montantPourSaisie(l.reference));
  const m = useMutation({
    mutationFn: (prix: number | null) => api.put<Centre>("/alertes/mercuriale", { [l.type === "produit" ? "produitId" : "ingredientId"]: l.id, prix }),
    onSuccess: (c) => client.setQueryData(["alertes"], c),
  });
  const lu = saisie.trim() === "" ? null : lireMontant(saisie);
  const valide = saisie.trim() === "" || (lu !== null && lu > 0);
  const change = valide && lu !== l.reference;
  return (
    <tr>
      <td>
        {l.nom} <span className="discret">{l.type === "ingredient" ? "· ingrédient" : ""}</span>
      </td>
      <td className="d chiffre">{l.coutActuel === null ? <span className="cout-manquant">coût manquant</span> : `${formaterMontant(l.coutActuel)} ${unite(l)}`}</td>
      <td className="d">
        <input
          className="champ-montant"
          inputMode="decimal"
          aria-label={`Prix de référence de ${l.nom}`}
          value={saisie}
          disabled={formation || m.isPending}
          placeholder="—"
          onChange={(e) => setSaisie(e.target.value)}
          onBlur={() => change && m.mutate(lu)}
          onKeyDown={(e) => e.key === "Enter" && change && m.mutate(lu)}
          style={{ width: 90, textAlign: "right" }}
        />
      </td>
      <td className="d">{l.ecartPb === null ? <span className="discret">—</span> : <span className={`variation ${l.ecartPb >= 1_000 ? "baisse" : "neutre"}`}>{pct(l.ecartPb)}</span>}</td>
      <td className="discret" style={{ fontSize: 12 }}>
        {l.saisiPar ? `${l.saisiPar} · ${formaterDateHeure(l.saisiLe!)}` : ""}
        {!valide && <span className="texte-ambre">Montant à vérifier</span>}
        <MessageErreur erreur={m.error} />
      </td>
    </tr>
  );
}

/**
 * Centre d'alertes (module 18 ; dossier §15.140) : ce qui mérite l'attention du directeur — en direct, lu dans
 * les autres modules, ou calculé ici (marge configurée, prix fournisseur, mercuriale). Il ne corrige rien.
 */
export function CentreAlertes() {
  const formation = !!useSession().data?.formation;
  const q = useQuery({ queryKey: ["alertes"], queryFn: () => api.get<Centre>("/alertes") });
  if (q.isPending) return <Chargement />;
  if (q.error) return <MessageErreur erreur={q.error} />;
  const c = q.data!;
  const direct = c.alertes.filter((a) => a.source === "en_direct");
  const autres = c.alertes.filter((a) => a.source !== "en_direct");
  const fortes = c.alertes.filter((a) => a.niveau === "forte").length;

  return (
    <>
      <EntetePage
        fil="Résultats"
        filLien="/"
        titre="Centre d'alertes"
        description={`${c.alertes.length} alerte${c.alertes.length > 1 ? "s" : ""}${fortes ? `, dont ${fortes} forte${fortes > 1 ? "s" : ""}` : ""}. Chaque alerte mène à l'écran où agir : ici, rien ne se corrige.`}
        actions={
          <Link className="btn btn-fantome" to="/parametres/notifications">
            <BellRing size={15} /> Sur mon téléphone
          </Link>
        }
      />
      {c.evenementEnCours && (
        <Carte titre={`En ce moment : ${c.evenementEnCours.libelle}`} actions={<Link className="btn" to="/direct"><Radio size={15} /> En direct</Link>}>
          {direct.length ? <Liste alertes={direct} /> : <div className="discret" style={{ fontSize: 12.5 }}>Aucune rupture ni stock faible pour l'instant (produits dont le stock est suivi).</div>}
        </Carte>
      )}
      <Carte
        titre="À regarder"
        description={c.dernierEvenement ? `Les alertes lues portent sur le dernier événement clos : ${c.dernierEvenement.libelle}. Les autres portent sur tes prix, coûts et livraisons d'aujourd'hui.` : "Aucun événement clos pour l'instant : seules tes fiches et tes livraisons sont examinées."}
      >
        {autres.length ? <Liste alertes={autres} /> : <EtatVide titre="Rien à signaler">Aucune marge sous sa cible, aucune hausse de prix fournisseur, aucun écart à ta mercuriale.</EtatVide>}
      </Carte>
      <div id="mercuriale" />
      <Carte
        titre="Mercuriale : tes prix de référence"
        description={`Le prix d'achat que tu juges normal, produit par produit (HT). Alerte quand le coût actuel le dépasse de ${c.seuils.mercurialePb / 100} % ou plus. Laisse vide pour ne pas suivre un produit.`}
      >
        {c.mercuriale.length === 0 ? (
          <EtatVide titre="Aucun produit">Crée d'abord ton catalogue dans Paramètres → Produits & prix.</EtatVide>
        ) : (
          <div className="scroll-x">
            <table className="tableau">
              <thead>
                <tr>
                  <th>Produit ou ingrédient</th>
                  <th className="d">Coût actuel</th>
                  <th className="d">Référence</th>
                  <th className="d">Écart</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {c.mercuriale.map((l) => (
                  <LigneReference key={`${l.cle}:${l.reference ?? ""}`} l={l} formation={formation} />
                ))}
              </tbody>
            </table>
          </div>
        )}
        {formation && <p className="note">Mode formation : la mercuriale est celle du vrai lieu, en lecture seule.</p>}
      </Carte>
      <Regles>
        <ul>
          <li><strong>En direct</strong> : ruptures (stock à zéro) et stocks faibles (15 % de la mise en place ou moins) de l'événement ouvert, lus dans Stock. Elles arrivent aussi sur ton téléphone (Paramètres → Notifications).</li>
          <li><strong>Lues</strong> (dernier événement clos) : marge réalisée sous sa cible (Résultats → Marges) ; pertes de stock, manques d'espèces et tickets vendus sous le tarif (Où je perds de l'argent) ; prix de l'application de commande qui ne couvre pas la marge du comptoir (Click & Collect).</li>
          <li><strong>Calculées ici</strong> : marge au prix et au coût actuels sous la cible (avant toute vente) ; prix d'une livraison qui s'écarte de {c.seuils.variationFournisseurPb / 100} % ou plus de la livraison précédente du même produit chez le même fournisseur ; coût actuel au-dessus de ta référence de {c.seuils.mercurialePb / 100} % ou plus.</li>
          <li><strong>Seuils</strong> : {c.seuils.variationFournisseurPb / 100} % et {c.seuils.mercurialePb / 100} % sont des valeurs de départ, à ajuster quand on aura du recul sur le terrain.</li>
          <li><strong>Impact</strong> : en euros quand il se chiffre (écart par vente × ventes du dernier événement, écart de prix × quantité livrée, perte constatée).</li>
        </ul>
      </Regles>
    </>
  );
}
