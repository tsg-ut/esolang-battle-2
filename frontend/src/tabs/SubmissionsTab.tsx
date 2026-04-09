import React from "react";

type SubmissionSummary = {
  id: number;
  codeLength: number;
  score: number;
  submittedAt: string;
  user: { id: number; name: string; teams: { id: number; color: string; contestId: number }[] };
  language: { id: number; name: string; description: string };
  problem: { id: number; title: string };
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
  problem: { id: number; title: string };
  executions: ExecutionDto[];
};

type MeInfo = {
  id: number;
  name: string;
  isAdmin: boolean;
  teams: { id: number; color: string; contestId: number }[];
};

type Scope = "self" | "team" | "all";

export function SubmissionsTab(props: { contestId: number }) {
  const [me, setMe] = React.useState<MeInfo | null>(null);
  const [meError, setMeError] = React.useState<string | null>(null);
  const [isLoadingMe, setIsLoadingMe] = React.useState(false);

  const [submissions, setSubmissions] = React.useState<SubmissionSummary[] | null>(null);
  const [submissionsError, setSubmissionsError] = React.useState<string | null>(null);
  const [isLoadingSubmissions, setIsLoadingSubmissions] = React.useState(false);

  const [scope, setScope] = React.useState<Scope>("self");

  const [selectedId, setSelectedId] = React.useState<number | null>(null);
  const [detail, setDetail] = React.useState<SubmissionDetail | null>(null);
  const [detailError, setDetailError] = React.useState<string | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = React.useState(false);

  const myTeamInContest = me?.teams.find((t) => t.contestId === props.contestId);

  React.useEffect(() => {
    let cancelled = false;
    setIsLoadingMe(true);
    setMeError(null);

    (async () => {
      try {
        const res = await fetch("/api/me");
        if (res.status === 401) {
          if (!cancelled) {
            setMe(null);
          }
        } else if (!res.ok) {
          throw new Error(`Failed to load current user: ${res.status}`);
        } else {
          const data = (await res.json()) as MeInfo;
          if (!cancelled) {
            setMe(data);
          }
        }
      } catch (e) {
        if (!cancelled) {
          setMeError(e instanceof Error ? e.message : String(e));
        }
      } finally {
        if (!cancelled) setIsLoadingMe(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    setIsLoadingSubmissions(true);
    setSubmissionsError(null);

    (async () => {
      try {
        const params = new URLSearchParams();
        params.set("scope", scope);
        const res = await fetch(
          `/api/contests/${props.contestId}/submissions?${params.toString()}`,
        );
        const body = await res.json().catch(() => null);
        if (!res.ok) {
          const msg = body && typeof body.error === "string"
            ? body.error
            : `Failed to load submissions: ${res.status}`;
          throw new Error(msg);
        }
        const data = body as { submissions: SubmissionSummary[] };
        if (!cancelled) {
          setSubmissions(data.submissions);
        }
      } catch (e) {
        if (!cancelled) {
          setSubmissionsError(e instanceof Error ? e.message : String(e));
          setSubmissions(null);
        }
      } finally {
        if (!cancelled) setIsLoadingSubmissions(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [scope]);

  async function loadDetail(id: number) {
    setDetailError(null);
    setIsLoadingDetail(true);
    try {
      const res = await fetch(`/api/submissions/${id}`);
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

  return (
    <div style={{ width: "100%", maxWidth: 900 }}>
        <div style={{ marginBottom: 12, display: "flex", gap: 8 }}>
          <button
            type="button"
            onClick={() => setScope("self")}
            disabled={scope === "self" || isLoadingSubmissions}
          >
            自分の提出
          </button>
          <button
            type="button"
            onClick={() => setScope("team")}
            disabled={scope === "team" || isLoadingSubmissions || !myTeamInContest}
          >
            自チームの提出
          </button>
          {me && me.isAdmin && (
            <button
              type="button"
              onClick={() => setScope("all")}
              disabled={scope === "all" || isLoadingSubmissions}
            >
              全ての提出
            </button>
          )}
        </div>

        {isLoadingMe && <div>現在のユーザ情報を読み込み中...</div>}
        {meError && <div style={{ color: "#b00020" }}>User Error: {meError}</div>}

        {isLoadingSubmissions && <div>Loading submissions...</div>}
        {submissionsError && (
          <div style={{ color: "#b00020" }}>Error: {submissionsError}</div>
        )}
        {!isLoadingSubmissions && !submissionsError && (!submissions || submissions.length === 0) && (
          <div>提出はまだありません。</div>
        )}

        {submissions && submissions.length > 0 && (
      <table className="submissions-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>ユーザ</th>
            <th>チーム色</th>
            <th>問題タイトル</th>
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
              <td>{s.user.name}</td>
              <td>{s.user.teams.find((t) => t.contestId === props.contestId)?.color ?? "-"}</td>
              <td>{s.problem.title}</td>
              <td>{s.language.name}</td>
              <td>{s.codeLength}</td>
              <td>{s.score}</td>
              <td>{new Date(s.submittedAt).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>

      )}

      <div style={{ marginTop: 16 }}>
        {isLoadingDetail && <div>Loading detail...</div>}
        {detailError && <div style={{ color: "#b00020" }}>Error: {detailError}</div>}
        {detail && !isLoadingDetail && (
          <div className="problem-view">
            <h3>
              提出 {detail.id} の詳細 (問題 {detail.problem.title} / ID {detail.problem.id}, 言語 {detail.language.name})
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
