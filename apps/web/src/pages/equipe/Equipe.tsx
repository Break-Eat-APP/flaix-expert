import { useState, type FormEvent } from "react";
import { Link } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { KeyRound, Tablet, UserPlus } from "lucide-react";
import { ROLES_EQUIPE, formaterMontant, lireMontant, montantPourSaisie, type AppareilCaisse, type Employe, type EmployeCree, type RoleEquipe } from "@flaix/domain";
import { api, formaterDateHeure } from "../../api.ts";
import { Carte, Chargement, EntetePage, EtatVide, MessageErreur, Regles } from "../../composants/communs.tsx";
import { MasseSalarialeVue, PlanningVue } from "./Planning.tsx";
import { useOptions } from "../../session.tsx";

type Onglet = "fiches" | "planning" | "masse" | "tablettes";
const heure = new Intl.DateTimeFormat("fr-FR", { timeStyle: "short", timeZone: "Europe/Paris" });
const libelleStatut = (e: Pick<Employe, "statut" | "agence">) => (e.statut === "interimaire" ? `Intérimaire${e.agence ? ` · ${e.agence}` : ""}` : "Salarié");

/**
 * Équipe (organisation en 6 entrées, dossier §15.95) : fiches employés et leur accès caisse
 * (§15.100, §15.104), planning par événement, masse salariale, tablettes enregistrées comme caisse.
 */
export function Equipe() {
  const [onglet, setOnglet] = useState<Onglet>("fiches");
  const options = useOptions();
  const bouton = (id: Onglet, libelle: string) => (
    <button className={`onglet${onglet === id ? " actif" : ""}`} onClick={() => setOnglet(id)}>
      {libelle}
    </button>
  );
  return (
    <>
      <EntetePage titre="Équipe" description="Qui travaille, où, et combien ça coûte." />
      <div className="onglets">
        {bouton("fiches", "Fiches")}
        {options.equipe && bouton("planning", "Planning")}
        {options.equipe && bouton("masse", "Masse salariale")}
        {bouton("tablettes", "Tablettes")}
      </div>
      {onglet === "fiches" ? <Fiches /> : onglet === "planning" ? <PlanningVue /> : onglet === "masse" ? <MasseSalarialeVue /> : <Tablettes />}
      <Regles>
        <ul>
          <li><strong>Fiche employé</strong> : nom, statut (salarié ou intérimaire et son agence), rôle habituel, <strong>taux horaire</strong> — coût horaire chargé pour un salarié, taux facturé par l'agence pour un intérimaire. Un employé ne se supprime pas : il devient inactif, son nom et son taux restent sur les événements passés.</li>
          <li><strong>Accès caisse</strong> (facultatif) : un code personnel à 4 chiffres, affiché une seule fois, qui ne fonctionne que sur une tablette enregistrée comme caisse. La personne ne voit que l'écran de vente de cette caisse, jamais les coûts ni les salaires. 5 codes faux bloquent l'accès 15 minutes ; un nouveau code le débloque. Désactiver la fiche coupe l'accès.</li>
          <li><strong>Planning</strong> : chaque affectation place un employé sur un événement, à un stand et une caisse (ou un autre poste), avec des heures <strong>prévues</strong>. Les heures <strong>réelles</strong> valent les prévues tant qu'elles ne sont pas corrigées ; une correction garde son auteur et son heure. Une fin avant le début = après minuit.</li>
          <li><strong>Coût</strong> = durée réelle × taux horaire. Le taux est <strong>figé sur l'affectation</strong> à sa création : changer le taux d'une fiche ne réécrit pas les événements déjà planifiés. Sans taux : « taux manquant », jamais zéro.</li>
          <li><strong>Masse salariale</strong> = somme des coûts réels du planning, par événement, par statut, par rôle. Elle est déduite dans Résultats → Finances.</li>
          <li><strong>Tablettes</strong> : sur la tablette du stand, connecte-toi avec ton e-mail, ouvre Caisses → la caisse, puis « Enregistrer cet appareil ». Retirer une tablette déconnecte les caissières qui y sont.</li>
          <li><strong>Mettre en formation</strong> : toute caissière qui se connecte sur la tablette vend alors en factice, dans le lieu d'entraînement (Paramètres → Mode formation) ; la caissière connectée est déconnectée. Pas possible pendant que la vraie caisse est ouverte.</li>
          <li>Chaque création, modification, accès donné ou retiré, affectation, correction d'heures et retrait est inscrit au journal technique.</li>
        </ul>
      </Regles>
    </>
  );
}

