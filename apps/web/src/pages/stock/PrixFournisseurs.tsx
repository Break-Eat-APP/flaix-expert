import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formaterQuantiteStock, quantiteStockVersMilli, SEUIL_SUR_CONDITIONNEMENT, type ComparaisonArticle, type ComparaisonFournisseurs, type OffreFournisseur } from "@flaix/domain";
import { api } from "../../api.ts";
import { Carte, Chargement, EtatVide, MessageErreur } from "../../composants/communs.tsx";

const dateCourte = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", year: "numeric", timeZone: "Europe/Paris" });
/** Prix à l'unité, à trois décimales (4,500 €/L) : l'écart entre deux fournisseurs se joue souvent au millime. */
const prix3 = (centimes: number) => `${(centimes / 100).toLocaleString("fr-FR", { minimumFractionDigits: 3, maximumFractionDigits: 3 })} €`;
const parUnite = (a: ComparaisonArticle) => (a.unite === null ? "la portion" : a.unite === "piece" ? "la pièce" : a.unite === "l" ? "le litre" : "le kilo");
const quantite = (a: ComparaisonArticle, n: number) => (a.unite ? formaterQuantiteStock(Math.round(n * 1000), a.unite) : `${Math.round(n * 10) / 10} portion${n >= 2 ? "s" : ""}`);
const evts = (n: number) => `${n.toLocaleString("fr-FR")} évt${n >= 2 ? "s" : ""}`;

/** Conditionnement d'un fournisseur : « fût » de « 30 » (L) — renseigné une fois, ici. */
function Colis({ a, o }: { a: ComparaisonArticle; o: OffreFournisseur }) {
  const client = useQueryClient();
  const [ouvert, setOuvert] = useState(false);
  const [libelle, setLibelle] = useState(o.conditionnement?.libelle ?? "");
  const [contenance, setContenance] = useState(o.conditionnement ? String(o.conditionnement.contenance).replace(".", ",") : "");
  const m = useMutation({
    mutationFn: (corps: { libelle: string | null; contenance: number | null }) =>
      api.put<ComparaisonFournisseurs>("/stock/fournisseurs/conditionnement", { [a.cle.startsWith("p:") ? "produitId" : "ingredientId"]: a.cle.slice(2), fournisseur: o.fournisseur, ...corps }),
    onSuccess: (r) => {
      client.setQueryData(["fournisseurs"], r);
      setOuvert(false);
    },
  });
  const lu = a.unite ? quantiteStockVersMilli(contenance) : /^\d+$/.test(contenance.trim()) ? Number(contenance.trim()) : null;
  if (!ouvert)
    return (
      <button className="btn-lien" onClick={() => setOuvert(true)}>
        {o.conditionnement ? `${o.conditionnement.libelle} de ${quantite(a, o.conditionnement.contenance)}` : "Renseigner le colis"}
      </button>
    );
  return (
    <span className="en-ligne" style={{ gap: 6, flexWrap: "wrap" }}>
      <input aria-label="Colis" placeholder="fût, carton…" value={libelle} onChange={(e) => setLibelle(e.target.value)} style={{ width: 90 }} />
      <span className="discret">de</span>
      <input aria-label="Contenance" inputMode="decimal" placeholder={a.unite ? "30" : "24"} value={contenance} onChange={(e) => setContenance(e.target.value)} style={{ width: 60 }} />
      <span className="discret">{a.unite === null ? "portions" : a.unite === "piece" ? "pièces" : a.unite === "l" ? "L" : "kg"}</span>
      <button className="btn" disabled={m.isPending || !libelle.trim() || !lu} onClick={() => m.mutate({ libelle: libelle.trim(), contenance: lu })}>
        Enregistrer
      </button>
      {o.conditionnement && (
        <button className="btn btn-fantome" disabled={m.isPending} onClick={() => m.mutate({ libelle: null, contenance: null })}>
          Retirer
        </button>
      )}
      <MessageErreur erreur={m.error} />
    </span>
  );
}

