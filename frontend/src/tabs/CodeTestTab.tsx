import React from "react";

type LanguageSummary = {
  id: number;
  name: string;
  description: string;
};

type CodeTestResult = {
  stdout: string;
  stderr: string;
  exitCode: number;
  durationMs: number;
};

export function CodeTestTab() {
  const [languages, setLanguages] = React.useState<LanguageSummary[] | null>(null);
  const [languagesError, setLanguagesError] = React.useState<string | null>(null);
  const [isLoadingLanguages, setIsLoadingLanguages] = React.useState(false);

  const [selectedLanguageId, setSelectedLanguageId] = React.useState<string>("");
  const [testCodeText, setTestCodeText] = React.useState("");
  const [isRunningTest, setIsRunningTest] = React.useState(false);
  const [testResult, setTestResult] = React.useState<CodeTestResult | null>(null);
  const [testError, setTestError] = React.useState<string | null>(null);

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

  async function handleRunTest(e: React.FormEvent) {
    e.preventDefault();
    setTestError(null);
    setTestResult(null);
    setIsRunningTest(true);
    try {
      const languageId = Number(selectedLanguageId);
      if (!Number.isFinite(languageId) || languageId <= 0) {
        throw new Error("languageId must be a positive number");
      }

      const res = await fetch("/api/code-test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: testCodeText,
          languageId,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        const msg = body && typeof body.error === "string" ? body.error : `HTTP ${res.status}`;
        throw new Error(`Failed to run test: ${msg}`);
      }

      const body = (await res.json()) as CodeTestResult;
      setTestResult(body);
    } catch (e) {
      setTestError(e instanceof Error ? e.message : String(e));
    } finally {
      setIsRunningTest(false);
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
    <form className="submit-form" onSubmit={handleRunTest}>
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
          コード (テスト用・提出されません):
          <textarea
            rows={10}
            value={testCodeText}
            onChange={(e) => setTestCodeText(e.target.value)}
          />
        </label>
      </div>
      <div className="form-row">
        <button type="submit" disabled={isRunningTest || !testCodeText.trim()}>
          {isRunningTest ? "実行中..." : "テスト実行"}
        </button>
      </div>
      {testError && (
        <div className="submit-message" style={{ color: "#b00020" }}>
          {testError}
        </div>
      )}
      {testResult && (
        <div className="problem-view" style={{ marginTop: "12px" }}>
          <h3>実行結果</h3>
          <div>exitCode: {testResult.exitCode}</div>
          <div>duration: {testResult.durationMs} ms</div>
          <h4>stdout</h4>
          <pre className="problem-statement">{testResult.stdout || "(empty)"}</pre>
          <h4>stderr</h4>
          <pre className="problem-statement">{testResult.stderr || "(empty)"}</pre>
        </div>
      )}
    </form>
  );
}
