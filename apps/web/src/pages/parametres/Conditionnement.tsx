import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { formaterMillimes, lireMillimes, matchsCouverts, millimesPourSaisie, stockBas, type Emballage, type EmballageDuProduit, type Produit } from "@flaix/domain";
import { formaterDateHeure } from "../../api.ts";
import { api } from "../../api.ts";
import { Carte, Chargement, MessageErreur } from "../../composants/communs.tsx";

/** Emballages courants d'une buvette, à ajouter d'un clic (le prix reste à saisir). */
const SUGGESTIONS = ["Gobelet 25 cl", "Gobelet 50 cl", "Barquette frites", "Serviette", "Pique", "Sachet", "Paille", "Couvercle"];

/**
 * Emballages du lieu (dossier §15.155) : gobelets, barquettes, serviettes… et leur prix HT à l'unité, au millième
 * d'euro. Un nouveau prix vaut pour tous les produits qui les utilisent.
 */
export function GestionEmballages() {
  const client = useQueryClient();
  const q = useQuery({ queryKey: ["emballages"], queryFn: () => api.get<Emballage[]>("/emballages") });
  const [nom, setNom] = useState("");
  const [prix, setPrix] = useState("");
  const apres = (liste: Emballage[]) => {
    client.setQueryData(["emballages"], liste);
    void client.invalidateQueries({ queryKey: ["produits"] });
    void client.invalidateQueries({ queryKey: ["finances"] });
  };
  const ajouter = useMutation({
    mutationFn: () => api.post<Emballage[]>("/emballages", { nom: nom.trim(), prixMillimes: lireMillimes(prix) }),
    onSuccess: (l) => {
      apres(l);
      setNom("");
      setPrix("");
    },
  });
  if (q.isPending) return <Chargement />;
  if (q.error) return <MessageErreur erreur={q.error} />;
  const liste = q.data!;
  const prixLu = lireMillimes(prix);
  const proposes = SUGGESTIONS.filter((s) => !liste.some((e) => e.nom.toLocaleLowerCase("fr") === s.toLocaleLowerCase("fr")));

  return (
    <Carte titre="Emballages" description="Gobelets, barquettes, serviettes… avec leur prix HT à l'unité, au millième d'euro près (une serviette coûte souvent moins d'un centime). Un nouveau prix s'applique à tous les produits qui les utilisent.">
      {liste.map((e) => (
        <LigneEmballage key={e.id} e={e} apres={apres} />
      ))}
      <form
        className="grille-champs"
        style={{ alignItems: "end", marginTop: liste.length ? 14 : 0 }}
        onSubmit={(ev) => {
          ev.preventDefault();
          if (nom.trim() && prixLu !== null) ajouter.mutate();
        }}
      >
        <label className="champ">
          <span>Nouvel emballage</span>
          <input type="text" value={nom} onChange={(ev) => setNom(ev.target.value)} placeholder="Ex. : gobelet 50 cl" maxLength={60} />
        </label>
        <label className="champ">
          <span>Prix HT à l'unité (€)</span>
          <input type="text" inputMode="decimal" value={prix} onChange={(ev) => setPrix(ev.target.value)} placeholder="ex. 0,12" style={{ borderColor: prix.trim() && prixLu === null ? "var(--red)" : undefined }} />
        </label>
        <button className="btn" disabled={!nom.trim() || prixLu === null || ajouter.isPending}>
          <Plus size={16} /> Ajouter
        </button>
      </form>
      {proposes.length > 0 && (
        <div className="en-ligne" style={{ marginTop: 10 }}>
          <span className="discret">Idées :</span>
          {proposes.map((s) => (
            <button key={s} type="button" className="puce-choix" onClick={() => setNom(s)}>
              {s}
            </button>
          ))}
        </div>
      )}
      <MessageErreur erreur={ajouter.error} />
    </Carte>
  );
}

