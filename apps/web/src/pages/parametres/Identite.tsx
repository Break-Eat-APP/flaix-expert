import { useEffect, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { lireMontant, type IdentiteLieu, type Lieu, type SessionInfo } from "@flaix/domain";
import { api } from "../../api.ts";
import { Carte, Chargement, EntetePage, MessageErreur, Regles } from "../../composants/communs.tsx";

const VIDE: IdentiteLieu = { nom: "", raisonSociale: "", siret: "", tvaIntracom: "", adresse: "", codePostal: "", ville: "" };

export function Identite() {
  const client = useQueryClient();
  const lieu = useQuery({ queryKey: ["lieu"], queryFn: () => api.get<Lieu>("/lieu") });
  const [form, setForm] = useState<IdentiteLieu>(VIDE);
  const [enregistre, setEnregistre] = useState(false);

  useEffect(() => {
    if (lieu.data) {
      const { id: _id, remiseAbonnePb: _r, seuilEcartEspeces: _s, ...identite } = lieu.data;
      setForm(Object.fromEntries(Object.entries(identite).map(([k, v]) => [k, v ?? ""])) as IdentiteLieu);
    }
  }, [lieu.data]);

  const sauver = useMutation({
    mutationFn: (identite: IdentiteLieu) => api.put<Lieu>("/lieu", identite),
    onSuccess: (l) => {
      client.setQueryData(["lieu"], l);
      client.setQueryData<SessionInfo | null>(["session"], (s) => (s ? { ...s, lieu: { ...s.lieu, nom: l.nom } } : s));
      setEnregistre(true);
    },
  });

  if (lieu.isPending) return <Chargement />;
  if (lieu.error) return <MessageErreur erreur={lieu.error} />;

  const champ = (cle: keyof IdentiteLieu, libelle: string, options: { aide?: string; requis?: boolean; autocomplete?: string } = {}) => (
    <label className="champ">
      <span>
        {libelle}
        {options.requis ? " *" : ""}
      </span>
      <input
        type="text"
        value={form[cle] ?? ""}
        required={options.requis}
        autoComplete={options.autocomplete ?? "off"}
        onChange={(e) => {
          setEnregistre(false);
          setForm({ ...form, [cle]: e.target.value });
        }}
      />
      {options.aide && <small className="aide">{options.aide}</small>}
    </label>
  );

  function soumettre(e: FormEvent) {
    e.preventDefault();
    sauver.mutate(form);
  }

  return (
    <>
      <EntetePage fil="Paramètres" filLien="/parametres" titre="Le lieu" description="Qui exploite ce lieu : ces informations figureront sur chaque ticket et sur l'attestation de conformité." />
      <form onSubmit={soumettre}>
        <Carte titre="Le lieu">
          <div className="grille-champs">{champ("nom", "Nom affiché du lieu", { requis: true, aide: "Ex. le nom du club ou de la salle." })}</div>
        </Carte>
        <Carte titre="L'exploitant" description="L'entreprise ou l'association qui encaisse les ventes — c'est elle qui est tenue aux obligations fiscales.">
          <div className="grille-champs">
            {champ("raisonSociale", "Raison sociale", { autocomplete: "organization" })}
            {champ("siret", "SIRET", { aide: "14 chiffres." })}
            {champ("tvaIntracom", "N° de TVA intracommunautaire", { aide: "Ex. FR12345678901." })}
          </div>
          <div className="grille-champs" style={{ marginTop: 14 }}>
            {champ("adresse", "Adresse", { autocomplete: "street-address" })}
            {champ("codePostal", "Code postal", { autocomplete: "postal-code" })}
            {champ("ville", "Ville", { autocomplete: "address-level2" })}
          </div>
          <MessageErreur erreur={sauver.error} />
          {enregistre && !sauver.isPending && <div className="message message-ok">Enregistré. La modification est inscrite au journal technique.</div>}
          <div className="ligne-actions">
            <button className="btn" disabled={sauver.isPending}>
              {sauver.isPending ? "Enregistrement…" : "Enregistrer"}
            </button>
          </div>
        </Carte>
      </form>
      <ReglagesCaisse lieu={lieu.data!} />
      <ToleranceEspeces lieu={lieu.data!} />
      <Regles>
        <ul>
          <li><strong>Remise abonné</strong> : taux contractuel accordé aux abonnés du lieu. Tant qu'il n'est pas réglé, la pastille « Abonné » de la caisse reste inactive. Le caissier l'applique, il ne le négocie pas.</li>
          <li><strong>Tolérance d'écart d'espèces</strong> : au comptage d'un tiroir (Clôtures → Clôture du match), un écart plus grand que ce montant demande un motif. 5,00 € par défaut. La clôture n'est jamais bloquée.</li>
          <li>Le ticket de caisse doit porter l'identité de l'exploitant : raison sociale, adresse, SIRET, n° de TVA (BOFiP, données obligatoires d'une opération d'encaissement).</li>
          <li>Le SIRET compte 14 chiffres ; le n° de TVA intracommunautaire commence par le code du pays (FR…). Les espaces saisis sont retirés.</li>
          <li>Chaque modification est inscrite au journal technique du lieu, avec la valeur avant, la valeur après, son auteur et l'heure.</li>
        </ul>
      </Regles>
    </>
  );
}

function ReglagesCaisse({ lieu }: { lieu: Lieu }) {
  const client = useQueryClient();
  const [taux, setTaux] = useState(lieu.remiseAbonnePb !== null ? String(lieu.remiseAbonnePb / 100).replace(".", ",") : "");
  const [ok, setOk] = useState(false);
  const sauver = useMutation({
    mutationFn: (remiseAbonnePb: number | null) => api.put<Lieu>("/lieu/reglages-caisse", { remiseAbonnePb }),
    onSuccess: (l) => {
      client.setQueryData(["lieu"], l);
      client.invalidateQueries({ queryKey: ["ecran-caisse"] });
      setOk(true);
    },
  });
  const texte = taux.trim().replace(",", ".").replace("%", "").trim();
  const valeur = texte === "" ? null : Number(texte);
  const valide = valeur === null || (Number.isFinite(valeur) && valeur > 0 && valeur <= 100 && Math.round(valeur * 100) === valeur * 100);

  return (
    <Carte titre="Réglages de caisse" description="Paramètres du lieu appliqués par toutes les caisses.">
      <form
        className="en-ligne"
        style={{ alignItems: "flex-end" }}
        onSubmit={(e) => {
          e.preventDefault();
          if (valide) sauver.mutate(valeur === null ? null : Math.round(valeur * 100));
        }}
      >
        <label className="champ" style={{ width: 240 }}>
          <span>Remise abonné (%)</span>
          <input
            type="text"
            inputMode="decimal"
            value={taux}
            onChange={(e) => {
              setOk(false);
              setTaux(e.target.value);
            }}
            placeholder="Non réglée"
            aria-invalid={!valide}
          />
        </label>
        <button className="btn" disabled={!valide || sauver.isPending}>
          Enregistrer
        </button>
      </form>
      {!valide && <div className="message message-erreur">Taux en %, entre 0,01 et 100.</div>}
      <MessageErreur erreur={sauver.error} />
      {ok && <div className="message message-ok">Enregistré et inscrit au journal technique.</div>}
    </Carte>
  );
}

function ToleranceEspeces({ lieu }: { lieu: Lieu }) {
  const client = useQueryClient();
  const [texte, setTexte] = useState(String(lieu.seuilEcartEspeces / 100).replace(".", ","));
  const [ok, setOk] = useState(false);
  const valeur = lireMontant(texte);
  const sauver = useMutation({
    mutationFn: (seuilCentimes: number) => api.put<Lieu>("/lieu/seuil-especes", { seuilCentimes }),
    onSuccess: (l) => {
      client.setQueryData(["lieu"], l);
      client.invalidateQueries({ queryKey: ["cloture"] });
      setOk(true);
    },
  });
  return (
    <Carte titre="Contrôle des espèces" description="Au comptage d'un tiroir, un écart au-delà de cette tolérance demande un motif.">
      <form
        className="en-ligne"
        style={{ alignItems: "flex-end" }}
        onSubmit={(e) => {
          e.preventDefault();
          if (valeur !== null) sauver.mutate(valeur);
        }}
      >
        <label className="champ" style={{ width: 240 }}>
          <span>Tolérance d'écart (€)</span>
          <input
            type="text"
            inputMode="decimal"
            value={texte}
            onChange={(e) => {
              setOk(false);
              setTexte(e.target.value);
            }}
            aria-invalid={valeur === null}
          />
        </label>
        <button className="btn" disabled={valeur === null || sauver.isPending}>
          Enregistrer
        </button>
      </form>
      <MessageErreur erreur={sauver.error} />
      {ok && !sauver.isPending && <div className="message message-ok">Enregistré. La modification est inscrite au journal technique.</div>}
    </Carte>
  );
}
