import { useEffect, useState } from "react";
import { Link } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  formaterPourcentage,
  libelleMois,
  libellePeriode,
  libelleTauxTva,
  type Periode,
  lireMontant,
  lirePourcentage,
  montantPourSaisie,
  UNITES_DEPENSE,
  type FinancesSoiree,
  type LigneDepense,
  type ModeDepense,
  type StatsMatch,
} from "@flaix/domain";
import { api, formaterDateHeure } from "../../api.ts";
import { Carte, Chargement, MessageErreur } from "../../composants/communs.tsx";
import { Cascade, Empile, euros, type EtapeCascade } from "./graphiques.tsx";

const dateCourte = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Paris" });
const pct = (part: number | null, total: number) => (part === null || total <= 0 ? null : `${((part / total) * 100).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`);
const signe = (v: number) => `${v > 0 ? "+" : v < 0 ? "−" : ""}${euros(Math.abs(v))}`;

/**
 * Gestion financière de la soirée (module 11 ; dossier §14 module 11, §15.79, §15.132) : ce qui est entré,
 * ce qui est sorti, ce qu'il reste. Les chiffres calculés se lisent ; seules les dépenses se saisissent.
 * « Ce qu'il te reste » (§15.154) : tous les frais déduits, dont la part des frais du mois (Mes frais).
 */
