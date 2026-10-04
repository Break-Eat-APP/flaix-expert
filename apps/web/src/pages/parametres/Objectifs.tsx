import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { formaterPourcentage, lirePourcentage, type Categorie, type PosteDepense } from "@flaix/domain";
import { api } from "../../api.ts";
import { Carte, Chargement, EntetePage, MessageErreur, Regles } from "../../composants/communs.tsx";

/** Suggestions de postes, à ajouter d'un clic : rien n'est créé tant que le directeur ne choisit pas. */
const SUGGESTIONS = ["Gobelets et consommables", "Sécurité", "Nettoyage", "Location de matériel", "Frais bancaires", "Animation"];
const enTexte = (pb: number | null) => (pb === null ? "" : String(pb / 100).replace(".", ","));

/**
 * Objectifs de marge (Paramètres ; dossier §15.79, §15.81, §15.132) : la cible de marge nette de chaque
 * soirée, les cibles de marge brute par catégorie, et les postes de dépense de la soirée.
 */
export function Objectifs() {
  const postes = useQuery({ queryKey: ["postes-depense"], queryFn: () => api.get<{ postes: PosteDepense[]; cibleLieu: number | null }>("/postes-depense") });
  const categories = useQuery({ queryKey: ["categories"], queryFn: () => api.get<Categorie[]>("/categories") });
  if (postes.isPending || categories.isPending) return <Chargement />;
  if (postes.error || categories.error) return <MessageErreur erreur={postes.error ?? categories.error} />;

  return (
    <>
      <EntetePage fil="Paramètres" filLien="/parametres" titre="Objectifs de marge" description="Cible de marge nette de chaque soirée, cibles de marge par catégorie, postes de dépense de la soirée." />
      <CibleLieu cible={postes.data!.cibleLieu} />
      <CiblesCategories categories={categories.data!} />
      <Postes postes={postes.data!.postes} />
      <Regles>
        <ul>
          <li><strong>Cible de marge nette de la soirée</strong> : en % du CA HT, tous frais de la soirée compris (coût matière, personnel, dépenses saisies). Elle s'applique à chaque soirée ; une soirée particulière peut avoir la sienne, dans Résultats → Finances. Sans cible, la marge nette s'affiche sans être jugée.</li>
          <li><strong>Cibles de marge brute</strong> : marge brute ÷ CA HT, par catégorie ; un produit peut avoir sa propre cible (fiche produit), qui prime sur celle de sa catégorie. Aucune valeur n'est proposée d'avance : il n'existe pas de référence fiable pour une buvette, et une cible inventée produirait des alertes sans valeur.</li>
          <li><strong>Où les cibles se voient</strong> : Produits & prix (marge au prix du moment, dès la saisie d'un nouveau prix), Résultats → Marges (marge réalisée sur les ventes) et « À surveiller ».</li>
          <li><strong>Postes de dépense</strong> : nommés librement ; un poste se désactive, il ne se supprime jamais, pour que les soirées passées gardent leurs montants. Les montants se saisissent soirée par soirée, en euros ou en % du CA HT, dans Résultats → Finances.</li>
          <li>Chaque modification est inscrite au journal technique.</li>
        </ul>
      </Regles>
    </>
  );
}

function CibleLieu({ cible }: { cible: number | null }) {
  const client = useQueryClient();
  const [texte, setTexte] = useState(enTexte(cible));
  const enregistrer = useMutation({
    mutationFn: (c: number | null) => api.put<{ cible: number | null }>("/finances/cible", { cible: c }),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ["postes-depense"] });
      void client.invalidateQueries({ queryKey: ["finances"] });
    },
  });
  const valeur = lirePourcentage(texte, { min: -100 });
  const invalide = texte.trim() !== "" && valeur === null;
  return (
    <Carte titre="Cible de marge nette de la soirée" description="Ce qu'il doit rester de chaque soirée une fois payés la marchandise, le personnel et les dépenses de la soirée, en % du CA HT.">
      <form
        className="en-ligne"
        style={{ alignItems: "flex-end" }}
        onSubmit={(e) => {
          e.preventDefault();
          if (!invalide) enregistrer.mutate(texte.trim() === "" ? null : valeur);
        }}
      >
        <label className="champ" style={{ flex: "0 1 200px" }}>
          <span>Cible (% du CA HT)</span>
          <input type="text" inputMode="decimal" value={texte} onChange={(e) => setTexte(e.target.value)} placeholder="aucune" />
        </label>
        <button className="btn" disabled={enregistrer.isPending || invalide}>
          Enregistrer
        </button>
        <span className="discret">{cible === null ? "Aucune cible : la marge nette n'est pas jugée." : `En vigueur : ${formaterPourcentage(cible)}.`}</span>
      </form>
      <MessageErreur erreur={enregistrer.error} />
    </Carte>
  );
}

