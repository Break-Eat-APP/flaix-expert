import { useEffect, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { IdentiteLieu, Lieu, SessionInfo } from "@flaix/domain";
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
      const { id: _id, ...identite } = lieu.data;
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
      <EntetePage fil="Configuration" titre="Identité du lieu" description="Qui exploite ce lieu : ces informations figureront sur chaque ticket et sur l'attestation de conformité." />
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
      <Regles>
        <ul>
          <li>Le ticket de caisse doit porter l'identité de l'exploitant : raison sociale, adresse, SIRET, n° de TVA (BOFiP, données obligatoires d'une opération d'encaissement).</li>
          <li>Le SIRET compte 14 chiffres ; le n° de TVA intracommunautaire commence par le code du pays (FR…). Les espaces saisis sont retirés.</li>
          <li>Chaque modification est inscrite au journal technique du lieu, avec la valeur avant, la valeur après, son auteur et l'heure.</li>
        </ul>
      </Regles>
    </>
  );
}
