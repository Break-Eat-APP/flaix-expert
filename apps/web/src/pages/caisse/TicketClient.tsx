import { useState } from "react";
import { Printer, ReceiptText, X } from "lucide-react";
import { formaterMontant, libelleTauxTva, type EditionTicket, type TicketVue } from "@flaix/domain";
import { api, formaterDateHeure } from "../../api.ts";
import { MessageErreur } from "../../composants/communs.tsx";
import { useSession } from "../../session.tsx";

/**
 * Ticket client, édité par le directeur à la demande du client (dossier §15.99) : aucune caisse
 * n'imprime. Chaque édition est inscrite au journal technique ; à partir de la 2e, « DUPLICATA ».
 */
export function BoutonTicketClient({ ticket }: { ticket: TicketVue }) {
  const [edition, setEdition] = useState<EditionTicket | null>(null);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<unknown>(null);

  async function editer() {
    setEnCours(true);
    setErreur(null);
    try {
      setEdition(await api.post<EditionTicket>(`/tickets/${ticket.id}/edition`));
    } catch (e) {
      setErreur(e);
    } finally {
      setEnCours(false);
    }
  }

  return (
    <>
      <div className="en-ligne" style={{ marginTop: 8 }}>
        <button className="btn btn-fantome" disabled={enCours} onClick={() => void editer()}>
          <ReceiptText size={15} /> Ticket client
        </button>
        <span className="aide">Sur demande du client. Chaque édition est inscrite au journal ; à partir de la 2e, le ticket porte « DUPLICATA ».</span>
      </div>
      <MessageErreur erreur={erreur} />
      {edition && <FenetreTicket edition={edition} fermer={() => setEdition(null)} />}
    </>
  );
}

function FenetreTicket({ edition, fermer }: { edition: EditionTicket; fermer: () => void }) {
  const { lieu } = edition;
  const incomplet = !lieu.raisonSociale || !lieu.adresse || !lieu.siret;
  return (
    <div className="voile" role="dialog" aria-modal="true" aria-label="Ticket client">
      <div className="fenetre-ticket">
        {incomplet && (
          <div className="message message-alerte non-imprime">
            Identité du lieu incomplète : raison sociale, adresse et SIRET doivent figurer sur le ticket. Complète-les dans Paramètres → Le lieu.
          </div>
        )}
        <Ticket edition={edition} />
        <div className="ligne-actions non-imprime" style={{ justifyContent: "center" }}>
          <button className="btn" onClick={() => window.print()}>
            <Printer size={15} /> Imprimer
          </button>
          <button className="btn btn-fantome" onClick={fermer}>
            <X size={15} /> Fermer
          </button>
        </div>
      </div>
    </div>
  );
}

function Ticket({ edition }: { edition: EditionTicket }) {
  const session = useSession().data;
  const environnement = session?.environnement;
  // Mode formation (BOFiP §150, test B3) : la mention est imprimée sur le justificatif, en tête et en pied.
  const factice = session?.formation ? <div className="ticket-centre ticket-essai">FACTICE — MODE FORMATION · SANS VALEUR</div> : null;
  const { lieu, ticket: t } = edition;
  const annulation = t.type === "annulation";
  const ligne = (gauche: string, droite: string, fort = false) => (
    <div className="ticket-ligne" style={fort ? { fontWeight: 800 } : undefined}>
      <span>{gauche}</span>
      <span className="chiffre">{droite}</span>
    </div>
  );
  return (
    <div className="ticket-impression">
      {factice}
      {environnement !== "production" && <div className="ticket-centre ticket-essai">TICKET D'ESSAI — SANS VALEUR</div>}
      <div className="ticket-centre">
        <strong>{lieu.raisonSociale ?? lieu.nom}</strong>
        {lieu.raisonSociale && lieu.raisonSociale !== lieu.nom && <div>{lieu.nom}</div>}
        {lieu.adresse && <div>{lieu.adresse}</div>}
        {(lieu.codePostal || lieu.ville) && <div>{[lieu.codePostal, lieu.ville].filter(Boolean).join(" ")}</div>}
        {lieu.siret && <div>SIRET {lieu.siret}</div>}
        {lieu.tvaIntracom && <div>TVA {lieu.tvaIntracom}</div>}
      </div>
      <hr />
      {edition.edition > 1 && <div className="ticket-centre ticket-duplicata">DUPLICATA n° {edition.edition - 1}</div>}
      <div className="ticket-centre">
        <strong>{annulation ? "ANNULATION" : "Ticket"} {t.numeroJustificatif}</strong>
        {annulation && t.lie && <div>du ticket {t.lie.numeroJustificatif}</div>}
        <div>
          {formaterDateHeure(t.horodatage)} · Caisse {t.caisseNumero} · {t.standNom}
        </div>
        <div>Servi par {t.operateur}</div>
      </div>
      <hr />
      {t.lignes.map((l, i) => (
        <div key={i}>
          {ligne(`${l.quantite} × ${l.libelle}`, formaterMontant(l.brut))}
          <div className="ticket-detail">
            {formaterMontant(l.prixUnitaire)} l'unité · TVA {libelleTauxTva(l.tauxTva)}
          </div>
        </div>
      ))}
      {t.remise !== 0 && ligne(t.motif === "abonne" ? "Remise abonné" : "Remise", `− ${formaterMontant(Math.abs(t.remise))}`)}
      {t.offert !== 0 && ligne("Offert", `− ${formaterMontant(Math.abs(t.offert))}`)}
      {t.fidelite?.codePromo && ligne(`Code ${t.fidelite.codePromo.code}`, `− ${formaterMontant(t.fidelite.codePromo.montant)}`)}
      {t.fidelite?.points && ligne(`Points fidélité (${t.fidelite.points.points})`, `− ${formaterMontant(t.fidelite.points.montant)}`)}
      <hr />
      {ligne("TOTAL TTC", formaterMontant(t.totalTtc), true)}
      {ligne(t.modeReglement === "especes" ? "Espèces" : "Carte bancaire", formaterMontant(t.montantDonne ?? t.totalTtc))}
      {t.rendu !== null && t.rendu !== 0 && ligne("Rendu", formaterMontant(t.rendu))}
      <hr />
      <div className="ticket-tva">
        <span>Taux</span>
        <span>HT</span>
        <span>TVA</span>
        <span>TTC</span>
        {t.ventilation.map((v) => (
          <FragmentTva key={v.tauxTva} taux={libelleTauxTva(v.tauxTva)} ht={v.ht} tva={v.tva} ttc={v.ttc} />
        ))}
      </div>
      <hr />
      <div className="ticket-centre ticket-detail">
        Édité le {formaterDateHeure(edition.editeLe)} à la demande du client
        <br />
        Empreinte {t.empreinte.slice(0, 16)}…
      </div>
      {factice}
    </div>
  );
}

function FragmentTva({ taux, ht, tva, ttc }: { taux: string; ht: number; tva: number; ttc: number }) {
  return (
    <>
      <span>{taux}</span>
      <span className="chiffre">{formaterMontant(ht)}</span>
      <span className="chiffre">{formaterMontant(tva)}</span>
      <span className="chiffre">{formaterMontant(ttc)}</span>
    </>
  );
}