export function VueFinances({ evenementId, periode, s }: { evenementId?: string; periode?: Periode; s: StatsMatch }) {
  const cle = evenementId ?? `${periode!.du}:${periode!.au}`;
  const chemin = evenementId ? `/finances?evenementId=${evenementId}` : `/finances?du=${periode!.du}&au=${periode!.au}`;
  const q = useQuery({ queryKey: ["finances", cle], queryFn: () => api.get<FinancesSoiree>(chemin) });
  if (q.isPending) return <Chargement />;
  if (q.error) return <MessageErreur erreur={q.error} />;
  const f = q.data!;
  const n = f.tickets, sp = f.evenement.spectateurs;
  const par = (v: number | null) =>
    v === null ? null : [n > 0 ? `${euros(Math.round(v / n))} par ticket` : null, sp ? `${euros(Math.round(v / sp))} par spectateur` : null].filter(Boolean).join(" · ") || null;

  const etapes: EtapeCascade[] = [
    { l1: "Encaissé", l2: "TTC", v: f.encaisseTtc, total: true, aide: "Carte et espèces, annulations déduites" },
    { l1: "TVA", l2: "collectée", v: -f.tva, total: false, aide: "Collectée pour l'État" },
    { l1: "CA HT", v: f.caHt, total: true, aide: "Ce qui revient au lieu" },
  ];
  if (f.coutMatiere !== null && f.margeBrute !== null) {
    etapes.push({ l1: "Coût", l2: "matière", v: -f.coutMatiere, total: false, aide: "Quantités vendues × coût de la fiche produit" });
    etapes.push({ l1: "Marge", l2: "brute", v: f.margeBrute, total: true, aide: pct(f.margeBrute, f.caHt) ? `${pct(f.margeBrute, f.caHt)} du CA HT` : "" });
    if (f.personnel.reel !== null) {
      if (f.ecartStock) etapes.push({ l1: "Écarts", l2: "de stock", v: f.ecartStock, total: false, aide: "Restes comptés en fin de soirée : casse, pertes" });
      etapes.push({ l1: "Personnel", l2: "planning", v: -f.personnel.reel, total: false, aide: `${f.personnel.affectations} affectation${f.personnel.affectations > 1 ? "s" : ""}, heures réelles × taux` });
      etapes.push({ l1: "Frais", l2: f.periode ? "des soirées" : "de la soirée", v: -f.totalDepenses, total: false, aide: `${f.depenses.filter((d) => d.mode !== null).length} frais` });
      if (f.totalFraisMois) etapes.push({ l1: "Frais", l2: "du mois", v: -f.totalFraisMois, total: false, aide: "Loyer, abonnements, salaires hors soirée… au prorata du CA HT" });
      etapes.push({ l1: "Il te", l2: "reste", v: f.margeNette!, total: true, aide: pct(f.margeNette, f.caHt) ? `${pct(f.margeNette, f.caHt)} du CA HT` : "" });
    }
  }
  const c = f.etatCible;

  return (
    <>
      <p className="note" style={{ marginTop: 0 }}>
        {f.periode ? (
          <>
            Tout cet écran porte sur la période <strong>{libellePeriode(f.periode)}</strong> : {f.periode.soirees.length} soirée{f.periode.soirees.length > 1 ? "s" : ""}, {n.toLocaleString("fr-FR")} ticket{n > 1 ? "s" : ""}
            {sp ? `, ${sp.toLocaleString("fr-FR")} spectateurs` : ", affluence incomplète"}.
          </>
        ) : (
          <>
            Tout cet écran porte sur la seule soirée <strong>{f.evenement.libelle}</strong> du {dateCourte.format(new Date(f.evenement.debut))} : {n.toLocaleString("fr-FR")} ticket{n > 1 ? "s" : ""}
            {sp ? `, ${sp.toLocaleString("fr-FR")} spectateurs` : ", affluence non saisie"}.
          </>
        )}
      </p>
      <div className="chiffres">
        <Chiffre
          misEnAvant
          etiquette="Ce qu'il te reste"
          valeur={f.margeNette === null ? (f.margeBrute === null ? "Coût manquant" : "Taux manquant") : euros(f.margeNette)}
          detail={
            c && c.ecart !== null ? (
              <span className={`variation ${c.tenue ? "hausse" : "baisse"}`}>
                {c.tenue ? "cible tenue" : "sous la cible"} ({formaterPourcentage(c.ciblePb)}) : {signe(c.ecart)}
              </span>
            ) : f.margeNette !== null ? (
              `${pct(f.margeNette, f.caHt) ?? "—"} du CA HT · tout déduit, avant impôt`
            ) : null
          }
        />
        <Chiffre etiquette="Encaissé TTC" valeur={euros(f.encaisseTtc)} detail={par(f.encaisseTtc)} />
        <Chiffre etiquette="Chiffre d'affaires HT" valeur={euros(f.caHt)} detail={`TVA collectée ${euros(f.tva)}`} />
        <Chiffre etiquette="Marge brute" valeur={f.margeBrute === null ? "Coût manquant" : euros(f.margeBrute)} detail={f.margeBrute === null ? null : `${pct(f.margeBrute, f.caHt) ?? "—"} du CA HT`} />
      </div>
      {f.fraisAVerifier > 0 && (
        <div className="message message-alerte">
          <strong>
            {f.fraisAVerifier} frais encore à vérifier
          </strong>{" "}
          dans Mes frais : tant qu'ils ne sont ni renseignés ni « pas concerné », ce qu'il te reste peut être trop beau. <Link to="/parametres/frais">Vérifier mes frais</Link>
        </div>
      )}

      <Carte
        titre={f.periode ? "De l'encaissé à ce qu'il te reste, sur la période" : "De l'encaissé à ce qu'il te reste"}
        actions={
          <div className="leg-inline">
            <span>
              <i className="pastille" style={{ background: "var(--violet)" }} />
              Totaux
            </span>
            <span>
              <i className="pastille" style={{ background: "var(--gris-graph)" }} />
              Ce qui est retiré
            </span>
          </div>
        }
      >
        <div className="graphe-defile">
          <Cascade etapes={etapes} />
        </div>
        {f.margeBrute === null && (
          <div className="message message-alerte">
            <strong>Coût manquant</strong> sur {f.produitsSansCout.join(", ")} : la marge n'est pas calculée. <Link to="/parametres/produits">Saisir les coûts</Link>
          </div>
        )}
        {f.margeBrute !== null && f.personnel.reel === null && (
          <div className="message message-alerte">
            <strong>Taux manquant</strong> sur {f.personnel.tauxManquants} affectation{f.personnel.tauxManquants > 1 ? "s" : ""} du planning : ce qu'il te reste n'est pas calculé. <Link to="/equipe">Compléter les fiches</Link>
          </div>
        )}
        <p className="note">
          {f.personnel.affectations === 0 ? "Aucun planning saisi pour cet événement : le personnel compte pour 0 € (Équipe → Planning). " : ""}
          Les frais du mois (loyer, abonnements, salaires hors soirée, assurance…) sont répartis sur les soirées du mois au prorata de leur CA HT. L'impôt sur les bénéfices n'est pas déduit.
        </p>
      </Carte>

      <FraisDuMois f={f} />

      <div className="deux egal">
        <Depenses f={f} />
        {f.periode ? <SoireesDeLaPeriode f={f} /> : <CibleSoiree f={f} />}
      </div>

      <div className="deux egal">
        <Carte titre="TVA collectée par taux">
          <div className="scroll-x">
            <table className="tableau">
              <thead>
                <tr>
                  <th>Taux</th>
                  <th className="d">HT</th>
                  <th className="d">TVA</th>
                  <th className="d">TTC</th>
                </tr>
              </thead>
              <tbody>
                {s.parTaux.map((t) => (
                  <tr key={t.tauxTva}>
                    <td>{libelleTauxTva(t.tauxTva)}</td>
                    <td className="d chiffre">{euros(t.ht)}</td>
                    <td className="d chiffre">{euros(t.tva)}</td>
                    <td className="d chiffre">{euros(t.ttc)}</td>
                  </tr>
                ))}
                <tr>
                  <td><strong>Total</strong></td>
                  <td className="d chiffre"><strong>{euros(s.caHt)}</strong></td>
                  <td className="d chiffre"><strong>{euros(s.tva)}</strong></td>
                  <td className="d chiffre"><strong>{euros(s.caTtc)}</strong></td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="note">Contribution {f.periode ? "de la période" : "de l'événement"} à la déclaration de TVA, à remettre à l'expert-comptable : il y manque la TVA déductible sur les achats.</p>
        </Carte>
        <Carte titre="Comment les clients ont payé" description={`${euros(s.caTtc)} TTC`}>
          <Empile
            parts={[
              { nom: "Carte (TPE du lieu)", v: s.parMode.carte, couleur: "var(--c1)" },
              { nom: "Espèces", v: s.parMode.especes, couleur: "var(--c3)" },
            ]}
          />
          <p className="note">La carte passe par le TPE du lieu, non relié à FlaiX : la caisse enregistre « carte », sans encaisser.</p>
        </Carte>
      </div>
    </>
  );
}

