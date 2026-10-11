import { useEffect, useState } from "react";
import { Link } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { libelleMois, lireMontant, lirePourcentage, montantPourSaisie, UNITES_DEPENSE, formaterMontant, type LigneMesFrais, type MesFrais as Donnees, type ModeDepense } from "@flaix/domain";
import { api } from "../../api.ts";
import { Carte, Chargement, EntetePage, MessageErreur, Regles } from "../../composants/communs.tsx";
import { useOptions } from "../../session.tsx";

const CLE = ["mes-frais"];
const enTexte = (mode: ModeDepense | null, valeur: number | null) => (valeur === null ? "" : mode === "euros" ? montantPourSaisie(valeur) : (valeur / 100).toLocaleString("fr-FR", { maximumFractionDigits: 2 }));
const lire = (mode: ModeDepense, texte: string) => (mode === "euros" ? lireMontant(texte) : lirePourcentage(texte));

/** Après chaque enregistrement : Mes frais à jour, et tout ce qui en dépend relu. */
function useEnregistrer<T>(envoi: (x: T) => Promise<Donnees>) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: envoi,
    onSuccess: (d) => {
      client.setQueryData(CLE, d);
      void client.invalidateQueries({ queryKey: ["finances"] });
      void client.invalidateQueries({ queryKey: ["alertes"] });
    },
  });
}

/**
 * Mes frais (Paramètres ; dossier §15.154) : tous les frais de la buvette, pour savoir ce qu'il reste une fois tout
 * déduit. Une liste de frais courants est proposée : chacun se renseigne, ou se déclare « pas concerné ».
 */
export function MesFrais() {
  const q = useQuery({ queryKey: CLE, queryFn: () => api.get<Donnees>("/mes-frais") });
  if (q.isPending) return <Chargement />;
  if (q.error) return <MessageErreur erreur={q.error} />;
  const d = q.data!;
  const soiree = d.lignes.filter((l) => l.frequence === "soiree");
  const mois = d.lignes.filter((l) => l.frequence === "mois");
  const reste = d.proposes - d.verifies;

  return (
    <>
      <EntetePage fil="Paramètres" filLien="/parametres" titre="Mes frais" description="Tous les frais de la buvette, pour savoir ce qu'il te reste une fois tout déduit." />
      <Carte>
        <div className="frais-progres">
          <div>
            <strong>
              {d.verifies} frais vérifiés sur {d.proposes}
            </strong>
            <span className="discret">{reste > 0 ? ` · ${reste} à vérifier : renseigne-les, ou indique « pas concerné ».` : " · tout est vérifié."}</span>
          </div>
          <div className="frais-jauge" role="progressbar" aria-valuemin={0} aria-valuemax={d.proposes} aria-valuenow={d.verifies} aria-label="Frais vérifiés">
            <i style={{ width: `${d.proposes ? (d.verifies / d.proposes) * 100 : 0}%` }} />
          </div>
          <span className="discret">
            Frais du mois en cours ({libelleMois(d.mois)}) : <strong>{formaterMontant(d.totalMois)}</strong>, répartis sur les matchs du mois au prorata de leur chiffre d'affaires.
          </span>
        </div>
      </Carte>

      <Carte titre="À chaque soirée" description="Un montant habituel s'applique tout seul à chaque match ; sans montant habituel, le frais se saisit soirée par soirée dans Résultats → Finances.">
        {soiree.map((l) => (
          <LigneSoiree key={l.posteId ?? l.cle} l={l} />
        ))}
      </Carte>

      <Carte titre="Chaque mois" description="Le montant du mois en cours ; un nouveau montant vaut à partir de ce mois-ci, sans changer les mois passés. Pour un montant annuel, divise par 12.">
        {mois.map((l) => (
          <LigneMois key={l.fraisId ?? l.cle} l={l} mois={d.mois} />
        ))}
      </Carte>

      <NouveauFrais mois={d.mois} />

      <Regles>
        <ul>
          <li><strong>Ce qu'il te reste</strong> (Résultats → Finances) = chiffre d'affaires HT − marchandise vendue ± écarts de stock comptés − personnel − frais de la soirée − part des frais du mois. L'impôt sur les bénéfices n'est pas déduit.</li>
          <li><strong>Part des frais du mois</strong> = frais du mois × CA HT du match ÷ CA HT de tous les matchs du mois. Un mois sans match compte ses frais en entier dans le bilan d'une période qui le contient.</li>
          <li><strong>Frais de soirée</strong> : en euros, en % du CA HT (commission du club) ou en % des paiements par carte (frais bancaires). Une saisie dans Finances remplace le montant habituel pour cette soirée seulement.</li>
          <li><strong>Loyer, logiciels, TPE</strong> : stand par stand dans Coûts par buvette quand ce module est activé, sinon ici pour tout le lieu.</li>
          <li>Chaque ajout, montant ou « pas concerné » est inscrit au journal technique.</li>
        </ul>
      </Regles>
    </>
  );
}

