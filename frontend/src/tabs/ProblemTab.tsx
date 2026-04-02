import React from "react";

type AcceptedLanguage = {
  id: number;
  description: string;
  dockerImageId: string;
};

type ProblemDto = {
  id: number;
  title: string;
  problemStatement: string;
  contestId: number;
  acceptedLanguages: AcceptedLanguage[];
};

type MeInfo = {
  id: number;
  name: string;
  isAdmin: boolean;
  team: { id: number; color: string } | null;
};

type AdminTestCase = {
  id: number;
  input: string;
  output: string;
  isSample: boolean;
  checkerScript: string | null;
};

export function ProblemTab({ contestId }: { contestId: number }) {
  void contestId; // 現状はコンテスト共通の先頭問題を表示
  const [problem, setProblem] = React.useState<ProblemDto | null>(null);
  const [problemError, setProblemError] = React.useState<string | null>(null);
  const [isLoadingProblem, setIsLoadingProblem] = React.useState(false);

  const [me, setMe] = React.useState<MeInfo | null>(null);
  const [isLoadingMe, setIsLoadingMe] = React.useState(false);

  const [editTitle, setEditTitle] = React.useState("");
  const [editStatement, setEditStatement] = React.useState("");
  const [isSavingProblem, setIsSavingProblem] = React.useState(false);

  const [testcases, setTestcases] = React.useState<AdminTestCase[] | null>(null);
  const [testcasesError, setTestcasesError] = React.useState<string | null>(null);
  const [isLoadingTestcases, setIsLoadingTestcases] = React.useState(false);

  const [newInput, setNewInput] = React.useState("");
  const [newOutput, setNewOutput] = React.useState("");
  const [newIsSample, setNewIsSample] = React.useState(false);
  const [newCheckerScript, setNewCheckerScript] = React.useState("");
  const [isSavingTestcase, setIsSavingTestcase] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    setIsLoadingProblem(true);
    setProblemError(null);

    (async () => {
      try {
        const res = await fetch("/api/problems");
        if (res.status === 404) {
          if (!cancelled) {
            setProblem(null);
          }
          return;
        }
        if (!res.ok) throw new Error(`Failed to load problem: ${res.status}`);
        const data = (await res.json()) as ProblemDto;
        if (!cancelled) {
          setProblem(data);
        }
      } catch (e) {
        if (!cancelled) {
          setProblemError(e instanceof Error ? e.message : String(e));
        }
      } finally {
        if (!cancelled) setIsLoadingProblem(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    setIsLoadingMe(true);

    (async () => {
      try {
        const res = await fetch("/api/me");
        if (res.status === 401) {
          if (!cancelled) setMe(null);
        } else if (!res.ok) {
          if (!cancelled) setMe(null);
        } else {
          const data = (await res.json()) as MeInfo;
          if (!cancelled) setMe(data);
        }
      } catch {
        if (!cancelled) setMe(null);
      } finally {
        if (!cancelled) setIsLoadingMe(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  React.useEffect(() => {
    if (problem) {
      setEditTitle(problem.title);
      setEditStatement(problem.problemStatement);
    }
  }, [problem]);

  React.useEffect(() => {
    let cancelled = false;
    if (!problem || !me || !me.isAdmin) {
      setTestcases(null);
      return () => {
        cancelled = true;
      };
    }

    setIsLoadingTestcases(true);
    setTestcasesError(null);

    (async () => {
      try {
        const res = await fetch(`/api/admin/problems/${problem.id}/testcases`);
        const body = await res.json().catch(() => null);
        if (!res.ok) {
          const msg = body && typeof body.error === "string"
            ? body.error
            : `Failed to load testcases: ${res.status}`;
          throw new Error(msg);
        }
        const data = body as { testcases: AdminTestCase[] };
        if (!cancelled) {
          setTestcases(data.testcases);
        }
      } catch (e) {
        if (!cancelled) {
          setTestcasesError(e instanceof Error ? e.message : String(e));
          setTestcases(null);
        }
      } finally {
        if (!cancelled) setIsLoadingTestcases(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [problem, me]);

  if (isLoadingProblem) return <div>Loading problem...</div>;
  if (problemError) return <div style={{ color: "#b00020" }}>Error: {problemError}</div>;
  if (!problem) return <div>問題がありません。</div>;

  return (
    <div className="problem-view">
      <h2>{problem.title} (ID {problem.id})</h2>
      <pre className="problem-statement">{problem.problemStatement}</pre>
      {problem.acceptedLanguages.length > 0 && (
        <div className="problem-languages">
          <h3>使用可能な言語</h3>
          <ul>
            {problem.acceptedLanguages.map((lang) => (
              <li key={lang.id}>
                {lang.id}: {lang.description}
              </li>
            ))}
          </ul>
        </div>
      )}

      {me && me.isAdmin && (
        <div style={{ marginTop: 24 }}>
          <h3>問題編集 (管理者用)</h3>
          {isSavingProblem && <div>問題を保存中...</div>}
          <form
            className="submit-form"
            onSubmit={async (e) => {
              e.preventDefault();
              setProblemError(null);
              setIsSavingProblem(true);
              try {
                const payload = {
                  contestId: problem.contestId,
                  title: editTitle,
                  problemStatement: editStatement,
                };
                const res = await fetch(`/api/admin/problems/${problem.id}`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(payload),
                });
                const body = await res.json().catch(() => null);
                if (!res.ok) {
                  const msg = body && typeof body.error === "string"
                    ? body.error
                    : `HTTP ${res.status}`;
                  throw new Error(msg);
                }
                // 反映のため最新の問題を再取得
                const ref = await fetch("/api/problems");
                if (!ref.ok) {
                  throw new Error(`Failed to reload problem: ${ref.status}`);
                }
                const updated = (await ref.json()) as ProblemDto;
                setProblem(updated);
              } catch (e2) {
                setProblemError(e2 instanceof Error ? e2.message : String(e2));
              } finally {
                setIsSavingProblem(false);
              }
            }}
          >
            <div className="form-row">
              <label>
                タイトル:
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                />
              </label>
            </div>
            <div className="form-row">
              <label>
                問題文:
                <textarea
                  rows={10}
                  value={editStatement}
                  onChange={(e) => setEditStatement(e.target.value)}
                />
              </label>
            </div>
            <div className="form-row">
              <button
                type="submit"
                disabled={!editTitle.trim() || !editStatement.trim() || isSavingProblem}
              >
                保存
              </button>
            </div>
          </form>

          <div style={{ marginTop: 24 }}>
            <h3>テストケース管理 (管理者用)</h3>
            {isLoadingTestcases && <div>Loading testcases...</div>}
            {testcasesError && (
              <div style={{ color: "#b00020" }}>Error: {testcasesError}</div>
            )}
            {testcases && testcases.length > 0 && (
              <table className="submissions-table" style={{ marginTop: 8 }}>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Sample</th>
                    <th>Input</th>
                    <th>Output</th>
                  </tr>
                </thead>
                <tbody>
                  {testcases.map((tc) => (
                    <tr key={tc.id}>
                      <td>{tc.id}</td>
                      <td>{tc.isSample ? "Yes" : "No"}</td>
                      <td>
                        <pre className="problem-statement">{tc.input}</pre>
                      </td>
                      <td>
                        <pre className="problem-statement">{tc.output}</pre>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            <form
              className="submit-form"
              style={{ marginTop: 16 }}
              onSubmit={async (e) => {
                e.preventDefault();
                setTestcasesError(null);
                setIsSavingTestcase(true);
                try {
                  const payload = {
                    input: newInput,
                    output: newOutput,
                    isSample: newIsSample,
                    checkerScript: newCheckerScript,
                  };
                  const res = await fetch(`/api/admin/problems/${problem.id}/testcases`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                  });
                  const body = await res.json().catch(() => null);
                  if (!res.ok) {
                    const msg = body && typeof body.error === "string"
                      ? body.error
                      : `HTTP ${res.status}`;
                    throw new Error(msg);
                  }
                  const { testcase } = body as { testcase: AdminTestCase };
                  setTestcases((prev) => (prev ? [...prev, testcase] : [testcase]));
                  setNewInput("");
                  setNewOutput("");
                  setNewIsSample(false);
                  setNewCheckerScript("");
                } catch (e2) {
                  setTestcasesError(e2 instanceof Error ? e2.message : String(e2));
                } finally {
                  setIsSavingTestcase(false);
                }
              }}
            >
              <div className="form-row">
                <label>
                  入力:
                  <textarea
                    rows={4}
                    value={newInput}
                    onChange={(e) => setNewInput(e.target.value)}
                  />
                </label>
              </div>
              <div className="form-row">
                <label>
                  期待される出力:
                  <textarea
                    rows={4}
                    value={newOutput}
                    onChange={(e) => setNewOutput(e.target.value)}
                  />
                </label>
              </div>
              <div className="form-row">
                <label>
                  Sample:
                  <input
                    type="checkbox"
                    checked={newIsSample}
                    onChange={(e) => setNewIsSample(e.target.checked)}
                  />
                </label>
              </div>
              <div className="form-row">
                <label>
                  チェッカースクリプト (任意):
                  <textarea
                    rows={4}
                    value={newCheckerScript}
                    onChange={(e) => setNewCheckerScript(e.target.value)}
                  />
                </label>
              </div>
              <div className="form-row">
                <button
                  type="submit"
                  disabled={
                    !newInput.length || !newOutput.length || isSavingTestcase
                  }
                >
                  テストケース追加
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