function Chiffre({ etiquette, valeur, detail, misEnAvant }: { etiquette: string; valeur: string; detail?: React.ReactNode; misEnAvant?: boolean }) {
  return (
    <div className={`chiffre-cle${misEnAvant ? " mis-en-avant" : ""}`}>
      <span className="etiquette">{etiquette}</span>
      <span className="valeur">{valeur}</span>
      {detail && <span className="variation neutre">{detail}</span>}
    </div>
  );
}

/** Part des frais du mois portée par la soirée ou la période (§15.154). */
function FraisDuMois({ f }: { f: FinancesSoiree }) {
  return (
    <Carte
      titre="Frais du mois"
      description={f.periode ? "Ce que portent les soirées de la période ; un mois entier sans match compte ses frais en entier." : "Ce que porte cette soirée : les frais du mois × son CA HT ÷ le CA HT de toutes les soirées du mois."}
      actions={<Link to="/parametres/frais" className="btn btn-fantome">Mes frais</Link>}
    >
      {f.fraisMois.length === 0 ? (
        <p className="note" style={{ margin: 0 }}>
          Aucun frais du mois renseigné : loyer, abonnements, assurance, salaires hors soirée… se saisissent dans <Link to="/parametres/frais">Mes frais</Link>.
        </p>
      ) : (
        <div className="scroll-x">
          <table className="tableau">
            <thead>
              <tr>
                <th>Mois</th>
                <th className="d">Frais du mois</th>
                <th className="d">CA HT du mois</th>
                <th className="d">{f.periode ? "Porté par la période" : "Porté par la soirée"}</th>
              </tr>
            </thead>
            <tbody>
              {f.fraisMois.map((m) => (
                <tr key={m.mois}>
                  <td>
                    {libelleMois(m.mois)} {m.sansSoiree && <span className="puce puce-ambre">sans match</span>}
                  </td>
                  <td className="d chiffre">{euros(m.fraisDuMois)}</td>
                  <td className="d chiffre">{m.sansSoiree ? "—" : euros(m.caHtDuMois)}</td>
                  <td className="d chiffre">
                    <strong>{euros(m.part)}</strong> {!m.sansSoiree && m.fraisDuMois > 0 && <span className="discret">({pct(m.part, m.fraisDuMois)})</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Carte>
  );
}

/** Frais de la soirée : les calculés se lisent, les autres se saisissent frais par frais (ou prennent leur montant habituel). */
function Depenses({ f }: { f: FinancesSoiree }) {
  const lignes = f.depenses;
  return (
    <Carte
      titre={f.periode ? "Frais des soirées de la période" : "Frais de la soirée"}
      description={
        f.periode
          ? "Somme des frais de chaque soirée. Ils se saisissent soirée par soirée : choisis « Un événement »."
          : "Un frais avec un montant habituel (Mes frais) s'applique tout seul ; une saisie ici le remplace pour cette soirée."
      }
      actions={<Link to="/parametres/frais" className="btn btn-fantome">Mes frais</Link>}
    >
      <div className="scroll-x">
        <table className="tableau">
          <thead>
            <tr>
              <th>Poste</th>
              <th>Saisie</th>
              <th className="d">Montant</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Coût matière <span className="puce">calculé</span></td>
              <td className="discret">Ventes × coût des fiches produits</td>
              <td className="d chiffre">{f.coutMatiere === null ? "coût manquant" : euros(f.coutMatiere)}</td>
            </tr>
            <tr>
              <td>Personnel <span className="puce">calculé</span></td>
              <td className="discret">
                <Link to="/equipe">Planning d'Équipe</Link>
              </td>
              <td className="d chiffre">{f.personnel.reel === null ? "taux manquant" : euros(f.personnel.reel)}</td>
            </tr>
            {f.ecartStock !== null && (
              <tr>
                <td>Écarts de stock <span className="puce">calculé</span></td>
                <td className="discret">
                  <Link to="/stock">Restes comptés</Link>
                </td>
                <td className="d chiffre">{euros(f.ecartStock)}</td>
              </tr>
            )}
            {lignes.map((d) =>
              f.periode ? (
                <tr key={d.posteId}>
                  <td>{d.nom}</td>
                  <td className="discret">total des soirées</td>
                  <td className="d chiffre">{euros(d.montant)}</td>
                </tr>
              ) : (
                <LigneSaisie key={d.posteId} evenementId={f.evenement.id} d={d} />
              ),
            )}
            <tr>
              <td colSpan={2}>
                <strong>Total des frais de {f.periode ? "la période" : "la soirée"}</strong>
              </td>
              <td className="d chiffre">
                <strong>{euros(f.totalDepenses)}</strong>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      {lignes.length === 0 && !f.periode && (
        <p className="note">
          Aucun frais de soirée : ajoute-en (commission du club, frais de carte, sécurité…) dans <Link to="/parametres/frais">Mes frais</Link>.
        </p>
      )}
    </Carte>
  );
}

function LigneSaisie({ evenementId, d }: { evenementId: string; d: LigneDepense }) {
  const client = useQueryClient();
  const versTexte = (mode: ModeDepense | null, valeur: number | null) => (valeur === null ? "" : mode !== "euros" ? (valeur / 100).toLocaleString("fr-FR", { maximumFractionDigits: 2 }) : montantPourSaisie(valeur));
  // Montant habituel : affiché en indication, le champ reste vide (une saisie le remplace pour cette soirée).
  const propre = d.habituel ? { mode: null, valeur: null } : { mode: d.mode, valeur: d.valeur };
  const [mode, setMode] = useState<ModeDepense>(d.mode ?? "euros");
  const [texte, setTexte] = useState(versTexte(propre.mode, propre.valeur));
  useEffect(() => {
    setMode(d.mode ?? "euros");
    setTexte(d.habituel ? "" : versTexte(d.mode, d.valeur));
  }, [d.mode, d.valeur, d.habituel]);
  const enregistrer = useMutation({
    mutationFn: (corps: { mode: ModeDepense; valeur: number | null }) => api.put<FinancesSoiree>(`/finances/${evenementId}/depenses/${d.posteId}`, corps),
    onSuccess: (f) => {
      client.setQueryData(["finances", evenementId], f);
      void client.invalidateQueries({ queryKey: ["rapport-soiree"] });
    },
  });
  const valeur = texte.trim() === "" ? null : mode === "euros" ? lireMontant(texte) : lirePourcentage(texte);
  const invalide = texte.trim() !== "" && valeur === null;
  const change = valeur !== propre.valeur || (valeur !== null && mode !== propre.mode);
  const valider = (m = mode) => {
    const v = texte.trim() === "" ? null : m === "euros" ? lireMontant(texte) : lirePourcentage(texte);
    if (texte.trim() !== "" && v === null) return;
    if (v === propre.valeur && (v === null || m === propre.mode)) return;
    enregistrer.mutate({ mode: m, valeur: v });
  };

  return (
    <tr>
      <td>
        {d.nom} {!d.actif && <span className="puce">désactivé</span>} {d.habituel && <span className="puce puce-violet">habituel</span>}
        {enregistrer.error && <div className="message message-erreur">{(enregistrer.error as Error).message}</div>}
      </td>
      <td>
        <span className="en-ligne" style={{ gap: 6, flexWrap: "nowrap" }}>
          <input
            type="text"
            inputMode="decimal"
            aria-label={`Montant ${d.nom}`}
            value={texte}
            placeholder={d.habituel ? versTexte(d.mode, d.valeur) : "—"}
            onChange={(e) => setTexte(e.target.value)}
            onBlur={() => valider()}
            onKeyDown={(e) => e.key === "Enter" && valider()}
            style={{ width: 90, borderColor: invalide ? "var(--red)" : undefined }}
            disabled={!d.actif && d.mode === null}
          />
          <select
            aria-label={`Unité ${d.nom}`}
            value={mode}
            onChange={(e) => {
              const m = e.target.value as ModeDepense;
              setMode(m);
              if (texte.trim()) valider(m);
            }}
            style={{ width: "auto" }}
          >
            {UNITES_DEPENSE.map((u) => (
              <option key={u.mode} value={u.mode}>
                {u.libelle}
              </option>
            ))}
          </select>
          {change && !invalide && enregistrer.isPending && <span className="discret">…</span>}
        </span>
        {d.saisiPar && d.saisiLe && <small className="discret">par {d.saisiPar}, le {formaterDateHeure(d.saisiLe)}</small>}
      </td>
      <td className="d chiffre">{d.mode === null ? "—" : euros(d.montant)}</td>
    </tr>
  );
}

/** Bilan d'une période : chaque soirée, ce qu'il en reste et sa cible. */
function SoireesDeLaPeriode({ f }: { f: FinancesSoiree }) {
  const c = f.etatCible;
  return (
    <Carte titre="Soirée par soirée" description="Ce qu'il reste de chaque soirée de la période, comparé à sa cible.">
      {f.periode!.soirees.length === 0 ? (
        <p className="note" style={{ margin: 0 }}>Aucun événement dans cette période.</p>
      ) : (
        <div className="scroll-x">
          <table className="tableau">
            <thead>
              <tr>
                <th>Soirée</th>
                <th className="d">Encaissé TTC</th>
                <th className="d">Il te reste</th>
                <th>Cible</th>
              </tr>
            </thead>
            <tbody>
              {f.periode!.soirees.map((s) => (
                <tr key={s.id}>
                  <td>
                    {s.libelle} <span className="discret">· {dateCourte.format(new Date(s.debut))}</span>
                  </td>
                  <td className="d chiffre">{euros(s.encaisseTtc)}</td>
                  <td className="d chiffre">{s.margeNette === null ? "—" : euros(s.margeNette)}</td>
                  <td>
                    {s.etatCible === null ? (
                      <span className="discret">aucune</span>
                    ) : s.etatCible.ecart === null ? (
                      <span className="discret">{formaterPourcentage(s.etatCible.ciblePb)}</span>
                    ) : (
                      <span className={`etat-cible ${s.etatCible.tenue ? "tenue" : "sous"}`}>{signe(s.etatCible.ecart)}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="note">
        {c
          ? c.ecart === null
            ? `Cible de la période : ${euros(c.cible)} (somme des cibles des soirées).`
            : `Cible de la période : ${euros(c.cible)} (somme des cibles des soirées) — ${c.tenue ? "tenue" : "manquée"} de ${euros(Math.abs(c.ecart))}.`
          : "La cible de la période n'est jugée que si chaque soirée a une cible (Paramètres → Objectifs de marge)."}
      </p>
    </Carte>
  );
}

/** Cible de ce qu'il doit rester de la soirée : celle du lieu par défaut, ajustable pour cet événement. */
function CibleSoiree({ f }: { f: FinancesSoiree }) {
  const client = useQueryClient();
  const [texte, setTexte] = useState(f.cible.evenement !== null ? String(f.cible.evenement / 100).replace(".", ",") : "");
  const enregistrer = useMutation({
    mutationFn: (cible: number | null) => api.put<FinancesSoiree>(`/finances/${f.evenement.id}/cible`, { cible }),
    onSuccess: (nf) => {
      client.setQueryData(["finances", f.evenement.id], nf);
      setTexte(nf.cible.evenement !== null ? String(nf.cible.evenement / 100).replace(".", ",") : "");
    },
  });
  const valeur = lirePourcentage(texte, { min: -100 });
  const c = f.etatCible;
  return (
    <Carte titre="Cible : ce qu'il doit te rester" description="En % du CA HT de la soirée, tous frais compris (frais du mois inclus).">
      {c ? (
        <div className="message" style={{ marginTop: 0 }}>
          Cible {f.cible.evenement !== null ? "de cette soirée" : "du lieu"} : <strong>{formaterPourcentage(c.ciblePb)}</strong> du CA HT, soit <strong>{euros(c.cible)}</strong>.{" "}
          {c.ecart === null ? (
            "Ce qu'il te reste n'est pas encore calculable."
          ) : (
            <>
              Réalisé : <strong>{euros(f.margeNette!)}</strong>
              {c.tauxPb !== null && ` (${formaterPourcentage(c.tauxPb)})`} →{" "}
              <strong className={c.tenue ? "texte-vert" : "texte-ambre"}>
                {c.tenue ? "cible tenue" : "sous la cible"}, {signe(c.ecart)}
              </strong>
              .
            </>
          )}
        </div>
      ) : (
        <p className="note" style={{ marginTop: 0 }}>
          Aucune cible : ce qu'il te reste s'affiche sans être jugé. Règle la cible du lieu dans <Link to="/parametres/objectifs">Paramètres → Objectifs de marge</Link>, ou une cible pour cette soirée ci-dessous.
        </p>
      )}
      <form
        className="en-ligne"
        style={{ alignItems: "flex-end" }}
        onSubmit={(e) => {
          e.preventDefault();
          if (texte.trim() === "" || valeur !== null) enregistrer.mutate(texte.trim() === "" ? null : valeur);
        }}
      >
        <label className="champ" style={{ flex: "0 1 220px" }}>
          <span>Cible pour cette soirée (%)</span>
          <input type="text" inputMode="decimal" value={texte} onChange={(e) => setTexte(e.target.value)} placeholder={f.cible.lieu !== null ? `lieu : ${formaterPourcentage(f.cible.lieu)}` : "ex. 35"} />
        </label>
        <button className="btn" disabled={enregistrer.isPending || (texte.trim() !== "" && valeur === null)}>
          Enregistrer
        </button>
        {f.cible.evenement !== null && (
          <button type="button" className="btn btn-fantome" disabled={enregistrer.isPending} onClick={() => enregistrer.mutate(null)}>
            Revenir à la cible du lieu
          </button>
        )}
      </form>
      <MessageErreur erreur={enregistrer.error} />
    </Carte>
  );
}
