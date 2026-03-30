import React from "react";

type UserRow = {
  id: number;
  name: string;
  isAdmin: boolean;
  team: { id: number; color: string } | null;
};

type TeamRow = {
  id: number;
  color: string;
  contestId: number;
};

type ProblemRow = {
  id: number;
  contestId: number;
  problemStatement: string;
};

export function AdminUsersTab() {
  const [users, setUsers] = React.useState<UserRow[] | null>(null);
  const [teams, setTeams] = React.useState<TeamRow[] | null>(null);
  const [problems, setProblems] = React.useState<ProblemRow[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [problemForm, setProblemForm] = React.useState<{
    id: number | null;
    contestId: string;
    problemStatement: string;
  }>({ id: null, contestId: "", problemStatement: "" });
  const [isSavingProblem, setIsSavingProblem] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    (async () => {
      try {
        const [usersRes, teamsRes, problemsRes] = await Promise.all([
          fetch("/api/admin/users"),
          fetch("/api/teams"),
          fetch("/api/admin/problems"),
        ]);

        if (usersRes.status === 401) {
          throw new Error("ログインが必要です");
        }
        if (usersRes.status === 403) {
          throw new Error("管理者のみユーザ一覧を参照できます");
        }
        if (!usersRes.ok) {
          throw new Error(`Failed to load users: ${usersRes.status}`);
        }
        if (!teamsRes.ok) {
          throw new Error(`Failed to load teams: ${teamsRes.status}`);
        }
        if (!problemsRes.ok) {
          throw new Error(`Failed to load problems: ${problemsRes.status}`);
        }

        const usersBody = (await usersRes.json()) as { users: UserRow[] };
        const teamsBody = (await teamsRes.json()) as { teams: TeamRow[] };
        const problemsBody = (await problemsRes.json()) as { problems: ProblemRow[] };

        if (!cancelled) {
          setUsers(usersBody.users);
          setTeams(teamsBody.teams);
          setProblems(problemsBody.problems);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : String(e));
          setUsers(null);
          setTeams(null);
          setProblems(null);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  async function updateUserTeam(userId: number, teamId: number | null) {
    setIsSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${userId}/team`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        const msg = body && typeof body.error === "string" ? body.error : `HTTP ${res.status}`;
        throw new Error(msg);
      }
      const updated = body as UserRow;
      setUsers((prev) =>
        prev
          ? prev.map((u) => (u.id === updated.id ? { ...u, team: updated.team } : u))
          : prev,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return <div>Loading users...</div>;
  }

  if (error) {
    return <div style={{ color: "#b00020" }}>Error: {error}</div>;
  }

  return (
    <div className="problem-view">
      <h2>ユーザ / チーム管理</h2>
      {isSaving && <div>保存中...</div>}
      {users && users.length > 0 ? (
        <table className="submissions-table" style={{ marginTop: 12 }}>
          <thead>
            <tr>
              <th>ID</th>
              <th>ユーザ名</th>
              <th>ロール</th>
              <th>チーム</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.id}</td>
                <td>{u.name}</td>
                <td>{u.isAdmin ? "admin" : "user"}</td>
                <td>
                  {teams && (
                    <select
                      value={u.team ? String(u.team.id) : ""}
                      onChange={(e) => {
                        const value = e.target.value;
                        const nextTeamId = value === "" ? null : Number(value);
                        void updateUserTeam(u.id, nextTeamId);
                      }}
                    >
                      <option value="">未所属</option>
                      {teams.map((t) => (
                        <option key={t.id} value={t.id}>
                          #{t.id} ({t.color})
                        </option>
                      ))}
                    </select>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div style={{ marginTop: 12 }}>ユーザがいません。</div>
      )}

      <hr style={{ margin: "24px 0" }} />

      <h2>問題管理</h2>
      {isSavingProblem && <div>問題を保存中...</div>}

      <form
        className="submit-form"
        onSubmit={async (e) => {
          e.preventDefault();
          setError(null);
          setIsSavingProblem(true);
          try {
            const contestIdNum = Number(problemForm.contestId);
            if (!Number.isFinite(contestIdNum) || contestIdNum <= 0) {
              throw new Error("contestId must be a positive number");
            }
            const payload = {
              contestId: contestIdNum,
              problemStatement: problemForm.problemStatement,
            };

            if (problemForm.id === null) {
              const res = await fetch("/api/admin/problems", {
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
              const { problem } = body as { problem: ProblemRow };
              setProblems((prev) => (prev ? [...prev, problem] : [problem]));
            } else {
              const res = await fetch(`/api/admin/problems/${problemForm.id}`, {
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
              const { problem } = body as { problem: ProblemRow };
              setProblems((prev) =>
                prev ? prev.map((p) => (p.id === problem.id ? problem : p)) : [problem],
              );
            }

            setProblemForm({ id: null, contestId: "", problemStatement: "" });
          } catch (e2) {
            setError(e2 instanceof Error ? e2.message : String(e2));
          } finally {
            setIsSavingProblem(false);
          }
        }}
        style={{ marginTop: 12 }}
      >
        <div className="form-row">
          <label>
            Contest ID:
            <input
              type="number"
              min={1}
              value={problemForm.contestId}
              onChange={(e) =>
                setProblemForm((f) => ({ ...f, contestId: e.target.value }))
              }
            />
          </label>
        </div>
        <div className="form-row">
          <label>
            問題文:
            <textarea
              rows={6}
              value={problemForm.problemStatement}
              onChange={(e) =>
                setProblemForm((f) => ({ ...f, problemStatement: e.target.value }))
              }
            />
          </label>
        </div>
        <div className="form-row" style={{ gap: 8 }}>
          <button
            type="submit"
            disabled={!problemForm.contestId || !problemForm.problemStatement.trim()}
          >
            {problemForm.id === null ? "新規追加" : "更新"}
          </button>
          {problemForm.id !== null && (
            <button
              type="button"
              onClick={() => setProblemForm({ id: null, contestId: "", problemStatement: "" })}
            >
              キャンセル
            </button>
          )}
        </div>
      </form>

      {problems && problems.length > 0 && (
        <table className="submissions-table" style={{ marginTop: 16 }}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Contest ID</th>
              <th>問題文（先頭だけ表示）</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {problems.map((p) => (
              <tr key={p.id}>
                <td>{p.id}</td>
                <td>{p.contestId}</td>
                <td>{p.problemStatement.slice(0, 40)}{p.problemStatement.length > 40 ? "..." : ""}</td>
                <td>
                  <button
                    type="button"
                    onClick={() =>
                      setProblemForm({
                        id: p.id,
                        contestId: String(p.contestId),
                        problemStatement: p.problemStatement,
                      })
                    }
                  >
                    編集
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
