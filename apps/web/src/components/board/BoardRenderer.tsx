'use client';

import React from 'react';

import { trpc } from '@/utils/trpc';

import { BoardData, BoardState } from '@esolang-battle/common';

import { CrossGridBoard } from './engines/CrossGridBoard';
import { GridBoard } from './engines/GridBoard';
import { HoneycombBoard } from './engines/HoneycombBoard';

const engines: Record<string, React.FC<{ config: any; state: BoardState; contestId: number }>> = {
  GRID: GridBoard as any,
  HONEYCOMB: HoneycombBoard as any,
  CROSS_GRID: CrossGridBoard as any,
};

export function BoardRenderer({ initialData }: { initialData: BoardData }) {
  // 動的なデータの取得（定期的にリフレッシュ）
  const { data: board } = trpc.getBoard.useQuery(
    { contestId: initialData.contestId },
    {
      initialData,
      refetchInterval: 5000,
    }
  );

  const EngineComponent = engines[board.type];
  if (!EngineComponent) {
    return <div>Unsupported board type: {board.type}</div>;
  }

  return (
    <div className="flex h-full w-full items-center justify-center overflow-auto p-4">
      <EngineComponent config={board.config} state={board.state} contestId={board.contestId} />
    </div>
  );
}