function CodeRemis({ remis, fermer }: { remis: { nom: string; code: string }; fermer: () => void }) {
  return (
    <div className="code-remis" role="status">
      <span className="code">{remis.code}</span>
      <p>
        Code de caisse de <strong>{remis.nom}</strong>. Donne-le-lui maintenant : <strong>il ne sera plus jamais affiché</strong>.
      </p>
      <button className="btn" onClick={fermer}>
        C'est noté
      </button>
    </div>
  );
}

interface Brouillon {
  nom: string;
  statut: "salarie" | "interimaire";
  agence: string;
  role: RoleEquipe;
  taux: string;
  acces: boolean;
}
const VIDE: Brouillon = { nom: "", statut: "salarie", agence: "", role: "Caissier", taux: "", acces: false };
const versBrouillon = (e: Employe): Brouillon => ({ nom: e.nom, statut: e.statut, agence: e.agence ?? "", role: e.role, taux: e.tauxHoraire === null ? "" : montantPourSaisie(e.tauxHoraire), acces: false });

function ChampsFiche({ b, changer, avecAcces }: { b: Brouillon; changer: (b: Brouillon) => void; avecAcces: boolean }) {
  const tauxInvalide = b.taux.trim() !== "" && lireMontant(b.taux) === null;
  return (
    <div className="grille-champs">
      <label className="champ">
        <span>Nom *</span>
        <input type="text" value={b.nom} onChange={(e) => changer({ ...b, nom: e.target.value })} maxLength={60} placeholder="Prénom et initiale (ex. Julie B.)" required />
      </label>
      <label className="champ">
        <span>Statut</span>
        <select value={b.statut} onChange={(e) => changer({ ...b, statut: e.target.value as Brouillon["statut"] })}>
          <option value="salarie">Salarié</option>
          <option value="interimaire">Intérimaire</option>
        </select>
      </label>
      {b.statut === "interimaire" && (
        <label className="champ">
          <span>Agence</span>
          <input type="text" value={b.agence} onChange={(e) => changer({ ...b, agence: e.target.value })} maxLength={80} />
        </label>
      )}
      <label className="champ">
        <span>Rôle habituel</span>
        <select value={b.role} onChange={(e) => changer({ ...b, role: e.target.value as RoleEquipe })}>
          {ROLES_EQUIPE.map((r) => (
            <option key={r}>{r}</option>
          ))}
        </select>
      </label>
      <label className="champ">
        <span>{b.statut === "interimaire" ? "Taux facturé par l'agence (€/h)" : "Coût horaire chargé (€/h)"}</span>
        <input type="text" inputMode="decimal" value={b.taux} onChange={(e) => changer({ ...b, taux: e.target.value })} placeholder="ex. 17,40" aria-invalid={tauxInvalide} />
        <small className="aide">Vide = taux manquant (coût non calculé).</small>
      </label>
      {avecAcces && (
        <label className="champ" style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <input type="checkbox" checked={b.acces} onChange={(e) => changer({ ...b, acces: e.target.checked })} />
          <span style={{ fontSize: 13, color: "var(--text)" }}>Accès caisse (code personnel)</span>
        </label>
      )}
    </div>
  );
}

function corpsFiche(b: Brouillon) {
  return {
    nom: b.nom.trim(),
    statut: b.statut,
    agence: b.statut === "interimaire" ? b.agence.trim() || null : null,
    role: b.role,
    tauxHoraire: b.taux.trim() === "" ? null : lireMontant(b.taux),
  };
}

