'use client';

import React, { useMemo } from 'react';

import Link from 'next/link';

import { trpc } from '@/utils/trpc';
import { getAvatarUrl } from '@/utils/user';
import { UserOutlined } from '@ant-design/icons';
import { Avatar, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';

import { BoardCell, BoardState, RankingTableBoardConfig } from '@esolang-battle/common';

import { BoardTeam } from './shared';

type RankingTableBoardProps = {
  config: RankingTableBoardConfig;
  state: BoardState;
  contestId: number;
  teamColors: Record<number, string>;
  teams?: BoardTeam[];
};

type Row = {
  teamId: number;
  team?: BoardTeam;
  cell?: BoardCell;
  /** 1 位のスコアとの差 (提出がない・1 位なら null) */
  diff: number | null;
};

const FALLBACK_TEAM_COLOR = '#4b5563';

/** 得点の表示: 小数第 2 位まで切り捨て (浮動小数の誤差で 1 つ下に落ちないよう微小値を足す) */
export function formatRankingPoints(points: number) {
  return String(Math.floor(points * 100 + 1e-9) / 100);
}

/** スコア・係数の表示: 浮動小数の誤差を消すため小数第 3 位で丸める */
function formatNumber(value: number) {
  return String(Math.round(value * 1000) / 1000);
}

export const RankingTableBoard: React.FC<RankingTableBoardProps> = ({
  config,
  state,
  contestId,
  teamColors,
  teams,
}) => {
  const { data: languages } = trpc.getLanguages.useQuery();
  const languageNames = useMemo(() => {
    const names: Record<number, string> = {};
    languages?.forEach((l) => (names[l.id] = l.name));
    return names;
  }, [languages]);

  const rows = useMemo<Row[]>(() => {
    const base = config.teams.map((t) => ({
      teamId: t.teamId,
      team: teams?.find((team) => team.id === t.teamId),
      cell: state[String(t.teamId)],
    }));
    const best = base.find((r) => r.cell?.rank === 1)?.cell?.score ?? null;
    return base
      .map((r) => ({
        ...r,
        diff:
          best !== null && typeof r.cell?.score === 'number' && r.cell.rank !== 1
            ? r.cell.score - best
            : null,
      }))
      .sort((a, b) => (a.cell?.rank ?? Infinity) - (b.cell?.rank ?? Infinity));
  }, [config.teams, state, teams]);

  // 係数とスコアの列は multipliers を設定したときのみ表示する
  const showMultiplier = config.multipliers !== undefined;

  const columns: ColumnsType<Row> = [
    {
      title: '順位',
      key: 'rank',
      width: 64,
      align: 'center',
      render: (_, r) => (
        <span className="text-lg font-black">
          {typeof r.cell?.rank === 'number' ? r.cell.rank : '-'}
        </span>
      ),
    },
    {
      title: 'チーム, ユーザー',
      key: 'team',
      render: (_, r) => {
        const user = r.cell?.ownerUsers?.[0];
        return (
          <div className="flex items-center gap-2">
            <span
              className="inline-block h-3 w-3 shrink-0 rounded-full"
              style={{ backgroundColor: teamColors[r.teamId] || FALLBACK_TEAM_COLOR }}
            />
            <span className="font-bold">{r.team?.name || `Team ${r.teamId}`}</span>
            {user && (
              <Link href={`/user/${user.id}`} className="flex items-center gap-1 text-gray-600">
                <Avatar size={20} src={getAvatarUrl(user.id)} icon={<UserOutlined />} />
                {user.name}
              </Link>
            )}
          </div>
        );
      },
    },
    {
      title: 'バイト数',
      key: 'bytes',
      align: 'right',
      render: (_, r) => {
        const cell = r.cell;
        if (typeof cell?.codeLength !== 'number') return <span className="text-gray-400">-</span>;
        const submissionId = cell.submissionIds[0];
        const language = cell.languageId !== undefined ? languageNames[cell.languageId] : undefined;
        return (
          <span className="font-mono">
            {submissionId ? (
              <Link href={`/contest/${contestId}/submissions/${submissionId}`}>
                {cell.codeLength} bytes
              </Link>
            ) : (
              `${cell.codeLength} bytes`
            )}
            {showMultiplier && language && (
              <span className="ml-1 text-xs text-gray-400">({language})</span>
            )}
          </span>
        );
      },
    },
    ...(showMultiplier
      ? ([
          {
            title: '係数',
            key: 'multiplier',
            align: 'right',
            render: (_, r) =>
              typeof r.cell?.multiplier === 'number' ? (
                <span className="font-mono">×{formatNumber(r.cell.multiplier)}</span>
              ) : (
                <span className="text-gray-400">-</span>
              ),
          },
          {
            title: 'スコア',
            key: 'score',
            align: 'right',
            render: (_, r) =>
              typeof r.cell?.score === 'number' ? (
                <span className="font-mono">{formatNumber(r.cell.score)}</span>
              ) : (
                <span className="text-gray-400">-</span>
              ),
          },
        ] as ColumnsType<Row>)
      : []),
    {
      title: '1位との差',
      key: 'diff',
      align: 'right',
      render: (_, r) =>
        r.diff !== null ? (
          <span className="font-mono text-gray-500">
            {r.diff >= 0 ? '+' : ''}
            {formatNumber(r.diff)}
          </span>
        ) : null,
    },
    {
      title: '得点',
      key: 'points',
      align: 'right',
      render: (_, r) => (
        <span className="font-mono text-lg font-black">
          {formatRankingPoints(r.cell?.points ?? 0)}
        </span>
      ),
    },
  ];

  return (
    <div className="flex w-full flex-col items-center gap-6 py-4">
      <div className="w-full max-w-4xl overflow-x-auto px-2">
        <Table<Row>
          rowKey="teamId"
          columns={columns}
          dataSource={rows}
          pagination={false}
          size="middle"
          bordered
        />
      </div>
    </div>
  );
};
