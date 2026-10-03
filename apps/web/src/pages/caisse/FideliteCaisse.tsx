import { useCallback, useEffect, useState } from "react";
import { Gift, Ticket, X } from "lucide-react";
import {
  formaterMontant,
  normaliserNumeroAbonne,
  type CodePromoCaisse,
  type FideliteVente,
  type PointsAbonneCaisse,
  type ReservationCaisse,
} from "@flaix/domain";
import { api, ErreurApi } from "../../api.ts";

/**
 * Fidélité à la caisse (dossier §15.127, option A de Rémi) :
 * - points de l'abonné : solde lu et points réservés par le serveur avant d'encaisser — réseau obligatoire ;
 * - code promo plafonné : un usage réservé par le serveur — réseau obligatoire ;
 * - code promo sans plafond : marche aussi sans réseau, la tablette garde la liste des codes valables.
 */
type CodeHorsLigne = CodePromoCaisse & { debut: string; fin: string };
type CodeApplique = CodePromoCaisse & { reservation: string | null };
type PointsAppliques = { numero: string; points: number; montant: number; reservation: string };

const cleCodes = (caisseId: string) => `fx-codes-hors-ligne:${caisseId}`;
const sansReseau = (e: unknown) => !(e instanceof ErreurApi) || e.statut === 502 || e.statut === 504;
const jourParis = () => new Date().toLocaleDateString("fr-CA", { timeZone: "Europe/Paris" });

function lireCodes(caisseId: string): CodeHorsLigne[] {
  try {
    return JSON.parse(localStorage.getItem(cleCodes(caisseId)) ?? "[]") as CodeHorsLigne[];
  } catch {
    return [];
  }
}

export function useFideliteCaisse(caisseId: string, active: boolean) {
  const [code, setCode] = useState<CodeApplique | null>(null);
  const [points, setPoints] = useState<PointsAppliques | null>(null);

  // Liste des codes sans plafond, rafraîchie dès que le réseau le permet.
  useEffect(() => {
    if (!active) return;
    api
      .get<CodeHorsLigne[]>(`/caisses/${caisseId}/fidelite/codes-hors-ligne`)
      .then((l) => {
        try {
          localStorage.setItem(cleCodes(caisseId), JSON.stringify(l));
        } catch {
          /* mémoire pleine : la liste précédente reste */
        }
      })
      .catch(() => undefined);
  }, [caisseId, active]);

  const liberer = useCallback(
    (reservation: string | null) => {
      if (reservation) void api.post(`/caisses/${caisseId}/fidelite/reservations/${reservation}/liberation`).catch(() => undefined);
    },
    [caisseId],
  );

  async function appliquerCode(saisi: string): Promise<string | null> {
    const brut = saisi.trim().toUpperCase();
    if (!brut) return "Saisis un code.";
    try {
      const r = await api.post<ReservationCaisse>(`/caisses/${caisseId}/fidelite/codes`, { code: brut });
      liberer(code?.reservation ?? null);
      setCode({ ...r.codePromo!, reservation: r.reservation });
      return null;
    } catch (e) {
      if (!sansReseau(e)) return e instanceof Error ? e.message : String(e);
      const jour = jourParis();
      const k = lireCodes(caisseId).find((x) => x.code === brut && x.debut <= jour && jour <= x.fin);
      if (!k) return "Pas de réseau : seuls les codes sans plafond déjà connus de la tablette marchent hors ligne.";
      setCode({ code: k.code, type: k.type, valeur: k.valeur, reservation: null });
      return null;
    }
  }

  function retirerCode() {
    liberer(code?.reservation ?? null);
    setCode(null);
  }

  async function soldeAbonne(numero: string): Promise<PointsAbonneCaisse | string> {
    try {
      return await api.get<PointsAbonneCaisse>(`/caisses/${caisseId}/fidelite/abonnes/${encodeURIComponent(normaliserNumeroAbonne(numero))}`);
    } catch (e) {
      return sansReseau(e) ? "Points indisponibles sans réseau." : e instanceof Error ? e.message : String(e);
    }
  }

  async function reserverPoints(numero: string, paliers: number): Promise<string | null> {
    try {
      const r = await api.post<ReservationCaisse>(`/caisses/${caisseId}/fidelite/points`, { numero, paliers });
      liberer(points?.reservation ?? null);
      setPoints({ ...r.points!, reservation: r.reservation! });
      return null;
    } catch (e) {
      return sansReseau(e) ? "Points indisponibles sans réseau." : e instanceof Error ? e.message : String(e);
    }
  }

  function retirerPoints() {
    liberer(points?.reservation ?? null);
    setPoints(null);
  }

  /** Après l'encaissement : les réservations sont consommées par le ticket, on ne les rend pas. */
  function vider() {
    setCode(null);
    setPoints(null);
  }

  const vente: FideliteVente | null = code || points ? { codePromo: code, points } : null;
  return { code, points, vente, appliquerCode, retirerCode, soldeAbonne, reserverPoints, retirerPoints, vider };
}

