'use client';

import React from 'react';

import { useRouter } from 'next/navigation';

import { BoardState, GridBoardConfig } from '@esolang-battle/common';

type GridBoardProps = {
  config: GridBoardConfig;
  state: BoardState;
  contestId: number;
};

export const GridBoard: React.FC<GridBoardProps> = ({ config, state, contestId }) => {
  const router = useRouter();
  const { width, height, cellInfo } = config;

  const handleCellClick = (languageId?: number) => {
    if (languageId !== undefined) {
      router.push(`/contest/${contestId}/submit?languageId=${languageId}`);
    }
  };

  const getCellBgColor = (ownerTeamId: number | null) => {
    if (ownerTeamId === null) return 'bg-gray-800';
    return ownerTeamId % 2 === 0 ? 'bg-red-600' : 'bg-blue-700';
  };

  return (
    <div
      className="grid gap-2"
      style={{
        gridTemplateColumns: `repeat(${width}, 1fr)`,
        gridTemplateRows: `repeat(${height}, 1fr)`,
        maxWidth: '100%',
        maxHeight: '100%',
        aspectRatio: `${width} / ${height}`,
      }}
    >
      {Array.from({ length: width * height }).map((_, index) => {
        const x = index % width;
        const y = Math.floor(index / width);
        const cellId = `${x}_${y}`;
        const info = cellInfo[cellId];
        const cell = state[cellId];

        if (!info) return <div key={cellId} className="rounded-md bg-gray-900" />;

        return (
          <div
            key={cellId}
            role={info.languageId !== undefined ? 'button' : undefined}
            tabIndex={info.languageId !== undefined ? 0 : undefined}
            className={`flex items-center justify-center rounded-md p-2 transition-all hover:-translate-y-0.5 ${getCellBgColor(cell?.ownerTeamId ?? null)} ${info.languageId !== undefined ? 'cursor-pointer' : ''}`}
            onClick={() => handleCellClick(info.languageId)}
          >
            <div className="flex flex-col items-center justify-center text-center text-white">
              <div className="text-sm font-extrabold leading-tight">{info.label}</div>
              {cell?.score !== null && (
                <div className="mt-0.5 text-xs font-semibold opacity-90">{cell.score}</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
