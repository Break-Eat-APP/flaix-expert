import { describe, expect, it } from "vitest";
import { clotureADistance, ouvertureCaisse, type EvenementPlanifie } from "./caisse-auto.ts";

/** Caisse automatique selon la date (dossier §15.130). Heures en hiver : Paris = UTC + 1. */
const maintenant = new Date("2026-11-14T17:30:00Z"); // samedi 14 novembre 2026, 18 h 30 à Paris
const evt = (id: string, debut: string, etat: EvenementPlanifie["etat"] = "a_venir"): EvenementPlanifie => ({ id, libelle: id, debut, etat });

describe("sur quel événement la caisse s'ouvre", () => {
  it("rien d'ouvert, un événement prévu aujourd'hui : il s'ouvrira avec la première caisse", () => {
    const o = ouvertureCaisse([evt("Rouen", "2026-11-14T19:00:00Z"), evt("Gap", "2026-11-21T19:00:00Z")], maintenant);
    expect(o).toEqual({ evenement: { id: "Rouen", libelle: "Rouen", debut: "2026-11-14T19:00:00Z", aOuvrir: true }, blocage: null, dejaCloturee: null, prochain: { libelle: "Gap", debut: "2026-11-21T19:00:00Z" } });
  });

  it("un événement prévu à 0 h 30 heure de Paris compte bien pour ce jour-là", () => {
    const o = ouvertureCaisse([evt("Nuit", "2026-11-14T23:30:00Z")], new Date("2026-11-15T00:10:00Z"));
    expect(o.evenement?.id).toBe("Nuit");
  });

  it("deux événements le même jour : le premier qui n'est pas clos", () => {
    const o = ouvertureCaisse([evt("Soir", "2026-11-14T19:00:00Z"), evt("Après-midi", "2026-11-14T13:00:00Z", "clos"), evt("Midi", "2026-11-14T11:00:00Z", "clos")], maintenant);
    expect(o.evenement).toMatchObject({ id: "Soir", aOuvrir: true });
  });

  it("un événement déjà ouvert : la caisse s'ouvre dessus, sans en ouvrir un autre", () => {
    const o = ouvertureCaisse([evt("Rouen", "2026-11-14T19:00:00Z", "ouvert")], maintenant);
    expect(o.evenement).toMatchObject({ id: "Rouen", aOuvrir: false });
  });

  it("[F] l'événement d'hier est resté ouvert et un autre est prévu aujourd'hui : blocage, le directeur doit clôturer", () => {
    const o = ouvertureCaisse([evt("Hier", "2026-11-13T19:00:00Z", "ouvert"), evt("Rouen", "2026-11-14T19:00:00Z")], maintenant);
    // L'événement reste indiqué : seul le directeur peut encore y ouvrir une caisse, averti.
    expect(o.evenement).toMatchObject({ id: "Hier", aOuvrir: false });
    expect(o.blocage).toContain("« Hier »");
    expect(o.blocage).toContain("clôturer");
  });

  it("événement sur plusieurs jours (rien d'autre prévu aujourd'hui) : la caisse rouvre dessus", () => {
    const o = ouvertureCaisse([evt("Festival", "2026-11-13T10:00:00Z", "ouvert")], maintenant);
    expect(o.evenement).toMatchObject({ id: "Festival", aOuvrir: false });
  });

  it("[F] caisse déjà clôturée par le directeur pour l'événement en cours : elle attend le prochain", () => {
    const o = ouvertureCaisse([evt("Rouen", "2026-11-14T19:00:00Z", "ouvert"), evt("Gap", "2026-11-21T19:00:00Z")], maintenant, new Set(["Rouen"]));
    expect(o.evenement).toMatchObject({ id: "Rouen", aOuvrir: false });
    expect(o.dejaCloturee).toContain("Caisse clôturée pour « Rouen »");
    expect(o.dejaCloturee).toContain("« Gap »");
    expect(ouvertureCaisse([evt("Rouen", "2026-11-14T19:00:00Z", "ouvert")], maintenant, new Set(["Autre"])).dejaCloturee).toBeNull();
  });

  it("rien aujourd'hui : la tablette attend et annonce le prochain", () => {
    const o = ouvertureCaisse([evt("Gap", "2026-11-21T19:00:00Z"), evt("Passé", "2026-11-07T19:00:00Z", "clos")], maintenant);
    expect(o.evenement).toBeNull();
    expect(o.blocage).toContain("Aucun événement prévu aujourd'hui");
    expect(o.blocage).toContain("« Gap »");
    expect(o.prochain?.libelle).toBe("Gap");
  });
});

describe("clôture à distance par le directeur", () => {
  const vu = (secondes: number) => new Date(maintenant.getTime() - secondes * 1000).toISOString();

  it("tablette à jour il y a 10 s, rien en attente : possible", () => {
    expect(clotureADistance({ vueLe: vu(10), sequence: 42, attente: 0 }, 42, maintenant)).toEqual({ possible: true, aEnvoyer: 0, raison: null });
  });

  it("[F] tickets encore sur la tablette : impossible, avec leur nombre", () => {
    const r = clotureADistance({ vueLe: vu(5), sequence: 45, attente: 3 }, 42, maintenant);
    expect(r).toMatchObject({ possible: false, aEnvoyer: 3 });
    expect(r.raison).toContain("3 tickets");
  });

  it("[F] tablette muette depuis 25 min : impossible sans forcer", () => {
    const r = clotureADistance({ vueLe: vu(25 * 60), sequence: 42, attente: 0 }, 42, maintenant);
    expect(r.possible).toBe(false);
    expect(r.raison).toContain("25 min");
  });

  it("[F] tablette qui n'a jamais donné de nouvelles : impossible sans forcer", () => {
    expect(clotureADistance({ vueLe: null, sequence: null, attente: null }, 1, maintenant)).toMatchObject({ possible: false, aEnvoyer: null });
  });
});
