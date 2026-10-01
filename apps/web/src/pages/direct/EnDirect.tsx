import { useState } from "react";
import { Link } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CircleAlert, PackagePlus, RefreshCw } from "lucide-react";
import { formaterMontant, type Evenement, type LigneStock, type StatsCaisse, type StockMatch } from "@flaix/domain";
import { api, formaterDateHeure } from "../../api.ts";
import { Carte, Chargement, EtatVide, MessageErreur } from "../../composants/communs.tsx";
import { useOptions } from "../../session.tsx";

const RAFRAICHISSEMENT_MS = 20_000;
const heure = new Intl.DateTimeFormat("fr-FR", { timeStyle: "medium", timeZone: "Europe/Paris" });

/** « il y a 3 min » depuis un horodatage ISO. */
function ilYa(iso: string, maintenant: number): string {
  const min = Math.max(0, Math.round((maintenant - Date.parse(iso)) / 60_000));
  return min < 1 ? "à l'instant" : min < 60 ? `il y a ${min} min` : `il y a ${Math.floor(min / 60)} h ${String(min % 60).padStart(2, "0")}`;
}

/**
 * En direct (dossier §15.95 ajout 1, §15.112) : la soirée de match sur le téléphone du directeur —
 * CA en direct, caisses ouvertes, ruptures et stock faible, réassort en deux gestes. Lit les mêmes
 * calculs que Caisses et Stock (aucun chiffre recalculé ici) ; mis à jour toutes les 20 secondes.
 */
