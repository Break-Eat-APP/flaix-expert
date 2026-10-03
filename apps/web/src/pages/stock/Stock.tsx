import { useState } from "react";
import { Link } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Minus, PackagePlus, Plus, Sparkles } from "lucide-react";
import { formaterMontant, lireMontant, type EtatReserve, type Evenement, type LigneStock, type StockMatch } from "@flaix/domain";
import { api, formaterDateHeure } from "../../api.ts";
import { Carte, Chargement, EntetePage, EtatVide, MessageErreur, Regles } from "../../composants/communs.tsx";
import { StockIngredients } from "./StockIngredients.tsx";

type Onglet = "mep" | "match" | "comptage" | "reserve" | "ingredients";
const ETAT = { a_venir: "à venir", ouvert: "en cours", clos: "clos" } as const;
const dateCourte = new Intl.DateTimeFormat("fr-FR", { weekday: "short", day: "numeric", month: "short", timeZone: "Europe/Paris" });
const heure = new Intl.DateTimeFormat("fr-FR", { timeStyle: "short", timeZone: "Europe/Paris" });
const aujourdhui = () => new Date().toLocaleDateString("fr-CA", { timeZone: "Europe/Paris" });
const signe = (n: number) => (n > 0 ? `+${n}` : n < 0 ? `−${Math.abs(n)}` : "0");
const valeur = (lignes: LigneStock[], q: (l: LigneStock) => number) => {
  const manquants = lignes.filter((l) => l.coutUnitaire === null && q(l) !== 0).length;
  return { total: lignes.reduce((s, l) => s + (l.coutUnitaire ?? 0) * q(l), 0), manquants };
};

/**
 * Stock (organisation en 6 entrées, dossier §15.95 ; module 4, §15.105) : réserve centrale,
 * mise en place par match et par stand, réassort pendant le match, comptage de fin de match.
 * Les totaux sont en euros : des unités de produits différents ne s'additionnent pas.
 */
