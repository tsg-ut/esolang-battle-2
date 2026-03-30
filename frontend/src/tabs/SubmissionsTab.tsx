import React from "react";

type SubmissionSummary = {
  id: number;
  codeLength: number;
  score: number;
  submittedAt: string;
  language: { id: number; name: string; description: string };
  problem: { id: number };
};

export function SubmissionsTab() {
  const [submissions, setSubmissions] = React.useState<SubmissionSummary[] | null>(null);
  const [submissionsError, setSubmissionsError] = React.useState<string | null>(null);
  const [isLoadingSubmissions, setIsLoadingSubmissions] = React.useState(false);

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

  if (isLoadingSubmissions) return <div>Loading submissions...</div>;
  if (submissionsError)
    return <div style={{ color: "#b00020" }}>Error: {submissionsError}</div>;
  if (!submissions || submissions.length === 0) return <div>提出はまだありません。</div>;

  return (
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
          <tr key={s.id}>
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
  );
}
