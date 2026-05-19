'use client';

import React, { useMemo } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { getAvatarUrl } from '@/utils/user';
import { UserOutlined } from '@ant-design/icons';
import { Avatar, Button, Popover, Space, Tooltip } from 'antd';

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
      if (cell.ownerTeamIds && cell.ownerTeamIds.length > 0) {
        cell.ownerTeamIds.forEach((teamId) => {
          counts[teamId] = (counts[teamId] || 0) + 1;
        });
      }
    });
    return counts;
  }, [state]);

  const getCellStyle = (ownerTeamIds: number[]): React.CSSProperties => {
    if (!ownerTeamIds || ownerTeamIds.length === 0)
      return { backgroundColor: '#eee', color: '#666' };

    const primaryTeamId = ownerTeamIds[0];
    const color = teamColors[primaryTeamId] || '#4b5563';

    if (ownerTeamIds.length > 1) {
      const colors = ownerTeamIds.map((id) => teamColors[id] || '#4b5563');
      const step = 100 / colors.length;
      const gradientParts = colors.map((c, i) => `${c} ${i * step}%, ${c} ${(i + 1) * step}%`);
      return {
        background: `linear-gradient(135deg, ${gradientParts.join(', ')})`,
        color: '#fff',
      };
    }

    return { backgroundColor: color, color: '#fff' };
  };

  // ラベルの長さに応じて基本フォントサイズを計算する
  const getFontSize = (label: string) => {
    if (label.length > 12) return 'text-[10px]';
    if (label.length > 8) return 'text-[13px]';
    return 'text-[16px]';
  };

  const renderCellMenu = (cellId: string, languageId: number, label: string) => {
    const cell = state[cellId];
    // 最新の提出（オーナーがいる場合）
    const submissionId = cell?.submissionIds?.[0];

    return (
      <Space direction="vertical" style={{ width: 180 }}>
        {submissionId && (
          <Button
            type="primary"
            block
            onClick={() => router.push(`/contest/${contestId}/submissions/${submissionId}`)}
          >
            提出の詳細を見る
          </Button>
        )}
        <Button
          block
          onClick={() => router.push(`/contest/${contestId}/submit?languageId=${languageId}`)}
        >
          この言語で提出する
        </Button>
        <Button
          block
          onClick={() =>
            router.push(`/contest/${contestId}/submissions?languageId=${languageId}&scope=all`)
          }
        >
          提出一覧 ({label})
        </Button>
      </Space>
    );
  };

  return (
    <div className="flex w-full flex-col items-center gap-6 py-4">
      {/* 盤面エリア: 横スクロール可能にするために w-full + overflow-x-auto */}
      <div className="flex w-full items-start justify-center overflow-x-auto p-2">
        <div
          className="grid h-auto gap-2"
          style={{
            gridTemplateColumns: `repeat(${width}, minmax(80px, 120px))`, // 最小 80px, 最大 150px
            width: 'fit-content',
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

            const cellContent = (
              <div
                key={cellId}
                role={info.languageId !== undefined ? 'button' : undefined}
                tabIndex={info.languageId !== undefined ? 0 : undefined}
                className={`relative flex aspect-square items-center justify-center overflow-hidden rounded border border-black/5 shadow-sm transition-all hover:scale-[1.03] ${info.languageId !== undefined ? 'cursor-pointer' : ''}`}
                style={getCellStyle(cell?.ownerTeamIds || [])}
                onKeyDown={(e) => {
                  if (info.languageId !== undefined && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    // キー操作時のデフォルト挙動は提出画面への遷移（既存挙動維持）
                    router.push(`/contest/${contestId}/submit?languageId=${info.languageId}`);
                  }
                }}
              >
                <div className="z-0 flex h-full w-full flex-col items-center justify-center p-1.5 text-center">
                  <div
                    className={`${getFontSize(info.label)} w-full leading-tight font-black break-words`}
                  >
                    {info.label}
                  </div>
                  {cell?.score !== null && (
                    <div className="mt-1 rounded-sm bg-black/10 px-1.5 text-[12px] font-bold opacity-90">
                      {cell.score}
                    </div>
                  )}
                </div>

                {/* 所有ユーザーのアバターを表示 */}
                {ownerUsers.length > 0 && (
                  <div className="absolute right-0.5 bottom-0.5 flex -space-x-2.5 overflow-hidden rounded-full bg-black/10 p-0.5 transition-all duration-300 hover:space-x-0.5">
                    {ownerUsers.slice(0, 3).map((user) => (
                      <Tooltip key={user.id} title={user.name}>
                        <Link
                          href={`/user/${user.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="inline-block"
                        >
                          <Avatar
                            size={18}
                            src={getAvatarUrl(user.id)}
                            icon={<UserOutlined />}
                            className="border border-white/40 shadow-sm hover:scale-110"
                            style={{ width: '18px', height: '18px', fontSize: '10px' }}
                          />
                        </Link>
                      </Tooltip>
                    ))}
                    {ownerUsers.length > 3 && (
                      <Tooltip title={`${ownerUsers.length} users`}>
                        <div className="flex h-4.5 w-4.5 items-center justify-center rounded-full border border-white/40 bg-gray-800 text-[8px] text-white">
                          +{ownerUsers.length - 3}
                        </div>
                      </Tooltip>
                    )}
                  </div>
                )}
              </div>
            );

            if (info.languageId !== undefined) {
              return (
                <Popover
                  key={cellId}
                  content={renderCellMenu(cellId, info.languageId, info.label)}
                  title={info.label}
                  trigger="click"
                  placement="right"
                >
                  {cellContent}
                </Popover>
              );
            }

            return cellContent;
          })}
        </div>
      </div>

      {/* チームの戦況表示 */}
      {teams && teams.length > 0 && (
        <div className="mb-2 flex shrink-0 items-center justify-center gap-6 rounded-xl border border-gray-100 bg-white px-8 py-3 shadow-lg">
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
