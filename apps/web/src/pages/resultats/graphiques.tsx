import { useState, type ReactNode } from "react";
import { formaterMontant, type ProduitVendu, type RepereMarges } from "@flaix/domain";
import { aRevoir, margeParVente } from "@flaix/domain";

/*
 * Graphiques de Résultats (dossier §15.103), repris de la maquette v2.1 validée : traits fins,
 * extrémités arrondies, 2 px d'écart entre les parts, étiquettes en couleur de texte (jamais en
 * couleur de série), légende chiffrée, lecture au survol.
 */

export const euros = (c: number) => formaterMontant(c);
const fr = (n: number, d = 0) => n.toLocaleString("fr-FR", { minimumFractionDigits: d, maximumFractionDigits: d });
/** Montant court pour un axe : 1 250 € → « 1,3 k€ » ; signe moins typographique. */
export const eurosAxe = (c: number) => {
  const signe = c < 0 ? "−" : "";
  const a = Math.abs(c);
  return a >= 100_000 ? `${signe}${fr(a / 100_000, a % 100_000 ? 1 : 0)} k€` : `${signe}${fr(a / 100)} €`;
};
/** Étiquette d'une barre : au centime près tant que le montant est petit, en k€ au-delà de 1 000 €. */
const eurosEtiquette = (c: number) => (Math.abs(c) >= 100_000 ? eurosAxe(c) : (c < 0 ? "−" : "") + euros(Math.abs(c)));

/** Maximum « rond » et graduations d'un axe qui part de zéro (`entier` : jamais de demi-unité). */
export function axe(max: number, cible = 4, entier = false): { max: number; ticks: number[] } {
  if (max <= 0) return { max: 1, ticks: [0, 1] };
  const brut = max / cible;
  const puissance = 10 ** Math.floor(Math.log10(brut));
  const pas = Math.max(entier ? 1 : 0, [1, 2, 2.5, 5, 10].map((m) => m * puissance).find((p) => p >= brut)!);
  const haut = Math.ceil(max / pas) * pas;
  const ticks: number[] = [];
  for (let t = 0; t <= haut + pas / 2; t += pas) ticks.push(t);
  return { max: haut, ticks };
}

/** Courbe lissée sans dépassement (interpolation monotone), comme la maquette. */
export function lisse(p: [number, number][]): string {
  const n = p.length;
  if (n === 0) return "";
  if (n === 1) return `M${p[0]![0]} ${p[0]![1]}`;
  const dx: number[] = [], m: number[] = [], t: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    dx[i] = p[i + 1]![0] - p[i]![0];
    m[i] = (p[i + 1]![1] - p[i]![1]) / dx[i]!;
  }
  t[0] = m[0]!;
  t[n - 1] = m[n - 2]!;
  for (let i = 1; i < n - 1; i++) t[i] = m[i - 1]! * m[i]! <= 0 ? 0 : (3 * (dx[i - 1]! + dx[i]!)) / ((2 * dx[i]! + dx[i - 1]!) / m[i - 1]! + (dx[i]! + 2 * dx[i - 1]!) / m[i]!);
  let d = `M${p[0]![0].toFixed(1)} ${p[0]![1].toFixed(1)}`;
  for (let i = 0; i < n - 1; i++) {
    const h = dx[i]! / 3;
    d += ` C${(p[i]![0] + h).toFixed(1)} ${(p[i]![1] + t[i]! * h).toFixed(1)} ${(p[i + 1]![0] - h).toFixed(1)} ${(p[i + 1]![1] - t[i + 1]! * h).toFixed(1)} ${p[i + 1]![0].toFixed(1)} ${p[i + 1]![1].toFixed(1)}`;
  }
  return d;
}

let compteur = 0;
const idUnique = (prefixe: string) => `${prefixe}${++compteur}`;

/** Bulle d'information placée en pourcentage de la zone du graphique. */
export function Bulle({ x, y, children }: { x: number; y: number; children: ReactNode }) {
  return (
    <div className="bulle" role="status" style={{ left: `${x}%`, top: `${y}%` }}>
      {children}
    </div>
  );
}

export function LigneBulle({ couleur, libelle, valeur }: { couleur?: string; libelle: string; valeur: string }) {
  return (
    <div className="lb">
      {couleur && <i style={{ background: couleur }} />}
      {libelle}
      <strong>{valeur}</strong>
    </div>
  );
}

