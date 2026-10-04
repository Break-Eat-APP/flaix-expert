import { useState } from "react";
import { Link } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarPlus } from "lucide-react";
import { ROLES_EQUIPE, formaterDuree, formaterMontant, minutesHeure, type Affectation, type Employe, type Evenement, type MasseSalariale, type PlanningMatch, type RoleEquipe, type Stand } from "@flaix/domain";
import { api, formaterDateHeure } from "../../api.ts";
import { Carte, Chargement, EtatVide, MessageErreur } from "../../composants/communs.tsx";

const dateCourte = new Intl.DateTimeFormat("fr-FR", { weekday: "short", day: "numeric", month: "short", timeZone: "Europe/Paris" });
const ETAT = { a_venir: "à venir", ouvert: "en cours", clos: "clos" } as const;
const AUTRE_POSTE = "Autre poste";
const cout = (c: number | null) => (c === null ? <span className="cout-manquant">taux manquant</span> : formaterMontant(c));

/** Position d'une heure sur la frise : avant midi = après minuit (une buvette n'ouvre pas le matin, §15.87). */
const surFrise = (h: string) => {
  const m = minutesHeure(h) ?? 0;
  return m < 12 * 60 ? m + 1440 : m;
};

/**
 * Équipe → Planning (module 14, §15.72, §15.80, §15.87, §15.104) : les affectations d'un événement,
 * prévues puis réelles, avec la frise horaire par stand « d'un coup d'œil ».
 */