export function Stock() {
  const [onglet, setOnglet] = useState<Onglet>("mep");
  const [evenementId, setEvenementId] = useState<string | null>(null);
  const [standId, setStandId] = useState("");
  const evenements = useQuery({ queryKey: ["evenements"], queryFn: () => api.get<Evenement[]>("/evenements") });
  const stock = useQuery({
    queryKey: ["stock", evenementId],
    queryFn: () => api.get<StockMatch | null>(`/stock${evenementId ? `?evenementId=${evenementId}` : ""}`),
    placeholderData: (avant) => avant,
    enabled: onglet !== "reserve" && onglet !== "ingredients",
  });
  const bouton = (id: Onglet, libelle: string) => (
    <button className={`onglet${onglet === id ? " actif" : ""}`} onClick={() => setOnglet(id)}>
      {libelle}
    </button>
  );

  return (
    <>
      <EntetePage titre="Stock" description="Qu'est-ce que j'envoie aux stands, qu'est-ce qu'il reste ?" />
      <div className="onglets">
        {bouton("mep", "Mise en place")}
        {bouton("match", "Pendant le match")}
        {bouton("comptage", "Comptage")}
        {bouton("reserve", "Réserve & livraisons")}
        {bouton("ingredients", "Ingrédients")}
      </div>
      {onglet === "reserve" ? (
        <Reserve />
      ) : onglet === "ingredients" ? (
        evenements.isPending ? <Chargement /> : evenements.error ? <MessageErreur erreur={evenements.error} /> : <StockIngredients evenements={evenements.data!} evenementId={evenementId} choisir={setEvenementId} />
      ) : stock.isPending || evenements.isPending ? (
        <Chargement />
      ) : stock.error || evenements.error ? (
        <MessageErreur erreur={stock.error ?? evenements.error} />
      ) : !stock.data ? (
        <Carte>
          <EtatVide titre="Aucun match dans la saison">
            Crée d'abord les matchs dans <Link to="/parametres/saison">Paramètres → Saison</Link>.
          </EtatVide>
        </Carte>
      ) : (
        <VueMatch onglet={onglet as Exclude<Onglet, "reserve" | "ingredients">} s={stock.data} evenements={evenements.data!} choisir={setEvenementId} standId={standId} choisirStand={setStandId} cle={evenementId} />
      )}
      <Regles>
        <ul>
          <li><strong>Réserve centrale</strong> : le dépôt du lieu. Son stock de départ se déclare par un <strong>inventaire réserve</strong> ; ensuite son solde est <strong>calculé</strong> (dernier inventaire + livraisons − mises en place − réassorts), jamais présenté comme certain. Un nouvel inventaire devient le point de départ ; son écart est la perte au dépôt depuis le précédent.</li>
          <li><strong>Livraison</strong> : entre en réserve et recalcule le <strong>coût matière</strong> du produit en coût moyen pondéré (CUMP) = (solde réserve × coût actuel + quantité livrée × prix) ÷ (solde + quantité livrée). Ce coût sert partout : valorisation du stock, écarts, marges de Résultats.</li>
          <li><strong>Mise en place</strong> : ce que la réserve envoie à chaque stand <strong>avant</strong> le match, préparable plusieurs jours avant ; figée à l'ouverture du match. <strong>Reste du match précédent</strong> = ce qui a été compté au même stand au match précédent. <strong>Suggestion</strong> = moyenne des ventes des matchs précédents à ce stand − reste, sans marge de sécurité ; « pas d'historique » avant le premier match.</li>
          <li><strong>Pendant le match</strong> : <strong>réassort</strong> à quantité libre (« − » = retour en réserve d'un réassort saisi par erreur). <strong>Restant</strong> = reste précédent + mise en place + réassort − vendu (ventes lues en direct dans les caisses). Alerte « faible » à 15 % du départ, « rupture » à zéro.</li>
          <li><strong>Comptage</strong> : ce qu'on trouve au stand en fin de match. <strong>Écart</strong> = compté − restant attendu, valorisé au coût matière (jamais au prix de vente) : négatif = manquant (casse, coulage, vente non enregistrée), positif = surplus (souvent une erreur de comptage). Motif obligatoire au-delà de 3 % du départ. Le comptage se corrige jusqu'à la clôture du match, puis il est figé ; une correction est inscrite au journal technique.</li>
          <li><strong>Clôture du match</strong> : un match qui a une mise en place ou un réassort ne se clôt qu'une fois chaque produit concerné compté (Clôtures → étape Restes).</li>
          <li><strong>Ingrédients</strong> (onglet du même nom) : un ingrédient coché « suivre » dans Produits & prix se suit comme un produit, en kg, litres ou pièces. Le <strong>consommé</strong> vient des recettes des produits vendus (une pinte de 50 cl déduit 0,5 L du fût), figé à la clôture du match. Un ingrédient non coché sert seulement au coût des recettes.</li>
        </ul>
      </Regles>
    </>
  );
}

function VueMatch({
  onglet,
  s,
  evenements,
  choisir,
  standId,
  choisirStand,
  cle,
}: {
  onglet: Exclude<Onglet, "reserve" | "ingredients">;
  s: StockMatch;
  evenements: Evenement[];
  choisir: (id: string) => void;
  standId: string;
  choisirStand: (id: string) => void;
  cle: string | null;
}) {
  const e = s.evenement;
  const stands = s.stands.filter((x) => !standId || x.standId === standId);
  const toutes = stands.flatMap((x) => x.lignes);
  const evts = [...evenements].sort((a, b) => Date.parse(b.debut) - Date.parse(a.debut));
  const k =
    onglet === "mep"
      ? { libelle: "Valeur mise en place", ...valeur(toutes, (l) => l.miseEnPlace) }
      : onglet === "match"
        ? { libelle: "Valeur restante dans les stands", ...valeur(toutes, (l) => Math.max(l.restant, 0)) }
        : { libelle: "Écarts valorisés", ...valeur(toutes.filter((l) => l.ecart !== null), (l) => l.ecart ?? 0) };
  const alertes = toutes.filter((l) => l.alerte).length;
  const aCompter = toutes.filter((l) => (l.depart + l.reassort > 0 || l.vendu > 0) && l.compte === null).length;

  return (
    <>
      <Carte
        titre={`${e.libelle} — ${dateCourte.format(new Date(e.debut))}`}
        description={`Match ${ETAT[e.etat]}`}
        actions={
          <div className="en-ligne" style={{ gap: 8 }}>
            <select value={e.id} onChange={(ev) => choisir(ev.target.value)} aria-label="Match">
              {evts.map((x) => (
                <option key={x.id} value={x.id}>
                  {dateCourte.format(new Date(x.debut))} — {x.libelle} ({ETAT[x.etat]})
                </option>
              ))}
            </select>
            <select value={standId} onChange={(ev) => choisirStand(ev.target.value)} aria-label="Stand">
              <option value="">Tous les stands</option>
              {s.stands.map((x) => (
                <option key={x.standId} value={x.standId}>
                  {x.nom}
                </option>
              ))}
            </select>
          </div>
        }
      >
        <div className="kpis" style={{ marginBottom: 0 }}>
          <div className="kpi">
            <div className="kpi-libelle">{k.libelle}</div>
            <div className="kpi-valeur" style={onglet === "comptage" && k.total < 0 ? { color: "var(--red)" } : undefined}>
              {formaterMontant(k.total)}
            </div>
            {k.manquants > 0 && <span className="cout-manquant">coût manquant sur {k.manquants} ligne{k.manquants > 1 ? "s" : ""}</span>}
          </div>
          <div className="kpi">
            <div className="kpi-libelle">{onglet === "comptage" ? (s.restes.requis ? "Produits restant à compter" : "Stock non suivi sur ce match") : "Produits en alerte"}</div>
            <div className="kpi-valeur" style={(onglet === "comptage" ? s.restes.requis && aCompter : alertes) ? { color: "var(--amber)" } : undefined}>
              {onglet === "comptage" ? (s.restes.requis ? aCompter : "—") : alertes}
            </div>
          </div>
          <div className="kpi">
            <div className="kpi-libelle">Stands</div>
            <div className="kpi-valeur">{stands.length}</div>
          </div>
        </div>
        {onglet === "mep" && e.etat !== "a_venir" && <div className="message message-info">La mise en place de ce match est figée depuis son ouverture. Pendant le match, on ajoute du réassort.</div>}
        {onglet === "match" && e.etat !== "ouvert" && (
          <div className="message message-info">{e.etat === "a_venir" ? "Ce match n'a pas commencé : le réassort s'ouvre avec le match (Caisses → Ouvrir le match)." : "Ce match est clos : les chiffres ci-dessous sont définitifs."}</div>
        )}
        {onglet === "comptage" && e.etat !== "ouvert" && (
          <div className="message message-info">{e.etat === "a_venir" ? "On ne compte pas un match qui n'a pas eu lieu." : "Ce match est clos : son comptage est figé."}</div>
        )}
      </Carte>

      {stands.length === 0 ? (
        <Carte>
          <EtatVide titre="Aucun stand actif">
            Crée les stands dans <Link to="/parametres/stands">Paramètres → Stands & caisses</Link>.
          </EtatVide>
        </Carte>
      ) : onglet === "mep" ? (
        <MiseEnPlace s={s} stands={stands} cle={cle} />
      ) : onglet === "match" ? (
        <PendantLeMatch s={s} stands={stands} cle={cle} />
      ) : (
        <Comptage s={s} stands={stands} cle={cle} />
      )}
    </>
  );
}

function useMettreAJour(cle: string | null) {
  const client = useQueryClient();
  return (s: StockMatch) => {
    client.setQueryData(["stock", cle], s);
    void client.invalidateQueries({ queryKey: ["cloture"] });
    void client.invalidateQueries({ queryKey: ["reserve"] });
  };
}

/** Quantité saisie : enregistrée à la sortie du champ (ou Entrée), seulement si elle a changé. */
function ChampQuantite({ valeur, enregistrer, libelle, desactive = false }: { valeur: number | null; enregistrer: (q: number) => void; libelle: string; desactive?: boolean }) {
  const [texte, setTexte] = useState(valeur === null ? "" : String(valeur));
  const [avant, setAvant] = useState(valeur);
  if (valeur !== avant) {
    setAvant(valeur);
    setTexte(valeur === null ? "" : String(valeur));
  }
  const valider = () => {
    const q = Number.parseInt(texte, 10);
    if (texte.trim() !== "" && Number.isFinite(q) && q >= 0 && q !== valeur) enregistrer(q);
    else setTexte(valeur === null ? "" : String(valeur));
  };
  return (
    <input
      type="text"
      inputMode="numeric"
      className="champ-quantite"
      value={texte}
      disabled={desactive}
      aria-label={libelle}
      onChange={(ev) => setTexte(ev.target.value.replace(/\D/g, "").slice(0, 6))}
      onBlur={valider}
      onKeyDown={(ev) => {
        if (ev.key === "Enter") (ev.target as HTMLInputElement).blur();
      }}
    />
  );
}

function MiseEnPlace({ s, stands, cle }: { s: StockMatch; stands: StockMatch["stands"]; cle: string | null }) {
  const maj = useMettreAJour(cle);
  const ouverte = s.evenement.etat === "a_venir";
  const saisir = useMutation({
    mutationFn: (d: { standId: string; produitId: string; quantite: number }) => api.put<StockMatch>("/stock/mise-en-place", { evenementId: s.evenement.id, ...d }),
    onSuccess: maj,
  });
  const suggestions = useMutation({ mutationFn: () => api.post<StockMatch>("/stock/mise-en-place/suggestions", { evenementId: s.evenement.id }), onSuccess: maj });
  const avecSuggestion = stands.some((x) => x.lignes.some((l) => l.suggestion !== null && l.suggestion !== l.miseEnPlace));
  return (
    <>
      {ouverte && avecSuggestion && (
        <div className="ligne-actions" style={{ marginTop: 0 }}>
          <button className="btn btn-fantome" disabled={suggestions.isPending} onClick={() => suggestions.mutate()}>
            <Sparkles size={15} /> Appliquer toutes les suggestions
          </button>
        </div>
      )}
      <MessageErreur erreur={saisir.error ?? suggestions.error} />
      {stands.map((st) => (
        <Carte key={st.standId} titre={st.nom}>
          {st.lignes.length === 0 ? (
            <EtatVide titre="Aucun produit vendu à ce stand" />
          ) : (
            <div className="scroll-x">
              <table className="tableau stock">
                <thead>
                  <tr>
                    <th>Produit</th>
                    <th className="d">Reste du match précédent</th>
                    <th className="d">Suggestion</th>
                    <th className="d">Mise en place</th>
                    <th className="d">Départ</th>
                    <th className="d">Réserve centrale</th>
                  </tr>
                </thead>
                <tbody>
                  {st.lignes.map((l) => (
                    <tr key={l.produitId}>
                      <td>
                        <strong>{l.nom}</strong>
                        {l.miseEnPlaceDerniere && (
                          <div className="discret" style={{ fontSize: 11 }}>
                            par {l.miseEnPlaceDerniere.par} le {formaterDateHeure(l.miseEnPlaceDerniere.le)}
                          </div>
                        )}
                      </td>
                      <td className="d chiffre">{l.premierMatch ? <span className="discret">premier match</span> : l.reste}</td>
                      <td className="d">
                        {l.suggestion === null ? (
                          <span className="discret" style={{ fontSize: 12 }}>pas d'historique</span>
                        ) : ouverte && l.suggestion !== l.miseEnPlace ? (
                          <button className="btn-lien" onClick={() => saisir.mutate({ standId: st.standId, produitId: l.produitId, quantite: l.suggestion! })}>
                            suggéré {l.suggestion}
                          </button>
                        ) : (
                          <span className="chiffre">{l.suggestion}</span>
                        )}
                      </td>
                      <td className="d">
                        {ouverte ? (
                          <ChampQuantite valeur={l.miseEnPlace} libelle={`Mise en place ${l.nom}`} enregistrer={(q) => saisir.mutate({ standId: st.standId, produitId: l.produitId, quantite: q })} />
                        ) : (
                          <span className="chiffre">{l.miseEnPlace}</span>
                        )}
                      </td>
                      <td className="d chiffre">
                        <strong>{l.depart}</strong>
                      </td>
                      <td className="d chiffre" style={(s.reserve[l.produitId] ?? 0) < 0 ? { color: "var(--red)" } : undefined}>
                        {s.reserve[l.produitId] ?? 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Carte>
      ))}
      {Object.values(s.reserve).some((v) => v < 0) && (
        <div className="message message-alerte">
          Réserve centrale en négatif sur certains produits : son stock de départ n'est pas déclaré, ou une livraison manque. Onglet <strong>Réserve & livraisons</strong>.
        </div>
      )}
    </>
  );
}

function PendantLeMatch({ s, stands, cle }: { s: StockMatch; stands: StockMatch["stands"]; cle: string | null }) {
  const maj = useMettreAJour(cle);
  const ouvert = s.evenement.etat === "ouvert";
  const [saisies, setSaisies] = useState<Record<string, string>>({});
  const reassort = useMutation({
    mutationFn: (d: { standId: string; produitId: string; quantite: number }) => api.post<StockMatch>("/stock/reassort", { evenementId: s.evenement.id, ...d }),
    onSuccess: (r, d) => {
      maj(r);
      setSaisies((x) => ({ ...x, [`${d.standId}|${d.produitId}`]: "" }));
    },
  });
  return (
    <>
      <MessageErreur erreur={reassort.error} />
      {stands.map((st) => (
        <Carte key={st.standId} titre={st.nom}>
          {st.lignes.length === 0 ? (
            <EtatVide titre="Aucun produit vendu à ce stand" />
          ) : (
            <div className="scroll-x">
              <table className="tableau stock">
                <thead>
                  <tr>
                    <th>Produit</th>
                    <th className="d">Départ</th>
                    <th className="d">Réassort pendant le match</th>
                    <th className="d">Vendu</th>
                    <th className="d">Restant</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {st.lignes.map((l) => {
                    const k = `${st.standId}|${l.produitId}`;
                    const q = Number.parseInt(saisies[k] ?? "", 10);
                    const pret = Number.isFinite(q) && q > 0;
                    return (
                      <tr key={l.produitId}>
                        <td>
                          <strong>{l.nom}</strong>
                        </td>
                        <td className="d chiffre">{l.depart}</td>
                        <td className="d">
                          {ouvert ? (
                            <div className="en-ligne" style={{ gap: 4, justifyContent: "flex-end", flexWrap: "nowrap" }}>
                              <span className="discret" style={{ fontSize: 12 }}>déjà {signe(l.reassort)}</span>
                              <input
                                type="text"
                                inputMode="numeric"
                                className="champ-quantite"
                                value={saisies[k] ?? ""}
                                placeholder="qté"
                                aria-label={`Réassort ${l.nom}`}
                                onChange={(ev) => setSaisies({ ...saisies, [k]: ev.target.value.replace(/\D/g, "").slice(0, 5) })}
                              />
                              <button className="btn btn-fantome" disabled={!pret || reassort.isPending} title="Ajouter (sorti de la réserve)" onClick={() => reassort.mutate({ standId: st.standId, produitId: l.produitId, quantite: q })}>
                                <Plus size={14} />
                              </button>
                              <button className="btn btn-fantome" disabled={!pret || reassort.isPending || q > l.reassort} title="Retirer (retour en réserve)" onClick={() => reassort.mutate({ standId: st.standId, produitId: l.produitId, quantite: -q })}>
                                <Minus size={14} />
                              </button>
                            </div>
                          ) : (
                            <span className="chiffre">{l.reassort}</span>
                          )}
                        </td>
                        <td className="d chiffre">{l.vendu}</td>
                        <td className="d chiffre">
                          <strong>{l.restant}</strong>
                        </td>
                        <td>
                          {l.alerte === "rupture" ? <span className="puce puce-rouge">Rupture</span> : l.alerte === "faible" ? <span className="puce puce-ambre">Faible (≤ {l.seuil})</span> : null}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Carte>
      ))}
    </>
  );
}

function Comptage({ s, stands, cle }: { s: StockMatch; stands: StockMatch["stands"]; cle: string | null }) {
  const maj = useMettreAJour(cle);
  const ouvert = s.evenement.etat === "ouvert";
  const [attente, setAttente] = useState<{ standId: string; produitId: string; quantite: number; motif: string } | null>(null);
  const compter = useMutation({
    mutationFn: (d: { standId: string; produitId: string; quantite: number; motif?: string | null }) => api.put<StockMatch>("/stock/comptage", { evenementId: s.evenement.id, ...d }),
    onSuccess: (r) => {
      maj(r);
      setAttente(null);
    },
  });
  // Un écart au-delà de 3 % du départ demande un motif avant d'être enregistré.
  const saisir = (standId: string, l: LigneStock, quantite: number) => {
    const ecart = quantite - l.restant;
    if (Math.abs(ecart) > l.depart * 0.03 && !(l.comptage?.motif && l.compte === quantite)) setAttente({ standId, produitId: l.produitId, quantite, motif: "" });
    else compter.mutate({ standId, produitId: l.produitId, quantite });
  };
  return (
    <>
      <MessageErreur erreur={compter.error} />
      {stands.map((st) => (
        <Carte key={st.standId} titre={st.nom}>
          {st.lignes.length === 0 ? (
            <EtatVide titre="Aucun produit vendu à ce stand" />
          ) : (
            <div className="scroll-x">
              <table className="tableau stock">
                <thead>
                  <tr>
                    <th>Produit</th>
                    <th className="d">Attendu</th>
                    <th className="d">Compté</th>
                    <th className="d">Écart</th>
                    <th className="d">Écart €</th>
                  </tr>
                </thead>
                <tbody>
                  {st.lignes.map((l) => {
                    const enAttente = attente?.standId === st.standId && attente.produitId === l.produitId;
                    return (
                      <tr key={l.produitId}>
                        <td>
                          <strong>{l.nom}</strong>
                          {l.comptage && (
                            <div className="discret" style={{ fontSize: 11 }}>
                              compté par {l.comptage.par} à {heure.format(new Date(l.comptage.le))}
                              {l.comptage.motif ? ` — « ${l.comptage.motif} »` : ""}
                            </div>
                          )}
                          {enAttente && (
                            <form
                              className="en-ligne"
                              style={{ gap: 6, marginTop: 6 }}
                              onSubmit={(ev) => {
                                ev.preventDefault();
                                compter.mutate({ standId: st.standId, produitId: l.produitId, quantite: attente.quantite, motif: attente.motif.trim() });
                              }}
                            >
                              <input type="text" value={attente.motif} onChange={(ev) => setAttente({ ...attente, motif: ev.target.value })} placeholder={`Motif de l'écart de ${signe(attente.quantite - l.restant)}`} maxLength={300} autoFocus style={{ minWidth: 220 }} />
                              <button className="btn" disabled={attente.motif.trim().length < 5 || compter.isPending}>
                                Enregistrer
                              </button>
                              <button type="button" className="btn btn-fantome" onClick={() => setAttente(null)}>
                                Annuler
                              </button>
                            </form>
                          )}
                        </td>
                        <td className="d chiffre">{l.restant}</td>
                        <td className="d">
                          {ouvert ? (
                            <ChampQuantite valeur={enAttente ? attente.quantite : l.compte} libelle={`Compté ${l.nom}`} enregistrer={(q) => saisir(st.standId, l, q)} />
                          ) : (
                            <span className="chiffre">{l.compte ?? "—"}</span>
                          )}
                        </td>
                        <td className="d chiffre" style={{ color: l.ecart === null ? undefined : l.motifRequis ? "var(--red)" : l.ecart !== 0 ? "var(--amber)" : undefined }}>
                          {l.ecart === null ? "—" : signe(l.ecart)}
                        </td>
                        <td className="d chiffre">{l.ecart === null ? "—" : l.ecartValeur === null ? <span className="cout-manquant">coût manquant</span> : formaterMontant(l.ecartValeur)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Carte>
      ))}
    </>
  );
}

function Reserve() {
  const client = useQueryClient();
  const r = useQuery({ queryKey: ["reserve"], queryFn: () => api.get<EtatReserve>("/stock/reserve") });
  const [livraison, setLivraison] = useState({ produitId: "", quantite: "", prix: "", fournisseur: "", date: aujourdhui() });
  const [inventaire, setInventaire] = useState<{ date: string; comptes: Record<string, string> } | null>(null);
  const apres = (e: EtatReserve) => {
    client.setQueryData(["reserve"], e);
    void client.invalidateQueries({ queryKey: ["stock"] });
    void client.invalidateQueries({ queryKey: ["produits"] });
  };
  const livrer = useMutation({
    mutationFn: () =>
      api.post<EtatReserve>("/stock/livraisons", {
        produitId: livraison.produitId,
        quantite: Number.parseInt(livraison.quantite, 10),
        prixUnitaire: lireMontant(livraison.prix),
        fournisseur: livraison.fournisseur.trim() || null,
        dateLivraison: livraison.date,
      }),
    onSuccess: (e) => {
      apres(e);
      setLivraison({ produitId: "", quantite: "", prix: "", fournisseur: "", date: livraison.date });
    },
  });
  const inventorier = useMutation({
    mutationFn: () =>
      api.post<EtatReserve>("/stock/inventaires", {
        dateInventaire: inventaire!.date,
        lignes: Object.entries(inventaire!.comptes)
          .filter(([, v]) => v.trim() !== "")
          .map(([produitId, v]) => ({ produitId, compte: Number.parseInt(v, 10) })),
      }),
    onSuccess: (e) => {
      apres(e);
      setInventaire(null);
    },
  });

  if (r.isPending) return <Chargement />;
  if (r.error) return <MessageErreur erreur={r.error} />;
  const e = r.data!;
  if (e.produits.length === 0) {
    return (
      <Carte>
        <EtatVide titre="Aucun produit">
          Crée d'abord le catalogue dans <Link to="/parametres/produits">Paramètres → Produits & prix</Link>.
        </EtatVide>
      </Carte>
    );
  }
  const quantiteLivree = Number.parseInt(livraison.quantite, 10);
  const prixLivre = lireMontant(livraison.prix);
  const livraisonPrete = livraison.produitId && Number.isFinite(quantiteLivree) && quantiteLivree > 0 && prixLivre !== null && livraison.date;
  const valeurReserve = e.produits.reduce((s, p) => s + Math.max(p.solde, 0) * (p.coutUnitaire ?? 0), 0);
  const sansDepart = e.produits.filter((p) => p.inventaire === null).length;

  return (
    <>
      <Carte
        titre="Réserve centrale"
        description={`Solde calculé : dernier inventaire + livraisons − sorties vers les stands. Valeur ${formaterMontant(valeurReserve)} au coût matière.`}
        actions={
          !inventaire && (
            <button className="btn btn-fantome" onClick={() => setInventaire({ date: aujourdhui(), comptes: {} })}>
              Faire un inventaire de la réserve
            </button>
          )
        }
      >
        {sansDepart > 0 && !inventaire && (
          <div className="message message-info" style={{ marginTop: 0 }}>
            {sansDepart} produit{sansDepart > 1 ? "s" : ""} sans stock de départ déclaré : c'est ici que tu le déclares, par un premier inventaire de la réserve.
          </div>
        )}
        {inventaire && (
          <div className="message message-info" style={{ marginTop: 0 }}>
            Saisis ce que tu comptes au dépôt (laisse vide les produits non comptés), puis valide. Le compté devient le nouveau point de départ.
            <label className="champ" style={{ marginTop: 8, maxWidth: 200 }}>
              <span>Date de l'inventaire</span>
              <input type="date" value={inventaire.date} onChange={(ev) => setInventaire({ ...inventaire, date: ev.target.value })} />
            </label>
          </div>
        )}
        <div className="scroll-x">
          <table className="tableau stock">
            <thead>
              <tr>
                <th>Produit</th>
                <th className="d">Dernier inventaire</th>
                <th className="d">Livré depuis</th>
                <th className="d">Sorti depuis</th>
                <th className="d">Solde calculé</th>
                {inventaire && <th className="d">Compté au dépôt</th>}
                <th className="d">Coût matière</th>
              </tr>
            </thead>
            <tbody>
              {e.produits.map((p) => (
                <tr key={p.produitId}>
                  <td>
                    <strong>{p.nom}</strong>
                  </td>
                  <td className="d chiffre">{p.inventaire ? `${p.inventaire.compte} au ${new Date(p.inventaire.date).toLocaleDateString("fr-FR")}` : <span className="discret">non déclaré</span>}</td>
                  <td className="d chiffre">{p.livreDepuis}</td>
                  <td className="d chiffre">{p.sortiDepuis}</td>
                  <td className="d chiffre" style={p.solde < 0 ? { color: "var(--red)" } : undefined}>
                    <strong>{p.solde}</strong>
                  </td>
                  {inventaire && (
                    <td className="d">
                      <input
                        type="text"
                        inputMode="numeric"
                        className="champ-quantite"
                        value={inventaire.comptes[p.produitId] ?? ""}
                        aria-label={`Compté au dépôt ${p.nom}`}
                        onChange={(ev) => setInventaire({ ...inventaire, comptes: { ...inventaire.comptes, [p.produitId]: ev.target.value.replace(/\D/g, "").slice(0, 7) } })}
                      />
                    </td>
                  )}
                  <td className="d chiffre">{p.coutUnitaire === null ? <span className="cout-manquant">coût manquant</span> : formaterMontant(p.coutUnitaire)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {inventaire && (
          <div className="ligne-actions">
            <button className="btn" disabled={inventorier.isPending || !Object.values(inventaire.comptes).some((v) => v.trim() !== "")} onClick={() => inventorier.mutate()}>
              Valider l'inventaire
            </button>
            <button className="btn btn-fantome" onClick={() => setInventaire(null)}>
              Annuler
            </button>
          </div>
        )}
        <MessageErreur erreur={inventorier.error} />
      </Carte>

      <Carte titre="Livraison fournisseur" description="Elle entre en réserve et recalcule le coût matière du produit (coût moyen pondéré).">
        <form
          className="nouvelle-affectation"
          style={{ marginTop: 0, paddingTop: 0, borderTop: 0 }}
          onSubmit={(ev) => {
            ev.preventDefault();
            if (livraisonPrete) livrer.mutate();
          }}
        >
          <label className="champ">
            <span>Produit</span>
            <select value={livraison.produitId} onChange={(ev) => setLivraison({ ...livraison, produitId: ev.target.value })} required>
              <option value="">Choisir…</option>
              {e.produits.map((p) => (
                <option key={p.produitId} value={p.produitId}>
                  {p.nom}
                </option>
              ))}
            </select>
          </label>
          <label className="champ">
            <span>Quantité livrée</span>
            <input type="text" inputMode="numeric" value={livraison.quantite} onChange={(ev) => setLivraison({ ...livraison, quantite: ev.target.value.replace(/\D/g, "").slice(0, 6) })} required />
          </label>
          <label className="champ">
            <span>Prix d'achat unitaire HT (€)</span>
            <input type="text" inputMode="decimal" value={livraison.prix} onChange={(ev) => setLivraison({ ...livraison, prix: ev.target.value })} placeholder="ex. 1,95" aria-invalid={livraison.prix.trim() !== "" && prixLivre === null} required />
          </label>
          <label className="champ">
            <span>Fournisseur</span>
            <input type="text" value={livraison.fournisseur} onChange={(ev) => setLivraison({ ...livraison, fournisseur: ev.target.value })} maxLength={120} />
          </label>
          <label className="champ">
            <span>Date</span>
            <input type="date" value={livraison.date} onChange={(ev) => setLivraison({ ...livraison, date: ev.target.value })} required />
          </label>
          <button className="btn" disabled={!livraisonPrete || livrer.isPending}>
            <PackagePlus size={15} /> Enregistrer la livraison
          </button>
        </form>
        <MessageErreur erreur={livrer.error} />
      </Carte>

      {e.inventaires.length > 0 && (
        <Carte titre="Inventaires de la réserve">
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {e.inventaires.map((i) => {
              const total = i.lignes.reduce((s, l) => s + (l.valeur ?? 0), 0);
              return (
                <details key={i.id} className="inventaire">
                  <summary>
                    <strong>{new Date(i.date).toLocaleDateString("fr-FR")}</strong> — par {i.par} · {i.lignes.length} produit{i.lignes.length > 1 ? "s" : ""}
                    {i.lignes.some((l) => l.ecart !== null) && <> · écart {formaterMontant(total)}</>}
                  </summary>
                  <div className="scroll-x">
                    <table className="tableau">
                      <thead>
                        <tr>
                          <th>Produit</th>
                          <th className="d">Calculé</th>
                          <th className="d">Compté</th>
                          <th className="d">Écart</th>
                          <th className="d">Écart €</th>
                        </tr>
                      </thead>
                      <tbody>
                        {i.lignes.map((l) => (
                          <tr key={l.produit}>
                            <td>{l.produit}</td>
                            <td className="d chiffre">{l.calcule ?? <span className="discret">départ</span>}</td>
                            <td className="d chiffre">{l.compte}</td>
                            <td className="d chiffre">{l.ecart === null ? "—" : signe(l.ecart)}</td>
                            <td className="d chiffre">{l.valeur === null ? "—" : formaterMontant(l.valeur)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </details>
              );
            })}
          </div>
        </Carte>
      )}

      <Carte titre="Journal des mouvements" description="Chaque entrée et sortie de stock, qui l'a saisie et quand. Rien n'y est jamais modifié.">
        {e.mouvements.length === 0 ? (
          <EtatVide titre="Aucun mouvement pour l'instant" />
        ) : (
          <details>
            <summary className="btn-lien">Afficher les {e.mouvements.length} derniers mouvements</summary>
            <div className="scroll-x">
              <table className="tableau">
                <thead>
                  <tr>
                    <th>Quand</th>
                    <th>Mouvement</th>
                    <th>Produit</th>
                    <th className="d">Quantité</th>
                    <th>Détail</th>
                    <th>Par</th>
                  </tr>
                </thead>
                <tbody>
                  {e.mouvements.map((m) => (
                    <tr key={m.id}>
                      <td className="chiffre">{formaterDateHeure(m.le)}</td>
                      <td>{m.type === "livraison" ? "Livraison" : m.type === "mise_en_place" ? "Mise en place" : m.quantite < 0 ? "Retour en réserve" : "Réassort"}</td>
                      <td>{m.produit}</td>
                      <td className="d chiffre">{signe(m.type === "livraison" ? m.quantite : -m.quantite)}</td>
                      <td className="discret" style={{ fontSize: 12 }}>
                        {m.type === "livraison"
                          ? `${m.fournisseur ?? "fournisseur non précisé"} · ${formaterMontant(m.prixUnitaire!)} l'unité · coût ${m.coutAvant === null ? "—" : formaterMontant(m.coutAvant)} → ${formaterMontant(m.coutApres!)}`
                          : `${m.stand} · ${m.match}`}
                      </td>
                      <td>{m.par}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="note">Quantités vues depuis la réserve centrale : + entre au dépôt, − en sort vers un stand.</p>
          </details>
        )}
      </Carte>
    </>
  );
}
