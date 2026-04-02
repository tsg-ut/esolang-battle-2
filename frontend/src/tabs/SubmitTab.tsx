import React from "react";

type LanguageSummary = {
  id: number;
  name: string;
  description: string;
};

type ProblemSummary = {
  id: number;
  title: string;
};

export function SubmitTab(props: { contestId: number }) {
  const [languages, setLanguages] = React.useState<LanguageSummary[] | null>(null);
  const [languagesError, setLanguagesError] = React.useState<string | null>(null);
  const [isLoadingLanguages, setIsLoadingLanguages] = React.useState(false);

  const [problems, setProblems] = React.useState<ProblemSummary[] | null>(null);
  const [problemsError, setProblemsError] = React.useState<string | null>(null);
  const [isLoadingProblems, setIsLoadingProblems] = React.useState(false);

  const [code, setCode] = React.useState("");
  const [selectedLanguageId, setSelectedLanguageId] = React.useState<string>("");
  const [selectedProblemId, setSelectedProblemId] = React.useState<string>("");
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
            const search = window.location.search;
            let initialId: string | null = null;
            if (search) {
              const params = new URLSearchParams(search);
              const fromParam = params.get("languageId") ?? params.get("language");
              if (fromParam) {
                // id で一致を探す
                const byId = data.languages.find((l) => String(l.id) === fromParam);
                if (byId) {
                  initialId = String(byId.id);
                } else {
                  // name で一致を探す
                  const byName = data.languages.find((l) => l.name === fromParam);
                  if (byName) {
                    initialId = String(byName.id);
                  }
                }
              }
            }

            setSelectedLanguageId(initialId ?? String(data.languages[0].id));
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

  React.useEffect(() => {
    let cancelled = false;
    setIsLoadingProblems(true);
    setProblemsError(null);

    (async () => {
      try {
        const res = await fetch("/api/problems_list");
        if (!res.ok) throw new Error(`Failed to load problems: ${res.status}`);
        const data = (await res.json()) as { problems: ProblemSummary[] };
        if (!cancelled) {
          setProblems(data.problems);
          if (data.problems.length > 0) {
            setSelectedProblemId(String(data.problems[0].id));
          }
        }
      } catch (e) {
        if (!cancelled) {
          setProblemsError(e instanceof Error ? e.message : String(e));
        }
      } finally {
        if (!cancelled) setIsLoadingProblems(false);
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

      const problemId = Number(selectedProblemId);
      if (!Number.isFinite(problemId) || problemId <= 0) {
        throw new Error("problemId must be a positive number");
      }

      const res = await fetch(`/api/contests/${props.contestId}/submissions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
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

      // 提出結果タブへ遷移
      const w = window as any;
      if (typeof w.navigateToTab === "function") {
        w.navigateToTab("submissions");
      }
    } catch (e) {
      setSubmitMessage(e instanceof Error ? e.message : String(e));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoadingLanguages) {
    return <div>Loading languages...</div>;
  }

  if (isLoadingProblems) {
    return <div>Loading problems...</div>;
  }

  if (languagesError) {
    return <div style={{ color: "#b00020" }}>Error: {languagesError}</div>;
  }

  if (problemsError) {
    return <div style={{ color: "#b00020" }}>Error: {problemsError}</div>;
  }

  if (!languages || languages.length === 0) {
    return <div>言語が定義されていません。</div>;
  }

  if (!problems || problems.length === 0) {
    return <div>問題が定義されていません。</div>;
  }

  return (
    <form className="submit-form" onSubmit={handleSubmit}>
      <div className="form-row">
        <label>
          問題:
          <select
            value={selectedProblemId}
            onChange={(e) => setSelectedProblemId(e.target.value)}
          >
            {problems.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title} (ID {p.id})
              </option>
            ))}
          </select>
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