export function PlanningVue() {
  const client = useQueryClient();
  const [evenementId, setEvenementId] = useState<string | null>(null);
  const evenements = useQuery({ queryKey: ["evenements"], queryFn: () => api.get<Evenement[]>("/evenements") });
  const planning = useQuery({
    queryKey: ["planning", evenementId],
    queryFn: () => api.get<PlanningMatch | null>(`/planning${evenementId ? `?evenementId=${evenementId}` : ""}`),
    placeholderData: (avant) => avant,
  });
  const stands = useQuery({ queryKey: ["stands"], queryFn: () => api.get<Stand[]>("/stands") });
  const employes = useQuery({ queryKey: ["employes"], queryFn: () => api.get<Employe[]>("/equipe/employes") });
  const mettreAJour = (p: PlanningMatch) => {
    client.setQueryData(["planning", evenementId], p);
    void client.invalidateQueries({ queryKey: ["masse-salariale"] });
  };
  const modifier = useMutation({ mutationFn: ({ id, ...m }: { id: string } & Record<string, unknown>) => api.patch<PlanningMatch>(`/planning/affectations/${id}`, m), onSuccess: mettreAJour });
  const retirer = useMutation({ mutationFn: (id: string) => api.post<PlanningMatch>(`/planning/affectations/${id}/retrait`), onSuccess: mettreAJour });

  if (planning.isPending || evenements.isPending || stands.isPending || employes.isPending) return <Chargement />;
  const erreur = planning.error ?? evenements.error ?? stands.error ?? employes.error;
  if (erreur) return <MessageErreur erreur={erreur} />;
  const p = planning.data;
  if (!p) {
    return (
      <Carte>
        <EtatVide titre="Aucun événement dans la saison">
          Crée d'abord les événements dans <Link to="/parametres/saison">Paramètres → Saison</Link>, puis prépare leur planning ici.
        </EtatVide>
      </Carte>
    );
  }
  const e = p.evenement;
  const tousStands = stands.data!.filter((s) => s.actif);
  const groupes = [...new Set(p.affectations.map((a) => a.standNom ?? AUTRE_POSTE))];
  const evts = [...evenements.data!].sort((a, b) => Date.parse(b.debut) - Date.parse(a.debut));

  return (
    <>
      <Carte
        titre={`Planning — ${e.libelle}`}
        description={`${formaterDateHeure(e.debut)} · événement ${ETAT[e.etat]}`}
        actions={
          <select value={e.id} onChange={(ev) => setEvenementId(ev.target.value)} aria-label="Événement">
            {evts.map((x) => (
              <option key={x.id} value={x.id}>
                {dateCourte.format(new Date(x.debut))} — {x.libelle} ({ETAT[x.etat]})
              </option>
            ))}
          </select>
        }
      >
        {e.etat === "a_venir" && (
          <div className="message message-info" style={{ marginTop: 0 }}>
            Événement à venir : seules les heures prévues ont un sens ici. Les heures réelles restent égales aux prévues jusqu'à ce qu'elles soient corrigées après l'événement.
          </div>
        )}
        <div className="kpis" style={{ marginBottom: 0 }}>
          <div className="kpi">
            <div className="kpi-libelle">Coût réel de l'événement</div>
            <div className="kpi-valeur">{p.masseReelle === null ? "—" : formaterMontant(p.masseReelle)}</div>
          </div>
          <div className="kpi">
            <div className="kpi-libelle">Prévu</div>
            <div className="kpi-valeur">{p.massePrevue === null ? "—" : formaterMontant(p.massePrevue)}</div>
          </div>
          <div className="kpi">
            <div className="kpi-libelle">Salariés</div>
            <div className="kpi-valeur">{formaterMontant(p.salaries)}</div>
          </div>
          <div className="kpi">
            <div className="kpi-libelle">Intérimaires</div>
            <div className="kpi-valeur">{formaterMontant(p.interimaires)}</div>
          </div>
        </div>
        {p.tauxManquants > 0 && (
          <div className="message message-alerte">
            <strong>Taux manquant</strong> sur {p.tauxManquants} affectation{p.tauxManquants > 1 ? "s" : ""} : le coût de l'événement n'est pas calculé. Complète le taux sur la fiche, puis retire et remets l'affectation (le taux est figé à sa création).
          </div>
        )}
      </Carte>

      {p.affectations.length > 0 && <Frise affectations={p.affectations} groupes={groupes} />}

      <Carte titre={`Affectations (${p.affectations.length})`} description="Les heures se corrigent directement dans le tableau ; la correction du réel garde son auteur et son heure.">
        {p.affectations.length === 0 ? (
          <EtatVide titre="Personne n'est encore affecté à cet événement" />
        ) : (
          <div className="scroll-x">
            <table className="tableau planning">
              <thead>
                <tr>
                  <th>Employé</th>
                  <th>Poste</th>
                  <th>Rôle</th>
                  <th>Prévu</th>
                  <th>Réel</th>
                  <th className="d">Coût réel</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {groupes.map((g) => (
                  <Groupe key={g} nom={g} lignes={p.affectations.filter((a) => (a.standNom ?? AUTRE_POSTE) === g)} stands={tousStands} modifier={(id, m) => modifier.mutate({ id, ...m })} retirer={(id) => retirer.mutate(id)} />
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={5}>
                    <strong>Coût réel de l'événement</strong>
                  </td>
                  <td className="d chiffre">
                    <strong>{p.masseReelle === null ? "—" : formaterMontant(p.masseReelle)}</strong>
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
        <MessageErreur erreur={modifier.error ?? retirer.error} />
        <NouvelleAffectation evenementId={e.id} employes={employes.data!.filter((x) => x.actif)} stands={tousStands} apres={mettreAJour} />
      </Carte>
    </>
  );
}

function Groupe({
  nom,
  lignes,
  stands,
  modifier,
  retirer,
}: {
  nom: string;
  lignes: Affectation[];
  stands: Stand[];
  modifier: (id: string, m: Record<string, unknown>) => void;
  retirer: (id: string) => void;
}) {
  return (
    <>
      <tr>
        <td colSpan={7} className="planning-groupe">
          {nom}
        </td>
      </tr>
      {lignes.map((a) => (
        <LigneAffectation key={a.id} a={a} stands={stands} modifier={(m) => modifier(a.id, m)} retirer={() => retirer(a.id)} />
      ))}
    </>
  );
}

/** Heure saisie au clavier : enregistrée à la sortie du champ, seulement si elle a changé. */
function ChampHeure({ valeur, enregistrer, libelle }: { valeur: string; enregistrer: (h: string) => void; libelle: string }) {
  const [texte, setTexte] = useState(valeur);
  const [avant, setAvant] = useState(valeur);
  if (valeur !== avant) {
    setAvant(valeur);
    setTexte(valeur);
  }
  return (
    <input
      type="time"
      className="champ-heure"
      value={texte}
      aria-label={libelle}
      onChange={(e) => setTexte(e.target.value)}
      onBlur={() => {
        if (texte && texte !== valeur && minutesHeure(texte) !== null) enregistrer(texte);
        else setTexte(valeur);
      }}
    />
  );
}

function LigneAffectation({ a, stands, modifier, retirer }: { a: Affectation; stands: Stand[]; modifier: (m: Record<string, unknown>) => void; retirer: () => void }) {
  const [confirmer, setConfirmer] = useState(false);
  const stand = stands.find((s) => s.id === a.standId);
  const ecart = a.minutesReelles - a.minutesPrevues;
  return (
    <tr>
      <td>
        <strong>{a.employeNom}</strong>
        <div className="discret" style={{ fontSize: 11.5 }}>{a.statut === "interimaire" ? `Intérimaire${a.agence ? ` · ${a.agence}` : ""}` : "Salarié"}</div>
      </td>
      <td>
        <div className="empile-champs">
          <select value={a.standId ?? ""} onChange={(e) => modifier({ standId: e.target.value || null })} aria-label="Stand">
            <option value="">{AUTRE_POSTE}</option>
            {stands.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nom}
              </option>
            ))}
          </select>
          <select value={a.caisseId ?? ""} disabled={!stand} onChange={(e) => modifier({ caisseId: e.target.value || null })} aria-label="Caisse">
            <option value="">Sans caisse</option>
            {stand?.caisses
              .filter((k) => k.actif)
              .map((k) => (
                <option key={k.id} value={k.id}>
                  Caisse {k.numero}
                </option>
              ))}
          </select>
        </div>
      </td>
      <td>
        <select value={a.role} onChange={(e) => modifier({ role: e.target.value as RoleEquipe })} aria-label="Rôle">
          {ROLES_EQUIPE.map((r) => (
            <option key={r}>{r}</option>
          ))}
        </select>
      </td>
      <td className="chiffre">
        <div className="empile-champs">
          <ChampHeure valeur={a.debutPrevu} libelle="Début prévu" enregistrer={(h) => modifier({ debutPrevu: h })} />
          <ChampHeure valeur={a.finPrevu} libelle="Fin prévue" enregistrer={(h) => modifier({ finPrevu: h })} />
        </div>
        <div className="discret" style={{ fontSize: 11 }}>{formaterDuree(a.minutesPrevues)}</div>
      </td>
      <td className="chiffre">
        <div className="empile-champs">
          <ChampHeure valeur={a.debutReel} libelle="Début réel" enregistrer={(h) => modifier({ debutReel: h })} />
          <ChampHeure valeur={a.finReel} libelle="Fin réelle" enregistrer={(h) => modifier({ finReel: h })} />
        </div>
        <div className="discret" style={{ fontSize: 11, maxWidth: 130 }}>
          {formaterDuree(a.minutesReelles)}
          {a.correction && <> · corrigé par {a.correction.par} le {formaterDateHeure(a.correction.le)}</>}
        </div>
      </td>
      <td className="d chiffre">
        {cout(a.coutReel)}
        {ecart !== 0 && (
          <div style={{ fontSize: 11, color: "var(--amber)" }}>
            {ecart > 0 ? "+" : "−"}
            {formaterDuree(Math.abs(ecart))} vs prévu
          </div>
        )}
      </td>
      <td className="d">
        {confirmer ? (
          <span className="en-ligne" style={{ gap: 4, flexWrap: "nowrap" }}>
            <button className="btn btn-danger" onClick={retirer}>
              Retirer
            </button>
            <button className="btn btn-fantome" onClick={() => setConfirmer(false)}>
              Non
            </button>
          </span>
        ) : (
          <button className="btn btn-fantome" onClick={() => setConfirmer(true)}>
            Retirer
          </button>
        )}
      </td>
    </tr>
  );
}

function NouvelleAffectation({ evenementId, employes, stands, apres }: { evenementId: string; employes: Employe[]; stands: Stand[]; apres: (p: PlanningMatch) => void }) {
  const [employeId, setEmployeId] = useState("");
  const [standId, setStandId] = useState("");
  const [caisseId, setCaisseId] = useState("");
  const [debut, setDebut] = useState("18:00");
  const [fin, setFin] = useState("23:30");
  const ajouter = useMutation({
    mutationFn: () => api.post<PlanningMatch>("/planning/affectations", { evenementId, employeId, standId: standId || null, caisseId: caisseId || null, debutPrevu: debut, finPrevu: fin }),
    onSuccess: (p) => {
      apres(p);
      setEmployeId("");
    },
  });
  const stand = stands.find((s) => s.id === standId);
  if (employes.length === 0) {
    return (
      <div className="message message-info">
        Aucune fiche employé active : crée d'abord l'équipe dans l'onglet Fiches.
      </div>
    );
  }
  return (
    <form
      className="nouvelle-affectation"
      onSubmit={(e) => {
        e.preventDefault();
        if (employeId) ajouter.mutate();
      }}
    >
      <label className="champ">
        <span>Employé</span>
        <select value={employeId} onChange={(e) => setEmployeId(e.target.value)} required>
          <option value="">Choisir…</option>
          {employes.map((x) => (
            <option key={x.id} value={x.id}>
              {x.nom} — {x.role}
            </option>
          ))}
        </select>
      </label>
      <label className="champ">
        <span>Stand</span>
        <select
          value={standId}
          onChange={(e) => {
            setStandId(e.target.value);
            setCaisseId("");
          }}
        >
          <option value="">{AUTRE_POSTE}</option>
          {stands.map((s) => (
            <option key={s.id} value={s.id}>
              {s.nom}
            </option>
          ))}
        </select>
      </label>
      <label className="champ">
        <span>Caisse</span>
        <select value={caisseId} onChange={(e) => setCaisseId(e.target.value)} disabled={!stand}>
          <option value="">Sans caisse</option>
          {stand?.caisses
            .filter((k) => k.actif)
            .map((k) => (
              <option key={k.id} value={k.id}>
                Caisse {k.numero}
              </option>
            ))}
        </select>
      </label>
      <label className="champ">
        <span>Début prévu</span>
        <input type="time" value={debut} onChange={(e) => setDebut(e.target.value)} required />
      </label>
      <label className="champ">
        <span>Fin prévue</span>
        <input type="time" value={fin} onChange={(e) => setFin(e.target.value)} required />
      </label>
      <button className="btn" disabled={!employeId || ajouter.isPending}>
        <CalendarPlus size={15} /> Affecter
      </button>
      <MessageErreur erreur={ajouter.error} />
    </form>
  );
}

/** Frise horaire par stand : une barre par personne sur ses heures réelles, ambre si corrigées (§15.87). */
function Frise({ affectations, groupes }: { affectations: Affectation[]; groupes: string[] }) {
  const plages = affectations.map((a) => {
    const d = surFrise(a.debutReel);
    return { a, d, f: d + a.minutesReelles };
  });
  const debut = Math.floor(Math.min(...plages.map((x) => x.d)) / 60) * 60;
  const fin = Math.ceil(Math.max(...plages.map((x) => x.f), debut + 60) / 60) * 60;
  const pos = (m: number) => ((m - debut) / (fin - debut)) * 100;
  const heures: number[] = [];
  for (let m = debut; m <= fin; m += 60) heures.push(m);
  return (
    <Carte
      titre="D'un coup d'œil"
      description="Heures réelles, stand par stand."
      actions={
        <div className="leg-inline">
          <span>
            <i className="pastille" style={{ background: "var(--violet)" }} />
            Comme prévu
          </span>
          <span>
            <i className="pastille" style={{ background: "var(--amber)" }} />
            Heures corrigées
          </span>
        </div>
      }
    >
      <div className="scroll-x">
        <div className="frise">
          <div className="frise-ligne frise-axe">
            <span />
            <div className="frise-piste">
              {heures.map((m) => (
                <span key={m} className="frise-heure" style={{ left: `${pos(m)}%` }}>
                  {(m / 60) % 24} h
                </span>
              ))}
            </div>
          </div>
          {groupes.map((g) => (
            <div key={g} className="frise-groupe">
              <div className="frise-titre">{g}</div>
              {plages
                .filter((x) => (x.a.standNom ?? AUTRE_POSTE) === g)
                .map(({ a, d, f }) => (
                  <div key={a.id} className="frise-ligne">
                    <span className="frise-nom">{a.employeNom}</span>
                    <div className="frise-piste">
                      {heures.map((m) => (
                        <span key={m} className="frise-repere" style={{ left: `${pos(m)}%` }} />
                      ))}
                      <span
                        className={`frise-barre${a.correction ? " corrigee" : ""}`}
                        style={{ left: `${pos(d)}%`, width: `${Math.max(pos(f) - pos(d), 0.5)}%` }}
                        title={`${a.employeNom} · ${a.role}${a.caisseNumero ? ` · caisse ${a.caisseNumero}` : ""}\nPrévu ${a.debutPrevu}–${a.finPrevu} · réel ${a.debutReel}–${a.finReel}`}
                      >
                        {a.debutReel}–{a.finReel}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          ))}
        </div>
      </div>
    </Carte>
  );
}

/** Équipe → Masse salariale : la somme du planning, jamais un autre calcul (module 14). */
export function MasseSalarialeVue() {
  const masse = useQuery({ queryKey: ["masse-salariale"], queryFn: () => api.get<MasseSalariale>("/equipe/masse-salariale") });
  if (masse.isPending) return <Chargement />;
  if (masse.error) return <MessageErreur erreur={masse.error} />;
  const m = masse.data!;
  if (m.parMatch.length === 0) {
    return (
      <Carte>
        <EtatVide titre="Aucun planning saisi">La masse salariale se calcule à partir des affectations de l'onglet Planning.</EtatVide>
      </Carte>
    );
  }
  const part = (v: number) => (m.total ? `${Math.round((v / m.total) * 100)} % du total` : "");
  return (
    <>
      <div className="kpis">
        <div className="kpi">
          <div className="kpi-libelle">Masse salariale de la saison</div>
          <div className="kpi-valeur">{formaterMontant(m.total)}</div>
          <div className="aide">sur {m.parMatch.length} événement{m.parMatch.length > 1 ? "s" : ""} planifié{m.parMatch.length > 1 ? "s" : ""}</div>
        </div>
        <div className="kpi">
          <div className="kpi-libelle">Salariés</div>
          <div className="kpi-valeur">{formaterMontant(m.salaries)}</div>
          <div className="aide">{part(m.salaries)}</div>
        </div>
        <div className="kpi">
          <div className="kpi-libelle">Intérimaires</div>
          <div className="kpi-valeur">{formaterMontant(m.interimaires)}</div>
          <div className="aide">{part(m.interimaires)}</div>
        </div>
      </div>
      <Carte titre="Par événement" description="Somme des coûts réels du planning ; une affectation sans taux n'est pas comptée.">
        <div className="scroll-x">
          <table className="tableau">
            <thead>
              <tr>
                <th>Événement</th>
                <th className="d">Affectations</th>
                <th className="d">Salariés</th>
                <th className="d">Intérimaires</th>
                <th className="d">Total réel</th>
              </tr>
            </thead>
            <tbody>
              {m.parMatch.map((x) => (
                <tr key={x.evenement.id}>
                  <td>
                    {dateCourte.format(new Date(x.evenement.debut))} — {x.evenement.libelle}
                    {x.tauxManquants > 0 && (
                      <>
                        {" "}
                        <span className="cout-manquant">{x.tauxManquants} taux manquant{x.tauxManquants > 1 ? "s" : ""}</span>
                      </>
                    )}
                  </td>
                  <td className="d chiffre">{x.affectations}</td>
                  <td className="d chiffre">{formaterMontant(x.salaries)}</td>
                  <td className="d chiffre">{formaterMontant(x.interimaires)}</td>
                  <td className="d chiffre">
                    <strong>{formaterMontant(x.total)}</strong>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Carte>
      <Carte titre="Par rôle">
        <div className="scroll-x">
          <table className="tableau">
            <thead>
              <tr>
                <th>Rôle</th>
                <th className="d">Coût réel cumulé</th>
              </tr>
            </thead>
            <tbody>
              {m.parRole.map((r) => (
                <tr key={r.role}>
                  <td>{r.role}</td>
                  <td className="d chiffre">{formaterMontant(r.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Carte>
    </>
  );
}
