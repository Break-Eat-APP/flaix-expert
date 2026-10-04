import { Link, useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Printer, ShieldCheck, ShieldAlert } from "lucide-react";
import { formaterMontant, formaterPourcentage, libelleTauxTva, type Ecart, type LigneCascade, type RapportSoireeFige } from "@flaix/domain";
import { api, formaterDateHeure } from "../../api.ts";
import { Chargement, MessageErreur } from "../../composants/communs.tsx";

type Lu = RapportSoireeFige & { integre: boolean };

const dateLongue = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" });
const nombre = (n: number) => n.toLocaleString("fr-FR");
const signe = (n: number, f: (v: number) => string) => (n > 0 ? `+${f(n)}` : n < 0 ? `−${f(-n)}` : f(0));
const pct = (n: number) => `${n.toLocaleString("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} %`;
const partHt = (montant: number | null, caHt: number) => (montant === null || caHt <= 0 ? null : pct((montant / caHt) * 100));

/**
 * Rapport de soirée (module 9 ; dossier §15.131) : la synthèse figée d'un événement clos, sans menu
 * autour, à lire à l'écran ou à imprimer / enregistrer en PDF depuis le navigateur.
 */
export function RapportSoiree() {
  const { evenementId } = useParams();
  const q = useQuery({ queryKey: ["rapport-soiree", evenementId], queryFn: () => api.get<Lu>(`/rapports-soiree/${evenementId}`), retry: false });

  return (
    <div className="rapport-page">
      <div className="rapport-outils non-imprime">
        <Link to="/" className="btn btn-fantome">
          <ArrowLeft size={15} /> Résultats
        </Link>
        {q.data && (
          <button className="btn" onClick={() => window.print()}>
            <Printer size={15} /> Imprimer ou enregistrer en PDF
          </button>
        )}
      </div>
      {q.isPending ? <Chargement /> : q.error ? <MessageErreur erreur={q.error} /> : <Document lu={q.data!} />}
    </div>
  );
}

