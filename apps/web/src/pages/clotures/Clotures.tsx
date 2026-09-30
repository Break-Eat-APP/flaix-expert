import { useState } from "react";
import { Link } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, ChevronDown, ChevronRight, Lock } from "lucide-react";
import {
  COUPURES_CENTIMES,
  comptageCloturable,
  formaterMontant,
  libelleCoupure,
  lireMontant,
  motifEcartRequis,
  totalCoupures,
  type ClotureMatch,
  type ComptageEspeces,
  type Evenement,
  type SessionACloturer,
} from "@flaix/domain";
import { api, formaterDateHeure } from "../../api.ts";
import { Carte, Chargement, EntetePage, EtatVide, MessageErreur, Regles } from "../../composants/communs.tsx";

type Onglet = "match" | "periode" | "archives";

/**
 * Clôtures (organisation en 6 entrées, dossier §15.96). L'onglet « Clôture du match » est
 * l'assistant en 4 étapes des modules 7 et 10 (§15.102) : ventes, restes, espèces, clôture.
 * Les clôtures de période et les archives arriveront ensuite.
 */
export function Clotures() {
  const evenements = useQuery({ queryKey: ["evenements"], queryFn: () => api.get<Evenement[]>("/evenements"), refetchOnMount: "always" });
  const [onglet, setOnglet] = useState<Onglet>("match");
  const [choisi, setChoisi] = useState<string | null>(null);

  if (evenements.isPending) return <Chargement />;
  if (evenements.error) return <MessageErreur erreur={evenements.error} />;
  const evts = evenements.data!;
  const ouvert = evts.find((e) => e.etat === "ouvert");
  const clos = evts
    .filter((e) => e.etat === "clos")
    .sort((a, b) => new Date(b.closLe ?? b.debut).getTime() - new Date(a.closLe ?? a.debut).getTime());
  const affiche = choisi ?? ouvert?.id ?? null;

  const bouton = (id: Onglet, libelle: string, aVenir = false) => (
    <button className={`onglet${onglet === id ? " actif" : ""}`} onClick={() => setOnglet(id)}>
      {libelle}
      {aVenir && <span className="etiquette-a-venir" style={{ marginLeft: 8 }}>à venir</span>}
    </button>
  );

  return (
    <>
      <EntetePage titre="Clôtures" description="Boucler la soirée, puis le mois et l'année." />
      <div className="onglets">
        {bouton("match", "Clôture du match")}
        {bouton("periode", "Mois & année", true)}
        {bouton("archives", "Archives & contrôle", true)}
      </div>

      {onglet === "match" ? (
        <>
          {affiche ? (
            <Assistant
              evenementId={affiche}
              // Après la clôture, l'écran reste sur le match qui vient d'être clos.
              apresCloture={() => setChoisi(affiche)}
              retour={ouvert && choisi !== null && choisi !== ouvert.id ? () => setChoisi(null) : null}
            />
          ) : (
            <Carte titre="Match en cours">
              <EtatVide titre="Aucun match ouvert">
                Le match du jour s'ouvre dans <Link to="/caisses">Caisses</Link>.
              </EtatVide>
            </Carte>
          )}

          <Carte titre="Matchs clos">
            {clos.length === 0 ? (
              <EtatVide titre="Aucun match clos pour l'instant" />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {clos.map((e) => (
                  <div key={e.id} className="caisse">
                    <div style={{ flex: 1 }}>
                      <strong>{e.libelle}</strong>
                      <div className="discret" style={{ fontSize: 12.5 }}>
                        {formaterDateHeure(e.debut)}
                        {e.closLe && ` · clos le ${formaterDateHeure(e.closLe)}`}
                      </div>
                    </div>
                    <span className="puce puce-violet">Clos</span>
                    <div className="actions">
                      <button className="btn btn-fantome" onClick={() => setChoisi(e.id)}>
                        Voir sa clôture
                      </button>
                      <Link className="btn btn-fantome" to={`/caisses?match=${e.id}&vue=tickets`}>
                        Voir les tickets
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Carte>
        </>
      ) : (
        <Carte>
          <EtatVide titre="Pas encore construit">
            {onglet === "periode"
              ? "Clôtures mensuelle et annuelle : les totaux de la période seront figés et scellés ici."
              : "Archives annuelles et accès d'un vérificateur de l'administration : ils seront préparés ici."}
          </EtatVide>
        </Carte>
      )}

      <Regles>
        <ul>
          <li><strong>Quatre étapes, dans l'ordre</strong> : ventes (toutes les caisses clôturées, chacune depuis sa tablette), restes (comptage du stock, avec le module Stock — pas encore construit, l'étape ne bloque pas), espèces (le Z de chaque tiroir), puis la clôture définitive du match.</li>
          <li><strong>Espèces attendues</strong> = fond de caisse + ventes encaissées en espèces (lues dans le journal de caisse, annulations déduites) − sorties vers le coffre (pas encore saisies : comptées à zéro). <strong>Compté</strong> = somme des coupures saisies. <strong>Écart</strong> = compté − attendu : négatif, il manque de l'argent ; positif, il y en a trop — tout aussi anormal, souvent une vente non enregistrée.</li>
          <li><strong>Compter par coupure</strong>, pas en montant global : c'est ainsi qu'on compte réellement un tiroir, et une erreur de saisie se voit tout de suite.</li>
          <li><strong>Tolérance</strong> (réglage du lieu, Paramètres → Le lieu ; 5,00 € par défaut) : en dessous, aucun motif. Au-delà, <strong>motif obligatoire</strong> (5 caractères au moins) — mais la clôture n'est jamais bloquée.</li>
          <li><strong>Un Z clôturé est définitif</strong> : attribué, horodaté, inscrit au journal technique qui le scelle ; la base refuse toute modification. <strong>Corriger = rectifier</strong> : montant compté rectifié, motif, signature en toutes lettres. La rectification s'ajoute ; le Z d'origine reste affiché inchangé. La notification par e-mail d'une rectification n'est pas encore en service.</li>
          <li><strong>Carte</strong> : une caisse « carte uniquement » n'a pas de tiroir. Son total carte s'affiche pour la comparaison avec le ticket de fin de journée du TPE.</li>
          <li><strong>Clore le match est définitif</strong> : il faut toutes les caisses clôturées et chaque tiroir compté. Le serveur le vérifie lui-même. Chaque étape est inscrite au journal technique.</li>
        </ul>
      </Regles>
    </>
  );
}

const derniereValeur = (s: SessionACloturer): ComptageEspeces | null => s.rectifications.at(-1) ?? s.comptage;

function Assistant({ evenementId, apresCloture, retour }: { evenementId: string; apresCloture: () => void; retour: (() => void) | null }) {
  const client = useQueryClient();
  const cloture = useQuery({ queryKey: ["cloture", evenementId], queryFn: () => api.get<ClotureMatch>(`/clotures?evenementId=${evenementId}`), refetchOnMount: "always" });
  const [confirmer, setConfirmer] = useState(false);
  const clore = useMutation({
    mutationFn: () => api.post<Evenement[]>(`/evenements/${evenementId}/cloture`),
    onSuccess: (l) => {
      apresCloture();
      client.setQueryData(["evenements"], l);
      void client.invalidateQueries({ queryKey: ["cloture", evenementId] });
      void client.invalidateQueries({ queryKey: ["tableau-caisses"] });
      setConfirmer(false);
    },
  });

  if (cloture.isPending) return <Chargement />;
  if (cloture.error) return <MessageErreur erreur={cloture.error} />;
  const c = cloture.data!;
  const e = c.evenement;
  const tiroirs = c.sessions.filter((s) => s.fond !== null);
  const cartes = c.sessions.filter((s) => s.fond === null);
  const closes = c.sessions.filter((s) => s.fermeeLe).length;
  const attendu = tiroirs.reduce((t, s) => t + (s.attendu ?? 0), 0);
  const comptes = tiroirs.filter((s) => s.comptage);
  const compte = comptes.reduce((t, s) => t + derniereValeur(s)!.compte, 0);
  const ecart = comptes.reduce((t, s) => t + derniereValeur(s)!.ecart, 0);
  const estClos = e.etat === "clos";

  const etapes: { titre: string; etat: "fait" | "a_faire" | "a_venir"; detail: string }[] = [
    { titre: "Ventes", etat: c.etapes.ventes ? "fait" : "a_faire", detail: `${closes} / ${c.sessions.length} caisse${c.sessions.length > 1 ? "s" : ""} clôturée${closes > 1 ? "s" : ""}` },
    { titre: "Restes", etat: "a_venir", detail: "avec le module Stock" },
    { titre: "Espèces", etat: c.etapes.especes ? "fait" : "a_faire", detail: tiroirs.length ? `${comptes.length} / ${tiroirs.length} tiroir${tiroirs.length > 1 ? "s" : ""} compté${comptes.length > 1 ? "s" : ""}` : "aucun tiroir" },
    { titre: "Clôture", etat: estClos ? "fait" : "a_faire", detail: estClos ? `close le ${formaterDateHeure(e.closLe!)}` : "définitive" },
  ];

  return (
    <>
      <Carte
        titre={e.libelle}
        description={`${formaterDateHeure(e.debut)} · ${estClos ? "match clos" : "match ouvert"}`}
        actions={
          retour ? (
            <button className="btn btn-fantome" onClick={retour}>
              Revenir au match en cours
            </button>
          ) : undefined
        }
      >
        <ol className="assistant-etapes">
          {etapes.map((x, i) => (
            <li key={x.titre} className={`assistant-etape ${x.etat}`}>
              <span className="assistant-rond">{x.etat === "fait" ? <Check size={14} /> : i + 1}</span>
              <div>
                <strong>{x.titre}</strong>
                <small>{x.etat === "a_venir" ? `à venir — ${x.detail}` : x.detail}</small>
              </div>
            </li>
          ))}
        </ol>
        {c.sessions.length === 0 && <EtatVide titre="Aucune caisse ouverte sur ce match">Il n'y a rien à clôturer côté caisses.</EtatVide>}
      </Carte>

      {c.sessions.length > 0 && (
        <div className="kpis">
          <div className="kpi">
            <div className="kpi-libelle">Caisses clôturées</div>
            <div className="kpi-valeur">{closes} / {c.sessions.length}</div>
          </div>
          <div className="kpi">
            <div className="kpi-libelle">Espèces attendues</div>
            <div className="kpi-valeur">{formaterMontant(attendu)}</div>
          </div>
          <div className="kpi">
            <div className="kpi-libelle">Espèces comptées</div>
            <div className="kpi-valeur">{comptes.length ? formaterMontant(compte) : "—"}</div>
          </div>
          <div className="kpi">
            <div className="kpi-libelle">Écart des tiroirs comptés</div>
            <div className="kpi-valeur" style={{ color: comptes.some((s) => motifEcartRequis(derniereValeur(s)!.ecart, c.seuilEcartEspeces)) ? "var(--red)" : undefined }}>
              {comptes.length ? formaterMontant(ecart) : "—"}
            </div>
          </div>
        </div>
      )}

      {c.sessions.length > 0 && (
        <Carte titre="1. Ventes" description="Lues dans le journal de caisse : rien à saisir. Chaque caisse se clôture depuis sa tablette.">
          <div className="scroll-x">
            <table className="tableau">
              <thead>
                <tr>
                  <th>Caisse</th>
                  <th>Ouverte par</th>
                  <th>État</th>
                  <th className="d">Tickets</th>
                  <th className="d">Total</th>
                  <th className="d">Espèces</th>
                  <th className="d">Carte</th>
                </tr>
              </thead>
              <tbody>
                {c.sessions.map((s) => (
                  <tr key={s.sessionId}>
                    <td>
                      <strong>Caisse {s.caisseNumero}</strong> <span className="discret">· {s.standNom}</span>
                    </td>
                    <td>{s.ouvertePar}</td>
                    <td>{s.fermeeLe ? <span className="puce puce-vert">Clôturée</span> : <span className="puce puce-ambre">Ouverte</span>}</td>
                    <td className="d chiffre">
                      {s.nbVentes}
                      {s.nbAnnulations > 0 && <span className="discret"> ({s.nbAnnulations} ann.)</span>}
                    </td>
                    <td className="d chiffre">{formaterMontant(s.net)}</td>
                    <td className="d chiffre">{s.fond === null ? "—" : formaterMontant(s.especes)}</td>
                    <td className="d chiffre">{formaterMontant(s.carte)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!c.etapes.ventes && (
            <div className="message message-alerte">
              Clôture chaque caisse depuis sa tablette (bouton « Clôturer la caisse »). <Link to={`/caisses?match=${e.id}`}>Voir les caisses</Link>
            </div>
          )}
        </Carte>
      )}

      {c.sessions.length > 0 && (
        <Carte titre="2. Restes">
          <div className="message message-info" style={{ margin: 0 }}>
            Le comptage de ce qui reste (et l'écart avec ce qui devrait rester) arrivera avec le module Stock : il demande la mise en place de chaque stand. En attendant, cette étape ne bloque pas la clôture.
          </div>
        </Carte>
      )}

      {c.sessions.length > 0 && (
        <Carte titre="3. Espèces" description={`Le Z de chaque tiroir : comptage par coupure. Tolérance : ${formaterMontant(c.seuilEcartEspeces)} (au-delà, motif obligatoire).`}>
          {tiroirs.length === 0 ? (
            <EtatVide titre="Aucune caisse n'accepte les espèces sur ce match" />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {tiroirs.map((s) => (
                <Tiroir key={s.sessionId} session={s} seuil={c.seuilEcartEspeces} evenementId={evenementId} matchClos={estClos} />
              ))}
            </div>
          )}
          {cartes.length > 0 && (
            <div className="message message-info">
              <strong>Carte uniquement</strong> (pas de tiroir) :{" "}
              {cartes.map((s) => `caisse ${s.caisseNumero} ${formaterMontant(s.carte)}`).join(" · ")} — à comparer avec le ticket de fin de journée du TPE.
            </div>
          )}
        </Carte>
      )}

      <Carte titre="4. Clôture du match">
        {estClos ? (
          <div className="message message-ok" style={{ margin: 0 }}>
            Match clos le {formaterDateHeure(e.closLe!)}. Ses chiffres sont définitifs ; un Z se corrige encore par une rectification tracée.
          </div>
        ) : (
          <>
            {!c.etapes.cloturable && (
              <div className="message message-alerte" style={{ marginTop: 0 }}>
                {!c.etapes.ventes ? "Il reste des caisses ouvertes." : "Il reste des tiroirs à compter (étape 3)."} La clôture du match sera possible ensuite.
              </div>
            )}
            <div className="ligne-actions">
              {confirmer ? (
                <>
                  <span className="discret" style={{ fontSize: 12.5 }}>Définitif : un match clos ne se rouvre jamais.</span>
                  <button className="btn btn-danger" disabled={clore.isPending} onClick={() => clore.mutate()}>
                    Confirmer la clôture définitive
                  </button>
                  <button className="btn btn-fantome" onClick={() => setConfirmer(false)}>
                    Retour
                  </button>
                </>
              ) : (
                <button className="btn btn-danger" disabled={!c.etapes.cloturable} onClick={() => setConfirmer(true)}>
                  <Lock size={15} /> Clore le match
                </button>
              )}
            </div>
            <MessageErreur erreur={clore.error} />
          </>
        )}
      </Carte>
    </>
  );
}

function Tiroir({ session: s, seuil, evenementId, matchClos }: { session: SessionACloturer; seuil: number; evenementId: string; matchClos: boolean }) {
  const [ouvert, setOuvert] = useState(!s.comptage && !!s.fermeeLe);
  const derniere = derniereValeur(s);
  const hors = derniere ? motifEcartRequis(derniere.ecart, seuil) : false;
  return (
    <div className="tiroir">
      <button className="tiroir-entete" onClick={() => setOuvert(!ouvert)} aria-expanded={ouvert}>
        {ouvert ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
        <strong>Caisse {s.caisseNumero}</strong>
        <span className="discret">{s.standNom}</span>
        <span className="tiroir-chiffres chiffre">
          attendu {formaterMontant(s.attendu ?? 0)}
          {derniere && (
            <>
              {" "}· compté {formaterMontant(derniere.compte)} · écart{" "}
              <strong style={{ color: hors ? "var(--red)" : derniere.ecart !== 0 ? "var(--amber)" : undefined }}>{formaterMontant(derniere.ecart)}</strong>
            </>
          )}
        </span>
        {s.comptage ? (
          <span className="puce puce-vert">Z clos</span>
        ) : !s.fermeeLe ? (
          <span className="puce puce-ambre">Caisse ouverte</span>
        ) : (
          <span className="puce">À compter</span>
        )}
      </button>
      {ouvert &&
        (s.comptage ? (
          <ZClos session={s} evenementId={evenementId} />
        ) : !s.fermeeLe ? (
          <div className="message message-alerte">Clôture d'abord cette caisse depuis sa tablette : on compte le tiroir une fois la caisse fermée.</div>
        ) : matchClos ? (
          <div className="message message-alerte">Ce match est clos sans Z pour ce tiroir (clôture antérieure à l'assistant).</div>
        ) : (
          <Comptage session={s} seuil={seuil} evenementId={evenementId} />
        ))}
    </div>
  );
}

function Comptage({ session: s, seuil, evenementId }: { session: SessionACloturer; seuil: number; evenementId: string }) {
  const client = useQueryClient();
  const [saisie, setSaisie] = useState<Record<string, string>>({});
  const [motif, setMotif] = useState("");
  const [confirmer, setConfirmer] = useState(false);
  const coupures: Record<string, number> = {};
  for (const v of COUPURES_CENTIMES) {
    const n = Number.parseInt(saisie[String(v)] ?? "", 10);
    if (Number.isFinite(n) && n > 0) coupures[String(v)] = n;
  }
  const compte = totalCoupures(coupures);
  const attendu = s.attendu ?? 0;
  const ecart = compte - attendu;
  const requis = motifEcartRequis(ecart, seuil);
  const pret = comptageCloturable(ecart, seuil, motif);
  const clore = useMutation({
    mutationFn: () => api.post<ClotureMatch>(`/sessions-caisse/${s.sessionId}/comptage`, { coupures, motif: motif.trim() || null }),
    onSuccess: (c) => client.setQueryData(["cloture", evenementId], c),
  });

  return (
    <div className="tiroir-corps">
      <div className="coupures">
        {COUPURES_CENTIMES.map((v) => {
          const n = coupures[String(v)] ?? 0;
          return (
            <label key={v} className="coupure">
              <span className="coupure-libelle">{libelleCoupure(v)}</span>
              <input
                type="text"
                inputMode="numeric"
                value={saisie[String(v)] ?? ""}
                onChange={(ev) => {
                  setConfirmer(false);
                  setSaisie({ ...saisie, [String(v)]: ev.target.value.replace(/\D/g, "").slice(0, 6) });
                }}
                placeholder="0"
                aria-label={`Nombre de ${libelleCoupure(v)}`}
              />
              <span className="coupure-total chiffre">{n ? formaterMontant(v * n) : ""}</span>
            </label>
          );
        })}
      </div>
      <div className="tiroir-bilan">
        <div>
          <div className="bilan-ligne"><span>Fond de caisse</span><span className="chiffre">{formaterMontant(s.fond ?? 0)}</span></div>
          <div className="bilan-ligne"><span>Ventes en espèces (nettes)</span><span className="chiffre">{formaterMontant(s.especes)}</span></div>
          <div className="bilan-ligne fort"><span>Attendu</span><span className="chiffre">{formaterMontant(attendu)}</span></div>
          <div className="bilan-ligne fort"><span>Compté</span><span className="chiffre">{formaterMontant(compte)}</span></div>
          <div className="bilan-ligne fort">
            <span>Écart</span>
            <span className="chiffre" style={{ color: requis ? "var(--red)" : ecart !== 0 ? "var(--amber)" : undefined }}>{formaterMontant(ecart)}</span>
          </div>
        </div>
        <div>
          {requis ? (
            <label className="champ">
              <span style={{ color: "var(--red)" }}>Motif obligatoire — écart de {formaterMontant(Math.abs(ecart))}</span>
              <textarea value={motif} onChange={(ev) => setMotif(ev.target.value)} rows={3} maxLength={500} placeholder="Ce qui s'est passé : erreur de rendu, billet non trouvé, vente non enregistrée…" />
              <small className="aide">Enregistré avec le Z, ton nom et l'heure. La clôture reste possible.</small>
            </label>
          ) : (
            <div className="message message-info" style={{ margin: 0 }}>
              Écart dans la tolérance de {formaterMontant(seuil)} : aucun motif demandé.
            </div>
          )}
        </div>
      </div>
      <MessageErreur erreur={clore.error} />
      <div className="ligne-actions">
        {confirmer ? (
          <>
            <span className="discret" style={{ fontSize: 12.5 }}>Définitif : un Z ne se modifie plus, il se rectifie.</span>
            <button className="btn" disabled={clore.isPending} onClick={() => clore.mutate()}>
              Confirmer le Z : {formaterMontant(compte)} compté
            </button>
            <button className="btn btn-fantome" onClick={() => setConfirmer(false)}>
              Retour
            </button>
          </>
        ) : (
          <button className="btn" disabled={!pret} onClick={() => setConfirmer(true)}>
            <Lock size={15} /> Clôturer le Z
          </button>
        )}
      </div>
    </div>
  );
}

function ZClos({ session: s, evenementId }: { session: SessionACloturer; evenementId: string }) {
  const client = useQueryClient();
  const z = s.comptage!;
  const [rectifier, setRectifier] = useState(false);
  const [montant, setMontant] = useState("");
  const [motif, setMotif] = useState("");
  const [signature, setSignature] = useState("");
  const compte = lireMontant(montant);
  const envoyer = useMutation({
    mutationFn: () => api.post<ClotureMatch>(`/comptages/${z.id}/rectification`, { compte, motif: motif.trim(), signature: signature.trim() }),
    onSuccess: (c) => {
      client.setQueryData(["cloture", evenementId], c);
      setRectifier(false);
      setMontant("");
      setMotif("");
      setSignature("");
    },
  });
  const coupures = Object.entries(z.coupures)
    .sort((a, b) => Number(b[0]) - Number(a[0]))
    .map(([v, n]) => `${n} × ${libelleCoupure(Number(v))}`)
    .join(" · ");

  return (
    <div className="tiroir-corps">
      <div className="z-clos">
        <Lock size={16} />
        <div>
          <strong>Z clôturé — définitif</strong>
          <div className="discret" style={{ fontSize: 12.5, marginTop: 2 }}>
            Par {z.par} le {formaterDateHeure(z.le)}. Attendu {formaterMontant(z.attendu)} (fond {formaterMontant(z.fond)} + espèces {formaterMontant(z.especes)}), compté {formaterMontant(z.compte)}, écart <strong>{formaterMontant(z.ecart)}</strong>.
          </div>
          {z.motif && <div style={{ fontSize: 12.5, marginTop: 4 }}>Motif : « {z.motif} »</div>}
          {coupures && <div className="aide" style={{ marginTop: 4 }}>{coupures}</div>}
          {s.rectifications.length > 0 && (
            <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid var(--border)" }}>
              {s.rectifications.map((r) => (
                <div key={r.id} style={{ fontSize: 12.5, marginTop: 4 }}>
                  → Rectification du {formaterDateHeure(r.le)} par {r.par} : compté {formaterMontant(r.compte)}, écart <strong>{formaterMontant(r.ecart)}</strong> — « {r.motif} » — signé {r.signature}
                </div>
              ))}
              <div className="aide" style={{ marginTop: 4 }}>Le Z d'origine reste inchangé : une rectification s'ajoute, elle ne remplace rien.</div>
            </div>
          )}
        </div>
      </div>
      {rectifier ? (
        <form
          className="rectification"
          onSubmit={(ev) => {
            ev.preventDefault();
            envoyer.mutate();
          }}
        >
          <div className="grille-champs">
            <label className="champ">
              <span>Montant compté rectifié</span>
              <input type="text" inputMode="decimal" value={montant} onChange={(ev) => setMontant(ev.target.value)} placeholder="0,00" aria-invalid={montant.trim() !== "" && compte === null} />
            </label>
            <label className="champ">
              <span>Signature — prénom et nom en toutes lettres</span>
              <input type="text" value={signature} onChange={(ev) => setSignature(ev.target.value)} maxLength={120} />
            </label>
          </div>
          <label className="champ" style={{ marginTop: 10 }}>
            <span>Motif de la rectification</span>
            <textarea value={motif} onChange={(ev) => setMotif(ev.target.value)} rows={2} maxLength={500} placeholder="Pourquoi le Z doit être corrigé, sur quelle constatation" />
          </label>
          <MessageErreur erreur={envoyer.error} />
          <div className="ligne-actions">
            <button className="btn" disabled={compte === null || motif.trim().length < 5 || signature.trim().length < 3 || envoyer.isPending}>
              Enregistrer la rectification
            </button>
            <button type="button" className="btn btn-fantome" onClick={() => setRectifier(false)}>
              Annuler
            </button>
          </div>
        </form>
      ) : (
        <div className="ligne-actions">
          <button className="btn btn-fantome" onClick={() => setRectifier(true)}>
            Rectifier ce Z
          </button>
        </div>
      )}
    </div>
  );
}
