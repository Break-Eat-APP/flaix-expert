import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Camera, Check, Plus, Printer } from "lucide-react";
import {
  MOMENTS_TACHE,
  SORTES_EQUIPEMENT,
  TYPES_RECEPTION,
  SEUIL_POLAIRES,
  formaterTemperature,
  huileConforme,
  libelleLimites,
  limitesEquipement,
  lirePourcentDixiemes,
  lireTemperature,
  receptionConforme,
  temperatureConforme,
  type EquipementHygiene,
  type Hygiene as Donnees,
  type MomentTache,
  type RegistreHygiene,
  type SorteEquipement,
  type Stand,
  type TypeReception,
} from "@flaix/domain";
import { api, formaterDateHeure } from "../../api.ts";
import { Carte, Chargement, EntetePage, EtatVide, MessageErreur, Regles } from "../../composants/communs.tsx";
import { preparerPhoto } from "./photo.ts";

type Onglet = "jour" | "receptions" | "huile" | "registre" | "reglages";
const ONGLETS: [Onglet, string][] = [
  ["jour", "Aujourd'hui"],
  ["receptions", "Réceptions"],
  ["huile", "Huile de friture"],
  ["registre", "Registre"],
  ["reglages", "Réglages"],
];
const CLE = ["hygiene"];
/** Sur la tablette d'une caisse, la caissière remplit la journée ; réglages et registre restent au directeur. */
const ONGLETS_EQUIPE: Onglet[] = ["jour", "receptions", "huile"];
const heure = (iso: string) => new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" });
const pourcent = (d: number) => `${(d / 10).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;

function useEnvoi<T>(chemin: (x: T) => string, corps: (x: T) => unknown = (x) => x) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (x: T) => api.post<Donnees>(chemin(x), corps(x)),
    onSuccess: (d) => {
      client.setQueryData(CLE, d);
      void client.invalidateQueries({ queryKey: ["alertes"] });
    },
  });
}

/**
 * Hygiène et HACCP (dossier §15.156) : températures, nettoyage, réceptions, huile de friture et registre pour les
 * contrôles sanitaires. Le registre est en écriture seule ; une non-conformité exige son action corrective.
 */
export function Hygiene({ equipe = false }: { equipe?: boolean }) {
  const [onglet, setOnglet] = useState<Onglet>("jour");
  const q = useQuery({ queryKey: CLE, queryFn: () => api.get<Donnees>("/hygiene") });
  if (q.isPending) return <Chargement />;
  if (q.error) return <MessageErreur erreur={q.error} />;
  const d = q.data!;
  return (
    <>
      {!equipe && <EntetePage titre="Hygiène & HACCP" description="Températures, nettoyage, réceptions et huile de friture : le registre est prêt pour un contrôle sanitaire." />}
      <div className="onglets">
        {ONGLETS.filter(([id]) => !equipe || ONGLETS_EQUIPE.includes(id)).map(([id, libelle]) => (
          <button key={id} className={`onglet${onglet === id ? " actif" : ""}`} onClick={() => setOnglet(id)}>
            {libelle}
          </button>
        ))}
      </div>
      {d.nonConformes7j > 0 && onglet !== "registre" && (
        <div className="message message-erreur">
          {d.nonConformes7j} non-conformité{d.nonConformes7j > 1 ? "s" : ""} ces 7 derniers jours : vérifie que l'action corrective a bien été faite (onglet Registre).
        </div>
      )}
      {onglet === "jour" && <Aujourdhui d={d} reglages={() => !equipe && setOnglet("reglages")} />}
      {onglet === "receptions" && <Receptions d={d} />}
      {onglet === "huile" && <Huile d={d} reglages={() => !equipe && setOnglet("reglages")} />}
      {onglet === "registre" && <Registre />}
      {onglet === "reglages" && <Reglages d={d} />}
      <Regles>
        <ul>
          <li><strong>Limites</strong> par défaut : froid (frigo, vitrine, chambre froide) ≤ 4 °C ; surgelé ≤ −18 °C ; maintien au chaud ≥ 63 °C. Un équipement peut avoir ses propres limites (Réglages).</li>
          <li><strong>À réception</strong> : produits frais ≤ 4 °C, surgelés ≤ −15 °C ; date limite et emballage vérifiés. <strong>Huile de friture</strong> : au-delà de 25 % de composés polaires, elle se change.</li>
          <li><strong>Hors limite</strong> : la conformité est calculée par FlaiX Expert, jamais déclarée ; l'enregistrement exige l'action corrective (produits jetés, réglage, livraison refusée, huile changée…).</li>
          <li><strong>Registre en écriture seule</strong> : un relevé ne se modifie ni ne s'efface. Chaque ligne garde qui l'a saisie et quand ; un relevé fait pendant un match y est rattaché.</li>
          <li>Rappels dans le centre d'alertes : non-conformités des 7 derniers jours, températures d'ouverture pas encore relevées pendant un match.</li>
          <li><strong>Sur la tablette de la caisse</strong>, la caissière connectée fait les relevés, coche les tâches et contrôle les réceptions (avec la photo de l'étiquette) ; réglages et registre restent au directeur.</li>
        </ul>
      </Regles>
    </>
  );
}

// ---------------------------------------------------------------------------

function Aujourdhui({ d, reglages }: { d: Donnees; reglages: () => void }) {
  const froids = d.equipements.filter((e) => e.actif && e.sorte !== "friteuse");
  const taches = d.taches.filter((t) => t.actif);
  const fait = useEnvoi((id: string) => `/hygiene/taches/${id}/fait`, () => ({}));
  if (froids.length === 0 && taches.length === 0)
    return (
      <Carte>
        <EtatVide titre="Rien à relever pour l'instant">
          Ajoute tes frigos, congélateurs, vitrines et friteuses, et tes tâches de nettoyage, dans{" "}
          <button className="btn-lien" onClick={reglages}>
            Réglages
          </button>
          .
        </EtatVide>
      </Carte>
    );
  const dejaFaite = (id: string, moment: MomentTache) =>
    d.tachesFaites.find((f) => f.tacheId === id && (moment === "semaine" || new Date(f.le).toLocaleDateString("fr-CA", { timeZone: "Europe/Paris" }) === d.jour));
  return (
    <>
      <p className="note" style={{ marginTop: 0 }}>
        {d.evenement ? (
          <>
            Match en cours : <strong>{d.evenement.libelle}</strong> — les relevés s'y rattachent.
          </>
        ) : (
          "Aucun match en cours : relevés du jour."
        )}
      </p>
      {froids.length > 0 && (
        <Carte titre="Températures" description="À relever à l'ouverture et à la fermeture.">
          {froids.map((e) => (
            <LigneTemperature key={e.id} e={e} d={d} />
          ))}
        </Carte>
      )}
      {taches.length > 0 && (
        <Carte titre="Nettoyage et contrôles">
          {MOMENTS_TACHE.map((m) => {
            const liste = taches.filter((t) => t.moment === m.moment);
            if (!liste.length) return null;
            return (
              <div key={m.moment} className="hygiene-groupe">
                <h3>{m.libelle}</h3>
                {liste.map((t) => {
                  const f = dejaFaite(t.id, t.moment);
                  return (
                    <div key={t.id} className="frais-ligne">
                      <span>{t.nom}</span>
                      <div className="frais-actions">
                        {f ? (
                          <span className="puce puce-vert">
                            <Check size={13} /> fait par {f.par} {m.moment === "semaine" ? `le ${formaterDateHeure(f.le)}` : `à ${heure(f.le)}`}
                          </span>
                        ) : (
                          <button className="btn" disabled={fait.isPending} onClick={() => fait.mutate(t.id)}>
                            Fait
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
          <MessageErreur erreur={fait.error} />
        </Carte>
      )}
    </>
  );
}

function LigneTemperature({ e, d }: { e: EquipementHygiene; d: Donnees }) {
  const limites = limitesEquipement(e);
  return (
    <div className="frais-ligne">
      <div className="frais-nom">
        <strong>{e.nom}</strong>
        <small className="discret">{libelleLimites(limites)}</small>
      </div>
      <div className="hygiene-releves">
        {(["ouverture", "fermeture"] as const).map((moment) => {
          const r = d.relevesDuJour.find((x) => x.equipementId === e.id && x.moment === moment);
          return r ? (
            <span key={moment} className={`puce ${r.conforme ? "puce-vert" : "puce-rouge"}`} title={r.actionCorrective ?? undefined}>
              {moment === "ouverture" ? "Ouverture" : "Fermeture"} : {formaterTemperature(r.temperatureDixiemes)} · {r.par} à {heure(r.le)}
            </span>
          ) : (
            <SaisieTemperature key={moment} e={e} moment={moment} />
          );
        })}
      </div>
    </div>
  );
}

function SaisieTemperature({ e, moment }: { e: EquipementHygiene; moment: "ouverture" | "fermeture" }) {
  const [texte, setTexte] = useState("");
  const [action, setAction] = useState("");
  const envoi = useEnvoi(() => "/hygiene/releves", (x: { t: number; action: string | null }) => ({ equipementId: e.id, moment, temperatureDixiemes: x.t, actionCorrective: x.action }));
  const t = texte.trim() ? lireTemperature(texte) : null;
  const horsLimite = t !== null && !temperatureConforme(t, limitesEquipement(e));
  const libelle = moment === "ouverture" ? "Ouverture" : "Fermeture";
  return (
    <form
      className="hygiene-saisie"
      onSubmit={(ev) => {
        ev.preventDefault();
        if (t !== null && (!horsLimite || action.trim().length >= 3)) envoi.mutate({ t, action: horsLimite ? action.trim() : null });
      }}
    >
      <span className="discret">{libelle}</span>
      <input
        type="text"
        inputMode="decimal"
        aria-label={`${libelle} : ${e.nom} (°C)`}
        placeholder="°C"
        value={texte}
        onChange={(ev) => setTexte(ev.target.value)}
        style={{ width: 80, borderColor: texte.trim() && t === null ? "var(--red)" : horsLimite ? "var(--amber)" : undefined }}
      />
      {horsLimite && (
        <input type="text" aria-label={`Action corrective : ${e.nom}`} placeholder="Hors limite : action corrective" value={action} onChange={(ev) => setAction(ev.target.value)} style={{ minWidth: 220 }} />
      )}
      <button className="btn" disabled={t === null || (horsLimite && action.trim().length < 3) || envoi.isPending}>
        Relever
      </button>
      <MessageErreur erreur={envoi.error} />
    </form>
  );
}

// ---------------------------------------------------------------------------

function Receptions({ d }: { d: Donnees }) {
  const [fournisseur, setFournisseur] = useState("");
  const [produits, setProduits] = useState("");
  const [type, setType] = useState<TypeReception>("frais");
  const [temp, setTemp] = useState("");
  const [dlcOk, setDlcOk] = useState(true);
  const [emballageOk, setEmballageOk] = useState(true);
  const [action, setAction] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [erreurPhoto, setErreurPhoto] = useState<string | null>(null);
  const envoi = useEnvoi(() => "/hygiene/receptions", (x: object) => x);
  const t = temp.trim() ? lireTemperature(temp) : null;
  const avecTemperature = type !== "sec";
  const conforme = receptionConforme({ type, temperatureDixiemes: t, dlcOk, emballageOk });
  const pret = fournisseur.trim() && produits.trim() && (!avecTemperature || t !== null) && (conforme || action.trim().length >= 3);
  return (
    <>
      <Carte titre="Contrôle à réception" description="À faire à chaque livraison, avant de ranger.">
        <form
          onSubmit={(ev) => {
            ev.preventDefault();
            if (!pret) return;
            envoi.mutate(
              { fournisseur: fournisseur.trim(), produits: produits.trim(), type, temperatureDixiemes: avecTemperature ? t : null, dlcOk, emballageOk, actionCorrective: conforme ? null : action.trim(), photo },
              {
                onSuccess: () => {
                  setProduits("");
                  setTemp("");
                  setAction("");
                  setPhoto(null);
                  setDlcOk(true);
                  setEmballageOk(true);
                },
              },
            );
          }}
        >
          <div className="grille-champs">
            <label className="champ">
              <span>Fournisseur</span>
              <input type="text" value={fournisseur} onChange={(ev) => setFournisseur(ev.target.value)} maxLength={120} />
            </label>
            <label className="champ">
              <span>Produits reçus</span>
              <input type="text" value={produits} onChange={(ev) => setProduits(ev.target.value)} maxLength={300} placeholder="Ex. : saucisses, pain" />
            </label>
            <label className="champ">
              <span>Type</span>
              <select value={type} onChange={(ev) => setType(ev.target.value as TypeReception)}>
                {TYPES_RECEPTION.map((x) => (
                  <option key={x.type} value={x.type}>
                    {x.libelle}
                  </option>
                ))}
              </select>
            </label>
            {avecTemperature && (
              <label className="champ">
                <span>Température relevée (°C)</span>
                <input type="text" inputMode="decimal" value={temp} onChange={(ev) => setTemp(ev.target.value)} />
              </label>
            )}
          </div>
          <div className="en-ligne" style={{ marginTop: 12, gap: 18 }}>
            <label className="case">
              <input type="checkbox" checked={dlcOk} onChange={(ev) => setDlcOk(ev.target.checked)} /> Dates limites correctes
            </label>
            <label className="case">
              <input type="checkbox" checked={emballageOk} onChange={(ev) => setEmballageOk(ev.target.checked)} /> Emballages intacts
            </label>
            <label className="btn btn-fantome" style={{ cursor: "pointer" }}>
              <Camera size={15} /> {photo ? "Photo prise — changer" : "Photo de l'étiquette"}
              <input
                type="file"
                accept="image/*"
                capture="environment"
                aria-label="Photo de l'étiquette"
                style={{ display: "none" }}
                onChange={async (ev) => {
                  const f = ev.target.files?.[0];
                  ev.target.value = "";
                  if (!f) return;
                  setErreurPhoto(null);
                  try {
                    setPhoto(await preparerPhoto(f));
                  } catch (e) {
                    setErreurPhoto(e instanceof Error ? e.message : "Photo illisible.");
                  }
                }}
              />
            </label>
            {photo && <img className="hygiene-apercu" src={`data:image/jpeg;base64,${photo}`} alt="Étiquette photographiée" />}
          </div>
          {erreurPhoto && <div className="message message-erreur">{erreurPhoto}</div>}
          {(!avecTemperature || t !== null) && !conforme && (
            <label className="champ" style={{ marginTop: 12 }}>
              <span>Non conforme : action corrective</span>
              <input type="text" value={action} onChange={(ev) => setAction(ev.target.value)} placeholder="Ex. : livraison refusée, produits retournés" />
            </label>
          )}
          <div className="ligne-actions">
            <button className="btn" disabled={!pret || envoi.isPending}>
              Enregistrer le contrôle
            </button>
            {(!avecTemperature || t !== null) && <span className={`puce ${conforme ? "puce-vert" : "puce-rouge"}`}>{conforme ? "conforme" : "non conforme"}</span>}
          </div>
          <MessageErreur erreur={envoi.error} />
        </form>
      </Carte>
      <Carte titre="Dernières réceptions">
        {d.receptions.length === 0 ? (
          <p className="note" style={{ margin: 0 }}>Aucune réception contrôlée ces 30 derniers jours.</p>
        ) : (
          <div className="scroll-x">
            <table className="tableau">
              <tbody>
                {d.receptions.map((r) => (
                  <tr key={r.id}>
                    <td>{formaterDateHeure(r.le)}</td>
                    <td>
                      <strong>{r.fournisseur}</strong> · {r.produits}
                    </td>
                    <td>{r.temperatureDixiemes !== null ? formaterTemperature(r.temperatureDixiemes) : "—"}</td>
                    <td>
                      <span className={`puce ${r.conforme ? "puce-vert" : "puce-rouge"}`}>{r.conforme ? "conforme" : `non conforme : ${r.actionCorrective}`}</span>
                    </td>
                    <td>
                      {r.photoId && (
                        <a href={`/api/hygiene/photos/${r.photoId}`} target="_blank" rel="noreferrer" aria-label={`Photo de l'étiquette : ${r.fournisseur}`}>
                          <Camera size={15} />
                        </a>
                      )}
                    </td>
                    <td className="discret">{r.par}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Carte>
    </>
  );
}

