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

export default function App() {
  const [board, setBoard] = React.useState<BoardDto | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const [boardSize, setBoardSize] = React.useState<{ width: number; height: number } | null>(
    null,
  );

  React.useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/boards/1");
        if (!res.ok) {
          throw new Error(`Failed to load board: ${res.status}`);
        }
        const data = (await res.json()) as BoardDto;

        if (!cancelled) {
          if (data.viewerType !== "GRID") {
            setError("Unsupported board viewer type");
            return;
          }
          setBoard(data);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : String(e));
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  React.useEffect(() => {
    if (!board) return;

    function updateBoardSize() {
      const padding = 48; // 上下左右に少し余白を残す
      const headerReserve = 96; // タイトル分の高さをざっくり確保

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
    return (
      <div className="board-page">
        <header className="board-header">Esolang Battle 2</header>
        <div style={{ color: "#b00020", marginTop: "16px" }}>Error: {error}</div>
      </div>
    );
  }

  if (!board) {
    return (
      <div className="board-page">
        <header className="board-header">Esolang Battle 2</header>
        <div style={{ marginTop: "16px" }}>Loading board...</div>
      </div>
    );
  }

  const { width, height, cells } = board;

  return (
    <div className="board-page">
      <header className="board-header">Esolang Battle 2</header>
      <div
        className="board"
        style={{
          gridTemplateColumns: `repeat(${width}, 1fr)`,
          gridTemplateRows: `repeat(${height}, 1fr)`,
          width: boardSize ? `${boardSize.width}px` : undefined,
          height: boardSize ? `${boardSize.height}px` : undefined,
        }}
      >
        {cells.map((cell, index) => (
          <div key={index} className={cellClass(cell.owner)}>
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
      </div>
    </div>
  );
}
