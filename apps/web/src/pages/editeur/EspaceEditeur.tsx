import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LogOut, ShieldCheck } from "lucide-react";
import { OPTIONS_LIEU, alertesLieuParc, type OptionLieu, type ParcEditeur, type VerificationEditeur } from "@flaix/domain";
import { api, ErreurApi, formaterDateHeure } from "../../api.ts";
import { Carte, Chargement, EtatVide, MessageErreur } from "../../composants/communs.tsx";
import { Logo } from "../../composants/Logo.tsx";

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
          <input type="password" autoComplete="current-password" required value={motDePasse} onChange={(e) => setMotDePasse(e.target.value)} />
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
                Chaque vérification et chaque changement d'option sont inscrits au journal technique du lieu, qui les voit. Base toujours incluse : caisse, clôtures, résultats, paramètres, formation. L'accès aux données d'un lieu (support) n'existe que sur son autorisation :
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
          <input type="password" autoComplete="current-password" value={actuel} onChange={(e) => setActuel(e.target.value)} required />
        </label>
        <label className="champ">
          <span>Nouveau (12 caractères au moins)</span>
          <input type="password" autoComplete="new-password" value={nouveau} onChange={(e) => setNouveau(e.target.value)} required minLength={12} />
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
