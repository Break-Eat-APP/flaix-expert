import { Fragment, useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  MODES_STOCK_CC,
  TAUX_TVA,
  cascadeEncaissement,
  formaterMontant,
  libelleTauxTva,
  lireMontant,
  montantPourSaisie,
  prixAppConseille,
  tauxStripeEffectif,
  verdictPrixApp,
  type EtatClickCollect,
  type ModeStockCC,
  type ReglagesClickCollect,
} from "@flaix/domain";
import { api } from "../../api.ts";
import { Carte, Chargement, EntetePage, EtatVide, MessageErreur, Regles } from "../../composants/communs.tsx";

type Onglet = "catalogue" | "reglages" | "simulateur";

/** 1000 points de base → « 10 % » ; 243 → « 2,43 % ». */
const pct = (pb: number) => `${(pb / 100).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} %`;
/** Centimes non arrondis → « 7,57 € » (arrondi à l'affichage seulement). */
const euros = (c: number) => formaterMontant(Math.round(c));
/** Saisie d'un pourcentage « 1,5 » → 150 points de base (même règle que les montants : 2 décimales). */
const lirePct = (s: string) => lireMontant(s);

/**
 * Paramètres → Click & Collect (module 13 validé ; dossier §3, §15.20, §15.28, §15.76, §15.111) :
 * le prix app de chaque produit vendu en point de retrait, réglé pour que la vente sur l'application
 * laisse au lieu la même marge hors taxes qu'au comptoir.
 */
export function ClickCollect() {
  const [onglet, setOnglet] = useState<Onglet>("catalogue");
  const etat = useQuery({ queryKey: ["click-collect"], queryFn: () => api.get<EtatClickCollect>("/click-collect"), refetchOnMount: "always" });
  if (etat.isPending) return <Chargement />;
  if (etat.error) return <MessageErreur erreur={etat.error} />;
  const e = etat.data!;
  const bouton = (id: Onglet, libelle: string) => (
    <button className={`onglet${onglet === id ? " actif" : ""}`} onClick={() => setOnglet(id)}>
      {libelle}
    </button>
  );

  return (
    <>
      <EntetePage fil="Paramètres" filLien="/parametres" titre="Click & Collect" description="Le prix de chaque produit sur l'application de commande (plateforme Click & Collect ou application du lieu), et ce qu'il laisse au lieu." />
      <div className="onglets">
        {bouton("catalogue", "Catalogue C&C")}
        {bouton("reglages", "Réglages du lieu")}
        {bouton("simulateur", "Simulateur libre")}
      </div>
      {onglet === "catalogue" ? <Catalogue e={e} versReglages={() => setOnglet("reglages")} /> : onglet === "reglages" ? <ReglagesLieu e={e} /> : <Simulateur reglages={e.reglages} />}

      <Regles>
        <ul>
          <li>
            <strong>Objectif</strong> : une vente sur l'application laisse au lieu <strong>exactement la même marge hors taxes</strong> qu'au comptoir, une fois payées la
            commission de la plateforme et les frais de paiement.
          </li>
          <li>
            <strong>Prix app conseillé</strong> = prix buvette × (u + commission × k) ÷ (u − frais de paiement), avec u = 1 ÷ (1 + TVA du produit). Arrondi au centime supérieur : il
            couvre toujours. La majoration dépend du taux de TVA du produit — il n'existe pas de pourcentage unique pour toute la carte.
          </li>
          <li>
            <strong>Commission</strong> de la plateforme de commande : taux unique du lieu, calculé sur le <strong>prix buvette</strong> (0 si c'est l'application du lieu lui-même). <strong>k</strong> = 1,2 si la TVA (20 %) facturée sur la
            commission est répercutée au client (réglage prudent : il protège le lieu qui ne récupère pas cette TVA), 1,0 sinon (un lieu qui la récupère peut afficher un
            prix app plus bas). À confirmer avec l'expert-comptable du lieu.
          </li>
          <li>
            <strong>Frais de paiement</strong> (Stripe ou autre prestataire) : pourcentage + frais fixe par paiement, supportés par le lieu. Le taux effectif se calcule sur le <strong>panier moyen</strong> de
            l'application : le frais fixe pèse plus lourd sur un petit panier.
          </li>
          <li>
            <strong>Verdict</strong> : sur le prix que tu choisis (tu arrondis souvent), ce qu'il reste par vente par rapport au comptoir. « Manque » : chaque vente sur
            l'application rapporte moins qu'au comptoir.
          </li>
          <li>
            <strong>Catalogue C&C</strong> : les produits vendus dans un stand marqué « point de retrait Click & Collect » (Paramètres → Stands & caisses). Le prix buvette
            se règle dans Produits & prix ; ici, seulement le prix app et le mode de stock. Chaque changement est inscrit au journal technique. Les commandes passent par
            l'application de commande, pas par les caisses.
          </li>
        </ul>
      </Regles>
    </>
  );
}

