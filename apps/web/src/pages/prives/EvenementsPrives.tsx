import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { formaterMontant, lireMontant, type EvenementPrive, type ResumePrive } from "@flaix/domain";
import { api, formaterDateHeure } from "../../api.ts";
import { Carte, Chargement, EntetePage, EtatVide, MessageErreur, Regles } from "../../composants/communs.tsx";

const CLASSE_BUDGET = { sans: "", ok: "puce-violet", attention: "puce-ambre", depasse: "puce-rouge" } as const;

/**
 * Événements privés (dossier §15.160) : salons, privatisations, groupes au budget. De la gestion tenue par le directeur
 * — rien ne passe par la caisse.
 */
export function EvenementsPrives() {
  const [creation, setCreation] = useState(false);
  const q = useQuery({ queryKey: ["evenements-prives"], queryFn: () => api.get<ResumePrive[]>("/evenements-prives") });
  if (q.isPending) return <Chargement />;
  if (q.error) return <MessageErreur erreur={q.error} />;
  const liste = q.data!;
  const maintenant = Date.now();
  const aVenir = liste.filter((e) => e.etat === "prevu" && Date.parse(e.debut) >= maintenant - 12 * 3_600_000).reverse();
  const passes = liste.filter((e) => !aVenir.includes(e));
  return (
    <>
      <EntetePage
        titre="Événements privés"
        description="Salons, privatisations et groupes au budget : consommations, frais, ce qu'il te reste et facture. Hors caisse, tenu par le directeur."
        actions={
          <button className="btn" onClick={() => setCreation(!creation)}>
            <Plus size={16} /> Nouvel événement privé
          </button>
        }
      />
      {creation && <Nouveau fermer={() => setCreation(false)} />}
      {liste.length === 0 && !creation ? (
        <Carte>
          <EtatVide titre="Aucun événement privé">Un groupe réserve un salon avec un budget ? Crée sa fiche avec « Nouvel événement privé ».</EtatVide>
        </Carte>
      ) : (
        <>
          {aVenir.length > 0 && <Liste titre="À venir" liste={aVenir} />}
          {passes.length > 0 && <Liste titre="Passés et clôturés" liste={passes} />}
        </>
      )}
      <Regles>
        <ul>
          <li><strong>Hors caisse</strong> : rien ne passe par les tickets ; les Z, clôtures et TVA des buvettes ne bougent pas. Le directeur note lui-même les consommations.</li>
          <li><strong>Consommations</strong> : produits du catalogue au prix en vigueur (modifiable), ou lignes libres (location du salon, service…). <strong>Jauge</strong> : attention dès 80 % du budget, dépassé au-delà.</li>
          <li><strong>Ce qu'il te reste</strong> = CA HT − marchandise (coût matière + conditionnement) − frais (personnel, location, décoration…).</li>
          <li><strong>Clôture</strong> : tout est figé, coûts compris ; seul le règlement se note encore. <strong>Facture</strong> si le client la demande : numérotée en série continue (FP-année-numéro), jamais modifiée.</li>
        </ul>
      </Regles>
    </>
  );
}

function Liste({ titre, liste }: { titre: string; liste: ResumePrive[] }) {
  return (
    <Carte titre={titre}>
      <div className="prives-liste">
        {liste.map((e) => (
          <Link key={e.id} to={`/prives/${e.id}`} className="prive-carte">
            <div>
              <strong>{e.nom}</strong>
              <span className="discret">
                {formaterDateHeure(e.debut)}
                {e.client ? ` · ${e.client}` : ""}
                {e.invites ? ` · ${e.invites} invités` : ""}
              </span>
            </div>
            <div className="prive-chiffres">
              <span className={`puce ${CLASSE_BUDGET[e.niveauBudget]}`}>
                {formaterMontant(e.totalTtc)}
                {e.budget !== null ? ` / ${formaterMontant(e.budget)}` : ""}
              </span>
              {e.etat === "cloture" ? (
                <span className="puce">{e.facture ? `facture ${e.facture}` : "clôturé"}</span>
              ) : (
                <span className="puce puce-vert">prévu</span>
              )}
              {e.etat === "cloture" && !e.regle && <span className="puce puce-ambre">à régler</span>}
            </div>
          </Link>
        ))}
      </div>
    </Carte>
  );
}

