import React from "react";

type OwnerColor = "neutral" | "red" | "blue";

type BoardCellDto = {
  x: number;
  y: number;
  languageId: number | null;
  languageName: string | null;
  owner: OwnerColor;
  score: number | null;
  canSubmit: boolean;
};

type BoardDto = {
  viewerType: "GRID";
  width: number;
  height: number;
  cells: BoardCellDto[];
};

type MeInfo = {
  id: number;
  name: string;
  isAdmin: boolean;
  team: { id: number; color: string } | null;
};

function cellClass(color: OwnerColor): string {
  switch (color) {
    case "red":
      return "cell cell-red";
    case "blue":
      return "cell cell-blue";
    default:
      return "cell cell-neutral";
  }
}

export function BoardTab({ contestId }: { contestId: number }) {
  const [board, setBoard] = React.useState<BoardDto | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [boardSize, setBoardSize] = React.useState<{ width: number; height: number } | null>(
    null,
  );
  const [submittableLanguageIds, setSubmittableLanguageIds] = React.useState<number[] | null>(
    null,
  );
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);
  const [requiresLogin, setRequiresLogin] = React.useState(false);
  const [me, setMe] = React.useState<MeInfo | null>(null);
  const [isLoadingMe, setIsLoadingMe] = React.useState(false);
  const [isUpdatingBoard, setIsUpdatingBoard] = React.useState(false);
  const [updateError, setUpdateError] = React.useState<string | null>(null);

  const reloadBoard = React.useCallback(async () => {
    try {
      const res = await fetch(`/api/contests/${contestId}/board`);
      if (!res.ok) {
        throw new Error(`Failed to load board: ${res.status}`);
      }
      const data = (await res.json()) as BoardDto;

      if (data.viewerType !== "GRID") {
        setError("Unsupported board viewer type");
        return;
      }
      setBoard(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [contestId]);

  React.useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        if (!cancelled) {
          await reloadBoard();
        }
      } catch {
        // reloadBoard 内でエラー処理済み
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [reloadBoard]);

  React.useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/submittable_languages");
        if (res.status === 401) {
          if (!cancelled) {
            setRequiresLogin(true);
            setSubmittableLanguageIds(null);
          }
          return;
        }
        if (!res.ok) {
          throw new Error(`Failed to load submittable languages: ${res.status}`);
        }
        const data = (await res.json()) as { languageIds: number[] };
        if (!cancelled) {
          setSubmittableLanguageIds(data.languageIds ?? []);
        }
      } catch (e) {
        if (!cancelled) {
          // エラー時は何も表示せず、クライアント側チェックをスキップ
          setSubmittableLanguageIds(null);
        }
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
          return;
        }
        if (!res.ok) {
          throw new Error(`Failed to load current user: ${res.status}`);
        }
        const data = (await res.json()) as MeInfo;
        if (!cancelled) setMe(data);
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

  async function handleUpdateBoard() {
    setUpdateError(null);
    setIsUpdatingBoard(true);
    try {
      const res = await fetch(`/api/contests/${contestId}/board/update`, { method: "POST" });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        const msg = body && typeof body.error === "string" ? body.error : `HTTP ${res.status}`;
        throw new Error(msg);
      }

      await reloadBoard();
    } catch (e) {
      setUpdateError(e instanceof Error ? e.message : String(e));
    } finally {
      setIsUpdatingBoard(false);
    }
  }

  async function handleRecomputeBoard() {
    setUpdateError(null);
    setIsUpdatingBoard(true);
    try {
      const res = await fetch(`/api/contests/${contestId}/board/recompute`, { method: "POST" });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        const msg = body && typeof body.error === "string" ? body.error : `HTTP ${res.status}`;
        throw new Error(msg);
      }

      await reloadBoard();
    } catch (e) {
      setUpdateError(e instanceof Error ? e.message : String(e));
    } finally {
      setIsUpdatingBoard(false);
    }
  }

  React.useEffect(() => {
    if (!board) return;

    function updateBoardSize() {
      const padding = 48;
      const headerReserve = 96;

      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      const maxWidth = Math.max(viewportWidth - padding * 2, 0);
      const maxHeight = Math.max(viewportHeight - headerReserve - padding * 2, 0);

      if (maxWidth <= 0 || maxHeight <= 0) {
        return;
      }

      const cellSize = Math.min(maxWidth / board!.width, maxHeight / board!.height);
      const boardWidth = cellSize * board!.width;
      const boardHeight = cellSize * board!.height;

      setBoardSize({ width: boardWidth, height: boardHeight });
    }

    updateBoardSize();
    window.addEventListener("resize", updateBoardSize);

    return () => {
      window.removeEventListener("resize", updateBoardSize);
    };
  }, [board]);

  if (error) {
    return <div style={{ color: "#b00020", marginTop: "16px" }}>Error: {error}</div>;
  }
  if (!board) {
    return <div style={{ marginTop: "16px" }}>Loading board...</div>;
  }

  const { width, height, cells } = board;

  return (
    <div>
      {me && me.isAdmin && (
        <div style={{ marginBottom: 8, display: "flex", alignItems: "center", gap: 8 }}>
          <button type="button" onClick={handleUpdateBoard} disabled={isUpdatingBoard}>
            {isUpdatingBoard ? "盤面更新中..." : "盤面更新"}
          </button>
          <button type="button" onClick={handleRecomputeBoard} disabled={isUpdatingBoard}>
            {isUpdatingBoard ? "再計算中..." : "盤面再計算"}
          </button>
          {updateError && <span style={{ color: "#b00020" }}>Error: {updateError}</span>}
        </div>
      )}

      <div
        className="board"
        style={{
          gridTemplateColumns: `repeat(${width}, 1fr)` ,
          gridTemplateRows: `repeat(${height}, 1fr)` ,
          width: boardSize ? `${boardSize.width}px` : undefined,
          height: boardSize ? `${boardSize.height}px` : undefined,
        }}
      >
      {cells.map((cell, index) => (
        <div
          key={index}
          className={cellClass(cell.owner)}
          style={cell.languageId !== null ? { cursor: "pointer" } : undefined}
          onClick={() => {
            if (cell.languageId === null) return;

            if (requiresLogin) {
              setToastMessage("ログインしていません");
              setTimeout(() => {
                setToastMessage(null);
              }, 2000);
              return;
            }

            if (Array.isArray(submittableLanguageIds)) {
              if (!submittableLanguageIds.includes(cell.languageId)) {
                setToastMessage("ルール上このマスの言語には提出できません");
                setTimeout(() => {
                  setToastMessage(null);
                }, 2000);
                return;
              }
            }

            const url = new URL(window.location.href);
            url.pathname = `/contest/${contestId}/submit`;
            url.searchParams.set("languageId", String(cell.languageId));
            window.history.pushState(null, "", url.toString());
            window.dispatchEvent(new PopStateEvent("popstate"));
          }}
        >
          <div className="cell-label">
            {cell.languageName && (
              <div className="cell-label-name">{cell.languageName}</div>
            )}
            {cell.score !== null && (
              <div className="cell-label-score">{cell.score}</div>
            )}
          </div>
        </div>
      ))}

      {toastMessage && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "rgba(0,0,0,0.8)",
            color: "#fff",
            padding: "8px 16px",
            borderRadius: 4,
            zIndex: 1000,
            fontSize: 14,
          }}
        >
          {toastMessage}
        </div>
      )}
    </div>
    </div>
  );
}
