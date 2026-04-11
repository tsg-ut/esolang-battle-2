'use client';

import React from 'react';

import { trpc } from '@/utils/trpc';
import { ClockCircleOutlined } from '@ant-design/icons';
import { Alert, Spin, Typography } from 'antd';
import dayjs from 'dayjs';

import { BoardData, BoardState } from '@esolang-battle/common';

import { CrossGridBoard } from './engines/CrossGridBoard';
import { GridBoard } from './engines/GridBoard';
import { HoneycombBoard } from './engines/HoneycombBoard';

const { Text } = Typography;

const engines: Record<
  string,
  React.FC<{
    config: any;
    state: BoardState;
    contestId: number;
    teamColors: Record<number, string>;
  }>
> = {
  GRID: GridBoard as any,
  HONEYCOMB: HoneycombBoard as any,
  CROSS_GRID: CrossGridBoard as any,
};

export function BoardRenderer({ initialData }: { initialData: BoardData | null }) {
  // 動的なデータの取得（定期的にリフレッシュ）
  const {
    data: board,
    isLoading,
    isError,
    error,
  } = trpc.getBoard.useQuery(
    { contestId: initialData?.contestId ?? 0 },
    {
      initialData: initialData ?? undefined,
      refetchInterval: 5000,
      enabled: !!initialData,
    }
  );

  // チーム情報を取得
  const { data: teams, isLoading: isLoadingTeams } = trpc.getTeams.useQuery(
    { contestId: initialData?.contestId ?? 0 },
    { enabled: !!initialData }
  );

  const teamColors = React.useMemo(() => {
    const mapping: Record<number, string> = {};
    teams?.forEach((t) => {
      mapping[t.id] = t.color;
    });
    return mapping;
  }, [teams]);

  if (!initialData) {
    return (
      <div className="max-w-md p-8">
        <Alert
          message="Board Not Initialized"
          description="The scoreboard for this contest has not been set up yet. Please wait for the administrator to configure the board."
          type="info"
          showIcon
        />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-4">
        <Alert message="Failed to sync board" description={error.message} type="error" showIcon />
      </div>
    );
  }

  if (!board) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spin size="large" tip="Loading board data..." />
      </div>
    );
  }

  // Config の存在チェック
  const config = board.config as any;
  if (!config || Object.keys(config).length === 0) {
    return (
      <div className="max-w-lg p-4">
        <Alert
          message="Incomplete Configuration"
          description="The board exists but its configuration (dimensions, language mapping, etc.) is missing. If you are an admin, please set up the board config in the admin panel."
          type="warning"
          showIcon
        />
      </div>
    );
  }

  // state がない、または空の場合のハンドリング
  if (!board.state) {
    return (
      <div className="max-w-lg p-4">
        <Alert
          message="Board State Missing"
          description="The board structure is defined, but the current state data is missing. It will be initialized once the first submission is processed, or you can recalculate it from the admin panel."
          type="warning"
          showIcon
        />
      </div>
    );
  }

  const EngineComponent = engines[board.type];
  if (!EngineComponent) {
    return (
      <div className="p-4">
        <Alert
          message="Unsupported Board Type"
          description={`The board type "${board.type}" is not supported by the current renderer.`}
          type="error"
          showIcon
        />
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col items-center gap-2 overflow-hidden">
      <div className="flex w-full items-center justify-end px-4">
        <Text type="secondary" className="flex items-center gap-1 text-[10px]">
          <ClockCircleOutlined />
          最終更新: {dayjs(board.lastUpdated).format('YYYY/MM/DD HH:mm:ss')}
        </Text>
      </div>
      <div className="flex h-full w-full items-center justify-center overflow-auto p-4 pt-0">
        {isLoadingTeams && !teams ? (
          <Spin />
        ) : (
          <EngineComponent
            config={board.config}
            state={board.state || {}}
            contestId={board.contestId}
            teamColors={teamColors}
          />
        )}
      </div>
    </div>
  );
}
