'use client';

import React, { useMemo } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { getAvatarUrl } from '@/utils/user';
import { UserOutlined } from '@ant-design/icons';
import { Avatar, Button, Space, Tooltip } from 'antd';

import { BoardCell, BoardState } from '@esolang-battle/common';

export type BoardTeam = { id: number; name: string; color: string };

/** チームごとの所有セル数 */
export function useTeamStats(state: BoardState) {
  return useMemo(() => {
    const counts: Record<number, number> = {};
    Object.values(state).forEach((cell) => {
      cell?.ownerTeamIds?.forEach((teamId) => {
        counts[teamId] = (counts[teamId] || 0) + 1;
      });
    });
    return counts;
  }, [state]);
}

/** 所有チームに応じたセルの背景色・文字色 */
export function getCellStyle(
  ownerTeamIds: number[] | undefined,
  teamColors: Record<number, string>
): React.CSSProperties {
  if (!ownerTeamIds || ownerTeamIds.length === 0) return { backgroundColor: '#eee', color: '#666' };

  if (ownerTeamIds.length > 1) {
    const colors = ownerTeamIds.map((id) => teamColors[id] || '#4b5563');
    const step = 100 / colors.length;
    const gradientParts = colors.map((c, i) => `${c} ${i * step}%, ${c} ${(i + 1) * step}%`);
    return {
      background: `linear-gradient(135deg, ${gradientParts.join(', ')})`,
      color: '#fff',
    };
  }

  return { backgroundColor: teamColors[ownerTeamIds[0]] || '#4b5563', color: '#fff' };
}

/** ラベルの長さに応じた基本フォントサイズ */
export function getLabelFontSize(label: string) {
  if (label.length > 12) return 'text-[10px]';
  if (label.length > 8) return 'text-[13px]';
  return 'text-[16px]';
}

/** セルのラベルとスコア(バイト数) */
export function CellLabel({ label, cell }: { label: string; cell: BoardCell | undefined }) {
  return (
    <>
      <div className={`${getLabelFontSize(label)} w-full leading-tight font-black break-words`}>
        {label}
      </div>
      {cell && cell.score !== null && (
        <div className="mt-1 rounded-sm bg-black/10 px-1.5 text-[12px] font-bold opacity-90">
          {cell.score}
        </div>
      )}
    </>
  );
}

/** セル所有者のアバター一覧 */
export function OwnerAvatars({
  cell,
  className,
}: {
  cell: BoardCell | undefined;
  className: string;
}) {
  const ownerUsers = cell?.ownerUsers || [];
  if (ownerUsers.length === 0) return null;

  return (
    <div
      className={`flex -space-x-2.5 overflow-hidden rounded-full bg-black/10 p-0.5 transition-all duration-300 hover:space-x-0.5 ${className}`}
    >
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
  );
}

/** セルクリック時のメニュー */
export function CellMenu({
  cell,
  contestId,
  languageId,
  label,
}: {
  cell: BoardCell | undefined;
  contestId: number;
  languageId: number;
  label: string;
}) {
  const router = useRouter();
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
}

/** 言語セルのキーボード操作: Enter / Space で提出画面へ */
export function useCellKeyDown(contestId: number) {
  const router = useRouter();
  return (languageId: number | undefined) => (e: React.KeyboardEvent) => {
    if (languageId !== undefined && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      router.push(`/contest/${contestId}/submit?languageId=${languageId}`);
    }
  };
}

/** チームの戦況表示 */
export function TeamStatsBar({
  teams,
  teamStats,
}: {
  teams?: BoardTeam[];
  teamStats: Record<number, number>;
}) {
  if (!teams || teams.length === 0) return null;

  return (
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
  );
}
