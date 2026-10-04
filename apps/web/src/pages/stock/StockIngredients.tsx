import { useState } from "react";
import { Link } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PackagePlus, Sparkles } from "lucide-react";
import {
  formaterMontant,
  formaterQuantiteStock,
  lireMontant,
  milliVersSaisieStock,
  quantiteStockVersMilli,
  type EtatReserveIngredients,
  type Evenement,
  type LigneStockIngredient,
  type StockIngredientsMatch,
} from "@flaix/domain";
import { api, formaterDateHeure } from "../../api.ts";
import { Carte, Chargement, EtatVide, MessageErreur } from "../../composants/communs.tsx";

const ETAT = { a_venir: "à venir", ouvert: "en cours", clos: "clos" } as const;
const dateCourte = new Intl.DateTimeFormat("fr-FR", { weekday: "short", day: "numeric", month: "short", timeZone: "Europe/Paris" });
const aujourdhui = () => new Date().toLocaleDateString("fr-CA", { timeZone: "Europe/Paris" });
const q = (l: { unite: LigneStockIngredient["unite"] }, milli: number) => formaterQuantiteStock(milli, l.unite);
const signeQ = (l: LigneStockIngredient, milli: number) => (milli > 0 ? `+${q(l, milli)}` : q(l, milli));

/**
 * Stock des ingrédients suivis (décision de Rémi, dossier §15.124) : la bière pression au litre, les
 * saucisses à la pièce… Le consommé vient des recettes des produits vendus, jamais d'une saisie.
 */
export function StockIngredients({ evenements, evenementId, choisir }: { evenements: Evenement[]; evenementId: string | null; choisir: (id: string) => void }) {
  const stock = useQuery({
    queryKey: ["stock-ingredients", evenementId],
    queryFn: () => api.get<StockIngredientsMatch | null>(`/stock/ingredients${evenementId ? `?evenementId=${evenementId}` : ""}`),
    placeholderData: (avant) => avant,
  });
  if (stock.isPending) return <Chargement />;
  if (stock.error) return <MessageErreur erreur={stock.error} />;
  const s = stock.data;
  const suivis = s ? new Set(s.stands.flatMap((st) => st.lignes.map((l) => l.ingredientId))).size : 0;
  return (
    <>
      {!s ? (
        <Carte>
          <EtatVide titre="Aucun événement dans la saison">
            Crée d'abord les événements dans <Link to="/parametres/saison">Paramètres → Saison</Link>.
          </EtatVide>
        </Carte>
      ) : (
        <>
          <Carte
            titre={`${s.evenement.libelle} — ${dateCourte.format(new Date(s.evenement.debut))}`}
            description={`Événement ${ETAT[s.evenement.etat]} · ingrédients suivis en stock, déduits par les recettes des produits vendus`}
            actions={
              <select value={s.evenement.id} onChange={(ev) => choisir(ev.target.value)} aria-label="Événement">
                {[...evenements]
                  .sort((a, b) => Date.parse(b.debut) - Date.parse(a.debut))
                  .map((x) => (
                    <option key={x.id} value={x.id}>
                      {dateCourte.format(new Date(x.debut))} — {x.libelle} ({ETAT[x.etat]})
                    </option>
                  ))}
              </select>
            }
          >
            {suivis === 0 ? (
              <EtatVide titre="Aucun ingrédient suivi">
                Coche « suivre » sur un ingrédient dans <Link to="/parametres/produits">Paramètres → Produits & prix → Ingrédients</Link> — par exemple ton fût de bière, au litre, avec la
                recette « pinte = 50 cl ».
              </EtatVide>
            ) : (
              <MatchIngredients s={s} />
            )}
          </Carte>
        </>
      )}
      <ReserveIngredients />
    </>
  );
}

function useMaj(cle: string) {
  const client = useQueryClient();
  return (s: StockIngredientsMatch) => {
    client.setQueryData(["stock-ingredients", cle], s);
    void client.invalidateQueries({ queryKey: ["stock-ingredients"] });
    void client.invalidateQueries({ queryKey: ["reserve-ingredients"] });
    void client.invalidateQueries({ queryKey: ["cloture"] });
  };
}

