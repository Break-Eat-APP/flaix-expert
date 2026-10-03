import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { KeyRound, LogOut, Plus, ShieldCheck } from "lucide-react";
import {
  LONGUEUR_MIN_MOT_DE_PASSE,
  OPTIONS_LIEU,
  alertesLieuParc,
  type DirecteurRemis,
  type LieuCree,
  type LieuParc,
  type OptionLieu,
  type ParcEditeur,
  type VerificationEditeur,
} from "@flaix/domain";
import { api, ErreurApi, formaterDateHeure } from "../../api.ts";
import { Carte, Chargement, EtatVide, MessageErreur } from "../../composants/communs.tsx";
import { Logo } from "../../composants/Logo.tsx";
import { ChampMotDePasse, MotDePasseRemis } from "../../composants/MotDePasse.tsx";

const ENVIRONNEMENTS = { developpement: "développement local", test: "serveur de test", production: "production" } as const;

/**
 * Back-office éditeur, niveau 1 (module 17 ; dossier §15.13, §15.116) : l'espace des comptes FlaiX Expert,
 * séparé de l'application des lieux (autre cookie, autres comptes). Supervision technique seulement :
 * ni montant, ni ticket, ni nom de salarié.
 */
export function EspaceEditeur() {
  const session = useQuery({
    queryKey: ["editeur-session"],
    queryFn: () => api.get<{ nom: string; email: string }>("/editeur/session").catch((e) => (e instanceof ErreurApi && e.statut === 401 ? null : Promise.reject(e))),
    retry: false,
  });
  if (session.isPending) return <Chargement />;
  if (session.error) return <MessageErreur erreur={session.error} />;
  return session.data ? <Parc nom={session.data.nom} /> : <ConnexionEditeur />;
}

function ConnexionEditeur() {
  const client = useQueryClient();
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const connexion = useMutation({
    mutationFn: () => api.post<{ nom: string; email: string }>("/editeur/connexion", { email, motDePasse }),
    onSuccess: (s) => client.setQueryData(["editeur-session"], s),
  });
  const soumettre = (e: FormEvent) => {
    e.preventDefault();
    connexion.mutate();
  };
  return (
    <div className="page-connexion">
      <form className="carte boite-connexion" onSubmit={soumettre}>
        <div className="marque">
          <Logo hauteur={64} />
        </div>
        <h2 style={{ marginBottom: 4 }}>Back-office FlaiX Expert</h2>
        <p className="aide" style={{ marginTop: 0, marginBottom: 14 }}>
          Réservé aux comptes éditeur. Les directeurs et les caissières se connectent depuis l'accueil.
        </p>
        <label className="champ">
          <span>Adresse e-mail</span>
          <input type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="champ" style={{ marginTop: 12 }}>
          <span>Mot de passe</span>
          <ChampMotDePasse autoComplete="current-password" value={motDePasse} onChange={setMotDePasse} />
        </label>
        <MessageErreur erreur={connexion.error} />
        <button className="btn btn-bloc" style={{ marginTop: 16 }} disabled={connexion.isPending}>
          {connexion.isPending ? "Connexion…" : "Se connecter"}
        </button>
      </form>
    </div>
  );
}

