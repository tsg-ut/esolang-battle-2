'use client';

import React, { useMemo } from 'react';

import { Popover } from 'antd';

import {
  BoardState,
  TeamTargetBoardConfig,
  getTeamTargetCellScore,
  isTeamTargetGoalCell,
} from '@esolang-battle/common';

import {
  BoardTeam,
  CellMenu,
  OwnerAvatars,
  TeamStatsBar,
  getCellStyle,
  getLabelFontSize,
  useCellKeyDown,
} from './shared';

type TeamTargetBoardProps = {
  config: TeamTargetBoardConfig;
  state: BoardState;
  contestId: number;
  teamColors: Record<number, string>;
  teams?: BoardTeam[];
};

const FALLBACK_TEAM_COLOR = '#4b5563';

export const TeamTargetBoard: React.FC<TeamTargetBoardProps> = ({
  config,
  state,
  contestId,
  teamColors,
  teams,
}) => {
  const { width, height, cells } = config;
  const onCellKeyDown = useCellKeyDown(contestId);

  // チームごとの獲得点数と獲得セル数 (固定セルは含めない)
  const { points, counts } = useMemo(() => {
    const points: Record<number, number> = {};
    const counts: Record<number, number> = {};
    Object.entries(cells).forEach(([cellId, cell]) => {
      if (cell.teamId === undefined || !isTeamTargetGoalCell(cell)) return;
      if (!state[cellId]?.ownerTeamIds?.includes(cell.teamId)) return;
      points[cell.teamId] = (points[cell.teamId] || 0) + getTeamTargetCellScore(config, cell);
      counts[cell.teamId] = (counts[cell.teamId] || 0) + 1;
    });
    return { points, counts };
  }, [cells, config, state]);

  // 獲得数の単位: 全目標セルが問題のみ指定なら「問」、言語のみ指定なら「言語」、混在なら「マス」
  const countUnit = useMemo(() => {
    const goals = Object.values(cells).filter(isTeamTargetGoalCell);
    if (goals.length > 0 && goals.every((c) => c.languageId === undefined)) return '問';
    if (goals.length > 0 && goals.every((c) => c.problemId === undefined)) return '言語';
    return 'マス';
  }, [cells]);

  const subStats = useMemo(() => {
    const result: Record<number, string> = {};
    teams?.forEach((team) => {
      result[team.id] = `${counts[team.id] || 0} ${countUnit}`;
    });
    return result;
  }, [counts, countUnit, teams]);

  return (
    <div className="flex w-full flex-col items-center gap-6 py-4">
      {/* 盤面エリア: 横スクロール可能にするために w-full + overflow-x-auto */}
      <div className="flex w-full items-start justify-center overflow-x-auto p-2">
        <div
          className="grid h-auto gap-2"
          style={{
            gridTemplateColumns: `repeat(${width}, minmax(80px, 120px))`,
            width: 'fit-content',
          }}
        >
          {Array.from({ length: width * height }).map((_, index) => {
            const x = index % width;
            const y = Math.floor(index / width);
            const cellId = `${x}_${y}`;
            const info = cells[cellId];

            if (!info) return <div key={cellId} className="rounded bg-gray-200 opacity-10" />;

            const label = info.label ?? '';

            // ラベルセル: 見出しなどの表示専用
            if (info.teamId === undefined) {
              return (
                <div
                  key={cellId}
                  className="flex aspect-square items-center justify-center p-1.5 text-center text-gray-500"
                >
                  <div
                    className={`${getLabelFontSize(label)} w-full leading-tight font-black break-words`}
                  >
                    {label}
                  </div>
                </div>
              );
            }

            const cell = state[cellId];
            const teamColor = teamColors[info.teamId] || FALLBACK_TEAM_COLOR;
            const isGoalCell = isTeamTargetGoalCell(info);
            const isOwned = cell?.ownerTeamIds?.includes(info.teamId) ?? false;

            // 固定セル: 最初からそのチームが所有し、塗り替えられない
            // 目標セル: 未獲得の間はチーム色を薄く表示し、獲得するとチーム色で塗る
            const style: React.CSSProperties =
              !isGoalCell || isOwned
                ? getCellStyle(isOwned ? cell?.ownerTeamIds : [info.teamId], teamColors)
                : {
                    backgroundColor: `color-mix(in srgb, ${teamColor} 20%, white)`,
                    color: '#666',
                  };

            const cellContent = (
              <div
                key={cellId}
                role={isGoalCell ? 'button' : undefined}
                tabIndex={isGoalCell ? 0 : undefined}
                className={`relative flex aspect-square items-center justify-center overflow-hidden rounded border border-black/5 shadow-sm transition-all hover:scale-[1.03] ${isGoalCell ? 'cursor-pointer' : ''}`}
                style={style}
                onKeyDown={onCellKeyDown(info.languageId, info.problemId)}
              >
                <div className="z-0 flex h-full w-full flex-col items-center justify-center p-1.5 text-center">
                  <div
                    className={`${getLabelFontSize(label)} w-full leading-tight font-black break-words`}
                  >
                    {label}
                  </div>
                  {isGoalCell && (
                    <div className="mt-1 rounded-sm bg-black/10 px-1.5 text-[12px] font-bold opacity-90">
                      {getTeamTargetCellScore(config, info)}
                    </div>
                  )}
                </div>

                {/* 獲得したメンバーのアバターを表示 */}
                {isOwned && <OwnerAvatars cell={cell} className="absolute right-0.5 bottom-0.5" />}
              </div>
            );

            if (isGoalCell) {
              return (
                <Popover
                  key={cellId}
                  content={
                    <CellMenu
                      cell={cell}
                      contestId={contestId}
                      languageId={info.languageId}
                      problemId={info.problemId}
                      label={label}
                    />
                  }
                  title={label}
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

      {/* チームの戦況表示: 獲得点数 (固定セルは含まない) と獲得数 */}
      <TeamStatsBar teams={teams} teamStats={points} subStats={subStats} />
    </div>
  );
};
