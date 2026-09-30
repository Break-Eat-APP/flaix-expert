import { useState, type FormEvent } from "react";
import { Link } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { KeyRound, Tablet, UserPlus } from "lucide-react";
import type { AppareilCaisse, Caissiere, CodeCaissiere } from "@flaix/domain";
import { api, formaterDateHeure } from "../../api.ts";
import { Carte, Chargement, EntetePage, EtatVide, MessageErreur, Regles } from "../../composants/communs.tsx";

type Onglet = "fiches" | "tablettes" | "planning" | "masse";

const heure = new Intl.DateTimeFormat("fr-FR", { timeStyle: "short", timeZone: "Europe/Paris" });

/**
 * Équipe (organisation en 6 entrées, dossier §15.95). Construit : les fiches des caissières et
 * leur code personnel, les tablettes enregistrées comme caisse (§15.100). Planning et masse
 * salariale viendront avec le module Personnel (étape 5).
 */
export function Equipe() {
  const [onglet, setOnglet] = useState<Onglet>("fiches");
  const bouton = (id: Onglet, libelle: string, aVenir = false) => (
    <button className={`onglet${onglet === id ? " actif" : ""}`} onClick={() => setOnglet(id)}>
      {libelle}
      {aVenir && <span className="etiquette-a-venir" style={{ marginLeft: 8 }}>à venir</span>}
    </button>
  );
  return (
    <>
      <EntetePage titre="Équipe" description="Qui encaisse, sur quelle tablette." />
      <div className="onglets">
        {bouton("fiches", "Fiches")}
        {bouton("tablettes", "Tablettes")}
        {bouton("planning", "Planning", true)}
        {bouton("masse", "Masse salariale", true)}
      </div>
      {onglet === "fiches" ? (
        <Fiches />
      ) : onglet === "tablettes" ? (
        <Tablettes />
      ) : (
        <Carte>
          <EtatVide titre="Pas encore construit">
            {onglet === "planning" ? "Le planning des matchs (qui travaille où, à quelle heure)" : "Le coût du personnel par match"} arrivera avec le module Personnel.
          </EtatVide>
        </Carte>
      )}
      <Regles>
        <ul>
          <li><strong>Fiche de caissière</strong> : un prénom et un nom, sans e-mail ni mot de passe. Deux fiches ne peuvent pas porter le même nom : la caissière se reconnaît dans la liste de la tablette.</li>
          <li><strong>Code personnel</strong> : 4 chiffres tirés au hasard, affichés une seule fois à la création ou avec « Nouveau code ». Donne-le à la personne concernée seulement. FlaiX ne le garde pas : s'il est oublié, donne un nouveau code (l'ancien cesse de fonctionner).</li>
          <li><strong>Le code ne marche que sur une tablette enregistrée</strong> comme caisse. Une caissière connectée ne voit que l'écran de vente de cette caisse : ni résultats, ni coûts, ni paramètres.</li>
          <li><strong>Blocage</strong> : 5 codes faux de suite bloquent la fiche 15 minutes. Un nouveau code la débloque aussitôt.</li>
          <li><strong>Désactiver</strong> une fiche la retire des tablettes et ferme ses connexions ouvertes. Elle n'est jamais supprimée : ses tickets portent son nom.</li>
          <li><strong>Enregistrer une tablette</strong> : sur la tablette posée au stand, connecte-toi avec ton e-mail, ouvre Caisses → la caisse, puis « Enregistrer cet appareil ». Déconnecte-toi : la tablette affiche alors la liste des caissières.</li>
          <li><strong>Retirer</strong> une tablette (perdue, remplacée) : les caissières qui y sont connectées sont déconnectées et le code n'y fonctionne plus.</li>
          <li>Chaque création, modification, nouveau code, connexion, code refusé, blocage, enregistrement et retrait de tablette est inscrit au journal technique.</li>
        </ul>
      </Regles>
    </>
  );
}

function CodeRemis({ remis, fermer }: { remis: CodeCaissiere; fermer: () => void }) {
  return (
    <div className="code-remis" role="status">
      <span className="code">{remis.code}</span>
      <p>
        Code de <strong>{remis.caissiere.nom}</strong>. Donne-le-lui maintenant : <strong>il ne sera plus jamais affiché</strong>.
      </p>
      <button className="btn" onClick={fermer}>
        C'est noté
      </button>
    </div>
  );
}