function Statut({ l }: { l: LigneMesFrais }) {
  return l.statut === "renseigne" ? <span className="puce puce-vert">renseigné</span> : l.statut === "pas_concerne" ? <span className="puce">pas concerné</span> : <span className="puce puce-ambre">à vérifier</span>;
}

function Nom({ l }: { l: LigneMesFrais }) {
  return (
    <div className="frais-nom">
      <span>
        <strong>{l.libelle}</strong> <Statut l={l} />
      </span>
      {l.aide && <small className="discret">{l.aide}</small>}
    </div>
  );
}

function PasConcerne({ l }: { l: LigneMesFrais }) {
  const m = useEnregistrer((pasConcerne: boolean) => api.put<Donnees>(`/mes-frais/pas-concerne/${l.cle}`, { pasConcerne }));
  if (!l.cle) return null;
  return l.statut === "pas_concerne" ? (
    <button className="btn-lien" disabled={m.isPending} onClick={() => m.mutate(false)}>
      Remettre à vérifier
    </button>
  ) : l.statut === "a_verifier" ? (
    <button className="btn btn-fantome" disabled={m.isPending} onClick={() => m.mutate(true)}>
      Pas concerné
    </button>
  ) : null;
}

function LigneSoiree({ l }: { l: LigneMesFrais }) {
  const [mode, setMode] = useState<ModeDepense>(l.modeHabituel ?? l.modeSuggere ?? "euros");
  const [texte, setTexte] = useState(enTexte(l.modeHabituel, l.valeurHabituelle));
  useEffect(() => {
    setMode(l.modeHabituel ?? l.modeSuggere ?? "euros");
    setTexte(enTexte(l.modeHabituel, l.valeurHabituelle));
  }, [l.modeHabituel, l.valeurHabituelle, l.modeSuggere]);
  const ajouter = useEnregistrer((x: { modeHabituel: ModeDepense | null; valeurHabituelle: number | null }) => api.post<Donnees>("/mes-frais/soiree", { cle: l.cle, ...x }));
  const habituel = useEnregistrer((x: { modeHabituel: ModeDepense | null; valeurHabituelle: number | null }) => api.put<Donnees>(`/mes-frais/soiree/${l.posteId}`, x));
  const valeur = texte.trim() === "" ? null : lire(mode, texte);
  const invalide = texte.trim() !== "" && valeur === null;
  const corps = { modeHabituel: valeur === null ? null : mode, valeurHabituelle: valeur };
  const enregistrer = (m = mode) => {
    const v = texte.trim() === "" ? null : lire(m, texte);
    if (texte.trim() !== "" && v === null) return;
    if (v === l.valeurHabituelle && (v === null || m === l.modeHabituel)) return;
    habituel.mutate({ modeHabituel: v === null ? null : m, valeurHabituelle: v });
  };

  return (
    <div className="frais-ligne">
      <Nom l={l} />
      {l.statut === "pas_concerne" ? (
        <div className="frais-actions">
          <PasConcerne l={l} />
        </div>
      ) : (
        <div className="frais-actions">
          <input
            type="text"
            inputMode="decimal"
            aria-label={`Montant habituel : ${l.libelle}`}
            placeholder={l.statut === "renseigne" ? "saisi à chaque soirée" : "montant habituel"}
            value={texte}
            onChange={(e) => setTexte(e.target.value)}
            onBlur={() => l.statut === "renseigne" && enregistrer()}
            onKeyDown={(e) => e.key === "Enter" && l.statut === "renseigne" && enregistrer()}
            style={{ width: 150, borderColor: invalide ? "var(--red)" : undefined }}
          />
          <select
            aria-label={`Unité : ${l.libelle}`}
            value={mode}
            onChange={(e) => {
              const m = e.target.value as ModeDepense;
              setMode(m);
              if (l.statut === "renseigne" && texte.trim()) enregistrer(m);
            }}
            style={{ width: "auto" }}
          >
            {UNITES_DEPENSE.map((u) => (
              <option key={u.mode} value={u.mode}>
                {u.libelle}
              </option>
            ))}
          </select>
          {l.statut === "a_verifier" && (
            <>
              <button className="btn" disabled={invalide || ajouter.isPending} onClick={() => ajouter.mutate(corps)}>
                J'ai ce frais
              </button>
              <PasConcerne l={l} />
            </>
          )}
        </div>
      )}
      <MessageErreur erreur={ajouter.error ?? habituel.error} />
    </div>
  );
}

