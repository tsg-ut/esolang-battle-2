'use client';

import React, { useMemo } from 'react';

import { useRouter } from 'next/navigation';

import { BoardState, GridBoardConfig } from '@esolang-battle/common';
import { Avatar, Tooltip } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { getAvatarUrl } from '@/utils/user';

type GridBoardProps = {
  config: GridBoardConfig;
  state: BoardState;
  contestId: number;
  teamColors: Record<number, string>;
  teams?: { id: number; name: string; color: string }[];
};

export const GridBoard: React.FC<GridBoardProps> = ({ config, state, contestId, teamColors, teams }) => {
  const router = useRouter();
  const { width, height, cellInfo } = config;

  const teamStats = useMemo(() => {
    const counts: Record<number, number> = {};
    Object.values(state).forEach(cell => {
      if (cell.ownerTeamIds && cell.ownerTeamIds.length > 0) {
        const primaryTeamId = cell.ownerTeamIds[0];
        counts[primaryTeamId] = (counts[primaryTeamId] || 0) + 1;
      }
    });
    return counts;
  }, [state]);

  const handleCellClick = (languageId?: number) => {
    if (languageId !== undefined) {
      router.push(`/contest/${contestId}/submit?languageId=${languageId}`);
    }
  };

  const getCellStyle = (ownerTeamIds: number[]): React.CSSProperties => {
    if (!ownerTeamIds || ownerTeamIds.length === 0) return { backgroundColor: '#eee', color: '#666' };
    
    const primaryTeamId = ownerTeamIds[0];
    const color = teamColors[primaryTeamId] || '#4b5563';

    if (ownerTeamIds.length > 1) {
      const colors = ownerTeamIds.map(id => teamColors[id] || '#4b5563');
      const step = 100 / colors.length;
      const gradientParts = colors.map((c, i) => `${c} ${i * step}%, ${c} ${(i + 1) * step}%`);
      return { 
        background: `linear-gradient(135deg, ${gradientParts.join(', ')})`,
        color: '#fff' 
      };
    }

    return { backgroundColor: color, color: '#fff' };
  };

  return (
    <div className="flex flex-col items-center gap-6 w-full h-full max-w-full max-h-full py-4">
      <div className="flex-1 w-full flex items-center justify-center min-h-0">
        <div
          className="grid gap-2 w-auto h-auto max-w-full max-h-full"
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

            const ownerUsers = cell?.ownerUsers || [];

            return (
              <div
                key={cellId}
                role={info.languageId !== undefined ? 'button' : undefined}
                tabIndex={info.languageId !== undefined ? 0 : undefined}
                className={`relative flex items-center justify-center rounded transition-all hover:scale-105 shadow-sm overflow-hidden ${info.languageId !== undefined ? 'cursor-pointer' : ''}`}
                style={getCellStyle(cell?.ownerTeamIds || [])}
                onClick={() => handleCellClick(info.languageId)}
                onKeyDown={(e) => {
                  if (info.languageId !== undefined && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    handleCellClick(info.languageId);
                  }
                }}
              >
                <div className="flex flex-col items-center justify-center text-center overflow-hidden w-full h-full p-1 sm:p-2 z-0">
                  <div className="text-[min(2.5vw,18px)] font-black leading-tight truncate w-full">{info.label}</div>
                  {cell?.score !== null && (
                    <div className="text-[min(2vw,14px)] font-bold opacity-80 mt-0.5">{cell.score}</div>
                  )}
                </div>

                {/* 所有ユーザーのアバターを表示 */}
                {ownerUsers.length > 0 && (
                  <div className="absolute bottom-0.5 right-0.5 flex -space-x-2.5 overflow-hidden hover:space-x-0.5 transition-all duration-300 p-0.5 bg-black/10 rounded-full">
                    {ownerUsers.slice(0, 3).map((user) => (
                      <Tooltip key={user.id} title={user.name}>
                        <Avatar
                          size={20}
                          src={getAvatarUrl(user.id)}
                          icon={<UserOutlined />}
                          className="border border-white/50 shadow-sm"
                          style={{ width: '20px', height: '20px', fontSize: '12px' }}
                        />
                      </Tooltip>
                    ))}
                    {ownerUsers.length > 3 && (
                      <Tooltip title={`${ownerUsers.length} users`}>
                        <div className="flex items-center justify-center w-5 h-5 bg-gray-800 text-[9px] text-white rounded-full border border-white/50">
                          +{ownerUsers.length - 3}
                        </div>
                      </Tooltip>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {teams && teams.length > 0 && (
        <div className="flex items-center justify-center gap-6 px-8 py-3 rounded-xl bg-white shadow-lg border border-gray-100 shrink-0">
          {teams.map((team, idx) => (
            <React.Fragment key={team.id}>
              <div className="flex items-center gap-4">
                <div 
                  className="w-4 h-4 rounded-full border border-gray-200 shadow-inner"
                  style={{ backgroundColor: team.color }}
                />
                <div className="flex items-baseline gap-2">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{team.name || `Team ${team.id}`}</span>
                  <span className="text-3xl font-black font-mono leading-none text-gray-800">
                    {teamStats[team.id] || 0}
                  </span>
                </div>
              </div>
              {idx < teams.length - 1 && (
                <div className="h-6 w-px bg-gray-200 mx-2" />
              )}
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
};