export function MiniCourbe({ serie, clair }: { serie: number[]; clair: boolean }) {
  const [id] = useState(() => idUnique("spk"));
  if (serie.length === 0) return <svg viewBox="0 0 200 34" aria-hidden="true" />;
  const max = Math.max(...serie), min = Math.min(...serie, 0);
  const pts: [number, number][] =
    serie.length === 1 ? [[0, 17], [200, 17]] : serie.map((v, i) => [(i / (serie.length - 1)) * 200, 31 - ((v - min) / (max - min || 1)) * 26]);
  const d = lisse(pts);
  const trait = clair ? "rgba(255,255,255,.95)" : "var(--violet)";
  const der = pts[pts.length - 1]!;
  return (
    <svg viewBox="0 0 200 34" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style={{ stopColor: clair ? "rgba(255,255,255,.35)" : "var(--violet)", stopOpacity: clair ? 1 : 0.22 }} />
          <stop offset="1" style={{ stopColor: clair ? "rgba(255,255,255,.35)" : "var(--violet)", stopOpacity: 0 }} />
        </linearGradient>
      </defs>
      <path d={`${d} L200 34 L0 34 Z`} fill={`url(#${id})`} />
      <path d={d} fill="none" stroke={trait} strokeWidth={2} vectorEffect="non-scaling-stroke" />
      <circle cx={der[0]} cy={der[1]} r={2.5} fill={trait} />
    </svg>
  );
}

/** CA par heure : aire en dégradé pour ce match, pointillé pour la comparaison, viseur au survol. */
export function CourbeHeures({
  heures,
  actuel,
  avant,
  libelleActuel,
  libelleAvant,
}: {
  heures: string[];
  actuel: number[];
  avant: number[] | null;
  libelleActuel: string;
  libelleAvant: string | null;
}) {
  const [id] = useState(() => idUnique("ca"));
  const [survol, setSurvol] = useState<number | null>(null);
  const L = 760, H = 250, g = { x0: 64, x1: 740, y0: 212, y1: 24 };
  const { max, ticks } = axe(Math.max(...actuel, ...(avant ?? [0]), 1));
  const n = heures.length;
  const x = (i: number) => (n === 1 ? (g.x0 + g.x1) / 2 : g.x0 + (i / (n - 1)) * (g.x1 - g.x0));
  const y = (v: number) => g.y0 - (v / max) * (g.y0 - g.y1);
  const pc = actuel.map((v, i) => [x(i), y(v)] as [number, number]);
  const pp = avant?.map((v, i) => [x(i), y(v)] as [number, number]) ?? null;
  const dc = lisse(pc);
  const iPic = actuel.indexOf(Math.max(...actuel));
  function bouger(e: React.PointerEvent<SVGRectElement>) {
    const r = (e.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect();
    const sx = ((e.clientX - r.left) / r.width) * L;
    setSurvol(n === 1 ? 0 : Math.max(0, Math.min(n - 1, Math.round(((sx - g.x0) / (g.x1 - g.x0)) * (n - 1)))));
  }
  return (
    <div className="graphe">
      <svg viewBox={`0 0 ${L} ${H}`} role="img" aria-label={`Chiffre d'affaires par heure, ${libelleActuel}${libelleAvant ? ` comparé à ${libelleAvant}` : ""}`}>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" style={{ stopColor: "var(--violet)", stopOpacity: 0.3 }} />
            <stop offset="1" style={{ stopColor: "var(--violet)", stopOpacity: 0 }} />
          </linearGradient>
        </defs>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={g.x0} x2={g.x1} y1={y(t)} y2={y(t)} stroke="var(--border)" strokeWidth={1} />
            <text x={g.x0 - 10} y={y(t) + 4} fontSize={11.5} textAnchor="end" fill="var(--muted)">
              {t ? eurosAxe(t) : "0"}
            </text>
          </g>
        ))}
        {n > 1 && <path d={`${dc} L${x(n - 1)} ${g.y0} L${x(0)} ${g.y0} Z`} fill={`url(#${id})`} />}
        {pp && n > 1 && <path d={lisse(pp)} fill="none" stroke="var(--gris-graph)" strokeWidth={2} strokeDasharray="5 5" strokeLinecap="round" />}
        {n > 1 && <path d={dc} fill="none" stroke="var(--violet)" strokeWidth={2.5} strokeLinecap="round" />}
        {heures.map((h, i) => (
          <text key={h + i} x={x(i)} y={g.y0 + 22} fontSize={11.5} textAnchor="middle" fill="var(--muted)">
            {h}
          </text>
        ))}
        <circle cx={pc[iPic]![0]} cy={pc[iPic]![1]} r={5} fill="var(--violet)" stroke="var(--surface)" strokeWidth={2} />
        {survol === null && (
          <text
            x={pc[iPic]![0]}
            y={pc[iPic]![1] - 13}
            fontSize={12}
            fontWeight={700}
            textAnchor={pc[iPic]![0] > g.x1 - 90 ? "end" : pc[iPic]![0] < g.x0 + 90 ? "start" : "middle"}
            fill="var(--ink)"
          >
            Pic · {euros(actuel[iPic]!)}
          </text>
        )}
        {survol !== null && (
          <g>
            <line x1={x(survol)} x2={x(survol)} y1={g.y1} y2={g.y0} stroke="var(--muted)" strokeWidth={1} strokeDasharray="3 3" />
            {avant && <circle cx={x(survol)} cy={y(avant[survol]!)} r={4.5} fill="var(--surface)" stroke="var(--gris-graph)" strokeWidth={2} />}
            <circle cx={x(survol)} cy={y(actuel[survol]!)} r={5.5} fill="var(--violet)" stroke="var(--surface)" strokeWidth={2} />
          </g>
        )}
        <rect x={g.x0 - 30} y={g.y1} width={g.x1 - g.x0 + 60} height={g.y0 - g.y1 + 14} fill="transparent" onPointerMove={bouger} onPointerLeave={() => setSurvol(null)} />
      </svg>
      {survol !== null && (
        <Bulle x={(x(survol) / L) * 100} y={(y(Math.max(actuel[survol]!, avant?.[survol] ?? 0)) / H) * 100}>
          <b>{heures[survol]}</b>
          <LigneBulle couleur="var(--violet)" libelle={libelleActuel} valeur={euros(actuel[survol]!)} />
          {avant && libelleAvant && <LigneBulle couleur="var(--gris-graph)" libelle={libelleAvant} valeur={euros(avant[survol]!)} />}
        </Bulle>
      )}
    </div>
  );
}

