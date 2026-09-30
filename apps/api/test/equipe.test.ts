/**
 * Équipe — fiches employés, planning, masse salariale (dossier §15.104, module 14), contre la
 * vraie base. Les montants attendus sont l'exemple chiffré validé du module 14 (§14).
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import type { CodeCaissiere, EmployeCree, Employe, EntreeJournalTechnique, Evenement, MasseSalariale, PlanningMatch, Produit, RepriseCaisse, Resultats, Stand } from "@flaix/domain";
import type { Base } from "../src/base.ts";
import { construireServeur } from "../src/serveur.ts";
import { MOT_DE_PASSE_TEST, basesDeTest, creerLieuDeTest } from "./aide.ts";
import { envoyer, ligne, tablette, vendreHorsLigne } from "./tablette.ts";

let proprietaire: Base;
let app: Base;
let serveur: FastifyInstance;
let cookie = "";
let nord: Stand;
let sud: Stand;
let match: Evenement;
let julie: Employe;
let karim: Employe;
let sophie: Employe;

const EN_TETES = { "content-type": "application/json", origin: "http://localhost:5173" };
function appel<T = unknown>(method: "GET" | "POST" | "PUT" | "PATCH", url: string, payload?: unknown) {
  return serveur
    .inject({ method, url, headers: { ...(method === "GET" ? {} : EN_TETES), cookie }, payload: method === "GET" ? undefined : ((payload ?? {}) as object) })
    .then((r) => ({ statut: r.statusCode, corps: r.json() as T }));
}
const employes = async () => (await appel<Employe[]>("GET", "/api/equipe/employes")).corps;
const planning = async () => (await appel<PlanningMatch>("GET", `/api/planning?evenementId=${match.id}`)).corps;
const affecter = (employeId: string, debutPrevu: string, finPrevu: string, standId: string | null = nord.id, caisseId: string | null = null) =>
  appel<PlanningMatch & { erreur?: string }>("POST", "/api/planning/affectations", { evenementId: match.id, employeId, standId, caisseId, debutPrevu, finPrevu });

beforeAll(async () => {
  ({ proprietaire, app } = basesDeTest());
  serveur = await construireServeur(app, { journaliser: false });
  const lieu = await creerLieuDeTest(proprietaire);
  const r = await serveur.inject({ method: "POST", url: "/api/auth/connexion", headers: EN_TETES, payload: { email: lieu.email, motDePasse: MOT_DE_PASSE_TEST } });
  cookie = `fx_session=${r.cookies.find((k) => k.name === "fx_session")!.value}`;
  await appel("POST", "/api/stands", { nom: "Buvette Nord" });
  const stands = (await appel<Stand[]>("POST", "/api/stands", { nom: "Buvette Sud" })).corps;
  nord = stands.find((s) => s.nom === "Buvette Nord")!;
  sud = (await appel<Stand[]>("POST", `/api/stands/${stands.find((s) => s.nom === "Buvette Sud")!.id}/caisses`, {})).corps.find((s) => s.nom === "Buvette Sud")!;
  match = (await appel<Evenement[]>("POST", "/api/evenements", { libelle: "Match du planning", debut: new Date(Date.now() + 86_400_000).toISOString() })).corps[0]!;
});

afterAll(async () => {
  await serveur.close();
  await proprietaire.fermer();
  await app.fermer();
});

describe("fiches employés", () => {
  it("une caissière créée par son compte a aussi sa fiche employé (taux à compléter)", async () => {
    await appel<CodeCaissiere>("POST", "/api/equipe/caissieres", { nom: "Julie B." });
    julie = (await employes()).find((e) => e.nom === "Julie B.")!;
    expect(julie).toMatchObject({ role: "Caissier", tauxHoraire: null, acces: { actif: true } });
    julie = (await appel<Employe[]>("PATCH", `/api/equipe/employes/${julie.id}`, { tauxHoraire: 1740 })).corps.find((e) => e.id === julie.id)!;
    expect(julie.tauxHoraire).toBe(1740);
  });

  it("fiche sans accès caisse ; fiche avec accès : un code à 4 chiffres, remis une fois ; l'agence ne vaut que pour un intérimaire", async () => {
    const k = await appel<EmployeCree>("POST", "/api/equipe/employes", { nom: "Karim T.", role: "Responsable de stand", tauxHoraire: 2280, agence: "Ignorée" });
    expect(k.statut).toBe(201);
    expect(k.corps).toMatchObject({ code: null, employe: { statut: "salarie", agence: null, acces: null } });
    karim = k.corps.employe;
    const s = await appel<EmployeCree>("POST", "/api/equipe/employes", { nom: "Sophie L.", statut: "interimaire", agence: "Studenjob", role: "Renfort ponctuel", tauxHoraire: 2600, accesCaisse: true });
    expect(s.corps.code).toMatch(/^[0-9]{4}$/);
    expect(s.corps.employe).toMatchObject({ statut: "interimaire", agence: "Studenjob", acces: { actif: true } });
    sophie = s.corps.employe;
    expect((await appel("POST", "/api/equipe/employes", { nom: "karim t." })).statut).toBe(409);
  });

  it("donner puis retirer l'accès caisse ; une fiche désactivée perd son accès", async () => {
    const donne = await appel<EmployeCree>("POST", `/api/equipe/employes/${karim.id}/acces`);
    expect(donne.corps.code).toMatch(/^[0-9]{4}$/);
    expect(donne.corps.employe.acces!.actif).toBe(true);
    const retire = (await appel<Employe[]>("POST", `/api/equipe/employes/${karim.id}/acces/retrait`)).corps.find((e) => e.id === karim.id)!;
    expect(retire.acces!.actif).toBe(false);
    const inactive = (await appel<Employe[]>("PATCH", `/api/equipe/employes/${sophie.id}`, { actif: false })).corps.find((e) => e.id === sophie.id)!;
    expect(inactive).toMatchObject({ actif: false, acces: { actif: false } });
    await appel("PATCH", `/api/equipe/employes/${sophie.id}`, { actif: true });
  });
});

describe("planning d'un match à venir, prévu puis réel", () => {
  it("exemple validé du module 14 : Julie 104,40 € prévus ; Karim 159,60 € ; Sophie 130,00 €", async () => {
    await affecter(julie.id, "18:00", "00:00");
    await affecter(karim.id, "17:30", "00:30");
    const p = (await affecter(sophie.id, "18:00", "23:00", sud.id, sud.caisses[0]!.id)).corps;
    const j = p.affectations.find((a) => a.employeNom === "Julie B.")!;
    expect(j).toMatchObject({ minutesPrevues: 360, coutPrevu: 10440, coutReel: 10440, debutReel: "18:00", finReel: "00:00", correction: null, role: "Caissier" });
    expect(p.affectations.find((a) => a.employeNom === "Karim T.")!.coutReel).toBe(15960);
    expect(p.affectations.find((a) => a.employeNom === "Sophie L.")).toMatchObject({ coutReel: 13000, caisseNumero: 1, standNom: "Buvette Sud" });
    expect(p).toMatchObject({ masseReelle: 10440 + 15960 + 13000, salaries: 10440 + 15960, interimaires: 13000, tauxManquants: 0 });
  });

  it("tant que le réel n'est pas corrigé, il suit le prévu ; une correction garde son auteur et son heure", async () => {
    const j = (await planning()).affectations.find((a) => a.employeNom === "Julie B.")!;
    const deplace = (await appel<PlanningMatch>("PATCH", `/api/planning/affectations/${j.id}`, { debutPrevu: "18:30" })).corps.affectations.find((a) => a.id === j.id)!;
    expect(deplace).toMatchObject({ debutPrevu: "18:30", debutReel: "18:30", correction: null });
    await appel("PATCH", `/api/planning/affectations/${j.id}`, { debutPrevu: "18:00" });
    // Réel 18:00 → 00:15 : 6 h 15 × 17,40 € = 108,75 € (+4,35 €).
    const corrige = (await appel<PlanningMatch>("PATCH", `/api/planning/affectations/${j.id}`, { finReel: "00:15" })).corps;
    const a = corrige.affectations.find((x) => x.id === j.id)!;
    expect(a).toMatchObject({ finReel: "00:15", minutesReelles: 375, coutReel: 10875, coutPrevu: 10440 });
    expect(a.correction!.par).toContain("Personne test");
    // Total de l'échantillon validé : 398,35 € réel.
    expect(corrige.masseReelle).toBe(39835);
    // Après correction, changer le prévu ne touche plus au réel.
    const apres = (await appel<PlanningMatch>("PATCH", `/api/planning/affectations/${j.id}`, { finPrevu: "23:30" })).corps.affectations.find((x) => x.id === j.id)!;
    expect(apres).toMatchObject({ finPrevu: "23:30", finReel: "00:15" });
  });

  it("le taux est figé sur l'affectation : changer la fiche ne réécrit pas le planning", async () => {
    await appel("PATCH", `/api/equipe/employes/${julie.id}`, { tauxHoraire: 2000 });
    expect((await planning()).affectations.find((a) => a.employeNom === "Julie B.")!.coutReel).toBe(10875);
  });

  it("poste invalide, employé inactif, taux manquant : refusé ou signalé, jamais un coût inventé", async () => {
    expect((await affecter(karim.id, "18:00", "22:00", nord.id, sud.caisses[0]!.id)).statut).toBe(400);
    expect((await affecter(karim.id, "18:00", "22:00", null, sud.caisses[0]!.id)).statut).toBe(400);
    expect((await affecter(karim.id, "25:00", "22:00")).statut).toBe(400);
    const nadia = (await appel<EmployeCree>("POST", "/api/equipe/employes", { nom: "Nadia C.", role: "Préparation / cuisine" })).corps.employe;
    const p = (await affecter(nadia.id, "17:00", "23:00", null)).corps;
    expect(p).toMatchObject({ masseReelle: null, tauxManquants: 1 });
    expect(p.affectations.find((a) => a.employeNom === "Nadia C.")).toMatchObject({ coutReel: null, standNom: null });
    await appel("PATCH", `/api/equipe/employes/${nadia.id}`, { actif: false });
    expect((await affecter(nadia.id, "17:00", "23:00")).statut).toBe(409);
    // Retirée, l'affectation reste lisible au journal technique.
    const id = p.affectations.find((a) => a.employeNom === "Nadia C.")!.id;
    expect((await appel<PlanningMatch>("POST", `/api/planning/affectations/${id}/retrait`)).corps.tauxManquants).toBe(0);
    const jet = (await appel<EntreeJournalTechnique[]>("GET", "/api/journal-technique?limite=100")).corps;
    expect(jet.find((e) => e.type === "affectation_retiree")!.details).toMatchObject({ employe: "Nadia C.", prevu: "17:00-23:00" });
    expect(jet.some((e) => e.type === "affectation_modifiee")).toBe(true);
  });
});

describe("masse salariale et Résultats → Finances", () => {
  it("masse salariale : par match, par statut, par rôle — la somme du planning, jamais un autre calcul", async () => {
    const m = (await appel<MasseSalariale>("GET", "/api/equipe/masse-salariale")).corps;
    expect(m).toMatchObject({ total: 39835, salaries: 10875 + 15960, interimaires: 13000 });
    expect(m.parMatch).toHaveLength(1);
    expect(m.parRole.find((r) => r.role === "Responsable de stand")!.total).toBe(15960);
  });

  it("le personnel du planning est déduit dans Résultats → Finances une fois le match joué", async () => {
    const biere = (await appel<Produit[]>("POST", "/api/produits", { nom: "Bière", prixTtc: 700, tauxTva: 2000, coutMatiere: 120, standIds: [sud.id] })).corps[0]!;
    await appel("POST", `/api/evenements/${match.id}/ouverture`);
    const t = tablette(sud.caisses[0]!.id, (await appel<RepriseCaisse>("POST", `/api/caisses/${sud.caisses[0]!.id}/ouverture`, {})).corps);
    vendreHorsLigne(t, [ligne(biere, 3)]);
    await envoyer(appel, t);
    const r = (await appel<Resultats>("GET", `/api/resultats?evenementId=${match.id}`)).corps;
    expect(r.actuel!.personnel).toEqual({ reel: 39835, affectations: 3, tauxManquants: 0 });
  });
});
