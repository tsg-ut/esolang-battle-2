import React from "react";
import { BoardTab } from "./tabs/BoardTab";
import { ProblemTab } from "./tabs/ProblemTab";
import { SubmitTab } from "./tabs/SubmitTab";
import { SubmissionsTab } from "./tabs/SubmissionsTab";
import { CodeTestTab } from "./tabs/CodeTestTab";
import { UserTab } from "./tabs/UserTab";
import { AdminUsersTab } from "./tabs/AdminUsersTab";

type MeInfo = {
  id: number;
  name: string;
  isAdmin: boolean;
  team: { id: number; color: string } | null;
};

type ContestTabId = "board" | "problem" | "submit" | "submissions" | "codeTest";

type Route =
  | { kind: "contests" }
  | { kind: "contest"; contestId: number; tab: ContestTabId }
  | { kind: "user" }
  | { kind: "adminUsers" };

function parseRoute(pathname: string): Route {
  if (pathname === "/user") return { kind: "user" };
  if (pathname === "/admin/users") return { kind: "adminUsers" };

  const segments = pathname.split("/").filter(Boolean); // ["contest",":id",":tab?"]
  if (segments[0] === "contest") {
    const id = Number(segments[1]);
    const tabSegment = segments[2] ?? "board";
    const tab: ContestTabId =
      tabSegment === "problem" ||
      tabSegment === "submit" ||
      tabSegment === "submissions" ||
      tabSegment === "code_test"
        ? (tabSegment === "code_test" ? "codeTest" : (tabSegment as ContestTabId))
        : "board";
    if (Number.isFinite(id) && id > 0) {
      return { kind: "contest", contestId: id, tab };
    }
  }

  return { kind: "contests" };
}

function routeToPath(route: Route): string {
  switch (route.kind) {
    case "user":
      return "/user";
    case "adminUsers":
      return "/admin/users";
    case "contests":
      return "/contests";
    case "contest": {
      const base = `/contest/${route.contestId}`;
      switch (route.tab) {
        case "board":
          return `${base}/board`;
        case "problem":
          return `${base}/problem`;
        case "submit":
          return `${base}/submit`;
        case "submissions":
          return `${base}/submissions`;
        case "codeTest":
          return `${base}/code_test`;
        default:
          return `${base}/board`;
      }
    }
    default:
      return "/contests";
  }
}