export interface Part {
  nom: string;
  v: number;
  couleur: string;
}

/** Anneau (camembert creux) : 2,5 px d'écart entre les parts, légende chiffrée qui réagit au survol. */
export function Anneau({ parts, centre }: { parts: Part[]; centre: { valeur: string; libelle: string } }) {
  const [actif, setActif] = useState<number | null>(null);
  const total = parts.reduce((s, p) => s + p.v, 0) || 1;
  const cx = 100, cy = 100, R = 94, r = 66, ecart = 2.5;
  const pt = (rad: number, a: number) => `${(cx + rad * Math.cos(a)).toFixed(2)} ${(cy + rad * Math.sin(a)).toFixed(2)}`;
  let a = -Math.PI / 2;
  const chemins = parts.map((p) => {
    const b = a + (p.v / total) * 2 * Math.PI;
    const dR = ecart / 2 / R, dr = ecart / 2 / r, grand = b - a > Math.PI ? 1 : 0;
    const d =
      parts.length === 1
        ? `M${cx} ${cy - R} A${R} ${R} 0 1 1 ${cx - 0.01} ${cy - R} L${cx - 0.01} ${cy - r} A${r} ${r} 0 1 0 ${cx} ${cy - r} Z`
        : `M${pt(R, a + dR)} A${R} ${R} 0 ${grand} 1 ${pt(R, b - dR)} L${pt(r, b - dr)} A${r} ${r} 0 ${grand} 0 ${pt(r, a + dr)} Z`;
    a = b;
    return d;
  });
  const choisie = actif === null ? null : parts[actif]!;
  return (
    <div className="anneau-conteneur">
    <div className="anneau-bloc" onPointerLeave={() => setActif(null)}>
      <svg viewBox="0 0 200 200" role="img" aria-label={parts.map((p) => `${p.nom} ${fr((p.v / total) * 100)} %`).join(", ")}>
        {chemins.map((d, k) => (
          <path key={k} className="part" d={d} fill={parts[k]!.couleur} style={{ opacity: actif === null || actif === k ? 1 : 0.28 }} onPointerEnter={() => setActif(k)} />
        ))}
        <text x={100} y={102} textAnchor="middle" fontSize={choisie ? 18 : 20} fontWeight={800} fill="var(--ink)">
          {choisie ? euros(choisie.v) : centre.valeur}
        </text>
        <text x={100} y={123} textAnchor="middle" fontSize={11.5} fill="var(--muted)">
          {choisie ? `${choisie.nom.slice(0, 16)} · ${fr((choisie.v / total) * 100)} %` : centre.libelle}
        </text>
      </svg>
      <div className="leg-liste">
        {parts.map((p, k) => (
          <div key={p.nom} className={`leg-ligne${actif === k ? " actif" : ""}`} onPointerEnter={() => setActif(k)}>
            <i className="pastille" style={{ background: p.couleur }} />
            <span>{p.nom}</span>
            <span className="v">{euros(p.v)}</span>
            <span className="p">{fr((p.v / total) * 100)} %</span>
          </div>
        ))}
      </div>
    </div>
    </div>
  );
}

