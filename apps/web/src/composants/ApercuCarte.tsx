import { formaterMontant } from "@flaix/domain";

/*
 * Aperçu de la carte abonné (dossier §15.148), à l'image de ce qu'affichent Apple Wallet et Google Wallet. C'est une
 * approximation : chaque téléphone met en page à sa façon, mais les éléments, leur ordre et les couleurs sont les mêmes.
 */

export interface ContenuApercu {
  lieu: string;
  couleurs: { fond: string; texte: string; libelles: string };
  titre: string;
  afficherNomLieu: boolean;
  libellePoints: string;
  nom: string;
  numero: string;
  points: number | null;
  reduction: number | null;
  remise: string | null;
  logo: string | null;
  banniere: string | null;
}

function Champ({ libelle, valeur, couleurs, grand, droite }: { libelle: string; valeur: string; couleurs: ContenuApercu["couleurs"]; grand?: boolean; droite?: boolean }) {
  return (
    <div style={{ textAlign: droite ? "right" : "left", minWidth: 0 }}>
      <div style={{ fontSize: 10, letterSpacing: ".06em", textTransform: "uppercase", color: couleurs.libelles, opacity: 0.9 }}>{libelle}</div>
      <div style={{ fontSize: grand ? 30 : 15, fontWeight: grand ? 300 : 600, color: couleurs.texte, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{valeur}</div>
    </div>
  );
}

/** Emplacement du QR code (le vrai est fabriqué par Apple et Google à partir du n° d'abonné). */
function Qr({ numero }: { numero: string }) {
  return (
    <div style={{ display: "grid", justifyItems: "center", gap: 4 }}>
      <div
        aria-hidden
        style={{
          width: 92,
          height: 92,
          borderRadius: 8,
          background: "#fff",
          backgroundImage: "repeating-conic-gradient(#111 0 25%, #fff 0 50%)",
          backgroundSize: "18px 18px",
          border: "8px solid #fff",
          boxShadow: "0 0 0 1px rgba(0,0,0,.08)",
        }}
      />
      <span style={{ fontSize: 11, background: "#fff", color: "#111", padding: "1px 8px", borderRadius: 6 }}>{numero}</span>
    </div>
  );
}

export function ApercuCarte({ c, modele, qr = true }: { c: ContenuApercu; modele: "apple" | "google"; qr?: boolean }) {
  const points = c.points === null ? null : c.points.toLocaleString("fr-FR");
  const reduction = c.reduction === null ? null : formaterMontant(c.reduction);
  const cadre = { background: c.couleurs.fond, color: c.couleurs.texte, borderRadius: 16, overflow: "hidden", boxShadow: "0 10px 30px rgba(0,0,0,.18)", maxWidth: 360, width: "100%" } as const;

  if (modele === "apple") {
    return (
      <section aria-label="Aperçu Apple Wallet" style={cadre}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 14px", minHeight: 50 }}>
          {c.logo && <img src={c.logo} alt="" style={{ maxHeight: 34, maxWidth: 110, objectFit: "contain" }} />}
          {c.afficherNomLieu && <strong style={{ fontSize: 15, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.lieu}</strong>}
          <span style={{ marginLeft: "auto", fontSize: 13, fontWeight: 600, whiteSpace: "nowrap" }}>{c.titre}</span>
        </div>
        <div
          style={{
            minHeight: 96,
            padding: "10px 14px",
            display: "flex",
            alignItems: "flex-end",
            backgroundImage: c.banniere ? `url("${c.banniere}")` : undefined,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <Champ libelle={points === null ? "Abonné" : c.libellePoints} valeur={points ?? c.nom} couleurs={c.couleurs} grand />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, padding: "10px 14px" }}>
          {points !== null && <Champ libelle="Abonné" valeur={c.nom} couleurs={c.couleurs} />}
          {reduction !== null && <Champ libelle="Réduction disponible" valeur={reduction} couleurs={c.couleurs} droite />}
          <Champ libelle="N° d'abonné" valeur={c.numero} couleurs={c.couleurs} />
          {c.remise && <Champ libelle="Remise abonné" valeur={c.remise} couleurs={c.couleurs} droite />}
        </div>
        {qr && (
          <div style={{ padding: "6px 0 16px" }}>
            <Qr numero={c.numero} />
          </div>
        )}
      </section>
    );
  }

  return (
    <section aria-label="Aperçu Google Wallet" style={cadre}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 16px 6px" }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#fff", overflow: "hidden", flex: "none" }}>{c.logo && <img src={c.logo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}</div>
        <span style={{ fontSize: 14, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.lieu}</span>
      </div>
      <div style={{ padding: "4px 16px 10px" }}>
        <div style={{ fontSize: 20, fontWeight: 500 }}>{c.titre}</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 12 }}>
          <Champ libelle="Abonné" valeur={c.nom} couleurs={{ ...c.couleurs, libelles: c.couleurs.texte }} />
          <Champ libelle="N° d'abonné" valeur={c.numero} couleurs={{ ...c.couleurs, libelles: c.couleurs.texte }} droite />
          {points !== null && <Champ libelle={c.libellePoints} valeur={points} couleurs={{ ...c.couleurs, libelles: c.couleurs.texte }} />}
          {reduction !== null && <Champ libelle="Réduction" valeur={reduction} couleurs={{ ...c.couleurs, libelles: c.couleurs.texte }} droite />}
        </div>
      </div>
      {qr && (
        <div style={{ padding: "4px 0 14px" }}>
          <Qr numero={c.numero} />
        </div>
      )}
      {c.banniere && <img src={c.banniere} alt="" style={{ display: "block", width: "100%", aspectRatio: "1032 / 336", objectFit: "cover" }} />}
    </section>
  );
}