function Fiches() {
  const client = useQueryClient();
  const fiches = useQuery({ queryKey: ["employes"], queryFn: () => api.get<Employe[]>("/equipe/employes") });
  const [nouveau, setNouveau] = useState<Brouillon>(VIDE);
  const [remis, setRemis] = useState<{ nom: string; code: string } | null>(null);
  const [edition, setEdition] = useState<{ id: string; b: Brouillon } | null>(null);
  const actualiser = () => client.invalidateQueries({ queryKey: ["employes"] });
  const apresCode = (r: EmployeCree | { caissiere: { nom: string }; code: string }) => {
    const nom = "employe" in r ? r.employe.nom : r.caissiere.nom;
    if (r.code) setRemis({ nom, code: r.code });
    void actualiser();
  };

  const creer = useMutation({
    mutationFn: (b: Brouillon) => api.post<EmployeCree>("/equipe/employes", { ...corpsFiche(b), accesCaisse: b.acces }),
    onSuccess: (r) => {
      apresCode(r);
      setNouveau(VIDE);
    },
  });
  const modifier = useMutation({
    mutationFn: ({ id, ...m }: { id: string } & Record<string, unknown>) => api.patch<Employe[]>(`/equipe/employes/${id}`, m),
    onSuccess: (l) => {
      client.setQueryData(["employes"], l);
      setEdition(null);
    },
  });
  const donnerAcces = useMutation({ mutationFn: (id: string) => api.post<EmployeCree>(`/equipe/employes/${id}/acces`), onSuccess: apresCode });
  const nouveauCode = useMutation({
    mutationFn: (caissiereId: string) => api.post<{ caissiere: { nom: string }; code: string }>(`/equipe/caissieres/${caissiereId}/code`),
    onSuccess: apresCode,
  });
  const retirerAcces = useMutation({
    mutationFn: (id: string) => api.post<Employe[]>(`/equipe/employes/${id}/acces/retrait`),
    onSuccess: (l) => client.setQueryData(["employes"], l),
  });

  function ajouter(e: FormEvent) {
    e.preventDefault();
    if (nouveau.nom.trim()) creer.mutate(nouveau);
  }

  if (fiches.isPending) return <Chargement />;
  if (fiches.error) return <MessageErreur erreur={fiches.error} />;
  const liste = fiches.data!;
  const erreur = creer.error ?? modifier.error ?? donnerAcces.error ?? nouveauCode.error ?? retirerAcces.error;

  return (
    <>
      {remis && <CodeRemis remis={remis} fermer={() => setRemis(null)} />}
      <Carte titre="Nouvelle fiche" description="Une fiche par personne qui travaille les soirs d'événement.">
        <form onSubmit={ajouter}>
          <ChampsFiche b={nouveau} changer={setNouveau} avecAcces />
          <div className="ligne-actions">
            <button className="btn" disabled={!nouveau.nom.trim() || creer.isPending}>
              <UserPlus size={15} /> Ajouter
            </button>
          </div>
        </form>
      </Carte>
      <MessageErreur erreur={erreur} />
      <Carte titre={`Équipe (${liste.filter((e) => e.actif).length} active${liste.filter((e) => e.actif).length > 1 ? "s" : ""})`}>
        {liste.length === 0 ? (
          <EtatVide titre="Aucune fiche">Ajoute la première personne de l'équipe ci-dessus.</EtatVide>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {liste.map((e) =>
              edition?.id === e.id ? (
                <form
                  key={e.id}
                  className="carte"
                  style={{ margin: 0, background: "var(--childbg)" }}
                  onSubmit={(ev) => {
                    ev.preventDefault();
                    modifier.mutate({ id: e.id, ...corpsFiche(edition.b) });
                  }}
                >
                  <ChampsFiche b={edition.b} changer={(b) => setEdition({ id: e.id, b })} avecAcces={false} />
                  <div className="ligne-actions">
                    <button className="btn" disabled={modifier.isPending || !edition.b.nom.trim()}>
                      Enregistrer
                    </button>
                    <button type="button" className="btn btn-fantome" onClick={() => setEdition(null)}>
                      Annuler
                    </button>
                  </div>
                </form>
              ) : (
                <div key={e.id} className="caisse" style={e.actif ? undefined : { opacity: 0.6 }}>
                  <div style={{ minWidth: 150 }}>
                    <strong>{e.nom}</strong>
                    <div className="discret" style={{ fontSize: 12 }}>
                      {libelleStatut(e)} · {e.role}
                    </div>
                  </div>
                  <span className="chiffre" style={{ fontSize: 13 }}>
                    {e.tauxHoraire === null ? <span className="cout-manquant">taux manquant</span> : `${formaterMontant(e.tauxHoraire)} / h`}
                  </span>
                  {!e.actif ? (
                    <span className="puce">Inactive</span>
                  ) : !e.acces?.actif ? (
                    <span className="puce">Sans accès caisse</span>
                  ) : e.acces.bloqueeJusqua ? (
                    <span className="puce puce-rouge">Code bloqué jusqu'à {heure.format(new Date(e.acces.bloqueeJusqua))}</span>
                  ) : (
                    <span className="puce puce-vert" title={e.acces.derniereConnexion ? `Dernière connexion ${formaterDateHeure(e.acces.derniereConnexion)}` : "Jamais connectée"}>
                      Accès caisse
                    </span>
                  )}
                  <div className="actions">
                    {e.actif && (
                      <>
                        <button className="btn btn-fantome" onClick={() => setEdition({ id: e.id, b: versBrouillon(e) })}>
                          Modifier
                        </button>
                        {e.acces?.actif ? (
                          <>
                            <button className="btn btn-fantome" disabled={nouveauCode.isPending} onClick={() => nouveauCode.mutate(e.acces!.caissiereId)}>
                              <KeyRound size={14} /> Nouveau code
                            </button>
                            <button className="btn btn-fantome" disabled={retirerAcces.isPending} onClick={() => retirerAcces.mutate(e.id)}>
                              Retirer l'accès
                            </button>
                          </>
                        ) : (
                          <button className="btn btn-fantome" disabled={donnerAcces.isPending} onClick={() => donnerAcces.mutate(e.id)}>
                            <KeyRound size={14} /> Donner un accès caisse
                          </button>
                        )}
                      </>
                    )}
                    <button className={e.actif ? "btn btn-danger" : "btn btn-fantome"} disabled={modifier.isPending} onClick={() => modifier.mutate({ id: e.id, actif: !e.actif })}>
                      {e.actif ? "Désactiver" : "Réactiver"}
                    </button>
                  </div>
                </div>
              ),
            )}
          </div>
        )}
      </Carte>
    </>
  );
}

