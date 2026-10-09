import { useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileUp, Plus } from "lucide-react";
import {
  CHAMPS_EXPORT,
  SYSTEMES_CAISSE,
  formaterMontant,
  jourParis,
  type CaisseExterne,
  type ChampExport,
  type ColonnesExport,
  type LigneSynthese,
  type PointDeVenteExterne,
  type Produit,
  type ProduitExterne,
  type Stand,
  type SyntheseVentesExternes,
  type SystemeCaisse,
  type VenteExterneLue,
} from "@flaix/domain";
import { api, formaterDateHeure } from "../../api.ts";
import { Carte, Chargement, EntetePage, EtatVide, MessageErreur, Regles } from "../../composants/communs.tsx";
import { FICHIERS_ACCEPTES, lireFichierVentes } from "./fichiers.ts";

/*
 * Caisses connectées (dossier §15.150) : ventes d'une autre caisse (Digifood, Weezevent, L'Addition…) importées depuis son
 * fichier d'export, rapprochées des produits et des stands de FlaiX Expert, et leurs résultats. Elles restent à part des
 * tickets de la caisse FlaiX Expert : jamais dans les Z, les clôtures ni l'export comptable.
 */

type Onglet = "importer" | "correspondances" | "resultats";

interface Apercu {
  entetes: string[];
  colonnes: ColonnesExport;
  manquants: ChampExport[];
  lignesLues: number;
  ventes: number;
  montant: number;
  premieres: VenteExterneLue[];
  erreurs: { ligne: number; message: string }[];
}


const libelleChamp = (c: ChampExport) => CHAMPS_EXPORT.find((x) => x.champ === c)!.libelle;

