import { useMemo, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, Upload, UserPlus } from "lucide-react";
import {
  formaterMontant,
  lireImportAbonnes,
  lireMontant,
  montantPourSaisie,
  valeurConvertible,
  type AbonneVue,
  type EtatFidelite,
  type HistoriqueAbonne,
  type ResultatImport,
} from "@flaix/domain";
import { api, formaterDateHeure } from "../../api.ts";
import { Carte, Chargement, EntetePage, EtatVide, MessageErreur, Regles } from "../../composants/communs.tsx";
import { CarteAbonneBloc, ReglagesCarte } from "./CarteWallet.tsx";

type Onglet = "abonnes" | "codes" | "import" | "reglages" | "carte";
const ETATS_CODE = { valide: ["Valide", "puce-vert"], a_venir: ["À venir", ""], expire: ["Expiré", ""], epuise: ["Épuisé", "puce-ambre"], desactive: ["Désactivé", ""] } as const;
const dateCourte = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`;

/**
 * Fidélité (module 19 validé ; dossier §15.114) — les abonnés du lieu seulement, identifiés par leur
 * n° d'abonné, celui-là même que la caissière saisit pour la remise abonné.
 */
export function Fidelite() {
  const [onglet, setOnglet] = useState<Onglet>("abonnes");
  const etat = useQuery({ queryKey: ["fidelite"], queryFn: () => api.get<EtatFidelite>("/fidelite"), refetchOnMount: "always" });
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
      <EntetePage titre="Fidélité" description="Les abonnés du lieu, leurs points et les codes promo." />
      <div className="onglets">
        {bouton("abonnes", `Abonnés (${e.abonnes.length})`)}
        {bouton("codes", "Codes promo")}
        {bouton("import", "Importer")}
        {bouton("reglages", "Règles des points")}
        {bouton("carte", "Carte téléphone")}
      </div>
      {onglet === "abonnes" ? <Abonnes e={e} /> : onglet === "codes" ? <Codes e={e} /> : onglet === "import" ? <Import /> : onglet === "reglages" ? <ReglagesPoints e={e} /> : <ReglagesCarte />}
      <Regles>
        <ul>
          <li>
            <strong>Qui</strong> : les abonnés du lieu seulement. Un client du comptoir ne donne ni nom ni e-mail : il n'a pas de compte fidélité. L'identifiant est le{" "}
            <strong>n° d'abonné</strong>, celui que la caissière saisit pour la remise abonné (majuscules et espaces ignorés).
          </li>
          <li>
            <strong>Points</strong> = euros entiers de chaque ticket « remise abonné » non annulé × points par euro, + points de départ (import) + ajustements. Ils se lisent
            dans les tickets scellés : rien n'est recopié, un ticket annulé ne compte plus. <strong>Valeur</strong> : paliers entiers seulement (le reste attend le palier
            suivant). Les règles sont à fixer par le lieu : aucune valeur n'est supposée.
          </li>
          <li>
            <strong>Ajustement</strong> : avec un motif, inscrit au journal technique ; un mouvement de points ne se modifie ni ne se supprime.
          </li>
          <li>
            <strong>Codes promo</strong> : pourcentage ou montant, dates de validité, plafond d'usages facultatif ; un code ne se réutilise pas. Leur utilisation à la caisse
            arrive avec l'étape suivante du module.
          </li>
          <li>
            <strong>Carte dans le téléphone</strong> : chaque abonné peut recevoir un lien personnel vers sa carte (n° d'abonné, QR code, points), à ajouter dans Apple Wallet
            ou Google Wallet. Le solde s'y met à jour après chaque ticket et chaque ajustement. Renouveler le lien rend l'ancien inutilisable ; un abonné désactivé n'a
            plus de carte.
          </li>
          <li>
            <strong>Données personnelles</strong> : nom, e-mail et téléphone ne servent qu'au programme de fidélité du lieu ; le journal note ce qui change, sans les recopier.
            Registre des traitements et durée de conservation à établir (question posée, G.21).
          </li>
        </ul>
      </Regles>
    </>
  );
}

function Abonnes({ e }: { e: EtatFidelite }) {
  const client = useQueryClient();
  const [recherche, setRecherche] = useState("");
  const [ouvert, setOuvert] = useState<string | null>(null);
  const [nouveau, setNouveau] = useState({ numero: "", nom: "", email: "", telephone: "" });
  const creer = useMutation({
    mutationFn: () => api.post<EtatFidelite>("/fidelite/abonnes", { ...nouveau, email: nouveau.email || null, telephone: nouveau.telephone || null }),
    onSuccess: (r) => {
      client.setQueryData(["fidelite"], r);
      setNouveau({ numero: "", nom: "", email: "", telephone: "" });
    },
  });
  const q = recherche.trim().toLowerCase();
  const liste = e.abonnes.filter((a) => !q || a.numero.toLowerCase().includes(q) || a.nom.toLowerCase().includes(q));
  const envoyer = (ev: FormEvent) => {
    ev.preventDefault();
    creer.mutate();
  };

  return (
    <>
      {e.numerosSansFiche.length > 0 && (
        <div className="message message-alerte">
          N° saisis à la caisse sans fiche d'abonné : {e.numerosSansFiche.map((n) => `${n.numero} (${n.tickets} ticket${n.tickets > 1 ? "s" : ""})`).join(", ")}. Crée leur fiche
          pour leur compter les points.
        </div>
      )}
      <Carte titre="Ajouter un abonné">
        <form onSubmit={envoyer} className="grille-champs">
          <label className="champ">
            <span>N° d'abonné</span>
            <input type="text" value={nouveau.numero} onChange={(ev) => setNouveau({ ...nouveau, numero: ev.target.value })} required maxLength={40} />
          </label>
          <label className="champ">
            <span>Nom</span>
            <input type="text" value={nouveau.nom} onChange={(ev) => setNouveau({ ...nouveau, nom: ev.target.value })} required maxLength={120} />
          </label>
          <label className="champ">
            <span>E-mail (facultatif)</span>
            <input type="email" value={nouveau.email} onChange={(ev) => setNouveau({ ...nouveau, email: ev.target.value })} maxLength={200} />
          </label>
          <label className="champ">
            <span>Téléphone (facultatif)</span>
            <input type="text" inputMode="tel" value={nouveau.telephone} onChange={(ev) => setNouveau({ ...nouveau, telephone: ev.target.value })} maxLength={30} />
          </label>
          <div style={{ alignSelf: "end" }}>
            <button className="btn" type="submit" disabled={creer.isPending}>
              <UserPlus size={15} /> Ajouter
            </button>
          </div>
        </form>
        <MessageErreur erreur={creer.error} />
      </Carte>

      <Carte
        titre="Abonnés"
        actions={
          <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Search size={15} />
            <input type="search" value={recherche} onChange={(ev) => setRecherche(ev.target.value)} placeholder="N° ou nom" aria-label="Rechercher un abonné" />
          </label>
        }
      >
        {e.abonnes.length === 0 ? (
          <EtatVide titre="Aucun abonné">Ajoute-les un par un, ou importe ta base existante (onglet « Importer »).</EtatVide>
        ) : (
          <div className="scroll-x">
            <table className="tableau">
              <thead>
                <tr>
                  <th>N°</th>
                  <th>Nom</th>
                  <th className="d">Tickets</th>
                  <th className="d">Dépensé</th>
                  <th className="d">Points</th>
                  <th>Dernière visite</th>
                </tr>
              </thead>
              <tbody>
                {liste.map((a) => (
                  <LigneAbonne key={a.id} a={a} e={e} ouvert={ouvert === a.id} basculer={() => setOuvert(ouvert === a.id ? null : a.id)} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Carte>
    </>
  );
}

function LigneAbonne({ a, e, ouvert, basculer }: { a: AbonneVue; e: EtatFidelite; ouvert: boolean; basculer: () => void }) {
  const v = a.points !== null && e.reglages ? valeurConvertible(a.points, e.reglages) : null;
  return (
    <>
      <tr style={a.actif ? undefined : { opacity: 0.55 }}>
        <td className="chiffre">{a.numero}</td>
        <td>
          <button className="btn-lien" onClick={basculer} aria-expanded={ouvert}>
            {a.nom}
          </button>
          {!a.actif && <span className="discret"> (désactivé)</span>}
        </td>
        <td className="d chiffre">{a.tickets}</td>
        <td className="d chiffre">{formaterMontant(a.depense)}</td>
        <td className="d chiffre">
          {a.points === null ? "—" : a.points}
          {v && v.valeur > 0 && <div className="discret" style={{ fontSize: 11.5 }}>vaut {formaterMontant(v.valeur)}</div>}
        </td>
        <td className="chiffre">{a.derniereVisite ? formaterDateHeure(a.derniereVisite) : "—"}</td>
      </tr>
      {ouvert && (
        <tr>
          <td colSpan={6} style={{ whiteSpace: "normal" }}>
            <DetailAbonne id={a.id} />
          </td>
        </tr>
      )}
    </>
  );
}

function DetailAbonne({ id }: { id: string }) {
  const client = useQueryClient();
  const h = useQuery({ queryKey: ["fidelite-abonne", id], queryFn: () => api.get<HistoriqueAbonne>(`/fidelite/abonnes/${id}`) });
  const [ajust, setAjust] = useState({ points: "", commentaire: "" });
  const [edition, setEdition] = useState<{ nom: string; email: string; telephone: string } | null>(null);
  const rafraichir = (r: EtatFidelite) => {
    client.setQueryData(["fidelite"], r);
    void client.invalidateQueries({ queryKey: ["fidelite-abonne", id] });
  };
  const ajuster = useMutation({
    mutationFn: () => api.post<EtatFidelite>(`/fidelite/abonnes/${id}/points`, { points: Number(ajust.points), commentaire: ajust.commentaire }),
    onSuccess: (r) => {
      rafraichir(r);
      setAjust({ points: "", commentaire: "" });
    },
  });
  const modifier = useMutation({
    mutationFn: (m: Record<string, unknown>) => api.patch<EtatFidelite>(`/fidelite/abonnes/${id}`, m),
    onSuccess: (r) => {
      rafraichir(r);
      setEdition(null);
    },
  });
  if (h.isPending) return <Chargement />;
  if (h.error) return <MessageErreur erreur={h.error} />;
  const d = h.data!;
  const a = d.abonne;
  const pts = Number(ajust.points);

  return (
    <div style={{ display: "grid", gap: 12, padding: "6px 0" }}>
      {edition ? (
        <form
          className="grille-champs"
          onSubmit={(ev) => {
            ev.preventDefault();
            modifier.mutate({ nom: edition.nom, email: edition.email || null, telephone: edition.telephone || null });
          }}
        >
          <label className="champ">
            <span>Nom</span>
            <input type="text" value={edition.nom} onChange={(ev) => setEdition({ ...edition, nom: ev.target.value })} required />
          </label>
          <label className="champ">
            <span>E-mail</span>
            <input type="email" value={edition.email} onChange={(ev) => setEdition({ ...edition, email: ev.target.value })} />
          </label>
          <label className="champ">
            <span>Téléphone</span>
            <input type="text" value={edition.telephone} onChange={(ev) => setEdition({ ...edition, telephone: ev.target.value })} />
          </label>
          <div className="actions" style={{ alignSelf: "end", justifyContent: "flex-start" }}>
            <button className="btn" type="submit" disabled={modifier.isPending}>
              Enregistrer
            </button>
            <button className="btn btn-fantome" type="button" onClick={() => setEdition(null)}>
              Annuler
            </button>
          </div>
        </form>
      ) : (
        <div className="actions" style={{ justifyContent: "flex-start", flexWrap: "wrap" }}>
          <span className="discret">
            {a.email ?? "pas d'e-mail"} · {a.telephone ?? "pas de téléphone"} · {a.source === "import" ? "importé" : "saisi"}
          </span>
          <button className="btn btn-fantome" onClick={() => setEdition({ nom: a.nom, email: a.email ?? "", telephone: a.telephone ?? "" })}>
            Modifier
          </button>
          <button className="btn btn-fantome" disabled={modifier.isPending} onClick={() => modifier.mutate({ actif: !a.actif })}>
            {a.actif ? "Désactiver" : "Réactiver"}
          </button>
        </div>
      )}
      <MessageErreur erreur={modifier.error} />

      <form
        className="actions"
        style={{ justifyContent: "flex-start", flexWrap: "wrap" }}
        onSubmit={(ev) => {
          ev.preventDefault();
          ajuster.mutate();
        }}
      >
        <input
          type="text"
          inputMode="numeric"
          value={ajust.points}
          onChange={(ev) => setAjust({ ...ajust, points: ev.target.value.replace(/[^\d-]/g, "") })}
          placeholder="± points"
          aria-label="Points à ajouter ou retirer"
          style={{ width: 100 }}
        />
        <input
          type="text"
          value={ajust.commentaire}
          onChange={(ev) => setAjust({ ...ajust, commentaire: ev.target.value })}
          placeholder="Motif de l'ajustement"
          aria-label="Motif de l'ajustement"
          style={{ flex: 1, minWidth: 200 }}
        />
        <button className="btn btn-fantome" type="submit" disabled={!Number.isInteger(pts) || pts === 0 || ajust.commentaire.trim().length < 3 || ajuster.isPending}>
          Ajuster les points
        </button>
      </form>
      <MessageErreur erreur={ajuster.error} />

      <CarteAbonneBloc id={id} nom={a.nom} actif={a.actif} />

      {d.mouvements.length > 0 && (
        <div>
          <strong style={{ fontSize: 13 }}>Mouvements hors caisse</strong>
          {d.mouvements.map((m, i) => (
            <div key={i} className="bilan-ligne">
              <span>
                {m.motif === "depart" ? "Points de départ" : "Ajustement"}
                {m.commentaire ? ` — ${m.commentaire}` : ""} · {m.par}, {formaterDateHeure(m.le)}
              </span>
              <span className="chiffre">{m.points > 0 ? `+${m.points}` : m.points}</span>
            </div>
          ))}
        </div>
      )}
      <div>
        <strong style={{ fontSize: 13 }}>Consommation ({d.tickets.length} ticket{d.tickets.length > 1 ? "s" : ""})</strong>
        {d.tickets.length === 0 ? (
          <p className="discret" style={{ margin: "4px 0 0" }}>
            Aucun ticket : la caissière saisit ce n° avec la remise abonné.
          </p>
        ) : (
          d.tickets.map((t) => (
            <div key={t.id} className="bilan-ligne" style={t.annule ? { textDecoration: "line-through", opacity: 0.6 } : undefined}>
              <span>
                {formaterDateHeure(t.horodatage)} · {t.match} · {t.numeroJustificatif}
                {t.annule ? " (annulé)" : ""}
              </span>
              <span className="chiffre">
                {formaterMontant(t.total)}
                {t.points !== null && !t.annule ? ` · +${t.points} pts` : ""}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function Codes({ e }: { e: EtatFidelite }) {
  const client = useQueryClient();
  const [n, setN] = useState({ code: "", type: "pourcentage" as "pourcentage" | "montant", valeur: "", debut: "", fin: "", usageMax: "" });
  const valeur = lireMontant(n.valeur);
  const creer = useMutation({
    mutationFn: () =>
      api.post<EtatFidelite>("/fidelite/codes", {
        code: n.code,
        type: n.type,
        valeur,
        debut: n.debut,
        fin: n.fin,
        usageMax: n.usageMax ? Number(n.usageMax) : null,
      }),
    onSuccess: (r) => {
      client.setQueryData(["fidelite"], r);
      setN({ code: "", type: "pourcentage", valeur: "", debut: "", fin: "", usageMax: "" });
    },
  });
  const modifier = useMutation({
    mutationFn: (x: { id: string; actif: boolean }) => api.patch<EtatFidelite>(`/fidelite/codes/${x.id}`, { actif: x.actif }),
    onSuccess: (r) => client.setQueryData(["fidelite"], r),
  });

  return (
    <>
      <Carte titre="Nouveau code promo" description="Utilisable par n'importe quel client, abonné ou non : c'est un code, pas un compte.">
        <form
          className="grille-champs"
          onSubmit={(ev) => {
            ev.preventDefault();
            creer.mutate();
          }}
        >
          <label className="champ">
            <span>Code</span>
            <input type="text" value={n.code} onChange={(ev) => setN({ ...n, code: ev.target.value.toUpperCase() })} placeholder="ex. MATCH50" required maxLength={30} />
          </label>
          <label className="champ">
            <span>Type</span>
            <select value={n.type} onChange={(ev) => setN({ ...n, type: ev.target.value as "pourcentage" | "montant" })}>
              <option value="pourcentage">Pourcentage du panier</option>
              <option value="montant">Montant en euros</option>
            </select>
          </label>
          <label className="champ">
            <span>{n.type === "pourcentage" ? "Remise (%)" : "Remise (€)"}</span>
            <input type="text" inputMode="decimal" value={n.valeur} onChange={(ev) => setN({ ...n, valeur: ev.target.value })} required />
          </label>
          <label className="champ">
            <span>Du</span>
            <input type="date" value={n.debut} onChange={(ev) => setN({ ...n, debut: ev.target.value })} required />
          </label>
          <label className="champ">
            <span>Au (inclus)</span>
            <input type="date" value={n.fin} onChange={(ev) => setN({ ...n, fin: ev.target.value })} required />
          </label>
          <label className="champ">
            <span>Plafond d'usages (facultatif)</span>
            <input type="text" inputMode="numeric" value={n.usageMax} onChange={(ev) => setN({ ...n, usageMax: ev.target.value.replace(/\D/g, "") })} />
          </label>
          <div style={{ alignSelf: "end" }}>
            <button className="btn" type="submit" disabled={creer.isPending || valeur === null || !valeur}>
              Créer le code
            </button>
          </div>
        </form>
        <MessageErreur erreur={creer.error} />
      </Carte>
      <Carte titre="Codes">
        {e.codes.length === 0 ? (
          <EtatVide titre="Aucun code promo" />
        ) : (
          <div className="scroll-x">
            <table className="tableau">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Remise</th>
                  <th>Validité</th>
                  <th className="d">Usages</th>
                  <th>État</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {e.codes.map((k) => (
                  <tr key={k.id}>
                    <td className="chiffre">
                      <strong>{k.code}</strong>
                    </td>
                    <td>{k.type === "pourcentage" ? `${montantPourSaisie(k.valeur)} %` : formaterMontant(k.valeur)}</td>
                    <td>
                      {dateCourte(k.debut)} → {dateCourte(k.fin)}
                    </td>
                    <td className="d chiffre">
                      {k.usages}
                      {k.usageMax !== null ? ` / ${k.usageMax}` : ""}
                    </td>
                    <td>
                      <span className={`puce ${ETATS_CODE[k.etat][1]}`}>{ETATS_CODE[k.etat][0]}</span>
                    </td>
                    <td>
                      <button className="btn btn-fantome" disabled={modifier.isPending} onClick={() => modifier.mutate({ id: k.id, actif: !k.actif })}>
                        {k.actif ? "Désactiver" : "Réactiver"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <MessageErreur erreur={modifier.error} />
      </Carte>
    </>
  );
}

function Import() {
  const client = useQueryClient();
  const [lu, setLu] = useState<ResultatImport | null>(null);
  const [nomFichier, setNomFichier] = useState("");
  const importer = useMutation({
    mutationFn: () => api.post<{ crees: number; dejaPresents: string[]; etat: EtatFidelite }>("/fidelite/import", { lignes: lu!.lignes }),
    onSuccess: (r) => client.setQueryData(["fidelite"], r.etat),
  });
  const libelles = useMemo(() => ({ numero: "N° d'abonné", nom: "Nom", email: "E-mail", telephone: "Téléphone", points: "Points" }), []);

  return (
    <Carte
      titre="Importer la base d'abonnés existante"
      description="Fichier CSV exporté d'un tableur (Excel : « Enregistrer sous » → CSV). Première ligne : les en-têtes ; il faut au moins le n° d'abonné et le nom."
    >
      <label className="btn btn-fantome" style={{ display: "inline-flex", gap: 6, cursor: "pointer" }}>
        <Upload size={15} /> Choisir un fichier
        <input
          type="file"
          accept=".csv,text/csv,text/plain"
          style={{ display: "none" }}
          onChange={async (ev) => {
            const f = ev.target.files?.[0];
            if (!f) return;
            setNomFichier(f.name);
            importer.reset();
            setLu(lireImportAbonnes(await f.text()));
          }}
        />
      </label>
      {nomFichier && <span className="discret" style={{ marginLeft: 8 }}>{nomFichier}</span>}
      {lu && (
        <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
          <div className="discret" style={{ fontSize: 13 }}>
            Colonnes reconnues :{" "}
            {Object.entries(lu.colonnes)
              .map(([champ, i]) => `${libelles[champ as keyof typeof libelles]} ← « ${lu.entetes[i!]} »`)
              .join(" · ") || "aucune"}
          </div>
          {lu.erreurs.length > 0 && (
            <div className="message message-alerte" style={{ margin: 0 }}>
              {lu.erreurs.length} ligne{lu.erreurs.length > 1 ? "s" : ""} écartée{lu.erreurs.length > 1 ? "s" : ""} :
              <ul style={{ margin: "6px 0 0", paddingLeft: 18 }}>
                {lu.erreurs.slice(0, 20).map((x) => (
                  <li key={x.ligne}>
                    ligne {x.ligne} — {x.message}
                  </li>
                ))}
              </ul>
              {lu.erreurs.length > 20 && <div>… et {lu.erreurs.length - 20} autres.</div>}
            </div>
          )}
          {lu.lignes.length > 0 && (
            <>
              <p style={{ margin: 0 }}>
                <strong>{lu.lignes.length}</strong> abonné{lu.lignes.length > 1 ? "s" : ""} prêt{lu.lignes.length > 1 ? "s" : ""} à importer, dont{" "}
                {lu.lignes.filter((l) => l.points > 0).length} avec des points de départ. Un n° qui a déjà une fiche ne sera pas modifié.
              </p>
              <div className="scroll-x">
                <table className="tableau">
                  <thead>
                    <tr>
                      <th>N°</th>
                      <th>Nom</th>
                      <th>E-mail</th>
                      <th>Téléphone</th>
                      <th className="d">Points</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lu.lignes.slice(0, 8).map((l) => (
                      <tr key={l.numero}>
                        <td className="chiffre">{l.numero}</td>
                        <td>{l.nom}</td>
                        <td>{l.email ?? "—"}</td>
                        <td>{l.telephone ?? "—"}</td>
                        <td className="d chiffre">{l.points}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {lu.lignes.length > 8 && <div className="discret">… et {lu.lignes.length - 8} autres.</div>}
              <div>
                <button className="btn" disabled={importer.isPending || importer.isSuccess} onClick={() => importer.mutate()}>
                  Importer {lu.lignes.length} abonné{lu.lignes.length > 1 ? "s" : ""}
                </button>
              </div>
            </>
          )}
          {importer.data && (
            <div className="message message-ok" style={{ margin: 0 }}>
              {importer.data.crees} fiche{importer.data.crees > 1 ? "s" : ""} créée{importer.data.crees > 1 ? "s" : ""}.
              {importer.data.dejaPresents.length > 0 && ` Déjà présents, non modifiés : ${importer.data.dejaPresents.join(", ")}.`}
            </div>
          )}
          <MessageErreur erreur={importer.error} />
        </div>
      )}
    </Carte>
  );
}

function ReglagesPoints({ e }: { e: EtatFidelite }) {
  const client = useQueryClient();
  const r = e.reglages;
  const [s, setS] = useState({ points: r ? String(r.pointsParEuro) : "", palier: r ? String(r.palierPoints) : "", valeur: r ? montantPourSaisie(r.valeurPalier) : "" });
  const valeur = lireMontant(s.valeur);
  const pts = Number(s.points), palier = Number(s.palier);
  const complet = Number.isInteger(pts) && pts >= 1 && Number.isInteger(palier) && palier >= 1 && valeur !== null && valeur > 0;
  const enregistrer = useMutation({
    mutationFn: () => api.put<EtatFidelite>("/fidelite/reglages", { pointsParEuro: pts, palierPoints: palier, valeurPalier: valeur }),
    onSuccess: (x) => client.setQueryData(["fidelite"], x),
  });
  return (
    <Carte titre="Règles des points" description="Ta stratégie commerciale : rien n'est réglé d'avance. Tant que ce n'est pas fait, les points ne s'affichent pas.">
      <form
        className="grille-champs"
        onSubmit={(ev) => {
          ev.preventDefault();
          if (complet) enregistrer.mutate();
        }}
      >
        <label className="champ">
          <span>Points gagnés par euro dépensé</span>
          <input type="text" inputMode="numeric" value={s.points} onChange={(ev) => setS({ ...s, points: ev.target.value.replace(/\D/g, "") })} placeholder="ex. 1" />
        </label>
        <label className="champ">
          <span>Palier de conversion (points)</span>
          <input type="text" inputMode="numeric" value={s.palier} onChange={(ev) => setS({ ...s, palier: ev.target.value.replace(/\D/g, "") })} placeholder="ex. 100" />
        </label>
        <label className="champ">
          <span>Valeur d'un palier (€)</span>
          <input type="text" inputMode="decimal" value={s.valeur} onChange={(ev) => setS({ ...s, valeur: ev.target.value })} placeholder="ex. 5,00" />
        </label>
        <div style={{ alignSelf: "end" }}>
          <button className="btn" type="submit" disabled={!complet || enregistrer.isPending}>
            Enregistrer
          </button>
        </div>
      </form>
      {complet && (
        <p className="discret" style={{ marginBottom: 0 }}>
          Exemple : un abonné qui dépense 32,40 € gagne {Math.floor(3240 / 100) * pts} points ; {palier} points valent {formaterMontant(valeur!)} de réduction, soit un retour de{" "}
          {((valeur! / 100 / (palier / pts)) * 100).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} % de la dépense.
        </p>
      )}
      <MessageErreur erreur={enregistrer.error} />
    </Carte>
  );
}
