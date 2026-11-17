import React from 'react';

import Link from 'next/link';

import { BoardRenderer } from '@/components/board/BoardRenderer';
import { checkContestPageAccess } from '@/server/function/contestPageAccess';
import { getBoard } from '@/server/function/getBoard';
import { FullscreenOutlined } from '@ant-design/icons';
import { Button, Tooltip } from 'antd';

import { prisma } from '@esolang-battle/db';

export default async function BoardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const contestId = Number(id);

  const access = await checkContestPageAccess(contestId);
  if (!access.ok) {
    return <div className="py-12 text-center text-gray-500">{access.message}</div>;
  }

  const boardData = await getBoard(prisma, contestId);

  return (
    <div className="flex min-h-[calc(100vh-80px)] w-full flex-col items-center pb-12">
      <div className="relative mb-2 flex w-full max-w-4xl items-center justify-center px-4">
        <h1 className="text-xl font-bold">Scoreboard</h1>
        <Tooltip title="フルスクリーンで開く" className="absolute right-4">
          <Link href={`/contest/${contestId}/board/full`} target="_blank">
            <Button icon={<FullscreenOutlined />} type="text" />
          </Link>
        </Tooltip>
      </div>
      <BoardRenderer initialData={boardData} />
    </div>
  );
}