// ---------------------------------------------------------------------------

function Huile({ d, reglages }: { d: Donnees; reglages: () => void }) {
  const friteuses = d.equipements.filter((e) => e.actif && e.sorte === "friteuse");
  if (friteuses.length === 0)
    return (
      <Carte>
        <EtatVide titre="Aucune friteuse">
          Ajoute tes friteuses dans{" "}
          <button className="btn-lien" onClick={reglages}>
            Réglages
          </button>{" "}
          pour suivre leur huile.
        </EtatVide>
      </Carte>
    );
  return (
    <>
      {friteuses.map((f) => (
        <ControleFriteuse key={f.id} e={f} d={d} />
      ))}
    </>
  );
}

function ControleFriteuse({ e, d }: { e: EquipementHygiene; d: Donnees }) {
  const [texte, setTexte] = useState("");
  const [action, setAction] = useState("");
  const envoi = useEnvoi(() => "/hygiene/huiles", (x: object) => ({ equipementId: e.id, ...x }));
  const p = texte.trim() ? lirePourcentDixiemes(texte) : null;
  const aChanger = p !== null && !huileConforme("controle", p);
  const historique = d.huiles.filter((h) => h.equipementId === e.id).slice(0, 5);
  return (
    <Carte titre={e.nom} description={`Au-delà de ${pourcent(SEUIL_POLAIRES)} de composés polaires, l'huile se change.`}>
      <div className="en-ligne">
        <input type="text" inputMode="decimal" aria-label={`Composés polaires : ${e.nom} (%)`} placeholder="% polaires" value={texte} onChange={(ev) => setTexte(ev.target.value)} style={{ width: 110 }} />
        {aChanger && <input type="text" aria-label={`Action corrective : ${e.nom}`} placeholder="À changer : action corrective" value={action} onChange={(ev) => setAction(ev.target.value)} style={{ minWidth: 220 }} />}
        <button
          className="btn"
          disabled={p === null || (aChanger && action.trim().length < 3) || envoi.isPending}
          onClick={() => envoi.mutate({ action: "controle", polairesDixiemes: p, actionCorrective: aChanger ? action.trim() : null }, { onSuccess: () => (setTexte(""), setAction("")) })}
        >
          Enregistrer le contrôle
        </button>
        <button className="btn btn-fantome" disabled={envoi.isPending} onClick={() => envoi.mutate({ action: "changement", polairesDixiemes: null, actionCorrective: null })}>
          Huile changée
        </button>
      </div>
      <MessageErreur erreur={envoi.error} />
      {historique.length > 0 && (
        <ul className="hygiene-historique">
          {historique.map((h) => (
            <li key={h.id}>
              {formaterDateHeure(h.le)} · {h.action === "changement" ? "huile changée" : `contrôle : ${pourcent(h.polairesDixiemes!)}`} · {h.par}
              {!h.conforme && <span className="puce puce-rouge"> {h.actionCorrective}</span>}
            </li>
          ))}
        </ul>
      )}
    </Carte>
  );
}

