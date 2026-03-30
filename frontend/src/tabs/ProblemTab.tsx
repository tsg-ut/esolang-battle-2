import React from "react";

type AcceptedLanguage = {
  id: number;
  description: string;
  dockerImageId: string;
};

type ProblemDto = {
  id: number;
  problemStatement: string;
  contestId: number;
  acceptedLanguages: AcceptedLanguage[];
};

export function ProblemTab() {
  const [problem, setProblem] = React.useState<ProblemDto | null>(null);
  const [problemError, setProblemError] = React.useState<string | null>(null);
  const [isLoadingProblem, setIsLoadingProblem] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    setIsLoadingProblem(true);
    setProblemError(null);

    (async () => {
      try {
        const res = await fetch("/api/problems/1");
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

  if (isLoadingProblem) return <div>Loading problem...</div>;
  if (problemError) return <div style={{ color: "#b00020" }}>Error: {problemError}</div>;
  if (!problem) return <div>問題がありません。</div>;

  return (
    <div className="problem-view">
      <h2>問題 {problem.id}</h2>
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
    </div>
  );
}