export type FideliteCaisse = ReturnType<typeof useFideliteCaisse>;

/** Bloc « Fidélité » du ticket : code promo, et points quand le ticket est celui d'un abonné. */
export function BlocFidelite({ f, numeroAbonne, resteAPayer }: { f: FideliteCaisse; numeroAbonne: string | null; resteAPayer: number }) {
  const [saisie, setSaisie] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [solde, setSolde] = useState<PointsAbonneCaisse | null>(null);
  const [paliers, setPaliers] = useState(1);
  const [enCours, setEnCours] = useState(false);

  // Changer d'abonné rend ses points et oublie le solde lu.
  useEffect(() => {
    setSolde(null);
    if (f.points && f.points.numero !== (numeroAbonne ? normaliserNumeroAbonne(numeroAbonne) : null)) f.retirerPoints();
  }, [numeroAbonne]); // eslint-disable-line react-hooks/exhaustive-deps

  async function code() {
    setEnCours(true);
    setErreur(await f.appliquerCode(saisie));
    setEnCours(false);
    setSaisie("");
  }
  async function voirSolde() {
    if (!numeroAbonne) return;
    setEnCours(true);
    const r = await f.soldeAbonne(numeroAbonne);
    setEnCours(false);
    if (typeof r === "string") {
      setErreur(r);
      setSolde(null);
    } else {
      setErreur(null);
      setSolde(r);
      setPaliers(1);
    }
  }
  async function utiliser() {
    if (!solde) return;
    setEnCours(true);
    const e = await f.reserverPoints(solde.numero, paliers);
    setEnCours(false);
    setErreur(e);
    if (!e) setSolde(null);
  }

  // Pas plus de paliers que ce qui reste à payer (les points ne rendent pas de monnaie).
  const maxUtile = solde ? Math.min(solde.paliersMax, Math.floor(resteAPayer / solde.valeurPalier)) : 0;

  return (
    <div className="cmd-fidelite">
      <div className="cmd-blocklabel">Fidélité</div>
      {f.code ? (
        <div className="cmd-fid-ligne">
          <Ticket size={14} /> Code <strong>{f.code.code}</strong> · {f.code.type === "pourcentage" ? `−${(f.code.valeur / 100).toLocaleString("fr-FR")} %` : `−${formaterMontant(f.code.valeur)}`}
          {f.code.reservation === null && <span className="discret"> (sans plafond)</span>}
          <button className="cmd-fid-retirer" onClick={f.retirerCode} aria-label="Retirer le code promo">
            <X size={14} />
          </button>
        </div>
      ) : (
        <form
          className="cmd-offert-row"
          onSubmit={(e) => {
            e.preventDefault();
            void code();
          }}
        >
          <input type="text" value={saisie} onChange={(e) => setSaisie(e.target.value.toUpperCase())} placeholder="Code promo" maxLength={30} autoCapitalize="characters" aria-label="Code promo" />
          <button className="cmd-pill" disabled={!saisie.trim() || enCours}>
            Appliquer
          </button>
        </form>
      )}

      {numeroAbonne &&
        (f.points ? (
          <div className="cmd-fid-ligne">
            <Gift size={14} /> <strong>{f.points.points} points</strong> · −{formaterMontant(f.points.montant)}
            <button className="cmd-fid-retirer" onClick={f.retirerPoints} aria-label="Rendre les points">
              <X size={14} />
            </button>
          </div>
        ) : solde ? (
          <div className="cmd-fid-solde">
            <div>
              {solde.nom} : <strong>{solde.disponibles} points</strong>
              {solde.disponibles !== solde.solde && <span className="discret"> ({solde.solde - solde.disponibles} réservés ailleurs)</span>} · {solde.palierPoints} points = {formaterMontant(solde.valeurPalier)}
            </div>
            {maxUtile === 0 ? (
              <div className="aide">{solde.paliersMax === 0 ? "Pas encore assez de points pour un palier." : "Le ticket est trop petit pour un palier de points."}</div>
            ) : (
              <div className="cmd-fid-paliers">
                <button className="cmd-stepbtn" onClick={() => setPaliers((p) => Math.max(1, p - 1))} aria-label="Un palier de moins">−</button>
                <span className="chiffre">
                  {Math.min(paliers, maxUtile) * solde.palierPoints} pts = {formaterMontant(Math.min(paliers, maxUtile) * solde.valeurPalier)}
                </span>
                <button className="cmd-stepbtn" onClick={() => setPaliers((p) => Math.min(maxUtile, p + 1))} aria-label="Un palier de plus">+</button>
                <button className="cmd-pill on" disabled={enCours} onClick={() => void utiliser()}>
                  Utiliser
                </button>
              </div>
            )}
          </div>
        ) : (
          <button className="cmd-pill" disabled={enCours} onClick={() => void voirSolde()}>
            <Gift size={14} /> Points de l'abonné
          </button>
        ))}
      {erreur && <div className="cmd-blockmsg">{erreur}</div>}
    </div>
  );
}

