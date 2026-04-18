'use client';

import React, { useMemo } from 'react';

import { useRouter } from 'next/navigation';

import { BoardState, CrossGridBoardConfig } from '@esolang-battle/common';

type CrossGridBoardProps = {
  config: CrossGridBoardConfig;
  state: BoardState;
  contestId: number;
  teamColors: Record<number, string>;
  teams?: { id: number; name: string; color: string }[];
};

export const CrossGridBoard: React.FC<CrossGridBoardProps> = ({
  config,
  state,
  contestId,
  teamColors,
  teams,
}) => {
  const router = useRouter();
  const { problemIds, languageIds, problemInfo, languageInfo } = config;

  const teamStats = useMemo(() => {
    const counts: Record<number, number> = {};
    Object.values(state).forEach((cell) => {
      cell.ownerTeamIds.forEach((teamId) => {
        counts[teamId] = (counts[teamId] || 0) + 1;
      });
    });
    return counts;
  }, [state]);

  const handleCellClick = (problemId: number, languageId: number) => {
    router.push(`/contest/${contestId}/submit?problemId=${problemId}&languageId=${languageId}`);
  };

  const getCellStyle = (cell?: any): React.CSSProperties => {
    const owners = cell?.ownerTeamIds || [];
    if (owners.length === 0) return { backgroundColor: '#eee', color: '#666' };
    if (owners.length === 1) {
      const color = teamColors[owners[0]] || '#4b5563';
      return { backgroundColor: color, color: '#fff' };
    }
    const colors = owners.map((id: number) => teamColors[id] || '#4b5563');
    const stripeWidth = 100 / colors.length;
    const gradient = colors
      .map(
        (color: string, i: number) =>
          `${color} ${i * stripeWidth}%, ${color} ${(i + 1) * stripeWidth}%`
      )
      .join(', ');
    return {
      background: `linear-gradient(135deg, ${gradient})`,
      color: '#fff',
      textShadow: '0 1px 2px rgba(0,0,0,0.5)',
    };
  };

  return (
    <div className="flex h-full w-full flex-col items-center gap-6">
      <div className="min-h-0 w-full flex-1 overflow-auto">
        <table className="w-full table-fixed border-separate border-spacing-1">
          <thead>
            <tr>
              <th className="w-24 px-2 py-1 text-left text-[10px] font-bold uppercase text-gray-400">
                Language \ Problem
              </th>
              {problemIds.map((pid) => (
                <th
                  key={pid}
                  className="truncate rounded-t border-b-2 border-gray-100 bg-gray-50 px-2 py-1 text-xs font-black text-gray-600"
                >
                  {problemInfo[String(pid)] || `P#${pid}`}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {languageIds.map((lid) => (
              <tr key={lid}>
                <td className="truncate rounded-l border-r-2 border-gray-100 bg-gray-50 px-2 py-1 text-xs font-black text-gray-600">
                  {languageInfo[String(lid)] || `L#${lid}`}
                </td>
                {problemIds.map((pid) => {
                  const cellId = `p_${pid}_l_${lid}`;
                  const cell = state[cellId];
                  return (
                    <td
                      key={pid}
                      className="group relative h-12 cursor-pointer rounded shadow-sm transition-all hover:scale-[1.02] active:scale-95"
                      style={getCellStyle(cell)}
                      onClick={() => handleCellClick(pid, lid)}
                    >
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs font-black">{cell?.score ?? ''}</span>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
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
