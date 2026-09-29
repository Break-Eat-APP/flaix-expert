import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import type { Caisse, Stand } from "@flaix/domain";
import { api } from "../../api.ts";
import { Carte, Chargement, EntetePage, EtatVide, MessageErreur, Regles } from "../../composants/communs.tsx";

type Action =
  | { type: "creer-stand"; nom: string; pointRetraitCc: boolean }
  | { type: "modifier-stand"; id: string; modif: Partial<Pick<Stand, "nom" | "pointRetraitCc" | "actif">> }
  | { type: "creer-caisse"; standId: string; nom: string | null; especesAutorisees: boolean }
  | { type: "modifier-caisse"; id: string; modif: Partial<Pick<Caisse, "nom" | "especesAutorisees" | "actif" | "standId">> };

function executer(a: Action): Promise<Stand[]> {
  switch (a.type) {
    case "creer-stand":
      return api.post("/stands", { nom: a.nom, pointRetraitCc: a.pointRetraitCc });
    case "modifier-stand":
      return api.patch(`/stands/${a.id}`, a.modif);
    case "creer-caisse":
      return api.post(`/stands/${a.standId}/caisses`, { nom: a.nom, especesAutorisees: a.especesAutorisees });
    case "modifier-caisse":
      return api.patch(`/caisses/${a.id}`, a.modif);
  }
}