function Article({ a }: { a: ComparaisonArticle }) {
  const moinsCher = a.offres[0]!;
  return (
    <Carte
      titre={a.nom}
      description={
        a.consommationParEvenement === null
          ? `Prix ${parUnite(a)}. Consommation par événement inconnue (pas encore d'historique) : l'écoulement d'un colis ne se calcule pas.`
          : `Prix ${parUnite(a)}. Consommation moyenne : ${quantite(a, a.consommationParEvenement)} par événement.`
      }
    >
      <div className="scroll-x">
        <table className="tableau">
          <thead>
            <tr>
              <th>Fournisseur</th>
              <th className="d">Prix {parUnite(a)}</th>
              <th className="d">Écart</th>
              <th>Colis</th>
              <th>Écoulement</th>
              <th>Dernier achat</th>
            </tr>
          </thead>
          <tbody>
            {a.offres.map((o, i) => (
              <tr key={o.fournisseur}>
                <td>
                  <strong>{o.fournisseur}</strong> {i === 0 && a.offres.length > 1 && <span className="puce puce-vert">moins cher</span>}
                </td>
                <td className="d chiffre">{prix3(o.prixUnitaire)}</td>
                <td className="d">{o.ecartPct === null ? <span className="discret">—</span> : <span className={`variation ${o.ecartPct > 0.5 ? "baisse" : "neutre"}`}>+{o.ecartPct.toLocaleString("fr-FR")} %</span>}</td>
                <td>
                  <Colis a={a} o={o} />
                </td>
                <td>{o.couvre === null ? <span className="discret">—</span> : <span className={`puce ${o.couvre > SEUIL_SUR_CONDITIONNEMENT ? "puce-ambre" : "puce-violet"}`}>{evts(o.couvre)}</span>}</td>
                <td className="discret">
                  {dateCourte.format(new Date(`${o.dernierAchat}T12:00:00Z`))} · {o.livraisons} livraison{o.livraisons > 1 ? "s" : ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {a.offres.length === 1 && <p className="note">Un seul fournisseur connu pour cet article : rien à comparer pour l'instant.</p>}
      {a.surConditionnement && (
        <div className="message message-alerte">
          Le moins cher {parUnite(a)} ({moinsCher.fournisseur}) vend un {moinsCher.conditionnement!.libelle} qui couvre {evts(moinsCher.couvre!)} de consommation. Sur un produit frais ou un fût entamé, ce qui reste peut coûter plus cher que l'économie faite à l'achat.
        </div>
      )}
    </Carte>
  );
}

/**
 * Comparaison des prix entre fournisseurs (module 5 ; dossier §15.141) : prix unitaire de la dernière livraison
 * chez chaque fournisseur, jamais le prix du colis ; écoulement d'un colis et alerte de sur-conditionnement.
 */
export function PrixFournisseurs() {
  const q = useQuery({ queryKey: ["fournisseurs"], queryFn: () => api.get<ComparaisonFournisseurs>("/stock/fournisseurs") });
  if (q.isPending) return <Chargement />;
  if (q.error) return <MessageErreur erreur={q.error} />;
  const r = q.data!;
  if (r.articles.length === 0)
    return (
      <Carte>
        <EtatVide titre="Aucune livraison avec un prix">La comparaison se construit à partir de tes livraisons (onglet Réserve & livraisons) : produit, quantité, prix et fournisseur.</EtatVide>
      </Carte>
    );
  return (
    <>
      <p className="note" style={{ marginTop: 0 }}>
        Prix à l'unité de ta dernière livraison chez chaque fournisseur, hors taxes. {r.evenementsConsommation ? `Consommation moyenne sur ${r.evenementsConsommation > 1 ? `les ${r.evenementsConsommation} derniers événements clos` : "le dernier événement clos"}.` : "Consommation moyenne : aucun événement clos pour l'instant."} Alerte de sur-conditionnement quand le moins cher vend un colis qui couvre plus de {SEUIL_SUR_CONDITIONNEMENT.toLocaleString("fr-FR")} événement de consommation.
      </p>
      {r.articles.map((a) => (
        <Article key={a.cle} a={a} />
      ))}
    </>
  );
}