function LigneEmballage({ e, apres }: { e: Emballage; apres: (l: Emballage[]) => void }) {
  const [nom, setNom] = useState(e.nom);
  const [prix, setPrix] = useState(millimesPourSaisie(e.prixMillimes));
  const [confirmer, setConfirmer] = useState(false);
  useEffect(() => {
    setNom(e.nom);
    setPrix(millimesPourSaisie(e.prixMillimes));
  }, [e.nom, e.prixMillimes]);
  const modifier = useMutation({ mutationFn: () => api.patch<Emballage[]>(`/emballages/${e.id}`, { nom: nom.trim(), prixMillimes: lireMillimes(prix) }), onSuccess: apres });
  const supprimer = useMutation({ mutationFn: () => api.supprimer<Emballage[]>(`/emballages/${e.id}`), onSuccess: apres });
  const prixLu = lireMillimes(prix);
  const change = nom.trim() !== e.nom || prixLu !== e.prixMillimes;

  return (
    <div className="frais-ligne">
      <div className="en-ligne" style={{ gap: 8 }}>
        <input type="text" aria-label={`Nom : ${e.nom}`} value={nom} onChange={(ev) => setNom(ev.target.value)} maxLength={60} style={{ width: 200 }} />
        <input
          type="text"
          inputMode="decimal"
          aria-label={`Prix : ${e.nom}`}
          value={prix}
          onChange={(ev) => setPrix(ev.target.value)}
          style={{ width: 100, borderColor: prixLu === null ? "var(--red)" : undefined }}
        />
        <span className="discret">€ HT · {e.produits ? `${e.produits} produit${e.produits > 1 ? "s" : ""}` : "aucun produit"}</span>
      </div>
      <div className="frais-actions">
        {change && (
          <button className="btn" disabled={!nom.trim() || prixLu === null || modifier.isPending} onClick={() => modifier.mutate()}>
            Enregistrer
          </button>
        )}
        {confirmer ? (
          <button className="btn btn-danger" disabled={supprimer.isPending} onClick={() => supprimer.mutate()}>
            Confirmer : retirer de {e.produits} produit{e.produits > 1 ? "s" : ""}
          </button>
        ) : (
          <button className="btn btn-fantome" aria-label={`Supprimer ${e.nom}`} onClick={() => (e.produits ? setConfirmer(true) : supprimer.mutate())}>
            <Trash2 size={15} />
          </button>
        )}
      </div>
      <StockEmballage e={e} apres={apres} />
      <MessageErreur erreur={modifier.error ?? supprimer.error} />
    </div>
  );
}

const nombre = (n: number) => n.toLocaleString("fr-FR");
const lireQuantite = (t: string) => (/^\d{1,8}$/.test(t.trim()) ? Number(t.trim()) : null);

/** Stock d'un emballage (§15.158) : comptage de départ, livraisons, seuil d'alerte ; les ventes se déduisent seules. */
function StockEmballage({ e, apres }: { e: Emballage; apres: (l: Emballage[]) => void }) {
  const [ouvert, setOuvert] = useState(false);
  const [livre, setLivre] = useState("");
  const [compte, setCompte] = useState("");
  const [seuil, setSeuil] = useState(e.seuil !== null ? String(e.seuil) : "");
  const mouvement = useMutation({
    mutationFn: ({ sorte, quantite }: { sorte: "comptage" | "livraison"; quantite: number }) => api.post<Emballage[]>(`/emballages/${e.id}/${sorte}`, { quantite }),
    onSuccess: (l) => {
      apres(l);
      setLivre("");
      setCompte("");
    },
  });
  const changerSeuil = useMutation({ mutationFn: (v: number | null) => api.patch<Emballage[]>(`/emballages/${e.id}`, { seuil: v }), onSuccess: apres });
  const s = e.stock;
  if (!s)
    return (
      <div className="emballage-stock">
        {ouvert ? (
          <span className="en-ligne" style={{ gap: 6 }}>
            <input type="text" inputMode="numeric" aria-label={`Combien de ${e.nom} as-tu ?`} placeholder="Combien en as-tu ?" value={compte} onChange={(ev) => setCompte(ev.target.value)} style={{ width: 170 }} />
            <button className="btn" disabled={lireQuantite(compte) === null || mouvement.isPending} onClick={() => mouvement.mutate({ sorte: "comptage", quantite: lireQuantite(compte)! })}>
              Démarrer le suivi
            </button>
          </span>
        ) : (
          <button className="btn-lien" onClick={() => setOuvert(true)}>
            Suivre le stock
          </button>
        )}
        <MessageErreur erreur={mouvement.error} />
      </div>
    );
  const n = matchsCouverts(s);
  return (
    <div className="emballage-stock">
      <span>
        Stock estimé : <strong className="chiffre">{nombre(s.estime)}</strong>
        {n !== null && <span className="discret"> (≈ {n} match{n > 1 ? "s" : ""})</span>}{" "}
        {stockBas(e) && <span className="puce puce-rouge">stock bas</span>}
        <small className="discret">
          {" "}
          · compté {nombre(s.dernierComptage.quantite)} le {formaterDateHeure(s.dernierComptage.le)}
          {s.livreDepuis ? `, +${nombre(s.livreDepuis)} livrés` : ""}
          {s.consommeDepuis ? `, −${nombre(s.consommeDepuis)} vendus` : ""}
        </small>
      </span>
      <span className="en-ligne" style={{ gap: 6 }}>
        <input type="text" inputMode="numeric" aria-label={`Livraison : ${e.nom}`} placeholder="Reçus" value={livre} onChange={(ev) => setLivre(ev.target.value)} style={{ width: 90 }} />
        <button className="btn btn-fantome" disabled={!lireQuantite(livre) || mouvement.isPending} onClick={() => mouvement.mutate({ sorte: "livraison", quantite: lireQuantite(livre)! })}>
          Livraison reçue
        </button>
        <input type="text" inputMode="numeric" aria-label={`Comptage : ${e.nom}`} placeholder="Comptés" value={compte} onChange={(ev) => setCompte(ev.target.value)} style={{ width: 90 }} />
        <button className="btn btn-fantome" disabled={lireQuantite(compte) === null || mouvement.isPending} onClick={() => mouvement.mutate({ sorte: "comptage", quantite: lireQuantite(compte)! })}>
          Recompter
        </button>
        <label className="en-ligne" style={{ gap: 6 }}>
          <span className="discret">Alerte sous</span>
          <input
            type="text"
            inputMode="numeric"
            aria-label={`Seuil d'alerte : ${e.nom}`}
            value={seuil}
            onChange={(ev) => setSeuil(ev.target.value)}
            onBlur={() => {
              const v = seuil.trim() === "" ? null : lireQuantite(seuil);
              if ((seuil.trim() === "" || v !== null) && v !== e.seuil) changerSeuil.mutate(v);
            }}
            style={{ width: 80 }}
          />
        </label>
      </span>
      <MessageErreur erreur={mouvement.error ?? changerSeuil.error} />
    </div>
  );
}