// ---------------------------------------------------------------------------

function Registre() {
  const aujourdhui = new Date().toLocaleDateString("fr-CA", { timeZone: "Europe/Paris" });
  const [du, setDu] = useState(`${aujourdhui.slice(0, 8)}01`);
  const [au, setAu] = useState(aujourdhui);
  const q = useQuery({ queryKey: ["hygiene-registre", du, au], queryFn: () => api.get<RegistreHygiene>(`/hygiene/registre?du=${du}&au=${au}`), enabled: du <= au });
  return (
    <>
      <div className="en-ligne" style={{ marginBottom: 14 }}>
        <label className="choix-periode">
          Du <input type="date" value={du} onChange={(ev) => setDu(ev.target.value)} />
        </label>
        <label className="choix-periode">
          au <input type="date" value={au} onChange={(ev) => setAu(ev.target.value)} />
        </label>
        <button className="btn btn-fantome" onClick={() => window.print()} disabled={!q.data}>
          <Printer size={15} /> Imprimer ou enregistrer en PDF
        </button>
      </div>
      {q.isPending && du <= au ? (
        <Chargement />
      ) : q.error ? (
        <MessageErreur erreur={q.error} />
      ) : q.data ? (
        <section className="carte registre-hygiene">
          <h2>
            Registre d'hygiène — {q.data.lieu}, du {new Date(q.data.du).toLocaleDateString("fr-FR")} au {new Date(q.data.au).toLocaleDateString("fr-FR")}
          </h2>
          <TableRegistre
            titre="Températures"
            vide="Aucun relevé"
            lignes={q.data.releves.map((r) => [formaterDateHeure(r.le), r.equipement, r.moment, formaterTemperature(r.temperatureDixiemes), r.conforme ? "conforme" : `HORS LIMITE — ${r.actionCorrective}`, r.par])}
          />
          <TableRegistre titre="Nettoyage et contrôles" vide="Aucune tâche" lignes={q.data.taches.map((t) => [formaterDateHeure(t.le), t.tache, "fait", t.commentaire ?? "", "", t.par])} />
          <TableRegistre
            titre="Réceptions"
            vide="Aucune réception"
            lignes={q.data.receptions.map((r) => [formaterDateHeure(r.le), `${r.fournisseur} · ${r.produits}${r.photoId ? " · photo jointe" : ""}`, r.type, r.temperatureDixiemes !== null ? formaterTemperature(r.temperatureDixiemes) : "—", r.conforme ? "conforme" : `NON CONFORME — ${r.actionCorrective}`, r.par])}
          />
          <TableRegistre
            titre="Huile de friture"
            vide="Aucun contrôle"
            lignes={q.data.huiles.map((h) => [formaterDateHeure(h.le), h.equipement, h.action === "changement" ? "changement" : "contrôle", h.polairesDixiemes !== null ? pourcent(h.polairesDixiemes) : "—", h.conforme ? "conforme" : `À CHANGER — ${h.actionCorrective}`, h.par])}
          />
        </section>
      ) : null}
    </>
  );
}