/** Quantité en unité d'achat (« 12,5 » L), enregistrée à la sortie du champ si elle a changé. */
function ChampQuantite({ valeur, enregistrer, libelle }: { valeur: number | null; enregistrer: (milli: number) => void; libelle: string }) {
  const texteDe = (v: number | null) => (v === null ? "" : milliVersSaisieStock(v));
  const [texte, setTexte] = useState(texteDe(valeur));
  const [avant, setAvant] = useState(valeur);
  if (valeur !== avant) {
    setAvant(valeur);
    setTexte(texteDe(valeur));
  }
  const valider = () => {
    const m = quantiteStockVersMilli(texte, { zero: true });
    if (m !== null && m !== valeur) enregistrer(m);
    else setTexte(texteDe(valeur));
  };
  return (
    <input
      type="text"
      inputMode="decimal"
      className="champ-quantite"
      value={texte}
      aria-label={libelle}
      onChange={(ev) => setTexte(ev.target.value.replace(/[^\d,.]/g, "").slice(0, 12))}
      onBlur={valider}
      onKeyDown={(ev) => {
        if (ev.key === "Enter") (ev.target as HTMLInputElement).blur();
      }}
    />
  );
}

function MatchIngredients({ s }: { s: StockIngredientsMatch }) {
  const maj = useMaj(s.evenement.id);
  const e = s.evenement;
  const [reassort, setReassort] = useState<Record<string, string>>({});
  const [attente, setAttente] = useState<{ standId: string; ingredientId: string; quantiteMilli: number; motif: string } | null>(null);
  const base = { evenementId: e.id };
  const mep = useMutation({
    mutationFn: (d: { standId: string; ingredientId: string; quantiteMilli: number }) => api.put<StockIngredientsMatch>("/stock/ingredients/mise-en-place", { ...base, ...d }),
    onSuccess: maj,
  });
  const suggestions = useMutation({ mutationFn: () => api.post<StockIngredientsMatch>("/stock/ingredients/mise-en-place/suggestions", base), onSuccess: maj });
  const ajouter = useMutation({
    mutationFn: (d: { standId: string; ingredientId: string; quantiteMilli: number }) => api.post<StockIngredientsMatch>("/stock/ingredients/reassort", { ...base, ...d }),
    onSuccess: (r, d) => {
      maj(r);
      setReassort((x) => ({ ...x, [`${d.standId}|${d.ingredientId}`]: "" }));
    },
  });
  const compter = useMutation({
    mutationFn: (d: { standId: string; ingredientId: string; quantiteMilli: number; motif?: string | null }) => api.put<StockIngredientsMatch>("/stock/ingredients/comptage", { ...base, ...d }),
    onSuccess: (r) => {
      maj(r);
      setAttente(null);
    },
  });
  // Un écart au-delà de 3 % du départ demande un motif avant d'être enregistré.
  const saisirCompte = (standId: string, l: LigneStockIngredient, milli: number) => {
    const ecart = milli - l.restant;
    if (Math.abs(ecart) > l.depart * 0.03 && !(l.comptage?.motif && l.compte === milli)) setAttente({ standId, ingredientId: l.ingredientId, quantiteMilli: milli, motif: "" });
    else compter.mutate({ standId, ingredientId: l.ingredientId, quantiteMilli: milli });
  };
  const lireReassort = (texte: string) => {
    const negatif = /^\s*[-−]/.test(texte);
    const m = quantiteStockVersMilli(texte.replace(/^\s*[-−]/, ""));
    return m === null ? null : negatif ? -m : m;
  };

  return (
    <>
      {e.etat === "a_venir" && s.stands.some((st) => st.lignes.some((l) => l.suggestion !== null && l.suggestion !== l.miseEnPlace)) && (
        <div className="ligne-actions" style={{ marginTop: 0, marginBottom: 12 }}>
          <button className="btn btn-fantome" disabled={suggestions.isPending} onClick={() => suggestions.mutate()}>
            <Sparkles size={15} /> Appliquer les suggestions de mise en place
          </button>
        </div>
      )}
      {e.etat === "clos" && <div className="message message-info">Événement clos : consommation figée avec les recettes du jour de la clôture, comptage définitif.</div>}
      <MessageErreur erreur={mep.error ?? ajouter.error ?? compter.error ?? suggestions.error} />
      {s.stands
        .filter((st) => st.lignes.length > 0)
        .map((st) => (
          <div key={st.standId} style={{ marginTop: 12 }}>
            <h3 style={{ margin: "0 0 6px", fontSize: 14 }}>{st.nom}</h3>
            <div className="scroll-x">
              <table className="tableau stock">
                <thead>
                  <tr>
                    <th>Ingrédient</th>
                    <th className="d">Reste</th>
                    <th className="d">Mise en place</th>
                    <th className="d">Réassort</th>
                    <th className="d">Consommé</th>
                    <th className="d">Attendu</th>
                    <th className="d">Compté</th>
                    <th className="d">Écart</th>
                    <th className="d">Écart €</th>
                  </tr>
                </thead>
                <tbody>
                  {st.lignes.map((l) => {
                    const k = `${st.standId}|${l.ingredientId}`;
                    const enAttente = attente?.standId === st.standId && attente.ingredientId === l.ingredientId;
                    const saisie = lireReassort(reassort[k] ?? "");
                    return (
                      <tr key={l.ingredientId}>
                        <td>
                          <strong>{l.nom}</strong>
                          {l.alerte && <span className={`puce ${l.alerte === "rupture" ? "puce-rouge" : "puce-ambre"}`} style={{ marginLeft: 6 }}>{l.alerte}</span>}
                          {l.comptage && (
                            <div className="discret" style={{ fontSize: 11 }}>
                              compté par {l.comptage.par}
                              {l.comptage.motif ? ` — « ${l.comptage.motif} »` : ""}
                            </div>
                          )}
                          {enAttente && (
                            <form
                              className="en-ligne"
                              style={{ gap: 6, marginTop: 6 }}
                              onSubmit={(ev) => {
                                ev.preventDefault();
                                compter.mutate({ standId: st.standId, ingredientId: l.ingredientId, quantiteMilli: attente.quantiteMilli, motif: attente.motif.trim() });
                              }}
                            >
                              <input
                                type="text"
                                value={attente.motif}
                                onChange={(ev) => setAttente({ ...attente, motif: ev.target.value })}
                                placeholder={`Motif de l'écart de ${signeQ(l, attente.quantiteMilli - l.restant)}`}
                                maxLength={300}
                                autoFocus
                                style={{ minWidth: 220 }}
                              />
                              <button className="btn" disabled={attente.motif.trim().length < 5 || compter.isPending}>
                                Enregistrer
                              </button>
                              <button type="button" className="btn btn-fantome" onClick={() => setAttente(null)}>
                                Annuler
                              </button>
                            </form>
                          )}
                        </td>
                        <td className="d chiffre">{l.premierMatch ? "—" : q(l, l.reste)}</td>
                        <td className="d">
                          {e.etat === "a_venir" ? (
                            <>
                              <ChampQuantite valeur={l.miseEnPlace} libelle={`Mise en place ${l.nom}`} enregistrer={(m) => mep.mutate({ standId: st.standId, ingredientId: l.ingredientId, quantiteMilli: m })} />
                              {l.suggestion !== null && <div className="discret" style={{ fontSize: 11 }}>suggéré {q(l, l.suggestion)}</div>}
                            </>
                          ) : (
                            <span className="chiffre">{q(l, l.miseEnPlace)}</span>
                          )}
                        </td>
                        <td className="d">
                          {e.etat === "ouvert" ? (
                            <form
                              className="en-ligne"
                              style={{ gap: 4, justifyContent: "flex-end", flexWrap: "nowrap" }}
                              onSubmit={(ev) => {
                                ev.preventDefault();
                                if (saisie !== null) ajouter.mutate({ standId: st.standId, ingredientId: l.ingredientId, quantiteMilli: saisie });
                              }}
                            >
                              <span className="chiffre discret">{q(l, l.reassort)}</span>
                              <input
                                type="text"
                                inputMode="decimal"
                                className="champ-quantite"
                                value={reassort[k] ?? ""}
                                placeholder="+"
                                aria-label={`Réassort ${l.nom} (− pour un retour)`}
                                onChange={(ev) => setReassort({ ...reassort, [k]: ev.target.value.replace(/[^\d,.\-−]/g, "").slice(0, 12) })}
                              />
                              <button className="btn btn-fantome" disabled={saisie === null || ajouter.isPending} aria-label={`Ajouter le réassort ${l.nom}`}>
                                OK
                              </button>
                            </form>
                          ) : (
                            <span className="chiffre">{q(l, l.reassort)}</span>
                          )}
                        </td>
                        <td className="d chiffre">{q(l, l.consomme)}</td>
                        <td className="d chiffre" style={l.restant < 0 ? { color: "var(--red)" } : undefined}>
                          {q(l, l.restant)}
                        </td>
                        <td className="d">
                          {e.etat === "ouvert" ? (
                            <ChampQuantite valeur={enAttente ? attente.quantiteMilli : l.compte} libelle={`Compté ${l.nom}`} enregistrer={(m) => saisirCompte(st.standId, l, m)} />
                          ) : (
                            <span className="chiffre">{l.compte === null ? "—" : q(l, l.compte)}</span>
                          )}
                        </td>
                        <td className="d chiffre" style={{ color: l.ecart === null ? undefined : l.motifRequis ? "var(--red)" : l.ecart !== 0 ? "var(--amber)" : undefined }}>
                          {l.ecart === null ? "—" : signeQ(l, l.ecart)}
                        </td>
                        <td className="d chiffre">{l.ecartValeur === null ? "—" : formaterMontant(Math.round(l.ecartValeur))}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))}
    </>
  );
}

function ReserveIngredients() {
  const client = useQueryClient();
  const r = useQuery({ queryKey: ["reserve-ingredients"], queryFn: () => api.get<EtatReserveIngredients>("/stock/ingredients/reserve") });
  const [l, setL] = useState({ ingredientId: "", quantite: "", prix: "", fournisseur: "", date: aujourdhui() });
  const [inventaire, setInventaire] = useState<Record<string, string>>({});
  const [dateInv, setDateInv] = useState(aujourdhui());
  const maj = (e: EtatReserveIngredients) => {
    client.setQueryData(["reserve-ingredients"], e);
    void client.invalidateQueries({ queryKey: ["stock-ingredients"] });
    void client.invalidateQueries({ queryKey: ["ingredients"] });
    void client.invalidateQueries({ queryKey: ["produits"] });
  };
  const livrer = useMutation({
    mutationFn: () =>
      api.post<EtatReserveIngredients>("/stock/ingredients/livraisons", {
        ingredientId: l.ingredientId,
        quantiteMilli: quantiteStockVersMilli(l.quantite),
        prixTotal: lireMontant(l.prix),
        fournisseur: l.fournisseur,
        dateLivraison: l.date,
      }),
    onSuccess: (e) => {
      maj(e);
      setL({ ...l, quantite: "", prix: "", fournisseur: "" });
    },
  });
  const inventorier = useMutation({
    mutationFn: () =>
      api.post<EtatReserveIngredients>("/stock/ingredients/inventaires", {
        dateInventaire: dateInv,
        lignes: Object.entries(inventaire)
          .filter(([, t]) => t.trim() !== "")
          .map(([ingredientId, t]) => ({ ingredientId, compteMilli: quantiteStockVersMilli(t, { zero: true }) })),
      }),
    onSuccess: (e) => {
      maj(e);
      setInventaire({});
    },
  });
  if (r.isPending) return <Chargement />;
  if (r.error) return <MessageErreur erreur={r.error} />;
  const e = r.data!;
  if (e.ingredients.length === 0) return null;
  const choisi = e.ingredients.find((x) => x.ingredientId === l.ingredientId);
  const qte = quantiteStockVersMilli(l.quantite);
  const prix = lireMontant(l.prix);
  const saisiesInventaire = Object.values(inventaire).filter((t) => t.trim() !== "");
  const inventaireValide = saisiesInventaire.length > 0 && saisiesInventaire.every((t) => quantiteStockVersMilli(t, { zero: true }) !== null);

  return (
    <Carte titre="Réserve des ingrédients" description="Solde calculé = dernier inventaire + livraisons − mises en place − réassorts. Une livraison recalcule le prix moyen de l'ingrédient, et le coût des recettes suit.">
      <div className="scroll-x">
        <table className="tableau">
          <thead>
            <tr>
              <th>Ingrédient</th>
              <th className="d">Solde calculé</th>
              <th className="d">Prix moyen HT</th>
              <th className="d">Dernier inventaire</th>
              <th className="d">Compté aujourd'hui</th>
            </tr>
          </thead>
          <tbody>
            {e.ingredients.map((g) => (
              <tr key={g.ingredientId}>
                <td>{g.nom}</td>
                <td className="d chiffre" style={g.solde < 0 ? { color: "var(--red)" } : undefined}>
                  {formaterQuantiteStock(g.solde, g.unite)}
                </td>
                <td className="d chiffre">{formaterMontant(g.prix)} / {g.unite === "piece" ? "pièce" : g.unite === "l" ? "L" : "kg"}</td>
                <td className="d chiffre">{g.inventaire ? `${formaterQuantiteStock(g.inventaire.compte, g.unite)} le ${g.inventaire.date.split("-").reverse().join("/")}` : "—"}</td>
                <td className="d">
                  <input
                    type="text"
                    inputMode="decimal"
                    className="champ-quantite"
                    value={inventaire[g.ingredientId] ?? ""}
                    aria-label={`Inventaire ${g.nom}`}
                    onChange={(ev) => setInventaire({ ...inventaire, [g.ingredientId]: ev.target.value.replace(/[^\d,.]/g, "").slice(0, 12) })}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {saisiesInventaire.length > 0 && (
        <div className="ligne-actions">
          <input type="date" value={dateInv} onChange={(ev) => setDateInv(ev.target.value)} aria-label="Date de l'inventaire" style={{ width: "auto" }} />
          <button className="btn" disabled={!inventaireValide || inventorier.isPending} onClick={() => inventorier.mutate()}>
            Valider l'inventaire ({saisiesInventaire.length})
          </button>
          <span className="discret">Le compté devient le nouveau point de départ ; l'écart est la perte à la réserve.</span>
        </div>
      )}
      <MessageErreur erreur={inventorier.error} />

      <h3 style={{ margin: "18px 0 8px", fontSize: 14 }}>Livraison</h3>
      <form
        className="en-ligne"
        style={{ gap: 8 }}
        onSubmit={(ev) => {
          ev.preventDefault();
          livrer.mutate();
        }}
      >
        <select value={l.ingredientId} onChange={(ev) => setL({ ...l, ingredientId: ev.target.value })} aria-label="Ingrédient livré" style={{ width: "auto" }}>
          <option value="">Ingrédient…</option>
          {e.ingredients.map((g) => (
            <option key={g.ingredientId} value={g.ingredientId}>
              {g.nom}
            </option>
          ))}
        </select>
        <input
          type="text"
          inputMode="decimal"
          value={l.quantite}
          onChange={(ev) => setL({ ...l, quantite: ev.target.value })}
          placeholder={choisi ? `Quantité (${choisi.unite === "piece" ? "pièces" : choisi.unite === "l" ? "L" : "kg"})` : "Quantité"}
          aria-label="Quantité livrée"
          style={{ width: 130 }}
        />
        <input type="text" inputMode="decimal" value={l.prix} onChange={(ev) => setL({ ...l, prix: ev.target.value })} placeholder="Prix total HT (€)" aria-label="Prix total HT" style={{ width: 140 }} />
        <input type="text" value={l.fournisseur} onChange={(ev) => setL({ ...l, fournisseur: ev.target.value })} placeholder="Fournisseur (facultatif)" maxLength={120} aria-label="Fournisseur" style={{ flex: "1 1 160px", width: "auto" }} />
        <input type="date" value={l.date} onChange={(ev) => setL({ ...l, date: ev.target.value })} aria-label="Date de livraison" style={{ width: "auto" }} />
        <button className="btn" disabled={!l.ingredientId || qte === null || prix === null || livrer.isPending}>
          <PackagePlus size={15} /> Enregistrer
        </button>
      </form>
      {choisi && qte !== null && prix !== null && (
        <p className="discret" style={{ margin: "6px 0 0" }}>
          Soit {formaterMontant(Math.round((prix * 1000) / qte))} HT par {choisi.unite === "piece" ? "pièce" : choisi.unite === "l" ? "litre" : "kilo"}.
        </p>
      )}
      <MessageErreur erreur={livrer.error} />

      {e.mouvements.length > 0 && (
        <>
          <h3 style={{ margin: "18px 0 8px", fontSize: 14 }}>Derniers mouvements</h3>
          <div className="scroll-x">
            <table className="tableau">
              <thead>
                <tr>
                  <th>Quand</th>
                  <th>Mouvement</th>
                  <th>Ingrédient</th>
                  <th className="d">Quantité</th>
                  <th>Détail</th>
                </tr>
              </thead>
              <tbody>
                {e.mouvements.slice(0, 30).map((m) => (
                  <tr key={m.id}>
                    <td className="chiffre">{formaterDateHeure(m.le)}</td>
                    <td>{m.type === "livraison" ? "Livraison" : m.type === "mise_en_place" ? "Mise en place" : "Réassort"}</td>
                    <td>{m.ingredient}</td>
                    <td className="d chiffre">{formaterQuantiteStock(m.quantite, m.unite)}</td>
                    <td className="discret" style={{ fontSize: 12 }}>
                      {m.type === "livraison"
                        ? `${formaterMontant(m.prixTotal ?? 0)} HT${m.fournisseur ? ` · ${m.fournisseur}` : ""} · prix moyen ${formaterMontant(m.prixAvant ?? 0)} → ${formaterMontant(m.prixApres ?? 0)}`
                        : `${m.stand ?? ""} · ${m.match ?? ""}`}
                      {" · "}
                      {m.par}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </Carte>
  );
}
