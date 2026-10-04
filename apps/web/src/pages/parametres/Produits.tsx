import { useMemo, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChefHat, ChevronDown, ChevronRight, Plus, Search, Tags } from "lucide-react";
import {
  TAUX_TVA,
  formaterMontant,
  libelleTauxTva,
  lireMontant,
  margeUnitaireComptoir,
  montantPourSaisie,
  type Categorie,
  type Produit,
  type Stand,
  type Tarif,
  type TauxTvaPb,
} from "@flaix/domain";
import { api, formaterDateHeure } from "../../api.ts";
import { Carte, Chargement, EntetePage, EtatVide, MessageErreur, Regles } from "../../composants/communs.tsx";
import { GestionIngredients, RecetteProduit } from "./Recettes.tsx";

const COLONNES = "minmax(150px, 2fr) minmax(80px, 1fr) minmax(130px, 2fr) minmax(70px, 0.8fr) minmax(50px, 0.6fr) minmax(80px, 0.9fr) minmax(100px, 1.2fr) 24px";

function Marge({ produit }: { produit: Produit }) {
  const t = produit.tarifEnVigueur;
  if (!t || produit.coutMatiere === null) return <span className="discret">—</span>;
  const { marge, tauxMarge } = margeUnitaireComptoir(t.prixTtc, t.tauxTva, produit.coutMatiere);
  return (
    <span className="chiffre">
      {formaterMontant(marge)} {tauxMarge !== null && <span className="discret">· {tauxMarge.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %</span>}
    </span>
  );
}

export function Produits() {
  const client = useQueryClient();
  const produits = useQuery({ queryKey: ["produits"], queryFn: () => api.get<Produit[]>("/produits") });
  const stands = useQuery({ queryKey: ["stands"], queryFn: () => api.get<Stand[]>("/stands") });
  const categories = useQuery({ queryKey: ["categories"], queryFn: () => api.get<Categorie[]>("/categories") });

  const [recherche, setRecherche] = useState("");
  const [filtreStand, setFiltreStand] = useState("");
  const [ouvert, setOuvert] = useState<string | null>(null);
  const [creation, setCreation] = useState(false);
  const [gererCategories, setGererCategories] = useState(false);
  const [gererIngredients, setGererIngredients] = useState(false);

  const majProduits = (liste: Produit[]) => client.setQueryData(["produits"], liste);

  const filtres = useMemo(() => {
    const q = recherche.trim().toLocaleLowerCase("fr");
    return (produits.data ?? []).filter(
      (p) => (!q || p.nom.toLocaleLowerCase("fr").includes(q)) && (!filtreStand || p.standIds.includes(filtreStand)),
    );
  }, [produits.data, recherche, filtreStand]);

  if (produits.isPending || stands.isPending || categories.isPending) return <Chargement />;
  const erreur = produits.error ?? stands.error ?? categories.error;
  if (erreur) return <MessageErreur erreur={erreur} />;

  const listeStands = stands.data!;
  const nomStand = new Map(listeStands.map((s) => [s.id, s.nom]));
  const nomCategorie = new Map(categories.data!.map((c) => [c.id, c.nom]));
  const actifs = produits.data!.filter((p) => p.actif).length;

  return (
    <>
      <EntetePage
        fil="Paramètres"
        filLien="/parametres"
        titre="Produits & prix"
        description={`${actifs} produit${actifs > 1 ? "s" : ""} actif${actifs > 1 ? "s" : ""}. Une fiche par produit ; tu coches les stands qui le vendent.`}
        actions={
          <>
            <button className="btn btn-fantome" onClick={() => setGererCategories(!gererCategories)}>
              <Tags size={15} /> Catégories
            </button>
            <button className="btn btn-fantome" onClick={() => setGererIngredients(!gererIngredients)}>
              <ChefHat size={15} /> Ingrédients
            </button>
            <button className="btn" onClick={() => setCreation(!creation)}>
              <Plus size={16} /> Ajouter un produit
            </button>
          </>
        }
      />

      {gererCategories && <GestionCategories categories={categories.data!} />}
      {gererIngredients && <GestionIngredients />}
      {creation && (
        <FormulaireCreation
          stands={listeStands}
          categories={categories.data!}
          fermer={() => setCreation(false)}
          creee={(liste) => {
            majProduits(liste);
            setCreation(false);
          }}
        />
      )}

      <Carte>
        {produits.data!.length === 0 ? (
          <EtatVide titre="Aucun produit pour l'instant">
            {listeStands.length === 0
              ? "Commence par créer tes stands (Paramètres → Stands & caisses), puis ajoute tes produits ici."
              : "Clique sur « Ajouter un produit » pour construire ton catalogue."}
          </EtatVide>
        ) : (
          <>
            <div className="en-ligne" style={{ marginBottom: 12 }}>
              <label className="champ" style={{ flex: "1 1 240px" }}>
                <span>Rechercher un produit</span>
                <div style={{ position: "relative" }}>
                  <input type="search" value={recherche} onChange={(e) => setRecherche(e.target.value)} placeholder="Nom du produit" style={{ paddingLeft: 30 }} />
                  <Search size={14} style={{ position: "absolute", left: 10, top: 11, color: "var(--muted)" }} />
                </div>
              </label>
              <label className="champ" style={{ flex: "0 1 240px" }}>
                <span>Stand</span>
                <select value={filtreStand} onChange={(e) => setFiltreStand(e.target.value)}>
                  <option value="">Tous les stands</option>
                  {listeStands.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nom}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="liste">
              <div className="liste-entete" style={{ gridTemplateColumns: COLONNES }}>
                <span>Produit</span>
                <span>Catégorie</span>
                <span>Vendu dans</span>
                <span>Prix TTC</span>
                <span>TVA</span>
                <span>Coût matière</span>
                <span>Marge comptoir</span>
                <span />
              </div>
              {filtres.length === 0 && <div className="liste-ligne discret">Aucun produit ne correspond à ce filtre.</div>}
              {filtres.map((p) => (
                <div key={p.id}>
                  <div
                    className={`liste-ligne cliquable${p.actif ? "" : " inactive"}`}
                    style={{ gridTemplateColumns: COLONNES }}
                    onClick={() => setOuvert(ouvert === p.id ? null : p.id)}
                  >
                    <strong>
                      {p.nom} {!p.actif && <span className="puce puce-rouge">Désactivé</span>}
                      {p.tarifAVenir && <span className="puce puce-ambre" style={{ marginLeft: 4 }}>Nouveau prix programmé</span>}
                    </strong>
                    <span>
                      <span className="cellule-libelle">Catégorie</span>
                      {p.categorieId ? nomCategorie.get(p.categorieId) : <span className="discret">—</span>}
                    </span>
                    <span className="en-ligne" style={{ gap: 4 }}>
                      <span className="cellule-libelle">Vendu dans</span>
                      {p.standIds.length === 0 ? <span className="puce puce-ambre">Aucun stand</span> : p.standIds.map((id) => <span key={id} className="puce puce-violet">{nomStand.get(id)}</span>)}
                    </span>
                    <span className="chiffre">
                      <span className="cellule-libelle">Prix TTC</span>
                      {p.tarifEnVigueur ? formaterMontant(p.tarifEnVigueur.prixTtc) : "—"}
                    </span>
                    <span>
                      <span className="cellule-libelle">TVA</span>
                      {p.tarifEnVigueur ? libelleTauxTva(p.tarifEnVigueur.tauxTva) : "—"}
                    </span>
                    <span className="chiffre">
                      <span className="cellule-libelle">Coût matière</span>
                      {p.coutMatiere !== null ? formaterMontant(p.coutMatiere) : <span className="discret">—</span>}
                      {p.aRecette && <span className="puce" style={{ marginLeft: 4, fontSize: 10.5 }}>recette</span>}
                    </span>
                    <span>
                      <span className="cellule-libelle">Marge comptoir</span>
                      <Marge produit={p} />
                    </span>
                    <span className="discret">{ouvert === p.id ? <ChevronDown size={16} /> : <ChevronRight size={16} />}</span>
                  </div>
                  {ouvert === p.id && <DetailProduit produit={p} stands={listeStands} categories={categories.data!} majProduits={majProduits} />}
                </div>
              ))}
            </div>
          </>
        )}
      </Carte>

      <Regles>
        <ul>
          <li><strong>Une fiche par produit</strong>, un prix et un historique : un hot-dog vendu dans trois stands est un seul produit, avec trois stands cochés. Il ne peut donc jamais avoir trois prix différents par erreur.</li>
          <li><strong>Le prix ne se modifie pas, il se remplace</strong> : chaque changement crée un nouveau tarif daté (prix TTC + taux de TVA + date d'effet), l'ancien reste consultable. Un ticket garde toujours le prix en vigueur au moment de la vente.</li>
          <li>Un tarif peut prendre effet tout de suite ou à une date future (ex. nouveau prix à partir du prochain événement), <strong>jamais dans le passé</strong>.</li>
          <li><strong>Le taux de TVA est choisi par toi</strong>, produit par produit ; le logiciel ne présélectionne rien. En cas de doute (boissons consommées sur place : 5,5 % ou 10 % ?), demande à ton expert-comptable.</li>
          <li><strong>Marge comptoir</strong> = prix HT − coût matière HT, par vente. Prix HT = prix TTC ÷ (1 + taux de TVA). Taux de marge = marge ÷ prix HT. C'est une marge brute : ce qui reste avant salaires, loyer et charges — pas « ce que tu gagnes ».</li>
          <li>Exemple : 7,00 € TTC à 10 % de TVA = 6,36 € HT ; avec 1,90 € de coût matière, la marge est de 4,46 € par vente, soit 70,1 %.</li>
          <li>Le coût matière est facultatif. Pour un produit acheté tel quel (canette, bière…), il est recalculé à chaque livraison du Stock (coût moyen pondéré).</li>
          <li><strong>Recette</strong> (produit fabriqué) : tes ingrédients ont un prix HT au kilo, au litre ou à la pièce ; la recette en coche les quantités (en grammes, centilitres ou pièces). <strong>Coût de fabrication</strong> = Σ prix × quantité — ex. 100 g de tomates à 2,50 €/kg = 0,25 €. Il devient le coût matière du produit et se recalcule dès qu'un prix d'ingrédient change. Un produit avec recette ne se livre pas : ce sont ses ingrédients qui s'achètent.</li>
          <li>Un produit ne se supprime pas : il se désactive. Chaque création, modification et nouveau tarif est inscrit au journal technique avec son auteur et l'heure.</li>
        </ul>
      </Regles>
    </>
  );
}

// ---------------------------------------------------------------------------

function ChampMontant({ libelle, valeur, onChange, requis, aide }: { libelle: string; valeur: string; onChange: (v: string) => void; requis?: boolean; aide?: string }) {
  const invalide = valeur.trim() !== "" && lireMontant(valeur) === null;
  return (
    <label className="champ">
      <span>
        {libelle}
        {requis ? " *" : ""}
      </span>
      <input type="text" inputMode="decimal" value={valeur} onChange={(e) => onChange(e.target.value)} aria-invalid={invalide} placeholder="0,00" required={requis} />
      {invalide ? <small className="aide" style={{ color: "var(--red)" }}>Montant en euros, deux décimales au plus (ex. 7,50).</small> : aide && <small className="aide">{aide}</small>}
    </label>
  );
}

function ChoixTva({ valeur, onChange }: { valeur: TauxTvaPb | ""; onChange: (v: TauxTvaPb | "") => void }) {
  return (
    <label className="champ">
      <span>Taux de TVA *</span>
      <select value={valeur} onChange={(e) => onChange(e.target.value ? (Number(e.target.value) as TauxTvaPb) : "")} required>
        <option value="">Choisir…</option>
        {TAUX_TVA.map((t) => (
          <option key={t.pb} value={t.pb}>
            {t.libelle}
          </option>
        ))}
      </select>
    </label>
  );
}

function CasesStands({ stands, coches, onChange }: { stands: Stand[]; coches: string[]; onChange: (ids: string[]) => void }) {
  const visibles = stands.filter((s) => s.actif || coches.includes(s.id));
  if (visibles.length === 0) return <span className="discret">Aucun stand actif : crée d'abord tes stands.</span>;
  return (
    <div className="en-ligne" style={{ gap: 14 }}>
      {visibles.map((s) => (
        <label key={s.id} className="case">
          <input
            type="checkbox"
            checked={coches.includes(s.id)}
            disabled={!s.actif}
            onChange={(e) => onChange(e.target.checked ? [...coches, s.id] : coches.filter((id) => id !== s.id))}
          />
          {s.nom}
          {!s.actif && " (désactivé)"}
        </label>
      ))}
    </div>
  );
}

function SelectCategorie({ categories, valeur, onChange }: { categories: Categorie[]; valeur: string; onChange: (v: string) => void }) {
  return (
    <label className="champ">
      <span>Catégorie</span>
      <select value={valeur} onChange={(e) => onChange(e.target.value)}>
        <option value="">Sans catégorie</option>
        {categories
          .filter((c) => c.actif || c.id === valeur)
          .map((c) => (
            <option key={c.id} value={c.id}>
              {c.nom}
            </option>
          ))}
      </select>
    </label>
  );
}

function FormulaireCreation({ stands, categories, fermer, creee }: { stands: Stand[]; categories: Categorie[]; fermer: () => void; creee: (l: Produit[]) => void }) {
  const [nom, setNom] = useState("");
  const [categorieId, setCategorieId] = useState("");
  const [prix, setPrix] = useState("");
  const [tva, setTva] = useState<TauxTvaPb | "">("");
  const [cout, setCout] = useState("");
  const [standIds, setStandIds] = useState<string[]>([]);
  const creer = useMutation({ mutationFn: (corps: unknown) => api.post<Produit[]>("/produits", corps), onSuccess: creee });

  const prixCentimes = lireMontant(prix);
  const coutCentimes = cout.trim() ? lireMontant(cout) : null;
  const valide = nom.trim() && prixCentimes !== null && tva !== "" && (cout.trim() === "" || coutCentimes !== null);

  function soumettre(e: FormEvent) {
    e.preventDefault();
    if (!valide) return;
    creer.mutate({ nom, categorieId: categorieId || null, prixTtc: prixCentimes, tauxTva: tva, coutMatiere: coutCentimes, standIds });
  }

  return (
    <Carte titre="Nouveau produit" description="Les champs marqués * sont obligatoires.">
      <form onSubmit={soumettre}>
        <div className="grille-champs">
          <label className="champ">
            <span>Nom du produit *</span>
            <input type="text" value={nom} onChange={(e) => setNom(e.target.value)} maxLength={80} required autoFocus />
          </label>
          <SelectCategorie categories={categories} valeur={categorieId} onChange={setCategorieId} />
          <ChampMontant libelle="Prix de vente TTC" valeur={prix} onChange={setPrix} requis />
          <ChoixTva valeur={tva} onChange={setTva} />
          <ChampMontant libelle="Coût matière HT par portion" valeur={cout} onChange={setCout} aide="Facultatif — sert au calcul de la marge." />
        </div>
        <div style={{ marginTop: 14 }}>
          <div className="aide" style={{ fontWeight: 600, marginBottom: 6 }}>Vendu dans</div>
          <CasesStands stands={stands} coches={standIds} onChange={setStandIds} />
        </div>
        {prixCentimes !== null && tva !== "" && coutCentimes !== null && (
          <div className="message message-info">
            Marge comptoir : <strong>{formaterMontant(margeUnitaireComptoir(prixCentimes, tva, coutCentimes).marge)}</strong> par vente.
          </div>
        )}
        <MessageErreur erreur={creer.error} />
        <div className="ligne-actions">
          <button className="btn" disabled={!valide || creer.isPending}>
            {creer.isPending ? "Création…" : "Créer le produit"}
          </button>
          <button type="button" className="btn btn-fantome" onClick={fermer}>
            Annuler
          </button>
        </div>
      </form>
    </Carte>
  );
}

function DetailProduit({ produit, stands, categories, majProduits }: { produit: Produit; stands: Stand[]; categories: Categorie[]; majProduits: (l: Produit[]) => void }) {
  const client = useQueryClient();
  const [nom, setNom] = useState(produit.nom);
  const [categorieId, setCategorieId] = useState(produit.categorieId ?? "");
  const [cout, setCout] = useState(produit.coutMatiere !== null ? montantPourSaisie(produit.coutMatiere) : "");
  const [standIds, setStandIds] = useState(produit.standIds);
  const [prix, setPrix] = useState("");
  const [tva, setTva] = useState<TauxTvaPb | "">(produit.tarifEnVigueur?.tauxTva ?? "");
  const [programme, setProgramme] = useState(false);
  const [dateEffet, setDateEffet] = useState("");

  const historique = useQuery({ queryKey: ["tarifs", produit.id], queryFn: () => api.get<Tarif[]>(`/produits/${produit.id}/tarifs`) });
  const onSuccess = (l: Produit[]) => {
    majProduits(l);
    client.invalidateQueries({ queryKey: ["tarifs", produit.id] });
  };
  const fiche = useMutation({ mutationFn: (corps: unknown) => api.patch<Produit[]>(`/produits/${produit.id}`, corps), onSuccess });
  const disponibilite = useMutation({ mutationFn: (ids: string[]) => api.put<Produit[]>(`/produits/${produit.id}/stands`, { standIds: ids }), onSuccess });
  const tarif = useMutation({
    mutationFn: (corps: unknown) => api.post<Produit[]>(`/produits/${produit.id}/tarifs`, corps),
    onSuccess: (l) => {
      onSuccess(l);
      setPrix("");
      setProgramme(false);
      setDateEffet("");
    },
  });

  const coutCentimes = cout.trim() ? lireMontant(cout) : null;
  const ficheModifiee = nom.trim() !== produit.nom || (categorieId || null) !== produit.categorieId || (!produit.aRecette && coutCentimes !== produit.coutMatiere);
  const standsModifies = [...standIds].sort().join() !== [...produit.standIds].sort().join();
  const prixCentimes = lireMontant(prix);
  const tarifValide = prixCentimes !== null && tva !== "" && (!programme || dateEffet !== "");

  return (
    <div className="detail" onClick={(e) => e.stopPropagation()}>
      <div className="grille-champs">
        <label className="champ">
          <span>Nom du produit</span>
          <input type="text" value={nom} onChange={(e) => setNom(e.target.value)} maxLength={80} />
        </label>
        <SelectCategorie categories={categories} valeur={categorieId} onChange={setCategorieId} />
        {produit.aRecette ? (
          <div className="champ">
            <span>Coût matière HT par portion</span>
            <strong className="chiffre" style={{ padding: "8px 0" }}>{produit.coutMatiere !== null ? formaterMontant(produit.coutMatiere) : "—"}</strong>
            <small className="discret">Calculé par la recette ci-dessous.</small>
          </div>
        ) : (
          <ChampMontant libelle="Coût matière HT par portion" valeur={cout} onChange={setCout} aide="Facultatif — ou calculé par une recette." />
        )}
      </div>
      <MessageErreur erreur={fiche.error} />
      <div className="ligne-actions">
        <button
          className="btn"
          disabled={!ficheModifiee || fiche.isPending || (cout.trim() !== "" && coutCentimes === null)}
          onClick={() => fiche.mutate({ nom, categorieId: categorieId || null, ...(produit.aRecette ? {} : { coutMatiere: coutCentimes }) })}
        >
          Enregistrer la fiche
        </button>
        {produit.actif ? (
          <button className="btn btn-danger" disabled={fiche.isPending} onClick={() => fiche.mutate({ actif: false })}>
            Désactiver le produit
          </button>
        ) : (
          <button className="btn btn-fantome" disabled={fiche.isPending} onClick={() => fiche.mutate({ actif: true })}>
            Réactiver le produit
          </button>
        )}
      </div>

      <h3 style={{ marginTop: 22, marginBottom: 8 }}>Recette</h3>
      <p className="discret" style={{ margin: "0 0 8px" }}>Pour un produit fabriqué (burger, hot-dog…) : coche ses ingrédients et leur quantité ; le coût de fabrication devient son coût matière.</p>
      <RecetteProduit produit={produit} />

      <h3 style={{ marginTop: 22, marginBottom: 8 }}>Vendu dans</h3>
      <CasesStands stands={stands} coches={standIds} onChange={setStandIds} />
      <MessageErreur erreur={disponibilite.error} />
      <div className="ligne-actions">
        <button className="btn" disabled={!standsModifies || disponibilite.isPending} onClick={() => disponibilite.mutate(standIds)}>
          Enregistrer les stands
        </button>
      </div>

      <h3 style={{ marginTop: 22, marginBottom: 8 }}>Prix</h3>
      {produit.tarifEnVigueur && (
        <p style={{ margin: "0 0 6px" }}>
          En vigueur : <strong className="chiffre">{formaterMontant(produit.tarifEnVigueur.prixTtc)}</strong> TTC, TVA {libelleTauxTva(produit.tarifEnVigueur.tauxTva)} — depuis le{" "}
          {formaterDateHeure(produit.tarifEnVigueur.valideDu)}, saisi par {produit.tarifEnVigueur.saisiPar}.
        </p>
      )}
      {produit.tarifAVenir && (
        <div className="message message-alerte">
          Nouveau prix programmé : <strong>{formaterMontant(produit.tarifAVenir.prixTtc)}</strong> TTC (TVA {libelleTauxTva(produit.tarifAVenir.tauxTva)}) à partir du{" "}
          {formaterDateHeure(produit.tarifAVenir.valideDu)}.
        </div>
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!tarifValide) return;
          tarif.mutate({ prixTtc: prixCentimes, tauxTva: tva, valideDu: programme ? new Date(dateEffet).toISOString() : undefined });
        }}
      >
        <div className="grille-champs">
          <ChampMontant libelle="Nouveau prix TTC" valeur={prix} onChange={setPrix} />
          <ChoixTva valeur={tva} onChange={setTva} />
          <div className="champ">
            <span>Prend effet</span>
            <label className="case">
              <input type="radio" checked={!programme} onChange={() => setProgramme(false)} /> Tout de suite
            </label>
            <label className="case">
              <input type="radio" checked={programme} onChange={() => setProgramme(true)} /> À partir du…
            </label>
            {programme && <input type="datetime-local" value={dateEffet} onChange={(e) => setDateEffet(e.target.value)} required />}
          </div>
        </div>
        <MessageErreur erreur={tarif.error} />
        <div className="ligne-actions">
          <button className="btn" disabled={!tarifValide || tarif.isPending}>
            Enregistrer le nouveau tarif
          </button>
        </div>
      </form>

      <h3 style={{ marginTop: 22, marginBottom: 8 }}>Historique des tarifs</h3>
      {historique.isPending ? (
        <Chargement />
      ) : historique.error ? (
        <MessageErreur erreur={historique.error} />
      ) : (
        <div className="liste">
          <div className="liste-entete" style={{ gridTemplateColumns: "100px 70px 1fr 1fr" }}>
            <span>Prix TTC</span>
            <span>TVA</span>
            <span>Prend effet le</span>
            <span>Saisi par</span>
          </div>
          {historique.data!.map((t) => (
            <div key={t.id} className="liste-ligne" style={{ gridTemplateColumns: "100px 70px 1fr 1fr" }}>
              <strong className="chiffre">{formaterMontant(t.prixTtc)}</strong>
              <span>
                <span className="cellule-libelle">TVA</span>
                {libelleTauxTva(t.tauxTva)}
              </span>
              <span>
                <span className="cellule-libelle">Prend effet le</span>
                {formaterDateHeure(t.valideDu)}
              </span>
              <span>
                <span className="cellule-libelle">Saisi par</span>
                {t.saisiPar} <span className="discret">· {formaterDateHeure(t.saisiLe)}</span>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function GestionCategories({ categories }: { categories: Categorie[] }) {
  const client = useQueryClient();
  const [nom, setNom] = useState("");
  const [edition, setEdition] = useState<{ id: string; nom: string } | null>(null);
  const maj = (l: Categorie[]) => client.setQueryData(["categories"], l);
  const creer = useMutation({ mutationFn: (n: string) => api.post<Categorie[]>("/categories", { nom: n }), onSuccess: (l) => { maj(l); setNom(""); } });
  const modifier = useMutation({
    mutationFn: ({ id, ...corps }: { id: string; nom?: string; actif?: boolean }) => api.patch<Categorie[]>(`/categories/${id}`, corps),
    onSuccess: (l) => {
      maj(l);
      setEdition(null);
    },
  });

  return (
    <Carte titre="Catégories" description="Pour regrouper les produits (à l'écran de caisse, et plus tard pour les cibles de marge). Une catégorie se désactive, elle ne se supprime pas.">
      <form
        className="en-ligne"
        onSubmit={(e) => {
          e.preventDefault();
          creer.mutate(nom);
        }}
      >
        <input type="text" value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Ex. Boissons, Snacking, Bières…" maxLength={60} style={{ flex: "1 1 240px", width: "auto" }} />
        <button className="btn" disabled={!nom.trim() || creer.isPending}>
          <Plus size={15} /> Ajouter
        </button>
      </form>
      <MessageErreur erreur={creer.error ?? modifier.error} />
      <div className="en-ligne" style={{ marginTop: 12 }}>
        {categories.length === 0 && <span className="discret">Aucune catégorie.</span>}
        {categories.map((c) =>
          edition?.id === c.id ? (
            <form
              key={c.id}
              className="en-ligne"
              onSubmit={(e) => {
                e.preventDefault();
                modifier.mutate({ id: c.id, nom: edition.nom });
              }}
            >
              <input type="text" value={edition.nom} onChange={(e) => setEdition({ id: c.id, nom: e.target.value })} maxLength={60} autoFocus style={{ width: 180 }} />
              <button className="btn">OK</button>
              <button type="button" className="btn btn-fantome" onClick={() => setEdition(null)}>
                Annuler
              </button>
            </form>
          ) : (
            <span key={c.id} className={`puce ${c.actif ? "puce-violet" : ""}`} style={{ fontSize: 12, padding: "4px 10px" }}>
              {c.nom}
              {!c.actif && " (désactivée)"}
              <button type="button" className="btn-lien" style={{ fontSize: 11 }} onClick={() => setEdition({ id: c.id, nom: c.nom })}>
                renommer
              </button>
              <button type="button" className="btn-lien" style={{ fontSize: 11 }} onClick={() => modifier.mutate({ id: c.id, actif: !c.actif })}>
                {c.actif ? "désactiver" : "réactiver"}
              </button>
            </span>
          ),
        )}
      </div>
    </Carte>
  );
}