function Document({ lu }: { lu: Lu }) {
  const r = lu.rapport;
  const v = r.ventes;
  return (
    <article className="rapport-feuille">
      {r.lieu.formation && <div className="rapport-factice">FACTICE — mode formation : ce rapport n'a aucune valeur comptable</div>}
      <header className="rapport-entete">
        <div>
          <div className="rapport-marque">FlaiX Expert · Rapport de soirée</div>
          <h1>{r.evenement.libelle}</h1>
          <p>
            {dateLongue.format(new Date(r.evenement.debut))}
            {r.evenement.spectateurs !== null ? ` · ${nombre(r.evenement.spectateurs)} spectateurs` : " · affluence non saisie"}
          </p>
        </div>
        <div className="rapport-lieu">
          <strong>{r.lieu.nom}</strong>
          {r.lieu.raisonSociale && <span>{r.lieu.raisonSociale}</span>}
          {r.z && <span>Z de l'événement n° {r.z.sequence}</span>}
        </div>
      </header>

      <section className="rapport-chiffres" aria-label="L'essentiel">
        <Chiffre libelle="Encaissé TTC" valeur={formaterMontant(v.encaisseTtc)} />
        <Chiffre libelle="Tickets" valeur={nombre(v.tickets)} sous={v.panierMoyen !== null ? `panier moyen ${formaterMontant(v.panierMoyen)}` : undefined} />
        <Chiffre libelle="Par spectateur" valeur={v.caParSpectateur !== null ? formaterMontant(v.caParSpectateur) : "—"} sous={v.caParSpectateur === null ? "affluence non saisie" : "encaissé TTC"} />
        <Chiffre
          libelle="Marge nette de la soirée"
          valeur={r.margeNette !== null ? formaterMontant(r.margeNette) : "non calculable"}
          sous={
            r.margeNette === null
              ? r.margeBrute === null
                ? "coût manquant"
                : "taux horaire manquant"
              : r.cibleMargeNette && r.cibleMargeNette.ecart !== null
                ? `${r.cibleMargeNette.tenue ? "cible tenue" : "sous la cible"} (${formaterPourcentage(r.cibleMargeNette.ciblePb)}) : ${signe(r.cibleMargeNette.ecart, formaterMontant)}`
                : `${partHt(r.margeNette, v.caHt) ?? ""} du CA HT`
          }
        />
      </section>

      <Section titre="Résultat de la soirée" description="Du montant encaissé à ce qui reste une fois payés la TVA, la marchandise vendue, le personnel et les dépenses de la soirée.">
        <Cascade lignes={r.cascade} caHt={v.caHt} />
        {r.depenses && r.depenses.length > 0 && (
          <p className="rapport-note">
            Dépenses de la soirée, telles que saisies à la clôture :{" "}
            {r.depenses.map((d) => `${d.nom} ${formaterMontant(d.montant)}${d.pourcentPb !== null ? ` (${formaterPourcentage(d.pourcentPb)} du CA HT)` : ""}`).join(" · ")}.
          </p>
        )}
        {r.cibleMargeNette && (
          <p className="rapport-note">
            Cible de marge nette : {formaterPourcentage(r.cibleMargeNette.ciblePb)} du CA HT, soit {formaterMontant(r.cibleMargeNette.cible)}
            {r.cibleMargeNette.ecart !== null ? ` — ${r.cibleMargeNette.tenue ? "tenue" : "manquée"} de ${formaterMontant(Math.abs(r.cibleMargeNette.ecart))}.` : "."}
          </p>
        )}
        <p className="rapport-avertissement">
          La marge nette de la soirée <strong>n'est pas le bénéfice du lieu</strong> : le loyer, les salaires permanents, l'assurance, les amortissements et l'impôt n'y sont pas déduits.
          {r.depenses === undefined && " Rapport établi avant la saisie des dépenses de la soirée : elles n'y figurent pas."}
          {r.personnel.affectations === 0 && " Aucune personne n'était affectée à cet événement dans Équipe : le personnel compte pour 0 €."}
          {r.personnel.tauxManquants > 0 && ` ${r.personnel.tauxManquants} affectation${r.personnel.tauxManquants > 1 ? "s" : ""} sans taux horaire dans Équipe.`}
          {r.produitsSansCout.length > 0 && ` Coût d'achat manquant : ${r.produitsSansCout.join(", ")}.`}
        </p>
      </Section>

      <Section titre="Comparaison avec l'événement précédent" description={r.comparaison.evenement ? `${r.comparaison.evenement.libelle}, ${dateLongue.format(new Date(r.comparaison.evenement.debut))} : le dernier événement joué avant celui-ci (jamais une moyenne).` : undefined}>
        {r.comparaison.evenement ? (
          <Tableau
            entetes={["", "Cet événement", "Précédent", "Écart", "Écart %"]}
            droite={[1, 2, 3, 4]}
            lignes={[
              ligneEcart("Encaissé TTC", r.comparaison.encaisseTtc, formaterMontant),
              ligneEcart("Tickets", r.comparaison.tickets, nombre),
              ligneEcart("Panier moyen", r.comparaison.panierMoyen, formaterMontant),
              ligneEcart("Spectateurs", r.comparaison.spectateurs, nombre),
              ligneEcart("Marge brute", r.comparaison.margeBrute, formaterMontant),
              ligneEcart("Marge nette de la soirée", r.comparaison.margeNette, formaterMontant),
            ]}
          />
        ) : (
          <p className="rapport-vide">Premier événement avec des ventes : pas de comparaison possible.</p>
        )}
      </Section>

      <Section titre="Ventes">
        <div className="rapport-grille">
          <Tableau titre="Par moyen de paiement" entetes={["", "TTC"]} droite={[1]} lignes={[["Espèces", formaterMontant(v.parMode.especes)], ["Carte", formaterMontant(v.parMode.carte)]]} />
          <Tableau titre="TVA par taux" entetes={["Taux", "HT", "TVA", "TTC"]} droite={[1, 2, 3]} lignes={v.parTaux.map((t) => [libelleTauxTva(t.tauxTva), formaterMontant(t.ht), formaterMontant(t.tva), formaterMontant(t.ttc)])} />
          <Tableau titre="Par stand" entetes={["Stand", "TTC"]} droite={[1]} lignes={v.parStand.map((s) => [s.nom, formaterMontant(s.ca)])} vide="Aucune vente" />
          <Tableau titre="Par catégorie" entetes={["Catégorie", "TTC"]} droite={[1]} lignes={v.parCategorie.map((c) => [c.nom, formaterMontant(c.ca)])} vide="Aucune vente" />
        </div>
        <p className="rapport-note">
          {v.annulations.nombre > 0 ? `${v.annulations.nombre} ticket${v.annulations.nombre > 1 ? "s" : ""} annulé${v.annulations.nombre > 1 ? "s" : ""} (${formaterMontant(v.annulations.montant)}), déjà retirés des chiffres ci-dessus.` : "Aucune annulation."}{" "}
          Réductions accordées : remises {formaterMontant(v.reductions.remises)} · offerts {formaterMontant(v.reductions.offerts)} · codes promo et points {formaterMontant(v.reductions.fidelite)}.
        </p>
      </Section>

      <Section titre="Top produits">
        <div className="rapport-grille">
          <Tableau titre="Par marge" entetes={["Produit", "Qté", "Marge"]} droite={[1, 2]} lignes={r.top.parMarge.map((p) => [p.nom, nombre(p.quantite), formaterMontant(p.marge!)])} vide="Coûts manquants : marge non calculable" />
          <Tableau titre="Par quantité vendue" entetes={["Produit", "Qté", "TTC"]} droite={[1, 2]} lignes={r.top.parVolume.map((p) => [p.nom, nombre(p.quantite), formaterMontant(p.caTtc)])} vide="Aucune vente" />
        </div>
      </Section>

      <Section titre="Contrôle des espèces" description={`Écart compté, tiroirs et coffre : ${signe(r.especes.ecartTotal, formaterMontant)} · tolérance par tiroir ${formaterMontant(r.especes.seuil)}.`}>
        {r.especes.tiroirs.length === 0 && !r.especes.coffre ? (
          <p className="rapport-vide">Aucune caisse n'acceptait les espèces sur cet événement.</p>
        ) : (
          <Tableau
            entetes={["Tiroir", "Attendu", "Compté", "Écart", "Motif"]}
            droite={[1, 2, 3]}
            lignes={[
              ...r.especes.tiroirs.map((t) => [
                `Caisse ${t.caisse} · ${t.stand}${t.rectifie ? " (rectifié)" : ""}`,
                t.attendu !== null ? formaterMontant(t.attendu) : "—",
                t.compte !== null ? formaterMontant(t.compte) : "non compté",
                t.ecart !== null ? signe(t.ecart, formaterMontant) : "—",
                t.motif ?? "",
              ]),
              ...(r.especes.coffre
                ? [[`Coffre${r.especes.coffre.rectifie ? " (rectifié)" : ""}`, formaterMontant(r.especes.coffre.remonte), r.especes.coffre.compte !== null ? formaterMontant(r.especes.coffre.compte) : "non compté", r.especes.coffre.ecart !== null ? signe(r.especes.coffre.ecart, formaterMontant) : "—", ""]]
                : []),
            ]}
          />
        )}
      </Section>

      <Section titre="Écarts de stock" description={r.stock.suivi ? `Restes comptés en fin d'événement, comparés au calcul (mise en place + réassort − ventes). Valeur des écarts : ${signe(r.stock.valeurTotale, formaterMontant)}.` : undefined}>
        {!r.stock.suivi ? (
          <p className="rapport-vide">Stock non suivi sur cet événement (aucune mise en place ni réassort).</p>
        ) : r.stock.produits.length + r.stock.ingredients.length === 0 ? (
          <p className="rapport-vide">Aucun écart : tout ce qui a été compté correspond au calcul.</p>
        ) : (
          <Tableau
            entetes={["Article", "Stand", "Écart", "Valeur", "Motif"]}
            droite={[2, 3]}
            lignes={[
              ...r.stock.produits.map((p) => [p.nom, p.stand, signe(p.ecart, nombre), p.valeur !== null ? signe(p.valeur, formaterMontant) : "coût manquant", p.motif ?? ""]),
              ...r.stock.ingredients.map((i) => [i.nom, i.stand, i.ecart, i.valeur !== null ? signe(i.valeur, formaterMontant) : "prix manquant", i.motif ?? ""]),
            ]}
          />
        )}
      </Section>

      <Section titre="À surveiller" description="Instantané au moment où le rapport a été établi.">
        {r.alertes.length === 0 ? (
          <p className="rapport-vide">Rien à signaler.</p>
        ) : (
          <ul className="rapport-alertes">
            {r.alertes.map((a, i) => (
              <li key={i} className={a.niveau === "forte" ? "forte" : undefined}>
                <strong>{a.titre}</strong> — {a.detail}
              </li>
            ))}
          </ul>
        )}
      </Section>

      <footer className="rapport-pied">
        <p>
          Établi {lu.etabliA === "cloture" ? "à la clôture de l'événement" : "à la première consultation (événement clos avant l'existence du rapport)"}, le {formaterDateHeure(lu.etabliLe)}, par {lu.etabliPar}. Document figé : il ne se modifie plus. Une rectification de Z faite ensuite figure dans Clôtures, pas ici.
          {r.z && ` Z de l'événement : ${formaterMontant(r.z.totalTtc)} ; total perpétuel ${formaterMontant(r.z.perpetuel)}.`}
        </p>
        <p className="rapport-empreinte">
          {lu.integre ? <ShieldCheck size={13} /> : <ShieldAlert size={13} />} {lu.integre ? "Intègre" : "ANOMALIE : le contenu ne correspond plus à son empreinte"} · empreinte {lu.empreinte}
        </p>
      </footer>
    </article>
  );
}

function Chiffre({ libelle, valeur, sous }: { libelle: string; valeur: string; sous?: string }) {
  return (
    <div className="rapport-chiffre">
      <span>{libelle}</span>
      <strong className="chiffre">{valeur}</strong>
      {sous && <small>{sous}</small>}
    </div>
  );
}

function Section({ titre, description, children }: { titre: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="rapport-section">
      <h2>{titre}</h2>
      {description && <p className="rapport-description">{description}</p>}
      {children}
    </section>
  );
}

function Cascade({ lignes, caHt }: { lignes: LigneCascade[]; caHt: number }) {
  return (
    <table className="rapport-tableau rapport-cascade">
      <tbody>
        {lignes.map((l) => (
          <tr key={l.libelle} className={l.sorte}>
            <td>
              {l.sorte === "retire" ? "− " : l.sorte === "total" ? "= " : ""}
              {l.libelle}
              {l.montant === null && l.note && <span className="rapport-manque"> · {l.note}</span>}
            </td>
            <td className="d chiffre">{l.montant === null ? "non calculable" : formaterMontant(l.montant)}</td>
            <td className="d chiffre rapport-part">{l.sorte === "total" && l.libelle !== "Chiffre d'affaires HT" ? (partHt(l.montant, caHt) ?? "") : ""}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ligneEcart(libelle: string, e: Ecart, f: (n: number) => string): string[] {
  return [
    libelle,
    e.actuel !== null ? f(e.actuel) : "—",
    e.precedent !== null ? f(e.precedent) : "—",
    e.ecart !== null ? signe(e.ecart, f) : "—",
    e.ecartPct !== null ? signe(e.ecartPct, pct) : "—",
  ];
}

function Tableau({ titre, entetes, lignes, droite = [], vide }: { titre?: string; entetes: string[]; lignes: string[][]; droite?: number[]; vide?: string }) {
  return (
    <div className="rapport-bloc">
      {titre && <h3>{titre}</h3>}
      {lignes.length === 0 ? (
        <p className="rapport-vide">{vide ?? "—"}</p>
      ) : (
        <div className="scroll-x">
          <table className="rapport-tableau">
            <thead>
              <tr>
                {entetes.map((t, i) => (
                  <th key={i} className={droite.includes(i) ? "d" : undefined}>
                    {t}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lignes.map((l, i) => (
                <tr key={i}>
                  {l.map((c, j) => (
                    <td key={j} className={droite.includes(j) ? "d chiffre" : undefined}>
                      {c}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

