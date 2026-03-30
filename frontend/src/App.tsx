import React from "react";
import { BoardTab } from "./tabs/BoardTab";
import { ProblemTab } from "./tabs/ProblemTab";
import { SubmitTab } from "./tabs/SubmitTab";
import { SubmissionsTab } from "./tabs/SubmissionsTab";
import { CodeTestTab } from "./tabs/CodeTestTab";

type TabId = "board" | "problem" | "submit" | "submissions" | "codeTest";

export default function App() {
  const [activeTab, setActiveTab] = React.useState<TabId>("board");

  return (
    <div className="board-page">
      <div className="tab-bar">
        <button
          type="button"
          className={activeTab === "board" ? "tab active" : "tab"}
          onClick={() => setActiveTab("board")}
        >
          盤面
        </button>
        <button
          type="button"
          className={activeTab === "problem" ? "tab active" : "tab"}
          onClick={() => setActiveTab("problem")}
        >
          問題
        </button>
        <button
          type="button"
          className={activeTab === "submit" ? "tab active" : "tab"}
          onClick={() => setActiveTab("submit")}
        >
          提出
        </button>
        <button
          type="button"
          className={activeTab === "submissions" ? "tab active" : "tab"}
          onClick={() => setActiveTab("submissions")}
        >
          提出結果
        </button>
        <button
          type="button"
          className={activeTab === "codeTest" ? "tab active" : "tab"}
          onClick={() => setActiveTab("codeTest")}
        >
          コードテスト
        </button>
      </div>

      <div className="tab-content">
        {activeTab === "board" && <BoardTab />}
        {activeTab === "problem" && <ProblemTab />}
        {activeTab === "submit" && <SubmitTab />}
        {activeTab === "submissions" && <SubmissionsTab />}
        {activeTab === "codeTest" && <CodeTestTab />}
      </div>
    </div>
  );
}
