import React from 'react';

import { BoardRenderer } from '@/components/board/BoardRenderer';
import { checkContestPageAccess } from '@/server/function/contestPageAccess';
import { getBoard } from '@/server/function/getBoard';

import { prisma } from '@esolang-battle/db';

export default async function BoardFullscreenPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const contestId = Number(id);

  const access = await checkContestPageAccess(contestId);
  if (!access.ok) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white text-gray-500">
        {access.message}
      </div>
    );
  }

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
