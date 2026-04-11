'use client';

import React from 'react';

import { useRouter } from 'next/navigation';

import { BoardState, HoneycombBoardConfig } from '@esolang-battle/common';

type HoneycombBoardProps = {
  config: HoneycombBoardConfig;
  state: BoardState;
  contestId: number;
};

export const HoneycombBoard: React.FC<HoneycombBoardProps> = ({ config, state, contestId }) => {
  const router = useRouter();
  const { cellIds, cellInfo, size = 50 } = config;

  const hexPath = 'M 30 0 L 60 17.32 L 60 51.96 L 30 69.28 L 0 51.96 L 0 17.32 Z';

  const getTeamColor = (ownerTeamId: number | null) => {
    if (ownerTeamId === null) return '#1a1a1a';
    return ownerTeamId % 2 === 0 ? '#dc2626' : '#1d4ed8'; // red-600, blue-700
  };

  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-lg bg-gray-900">
      <svg
        viewBox="-400 -400 800 800"
        className="h-full max-h-[80vh] w-full max-w-2xl"
        style={{ filter: 'drop-shadow(0 0 10px rgba(0,0,0,0.5))' }}
      >
        {cellIds.map((cellId) => {
          const info = cellInfo[cellId];
          if (!info) return null;
          const { q, r, label, languageId } = info;
          const cell = state[cellId];

          // Axial to pixel coords
          const x = size * ((3 / 2) * q);
          const y = size * ((Math.sqrt(3) / 2) * q + Math.sqrt(3) * r);

          return (
            <g
              key={cellId}
              transform={`translate(${x - 30}, ${y - 35})`}
              className="cursor-pointer transition-transform hover:scale-105"
              onClick={() =>
                languageId !== undefined &&
                router.push(`/contest/${contestId}/submit?languageId=${languageId}`)
              }
            >
              <path
                d={hexPath}
                fill={getTeamColor(cell?.ownerTeamId ?? null)}
                stroke="#374151"
                strokeWidth="2"
              />
              <text
                x="30"
                y="30"
                textAnchor="middle"
                className="pointer-events-none fill-white text-[12px] font-bold"
              >
                {label}
              </text>
              {cell?.score !== null && (
                <text
                  x="30"
                  y="45"
                  textAnchor="middle"
                  className="pointer-events-none fill-white/80 text-[10px] font-semibold"
                >
                  {cell.score}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
};