function LigneMois({ l, mois }: { l: LigneMesFrais; mois: string }) {
  const options = useOptions();
  const [texte, setTexte] = useState(l.fraisId && l.montantMois !== null ? montantPourSaisie(l.montantMois) : "");
  useEffect(() => setTexte(l.fraisId && l.montantMois !== null ? montantPourSaisie(l.montantMois) : ""), [l.fraisId, l.montantMois]);
  const ajouter = useEnregistrer((montant: number) => api.post<Donnees>("/mes-frais/mois", { cle: l.cle, montant, aPartirDe: mois }));
  const changer = useEnregistrer((montant: number) => api.put<Donnees>(`/mes-frais/mois/${l.fraisId}`, { montant, aPartirDe: mois }));
  const montant = texte.trim() === "" ? null : lireMontant(texte);
  const invalide = texte.trim() !== "" && montant === null;
  const parStands = !!l.parStand && options.couts_buvette && !l.fraisId;

  return (
    <div className="frais-ligne">
      <Nom l={l} />
      <div className="frais-actions">
        {l.statut === "pas_concerne" ? (
          <PasConcerne l={l} />
        ) : parStands ? (
          <>
            <span className="chiffre">{l.montantMois ? `${formaterMontant(l.montantMois)} par mois` : ""}</span>
            <Link to="/parametres/couts" className="btn btn-fantome">
              Stand par stand
            </Link>
            <PasConcerne l={l} />
          </>
        ) : (
          <>
            <input
              type="text"
              inputMode="decimal"
              aria-label={`Montant par mois : ${l.libelle}`}
              placeholder="montant par mois"
              value={texte}
              onChange={(e) => setTexte(e.target.value)}
              onBlur={() => l.fraisId && montant !== null && montant !== l.montantMois && changer.mutate(montant)}
              onKeyDown={(e) => e.key === "Enter" && l.fraisId && montant !== null && montant !== l.montantMois && changer.mutate(montant)}
              style={{ width: 150, borderColor: invalide ? "var(--red)" : undefined }}
            />
            <span className="discret">€ / mois</span>
            {!l.fraisId && (
              <>
                <button className="btn" disabled={montant === null || ajouter.isPending} onClick={() => montant !== null && ajouter.mutate(montant)}>
                  J'ai ce frais
                </button>
                <PasConcerne l={l} />
              </>
            )}
          </>
        )}
      </div>
      <MessageErreur erreur={ajouter.error ?? changer.error} />
    </div>
  );
}

/** Un frais qui n'est pas dans la liste proposée. */
function NouveauFrais({ mois }: { mois: string }) {
  const [nom, setNom] = useState("");
  const [frequence, setFrequence] = useState<"soiree" | "mois">("mois");
  const [mode, setMode] = useState<ModeDepense>("euros");
  const [texte, setTexte] = useState("");
  const valeur = texte.trim() === "" ? null : frequence === "mois" ? lireMontant(texte) : lire(mode, texte);
  const ajouter = useEnregistrer(() =>
    frequence === "mois"
      ? api.post<Donnees>("/mes-frais/mois", { nom: nom.trim(), montant: valeur ?? 0, aPartirDe: mois })
      : api.post<Donnees>("/mes-frais/soiree", { nom: nom.trim(), modeHabituel: valeur === null ? null : mode, valeurHabituelle: valeur }),
  );
  const possible = nom.trim() !== "" && (texte.trim() === "" || valeur !== null) && (frequence === "soiree" || valeur !== null);
  return (
    <Carte titre="Un autre frais" description="Un frais qui n'est pas dans la liste : il compte dans ce qu'il te reste comme les autres.">
      <form
        className="grille-champs"
        style={{ alignItems: "end" }}
        onSubmit={(e) => {
          e.preventDefault();
          if (possible)
            ajouter.mutate(undefined, {
              onSuccess: () => {
                setNom("");
                setTexte("");
              },
            });
        }}
      >
        <label className="champ">
          <span>Nom du frais</span>
          <input type="text" value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Ex. : location du barnum" maxLength={60} />
        </label>
        <label className="champ">
          <span>Revient</span>
          <select value={frequence} onChange={(e) => setFrequence(e.target.value as "soiree" | "mois")}>
            <option value="mois">chaque mois</option>
            <option value="soiree">à chaque soirée</option>
          </select>
        </label>
        <label className="champ">
          <span>{frequence === "mois" ? "Montant par mois (€)" : "Montant habituel (facultatif)"}</span>
          <input type="text" inputMode="decimal" value={texte} onChange={(e) => setTexte(e.target.value)} />
        </label>
        {frequence === "soiree" && (
          <label className="champ">
            <span>Unité</span>
            <select value={mode} onChange={(e) => setMode(e.target.value as ModeDepense)}>
              {UNITES_DEPENSE.map((u) => (
                <option key={u.mode} value={u.mode}>
                  {u.libelle}
                </option>
              ))}
            </select>
          </label>
        )}
        <button className="btn" disabled={!possible || ajouter.isPending}>
          <Plus size={16} /> Ajouter
        </button>
      </form>
      <MessageErreur erreur={ajouter.error} />
    </Carte>
  );
}
