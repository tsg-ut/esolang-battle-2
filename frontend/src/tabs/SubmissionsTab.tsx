import React from "react";

type SubmissionSummary = {
  id: number;
  codeLength: number;
  score: number;
  submittedAt: string;
  language: { id: number; name: string; description: string };
  problem: { id: number };
};

type ExecutionDto = {
  testcaseId: number;
  status: string;
  stdout: string | null;
  stderr: string | null;
  executionTime: number;
  executedAt: string;
  testcase: {
    id: number;
    input: string;
    output: string;
    isSample: boolean;
  };
};

type SubmissionDetail = {
  id: number;
  code: string;
  codeLength: number;
  score: number;
  submittedAt: string;
  language: { id: number; name: string; description: string };
  problem: { id: number };
  executions: ExecutionDto[];
};

export function SubmissionsTab() {
  const [submissions, setSubmissions] = React.useState<SubmissionSummary[] | null>(null);
  const [submissionsError, setSubmissionsError] = React.useState<string | null>(null);
  const [isLoadingSubmissions, setIsLoadingSubmissions] = React.useState(false);

  const [selectedId, setSelectedId] = React.useState<number | null>(null);
  const [detail, setDetail] = React.useState<SubmissionDetail | null>(null);
  const [detailError, setDetailError] = React.useState<string | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    setIsLoadingSubmissions(true);
    setSubmissionsError(null);

    (async () => {
      try {
        const res = await fetch("/api/submissions", {
          headers: {
            "X-User-Id": "1",
          },
        });
        if (!res.ok) throw new Error(`Failed to load submissions: ${res.status}`);
        const data = (await res.json()) as { submissions: SubmissionSummary[] };
        if (!cancelled) {
          setSubmissions(data.submissions);
        }
      } catch (e) {
        if (!cancelled) {
          setSubmissionsError(e instanceof Error ? e.message : String(e));
        }
      } finally {
        if (!cancelled) setIsLoadingSubmissions(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  async function loadDetail(id: number) {
    setDetailError(null);
    setIsLoadingDetail(true);
    try {
      const res = await fetch(`/api/submissions/${id}`, {
        headers: {
          "X-User-Id": "1",
        },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        const msg = body && typeof body.error === "string" ? body.error : `HTTP ${res.status}`;
        throw new Error(`Failed to load submission detail: ${msg}`);
      }
      const data = (await res.json()) as SubmissionDetail;
      setDetail(data);
    } catch (e) {
      setDetail(null);
      setDetailError(e instanceof Error ? e.message : String(e));
    } finally {
      setIsLoadingDetail(false);
    }
  }

  if (isLoadingSubmissions) return <div>Loading submissions...</div>;
  if (submissionsError)
    return <div style={{ color: "#b00020" }}>Error: {submissionsError}</div>;
  if (!submissions || submissions.length === 0) return <div>提出はまだありません。</div>;

  return (
    <div style={{ width: "100%", maxWidth: 900 }}>
      <table className="submissions-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>問題ID</th>
            <th>言語</th>
            <th>コード長</th>
            <th>スコア</th>
            <th>提出時刻</th>
          </tr>
        </thead>
        <tbody>
          {submissions.map((s) => (
            <tr
              key={s.id}
              style={{ cursor: "pointer", background: selectedId === s.id ? "#eef2ff" : "" }}
              onClick={() => {
                setSelectedId(s.id);
                loadDetail(s.id);
              }}
            >
              <td>{s.id}</td>
              <td>{s.problem.id}</td>
              <td>{s.language.name}</td>
              <td>{s.codeLength}</td>
              <td>{s.score}</td>
              <td>{new Date(s.submittedAt).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ marginTop: 16 }}>
        {isLoadingDetail && <div>Loading detail...</div>}
        {detailError && <div style={{ color: "#b00020" }}>Error: {detailError}</div>}
        {detail && !isLoadingDetail && (
          <div className="problem-view">
            <h3>
              提出 {detail.id} の詳細 (問題 {detail.problem.id}, 言語 {detail.language.name})
            </h3>
            <h4>コード</h4>
            <pre className="problem-statement">{detail.code}</pre>
            <h4>テストケース結果</h4>
            {detail.executions.length === 0 ? (
              <div>Execution がまだありません。</div>
            ) : (
              <table className="submissions-table">
                <thead>
                  <tr>
                    <th>TestCase ID</th>
                    <th>Sample</th>
                    <th>Status</th>
                    <th>Expected Output</th>
                    <th>Stdout</th>
                    <th>Stderr</th>
                    <th>Time (ms)</th>
                  </tr>
                </thead>
                <tbody>
                  {detail.executions.map((e) => (
                    <tr key={e.testcaseId}>
                      <td>{e.testcaseId}</td>
                      <td>{e.testcase.isSample ? "Yes" : "No"}</td>
                      <td>{e.status}</td>
                      <td>
                        <pre className="problem-statement">{e.testcase.output}</pre>
                      </td>
                      <td>
                        <pre className="problem-statement">{e.stdout ?? ""}</pre>
                      </td>
                      <td>
                        <pre className="problem-statement">{e.stderr ?? ""}</pre>
                      </td>
                      <td>{e.executionTime}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
