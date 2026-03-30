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

type TabId =
  | "board"
  | "problem"
  | "submit"
  | "submissions"
  | "codeTest"
  | "user"
  | "adminUsers";

function pathnameToTab(pathname: string): TabId {
  if (pathname === "/problem") return "problem";
  if (pathname === "/submit") return "submit";
  if (pathname === "/submissions") return "submissions";
  if (pathname === "/code_test") return "codeTest";
  if (pathname === "/user") return "user";
  if (pathname === "/admin/users") return "adminUsers";
  // "/" やその他は盤面扱い
  return "board";
}

function tabToPath(tab: TabId): string {
  switch (tab) {
    case "problem":
      return "/problem";
    case "submit":
      return "/submit";
    case "submissions":
      return "/submissions";
    case "codeTest":
      return "/code_test";
    case "user":
      return "/user";
    case "adminUsers":
      return "/admin/users";
    case "board":
    default:
      return "/board";
  }
}

export default function App() {
  const [currentPath, setCurrentPath] = React.useState<string>(() => window.location.pathname);
  const [me, setMe] = React.useState<MeInfo | null>(null);
  const [isLoadingMe, setIsLoadingMe] = React.useState(false);

  React.useEffect(() => {
    // 初回に "/" へアクセスされた場合は /board にリダイレクト
    if (window.location.pathname === "/") {
      window.history.replaceState(null, "", "/board");
      setCurrentPath("/board");
    }

    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
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

  const activeTab: TabId = pathnameToTab(currentPath);

  const navigate = (tab: TabId) => {
    const nextPath = tabToPath(tab);
    if (nextPath === window.location.pathname) {
      setCurrentPath(nextPath);
      return;
    }
    window.history.pushState(null, "", nextPath);
    setCurrentPath(nextPath);
  };

  // グローバルからもタブ遷移できるようにする（Submit 成功後など）
  (window as any).navigateToTab = (tab: TabId) => {
    navigate(tab);
  };

  React.useEffect(() => {
    if (activeTab === "adminUsers" && (!me || !me.isAdmin)) {
      navigate("board");
    }
  }, [activeTab, me]);

  return (
    <div className="board-page">
      <div className="tab-bar">
        <button
          type="button"
          className={activeTab === "board" ? "tab active" : "tab"}
          onClick={() => navigate("board")}
        >
          盤面
        </button>
        <button
          type="button"
          className={activeTab === "problem" ? "tab active" : "tab"}
          onClick={() => navigate("problem")}
        >
          問題
        </button>
        <button
          type="button"
          className={activeTab === "submit" ? "tab active" : "tab"}
          onClick={() => navigate("submit")}
        >
          提出
        </button>
        <button
          type="button"
          className={activeTab === "submissions" ? "tab active" : "tab"}
          onClick={() => navigate("submissions")}
        >
          提出結果
        </button>
        <button
          type="button"
          className={activeTab === "codeTest" ? "tab active" : "tab"}
          onClick={() => navigate("codeTest")}
        >
          コードテスト
        </button>
        <button
          type="button"
          className={activeTab === "user" ? "tab active" : "tab"}
          onClick={() => navigate("user")}
        >
          ユーザ
        </button>
        {me && me.isAdmin && (
          <button
            type="button"
            className={activeTab === "adminUsers" ? "tab active" : "tab"}
            onClick={() => navigate("adminUsers")}
          >
            Admin
          </button>
        )}
      </div>

      <div className="tab-content">
        {activeTab === "board" && <BoardTab />}
        {activeTab === "problem" && <ProblemTab />}
        {activeTab === "submit" && <SubmitTab />}
        {activeTab === "submissions" && <SubmissionsTab />}
        {activeTab === "codeTest" && <CodeTestTab />}
        {activeTab === "user" && <UserTab />}
        {activeTab === "adminUsers" && me && me.isAdmin && <AdminUsersTab />}
      </div>
    </div>
  );
}