function Fiches() {
  const client = useQueryClient();
  const fiches = useQuery({ queryKey: ["caissieres"], queryFn: () => api.get<Caissiere[]>("/equipe/caissieres") });
  const [nom, setNom] = useState("");
  const [remis, setRemis] = useState<CodeCaissiere | null>(null);
  const [renommer, setRenommer] = useState<{ id: string; nom: string } | null>(null);
  const actualiser = () => client.invalidateQueries({ queryKey: ["caissieres"] });

  const creer = useMutation({
    mutationFn: (n: string) => api.post<CodeCaissiere>("/equipe/caissieres", { nom: n }),
    onSuccess: (r) => {
      setRemis(r);
      setNom("");
      void actualiser();
    },
  });
  const nouveauCode = useMutation({
    mutationFn: (id: string) => api.post<CodeCaissiere>(`/equipe/caissieres/${id}/code`),
    onSuccess: (r) => {
      setRemis(r);
      void actualiser();
    },
  });
  const modifier = useMutation({
    mutationFn: ({ id, ...m }: { id: string; nom?: string; actif?: boolean }) => api.patch<Caissiere[]>(`/equipe/caissieres/${id}`, m),
    onSuccess: (l) => {
      client.setQueryData(["caissieres"], l);
      setRenommer(null);
    },
  });

  function ajouter(e: FormEvent) {
    e.preventDefault();
    if (nom.trim()) creer.mutate(nom.trim());
  }

  if (fiches.isPending) return <Chargement />;
  if (fiches.error) return <MessageErreur erreur={fiches.error} />;
  const liste = fiches.data!;

  return (
    <>
      {remis && <CodeRemis remis={remis} fermer={() => setRemis(null)} />}
      <Carte titre="Caissières" description="Chacune se connecte sur la tablette de sa caisse avec son code personnel.">
        <form className="en-ligne" style={{ marginBottom: 14, flexWrap: "wrap" }} onSubmit={ajouter}>
          <input type="text" value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Prénom et initiale (ex. Julie M.)" maxLength={60} aria-label="Nom de la caissière" style={{ flex: "1 1 220px" }} />
          <button className="btn" disabled={!nom.trim() || creer.isPending}>
            <UserPlus size={15} /> Ajouter
          </button>
        </form>
        <MessageErreur erreur={creer.error ?? nouveauCode.error ?? modifier.error} />
        {liste.length === 0 ? (
          <EtatVide titre="Aucune caissière">Ajoute la première fiche : FlaiX lui donne un code à 4 chiffres.</EtatVide>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {liste.map((c) => (
              <div key={c.id} className="caisse" style={c.actif ? undefined : { opacity: 0.6 }}>
                {renommer?.id === c.id ? (
                  <form
                    className="en-ligne"
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (renommer.nom.trim()) modifier.mutate({ id: c.id, nom: renommer.nom.trim() });
                    }}
                  >
                    <input type="text" value={renommer.nom} onChange={(e) => setRenommer({ id: c.id, nom: e.target.value })} maxLength={60} autoFocus aria-label="Nouveau nom" />
                    <button className="btn" disabled={modifier.isPending}>Enregistrer</button>
                    <button type="button" className="btn btn-fantome" onClick={() => setRenommer(null)}>Annuler</button>
                  </form>
                ) : (
                  <strong>{c.nom}</strong>
                )}
                {!c.actif ? (
                  <span className="puce">Désactivée</span>
                ) : c.bloqueeJusqua ? (
                  <span className="puce puce-rouge">Bloquée jusqu'à {heure.format(new Date(c.bloqueeJusqua))}</span>
                ) : (
                  <span className="puce puce-vert">Active</span>
                )}
                <span className="discret" style={{ fontSize: 12 }}>
                  {c.derniereConnexion ? `Dernière connexion ${formaterDateHeure(c.derniereConnexion)}` : "Jamais connectée"}
                </span>
                <div className="actions">
                  {c.actif && renommer?.id !== c.id && (
                    <>
                      <button className="btn btn-fantome" onClick={() => setRenommer({ id: c.id, nom: c.nom })}>Renommer</button>
                      <button className="btn btn-fantome" disabled={nouveauCode.isPending} onClick={() => nouveauCode.mutate(c.id)}>
                        <KeyRound size={14} /> Nouveau code
                      </button>
                    </>
                  )}
                  <button className={c.actif ? "btn btn-danger" : "btn btn-fantome"} disabled={modifier.isPending} onClick={() => modifier.mutate({ id: c.id, actif: !c.actif })}>
                    {c.actif ? "Désactiver" : "Réactiver"}
                  </button>
                </div>
              </div>
            ))}
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
                <span className="discret" style={{ fontSize: 12 }}>
                  Enregistrée par {a.enregistrePar} le {formaterDateHeure(a.enregistreLe)}
                  {a.derniereConnexion ? ` · dernière connexion ${formaterDateHeure(a.derniereConnexion)}` : " · aucune connexion"}
                </span>
                <div className="actions">
                  {aRetirer === a.id ? (
                    <>
                      <span className="discret" style={{ fontSize: 12 }}>Les caissières connectées dessus seront déconnectées.</span>
                      <button className="btn btn-danger" disabled={retirer.isPending} onClick={() => retirer.mutate(a.id)}>Confirmer le retrait</button>
                      <button className="btn btn-fantome" onClick={() => setARetirer(null)}>Annuler</button>
                    </>
                  ) : (
                    <button className="btn btn-danger" onClick={() => setARetirer(a.id)}>Retirer</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        <MessageErreur erreur={retirer.error} />
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
