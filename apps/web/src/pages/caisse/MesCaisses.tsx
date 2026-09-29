import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, ChevronRight, ShieldCheck } from "lucide-react";
import { formaterMontant, libelleTauxTva, MOTIFS_AJUSTEMENT, type Evenement, type StatsCaisse, type TicketVue, type VerificationCaisses } from "@flaix/domain";
import { api, formaterDateHeure } from "../../api.ts";
import { Carte, Chargement, EntetePage, EtatVide, MessageErreur, Regles } from "../../composants/communs.tsx";

const ETAT = { a_venir: "à venir", ouvert: "ouvert", clos: "clos" } as const;

/** Match affiché par défaut : celui qui est ouvert, sinon le plus récent déjà commencé, sinon le premier. */
function matchParDefaut(evts: Evenement[]): string | null {
  return (evts.find((e) => e.etat === "ouvert") ?? evts.find((e) => e.etat === "clos") ?? evts[0])?.id ?? null;
}

export function MesCaisses() {
  const [params, setParams] = useSearchParams();
  const evenements = useQuery({ queryKey: ["evenements"], queryFn: () => api.get<Evenement[]>("/evenements") });
  const [onglet, setOnglet] = useState<"caisses" | "tickets">(params.get("vue") === "tickets" ? "tickets" : "caisses");

  if (evenements.isPending) return <Chargement />;
  if (evenements.error) return <MessageErreur erreur={evenements.error} />;
  const evts = evenements.data!;
  const evenementId = params.get("match") && evts.some((e) => e.id === params.get("match")) ? params.get("match")! : matchParDefaut(evts);
  const evt = evts.find((e) => e.id === evenementId);

  return (
    <>
      <EntetePage
        titre="Mes caisses"
        description="Toutes les caisses du lieu, en direct, et les tickets du match choisi."
        actions={
          evts.length > 0 && (
            <label className="champ" style={{ minWidth: 260 }}>
              <span>Match</span>
              <select value={evenementId ?? ""} onChange={(e) => setParams({ match: e.target.value, vue: onglet })}>
                {evts.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.libelle} — {formaterDateHeure(e.debut)} ({ETAT[e.etat]})
                  </option>
                ))}
              </select>
            </label>
          )
        }
      />
      {evts.length === 0 ? (
        <Carte>
          <EtatVide titre="Aucun match dans le calendrier">
            Crée un match dans <Link to="/configuration/matchs">Configuration → Calendrier des matchs</Link>, ouvre-le, puis ouvre une caisse.
          </EtatVide>
        </Carte>
      ) : (
        <>
          {evt && evt.etat !== "ouvert" && (
            <div className="message message-info">
              Ce match est {ETAT[evt.etat]}. {evt.etat === "a_venir" ? "Les caisses s'ouvriront quand tu l'auras ouvert dans le calendrier." : "Ses chiffres sont définitifs."}
            </div>
          )}
          <div className="onglets">
            <button className={`onglet${onglet === "caisses" ? " actif" : ""}`} onClick={() => { setOnglet("caisses"); setParams({ match: evenementId ?? "", vue: "caisses" }); }}>
              Mes caisses
            </button>
            <button className={`onglet${onglet === "tickets" ? " actif" : ""}`} onClick={() => { setOnglet("tickets"); setParams({ match: evenementId ?? "", vue: "tickets" }); }}>
              Détail des tickets — toutes caisses
            </button>
          </div>
          {evenementId && (onglet === "caisses" ? <TableauCaisses evenementId={evenementId} /> : <JournalTickets evenementId={evenementId} matchOuvert={evt?.etat === "ouvert"} />)}
        </>
      )}
      <Regles>
        <ul>
          <li><strong>Mes caisses</strong> : pour chaque caisse, sur le match choisi, le nombre de tickets, le chiffre d'affaires net (ventes moins annulations), le panier moyen (CA net ÷ tickets non annulés), la part espèces et carte, et l'heure du dernier ticket. L'état « ouverte » est en direct, quel que soit le match affiché.</li>
          <li><strong>Détail des tickets</strong> : tous les tickets du match, toutes caisses confondues, en lecture seule. Filtres par stand, caisse, opérateur, mode de règlement, n° de justificatif ou produit.</li>
          <li><strong>Annuler un ticket</strong> : le ticket d'origine n'est jamais modifié ni supprimé ; un ticket d'annulation, de montant opposé, le référence, avec son motif et son auteur. Possible seulement tant que la caisse du ticket est ouverte : après sa clôture, une correction passe par une rectification tracée.</li>
          <li><strong>Vérifier l'intégrité</strong> : relit la chaîne de chaque caisse dans son ordre réel d'enregistrement (jamais dans l'ordre d'affichage) et contrôle chaque empreinte. Toute modification, suppression ou insertion frauduleuse est localisée à l'événement près.</li>
        </ul>
      </Regles>
    </>
  );
}

