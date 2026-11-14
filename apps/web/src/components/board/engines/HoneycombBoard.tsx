'use client';

import React, { useMemo } from 'react';

import { Popover } from 'antd';

import { BoardState, HoneycombBoardConfig } from '@esolang-battle/common';

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

type HoneycombBoardProps = {
  config: HoneycombBoardConfig;
  state: BoardState;
  contestId: number;
  teamColors: Record<number, string>;
  teams?: BoardTeam[];
};

/** 六角形の中心間の基準サイズ (px)。config.size で上書き可能 */
const DEFAULT_HEX_SIZE = 64;
/** 隣接セル間の隙間 (px)。GridBoard の gap-2 と揃える */
const CELL_GAP = 8;
/** 盤面外周の余白 (px)。hover 時の拡大がはみ出さないように */
const BOARD_PADDING = 8;

/** フラットトップ六角形 */
const HEX_CLIP_PATH = 'polygon(25% 0, 75% 0, 100% 50%, 75% 100%, 25% 100%, 0 50%)';

export const HoneycombBoard: React.FC<HoneycombBoardProps> = ({
  config,
  state,
  contestId,
  teamColors,
  teams,
}) => {
  const { cellIds, cellInfo } = config;
  const teamStats = useTeamStats(state);
  const onCellKeyDown = useCellKeyDown(contestId);

  const layout = useMemo(() => {
    const size = config.size ?? DEFAULT_HEX_SIZE;
    // 平行な辺同士の距離が CELL_GAP になるように描画半径を縮める
    const radius = size - CELL_GAP / Math.sqrt(3);
    const cellWidth = 2 * radius;
    const cellHeight = Math.sqrt(3) * radius;

    const cells = cellIds
      .filter((id) => cellInfo[id])
      .map((id) => {
        const { q, r } = cellInfo[id];
        return {
          id,
          cx: size * 1.5 * q,
          cy: size * Math.sqrt(3) * (r + q / 2),
        };
      });

    if (cells.length === 0) return { cells: [], width: 0, height: 0, cellWidth, cellHeight };

    const minX = Math.min(...cells.map((c) => c.cx)) - cellWidth / 2;
    const maxX = Math.max(...cells.map((c) => c.cx)) + cellWidth / 2;
    const minY = Math.min(...cells.map((c) => c.cy)) - cellHeight / 2;
    const maxY = Math.max(...cells.map((c) => c.cy)) + cellHeight / 2;

    return {
      cells: cells.map((c) => ({
        id: c.id,
        left: c.cx - cellWidth / 2 - minX + BOARD_PADDING,
        top: c.cy - cellHeight / 2 - minY + BOARD_PADDING,
      })),
      width: maxX - minX + BOARD_PADDING * 2,
      height: maxY - minY + BOARD_PADDING * 2,
      cellWidth,
      cellHeight,
    };
  }, [cellIds, cellInfo, config.size]);

  return (
    <div className="flex w-full flex-col items-center gap-6 py-4">
      {/* 盤面エリア: 横スクロール可能にするために w-full + overflow-x-auto */}
      <div className="flex w-full items-start justify-center overflow-x-auto p-2">
        <div className="relative shrink-0" style={{ width: layout.width, height: layout.height }}>
          {layout.cells.map(({ id, left, top }) => {
            const info = cellInfo[id];
            const cell = state[id];
            const isLanguageCell = info.languageId !== undefined;

            const cellContent = (
              <div
                key={id}
                role={isLanguageCell ? 'button' : undefined}
                tabIndex={isLanguageCell ? 0 : undefined}
                className={`absolute drop-shadow-sm transition-all hover:z-10 hover:scale-[1.03] ${isLanguageCell ? 'cursor-pointer' : ''}`}
                style={{ left, top, width: layout.cellWidth, height: layout.cellHeight }}
                onKeyDown={onCellKeyDown(info.languageId)}
              >
                <div
                  className="z-0 flex h-full w-full flex-col items-center justify-center px-[16%] py-1.5 text-center"
                  style={{
                    ...getCellStyle(cell?.ownerTeamIds, teamColors),
                    clipPath: HEX_CLIP_PATH,
                  }}
                >
                  <CellLabel label={info.label} cell={cell} />
                </div>

                {/* 所有ユーザーのアバターを表示 */}
                <OwnerAvatars
                  cell={cell}
                  className="absolute bottom-0.5 left-1/2 -translate-x-1/2"
                />
              </div>
            );

            if (info.languageId !== undefined) {
              return (
                <Popover
                  key={id}
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
