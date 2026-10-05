import { describe, expect, it } from "vitest";
import { formaterSecondes, tempsDeService, type TicketMesure } from "./temps-service.ts";

const S = 1_000;
const T0 = Date.UTC(2026, 9, 4, 19, 0);

/** Une suite de commandes : [secondes de saisie, secondes d'attente avant le client suivant]. */
function suite(caisse: number, stand: string, commandes: [number, number][], depart = T0): TicketMesure[] {
  let t = depart;
  return commandes.map(([saisie, pause]) => {
    const debut = t;
    const fin = t + saisie * S;
    t = fin + pause * S;
    return { caisse, stand, debut, fin };
  });
}

describe("temps de prise de commande (§15.139)", () => {
  it("mi-temps : 6 commandes de 30 s, le client suivant à 5 s → toutes en file après la première, 103 commandes par heure", () => {
    const t = tempsDeService(suite(3, "Buvette Nord", Array.from({ length: 6 }, () => [30, 5] as [number, number])));
    // Écart entre deux encaissements en file : 5 s + 30 s = 35 s → 3 600 / 35 = 102,9.
    expect(t.parCaisse).toEqual([{ libelle: "Caisse 3 (Buvette Nord)", commandes: 6, dureeMediane: 30, enFile: 5, mesurables: 5, cadenceEnFile: 103 }]);
    expect(t.parStand[0]).toMatchObject({ libelle: "Buvette Nord", commandes: 6, dureeMediane: 30 });
  });

  it("une caisse qui attend ses clients : le temps sans client n'entre dans aucune moyenne", () => {
    const t = tempsDeService(suite(1, "Buvette Sud", [[40, 300], [50, 240], [45, 600], [40, 120], [60, 400], [42, 0]]));
    expect(t.parCaisse[0]).toMatchObject({ commandes: 6, dureeMediane: 44, enFile: 0, mesurables: 5, cadenceEnFile: null });
  });

  it("[F] une commande oubliée ouverte (40 min) est écartée ; la médiane ignore une commande lente ; sous 5 commandes, pas de médiane", () => {
    const t = tempsDeService(suite(2, "Buvette Nord", [[30, 2], [2_400, 2], [32, 2], [28, 2], [300, 2], [31, 2]]));
    expect(t.parCaisse[0]).toMatchObject({ commandes: 5, dureeMediane: 31 });
    expect(tempsDeService(suite(4, "Bar", [[30, 2], [30, 2]])).parCaisse[0]).toMatchObject({ commandes: 2, dureeMediane: null, cadenceEnFile: null });
  });

  it("un stand réunit ses caisses sans mélanger leurs files ; les tickets sans mesure sont comptés à part", () => {
    const a = suite(1, "Buvette Nord", Array.from({ length: 5 }, () => [20, 3] as [number, number]));
    const b = suite(2, "Buvette Nord", Array.from({ length: 5 }, () => [40, 3] as [number, number]), T0 + 1_000);
    const t = tempsDeService([...a, ...b, { caisse: 2, stand: "Buvette Nord", debut: null, fin: T0 + 3_600 * S }]);
    // Écarts en file : 23 s à la caisse 1, 43 s à la caisse 2 → médiane 33 s → 109 commandes par heure.
    expect(t.parStand).toEqual([{ libelle: "Buvette Nord", commandes: 10, dureeMediane: 30, enFile: 8, mesurables: 8, cadenceEnFile: 109 }]);
    expect(t.sansMesure).toBe(1);
  });

  it("durées écrites en clair", () => {
    expect(formaterSecondes(47)).toBe("47 s");
    expect(formaterSecondes(95)).toBe("1 min 35 s");
    expect(formaterSecondes(120)).toBe("2 min");
  });
});