/** Emballages d'une portion du produit : chaque changement s'enregistre aussitôt. */
export function ConditionnementProduit({ produit, majProduits }: { produit: Produit; majProduits: (l: Produit[]) => void }) {
  const client = useQueryClient();
  const q = useQuery({ queryKey: ["emballages"], queryFn: () => api.get<Emballage[]>("/emballages") });
  const [ajout, setAjout] = useState("");
  const enregistrer = useMutation({
    mutationFn: (emballages: { emballageId: string; quantite: number }[]) => api.put<Produit[]>(`/produits/${produit.id}/emballages`, { emballages }),
    onSuccess: (l) => {
      majProduits(l);
      void client.invalidateQueries({ queryKey: ["emballages"] });
      void client.invalidateQueries({ queryKey: ["finances"] });
    },
  });
  if (q.isPending) return <Chargement />;
  if (q.error) return <MessageErreur erreur={q.error} />;
  const actuels = produit.emballages;
  const envoyer = (l: EmballageDuProduit[]) => enregistrer.mutate(l.map((e) => ({ emballageId: e.emballageId, quantite: e.quantite })));
  const disponibles = q.data!.filter((e) => !actuels.some((a) => a.emballageId === e.id));

  if (q.data!.length === 0)
    return <p className="note" style={{ marginTop: 0 }}>Aucun emballage pour l'instant : ajoute tes gobelets, barquettes, serviettes… avec le bouton « Emballages » en haut de la page.</p>;
  return (
    <div className="conditionnement">
      {actuels.map((e) => (
        <div key={e.emballageId} className="en-ligne" style={{ gap: 8 }}>
          <input
            type="number"
            min={1}
            max={50}
            aria-label={`Quantité : ${e.nom}`}
            value={e.quantite}
            disabled={enregistrer.isPending}
            onChange={(ev) => {
              const n = Number(ev.target.value);
              if (Number.isInteger(n) && n >= 1 && n <= 50) envoyer(actuels.map((x) => (x.emballageId === e.emballageId ? { ...x, quantite: n } : x)));
            }}
            style={{ width: 70 }}
          />
          <span>
            × {e.nom} <span className="discret">({formaterMillimes(e.prixMillimes)})</span>
          </span>
          <button className="btn-lien" aria-label={`Retirer ${e.nom}`} disabled={enregistrer.isPending} onClick={() => envoyer(actuels.filter((x) => x.emballageId !== e.emballageId))}>
            Retirer
          </button>
        </div>
      ))}
      {disponibles.length > 0 && (
        <div className="en-ligne" style={{ gap: 8 }}>
          <select aria-label="Emballage à ajouter" value={ajout} onChange={(ev) => setAjout(ev.target.value)} style={{ width: "auto" }}>
            <option value="">Ajouter un emballage…</option>
            {disponibles.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nom} ({formaterMillimes(e.prixMillimes)})
              </option>
            ))}
          </select>
          <button
            className="btn btn-fantome"
            disabled={!ajout || enregistrer.isPending}
            onClick={() => {
              const e = q.data!.find((x) => x.id === ajout)!;
              envoyer([...actuels, { emballageId: e.id, nom: e.nom, quantite: 1, prixMillimes: e.prixMillimes }]);
              setAjout("");
            }}
          >
            Ajouter
          </button>
        </div>
      )}
      <p style={{ margin: 0 }}>
        Conditionnement d'une portion : <strong className="chiffre">{formaterMillimes(produit.conditionnementMillimes)}</strong>
        {produit.coutMatiere !== null && (
          <span className="discret"> · coût de revient {formaterMillimes(produit.coutMatiere * 10 + produit.conditionnementMillimes)} (matière + conditionnement)</span>
        )}
      </p>
      <MessageErreur erreur={enregistrer.error} />
    </div>
  );
}