export default function App() {
  const [route, setRoute] = React.useState<Route>(() => parseRoute(window.location.pathname));
  const [me, setMe] = React.useState<MeInfo | null>(null);
  const [isLoadingMe, setIsLoadingMe] = React.useState(false);

  React.useEffect(() => {
    // 初回に "/" へアクセスされた場合は /contests にリダイレクト
    if (window.location.pathname === "/") {
      window.history.replaceState(null, "", "/contests");
      setRoute({ kind: "contests" });
    }

    const handlePopState = () => {
      setRoute(parseRoute(window.location.pathname));
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
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

  const navigate = (next: Route) => {
    const path = routeToPath(next);
    if (path === window.location.pathname) {
      setRoute(next);
      return;
    }
    window.history.pushState(null, "", path);
    setRoute(next);
  };

  // グローバルからもタブ遷移できるようにする（Submit 成功後など）
  (window as any).navigateToTab = (tab: ContestTabId) => {
    if (route.kind === "contest") {
      navigate({ kind: "contest", contestId: route.contestId, tab });
    }
  };

  // 非管理者が adminUsers にアクセスした場合は contests に戻す
  React.useEffect(() => {
    if (route.kind === "adminUsers" && (!me || !me.isAdmin)) {
      navigate({ kind: "contests" });
    }
  }, [route, me]);

  const userAdminButtons = (
    <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
      <button
        type="button"
        className={route.kind === "user" ? "tab active" : "tab"}
        onClick={() => navigate({ kind: "user" })}
      >
        ユーザ
      </button>
      {me && me.isAdmin && (
        <button
          type="button"
          className={route.kind === "adminUsers" ? "tab active" : "tab"}
          onClick={() => navigate({ kind: "adminUsers" })}
        >
          Admin
        </button>
      )}
    </div>
  );

  if (route.kind === "user") {
    return (
      <div className="board-page">
        <div className="tab-bar">
          <button
            type="button"
            className="tab"
            onClick={() => navigate({ kind: "contests" })}
          >
            コンテスト一覧
          </button>
          {userAdminButtons}
        </div>
        <div className="tab-content">
          <UserTab />
        </div>
      </div>
    );
  }

  if (route.kind === "adminUsers") {
    return (
      <div className="board-page">
        <div className="tab-bar">
          <button
            type="button"
            className="tab"
            onClick={() => navigate({ kind: "contests" })}
          >
            コンテスト一覧
          </button>
          {userAdminButtons}
        </div>
        <div className="tab-content">
          {me && me.isAdmin && <AdminUsersTab />}
        </div>
      </div>
    );
  }

  if (route.kind === "contests") {
    return (
      <div className="board-page">
        <div className="tab-bar">
          <span className="tab active">コンテスト一覧</span>
          {userAdminButtons}
        </div>
        <div className="tab-content">
          <ContestsTab onSelectContest={(id) => navigate({ kind: "contest", contestId: id, tab: "board" })} />
        </div>
      </div>
    );
  }

  // contest view
  if (route.kind === "contest") {
    const { contestId, tab } = route;
    return (
      <div className="board-page">
        <div className="tab-bar">
          <button
            type="button"
            className="tab"
            onClick={() => navigate({ kind: "contests" })}
          >
            &lt; コンテスト一覧
          </button>
          <button
            type="button"
            className={tab === "board" ? "tab active" : "tab"}
            onClick={() => navigate({ kind: "contest", contestId, tab: "board" })}
          >
            盤面
          </button>
          <button
            type="button"
            className={tab === "problem" ? "tab active" : "tab"}
            onClick={() => navigate({ kind: "contest", contestId, tab: "problem" })}
          >
            問題
          </button>
          <button
            type="button"
            className={tab === "submit" ? "tab active" : "tab"}
            onClick={() => navigate({ kind: "contest", contestId, tab: "submit" })}
          >
            提出
          </button>
          <button
            type="button"
            className={tab === "submissions" ? "tab active" : "tab"}
            onClick={() => navigate({ kind: "contest", contestId, tab: "submissions" })}
          >
            提出結果
          </button>
          <button
            type="button"
            className={tab === "codeTest" ? "tab active" : "tab"}
            onClick={() => navigate({ kind: "contest", contestId, tab: "codeTest" })}
          >
            コードテスト
          </button>
          {userAdminButtons}
        </div>
        <div className="tab-content">
          {tab === "board" && <BoardTab contestId={contestId} />}
          {tab === "problem" && <ProblemTab contestId={contestId} />}
          {tab === "submit" && <SubmitTab contestId={contestId} />}
          {tab === "submissions" && <SubmissionsTab contestId={contestId} />}
          {tab === "codeTest" && <CodeTestTab contestId={contestId} />}
        </div>
      </div>
    );
  }

  // Fallback
  navigate({ kind: "contests" });
  return null;
}

type ContestSummary = {
  id: number;
  name: string;
  viewerType: string;
  startAt: string;
  endAt: string;
};

function ContestsTab(props: { onSelectContest: (id: number) => void }) {
  const [contests, setContests] = React.useState<ContestSummary[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    (async () => {
      try {
        const res = await fetch("/api/contests");
        const body = await res.json().catch(() => null);
        if (!res.ok) {
          const msg = body && typeof body.error === "string" ? body.error : `HTTP ${res.status}`;
          throw new Error(msg);
        }
        const data = body as { contests: ContestSummary[] };
        if (!cancelled) {
          setContests(data.contests);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : String(e));
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (isLoading) return <div>Loading contests...</div>;
  if (error) return <div style={{ color: "#b00020" }}>Error: {error}</div>;
  if (!contests || contests.length === 0) return <div>コンテストがありません。</div>;

  return (
    <div>
      <ul>
        {contests.map((c) => (
          <li key={c.id}>
            <button type="button" onClick={() => props.onSelectContest(c.id)}>
              {c.name} (ID {c.id})
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