export interface EtapeCascade {
  l1: string;
  l2?: string;
  v: number;
  total: boolean;
  aide: string;
}

/** Cascade : les totaux en violet, ce qui est retiré en gris, reliés par un pointillé. */
export function Cascade({ etapes }: { etapes: EtapeCascade[] }) {
  const [survol, setSurvol] = useState<number | null>(null);
  const L = 760, H = 300, g = { x0: 64, x1: 748, y0: 244, y1: 30 };
  const { max, ticks } = axe(Math.max(...etapes.map((e) => Math.abs(e.v)), 1));
  const y = (v: number) => g.y0 - (v / max) * (g.y0 - g.y1);
  const bande = (g.x1 - g.x0) / etapes.length, lb = Math.min(48, bande * 0.55);
  let cumul = 0;
  const barres = etapes.map((e, i) => {
    const haut = e.total ? e.v : cumul, bas = e.total ? 0 : cumul + e.v;
    const x = g.x0 + bande * i + (bande - lb) / 2;
    const avant = cumul;
    cumul = e.total ? e.v : cumul + e.v;
    return { e, x, haut, bas, avant };
  });
  return (
    <div className="graphe">
      <svg viewBox={`0 0 ${L} ${H}`} role="img" aria-label={etapes.map((e) => `${e.l1} ${e.l2 ?? ""} ${euros(e.v)}`).join(", ")}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={g.x0} x2={g.x1} y1={y(t)} y2={y(t)} stroke="var(--border)" strokeWidth={1} />
            <text x={g.x0 - 10} y={y(t) + 4} fontSize={11.5} textAnchor="end" fill="var(--muted)">
              {t ? eurosAxe(t) : "0"}
            </text>
          </g>
        ))}
        {barres.map(({ e, x, haut, bas, avant }, i) => (
          <g key={i} onPointerEnter={() => setSurvol(i)} onPointerLeave={() => setSurvol(null)}>
            {i > 0 && <line x1={barres[i - 1]!.x + lb} x2={x} y1={y(avant)} y2={y(avant)} stroke="var(--gris-graph)" strokeWidth={1} strokeDasharray="3 3" />}
            <rect x={x - 8} y={g.y1} width={lb + 16} height={g.y0 - g.y1} fill="transparent" />
            <rect x={x} y={y(haut)} width={lb} height={Math.max(2, y(bas) - y(haut))} rx={4} fill={e.total ? "var(--violet)" : "var(--gris-graph)"} />
            <text x={x + lb / 2} y={y(haut) - 8} fontSize={11.5} textAnchor="middle" fontWeight={e.total ? 700 : 400} fill={e.total ? "var(--ink)" : "var(--muted)"}>
              {eurosEtiquette(e.v)}
            </text>
            <text x={x + lb / 2} y={g.y0 + 19} fontSize={11} textAnchor="middle" fill="var(--text)">
              {e.l1}
            </text>
            {e.l2 && (
              <text x={x + lb / 2} y={g.y0 + 33} fontSize={11} textAnchor="middle" fill="var(--text)">
                {e.l2}
              </text>
            )}
          </g>
        ))}
      </svg>
      {survol !== null && (
        <Bulle x={((barres[survol]!.x + lb / 2) / L) * 100} y={(y(barres[survol]!.haut) / H) * 100}>
          <b>
            {barres[survol]!.e.l1} {barres[survol]!.e.l2 ?? ""}
          </b>
          <div>{euros(barres[survol]!.e.v)}</div>
          <div style={{ opacity: 0.8 }}>{barres[survol]!.e.aide}</div>
        </Bulle>
      )}
    </div>
  );
}