function Parc({ nom }: { nom: string }) {
  const client = useQueryClient();
  const parc = useQuery({ queryKey: ["editeur-parc"], queryFn: () => api.get<ParcEditeur>("/editeur/parc"), refetchInterval: 60_000 });
  const [resultats, setResultats] = useState<Record<string, VerificationEditeur>>({});
  const verifier = useMutation({
    mutationFn: (lieuId: string) => api.post<VerificationEditeur>(`/editeur/lieux/${lieuId}/verification`),
    onSuccess: (r, lieuId) => {
      setResultats((x) => ({ ...x, [lieuId]: r }));
      void client.invalidateQueries({ queryKey: ["editeur-parc"] });
    },
  });
  const option = useMutation({
    mutationFn: (x: { lieuId: string; option: OptionLieu; active: boolean }) => api.put(`/editeur/lieux/${x.lieuId}/options`, { option: x.option, active: x.active }),
    onSuccess: () => void client.invalidateQueries({ queryKey: ["editeur-parc"] }),
  });
  const deconnexion = useMutation({
    mutationFn: () => api.post("/editeur/deconnexion"),
    onSuccess: () => {
      client.setQueryData(["editeur-session"], null);
      client.removeQueries({ queryKey: ["editeur-parc"] });
    },
  });
  const maintenant = Date.now();

  return (
    <div className="editeur">
      <header className="editeur-entete">
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <Logo hauteur={36} />
          <div>
          <strong>Back-office FlaiX Expert</strong>
          <div className="discret" style={{ fontSize: 12.5 }}>
            {nom} · supervision technique : ni montant, ni ticket, ni nom de salarié
          </div>
          </div>
        </div>
        <button className="btn btn-fantome" onClick={() => deconnexion.mutate()}>
          <LogOut size={15} /> Se déconnecter
        </button>
      </header>
      <main className="editeur-contenu">
        {parc.isPending ? (
          <Chargement />
        ) : parc.error ? (
          <MessageErreur erreur={parc.error} />
        ) : (
          <>
            <div className="kpis">
              <div className="kpi">
                <div className="kpi-libelle">Lieux</div>
                <div className="kpi-valeur">{parc.data!.lieux.length}</div>
              </div>
              <div className="kpi">
                <div className="kpi-libelle">Version en service</div>
                <div className="kpi-valeur" style={{ fontSize: 18 }}>{parc.data!.version}</div>
                <div className="aide">{ENVIRONNEMENTS[parc.data!.environnement]}</div>
              </div>
              <div className="kpi">
                <div className="kpi-libelle">Lieux à surveiller</div>
                <div className="kpi-valeur">{parc.data!.lieux.filter((l) => alertesLieuParc(l, maintenant).length > 0).length}</div>
              </div>
            </div>
            <NouveauLieu />
            <Carte titre="Parc" description="Un lieu en retard de clôture ou avec une rupture d'intégrité risque l'amende : le prévenir est un service.">
              {parc.data!.lieux.length === 0 ? (
                <EtatVide titre="Aucun lieu" />
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {parc.data!.lieux.map((l) => {
                    const alertes = alertesLieuParc(l, maintenant);
                    const r = resultats[l.lieuId];
                    return (
                      <div key={l.lieuId} className="editeur-lieu">
                        <div className="editeur-ligne">
                          <span style={{ minWidth: 0 }}>
                            <strong>{l.nom}</strong>
                            {l.raisonSociale && <span className="discret"> · {l.raisonSociale}</span>}
                          </span>
                          {alertes.length ? <span className="puce puce-ambre">{alertes.join(" · ")}</span> : <span className="puce puce-vert">RAS</span>}
                        </div>
                        <div className="editeur-faits discret">
                          <span>créé le {formaterDateHeure(l.creeLe)}</span>
                          <span>
                            {l.standsActifs} stand{l.standsActifs > 1 ? "s" : ""} · {l.caissesActives} caisse{l.caissesActives > 1 ? "s" : ""} · {l.tablettes} tablette{l.tablettes > 1 ? "s" : ""}
                          </span>
                          <span>
                            {l.matchsJoues} match{l.matchsJoues > 1 ? "s" : ""} joué{l.matchsJoues > 1 ? "s" : ""}
                            {l.matchsOuverts ? ` · ${l.matchsOuverts} ouvert depuis le ${formaterDateHeure(l.plusAncienOuvert!)}` : ""}
                          </span>
                          <span>dernier Z : {l.dernierZ ? formaterDateHeure(l.dernierZ) : "—"}</span>
                          <span>dernier mois clôturé : {l.dernierMoisCloture ? l.dernierMoisCloture.slice(0, 7) : "—"}</span>
                          <span>exercice {l.exerciceRegle ? "réglé" : "non réglé"}</span>
                          <span>dernière activité : {l.derniereActivite ? formaterDateHeure(l.derniereActivite) : "—"}</span>
                        </div>
                        <DirecteursDuLieu lieu={l} />
                        <div className="editeur-options">
                          <span className="discret" style={{ fontSize: 12.5 }}>Options :</span>
                          {OPTIONS_LIEU.map((o) => (
                            <label key={o.cle} className="case" title={o.aide}>
                              <input
                                type="checkbox"
                                checked={l.options[o.cle]}
                                disabled={option.isPending}
                                onChange={(ev) => option.mutate({ lieuId: l.lieuId, option: o.cle, active: ev.target.checked })}
                              />{" "}
                              {o.libelle}
                            </label>
                          ))}
                        </div>
                        <div className="editeur-ligne">
                          <span className="discret" style={{ fontSize: 12.5 }}>
                            {r
                              ? r.ok
                                ? `Chaînes intactes : ${r.caisses.nombre} caisse${r.caisses.nombre > 1 ? "s" : ""}, journal technique (${r.journalTechnique.maillons}), clôtures (${r.clotures.maillons}).`
                                : `Rupture : ${[!r.caisses.ok && `caisses ${r.caisses.ruptures.join(", ")}`, !r.journalTechnique.ok && "journal technique", !r.clotures.ok && "clôtures"].filter(Boolean).join(", ")}.`
                              : l.derniereVerification
                                ? `Dernière vérification le ${formaterDateHeure(l.derniereVerification.le)} : ${l.derniereVerification.ok ? "intacte" : "RUPTURE"}.`
                                : "Jamais vérifié par FlaiX Expert."}
                          </span>
                          <button className="btn btn-fantome" disabled={verifier.isPending} onClick={() => verifier.mutate(l.lieuId)}>
                            <ShieldCheck size={15} /> Vérifier l'intégrité
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              <MessageErreur erreur={verifier.error ?? option.error} />
              <p className="aide" style={{ marginBottom: 0 }}>
                Chaque vérification et chaque changement d'option sont inscrits au journal technique du lieu, qui les voit. Base toujours incluse : caisse, clôtures, résultats, export comptable, paramètres, formation. L'accès aux données d'un lieu (support) n'existe que sur son autorisation :
                pas encore en service.
              </p>
            </Carte>
            <MotDePasse />
          </>
        )}
      </main>
    </div>
  );
}

/** Créer un lieu, vide, avec son premier directeur (§15.122). */
function NouveauLieu() {
  const client = useQueryClient();
  const [ouvert, setOuvert] = useState(false);
  const [nom, setNom] = useState("");
  const [directeur, setDirecteur] = useState("");
  const [email, setEmail] = useState("");
  const creer = useMutation({
    mutationFn: () => api.post<LieuCree>("/editeur/lieux", { nom, directeur: { nom: directeur, email } }),
    onSuccess: () => {
      setNom("");
      setDirecteur("");
      setEmail("");
      setOuvert(false);
      void client.invalidateQueries({ queryKey: ["editeur-parc"] });
    },
  });
  const cree = creer.data;
  return (
    <Carte
      titre="Nouveau lieu"
      description="Le lieu est créé vide : son directeur construit lui-même stands, caisses et produits. Toutes les options sont actives ; tu les règles ensuite dans le parc."
      actions={
        !ouvert && (
          <button
            className="btn"
            onClick={() => {
              setOuvert(true);
              creer.reset();
            }}
          >
            <Plus size={15} /> Ajouter un lieu
          </button>
        )
      }
    >
      {ouvert && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            creer.mutate();
          }}
        >
          <div className="grille-champs">
            <label className="champ">
              <span>Nom du lieu</span>
              <input type="text" required maxLength={120} value={nom} onChange={(e) => setNom(e.target.value)} placeholder="ex. Patinoire du Nord" />
            </label>
            <label className="champ">
              <span>Directeur : prénom et nom</span>
              <input type="text" required maxLength={120} value={directeur} onChange={(e) => setDirecteur(e.target.value)} />
            </label>
            <label className="champ">
              <span>Directeur : adresse e-mail</span>
              <input type="email" required maxLength={200} value={email} onChange={(e) => setEmail(e.target.value)} />
            </label>
          </div>
          <MessageErreur erreur={creer.error} />
          <div className="ligne-actions">
            <button className="btn" type="submit" disabled={creer.isPending}>
              {creer.isPending ? "Création…" : "Créer le lieu"}
            </button>
            <button className="btn btn-fantome" type="button" onClick={() => setOuvert(false)}>
              Annuler
            </button>
          </div>
        </form>
      )}
      {cree && (
        <>
          <div className="message message-ok">Lieu « {cree.nom} » créé.</div>
          {cree.directeur.motDePasseProvisoire ? (
            <MotDePasseRemis email={cree.directeur.email} motDePasse={cree.directeur.motDePasseProvisoire} />
          ) : (
            <p className="aide">{cree.directeur.email} avait déjà un compte : il accède au nouveau lieu avec son mot de passe actuel.</p>
          )}
        </>
      )}
    </Carte>
  );
}

/** Directeurs d'un lieu : en ajouter un, ou lui donner un nouveau mot de passe provisoire. */
function DirecteursDuLieu({ lieu }: { lieu: LieuParc }) {
  const client = useQueryClient();
  const [ajout, setAjout] = useState(false);
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [aConfirmer, setAConfirmer] = useState<string | null>(null);
  const [remis, setRemis] = useState<DirecteurRemis | null>(null);
  const ajouter = useMutation({
    mutationFn: () => api.post<DirecteurRemis>(`/editeur/lieux/${lieu.lieuId}/directeurs`, { nom, email }),
    onSuccess: (r) => {
      setRemis(r);
      setAjout(false);
      setNom("");
      setEmail("");
      void client.invalidateQueries({ queryKey: ["editeur-parc"] });
    },
  });
  const renouveler = useMutation({
    mutationFn: (utilisateurId: string) => api.post<DirecteurRemis>(`/editeur/lieux/${lieu.lieuId}/directeurs/${utilisateurId}/mot-de-passe`),
    onSuccess: (r) => {
      setRemis(r);
      setAConfirmer(null);
    },
  });
  return (
    <div className="editeur-directeurs">
      <span className="discret" style={{ fontSize: 12.5 }}>
        Directeur{lieu.directeurs.length > 1 ? "s" : ""} :
      </span>
      {lieu.directeurs.length === 0 && <span className="puce puce-ambre">aucun</span>}
      {lieu.directeurs.map((d) => (
        <span key={d.utilisateurId} className="editeur-directeur">
          <strong>{d.nom}</strong> <span className="discret">{d.email}</span>
          {!d.actif && <span className="puce puce-ambre">désactivé</span>}
          {aConfirmer === d.utilisateurId ? (
            <>
              <span className="discret">Ses sessions seront fermées.</span>
              <button className="btn-lien" disabled={renouveler.isPending} onClick={() => renouveler.mutate(d.utilisateurId)}>
                Confirmer
              </button>
              <button className="btn-lien" onClick={() => setAConfirmer(null)}>
                Annuler
              </button>
            </>
          ) : (
            <button
              className="btn-lien"
              title="Mot de passe oublié ou jamais reçu"
              onClick={() => {
                setAConfirmer(d.utilisateurId);
                setRemis(null);
              }}
            >
              <KeyRound size={13} /> Nouveau mot de passe
            </button>
          )}
        </span>
      ))}
      {!ajout && (
        <button
          className="btn-lien"
          onClick={() => {
            setAjout(true);
            setRemis(null);
            ajouter.reset();
          }}
        >
          <Plus size={13} /> Ajouter un directeur
        </button>
      )}
      {ajout && (
        <form
          className="editeur-ajout"
          onSubmit={(e) => {
            e.preventDefault();
            ajouter.mutate();
          }}
        >
          <input type="text" required maxLength={120} placeholder="Prénom et nom" aria-label="Prénom et nom du directeur" value={nom} onChange={(e) => setNom(e.target.value)} />
          <input type="email" required maxLength={200} placeholder="Adresse e-mail" aria-label="Adresse e-mail du directeur" value={email} onChange={(e) => setEmail(e.target.value)} />
          <button className="btn" type="submit" disabled={ajouter.isPending}>
            Ajouter
          </button>
          <button className="btn btn-fantome" type="button" onClick={() => setAjout(false)}>
            Annuler
          </button>
        </form>
      )}
      <MessageErreur erreur={ajouter.error ?? renouveler.error} />
      {remis &&
        (remis.motDePasseProvisoire ? (
          <MotDePasseRemis email={remis.email} motDePasse={remis.motDePasseProvisoire} />
        ) : (
          <p className="aide" style={{ margin: 0, width: "100%" }}>
            {remis.email} avait déjà un compte : il accède à ce lieu avec son mot de passe actuel.
          </p>
        ))}
    </div>
  );
}

function MotDePasse() {
  const [actuel, setActuel] = useState("");
  const [nouveau, setNouveau] = useState("");
  const changer = useMutation({
    mutationFn: () => api.post("/editeur/mot-de-passe", { actuel, nouveau }),
    onSuccess: () => {
      setActuel("");
      setNouveau("");
    },
  });
  return (
    <Carte titre="Mon mot de passe">
      <form
        className="grille-champs"
        onSubmit={(e) => {
          e.preventDefault();
          changer.mutate();
        }}
      >
        <label className="champ">
          <span>Mot de passe actuel</span>
          <ChampMotDePasse autoComplete="current-password" value={actuel} onChange={setActuel} />
        </label>
        <label className="champ">
          <span>Nouveau ({LONGUEUR_MIN_MOT_DE_PASSE} caractères au moins)</span>
          <ChampMotDePasse autoComplete="new-password" value={nouveau} onChange={setNouveau} minLength={LONGUEUR_MIN_MOT_DE_PASSE} />
        </label>
        <div style={{ alignSelf: "end" }}>
          <button className="btn" type="submit" disabled={changer.isPending}>
            Changer
          </button>
        </div>
      </form>
      {changer.isSuccess && <div className="message message-ok">Mot de passe changé ; tes autres sessions sont fermées.</div>}
      <MessageErreur erreur={changer.error} />
    </Carte>
  );
}