function CiblesCategories({ categories }: { categories: Categorie[] }) {
  const actives = categories.filter((c) => c.actif);
  return (
    <Carte titre="Cibles de marge brute par catégorie" description="Marge brute ÷ CA HT. Un produit peut avoir sa propre cible sur sa fiche (Produits & prix), qui prime sur celle-ci.">
      {actives.length === 0 ? (
        <p className="note" style={{ margin: 0 }}>Aucune catégorie : crée-les dans Paramètres → Produits & prix.</p>
      ) : (
        <div className="scroll-x">
          <table className="tableau">
            <thead>
              <tr>
                <th>Catégorie</th>
                <th>Cible (% du CA HT)</th>
              </tr>
            </thead>
            <tbody>
              {actives.map((c) => (
                <LigneCategorie key={c.id} categorie={c} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Carte>
  );
}

function LigneCategorie({ categorie }: { categorie: Categorie }) {
  const client = useQueryClient();
  const [texte, setTexte] = useState(enTexte(categorie.cibleMarge));
  const enregistrer = useMutation({
    mutationFn: (cible: number | null) => api.patch<Categorie[]>(`/categories/${categorie.id}`, { cibleMarge: cible }),
    onSuccess: (l) => {
      client.setQueryData(["categories"], l);
      void client.invalidateQueries({ queryKey: ["resultats"] });
    },
  });
  const valeur = lirePourcentage(texte);
  const invalide = texte.trim() !== "" && valeur === null;
  const valider = () => {
    const v = texte.trim() === "" ? null : valeur;
    if (!invalide && v !== categorie.cibleMarge) enregistrer.mutate(v);
  };
  return (
    <tr>
      <td>{categorie.nom}</td>
      <td>
        <input
          type="text"
          inputMode="decimal"
          aria-label={`Cible de marge ${categorie.nom}`}
          value={texte}
          placeholder="aucune"
          onChange={(e) => setTexte(e.target.value)}
          onBlur={valider}
          onKeyDown={(e) => e.key === "Enter" && valider()}
          style={{ width: 110, borderColor: invalide ? "var(--red)" : undefined }}
        />{" "}
        {enregistrer.isPending && <span className="discret">…</span>}
        {enregistrer.error && <span className="texte-ambre">{(enregistrer.error as Error).message}</span>}
      </td>
    </tr>
  );
}

function Postes({ postes }: { postes: PosteDepense[] }) {
  const client = useQueryClient();
  const [nom, setNom] = useState("");
  const maj = (l: PosteDepense[]) => {
    client.setQueryData<{ postes: PosteDepense[]; cibleLieu: number | null }>(["postes-depense"], (avant) => (avant ? { ...avant, postes: l } : avant));
    void client.invalidateQueries({ queryKey: ["finances"] });
  };
  const creer = useMutation({ mutationFn: (n: string) => api.post<PosteDepense[]>("/postes-depense", { nom: n }), onSuccess: (l) => { maj(l); setNom(""); } });
  const existants = new Set(postes.map((p) => p.nom.toLocaleLowerCase("fr")));
  const suggestions = SUGGESTIONS.filter((s) => !existants.has(s.toLocaleLowerCase("fr")));

  return (
    <Carte titre="Postes de dépense de la soirée" description="Ce que coûte une soirée en plus de la marchandise et du personnel. Les montants se saisissent par soirée dans Résultats → Finances.">
      <form
        className="en-ligne"
        style={{ alignItems: "flex-end" }}
        onSubmit={(e) => {
          e.preventDefault();
          if (nom.trim()) creer.mutate(nom.trim());
        }}
      >
        <label className="champ" style={{ flex: "1 1 240px" }}>
          <span>Nouveau poste</span>
          <input type="text" value={nom} onChange={(e) => setNom(e.target.value)} maxLength={60} placeholder="Ex. Gobelets et consommables" />
        </label>
        <button className="btn" disabled={creer.isPending || !nom.trim()}>
          <Plus size={15} /> Ajouter
        </button>
      </form>
      {suggestions.length > 0 && (
        <div className="en-ligne" style={{ marginTop: 8, gap: 6 }}>
          <span className="discret" style={{ fontSize: 12.5 }}>Suggestions :</span>
          {suggestions.map((s) => (
            <button key={s} type="button" className="btn btn-fantome" style={{ padding: "3px 10px", fontSize: 12.5 }} disabled={creer.isPending} onClick={() => creer.mutate(s)}>
              + {s}
            </button>
          ))}
        </div>
      )}
      <MessageErreur erreur={creer.error} />
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
        {postes.map((p) => (
          <LignePoste key={p.id} poste={p} maj={maj} />
        ))}
        {postes.length === 0 && <p className="note" style={{ margin: 0 }}>Aucun poste pour l'instant.</p>}
      </div>
    </Carte>
  );
}

function LignePoste({ poste, maj }: { poste: PosteDepense; maj: (l: PosteDepense[]) => void }) {
  const [renommer, setRenommer] = useState<string | null>(null);
  const modifier = useMutation({ mutationFn: (corps: { nom?: string; actif?: boolean }) => api.patch<PosteDepense[]>(`/postes-depense/${poste.id}`, corps), onSuccess: (l) => { maj(l); setRenommer(null); } });
  return (
    <div className="caisse" style={{ opacity: poste.actif ? 1 : 0.6 }}>
      {renommer === null ? (
        <strong style={{ flex: 1 }}>{poste.nom}</strong>
      ) : (
        <form
          className="en-ligne"
          style={{ flex: 1 }}
          onSubmit={(e) => {
            e.preventDefault();
            if (renommer.trim()) modifier.mutate({ nom: renommer.trim() });
          }}
        >
          <input type="text" value={renommer} onChange={(e) => setRenommer(e.target.value)} maxLength={60} autoFocus aria-label={`Nouveau nom de ${poste.nom}`} style={{ width: 240 }} />
          <button className="btn" disabled={modifier.isPending || !renommer.trim()}>OK</button>
          <button type="button" className="btn btn-fantome" onClick={() => setRenommer(null)}>Annuler</button>
        </form>
      )}
      {!poste.actif && <span className="puce">désactivé</span>}
      <div className="actions">
        {renommer === null && (
          <button className="btn btn-fantome" onClick={() => setRenommer(poste.nom)}>
            Renommer
          </button>
        )}
        <button className={poste.actif ? "btn btn-danger" : "btn btn-fantome"} disabled={modifier.isPending} onClick={() => modifier.mutate({ actif: !poste.actif })}>
          {poste.actif ? "Désactiver" : "Réactiver"}
        </button>
      </div>
      {modifier.error && <div className="message message-erreur" style={{ width: "100%" }}>{(modifier.error as Error).message}</div>}
    </div>
  );
}