function Catalogue({ e, versReglages }: { e: EtatClickCollect; versReglages: () => void }) {
  const client = useQueryClient();
  const [ouvert, setOuvert] = useState<string | null>(null);
  const [saisies, setSaisies] = useState<Record<string, string>>({});
  const enregistrer = useMutation({
    mutationFn: (x: { id: string; prixApp: number | null; modeStock: ModeStockCC | null }) =>
      api.put<EtatClickCollect>(`/click-collect/produits/${x.id}`, { prixApp: x.prixApp, modeStock: x.modeStock }),
    onSuccess: (etat, x) => {
      client.setQueryData(["click-collect"], etat);
      setSaisies((s) => {
        const { [x.id]: _, ...reste } = s;
        return reste;
      });
    },
  });
  const r = e.reglages;

  return (
    <>
      {!r && (
        <div className="message message-alerte">
          Règle d'abord la commission et les frais de paiement du lieu pour obtenir les prix conseillés.{" "}
          <button className="btn-lien" onClick={versReglages}>
            Réglages du lieu
          </button>
        </div>
      )}
      <Carte
        titre="Catalogue C&C"
        description={
          e.pointsRetrait.length
            ? `Produits vendus dans ${e.pointsRetrait.length > 1 ? "les points de retrait" : "le point de retrait"} : ${e.pointsRetrait.map((p) => p.nom).join(", ")}.`
            : undefined
        }
      >
        {e.pointsRetrait.length === 0 ? (
          <EtatVide titre="Aucun point de retrait">
            Marque le stand où les supporters retirent leurs commandes comme « point de retrait Click & Collect » dans <Link to="/parametres/stands">Stands & caisses</Link>.
          </EtatVide>
        ) : e.produits.length === 0 ? (
          <EtatVide titre="Aucun produit vendu dans un point de retrait">
            Ajoute les produits à ce stand dans <Link to="/parametres/produits">Produits & prix</Link>.
          </EtatVide>
        ) : (
          <div className="scroll-x">
            <table className="tableau">
              <thead>
                <tr>
                  <th>Produit</th>
                  <th className="d">Prix buvette</th>
                  <th className="d">Conseillé</th>
                  <th>Prix app appliqué</th>
                  <th>Verdict</th>
                  <th>Stock C&C</th>
                </tr>
              </thead>
              <tbody>
                {e.produits.map((p) => {
                  const conseille = r ? prixAppConseille(p.prixBuvette, p.tauxTva, r) : null;
                  const saisie = saisies[p.id] ?? (p.prixApp !== null ? montantPourSaisie(p.prixApp) : "");
                  const lu = saisie.trim() === "" ? null : lireMontant(saisie);
                  const modifie = saisies[p.id] !== undefined && lu !== p.prixApp;
                  const v = r && lu ? verdictPrixApp(lu, p.prixBuvette, p.tauxTva, r) : null;
                  return (
                    <Fragment key={p.id}>
                      <tr>
                        <td style={{ whiteSpace: "normal", minWidth: 140 }}>
                          <button className="btn-lien" onClick={() => setOuvert(ouvert === p.id ? null : p.id)} aria-expanded={ouvert === p.id}>
                            {p.nom}
                          </button>
                          <div className="discret" style={{ fontSize: 11.5 }}>
                            {p.categorie ? `${p.categorie} · ` : ""}TVA {libelleTauxTva(p.tauxTva)}
                          </div>
                        </td>
                        <td className="d chiffre">{formaterMontant(p.prixBuvette)}</td>
                        <td className="d chiffre">
                          {conseille === null ? (
                            "—"
                          ) : (
                            <>
                              {formaterMontant(conseille)}
                              <div className="discret" style={{ fontSize: 11.5 }}>
                                +{(((conseille - p.prixBuvette) / p.prixBuvette) * 100).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %
                              </div>
                            </>
                          )}
                        </td>
                        <td>
                          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                            <input
                              type="text"
                              inputMode="decimal"
                              value={saisie}
                              onChange={(ev) => setSaisies({ ...saisies, [p.id]: ev.target.value })}
                              placeholder="—"
                              aria-label={`Prix app de ${p.nom}`}
                              aria-invalid={saisie.trim() !== "" && lu === null}
                              style={{ width: 84 }}
                            />
                            {conseille !== null && lu !== conseille && (
                              <button className="btn-lien" style={{ fontSize: 12 }} onClick={() => setSaisies({ ...saisies, [p.id]: montantPourSaisie(conseille) })}>
                                conseillé
                              </button>
                            )}
                            {modifie && (saisie.trim() === "" || lu !== null) && (
                              <button className="btn" style={{ padding: "4px 10px", fontSize: 12.5 }} disabled={enregistrer.isPending} onClick={() => enregistrer.mutate({ id: p.id, prixApp: lu, modeStock: p.modeStock })}>
                                Enregistrer
                              </button>
                            )}
                          </div>
                        </td>
                        <td>
                          {v ? (
                            <span className={`puce ${v.couvre ? "puce-vert" : "puce-rouge"}`}>
                              {v.couvre
                                ? Math.round(v.ecartParVente) > 0
                                  ? `Couvre, +${euros(v.ecartParVente)} / vente`
                                  : "Couvre"
                                : `Manque ${euros(-v.ecartParVente)} / vente`}
                            </span>
                          ) : (
                            <span className="discret">—</span>
                          )}
                        </td>
                        <td>
                          <select
                            value={p.modeStock ?? ""}
                            disabled={enregistrer.isPending}
                            onChange={(ev) => enregistrer.mutate({ id: p.id, prixApp: p.prixApp, modeStock: (ev.target.value || null) as ModeStockCC | null })}
                            aria-label={`Mode de stock C&C de ${p.nom}`}
                          >
                            <option value="">À régler</option>
                            {MODES_STOCK_CC.map((m) => (
                              <option key={m.valeur} value={m.valeur} title={m.aide}>
                                {m.libelle}
                              </option>
                            ))}
                          </select>
                        </td>
                      </tr>
                      {ouvert === p.id && r && lu && (
                        <tr>
                          <td colSpan={6} style={{ whiteSpace: "normal" }}>
                            <Cascade prixApp={lu} prixBuvette={p.prixBuvette} tauxTva={p.tauxTva} r={r} />
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <MessageErreur erreur={enregistrer.error} />
      </Carte>
    </>
  );
}

/** Où part l'argent d'une vente sur l'application, au prix choisi. */
function Cascade({ prixApp, prixBuvette, tauxTva, r }: { prixApp: number; prixBuvette: number; tauxTva: number; r: ReglagesClickCollect }) {
  const c = cascadeEncaissement(prixApp, prixBuvette, tauxTva, r);
  const ligne = (libelle: string, montant: number, fort = false) => (
    <div className="bilan-ligne" style={fort ? { fontWeight: 700 } : undefined}>
      <span>{libelle}</span>
      <span className="chiffre">{euros(montant)}</span>
    </div>
  );
  return (
    <div style={{ maxWidth: 460, padding: "4px 0" }}>
      {ligne("Le supporter paie", c.paye, true)}
      {ligne(`− TVA du produit (${libelleTauxTva(tauxTva)})`, c.tvaProduit)}
      {ligne(`− Frais de paiement (${pct(Math.round(tauxStripeEffectif(r) * 10_000))} effectif)`, c.stripe)}
      {ligne(`− Commission de la plateforme HT (${pct(r.commissionPb)} du prix buvette)`, c.commissionHt)}
      {r.tvaCommissionRepercutee && ligne("− TVA sur la commission (répercutée)", c.tvaCommission)}
      {ligne("= Reste au lieu, hors taxes", c.reste, true)}
      {ligne("Au comptoir, il reste hors taxes", prixBuvette / (1 + tauxTva / 10_000))}
    </div>
  );
}

function ReglagesLieu({ e }: { e: EtatClickCollect }) {
  const client = useQueryClient();
  const r = e.reglages;
  const initial = () => ({
    commission: r ? montantPourSaisie(r.commissionPb) : "",
    repercutee: r ? r.tvaCommissionRepercutee : true,
    stripeTaux: r ? montantPourSaisie(r.stripeTauxPb) : "",
    stripeFixe: r ? montantPourSaisie(r.stripeFixe) : "",
    panier: r ? montantPourSaisie(r.panierMoyen) : "",
  });
  const [s, setS] = useState(initial);
  useEffect(() => setS(initial()), [e.reglages]); // eslint-disable-line react-hooks/exhaustive-deps
  const enregistrer = useMutation({
    mutationFn: (x: ReglagesClickCollect) => api.put<EtatClickCollect>("/click-collect/reglages", x),
    onSuccess: (etat) => client.setQueryData(["click-collect"], etat),
  });
  const lu = {
    commissionPb: lirePct(s.commission),
    stripeTauxPb: lirePct(s.stripeTaux),
    stripeFixe: s.stripeFixe.trim() === "" ? 0 : lireMontant(s.stripeFixe),
    panierMoyen: lireMontant(s.panier),
  };
  const complet = lu.commissionPb !== null && lu.stripeTauxPb !== null && lu.stripeFixe !== null && lu.panierMoyen !== null && lu.panierMoyen > 0;
  const saisi: ReglagesClickCollect | null = complet
    ? { commissionPb: lu.commissionPb!, tvaCommissionRepercutee: s.repercutee, stripeTauxPb: lu.stripeTauxPb!, stripeFixe: lu.stripeFixe!, panierMoyen: lu.panierMoyen! }
    : null;
  const envoyer = (ev: FormEvent) => {
    ev.preventDefault();
    if (saisi) enregistrer.mutate(saisi);
  };
  const modifie = JSON.stringify(saisi) !== JSON.stringify(r);
  const champ = (cle: "commission" | "stripeTaux" | "stripeFixe" | "panier", libelle: string, aide: string, place: string) => (
    <label className="champ">
      <span>{libelle}</span>
      <input type="text" inputMode="decimal" value={s[cle]} placeholder={place} onChange={(ev) => setS({ ...s, [cle]: ev.target.value })} />
      <small className="discret">{aide}</small>
    </label>
  );

  return (
    <Carte titre="Réglages du lieu" description="Ils valent pour tous les produits du lieu. Rien n'est supposé : chaque valeur vient du contrat du lieu.">
      <form onSubmit={envoyer}>
        <div className="grille-champs">
          {champ("commission", "Commission de la plateforme (%)", "Taux du contrat, sur le prix buvette ; 0 pour l'application du lieu.", "ex. 10")}
          {champ("stripeTaux", "Frais de paiement : pourcentage (%)", "Pourcentage du prestataire de paiement (Stripe ou autre).", "ex. 1,5")}
          {champ("stripeFixe", "Frais de paiement : fixe par paiement (€)", "0 si le contrat n'en a pas.", "ex. 0,25")}
          {champ("panier", "Panier moyen sur l'application (€)", "Sert au taux effectif des frais de paiement.", "ex. 27,00")}
        </div>
        <fieldset style={{ border: 0, padding: 0, margin: "14px 0 0" }}>
          <legend className="discret" style={{ fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
            TVA (20 %) facturée sur la commission
          </legend>
          <label style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 6 }}>
            <input type="radio" checked={s.repercutee} onChange={() => setS({ ...s, repercutee: true })} />
            <span>
              <strong>Répercutée dans le prix app</strong> — réglage prudent : le lieu garde sa marge même s'il ne récupère pas cette TVA.
            </span>
          </label>
          <label style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
            <input type="radio" checked={!s.repercutee} onChange={() => setS({ ...s, repercutee: false })} />
            <span>
              <strong>Non répercutée</strong> — pour un lieu qui récupère cette TVA (à confirmer avec son expert-comptable) : prix app plus bas, plus attractif.
            </span>
          </label>
        </fieldset>
        {saisi && (
          <p className="discret" style={{ margin: "12px 0 0" }}>
            Frais de paiement effectifs à ce panier : <strong>{pct(Math.round(tauxStripeEffectif(saisi) * 10_000))}</strong>
            {saisi.stripeFixe > 0 && " — plus le panier baisse, plus le frais fixe pèse."}
          </p>
        )}
        <div className="actions" style={{ justifyContent: "flex-start", marginTop: 14 }}>
          <button className="btn" type="submit" disabled={!saisi || !modifie || enregistrer.isPending}>
            Enregistrer
          </button>
          {!complet && <span className="discret">Les quatre valeurs sont nécessaires (frais fixe : 0 s'il n'y en a pas).</span>}
        </div>
        <MessageErreur erreur={enregistrer.error} />
      </form>
      {e.pointsRetrait.length > 0 && (
        <p className="discret" style={{ marginBottom: 0 }}>
          Points de retrait : {e.pointsRetrait.map((p) => p.nom).join(", ")} (<Link to="/parametres/stands">Stands & caisses</Link>).
        </p>
      )}
    </Carte>
  );
}

/** Calculateur autonome (module 13, §15.28) : ne lit ni ne modifie aucun produit. */
function Simulateur({ reglages }: { reglages: ReglagesClickCollect | null }) {
  const [s, setS] = useState({
    prix: "",
    tva: 1000,
    commission: reglages ? montantPourSaisie(reglages.commissionPb) : "",
    repercutee: reglages ? reglages.tvaCommissionRepercutee : true,
    stripe: reglages ? montantPourSaisie(Math.round(tauxStripeEffectif(reglages) * 10_000)) : "",
    applique: "",
  });
  const prix = lireMontant(s.prix);
  const commission = lirePct(s.commission);
  const stripe = lirePct(s.stripe);
  const r: ReglagesClickCollect | null =
    commission !== null && stripe !== null ? { commissionPb: commission, tvaCommissionRepercutee: s.repercutee, stripeTauxPb: stripe, stripeFixe: 0, panierMoyen: 10_000 } : null;
  const conseille = r && prix ? prixAppConseille(prix, s.tva, r) : null;
  const applique = s.applique.trim() === "" ? conseille : lireMontant(s.applique);
  const v = r && prix && applique ? verdictPrixApp(applique, prix, s.tva, r) : null;
  const champ = (cle: "prix" | "commission" | "stripe" | "applique", libelle: string, place: string) => (
    <label className="champ">
      <span>{libelle}</span>
      <input type="text" inputMode="decimal" value={s[cle]} placeholder={place} onChange={(ev) => setS({ ...s, [cle]: ev.target.value })} />
    </label>
  );

  return (
    <Carte titre="Simulateur libre" description="Pour essayer un cas sans toucher au catalogue — aussi en démonstration à un lieu qui n'a pas encore FlaiX Expert. Rien n'est enregistré.">
      <div className="grille-champs">
        {champ("prix", "Prix buvette (€)", "ex. 6,50")}
        <label className="champ">
          <span>TVA du produit</span>
          <select value={s.tva} onChange={(ev) => setS({ ...s, tva: Number(ev.target.value) })}>
            {TAUX_TVA.map((t) => (
              <option key={t.pb} value={t.pb}>
                {t.libelle}
              </option>
            ))}
          </select>
        </label>
        {champ("commission", "Commission (%)", "ex. 10")}
        {champ("stripe", "Frais de paiement effectifs (%)", "ex. 2,5")}
        <label className="champ">
          <span>TVA sur la commission</span>
          <select value={s.repercutee ? "oui" : "non"} onChange={(ev) => setS({ ...s, repercutee: ev.target.value === "oui" })}>
            <option value="oui">Répercutée (k = 1,2)</option>
            <option value="non">Non répercutée (k = 1,0)</option>
          </select>
        </label>
        {champ("applique", "Prix app que tu veux afficher (€)", conseille ? montantPourSaisie(conseille) : "facultatif")}
      </div>
      {conseille !== null && prix ? (
        <div style={{ marginTop: 16, display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
          <div>
            <div className="kpi-libelle">Prix app conseillé</div>
            <div className="kpi-valeur">{formaterMontant(conseille)}</div>
            <div className="discret">+{(((conseille - prix) / prix) * 100).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} % sur le prix buvette</div>
            {v && (
              <p style={{ marginBottom: 0 }}>
                <span className={`puce ${v.couvre ? "puce-vert" : "puce-rouge"}`}>{v.couvre ? "Couvre" : `Manque ${euros(-v.ecartParVente)} par vente`}</span>
              </p>
            )}
          </div>
          {r && applique && <Cascade prixApp={applique} prixBuvette={prix} tauxTva={s.tva} r={r} />}
        </div>
      ) : (
        <p className="discret" style={{ marginBottom: 0 }}>
          Saisis un prix buvette, la commission et les frais de paiement.
        </p>
      )}
    </Carte>
  );
}
