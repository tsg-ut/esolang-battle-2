import React from 'react';

import { BoardRenderer } from '@/components/board/BoardRenderer';
import { getBoard } from '@/server/function/getBoard';

import { prisma } from '@esolang-battle/db';

export default async function BoardFullscreenPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const contestId = Number(id);

  const boardData = await getBoard(prisma, contestId);

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-7xl p-4">
        <div className="mb-4 flex items-center justify-center">
          <h1 className="text-2xl font-bold">Scoreboard</h1>
        </div>
        <BoardRenderer initialData={boardData} />
      </div>
    </div>
  );
}
