'use client';

import React, { useMemo } from 'react';

import { useRouter } from 'next/navigation';

import { BoardState, HoneycombBoardConfig } from '@esolang-battle/common';

type HoneycombBoardProps = {
  config: HoneycombBoardConfig;
  state: BoardState;
  contestId: number;
  teamColors: Record<number, string>;
  teams?: { id: number; name: string; color: string }[];
};

export const HoneycombBoard: React.FC<HoneycombBoardProps> = ({
  config,
  state,
  contestId,
  teamColors,
  teams,
}) => {
  const router = useRouter();
  const { cellIds, cellInfo } = config;

  const teamStats = useMemo(() => {
    const counts: Record<number, number> = {};
    Object.values(state).forEach((cell) => {
      cell.ownerTeamIds.forEach((teamId) => {
        counts[teamId] = (counts[teamId] || 0) + 1;
      });
    });
    return counts;
  }, [state]);

  const handleCellClick = (languageId?: number) => {
    if (languageId !== undefined) {
      router.push(`/contest/${contestId}/submit?languageId=${languageId}`);
    }
  };

  const getCellStyle = (cell: any): React.CSSProperties => {
    const owners = cell?.ownerTeamIds || [];
    if (owners.length === 0) return { fill: '#eee', stroke: '#ccc' };

    if (owners.length === 1) {
      return { fill: teamColors[owners[0]] || '#4b5563', stroke: 'rgba(0,0,0,0.1)' };
    }

    // 複数所有の場合はパターンのIDを返す (SVGのdefsで定義)
    return { fill: `url(#pattern-${owners.join('-')})`, stroke: 'rgba(0,0,0,0.2)' };
  };

  // 複数所有パターンの生成
  const renderPatterns = () => {
    const multiOwnerCells = Object.values(state).filter((c) => c.ownerTeamIds.length > 1);
    const uniqueOwnerCombos = Array.from(
      new Set(multiOwnerCells.map((c) => c.ownerTeamIds.join('-')))
    );

    return (
      <defs>
        {uniqueOwnerCombos.map((combo) => {
          const owners = combo.split('-').map(Number);
          const colors = owners.map((id) => teamColors[id] || '#4b5563');
          const stripeWidth = 10 / colors.length;
          return (
            <pattern
              key={combo}
              id={`pattern-${combo}`}
              patternUnits="userSpaceOnUse"
              width="10"
              height="10"
              patternTransform="rotate(45)"
            >
              {colors.map((color, i) => (
                <rect
                  key={i}
                  x={i * stripeWidth}
                  y="0"
                  width={stripeWidth}
                  height="10"
                  fill={color}
                />
              ))}
            </pattern>
          );
        })}
      </defs>
    );
  };

  // 六角形の描画ヘルパー
  const getHexPoints = (q: number, r: number, size: number) => {
    const x = size * ((3 / 2) * q);
    const y = size * ((Math.sqrt(3) / 2) * q + Math.sqrt(3) * r);
    const points = [];
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 180) * (60 * i);
      points.push(`${x + size * Math.cos(angle)},${y + size * Math.sin(angle)}`);
    }
    return { points: points.join(' '), x, y };
  };

  const HEX_SIZE = 40;

  return (
    <div className="flex h-full w-full flex-col items-center gap-6">
      <div className="flex min-h-0 w-full flex-1 items-center justify-center overflow-visible">
        <svg viewBox="-250 -250 500 500" className="h-full max-h-[70vh] w-full">
          {renderPatterns()}
          {cellIds.map((id) => {
            const info = cellInfo[id];
            const cell = state[id];
            if (!info) return null;
            const { points, x, y } = getHexPoints(info.q, info.r, HEX_SIZE);

            return (
              <g
                key={id}
                className="cursor-pointer transition-all hover:opacity-80"
                onClick={() => handleCellClick(info.languageId)}
              >
                <polygon points={points} style={getCellStyle(cell)} strokeWidth="1" />
                <text
                  x={x}
                  y={y - 5}
                  textAnchor="middle"
                  className="fill-white text-[10px] font-black"
                  style={{ pointerEvents: 'none', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
                >
                  {info.label}
                </text>
                {cell?.score !== null && (
                  <text
                    x={x}
                    y={y + 10}
                    textAnchor="middle"
                    className="fill-white text-[8px] font-bold opacity-80"
                    style={{ pointerEvents: 'none' }}
                  >
                    {cell.score}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

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
                  <span className="text-xs font-bold tracking-wider text-gray-400 uppercase">
                    {team.name || `Team ${team.id}`}
                  </span>
                  <span className="font-mono text-3xl leading-none font-black text-gray-800">
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
