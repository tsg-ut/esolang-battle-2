import React from 'react';

import { BoardRenderer } from '@/components/board/BoardRenderer';
import { getBoard } from '@/server/function/getBoard';

import { prisma } from '@esolang-battle/db';

export default async function BoardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const contestId = Number(id);

  try {
    const boardData = await getBoard(prisma, contestId);

    return (
      <div className="flex h-[calc(100vh-80px)] w-full flex-col items-center">
        <h1 className="my-4 text-2xl font-bold">Scoreboard</h1>
        <BoardRenderer initialData={boardData} />
      </div>
    );
  } catch (error: any) {
    return (
      <div className="mt-8 text-center">
        <p className="text-lg font-semibold text-red-500">Error: {error.message}</p>
        <p className="mt-2 text-gray-400">Board might not be initialized for this contest yet.</p>
      </div>
    );
  }
}
