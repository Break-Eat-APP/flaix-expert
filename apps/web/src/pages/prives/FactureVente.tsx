import { Link, useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Printer, ShieldAlert, ShieldCheck } from "lucide-react";
import { formaterMontant, libelleTauxTva, type FactureVente as Donnees } from "@flaix/domain";
import { api } from "../../api.ts";
import { Chargement, MessageErreur } from "../../composants/communs.tsx";

const date = (iso: string) => new Date(iso).toLocaleDateString("fr-FR", { timeZone: "Europe/Paris" });

/** Facture de vente d'un événement privé (§15.160) : un document à imprimer ou à enregistrer en PDF, jamais modifié. */
export function FactureVente() {
  const { id } = useParams();
  const q = useQuery({ queryKey: ["facture-vente", id], queryFn: () => api.get<{ facture: Donnees; evenementId: string; integre: boolean }>(`/factures-vente/${id}`) });
  if (q.isPending) return <Chargement />;
  if (q.error) return <MessageErreur erreur={q.error} />;
  const { facture: f, evenementId, integre } = q.data!;
  return (
    <div className="rapport-page">
      <div className="rapport-outils non-imprime">
        <Link to={`/prives/${evenementId}`} className="btn btn-fantome">
          <ArrowLeft size={15} /> Retour à l'événement
        </Link>
        <span className={`puce ${integre ? "puce-vert" : "puce-rouge"}`}>
          {integre ? <ShieldCheck size={13} /> : <ShieldAlert size={13} />} {integre ? "Contenu intact" : "Contenu modifié depuis l'émission"}
        </span>
        <button className="btn" onClick={() => window.print()}>
          <Printer size={15} /> Imprimer ou enregistrer en PDF
        </button>
      </div>
      <article className="rapport-feuille facture-feuille">
        <header className="rapport-entete">
          <div>
            <div className="rapport-marque">Facture</div>
            <h1>N° {f.numero}</h1>
            <p>Émise le {date(f.emiseLe)}</p>
          </div>
          <div className="rapport-lieu">
            <strong>{f.vendeur.raisonSociale ?? f.vendeur.nom}</strong>
            {f.vendeur.raisonSociale && <span>{f.vendeur.nom}</span>}
            <span>{f.vendeur.adresse}</span>
            <span>SIRET {f.vendeur.siret}</span>
            <span>TVA {f.vendeur.tvaIntracom}</span>
          </div>
        </header>
        <section className="facture-client">
          <span className="discret">Facturé à</span>
          <strong>{f.client.nom}</strong>
          {f.client.adresse && <span>{f.client.adresse}</span>}
          {f.client.siret && <span>SIRET {f.client.siret}</span>}
          {f.client.tvaIntracom && <span>TVA {f.client.tvaIntracom}</span>}
        </section>
        <p style={{ margin: 0 }}>
          <strong>Objet :</strong> {f.objet}
        </p>
        <table className="rapport-tableau">
          <thead>
            <tr>
              <th>Désignation</th>
              <th className="d">Qté</th>
              <th className="d">PU HT</th>
              <th className="d">TVA</th>
              <th className="d">Total HT</th>
            </tr>
          </thead>
          <tbody>
            {f.lignes.map((l, i) => (
              <tr key={i}>
                <td>{l.libelle}</td>
                <td className="d">{l.quantite}</td>
                <td className="d">{formaterMontant(l.prixUnitaireHt)}</td>
                <td className="d">{libelleTauxTva(l.tauxTva)}</td>
                <td className="d">{formaterMontant(l.totalHt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <table className="rapport-tableau facture-totaux">
          <tbody>
            {f.parTaux.map((t) => (
              <tr key={t.taux}>
                <td>TVA {libelleTauxTva(t.taux)} sur {formaterMontant(t.ht)}</td>
                <td className="d">{formaterMontant(t.tva)}</td>
              </tr>
            ))}
            <tr>
              <td>Total HT</td>
              <td className="d">{formaterMontant(f.totalHt)}</td>
            </tr>
            <tr>
              <td>Total TVA</td>
              <td className="d">{formaterMontant(f.totalTva)}</td>
            </tr>
            <tr className="total">
              <td>
                <strong>Total TTC</strong>
              </td>
              <td className="d">
                <strong>{formaterMontant(f.totalTtc)}</strong>
              </td>
            </tr>
          </tbody>
        </table>
        <footer className="rapport-pied">
          {f.mentions.map((m) => (
            <p key={m}>{m}</p>
          ))}
        </footer>
      </article>
    </div>
  );
}