export function StandsCaisses() {
  const client = useQueryClient();
  const stands = useQuery({ queryKey: ["stands"], queryFn: () => api.get<Stand[]>("/stands") });
  const action = useMutation({
    mutationFn: executer,
    onSuccess: (liste) => {
      client.setQueryData(["stands"], liste);
      client.invalidateQueries({ queryKey: ["produits"] });
    },
  });

  const [nomStand, setNomStand] = useState("");
  const [retraitCc, setRetraitCc] = useState(false);

  if (stands.isPending) return <Chargement />;
  if (stands.error) return <MessageErreur erreur={stands.error} />;
  const liste = stands.data!;
  const actifs = liste.filter((s) => s.actif);
  const nbCaisses = actifs.reduce((n, s) => n + s.caisses.filter((c) => c.actif).length, 0);

  function creerStand(e: FormEvent) {
    e.preventDefault();
    action.mutate({ type: "creer-stand", nom: nomStand, pointRetraitCc: retraitCc }, { onSuccess: () => { setNomStand(""); setRetraitCc(false); } });
  }

  return (
    <>
      <EntetePage
        fil="Configuration"
        titre="Gestion des stands & caisses"
        description={`${actifs.length} stand${actifs.length > 1 ? "s" : ""} actif${actifs.length > 1 ? "s" : ""} · ${nbCaisses} caisse${nbCaisses > 1 ? "s" : ""} active${nbCaisses > 1 ? "s" : ""}`}
      />

      <Carte titre="Ajouter un stand" description="Une buvette, un bar, un point de vente du lieu.">
        <form onSubmit={creerStand} className="en-ligne" style={{ alignItems: "flex-end" }}>
          <label className="champ" style={{ flex: "1 1 260px" }}>
            <span>Nom du stand</span>
            <input type="text" value={nomStand} onChange={(e) => setNomStand(e.target.value)} placeholder="Ex. Buvette tribune nord" required maxLength={80} />
          </label>
          <label className="case" style={{ paddingBottom: 8 }}>
            <input type="checkbox" checked={retraitCc} onChange={(e) => setRetraitCc(e.target.checked)} />
            Point de retrait Click & Collect
          </label>
          <button className="btn" disabled={action.isPending || !nomStand.trim()}>
            <Plus size={16} /> Ajouter le stand
          </button>
        </form>
      </Carte>

      <MessageErreur erreur={action.error} />

      {liste.length === 0 ? (
        <Carte>
          <EtatVide titre="Aucun stand pour l'instant">Ajoute ton premier stand ci-dessus, puis ses caisses.</EtatVide>
        </Carte>
      ) : (
        <div className="stands">
          {liste.map((s) => (
            <CarteStand key={s.id} stand={s} stands={liste} occupe={action.isPending} agir={(a) => action.mutate(a)} />
          ))}
        </div>
      )}

      <Regles>
        <ul>
          <li><strong>Un stand et une caisse ne se suppriment jamais</strong> : ils se désactivent. Les ventes passées gardent ainsi leur stand et leur caisse d'origine, lisibles des années plus tard.</li>
          <li>Un stand ne peut être désactivé que lorsqu'il n'a plus de caisse active (désactive-les ou déplace-les d'abord).</li>
          <li><strong>Les caisses sont numérotées sur tout le lieu</strong> (1, 2, 3…), dans l'ordre de création, quel que soit leur stand. Un numéro n'est jamais réattribué. Chaque caisse numérotera ensuite ses propres tickets (ex. 2026-C3-000125), pour qu'une coupure de réseau sur une caisse ne crée jamais de trou ni de doublon.</li>
          <li><strong>Espèces</strong> : une caisse « carte uniquement » s'ouvrira sans fond de caisse et n'affichera pas le bouton Espèces. Attention : dès qu'une seule caisse du lieu accepte des espèces, tout le lieu relève de l'obligation de logiciel de caisse sécurisé (question posée à l'expert-comptable).</li>
          <li><strong>Point de retrait Click & Collect</strong> : le stand sert de point de retrait des commandes passées sur l'application, et puise dans son propre stock.</li>
          <li>Chaque création ou modification est inscrite au journal technique avec son auteur et l'heure.</li>
        </ul>
      </Regles>
    </>
  );
}

function CarteStand({ stand, stands, occupe, agir }: { stand: Stand; stands: Stand[]; occupe: boolean; agir: (a: Action) => void }) {
  const [renommer, setRenommer] = useState<string | null>(null);
  const [nomCaisse, setNomCaisse] = useState("");
  const [especes, setEspeces] = useState(false);
  const [ajout, setAjout] = useState(false);
  const caissesActives = stand.caisses.filter((c) => c.actif).length;

  return (
    <section className="carte" style={{ marginBottom: 0, opacity: stand.actif ? 1 : 0.65 }}>
      <div className="carte-entete">
        {renommer === null ? (
          <div>
            <h2>{stand.nom}</h2>
            <div className="en-ligne" style={{ marginTop: 6 }}>
              {!stand.actif && <span className="puce puce-rouge">Désactivé</span>}
              {stand.pointRetraitCc && <span className="puce puce-cc">Point de retrait Click & Collect</span>}
              <span className="puce">
                {caissesActives} caisse{caissesActives > 1 ? "s" : ""} active{caissesActives > 1 ? "s" : ""}
              </span>
            </div>
          </div>
        ) : (
          <form
            className="en-ligne"
            onSubmit={(e) => {
              e.preventDefault();
              agir({ type: "modifier-stand", id: stand.id, modif: { nom: renommer } });
              setRenommer(null);
            }}
          >
            <input type="text" value={renommer} onChange={(e) => setRenommer(e.target.value)} maxLength={80} autoFocus style={{ width: 260 }} />
            <button className="btn" disabled={occupe || !renommer.trim()}>Enregistrer</button>
            <button type="button" className="btn btn-fantome" onClick={() => setRenommer(null)}>Annuler</button>
          </form>
        )}
        {renommer === null && (
          <div className="en-ligne">
            <button className="btn btn-fantome" onClick={() => setRenommer(stand.nom)}>Renommer</button>
            {stand.actif && (
              <label className="case" title="Le stand sert de point de retrait des commandes de l'application">
                <input
                  type="checkbox"
                  checked={stand.pointRetraitCc}
                  disabled={occupe}
                  onChange={(e) => agir({ type: "modifier-stand", id: stand.id, modif: { pointRetraitCc: e.target.checked } })}
                />
                Retrait C&C
              </label>
            )}
            {stand.actif ? (
              <button className="btn btn-danger" disabled={occupe} onClick={() => agir({ type: "modifier-stand", id: stand.id, modif: { actif: false } })}>
                Désactiver
              </button>
            ) : (
              <button className="btn btn-fantome" disabled={occupe} onClick={() => agir({ type: "modifier-stand", id: stand.id, modif: { actif: true } })}>
                Réactiver
              </button>
            )}
          </div>
        )}
      </div>

      <div className="stand-caisses">
        {stand.caisses.length === 0 && <span className="discret">Aucune caisse sur ce stand.</span>}
        {stand.caisses.map((c) => (
          <LigneCaisse key={c.id} caisse={c} stands={stands} occupe={occupe} agir={agir} />
        ))}
      </div>

      {stand.actif &&
        (ajout ? (
          <form
            className="en-ligne"
            style={{ marginTop: 12, alignItems: "flex-end" }}
            onSubmit={(e) => {
              e.preventDefault();
              agir({ type: "creer-caisse", standId: stand.id, nom: nomCaisse.trim() || null, especesAutorisees: especes });
              setNomCaisse("");
              setEspeces(false);
              setAjout(false);
            }}
          >
            <label className="champ" style={{ flex: "1 1 220px" }}>
              <span>Nom de la caisse (facultatif)</span>
              <input type="text" value={nomCaisse} onChange={(e) => setNomCaisse(e.target.value)} placeholder="Ex. Comptoir gauche" maxLength={60} />
            </label>
            <label className="case" style={{ paddingBottom: 8 }}>
              <input type="checkbox" checked={especes} onChange={(e) => setEspeces(e.target.checked)} />
              Accepte les espèces
            </label>
            <button className="btn" disabled={occupe}>Créer la caisse</button>
            <button type="button" className="btn btn-fantome" onClick={() => setAjout(false)}>Annuler</button>
          </form>
        ) : (
          <button className="btn btn-fantome" style={{ marginTop: 12 }} onClick={() => setAjout(true)}>
            <Plus size={15} /> Ajouter une caisse
          </button>
        ))}
    </section>
  );
}

function LigneCaisse({ caisse, stands, occupe, agir }: { caisse: Caisse; stands: Stand[]; occupe: boolean; agir: (a: Action) => void }) {
  const [nom, setNom] = useState<string | null>(null);
  const destinations = stands.filter((s) => s.actif && s.id !== caisse.standId);

  return (
    <div className="caisse" style={{ opacity: caisse.actif ? 1 : 0.6 }}>
      <span className="caisse-numero">Caisse {caisse.numero}</span>
      {nom === null ? (
        <span>{caisse.nom ?? <span className="discret">sans nom</span>}</span>
      ) : (
        <form
          className="en-ligne"
          onSubmit={(e) => {
            e.preventDefault();
            agir({ type: "modifier-caisse", id: caisse.id, modif: { nom: nom.trim() || null } });
            setNom(null);
          }}
        >
          <input type="text" value={nom} onChange={(e) => setNom(e.target.value)} maxLength={60} autoFocus style={{ width: 200 }} />
          <button className="btn" disabled={occupe}>OK</button>
          <button type="button" className="btn btn-fantome" onClick={() => setNom(null)}>Annuler</button>
        </form>
      )}
      <span className={`puce ${caisse.especesAutorisees ? "puce-ambre" : "puce-violet"}`}>{caisse.especesAutorisees ? "Espèces + carte" : "Carte uniquement"}</span>
      {!caisse.actif && <span className="puce puce-rouge">Désactivée</span>}
      <div className="actions">
        {nom === null && <button className="btn btn-fantome" onClick={() => setNom(caisse.nom ?? "")}>Renommer</button>}
        {caisse.actif && (
          <button
            className="btn btn-fantome"
            disabled={occupe}
            onClick={() => agir({ type: "modifier-caisse", id: caisse.id, modif: { especesAutorisees: !caisse.especesAutorisees } })}
          >
            {caisse.especesAutorisees ? "Passer en carte uniquement" : "Accepter les espèces"}
          </button>
        )}
        {caisse.actif && destinations.length > 0 && (
          <select
            aria-label={`Déplacer la caisse ${caisse.numero}`}
            value=""
            disabled={occupe}
            onChange={(e) => e.target.value && agir({ type: "modifier-caisse", id: caisse.id, modif: { standId: e.target.value } })}
            style={{ width: "auto" }}
          >
            <option value="">Déplacer vers…</option>
            {destinations.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nom}
              </option>
            ))}
          </select>
        )}
        {caisse.actif ? (
          <button className="btn btn-danger" disabled={occupe} onClick={() => agir({ type: "modifier-caisse", id: caisse.id, modif: { actif: false } })}>
            Désactiver
          </button>
        ) : (
          <button className="btn btn-fantome" disabled={occupe} onClick={() => agir({ type: "modifier-caisse", id: caisse.id, modif: { actif: true } })}>
            Réactiver
          </button>
        )}
      </div>
    </div>
  );
}
