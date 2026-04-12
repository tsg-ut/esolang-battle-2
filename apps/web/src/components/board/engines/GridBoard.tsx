'use client';

import React, { useMemo } from 'react';

import { useRouter } from 'next/navigation';

import { BoardState, GridBoardConfig } from '@esolang-battle/common';

type GridBoardProps = {
  config: GridBoardConfig;
  state: BoardState;
  contestId: number;
  teamColors: Record<number, string>;
  teams?: { id: number; name: string; color: string }[];
};

export const GridBoard: React.FC<GridBoardProps> = ({
  config,
  state,
  contestId,
  teamColors,
  teams,
}) => {
  const router = useRouter();
  const { width, height, cellInfo } = config;

  const teamStats = useMemo(() => {
    const counts: Record<number, number> = {};
    Object.values(state).forEach((cell) => {
      if (cell.ownerTeamId !== null) {
        counts[cell.ownerTeamId] = (counts[cell.ownerTeamId] || 0) + 1;
      }
    });
    if (config.startingPositions) {
      Object.entries(config.startingPositions).forEach(([teamIdStr, cellIds]) => {
        const teamId = Number(teamIdStr);
        cellIds.forEach((cellId) => {
          if (!state[cellId]) {
            counts[teamId] = (counts[teamId] || 0) + 1;
          }
        });
      });
    }
    return counts;
  }, [state, config.startingPositions]);

  const handleCellClick = (languageId?: number) => {
    if (languageId !== undefined) {
      router.push(`/contest/${contestId}/submit?languageId=${languageId}`);
    }
  };

  const getCellStyle = (ownerTeamId: number | null): React.CSSProperties => {
    if (ownerTeamId === null) return { backgroundColor: '#eee', color: '#666' };
    const color = teamColors[ownerTeamId] || '#4b5563';
    return { backgroundColor: color, color: '#fff' };
  };

  return (
    <div className="flex h-full max-h-full w-full max-w-full flex-col items-center gap-6 py-4">
      {/* 盤面エリア: flex-1 で可能な限り広がる */}
      <div className="flex min-h-0 w-full flex-1 items-center justify-center">
        <div
          className="grid h-auto max-h-full w-auto max-w-full gap-2"
          style={{
            gridTemplateColumns: `repeat(${width}, 1fr)`,
            gridTemplateRows: `repeat(${height}, 1fr)`,
            aspectRatio: `${width} / ${height}`,
          }}
        >
          {Array.from({ length: width * height }).map((_, index) => {
            const x = index % width;
            const y = Math.floor(index / width);
            const cellId = `${x}_${y}`;
            const info = cellInfo[cellId];
            const cell = state[cellId];

            if (!info) return <div key={cellId} className="rounded bg-gray-200 opacity-10" />;

            return (
              <div
                key={cellId}
                role={info.languageId !== undefined ? 'button' : undefined}
                tabIndex={info.languageId !== undefined ? 0 : undefined}
                className={`flex items-center justify-center rounded shadow-md transition-all hover:scale-105 ${info.languageId !== undefined ? 'cursor-pointer' : ''}`}
                style={getCellStyle(cell?.ownerTeamId ?? null)}
                onClick={() => handleCellClick(info.languageId)}
                onKeyDown={(e) => {
                  if (info.languageId !== undefined && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    handleCellClick(info.languageId);
                  }
                }}
              >
                <div className="flex h-full w-full flex-col items-center justify-center overflow-hidden p-1 text-center sm:p-2">
                  <div className="w-full truncate text-[min(2.5vw,18px)] font-black leading-tight">
                    {info.label}
                  </div>
                  {cell?.score !== null && (
                    <div className="mt-0.5 text-[min(2vw,14px)] font-bold opacity-80">
                      {cell.score}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* チームの戦況表示: 盤面のすぐ下に配置 */}
      {teams && teams.length > 0 && (
        <div className="flex shrink-0 items-center justify-center gap-6 rounded-xl border border-gray-100 bg-white px-8 py-3 shadow-lg">
          {teams.map((team, idx) => (
            <React.Fragment key={team.id}>
              <div className="flex items-center gap-4">
                <div
                  className="h-4 w-4 rounded-full border border-gray-200 shadow-inner"
                  style={{ backgroundColor: team.color }}
                />
                <div className="flex items-baseline gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    {team.name || `Team ${team.id}`}
                  </span>
                  <span className="font-mono text-3xl font-black leading-none text-gray-800">
                    {teamStats[team.id] || 0}
                  </span>
                </div>
              </div>
              {idx < teams.length - 1 && <div className="mx-2 h-6 w-px bg-gray-200" />}
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
};
