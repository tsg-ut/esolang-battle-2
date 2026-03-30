import React from "react";

type UserInfo = {
  id: number;
  name: string;
  isAdmin: boolean;
  team: { id: number; color: string } | null;
};

export function UserTab() {
  const [user, setUser] = React.useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [nameInput, setNameInput] = React.useState("");
  const [passwordInput, setPasswordInput] = React.useState("");
  const [registerNameInput, setRegisterNameInput] = React.useState("");
  const [registerPasswordInput, setRegisterPasswordInput] = React.useState("");
  const [authMessage, setAuthMessage] = React.useState<string | null>(null);

  const loadMe = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/me");
      if (res.status === 401) {
        setUser(null);
        return;
      }
      if (!res.ok) {
        throw new Error(`Failed to load current user: ${res.status}`);
      }
      const data = (await res.json()) as UserInfo;
      setUser(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadMe();
  }, [loadMe]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setAuthMessage(null);
    setError(null);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: nameInput, password: passwordInput }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        const msg = body && typeof body.error === "string" ? body.error : `HTTP ${res.status}`;
        throw new Error(msg);
      }
      setAuthMessage("ログインしました");
      setPasswordInput("");
      await loadMe();
    } catch (e) {
      setAuthMessage(null);
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  async function handleLogout() {
    setAuthMessage(null);
    setError(null);
    try {
      const res = await fetch("/api/logout", { method: "POST" });
      if (!res.ok) {
        throw new Error(`Failed to logout: ${res.status}`);
      }
      setUser(null);
      setAuthMessage("ログアウトしました");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  if (isLoading && !user) {
    return <div>Loading user...</div>;
  }

  return (
    <div className="problem-view">
      <h2>ユーザ</h2>
      {error && <div style={{ color: "#b00020" }}>Error: {error}</div>}
      {authMessage && <div className="submit-message">{authMessage}</div>}

      {user ? (
        <div style={{ marginTop: 16 }}>
          <p>
            ログイン中: <strong>{user.name}</strong>
          </p>
          <p>ロール: {user.isAdmin ? "管理者" : "一般ユーザ"}</p>
          <p>
            チーム: {user.team ? (
              <span>
                #{user.team.id} ({user.team.color})
              </span>
            ) : (
              <span>未所属</span>
            )}
          </p>
          <button type="button" onClick={handleLogout}>
            ログアウト
          </button>
        </div>
      ) : (
        <>
          <form className="submit-form" onSubmit={handleLogin} style={{ marginTop: 16 }}>
            <h3>ログイン</h3>
            <div className="form-row">
              <label>
                ユーザ名:
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                />
              </label>
            </div>
            <div className="form-row">
              <label>
                パスワード:
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                />
              </label>
            </div>
            <div className="form-row">
              <button type="submit" disabled={!nameInput || !passwordInput}>
                ログイン
              </button>
            </div>
          </form>

          <form
            className="submit-form"
            onSubmit={async (e) => {
              e.preventDefault();
              setAuthMessage(null);
              setError(null);
              try {
                const res = await fetch("/api/register", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    name: registerNameInput,
                    password: registerPasswordInput,
                  }),
                });
                const body = await res.json().catch(() => null);
                if (!res.ok) {
                  const msg = body && typeof body.error === "string"
                    ? body.error
                    : `HTTP ${res.status}`;
                  throw new Error(msg);
                }

                setAuthMessage("ユーザを登録し、ログインしました");
                setRegisterPasswordInput("");
                await loadMe();
              } catch (e2) {
                setAuthMessage(null);
                setError(e2 instanceof Error ? e2.message : String(e2));
              }
            }}
            style={{ marginTop: 32 }}
          >
            <h3>新規登録</h3>
            <div className="form-row">
              <label>
                ユーザ名:
                <input
                  type="text"
                  value={registerNameInput}
                  onChange={(e) => setRegisterNameInput(e.target.value)}
                />
              </label>
            </div>
            <div className="form-row">
              <label>
                パスワード:
                <input
                  type="password"
                  value={registerPasswordInput}
                  onChange={(e) => setRegisterPasswordInput(e.target.value)}
                />
              </label>
            </div>
            <div className="form-row">
              <button
                type="submit"
                disabled={!registerNameInput || !registerPasswordInput}
              >
                新規登録
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}
