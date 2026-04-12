import React from 'react';

import { BoardRenderer } from '@/components/board/BoardRenderer';
import { getBoard } from '@/server/function/getBoard';

import { prisma } from '@esolang-battle/db';

export default async function BoardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const contestId = Number(id);

  const boardData = await getBoard(prisma, contestId);

  return (
    <div className="flex h-[calc(100vh-80px)] w-full flex-col items-center overflow-hidden p-2">
      <h1 className="mb-2 text-xl font-bold">Scoreboard</h1>
      <BoardRenderer initialData={boardData} />
    </div>
  );
}