export function CaissesConnectees() {
  const caisses = useQuery({ queryKey: ["caisses-externes"], queryFn: () => api.get<CaisseExterne[]>("/caisses-externes") });
  const [choisie, setChoisie] = useState<string | null>(null);
  const [onglet, setOnglet] = useState<Onglet>("importer");
  if (caisses.isPending) return <Chargement />;
  if (caisses.error) return <MessageErreur erreur={caisses.error} />;
  const liste = caisses.data!;
  const caisse = liste.find((k) => k.id === choisie) ?? liste[0] ?? null;
  const bouton = (id: Onglet, libelle: string) => (
    <button className={`onglet${onglet === id ? " actif" : ""}`} onClick={() => setOnglet(id)}>
      {libelle}
    </button>
  );
  return (
    <>
      <EntetePage titre="Caisses connectées" description="Les ventes d'une autre caisse, importées depuis son fichier d'export, pour suivre vos résultats dans FlaiX Expert." />
      {liste.length > 0 && (
        <div className="en-ligne" style={{ gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
          {liste.map((k) => (
            <button key={k.id} className={`btn ${caisse?.id === k.id ? "" : "btn-fantome"}`} onClick={() => setChoisie(k.id)}>
              {k.nom}
            </button>
          ))}
        </div>
      )}
      <NouvelleCaisse vide={liste.length === 0} />
      {caisse && (
        <>
          <div className="onglets">
            {bouton("importer", "Importer")}
            {bouton("correspondances", "Correspondances")}
            {bouton("resultats", "Résultats")}
          </div>
          {onglet === "importer" ? <Importer caisse={caisse} /> : onglet === "correspondances" ? <Correspondances caisse={caisse} /> : <Resultats />}
        </>
      )}
      <Regles>
        <ul>
          <li>
            <strong>À part de la caisse FlaiX Expert</strong> : les ventes importées n'entrent jamais dans les Z, les clôtures, l'export comptable ni le journal de caisse. La caisse
            d'origine reste le logiciel de caisse du lieu, avec ses propres obligations.
          </li>
          <li>
            <strong>Fichier</strong> : l'export des ventes de la caisse, une ligne par article vendu, en Excel (.xlsx, .xls), OpenDocument (.ods) ou CSV. Les colonnes sont reconnues d'après
            leurs en-têtes ; corrige-les si besoin, elles sont retenues pour l'import suivant. Les dates sans fuseau sont des heures de Paris.
          </li>
          <li>
            <strong>Sans doublon</strong> : une vente déjà importée (même n° de vente) n'est jamais comptée deux fois ; si elle est devenue annulée dans la caisse, l'annulation est
            reportée. Une vente est rattachée à l'événement du même jour.
          </li>
          <li>
            <strong>Marge</strong> : estimée pour les produits rapprochés d'un produit FlaiX Expert qui a un coût matière. Un produit « ignoré » (consigne, frais…) sort des résultats.
          </li>
          <li>
            <strong>Dans tout FlaiX Expert</strong> : les ventes importées comptent dans Résultats (chiffre d'affaires, marges, cibles, bilan sur une période), le rapport de
            soirée, la gestion financière, le stock (consommation du stand), la prévision, les coûts par buvette et les prix fournisseurs. Un produit non rapproché compte dans le
            chiffre d'affaires mais sans marge (son coût est inconnu) ; une vente sans stand rapproché ne compte pas dans le stock d'un stand. Dépose le fichier avant de clôturer
            l'événement pour qu'il figure dans le rapport de soirée figé.
          </li>
          <li>
            <strong>Bientôt</strong> : relève automatique par l'API de la caisse (partenariat à obtenir auprès de Digifood, Weezevent ou L'Addition).
          </li>
        </ul>
      </Regles>
    </>
  );
}

function NouvelleCaisse({ vide }: { vide: boolean }) {
  const client = useQueryClient();
  const [ouvert, setOuvert] = useState(vide);
  const [nom, setNom] = useState("");
  const [systeme, setSysteme] = useState<SystemeCaisse>("digifood");
  const creer = useMutation({
    mutationFn: () => api.post<CaisseExterne[]>("/caisses-externes", { nom, systeme }),
    onSuccess: (r) => {
      client.setQueryData(["caisses-externes"], r);
      setNom("");
      setOuvert(false);
    },
  });
  if (!ouvert && !vide)
    return (
      <div style={{ marginBottom: 12 }}>
        <button className="btn btn-fantome" onClick={() => setOuvert(true)}>
          <Plus size={14} /> Ajouter une caisse
        </button>
      </div>
    );
  return (
    <Carte titre={vide ? "Brancher une première caisse" : "Ajouter une caisse"} description="Une caisse par logiciel ou par lieu de vente dont vous importez les ventes.">
      <form
        className="grille-champs"
        onSubmit={(ev) => {
          ev.preventDefault();
          creer.mutate();
        }}
      >
        <label className="champ">
          <span>Nom</span>
          <input type="text" value={nom} maxLength={80} placeholder="Ex. : Digifood stade" onChange={(ev) => setNom(ev.target.value)} required />
        </label>
        <label className="champ">
          <span>Logiciel de caisse</span>
          <select value={systeme} onChange={(ev) => setSysteme(ev.target.value as SystemeCaisse)}>
            {SYSTEMES_CAISSE.map((s) => (
              <option key={s.cle} value={s.cle}>
                {s.libelle}
              </option>
            ))}
          </select>
        </label>
        <div style={{ alignSelf: "end" }}>
          <button className="btn" type="submit" disabled={!nom.trim() || creer.isPending}>
            Ajouter
          </button>
        </div>
      </form>
      <MessageErreur erreur={creer.error} />
    </Carte>
  );
}

function Importer({ caisse }: { caisse: CaisseExterne }) {
  const client = useQueryClient();
  const entree = useRef<HTMLInputElement>(null);
  const [fichier, setFichier] = useState<{ nom: string; contenu: string; brut: File; feuilles: string[]; feuille: string | null } | null>(null);
  const [lecture, setLecture] = useState<{ enCours: boolean; erreur: Error | null }>({ enCours: false, erreur: null });
  const [colonnes, setColonnes] = useState<ColonnesExport | null>(null);
  const [resultat, setResultat] = useState<string | null>(null);
  const apercu = useMutation({
    mutationFn: (p: { nom: string; contenu: string; colonnes?: ColonnesExport }) =>
      api.post<Apercu>(`/caisses-externes/${caisse.id}/import`, { fichier: p.nom, contenu: p.contenu, colonnes: p.colonnes, apercu: true }),
    onSuccess: (r) => setColonnes(r.colonnes),
  });
  const importer = useMutation({
    mutationFn: () =>
      api.post<{ ajoutees: number; deja: number; annulationsReportees: number; relies: { produits: number; pointsDeVente: number }; caisses: CaisseExterne[] }>(
        `/caisses-externes/${caisse.id}/import`,
        { fichier: fichier!.nom, contenu: fichier!.contenu, colonnes },
      ),
    onSuccess: (r) => {
      client.setQueryData(["caisses-externes"], r.caisses);
      void client.invalidateQueries({ queryKey: ["caisses-externes-synthese"] });
      void client.invalidateQueries({ queryKey: ["caisses-externes-produits", caisse.id] });
      void client.invalidateQueries({ queryKey: ["caisses-externes-pdv", caisse.id] });
      setResultat(
        `${r.ajoutees} vente${r.ajoutees > 1 ? "s" : ""} ajoutée${r.ajoutees > 1 ? "s" : ""}` +
          (r.deja ? `, ${r.deja} déjà importée${r.deja > 1 ? "s" : ""}` : "") +
          (r.annulationsReportees ? `, ${r.annulationsReportees} annulation${r.annulationsReportees > 1 ? "s" : ""} reportée${r.annulationsReportees > 1 ? "s" : ""}` : "") +
          "." +
          (r.relies.produits || r.relies.pointsDeVente
            ? ` Reliés automatiquement (même nom) : ${[
                r.relies.produits ? `${r.relies.produits} produit${r.relies.produits > 1 ? "s" : ""}` : "",
                r.relies.pointsDeVente ? `${r.relies.pointsDeVente} point${r.relies.pointsDeVente > 1 ? "s" : ""} de vente` : "",
              ]
                .filter(Boolean)
                .join(", ")} ; à vérifier dans Correspondances.`
            : ""),
      );
      setFichier(null);
      apercu.reset();
    },
  });
  const a = apercu.data;
  // Lecture dans le navigateur (classeur remis en CSV), puis aperçu par le serveur ; une autre feuille relit le classeur.
  const ouvrir = (f: File, feuille?: string) => {
    setLecture({ enCours: true, erreur: null });
    lireFichierVentes(f, feuille)
      .then((lu) => {
        setLecture({ enCours: false, erreur: null });
        setFichier({ nom: f.name, contenu: lu.contenu, brut: f, feuilles: lu.feuilles, feuille: lu.feuille });
        setColonnes(null);
        apercu.mutate({ nom: f.name, contenu: lu.contenu });
      })
      .catch((erreur: unknown) => setLecture({ enCours: false, erreur: erreur instanceof Error ? erreur : new Error(String(erreur)) }));
  };
  const changerColonne = (champ: ChampExport, valeur: string) => {
    const suivantes: ColonnesExport = { ...colonnes };
    if (valeur === "") delete suivantes[champ];
    else suivantes[champ] = Number(valeur);
    setColonnes(suivantes);
    if (fichier) apercu.mutate({ ...fichier, colonnes: suivantes });
  };

  return (
    <Carte titre="Importer un export de ventes" description="Exporte les ventes depuis le back-office de la caisse (une ligne par article vendu), puis choisis le fichier.">
      {caisse.dernierImport && (
        <p className="discret" style={{ marginTop: 0 }}>
          Dernier import : {caisse.dernierImport.fichier}, le {formaterDateHeure(caisse.dernierImport.le)} par {caisse.dernierImport.par} — {caisse.dernierImport.ventesAjoutees} ventes ajoutées.{" "}
          {caisse.ventes} ventes en tout{caisse.premiereVente ? ` du ${formaterDateHeure(caisse.premiereVente)} au ${formaterDateHeure(caisse.derniereVente!)}` : ""}.
        </p>
      )}
      <input
        ref={entree}
        type="file"
        accept={FICHIERS_ACCEPTES}
        hidden
        aria-label="Choisir le fichier d'export"
        onChange={(ev) => {
          const f = ev.target.files?.[0];
          ev.target.value = "";
          setResultat(null);
          if (f) ouvrir(f);
        }}
      />
      <div className="en-ligne" style={{ gap: 8, flexWrap: "wrap" }}>
        <button className="btn btn-fantome" onClick={() => entree.current?.click()} disabled={lecture.enCours || apercu.isPending || importer.isPending}>
          <FileUp size={14} /> {lecture.enCours ? "Lecture du fichier…" : fichier ? `Changer de fichier (${fichier.nom})` : "Choisir le fichier (Excel ou CSV)"}
        </button>
        {fichier && fichier.feuilles.length > 1 && (
          <label className="champ" style={{ margin: 0 }}>
            <span>Feuille du classeur</span>
            <select value={fichier.feuille ?? ""} aria-label="Feuille du classeur" disabled={lecture.enCours} onChange={(ev) => ouvrir(fichier.brut, ev.target.value)}>
              {fichier.feuilles.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
      <p className="discret" style={{ fontSize: 12, marginBottom: 0 }}>
        Formats acceptés : Excel (.xlsx, .xls), OpenDocument (.ods), CSV. Un titre au-dessus du tableau et une ligne de total sont reconnus.
      </p>
      <MessageErreur erreur={lecture.erreur} />
      {resultat && (
        <p role="status" style={{ fontWeight: 600 }}>
          {resultat}
        </p>
      )}
      <MessageErreur erreur={apercu.error ?? importer.error} />

      {a && fichier && (
        <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
          <div className="grille-champs">
            {CHAMPS_EXPORT.map((c) => (
              <label key={c.champ} className="champ" title={c.aide}>
                <span>
                  {c.libelle}
                  {a.manquants.includes(c.champ) || (c.champ === "produit" && a.manquants.includes("produit")) ? " ⚠" : ""}
                </span>
                <select value={colonnes?.[c.champ] ?? ""} aria-label={`Colonne : ${c.libelle}`} onChange={(ev) => changerColonne(c.champ, ev.target.value)}>
                  <option value="">—</option>
                  {a.entetes.map((e, i) => (
                    <option key={i} value={i}>
                      {e || `Colonne ${i + 1}`}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
          {a.manquants.length > 0 ? (
            <div className="message message-erreur" role="alert">
              À choisir : {a.manquants.map(libelleChamp).join(", ")}.
            </div>
          ) : (
            <>
              <p style={{ margin: 0 }}>
                <strong>{a.ventes}</strong> vente{a.ventes > 1 ? "s" : ""} lue{a.ventes > 1 ? "s" : ""} ({a.lignesLues} lignes), {formaterMontant(a.montant)} hors annulations.
                {a.erreurs.length > 0 && ` ${a.erreurs.length} ligne${a.erreurs.length > 1 ? "s" : ""} écartée${a.erreurs.length > 1 ? "s" : ""}.`}
              </p>
              {a.premieres.length > 0 && (
                <div style={{ overflowX: "auto" }}>
                  <table className="tableau">
                    <thead>
                      <tr>
                        <th>N° de vente</th>
                        <th>Date</th>
                        <th>Point de vente</th>
                        <th>Articles</th>
                        <th className="chiffre">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {a.premieres.map((v) => (
                        <tr key={v.idExterne} style={v.annulee ? { textDecoration: "line-through", opacity: 0.6 } : undefined}>
                          <td>{v.idExterne}</td>
                          <td>{formaterDateHeure(v.horodatage)}</td>
                          <td>{v.pointDeVente ?? "—"}</td>
                          <td>{v.lignes.map((l) => `${l.quantite} × ${l.libelle}`).join(", ")}</td>
                          <td className="chiffre">{formaterMontant(v.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <div>
                <button className="btn" disabled={importer.isPending || a.ventes === 0} onClick={() => importer.mutate()}>
                  Importer {a.ventes} vente{a.ventes > 1 ? "s" : ""}
                </button>
              </div>
            </>
          )}
          {a.erreurs.length > 0 && (
            <details>
              <summary className="discret">Lignes écartées ({a.erreurs.length})</summary>
              <ul className="discret" style={{ fontSize: 12.5 }}>
                {a.erreurs.map((e, i) => (
                  <li key={i}>
                    Ligne {e.ligne} : {e.message}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}
    </Carte>
  );
}

function Correspondances({ caisse }: { caisse: CaisseExterne }) {
  const client = useQueryClient();
  const produits = useQuery({ queryKey: ["caisses-externes-produits", caisse.id], queryFn: () => api.get<ProduitExterne[]>(`/caisses-externes/${caisse.id}/produits`) });
  const pdv = useQuery({ queryKey: ["caisses-externes-pdv", caisse.id], queryFn: () => api.get<PointDeVenteExterne[]>(`/caisses-externes/${caisse.id}/points-de-vente`) });
  const catalogue = useQuery({ queryKey: ["produits"], queryFn: () => api.get<Produit[]>("/produits") });
  const stands = useQuery({ queryKey: ["stands"], queryFn: () => api.get<Stand[]>("/stands") });
  const lierProduit = useMutation({
    mutationFn: (p: { cle: string; produitId: string | null; ignore: boolean }) => api.put<ProduitExterne[]>(`/caisses-externes/${caisse.id}/produits`, p),
    onSuccess: (r) => {
      client.setQueryData(["caisses-externes-produits", caisse.id], r);
      void client.invalidateQueries({ queryKey: ["caisses-externes-synthese"] });
    },
  });
  const lierPdv = useMutation({
    mutationFn: (p: { nom: string; standId: string | null }) => api.put<PointDeVenteExterne[]>(`/caisses-externes/${caisse.id}/points-de-vente`, p),
    onSuccess: (r) => {
      client.setQueryData(["caisses-externes-pdv", caisse.id], r);
      void client.invalidateQueries({ queryKey: ["caisses-externes-synthese"] });
    },
  });
  const accepterProduits = useMutation({
    mutationFn: () => api.post<ProduitExterne[]>(`/caisses-externes/${caisse.id}/produits/suggestions`, {}),
    onSuccess: (r) => {
      client.setQueryData(["caisses-externes-produits", caisse.id], r);
      void client.invalidateQueries({ queryKey: ["caisses-externes-synthese"] });
    },
  });
  const accepterPdv = useMutation({
    mutationFn: () => api.post<PointDeVenteExterne[]>(`/caisses-externes/${caisse.id}/points-de-vente/suggestions`, {}),
    onSuccess: (r) => {
      client.setQueryData(["caisses-externes-pdv", caisse.id], r);
      void client.invalidateQueries({ queryKey: ["caisses-externes-synthese"] });
    },
  });
  if (produits.isPending || pdv.isPending || catalogue.isPending || stands.isPending) return <Chargement />;
  const erreur = produits.error ?? pdv.error ?? catalogue.error ?? stands.error;
  if (erreur) return <MessageErreur erreur={erreur} />;
  const aRapprocher = produits.data!.filter((p) => !p.produitId && !p.ignore).length;
  const suggestionsProduits = produits.data!.filter((p) => p.suggestion).length;
  const suggestionsPdv = pdv.data!.filter((p) => p.suggestion).length;
  const occupe = lierProduit.isPending || accepterProduits.isPending;
  return (
    <>
      <Carte
        titre="Produits"
        description={
          (aRapprocher ? `${aRapprocher} produit${aRapprocher > 1 ? "s" : ""} à rapprocher : la marge n'est calculée que pour les produits rapprochés.` : "Tous les produits sont rapprochés ou ignorés.") +
          " « auto » : relié d'après le même nom, à vérifier."
        }
        actions={
          suggestionsProduits > 0 ? (
            <button className="btn btn-fantome" disabled={occupe} onClick={() => accepterProduits.mutate()}>
              Accepter {suggestionsProduits > 1 ? `les ${suggestionsProduits} suggestions` : "la suggestion"}
            </button>
          ) : null
        }
      >
        {produits.data!.length === 0 ? (
          <EtatVide titre="Aucune vente importée pour l'instant" />
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="tableau">
              <thead>
                <tr>
                  <th>Produit de la caisse</th>
                  <th className="chiffre">Quantité</th>
                  <th className="chiffre">Ventes</th>
                  <th>Produit FlaiX Expert</th>
                </tr>
              </thead>
              <tbody>
                {produits.data!.map((p) => (
                  <tr key={p.cle}>
                    <td>
                      {p.libelle}
                      {p.code && p.code !== p.libelle ? <span className="discret"> · {p.code}</span> : null}
                    </td>
                    <td className="chiffre">{p.quantite.toLocaleString("fr-FR")}</td>
                    <td className="chiffre">{formaterMontant(p.montant)}</td>
                    <td>
                      <div className="en-ligne">
                        <select
                          aria-label={`Correspondance : ${p.libelle}`}
                          value={p.ignore ? "ignore" : (p.produitId ?? "")}
                          disabled={occupe}
                          onChange={(ev) => {
                            const v = ev.target.value;
                            lierProduit.mutate({ cle: p.cle, produitId: v && v !== "ignore" ? v : null, ignore: v === "ignore" });
                          }}
                        >
                          <option value="">— à rapprocher —</option>
                          <option value="ignore">Ignorer (consigne, frais…)</option>
                          {catalogue.data!.map((x) => (
                            <option key={x.id} value={x.id}>
                              {x.nom}
                            </option>
                          ))}
                        </select>
                        {p.automatique ? (
                          <span className="etiquette-auto" title="Relié automatiquement : même nom dans la caisse et dans FlaiX Expert. À changer si besoin.">
                            auto
                          </span>
                        ) : null}
                      </div>
                      {p.suggestion ? (
                        <Suggestion nom={p.suggestion.nom} memeNom={p.suggestion.memeNom} disabled={occupe} accepter={() => lierProduit.mutate({ cle: p.cle, produitId: p.suggestion!.id, ignore: false })} />
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <MessageErreur erreur={lierProduit.error ?? accepterProduits.error} />
      </Carte>
      <Carte
        titre="Points de vente"
        description="Chaque bar ou terminal de la caisse correspond à un stand de FlaiX Expert."
        actions={
          suggestionsPdv > 0 ? (
            <button className="btn btn-fantome" disabled={lierPdv.isPending || accepterPdv.isPending} onClick={() => accepterPdv.mutate()}>
              Accepter {suggestionsPdv > 1 ? `les ${suggestionsPdv} suggestions` : "la suggestion"}
            </button>
          ) : null
        }
      >
        {pdv.data!.length === 0 ? (
          <EtatVide titre="Aucun point de vente dans les ventes importées" />
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="tableau">
              <thead>
                <tr>
                  <th>Point de vente de la caisse</th>
                  <th className="chiffre">Ventes</th>
                  <th className="chiffre">Montant</th>
                  <th>Stand</th>
                </tr>
              </thead>
              <tbody>
                {pdv.data!.map((p) => (
                  <tr key={p.nom}>
                    <td>{p.nom}</td>
                    <td className="chiffre">{p.ventes}</td>
                    <td className="chiffre">{formaterMontant(p.montant)}</td>
                    <td>
                      <div className="en-ligne">
                        <select
                          aria-label={`Stand : ${p.nom}`}
                          value={p.standId ?? ""}
                          disabled={lierPdv.isPending || accepterPdv.isPending}
                          onChange={(ev) => lierPdv.mutate({ nom: p.nom, standId: ev.target.value || null })}
                        >
                          <option value="">—</option>
                          {stands.data!.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.nom}
                            </option>
                          ))}
                        </select>
                        {p.automatique ? (
                          <span className="etiquette-auto" title="Relié automatiquement : même nom dans la caisse et dans FlaiX Expert. À changer si besoin.">
                            auto
                          </span>
                        ) : null}
                      </div>
                      {p.suggestion ? (
                        <Suggestion nom={p.suggestion.nom} memeNom={p.suggestion.memeNom} disabled={lierPdv.isPending || accepterPdv.isPending} accepter={() => lierPdv.mutate({ nom: p.nom, standId: p.suggestion!.id })} />
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <MessageErreur erreur={lierPdv.error ?? accepterPdv.error} />
      </Carte>
    </>
  );
}

/** Produit ou stand de FlaiX Expert au nom proche : proposé, le directeur confirme (§15.152). */
function Suggestion({ nom, memeNom, disabled, accepter }: { nom: string; memeNom: boolean; disabled: boolean; accepter: () => void }) {
  return (
    <div className="suggestion">
      <span>
        Suggestion : <strong>{nom}</strong>
        {memeNom ? " (même nom)" : ""}
      </span>
      <button className="btn-lien" disabled={disabled} onClick={accepter} aria-label={`Accepter la suggestion ${nom}`}>
        Accepter
      </button>
    </div>
  );
}

function TableSynthese({ titre, lignes }: { titre: string; lignes: LigneSynthese[] }) {
  return (
    <Carte titre={titre}>
      {lignes.length === 0 ? (
        <EtatVide titre="Rien sur la période" />
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table className="tableau">
            <thead>
              <tr>
                <th></th>
                <th className="chiffre">Ventes</th>
                <th className="chiffre">Quantité</th>
                <th className="chiffre">Chiffre d'affaires</th>
                <th className="chiffre">Marge estimée</th>
              </tr>
            </thead>
            <tbody>
              {lignes.map((l) => (
                <tr key={l.cle}>
                  <td>{l.libelle}</td>
                  <td className="chiffre">{l.ventes}</td>
                  <td className="chiffre">{l.quantite.toLocaleString("fr-FR")}</td>
                  <td className="chiffre">{formaterMontant(l.montant)}</td>
                  <td className="chiffre">{l.cout === null ? "—" : formaterMontant(l.montant - l.cout)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Carte>
  );
}

function Resultats() {
  const aujourdhui = jourParis(new Date());
  const [periode, setPeriode] = useState({ du: `${aujourdhui.slice(0, 7)}-01`, au: aujourdhui });
  const synthese = useQuery({
    queryKey: ["caisses-externes-synthese", periode],
    queryFn: () => api.get<SyntheseVentesExternes>(`/caisses-externes/synthese?du=${periode.du}&au=${periode.au}`),
    enabled: periode.du <= periode.au,
  });
  const s = synthese.data;
  const maxHeure = useMemo(() => Math.max(1, ...(s?.parHeure.map((h) => h.montant) ?? [1])), [s]);
  return (
    <>
      <Carte titre="Période">
        <div className="grille-champs">
          <label className="champ">
            <span>Du</span>
            <input type="date" value={periode.du} onChange={(ev) => setPeriode({ ...periode, du: ev.target.value })} />
          </label>
          <label className="champ">
            <span>Au</span>
            <input type="date" value={periode.au} onChange={(ev) => setPeriode({ ...periode, au: ev.target.value })} />
          </label>
        </div>
      </Carte>
      {synthese.isPending ? (
        <Chargement />
      ) : synthese.error ? (
        <MessageErreur erreur={synthese.error} />
      ) : (
        <>
          <div className="kpis">
            <div className="kpi">
              <div className="kpi-libelle">Chiffre d'affaires TTC</div>
              <div className="kpi-valeur">{formaterMontant(s!.montant)}</div>
              <div className="aide">
                {s!.ventes} vente{s!.ventes > 1 ? "s" : ""}
                {s!.annulees ? ` · ${s!.annulees} annulée${s!.annulees > 1 ? "s" : ""}` : ""}
              </div>
            </div>
            <div className="kpi">
              <div className="kpi-libelle">Panier moyen</div>
              <div className="kpi-valeur">{s!.ventes ? formaterMontant(Math.round(s!.montant / s!.ventes)) : "—"}</div>
            </div>
            <div className="kpi">
              <div className="kpi-libelle">Marge estimée</div>
              <div className="kpi-valeur">{s!.montantAvecCout ? formaterMontant(s!.montantAvecCout - s!.cout) : "—"}</div>
              <div className="aide">{s!.montant ? `sur ${Math.round((s!.montantAvecCout / s!.montant) * 100)} % du chiffre d'affaires (produits rapprochés)` : ""}</div>
            </div>
          </div>
          <TableSynthese titre="Par produit" lignes={s!.parProduit} />
          <TableSynthese titre="Par stand" lignes={s!.parStand} />
          <TableSynthese titre="Par événement" lignes={s!.parEvenement} />
          <Carte titre="Par heure">
            {s!.parHeure.length === 0 ? (
              <EtatVide titre="Rien sur la période" />
            ) : (
              <div style={{ display: "grid", gap: 4 }}>
                {s!.parHeure.map((h) => (
                  <div key={h.heure} className="en-ligne" style={{ gap: 8 }}>
                    <span className="chiffre" style={{ width: 44 }}>
                      {String(h.heure).padStart(2, "0")} h
                    </span>
                    <div style={{ flex: 1, background: "var(--track)", borderRadius: 6, height: 14 }}>
                      <div style={{ width: `${(h.montant / maxHeure) * 100}%`, background: "var(--violet)", borderRadius: 6, height: 14 }} />
                    </div>
                    <span className="chiffre" style={{ width: 90, textAlign: "right" }}>
                      {formaterMontant(h.montant)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Carte>
        </>
      )}
    </>
  );
}