function Tablettes() {
  const client = useQueryClient();
  const appareils = useQuery({ queryKey: ["appareils"], queryFn: () => api.get<AppareilCaisse[]>("/appareils") });
  const [aRetirer, setARetirer] = useState<string | null>(null);
  const formation = useMutation({
    mutationFn: (x: { id: string; formation: boolean }) => api.post<AppareilCaisse[]>(`/appareils/${x.id}/formation`, { formation: x.formation }),
    onSuccess: (l) => {
      client.setQueryData(["appareils"], l);
      void client.invalidateQueries({ queryKey: ["appareil"] });
      void client.invalidateQueries({ queryKey: ["formation"] });
    },
  });
  const retirer = useMutation({
    mutationFn: (id: string) => api.post<AppareilCaisse[]>(`/appareils/${id}/retrait`),
    onSuccess: (l) => {
      client.setQueryData(["appareils"], l);
      void client.invalidateQueries({ queryKey: ["appareil"] });
      setARetirer(null);
    },
  });

  if (appareils.isPending) return <Chargement />;
  if (appareils.error) return <MessageErreur erreur={appareils.error} />;
  const actives = appareils.data!.filter((a) => !a.retireLe);
  const retirees = appareils.data!.filter((a) => a.retireLe);

  return (
    <>
      <Carte titre="Tablettes enregistrées" description="Les caissières ne peuvent se connecter que sur ces appareils.">
        {actives.length === 0 ? (
          <EtatVide titre="Aucune tablette enregistrée">
            Sur la tablette du stand : connecte-toi avec ton e-mail, ouvre <Link to="/caisses">Caisses</Link> → la caisse, puis « Enregistrer cet appareil ».
          </EtatVide>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {actives.map((a) => (
              <div key={a.id} className="caisse">
                <Tablet size={16} />
                <strong>
                  Caisse {a.caisseNumero}
                  {a.caisseNom ? ` — ${a.caisseNom}` : ""}
                </strong>
                <span className="discret">{a.standNom}</span>
                {a.cetAppareil && <span className="puce puce-violet">Cet appareil</span>}
                {a.formation && <span className="puce puce-ambre">Formation — factice</span>}
                <span className="discret" style={{ fontSize: 12 }}>
                  Enregistrée par {a.enregistrePar} le {formaterDateHeure(a.enregistreLe)}
                  {a.derniereConnexion ? ` · dernière connexion ${formaterDateHeure(a.derniereConnexion)}` : " · aucune connexion"}
                </span>
                <div className="actions">
                  {aRetirer === a.id ? (
                    <>
                      <span className="discret" style={{ fontSize: 12 }}>Les caissières connectées dessus seront déconnectées.</span>
                      <button className="btn btn-danger" disabled={retirer.isPending} onClick={() => retirer.mutate(a.id)}>
                        Confirmer le retrait
                      </button>
                      <button className="btn btn-fantome" onClick={() => setARetirer(null)}>
                        Annuler
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        className="btn btn-fantome"
                        disabled={formation.isPending}
                        onClick={() => formation.mutate({ id: a.id, formation: !a.formation })}
                      >
                        {a.formation ? "Sortir de la formation" : "Mettre en formation"}
                      </button>
                      <button className="btn btn-danger" onClick={() => setARetirer(a.id)}>
                        Retirer
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        <MessageErreur erreur={retirer.error} />
        <MessageErreur erreur={formation.error} />
      </Carte>
      {retirees.length > 0 && (
        <Carte titre="Tablettes retirées" description="Conservées pour l'historique ; elles ne permettent plus aucune connexion.">
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {retirees.map((a) => (
              <div key={a.id} className="discret" style={{ fontSize: 12.5 }}>
                Caisse {a.caisseNumero} · {a.standNom} — enregistrée le {formaterDateHeure(a.enregistreLe)}, retirée le {formaterDateHeure(a.retireLe!)}
              </div>
            ))}
          </div>
        </Carte>
      )}
    </>
  );
}
