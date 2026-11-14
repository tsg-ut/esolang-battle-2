'use client';

import React from 'react';

import { Popover } from 'antd';

import { BoardState, GridBoardConfig } from '@esolang-battle/common';

import {
  BoardTeam,
  CellLabel,
  CellMenu,
  OwnerAvatars,
  TeamStatsBar,
  getCellStyle,
  useCellKeyDown,
  useTeamStats,
} from './shared';

type GridBoardProps = {
  config: GridBoardConfig;
  state: BoardState;
  contestId: number;
  teamColors: Record<number, string>;
  teams?: BoardTeam[];
};

export const GridBoard: React.FC<GridBoardProps> = ({
  config,
  state,
  contestId,
  teamColors,
  teams,
}) => {
  const { width, height, cellInfo } = config;
  const teamStats = useTeamStats(state);
  const onCellKeyDown = useCellKeyDown(contestId);

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

            const isLanguageCell = info.languageId !== undefined;

            const cellContent = (
              <div
                key={cellId}
                role={isLanguageCell ? 'button' : undefined}
                tabIndex={isLanguageCell ? 0 : undefined}
                className={`relative flex aspect-square items-center justify-center overflow-hidden rounded border border-black/5 shadow-sm transition-all hover:scale-[1.03] ${isLanguageCell ? 'cursor-pointer' : ''}`}
                style={getCellStyle(cell?.ownerTeamIds, teamColors)}
                onKeyDown={onCellKeyDown(info.languageId)}
              >
                <div className="z-0 flex h-full w-full flex-col items-center justify-center p-1.5 text-center">
                  <CellLabel label={info.label} cell={cell} />
                </div>

                {/* 所有ユーザーのアバターを表示 */}
                <OwnerAvatars cell={cell} className="absolute right-0.5 bottom-0.5" />
              </div>
            );

            if (info.languageId !== undefined) {
              return (
                <Popover
                  key={cellId}
                  content={
                    <CellMenu
                      cell={cell}
                      contestId={contestId}
                      languageId={info.languageId}
                      label={info.label}
                    />
                  }
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
      <TeamStatsBar teams={teams} teamStats={teamStats} />
    </div>
  );
};