export function EnDirect() {
  const options = useOptions();
  const evenements = useQuery({ queryKey: ["evenements"], queryFn: () => api.get<Evenement[]>("/evenements"), refetchInterval: RAFRAICHISSEMENT_MS });
  const ouvert = evenements.data?.find((e) => e.etat === "ouvert") ?? null;
  const prochain =
    evenements.data?.filter((e) => e.etat === "a_venir").sort((a, b) => Date.parse(a.debut) - Date.parse(b.debut))[0] ?? null;
  const caisses = useQuery({
    queryKey: ["caisses-tableau", ouvert?.id],
    queryFn: () => api.get<StatsCaisse[]>(`/caisses/tableau?evenementId=${ouvert!.id}`),
    enabled: !!ouvert,
    refetchInterval: RAFRAICHISSEMENT_MS,
  });
  const stock = useQuery({
    queryKey: ["stock", ouvert?.id],
    queryFn: () => api.get<StockMatch | null>(`/stock?evenementId=${ouvert!.id}`),
    enabled: !!ouvert && options.stock,
    refetchInterval: RAFRAICHISSEMENT_MS,
  });

  if (evenements.isPending) return <Chargement />;
  if (evenements.error) return <MessageErreur erreur={evenements.error} />;

  if (!ouvert) {
    return (
      <div className="direct">
        <h1 className="direct-titre">En direct</h1>
        <Carte>
          <EtatVide titre="Aucun match ouvert">
            {prochain ? `Prochain match : ${prochain.libelle}, le ${formaterDateHeure(prochain.debut)}. ` : ""}
            Le match s'ouvre dans <Link to="/caisses">Caisses</Link>.
          </EtatVide>
        </Carte>
      </div>
    );
  }

  const maj = Math.max(caisses.dataUpdatedAt, stock.dataUpdatedAt, evenements.dataUpdatedAt);
  const maintenant = Date.now();
  const liste = (caisses.data ?? []).filter((k) => k.actif || k.nbVentes > 0);
  const ca = liste.reduce((s, k) => s + k.caNet, 0);
  const tickets = liste.reduce((s, k) => s + k.nbVentes - k.nbAnnulations, 0);
  const ouvertes = liste.filter((k) => k.ouverteMaintenant).length;
  const especes = liste.reduce((s, k) => s + k.especes, 0);
  const carte = liste.reduce((s, k) => s + k.carte, 0);
  const alertes = (stock.data?.stands ?? [])
    .flatMap((st) => st.lignes.filter((l) => l.alerte).map((l) => ({ stand: st, ligne: l })))
    .sort((a, b) => (a.ligne.alerte === b.ligne.alerte ? a.ligne.restant - b.ligne.restant : a.ligne.alerte === "rupture" ? -1 : 1));
  const parStand = new Map<string, { nom: string; caisses: StatsCaisse[] }>();
  for (const k of liste) {
    const s = parStand.get(k.standId) ?? { nom: k.standNom, caisses: [] };
    s.caisses.push(k);
    parStand.set(k.standId, s);
  }

  return (
    <div className="direct">
      <div className="direct-entete">
        <div style={{ minWidth: 0 }}>
          <h1 className="direct-titre">{ouvert.libelle}</h1>
          <div className="discret" style={{ fontSize: 12.5 }}>
            Ouvert {ouvert.ouvertLe ? ilYa(ouvert.ouvertLe, maintenant) : ""} · mis à jour à {heure.format(maj || maintenant)}
          </div>
        </div>
        <button
          className="btn btn-fantome"
          aria-label="Mettre à jour"
          onClick={() => {
            void evenements.refetch();
            void caisses.refetch();
            void stock.refetch();
          }}
        >
          <RefreshCw size={15} />
        </button>
      </div>
      <MessageErreur erreur={caisses.error ?? stock.error} />

      <div className="direct-kpis">
        <div className="kpi direct-kpi-principal">
          <div className="kpi-libelle">CA TTC du match</div>
          <div className="kpi-valeur">{formaterMontant(ca)}</div>
          <div className="aide">
            espèces {formaterMontant(especes)} · carte {formaterMontant(carte)}
          </div>
        </div>
        <div className="kpi">
          <div className="kpi-libelle">Tickets</div>
          <div className="kpi-valeur">{tickets}</div>
          <div className="aide">panier {tickets > 0 ? formaterMontant(Math.round(ca / tickets)) : "—"}</div>
        </div>
        <div className="kpi">
          <div className="kpi-libelle">Caisses ouvertes</div>
          <div className="kpi-valeur">
            {ouvertes} / {liste.filter((k) => k.actif).length}
          </div>
        </div>
      </div>

      {options.stock && (
      <Carte
        titre={alertes.length ? `Ruptures et stock faible (${alertes.length})` : "Stock"}
        description={alertes.length ? "Restant = départ + réassorts − vendu, par stand. Faible : 15 % du départ ou moins." : undefined}
      >
        {stock.isPending ? (
          <Chargement />
        ) : !stock.data || stock.data.stands.every((s) => s.lignes.every((l) => l.depart === 0)) ? (
          <p className="discret" style={{ margin: 0 }}>
            Pas de stock suivi sur ce match : les ruptures s'affichent quand la mise en place est saisie (<Link to="/stock">Stock</Link>).
          </p>
        ) : alertes.length === 0 ? (
          <p style={{ margin: 0 }}>Aucune rupture, aucun stock faible.</p>
        ) : (
          <div className="direct-liste">
            {alertes.map(({ stand, ligne }) => (
              <AlerteStockCarte key={`${stand.standId}:${ligne.produitId}`} evenementId={ouvert.id} standId={stand.standId} standNom={stand.nom} ligne={ligne} />
            ))}
          </div>
        )}
      </Carte>
      )}

      <Carte titre="Caisses">
        {caisses.isPending ? (
          <Chargement />
        ) : parStand.size === 0 ? (
          <EtatVide titre="Aucune caisse" />
        ) : (
          <div className="direct-liste">
            {[...parStand.entries()].map(([id, s]) => (
              <div key={id} className="direct-stand">
                <div className="direct-ligne">
                  <strong>{s.nom}</strong>
                  <span className="chiffre">{formaterMontant(s.caisses.reduce((t, k) => t + k.caNet, 0))}</span>
                </div>
                {s.caisses.map((k) => (
                  <div key={k.caisseId} className="direct-ligne discret" style={{ fontSize: 12.5 }}>
                    <span>
                      <span className={`point-etat ${k.ouverteMaintenant ? "ouverte" : ""}`} aria-hidden="true" /> Caisse {k.numero}
                      {k.ouverteMaintenant ? ` · ${k.ouverteMaintenant.par}` : " · fermée"}
                    </span>
                    <span className="chiffre">
                      {formaterMontant(k.caNet)}
                      {k.dernierTicket ? ` · ${ilYa(k.dernierTicket, maintenant)}` : ""}
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </Carte>
      <p className="discret" style={{ fontSize: 12, textAlign: "center" }}>
        Détail dans <Link to="/caisses">Caisses</Link> et <Link to="/stock">Stock</Link>.
      </p>
    </div>
  );
}

/** Une alerte de stock, avec le réassort en deux gestes (quantité, valider). */
function AlerteStockCarte({ evenementId, standId, standNom, ligne }: { evenementId: string; standId: string; standNom: string; ligne: LigneStock }) {
  const client = useQueryClient();
  const [ouvert, setOuvert] = useState(false);
  const [quantite, setQuantite] = useState("");
  const q = Number(quantite);
  const reassort = useMutation({
    mutationFn: () => api.post<StockMatch>("/stock/reassort", { evenementId, standId, produitId: ligne.produitId, quantite: q }),
    onSuccess: (s) => {
      client.setQueryData(["stock", evenementId], s);
      setOuvert(false);
      setQuantite("");
    },
  });
  return (
    <div className="direct-alerte">
      <div className="direct-ligne">
        <span style={{ minWidth: 0 }}>
          <CircleAlert size={15} style={{ color: ligne.alerte === "rupture" ? "var(--red)" : "var(--amber)", verticalAlign: -2 }} /> <strong>{ligne.nom}</strong>
          <span className="discret"> · {standNom}</span>
        </span>
        <span className={`puce ${ligne.alerte === "rupture" ? "puce-rouge" : "puce-ambre"}`}>{ligne.alerte === "rupture" ? "Rupture" : "Faible"}</span>
      </div>
      <div className="direct-ligne discret" style={{ fontSize: 12.5 }}>
        <span>
          Reste {ligne.restant} sur {ligne.depart} · vendu {ligne.vendu}
        </span>
        {!ouvert && (
          <button className="btn btn-fantome" style={{ padding: "4px 10px", fontSize: 12.5 }} onClick={() => setOuvert(true)}>
            <PackagePlus size={14} /> Réassort
          </button>
        )}
      </div>
      {ouvert && (
        <form
          className="direct-ligne"
          onSubmit={(e) => {
            e.preventDefault();
            if (Number.isInteger(q) && q > 0) reassort.mutate();
          }}
        >
          <input
            type="text"
            inputMode="numeric"
            autoFocus
            value={quantite}
            onChange={(e) => setQuantite(e.target.value.replace(/\D/g, ""))}
            placeholder="Quantité apportée"
            aria-label={`Quantité de ${ligne.nom} apportée au stand ${standNom}`}
            style={{ flex: 1, minWidth: 0 }}
          />
          <button className="btn" type="submit" disabled={!(q > 0) || reassort.isPending}>
            Valider
          </button>
          <button className="btn btn-fantome" type="button" onClick={() => setOuvert(false)}>
            Annuler
          </button>
        </form>
      )}
      <MessageErreur erreur={reassort.error} />
    </div>
  );
}
