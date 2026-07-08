"use client";

import { useState } from "react";
import { Button, Label, TextArea, TextField } from "react-aria-components";
import Link from "next/link";
import { catalog } from "@config/catalog";
import { validateAgainstCatalog, type MissingField } from "@/engine/validate";
import type { IntakeResult } from "@/domain/schema";
import { RecordPreview } from "@/components/RecordPreview";
import { ClarifyDialog } from "@/components/ClarifyDialog";
import { ManualRequestForm } from "@/components/ManualRequestForm";

type Mode = "idle" | "structuring" | "review" | "manual" | "confirmed";

export default function RequesterPage() {
  const [mode, setMode] = useState<Mode>("idle");
  const [text, setText] = useState("");
  const [result, setResult] = useState<IntakeResult | null>(null);
  const [missing, setMissing] = useState<MissingField[]>([]);
  const [clarifyOpen, setClarifyOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState<{ id: string; kind: string } | null>(null);

  async function structure() {
    if (!text.trim()) return;
    setMode("structuring");
    setNotice(null);
    try {
      const res = await fetch("/api/intake", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (res.status === 503) {
        setNotice("The AI classifier is offline. Pick your request from the catalog below.");
        setMode("manual");
        return;
      }
      if (!res.ok) throw new Error("intake_failed");
      const data = (await res.json()) as { result: IntakeResult; missing: MissingField[] };
      setResult(data.result);
      setMissing(data.missing);
      setMode("review");
      if (data.missing.length > 0) setClarifyOpen(true);
    } catch {
      setNotice(
        "Something went wrong reaching the classifier. You can pick from the catalog instead.",
      );
      setMode("manual");
    }
  }

  async function fileRecords(toFile: IntakeResult) {
    try {
      const res = await fetch("/api/records", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(toFile),
      });
      if (!res.ok) throw new Error("file_failed");
      const data = (await res.json()) as { id: string; kind: string };
      setConfirmed(data);
      setMode("confirmed");
    } catch {
      setNotice("Could not file the record. Please try again.");
    }
  }

  function reset() {
    setMode("idle");
    setText("");
    setResult(null);
    setMissing([]);
    setConfirmed(null);
    setNotice(null);
  }

  return (
    <>
      <header className="app-header">
        <span className="wordmark">
          <span className="dot" aria-hidden="true" />
          Relay
        </span>
        <Link className="header-link" href="/workspace">
          Fulfiller workspace →
        </Link>
      </header>

      <main className="page">
        {mode === "confirmed" && confirmed ? (
          <Confirmation confirmed={confirmed} onReset={reset} />
        ) : (
          <>
            <p className="eyebrow">Tell us in your own words</p>
            <h1 className="hero-prompt">What do you need?</h1>
            <p className="hero-sub">
              Describe it plainly — a new hire’s equipment, an account, a projector that
              won’t turn on. Relay figures out the rest.
            </p>

            {(mode === "idle" || mode === "structuring") && (
              <TextField
                className="intake-field"
                value={text}
                onChange={setText}
                aria-label="Describe your request"
              >
                <Label className="eyebrow" style={{ marginBottom: "0.5rem" }}>
                  Your request
                </Label>
                <div className="intake">
                  <TextArea
                    className="intake-input"
                    placeholder="e.g. New teacher Priya Shah starts Monday in the High School — she needs a laptop and an email account."
                    onKeyDown={(e) => {
                      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") structure();
                    }}
                  />
                  <div className="intake-row">
                    <span className="hint">⌘/Ctrl + Enter to submit</span>
                    <Button
                      className="btn btn-primary"
                      onPress={structure}
                      isDisabled={!text.trim() || mode === "structuring"}
                    >
                      {mode === "structuring" ? "Structuring…" : "Structure my request"}
                    </Button>
                  </div>
                </div>
              </TextField>
            )}

            {notice && <div className="notice notice-warn">{notice}</div>}

            {mode === "review" && result && (
              <section className="reveal" aria-live="polite">
                <div className="result-head">
                  <span className={`chip chip-${result.kind}`}>
                    {result.kind === "incident" ? "Incident" : "Request"}
                  </span>
                  <span className="hint">
                    Relay classified this for you — review before filing.
                  </span>
                </div>

                <RecordPreview result={result} />

                {missing.length > 0 && (
                  <div className="notice notice-warn">
                    {missing.length} required detail{missing.length > 1 ? "s" : ""} still needed
                    before this can be filed.
                  </div>
                )}

                <div className="intake-row" style={{ marginTop: "1.25rem" }}>
                  <Button className="btn btn-ghost" onPress={reset}>
                    Start over
                  </Button>
                  {missing.length > 0 ? (
                    <Button className="btn btn-primary" onPress={() => setClarifyOpen(true)}>
                      Complete details
                    </Button>
                  ) : (
                    <Button className="btn btn-primary" onPress={() => fileRecords(result)}>
                      {result.kind === "incident" ? "Log incident" : "File request"}
                    </Button>
                  )}
                </div>

                {result.kind === "request" && (
                  <ClarifyDialog
                    missing={missing}
                    result={result}
                    isOpen={clarifyOpen}
                    onOpenChange={setClarifyOpen}
                    onComplete={(filled) => {
                      setResult(filled);
                      setMissing(validateAgainstCatalog(filled, catalog));
                    }}
                  />
                )}
              </section>
            )}

            {mode === "manual" && (
              <section className="reveal">
                <ManualRequestForm onSubmit={fileRecords} />
              </section>
            )}
          </>
        )}
      </main>
    </>
  );
}

function Confirmation({
  confirmed,
  onReset,
}: {
  confirmed: { id: string; kind: string };
  onReset: () => void;
}) {
  const isIncident = confirmed.kind === "incident";
  return (
    <div className="confirm reveal">
      <div className="confirm-mark" aria-hidden="true">
        ✓
      </div>
      <h1 className="hero-prompt" style={{ fontSize: "1.75rem" }}>
        {isIncident ? "Incident logged" : "Request filed"}
      </h1>
      <p className="hero-sub" style={{ margin: "0 auto" }}>
        Track it by its reference:
      </p>
      <p className="confirm-id">{confirmed.id}</p>
      <div className="intake-row" style={{ justifyContent: "center" }}>
        <Button className="btn btn-ghost" onPress={onReset}>
          Make another request
        </Button>
        <Link className="btn btn-primary" href="/workspace">
          Open workspace
        </Link>
      </div>
    </div>
  );
}
