import React from "react";

type LanguageSummary = {
  id: number;
  name: string;
  description: string;
};

export function SubmitTab() {
  const [languages, setLanguages] = React.useState<LanguageSummary[] | null>(null);
  const [languagesError, setLanguagesError] = React.useState<string | null>(null);
  const [isLoadingLanguages, setIsLoadingLanguages] = React.useState(false);

  const [code, setCode] = React.useState("");
  const [selectedLanguageId, setSelectedLanguageId] = React.useState<string>("");
  const [problemIdInput, setProblemIdInput] = React.useState<string>("1");
  const [submitMessage, setSubmitMessage] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    setIsLoadingLanguages(true);
    setLanguagesError(null);

    (async () => {
      try {
        const res = await fetch("/api/languages");
        if (!res.ok) throw new Error(`Failed to load languages: ${res.status}`);
        const data = (await res.json()) as { languages: LanguageSummary[] };
        if (!cancelled) {
          setLanguages(data.languages);
          if (data.languages.length > 0) {
            setSelectedLanguageId(String(data.languages[0].id));
          }
        }
      } catch (e) {
        if (!cancelled) {
          setLanguagesError(e instanceof Error ? e.message : String(e));
        }
      } finally {
        if (!cancelled) setIsLoadingLanguages(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitMessage(null);
    setIsSubmitting(true);
    try {
      const languageId = Number(selectedLanguageId);
      if (!Number.isFinite(languageId) || languageId <= 0) {
        throw new Error("languageId must be a positive number");
      }

      const problemId = Number(problemIdInput);
      if (!Number.isFinite(problemId) || problemId <= 0) {
        throw new Error("problemId must be a positive number");
      }

      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-Id": "1",
        },
        body: JSON.stringify({
          code,
          languageId,
          problemId,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        const msg = body && typeof body.error === "string" ? body.error : `HTTP ${res.status}`;
        throw new Error(`Failed to submit: ${msg}`);
      }

      const body = (await res.json()) as { submissionId: number };
      setSubmitMessage(`提出に成功しました (ID: ${body.submissionId})`);
      setCode("");
    } catch (e) {
      setSubmitMessage(e instanceof Error ? e.message : String(e));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoadingLanguages) {
    return <div>Loading languages...</div>;
  }

  if (languagesError) {
    return <div style={{ color: "#b00020" }}>Error: {languagesError}</div>;
  }

  if (!languages || languages.length === 0) {
    return <div>言語が定義されていません。</div>;
  }

  return (
    <form className="submit-form" onSubmit={handleSubmit}>
      <div className="form-row">
        <label>
          問題ID:
          <input
            type="number"
            min={1}
            value={problemIdInput}
            onChange={(e) => setProblemIdInput(e.target.value)}
          />
        </label>
      </div>
      <div className="form-row">
        <label>
          言語:
          <select
            value={selectedLanguageId}
            onChange={(e) => setSelectedLanguageId(e.target.value)}
          >
            {languages.map((lang) => (
              <option key={lang.id} value={lang.id}>
                {lang.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="form-row">
        <label>
          コード:
          <textarea
            rows={10}
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
        </label>
      </div>
      <div className="form-row">
        <button type="submit" disabled={isSubmitting || !code.trim()}>
          {isSubmitting ? "提出中..." : "提出"}
        </button>
      </div>
      {submitMessage && <div className="submit-message">{submitMessage}</div>}
    </form>
  );
}