function TableRegistre({ titre, lignes, vide }: { titre: string; lignes: string[][]; vide: string }) {
  return (
    <>
      <h3 style={{ margin: "16px 0 6px" }}>{titre}</h3>
      {lignes.length === 0 ? (
        <p className="discret" style={{ margin: 0 }}>{vide}.</p>
      ) : (
        <div className="scroll-x">
          <table className="tableau">
            <tbody>
              {lignes.map((l, i) => (
                <tr key={i}>
                  {l.map((c, j) => (
                    <td key={j} className={c.startsWith("HORS") || c.startsWith("NON") || c.startsWith("À CHANGER") ? "texte-rouge" : undefined}>
                      {c}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------

const EQUIPEMENTS_SUGGERES: [string, SorteEquipement][] = [
  ["Frigo bar", "froid"],
  ["Vitrine réfrigérée", "froid"],
  ["Congélateur", "surgele"],
  ["Vitrine chaude", "chaud"],
  ["Friteuse", "friteuse"],
];
const TACHES_SUGGEREES: [string, MomentTache][] = [
  ["Laver et désinfecter les plans de travail", "ouverture"],
  ["Vérifier savon et essuie-mains au lave-mains", "ouverture"],
  ["Vérifier les dates limites", "ouverture"],
  ["Nettoyer la tireuse", "fermeture"],
  ["Vider et nettoyer les poubelles", "fermeture"],
  ["Nettoyer la friteuse", "fermeture"],
  ["Dégivrer et nettoyer les frigos", "semaine"],
];

function Reglages({ d }: { d: Donnees }) {
  const client = useQueryClient();
  const stands = useQuery({ queryKey: ["stands"], queryFn: () => api.get<Stand[]>("/stands") });
  const apres = (x: Donnees) => client.setQueryData(CLE, x);
  const ajouterEquipement = useMutation({ mutationFn: (x: object) => api.post<Donnees>("/hygiene/equipements", x), onSuccess: apres });
  const modifierEquipement = useMutation({ mutationFn: ({ id, ...x }: { id: string; actif: boolean }) => api.patch<Donnees>(`/hygiene/equipements/${id}`, x), onSuccess: apres });
  const ajouterTache = useMutation({ mutationFn: (x: object) => api.post<Donnees>("/hygiene/taches", x), onSuccess: apres });
  const modifierTache = useMutation({ mutationFn: ({ id, ...x }: { id: string; actif: boolean }) => api.patch<Donnees>(`/hygiene/taches/${id}`, x), onSuccess: apres });
  const [nom, setNom] = useState("");
  const [sorte, setSorte] = useState<SorteEquipement>("froid");
  const [standId, setStandId] = useState("");
  const [max, setMax] = useState("");
  const [tache, setTache] = useState("");
  const [moment, setMoment] = useState<MomentTache>("ouverture");
  const maxLu = max.trim() ? lireTemperature(max) : null;
  const nomsStand = new Map((stands.data ?? []).map((s) => [s.id, s.nom]));
  const equipementsProposes = EQUIPEMENTS_SUGGERES.filter(([n]) => !d.equipements.some((e) => e.nom.toLowerCase() === n.toLowerCase()));
  const tachesProposees = TACHES_SUGGEREES.filter(([n]) => !d.taches.some((t) => t.nom.toLowerCase() === n.toLowerCase()));

  return (
    <>
      <Carte titre="Équipements" description="Frigos, congélateurs, vitrines et friteuses à suivre. Un équipement se désactive, il ne se supprime pas (le registre garde son nom).">
        {d.equipements.map((e) => (
          <div key={e.id} className={`frais-ligne${e.actif ? "" : " inactive"}`}>
            <div className="frais-nom">
              <strong>{e.nom}</strong>
              <small className="discret">
                {SORTES_EQUIPEMENT.find((s) => s.sorte === e.sorte)!.libelle}
                {e.sorte !== "friteuse" ? ` · ${libelleLimites(limitesEquipement(e))}` : ""}
                {e.standId ? ` · ${nomsStand.get(e.standId) ?? ""}` : ""}
              </small>
            </div>
            <div className="frais-actions">
              <button className="btn btn-fantome" disabled={modifierEquipement.isPending} onClick={() => modifierEquipement.mutate({ id: e.id, actif: !e.actif })}>
                {e.actif ? "Désactiver" : "Réactiver"}
              </button>
            </div>
          </div>
        ))}
        <form
          className="grille-champs"
          style={{ alignItems: "end", marginTop: 14 }}
          onSubmit={(ev) => {
            ev.preventDefault();
            if (!nom.trim() || (max.trim() && maxLu === null)) return;
            const limite = maxLu === null ? {} : sorte === "chaud" ? { minDixiemes: maxLu } : { maxDixiemes: maxLu };
            ajouterEquipement.mutate({ nom: nom.trim(), sorte, standId: standId || null, ...limite }, { onSuccess: () => (setNom(""), setMax("")) });
          }}
        >
          <label className="champ">
            <span>Nouvel équipement</span>
            <input type="text" value={nom} onChange={(ev) => setNom(ev.target.value)} maxLength={60} placeholder="Ex. : frigo bar nord" />
          </label>
          <label className="champ">
            <span>Sorte</span>
            <select value={sorte} onChange={(ev) => setSorte(ev.target.value as SorteEquipement)}>
              {SORTES_EQUIPEMENT.map((s) => (
                <option key={s.sorte} value={s.sorte}>
                  {s.libelle}
                </option>
              ))}
            </select>
          </label>
          <label className="champ">
            <span>Stand (facultatif)</span>
            <select value={standId} onChange={(ev) => setStandId(ev.target.value)}>
              <option value="">Tout le lieu</option>
              {(stands.data ?? []).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nom}
                </option>
              ))}
            </select>
          </label>
          {sorte !== "friteuse" && (
            <label className="champ">
              <span>{sorte === "chaud" ? "Au moins (°C, facultatif)" : "Au plus (°C, facultatif)"}</span>
              <input type="text" inputMode="decimal" value={max} onChange={(ev) => setMax(ev.target.value)} placeholder={libelleLimites(limitesEquipement({ sorte, minDixiemes: null, maxDixiemes: null }))} />
            </label>
          )}
          <button className="btn" disabled={!nom.trim() || ajouterEquipement.isPending}>
            <Plus size={16} /> Ajouter
          </button>
        </form>
        {equipementsProposes.length > 0 && (
          <div className="en-ligne" style={{ marginTop: 10 }}>
            <span className="discret">Idées :</span>
            {equipementsProposes.map(([n, s]) => (
              <button key={n} type="button" className="puce-choix" onClick={() => (setNom(n), setSorte(s))}>
                {n}
              </button>
            ))}
          </div>
        )}
        <MessageErreur erreur={ajouterEquipement.error ?? modifierEquipement.error} />
      </Carte>

      <Carte titre="Nettoyage et contrôles" description="Les tâches à cocher à l'ouverture, à la fermeture ou chaque semaine.">
        {d.taches.map((t) => (
          <div key={t.id} className={`frais-ligne${t.actif ? "" : " inactive"}`}>
            <div className="frais-nom">
              <strong>{t.nom}</strong>
              <small className="discret">{MOMENTS_TACHE.find((m) => m.moment === t.moment)!.libelle}</small>
            </div>
            <div className="frais-actions">
              <button className="btn btn-fantome" disabled={modifierTache.isPending} onClick={() => modifierTache.mutate({ id: t.id, actif: !t.actif })}>
                {t.actif ? "Désactiver" : "Réactiver"}
              </button>
            </div>
          </div>
        ))}
        <form
          className="grille-champs"
          style={{ alignItems: "end", marginTop: 14 }}
          onSubmit={(ev) => {
            ev.preventDefault();
            if (tache.trim()) ajouterTache.mutate({ nom: tache.trim(), moment }, { onSuccess: () => setTache("") });
          }}
        >
          <label className="champ">
            <span>Nouvelle tâche</span>
            <input type="text" value={tache} onChange={(ev) => setTache(ev.target.value)} maxLength={120} placeholder="Ex. : nettoyer la tireuse" />
          </label>
          <label className="champ">
            <span>Quand</span>
            <select value={moment} onChange={(ev) => setMoment(ev.target.value as MomentTache)}>
              {MOMENTS_TACHE.map((m) => (
                <option key={m.moment} value={m.moment}>
                  {m.libelle}
                </option>
              ))}
            </select>
          </label>
          <button className="btn" disabled={!tache.trim() || ajouterTache.isPending}>
            <Plus size={16} /> Ajouter
          </button>
        </form>
        {tachesProposees.length > 0 && (
          <div className="en-ligne" style={{ marginTop: 10 }}>
            <span className="discret">Idées :</span>
            {tachesProposees.map(([n, m]) => (
              <button key={n} type="button" className="puce-choix" onClick={() => (setTache(n), setMoment(m))}>
                {n}
              </button>
            ))}
          </div>
        )}
        <MessageErreur erreur={ajouterTache.error ?? modifierTache.error} />
      </Carte>
    </>
  );
}