function TableauCaisses({ evenementId }: { evenementId: string }) {
  const stats = useQuery({ queryKey: ["tableau-caisses", evenementId], queryFn: () => api.get<StatsCaisse[]>(`/caisses/tableau?evenementId=${evenementId}`), refetchInterval: 15_000 });
  const verification = useMutation({ mutationFn: () => api.post<VerificationCaisses>("/caisses/verification") });

  if (stats.isPending) return <Chargement />;
  if (stats.error) return <MessageErreur erreur={stats.error} />;
  const liste = stats.data!;
  if (liste.length === 0) {
    return (
      <Carte>
        <EtatVide titre="Aucune caisse">Crée tes stands et leurs caisses dans <Link to="/configuration/stands">Gestion des stands & caisses</Link>.</EtatVide>
      </Carte>
    );
  }
  const caNet = liste.reduce((s, k) => s + k.caNet, 0);
  const tickets = liste.reduce((s, k) => s + k.nbVentes - k.nbAnnulations, 0);
  const ouvertes = liste.filter((k) => k.ouverteMaintenant).length;
  const parStand = [...new Map(liste.map((k) => [k.standId, k.standNom])).entries()];
  const v = verification.data;

  return (
    <>
      <div className="kpis">
        <div className="kpi">
          <div className="kpi-valeur">{ouvertes}</div>
          <div className="kpi-libelle">caisse{ouvertes > 1 ? "s" : ""} ouverte{ouvertes > 1 ? "s" : ""} en ce moment</div>
        </div>
        <div className="kpi">
          <div className="kpi-valeur">{tickets}</div>
          <div className="kpi-libelle">tickets sur ce match</div>
        </div>
        <div className="kpi">
          <div className="kpi-valeur">{formaterMontant(caNet)}</div>
          <div className="kpi-libelle">CA net TTC sur ce match</div>
        </div>
        <div className="kpi">
          <div className="kpi-valeur" style={{ fontSize: 15 }}>
            {v ? (v.ok ? <span className="puce puce-vert">Intègre</span> : <span className="puce puce-rouge">Anomalie</span>) : <span className="discret">non vérifiée</span>}
          </div>
          <div className="kpi-libelle">
            <button className="btn-lien" onClick={() => verification.mutate()} disabled={verification.isPending}>
              <ShieldCheck size={13} /> Vérifier l'intégrité des chaînes
            </button>
          </div>
        </div>
      </div>
      <MessageErreur erreur={verification.error} />
      {v && !v.ok && (
        <div className="message message-erreur">
          Anomalie sur {v.caisses.filter((k) => !k.ok).map((k) => `la caisse ${k.numero} (événement n° ${k.rupture?.sequence})`).join(", ")}. Préviens l'éditeur.
        </div>
      )}
      {parStand.map(([standId, standNom]) => {
        const caisses = liste.filter((k) => k.standId === standId);
        return (
          <Carte key={standId} titre={standNom} description={`${caisses.length} caisse${caisses.length > 1 ? "s" : ""} · ${formaterMontant(caisses.reduce((s, k) => s + k.caNet, 0))}`}>
            <div className="liste">
              <div className="liste-entete" style={{ gridTemplateColumns: COL }}>
                <span>Caisse</span>
                <span>État</span>
                <span>Tickets</span>
                <span>CA net TTC</span>
                <span>Panier moyen</span>
                <span>Espèces / carte</span>
                <span>Dernier ticket</span>
                <span />
              </div>
              {caisses.map((k) => (
                <div key={k.caisseId} className={`liste-ligne${k.actif ? "" : " inactive"}`} style={{ gridTemplateColumns: COL }}>
                  <strong>
                    Caisse {k.numero}
                    {k.nom ? <span className="discret"> · {k.nom}</span> : null}
                  </strong>
                  <span>
                    <span className="cellule-libelle">État</span>
                    {k.ouverteMaintenant ? (
                      <span className="puce puce-vert" title={`Ouverte par ${k.ouverteMaintenant.par} le ${formaterDateHeure(k.ouverteMaintenant.depuis)} — ${k.ouverteMaintenant.evenementLibelle}`}>
                        Ouverte
                      </span>
                    ) : (
                      <span className="puce">{k.actif ? "Fermée" : "Désactivée"}</span>
                    )}
                  </span>
                  <span className="chiffre">
                    <span className="cellule-libelle">Tickets</span>
                    {k.nbVentes}
                    {k.nbAnnulations > 0 && <span className="discret"> ({k.nbAnnulations} annulé{k.nbAnnulations > 1 ? "s" : ""})</span>}
                  </span>
                  <strong className="chiffre">
                    <span className="cellule-libelle">CA net TTC</span>
                    {formaterMontant(k.caNet)}
                  </strong>
                  <span className="chiffre">
                    <span className="cellule-libelle">Panier moyen</span>
                    {k.panierMoyen !== null ? formaterMontant(k.panierMoyen) : "—"}
                  </span>
                  <span className="chiffre">
                    <span className="cellule-libelle">Espèces / carte</span>
                    {k.especesAutorisees ? formaterMontant(k.especes) : "—"} / {formaterMontant(k.carte)}
                  </span>
                  <span>
                    <span className="cellule-libelle">Dernier ticket</span>
                    {k.dernierTicket ? formaterDateHeure(k.dernierTicket) : "—"}
                  </span>
                  <span>
                    {k.actif && (
                      <Link className={k.ouverteMaintenant ? "btn" : "btn btn-fantome"} to={`/caisses/${k.caisseId}`}>
                        {k.ouverteMaintenant ? "Écran de caisse" : "Ouvrir"}
                      </Link>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </Carte>
        );
      })}
    </>
  );
}
const COL = "minmax(110px,1.4fr) minmax(70px,0.8fr) minmax(60px,0.7fr) minmax(90px,1fr) minmax(80px,0.9fr) minmax(100px,1.1fr) minmax(95px,1fr) auto";

const COL_TICKETS = "minmax(150px,1.4fr) minmax(110px,1fr) minmax(90px,0.9fr) minmax(70px,0.7fr) minmax(90px,1fr) minmax(80px,0.8fr) minmax(95px,0.9fr) 20px";

function JournalTickets({ evenementId, matchOuvert }: { evenementId: string; matchOuvert: boolean }) {
  const tickets = useQuery({ queryKey: ["tickets", evenementId], queryFn: () => api.get<TicketVue[]>(`/tickets?evenementId=${evenementId}`) });
  const [filtres, setFiltres] = useState({ stand: "", caisse: "", operateur: "", mode: "", texte: "" });
  const [ouvert, setOuvert] = useState<string | null>(null);

  const liste = tickets.data ?? [];
  const options = useMemo(
    () => ({
      stands: [...new Map(liste.map((t) => [t.standId, t.standNom]))],
      caisses: [...new Map(liste.map((t) => [t.caisseId, `Caisse ${t.caisseNumero}`]))],
      operateurs: [...new Set(liste.map((t) => t.operateur))],
    }),
    [liste],
  );
  const texte = filtres.texte.trim().toLocaleLowerCase("fr");
  const filtres2 = liste.filter(
    (t) =>
      (!filtres.stand || t.standId === filtres.stand) &&
      (!filtres.caisse || t.caisseId === filtres.caisse) &&
      (!filtres.operateur || t.operateur === filtres.operateur) &&
      (!filtres.mode || t.modeReglement === filtres.mode) &&
      (!texte || t.numeroJustificatif.toLocaleLowerCase("fr").includes(texte) || t.lignes.some((l) => l.libelle.toLocaleLowerCase("fr").includes(texte))),
  );

  if (tickets.isPending) return <Chargement />;
  if (tickets.error) return <MessageErreur erreur={tickets.error} />;

  const champ = (cle: keyof typeof filtres, libelle: string, choix: [string, string][]) => (
    <label className="champ" style={{ flex: "1 1 150px" }}>
      <span>{libelle}</span>
      <select value={filtres[cle]} onChange={(e) => setFiltres({ ...filtres, [cle]: e.target.value })}>
        <option value="">Tous</option>
        {choix.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </label>
  );

  return (
    <Carte titre={`Tickets (${filtres2.length})`} description="Clique un ticket pour voir ses lignes, sa remise ou son offert, sa TVA et son empreinte.">
      {liste.length === 0 ? (
        <EtatVide titre="Aucun ticket sur ce match" />
      ) : (
        <>
          <div className="en-ligne" style={{ marginBottom: 12, alignItems: "flex-end" }}>
            {champ("stand", "Stand", options.stands)}
            {champ("caisse", "Caisse", options.caisses)}
            {champ("operateur", "Opérateur", options.operateurs.map((o) => [o, o]))}
            {champ("mode", "Règlement", [
              ["especes", "Espèces"],
              ["carte", "Carte"],
            ])}
            <label className="champ" style={{ flex: "1 1 200px" }}>
              <span>N° de justificatif ou produit</span>
              <input type="search" value={filtres.texte} onChange={(e) => setFiltres({ ...filtres, texte: e.target.value })} placeholder="ex. 2026-C1-… ou hot dog" />
            </label>
          </div>
          <div className="liste">
            <div className="liste-entete" style={{ gridTemplateColumns: COL_TICKETS }}>
              <span>Justificatif</span>
              <span>Stand · caisse</span>
              <span>Opérateur</span>
              <span>Règlement</span>
              <span>Ajustement</span>
              <span>Total TTC</span>
              <span>Heure</span>
              <span />
            </div>
            {filtres2.map((t) => (
              <div key={t.id}>
                <div className="liste-ligne cliquable" style={{ gridTemplateColumns: COL_TICKETS }} onClick={() => setOuvert(ouvert === t.id ? null : t.id)}>
                  <strong className="chiffre">
                    {t.numeroJustificatif}{" "}
                    {t.type === "annulation" && <span className="puce puce-rouge">Annulation</span>}
                    {t.type === "vente" && t.lie && <span className="puce puce-ambre">Annulé</span>}
                  </strong>
                  <span>
                    {t.standNom} <span className="discret">· C{t.caisseNumero}</span>
                  </span>
                  <span>{t.operateur}</span>
                  <span>{t.modeReglement === "especes" ? "Espèces" : "Carte"}</span>
                  <span>
                    {t.type === "vente" && t.remise > 0 && <span className="puce puce-ambre">Remise {t.motif === "abonne" ? "abonné" : ""}</span>}{" "}
                    {t.type === "vente" && t.offert > 0 && <span className="puce puce-ambre">Offert</span>}
                    {t.type === "vente" && t.remise === 0 && t.offert === 0 && <span className="discret">—</span>}
                  </span>
                  <strong className="chiffre">{formaterMontant(t.totalTtc)}</strong>
                  <span className="chiffre">{formaterDateHeure(t.horodatage)}</span>
                  <span className="discret">{ouvert === t.id ? <ChevronDown size={15} /> : <ChevronRight size={15} />}</span>
                </div>
                {ouvert === t.id && <DetailTicket ticket={t} matchOuvert={matchOuvert} evenementId={evenementId} />}
              </div>
            ))}
          </div>
        </>
      )}
    </Carte>
  );
}

function DetailTicket({ ticket: t, matchOuvert, evenementId }: { ticket: TicketVue; matchOuvert: boolean; evenementId: string }) {
  const client = useQueryClient();
  const [motif, setMotif] = useState("");
  const [annuler, setAnnuler] = useState(false);
  const annulation = useMutation({
    mutationFn: () => api.post<TicketVue>(`/tickets/${t.id}/annulation`, { motif }),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["tickets", evenementId] });
      client.invalidateQueries({ queryKey: ["tableau-caisses", evenementId] });
      setAnnuler(false);
    },
  });
  const motifLibelle = t.motif && t.motif in MOTIFS_AJUSTEMENT ? MOTIFS_AJUSTEMENT[t.motif as keyof typeof MOTIFS_AJUSTEMENT].libelle : t.motif;

  return (
    <div className="detail" style={{ fontSize: 12.5 }}>
      {t.type === "annulation" && t.lie && (
        <div className="message message-alerte">
          Annule le ticket <strong>{t.lie.numeroJustificatif}</strong> — motif : {t.motifTexte}
        </div>
      )}
      {t.lignes.map((l, i) => (
        <div key={i} className="en-ligne" style={{ justifyContent: "space-between", padding: "3px 0" }}>
          <span>
            {l.quantite} × {l.libelle} ({formaterMontant(l.prixUnitaire)}, TVA {libelleTauxTva(l.tauxTva)})
          </span>
          {/* Montant brut de la ligne : la remise et l'offert sont détaillés juste en dessous, puis le total. */}
          <strong className="chiffre">{formaterMontant(l.brut)}</strong>
        </div>
      ))}
      {t.remise !== 0 && (
        <div className="en-ligne" style={{ justifyContent: "space-between", color: "var(--amber)" }}>
          <span>
            Remise{motifLibelle && t.type === "vente" ? ` — ${motifLibelle}` : ""}
            {t.reference ? ` (n° ${t.reference})` : ""}
          </span>
          <span className="chiffre">− {formaterMontant(Math.abs(t.remise))}</span>
        </div>
      )}
      {t.offert !== 0 && (
        <div className="en-ligne" style={{ justifyContent: "space-between", color: "var(--amber)" }}>
          <span>
            Offert{motifLibelle && t.type === "vente" ? ` — ${motifLibelle}` : ""}
            {t.motifTexte && t.type === "vente" ? ` : ${t.motifTexte}` : ""}
          </span>
          <span className="chiffre">− {formaterMontant(Math.abs(t.offert))}</span>
        </div>
      )}
      <div className="en-ligne" style={{ justifyContent: "space-between", padding: "4px 0", borderTop: "1px solid var(--border)", marginTop: 4 }}>
        <strong>Total TTC</strong>
        <strong className="chiffre">{formaterMontant(t.totalTtc)}</strong>
      </div>
      <div className="aide" style={{ marginTop: 6 }}>
        TVA : {t.ventilation.map((v) => `${libelleTauxTva(v.tauxTva)} ${formaterMontant(v.tva)} sur ${formaterMontant(v.ht)} HT`).join(" · ")}
        {t.montantDonne !== null && ` · Donné ${formaterMontant(t.montantDonne)}, rendu ${formaterMontant(t.rendu ?? 0)}`}
      </div>
      <div className="empreinte" style={{ marginTop: 6 }}>Empreinte {t.empreinte}</div>
      {t.type === "vente" && t.lie && <div className="message message-info">Annulé par le ticket {t.lie.numeroJustificatif}.</div>}
      {t.type === "vente" && !t.lie && matchOuvert && (
        <div style={{ marginTop: 10 }}>
          {annuler ? (
            <div className="en-ligne" style={{ alignItems: "flex-end" }}>
              <label className="champ" style={{ flex: "1 1 260px" }}>
                <span>Motif de l'annulation (obligatoire)</span>
                <input type="text" value={motif} onChange={(e) => setMotif(e.target.value)} maxLength={200} autoFocus />
              </label>
              <button className="btn btn-danger" disabled={motif.trim().length < 3 || annulation.isPending} onClick={() => annulation.mutate()}>
                Confirmer l'annulation
              </button>
              <button className="btn btn-fantome" onClick={() => setAnnuler(false)}>
                Retour
              </button>
            </div>
          ) : (
            <button className="btn btn-danger" onClick={() => setAnnuler(true)}>
              Annuler ce ticket
            </button>
          )}
          <MessageErreur erreur={annulation.error} />
        </div>
      )}
    </div>
  );
}
