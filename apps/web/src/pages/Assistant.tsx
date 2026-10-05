import { useState, type FormEvent } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { BookOpen, Send, Sparkles, TriangleAlert } from "lucide-react";
import type { EtatAssistant, ReponseAssistant } from "@flaix/domain";
import { api } from "../api.ts";
import { Carte, Chargement, EntetePage, MessageErreur, Regles } from "../composants/communs.tsx";

const SUGGESTIONS = [
  "Combien ai-je encaissé ce mois-ci ?",
  "Quelle buvette rapporte le plus sur la saison ?",
  "Pourquoi la marge a changé par rapport à l'événement précédent ?",
  "Quels produits sont sous leur cible de marge ?",
];

interface Echange {
  question: string;
  reponse: ReponseAssistant;
}

/**
 * Assistant « pose ta question » (dossier §15.136, §15.145) : réponses rédigées par une IA (OVHcloud) à partir des
 * données de FlaiX Expert, avec leurs sources ; un chiffre non retrouvé dans les données est signalé.
 */
export function Assistant() {
  const etat = useQuery({ queryKey: ["assistant"], queryFn: () => api.get<EtatAssistant>("/assistant") });
  const [question, setQuestion] = useState("");
  const [echanges, setEchanges] = useState<Echange[]>([]);
  const demander = useMutation({
    mutationFn: (q: string) =>
      api.post<ReponseAssistant>("/assistant", { question: q, historique: echanges.slice(-3).map((e) => ({ question: e.question, reponse: e.reponse.reponse })) }),
    onSuccess: (reponse, q) => {
      setEchanges((avant) => [...avant, { question: q, reponse }]);
      setQuestion("");
    },
  });

  if (etat.isPending) return <Chargement />;
  if (etat.error) return <MessageErreur erreur={etat.error} />;
  const e = etat.data!;
  const restantes = echanges.at(-1)?.reponse.restantes ?? e.restantes;
  const envoyer = (q: string) => {
    if (q.trim().length >= 3 && !demander.isPending) demander.mutate(q.trim());
  };

  return (
    <>
      <EntetePage titre="Assistant" description="Pose une question sur tes chiffres, en langage courant. La réponse est rédigée par une IA à partir des données de FlaiX Expert." />
      {!e.branche ? (
        <Carte>
          <div className="message message-alerte" style={{ margin: 0 }}>
            L'assistant n'est pas encore branché : la clé de l'IA doit être réglée sur le serveur par FlaiX Expert.
          </div>
        </Carte>
      ) : (
        <Carte>
          <div className="assistant-fil" aria-live="polite">
            {echanges.length === 0 && (
              <div className="assistant-vide">
                <Sparkles size={20} />
                <p>Par exemple :</p>
                <div className="puces-choix">
                  {SUGGESTIONS.map((s) => (
                    <button key={s} className="puce-choix" onClick={() => envoyer(s)} disabled={demander.isPending}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {echanges.map((x, i) => (
              <div key={i} className="assistant-echange">
                <div className="bulle question">{x.question}</div>
                <div className="bulle reponse">
                  <span className="assistant-ia">
                    <Sparkles size={12} /> Rédigé par une IA ({x.reponse.modele})
                  </span>
                  <p>{x.reponse.reponse}</p>
                  {!x.reponse.verifie && (
                    <p className="assistant-verifier">
                      <TriangleAlert size={13} /> Cette réponse contient un chiffre que je n'ai pas retrouvé dans tes données : vérifie-le dans Résultats.
                    </p>
                  )}
                  {x.reponse.sources.length > 0 && (
                    <p className="assistant-sources">
                      <BookOpen size={12} /> Lu : {[...new Set(x.reponse.sources.map((s) => s.libelle))].join(" · ")}
                    </p>
                  )}
                </div>
              </div>
            ))}
            {demander.isPending && <div className="bulle reponse discret">Je regarde tes chiffres…</div>}
          </div>
          <MessageErreur erreur={demander.error} />
          <form
            className="assistant-saisie"
            onSubmit={(ev: FormEvent) => {
              ev.preventDefault();
              envoyer(question);
            }}
          >
            <textarea
              value={question}
              onChange={(ev) => setQuestion(ev.target.value)}
              onKeyDown={(ev) => {
                if (ev.key === "Enter" && !ev.shiftKey) {
                  ev.preventDefault();
                  envoyer(question);
                }
              }}
              placeholder="Ta question…"
              maxLength={500}
              rows={2}
              aria-label="Ta question"
            />
            <button className="btn" disabled={demander.isPending || question.trim().length < 3 || restantes === 0}>
              <Send size={15} /> Envoyer
            </button>
          </form>
          <p className="note">
            {restantes} question{restantes > 1 ? "s" : ""} restante{restantes > 1 ? "s" : ""} aujourd'hui pour ce lieu.
          </p>
        </Carte>
      )}
      <Regles>
        <ul>
          <li><strong>Une IA, pas une personne</strong> : les réponses sont rédigées par un modèle de langage hébergé en Europe par OVHcloud (le modèle est indiqué sous chaque réponse). Elles peuvent se tromper : les chiffres qui font foi sont ceux des écrans de FlaiX Expert.</li>
          <li><strong>Ce qu'elle lit</strong> : seulement tes données, au travers d'outils en lecture seule — résultats d'un événement ou d'une période, finances, rapports de soirée, marges du catalogue. Elle ne peut rien modifier. Chaque réponse dit ce qu'elle a lu.</li>
          <li><strong>Contrôle des chiffres</strong> : chaque nombre de la réponse est comparé aux données lues. S'il n'y figure pas, la réponse le signale (« à vérifier »).</li>
          <li><strong>Trace</strong> : chaque question et sa réponse sont gardées avec ce qui a été lu, pour pouvoir toujours savoir d'où vient une réponse.</li>
          <li><strong>Limite</strong> : un nombre de questions par jour et par lieu, parce que chaque question coûte.</li>
        </ul>
      </Regles>
    </>
  );
}