/** Nuage « ce qui se vend × ce qui rapporte » : repères = médianes, zone « à revoir » en ambre. */
export function Nuage({ produits, repere }: { produits: ProduitVendu[]; repere: RepereMarges }) {
  const [survol, setSurvol] = useState<number | null>(null);
  const points = produits.filter((p) => p.quantite > 0 && margeParVente(p) !== null);
  const L = 740, H = 360, g = { x0: 70, x1: 720, y0: 300, y1: 34 };
  const ax = axe(Math.max(...points.map((p) => p.quantite), 1), 4, true);
  const ay = axe(Math.max(...points.map((p) => margeParVente(p)!), 1));
  const x = (v: number) => g.x0 + (v / ax.max) * (g.x1 - g.x0);
  const y = (v: number) => g.y0 - (Math.max(v, 0) / ay.max) * (g.y0 - g.y1);
  return (
    <div className="graphe">
      <svg viewBox={`0 0 ${L} ${H}`} role="img" aria-label="Chaque produit placé selon ses ventes et sa marge par vente">
        <rect x={x(repere.quantite)} y={y(repere.margeParVente)} width={g.x1 - x(repere.quantite)} height={g.y0 - y(repere.margeParVente)} fill="var(--amber-soft)" />
        {ay.ticks.map((t) => (
          <g key={t}>
            <line x1={g.x0} x2={g.x1} y1={y(t)} y2={y(t)} stroke="var(--border)" strokeWidth={1} />
            <text x={g.x0 - 10} y={y(t) + 4} fontSize={11.5} textAnchor="end" fill="var(--muted)">
              {eurosAxe(t)}
            </text>
          </g>
        ))}
        {ax.ticks.map((t) => (
          <text key={t} x={x(t)} y={g.y0 + 18} fontSize={11.5} textAnchor="middle" fill="var(--muted)">
            {fr(t)}
          </text>
        ))}
        <line x1={x(repere.quantite)} x2={x(repere.quantite)} y1={g.y1} y2={g.y0} stroke="var(--gris-graph)" strokeWidth={1} strokeDasharray="4 4" />
        <line x1={g.x0} x2={g.x1} y1={y(repere.margeParVente)} y2={y(repere.margeParVente)} stroke="var(--gris-graph)" strokeWidth={1} strokeDasharray="4 4" />
        <text x={g.x0 + 8} y={g.y1 + 14} fontSize={11.5} fontWeight={700} fill="var(--text)">À mettre en avant</text>
        <text x={g.x1 - 8} y={g.y1 + 14} fontSize={11.5} fontWeight={700} textAnchor="end" fill="var(--text)">Locomotives</text>
        <text x={g.x0 + 8} y={g.y0 - 8} fontSize={11.5} fontWeight={700} fill="var(--text)">Secondaires</text>
        <text x={g.x1 - 8} y={g.y0 - 8} fontSize={11.5} fontWeight={700} textAnchor="end" fill="var(--amber)">À revoir</text>
        <text x={(g.x0 + g.x1) / 2} y={H - 8} fontSize={11.5} textAnchor="middle" fill="var(--muted)">Ventes du match (unités)</text>
        <text x={8} y={16} fontSize={11.5} fill="var(--muted)">Marge par vente</text>
        {points.map((p, i) => {
          const revoir = aRevoir(p, repere);
          const cx = x(p.quantite), cy = y(margeParVente(p)!);
          const droite = cx < g.x1 - 110;
          return (
            <g key={p.produitId} onPointerEnter={() => setSurvol(i)} onPointerLeave={() => setSurvol(null)}>
              <circle cx={cx} cy={cy} r={14} fill="transparent" />
              <circle cx={cx} cy={cy} r={6} fill={revoir ? "var(--amber)" : "var(--violet)"} stroke="var(--surface)" strokeWidth={2} />
              <text x={droite ? cx + 11 : cx - 11} y={cy + 4} fontSize={11.5} textAnchor={droite ? "start" : "end"} fill="var(--text)">
                {p.nom}
              </text>
            </g>
          );
        })}
      </svg>
      {survol !== null && (
        <Bulle x={(x(points[survol]!.quantite) / L) * 100} y={(y(margeParVente(points[survol]!)!) / H) * 100}>
          <b>{points[survol]!.nom}</b>
          <div>
            {points[survol]!.quantite} ventes · {euros(Math.round(margeParVente(points[survol]!)!))} de marge par vente
          </div>
          <div>Marge totale : {euros(points[survol]!.marge!)}</div>
          {aRevoir(points[survol]!, repere) && <div>À revoir : beaucoup vendu, peu de marge</div>}
        </Bulle>
      )}
    </div>
  );
}