function Nouveau({ fermer }: { fermer: () => void }) {
  const naviguer = useNavigate();
  const [nom, setNom] = useState("");
  const [quand, setQuand] = useState("");
  const [invites, setInvites] = useState("");
  const [budget, setBudget] = useState("");
  const [client, setClient] = useState("");
  const [contact, setContact] = useState("");
  const [societe, setSociete] = useState("");
  const [adresse, setAdresse] = useState("");
  const creer = useMutation({
    mutationFn: () =>
      api.post<EvenementPrive>("/evenements-prives", {
        nom: nom.trim(),
        debut: new Date(quand).toISOString(),
        invites: invites.trim() ? Number(invites) : null,
        budget: budget.trim() ? lireMontant(budget) : null,
        clientNom: client.trim() || null,
        clientContact: contact.trim() || null,
        societe: societe.trim() || null,
        adresse: adresse.trim() || null,
      }),
    onSuccess: (e) => naviguer(`/prives/${e.id}`),
  });
  const budgetInvalide = budget.trim() !== "" && lireMontant(budget) === null;
  const invitesInvalide = invites.trim() !== "" && !/^\d{1,5}$/.test(invites.trim());
  return (
    <Carte titre="Nouvel événement privé">
      <form
        onSubmit={(ev) => {
          ev.preventDefault();
          if (nom.trim() && quand && !budgetInvalide && !invitesInvalide) creer.mutate();
        }}
      >
        <div className="grille-champs">
          <label className="champ">
            <span>Nom *</span>
            <input type="text" value={nom} onChange={(ev) => setNom(ev.target.value)} placeholder="Ex. : Bar clandestin" maxLength={120} />
          </label>
          <label className="champ">
            <span>Date et heure *</span>
            <input type="datetime-local" value={quand} onChange={(ev) => setQuand(ev.target.value)} />
          </label>
          <label className="champ">
            <span>Invités</span>
            <input type="text" inputMode="numeric" value={invites} onChange={(ev) => setInvites(ev.target.value)} placeholder="15" />
          </label>
          <label className="champ">
            <span>Budget TTC (€)</span>
            <input type="text" inputMode="decimal" value={budget} onChange={(ev) => setBudget(ev.target.value)} placeholder="1 200" style={{ borderColor: budgetInvalide ? "var(--red)" : undefined }} />
          </label>
          <label className="champ">
            <span>Client (personne)</span>
            <input type="text" value={client} onChange={(ev) => setClient(ev.target.value)} maxLength={120} />
          </label>
          <label className="champ">
            <span>Contact (téléphone ou e-mail)</span>
            <input type="text" value={contact} onChange={(ev) => setContact(ev.target.value)} maxLength={200} />
          </label>
          <label className="champ">
            <span>Société (si facture à son nom)</span>
            <input type="text" value={societe} onChange={(ev) => setSociete(ev.target.value)} maxLength={200} />
          </label>
          <label className="champ">
            <span>Adresse de facturation</span>
            <input type="text" value={adresse} onChange={(ev) => setAdresse(ev.target.value)} maxLength={300} />
          </label>
        </div>
        <MessageErreur erreur={creer.error} />
        <div className="ligne-actions">
          <button className="btn" disabled={!nom.trim() || !quand || budgetInvalide || invitesInvalide || creer.isPending}>
            Créer la fiche
          </button>
          <button type="button" className="btn btn-fantome" onClick={fermer}>
            Annuler
          </button>
        </div>
      </form>
    </Carte>
  );
}
