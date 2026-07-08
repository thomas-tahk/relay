"use client";

import { Button } from "react-aria-components";
import type { KbArticle } from "@/domain/types";

export interface ArticleSuggestion {
  article: KbArticle;
  reason: string;
}

/**
 * Shown after a requester describes their problem, when Relay finds help
 * articles that may solve it — the deflection step. It is never a gate: the
 * requester can read an article and stop, or continue straight to filing.
 */
export function DeflectionPanel({
  suggestions,
  onContinue,
  onReset,
}: {
  suggestions: ArticleSuggestion[];
  onContinue: () => void;
  onReset: () => void;
}) {
  return (
    <section className="reveal deflect" aria-live="polite">
      <div className="result-head">
        <span className="chip chip-kb">Might already be solved</span>
        <span className="hint">
          These may fix it faster than a ticket — no need to wait on the desk.
        </span>
      </div>

      <ul className="kb-list">
        {suggestions.map(({ article, reason }) => (
          <li key={article.id} className="kb-item">
            <details className="kb-details">
              <summary className="kb-summary">
                <span className="kb-title">{article.title}</span>
                <span className="kb-reason">{reason}</span>
              </summary>
              <p className="kb-body">{article.body}</p>
            </details>
          </li>
        ))}
      </ul>

      <div className="intake-row" style={{ marginTop: "1.25rem" }}>
        <Button className="btn btn-ghost" onPress={onReset}>
          That solved it
        </Button>
        <Button className="btn btn-primary" onPress={onContinue}>
          Still need help — continue
        </Button>
      </div>
    </section>
  );
}