/** Chaque stand d'un match à l'autre : point gris = avant, point violet = ce match. */
export function Duo({ lignes, libelleA, libelleB }: { lignes: { nom: string; a: number; b: number }[]; libelleA: string; libelleB: string }) {
  const { max, ticks } = axe(Math.max(...lignes.flatMap((l) => [l.a, l.b]), 1), 3);
  const pos = (v: number) => (v / max) * 100;
  return (
    <div className="duo">
      {lignes.map((l) => {
        const d = l.a > 0 ? ((l.b - l.a) / l.a) * 100 : null;
        const gauche = Math.min(pos(l.a), pos(l.b)), largeur = Math.abs(pos(l.b) - pos(l.a));
        return (
          <div key={l.nom} className="duo-ligne">
            <span>{l.nom}</span>
            <div className="duo-piste" role="img" aria-label={`${l.nom} : ${libelleA} ${euros(l.a)}, ${libelleB} ${euros(l.b)}`}>
              <span className="duo-trait" style={{ left: `${gauche}%`, width: `${largeur}%` }} />
              <span className="duo-point avant" style={{ left: `${pos(l.a)}%` }} title={`${libelleA} : ${euros(l.a)}`} />
              <span className="duo-point maintenant" style={{ left: `${pos(l.b)}%` }} title={`${libelleB} : ${euros(l.b)}`} />
            </div>
            <span className="duo-val">
              <strong>{euros(l.b)}</strong>
              <em className={d === null ? "variation neutre" : d >= 0 ? "variation hausse" : "variation baisse"}>{d === null ? "nouveau" : `${d >= 0 ? "+" : "−"}${fr(Math.abs(d), 1)} %`}</em>
            </span>
          </div>
        );
      })}
      <div className="duo-ligne duo-axe">
        <span />
        <div className="duo-piste">
          {ticks.map((t) => (
            <span key={t} className="tic" style={{ left: `${pos(t)}%` }}>
              {eurosAxe(t)}
            </span>
          ))}
        </div>
        <span />
      </div>
    </div>
  );
}

/** Une seule barre empilée + légende chiffrée (2 ou 3 valeurs : jamais de camembert, §15.95). */
export function Empile({ parts }: { parts: Part[] }) {
  const total = parts.reduce((s, p) => s + p.v, 0) || 1;
  const visibles = parts.filter((p) => p.v > 0);
  return (
    <>
      <div className="empile" role="img" aria-label={parts.map((p) => `${p.nom} ${fr((p.v / total) * 100, 1)} %`).join(", ")}>
        {visibles.map((p) => (
          <span key={p.nom} style={{ width: `${(p.v / total) * 100}%`, background: p.couleur }} title={`${p.nom} : ${euros(p.v)}`} />
        ))}
      </div>
      <div className="leg-liste">
        {parts.map((p) => (
          <div key={p.nom} className="leg-ligne">
            <i className="pastille" style={{ background: p.couleur }} />
            <span>{p.nom}</span>
            <span className="v">{euros(p.v)}</span>
            <span className="p">{fr((p.v / total) * 100, 1)} %</span>
          </div>
        ))}
      </div>
    </>
  );
}
