import { BoardData, BoardType } from '@esolang-battle/common';
import { PrismaClient, findBoardByContestId } from '@esolang-battle/db';

export async function getBoard(prisma: PrismaClient, contestId: number): Promise<BoardData | null> {
  const board = await findBoardByContestId(prisma, contestId);

  if (!board) {
    return null;
  }

  const state = board.state as any;
  const allSubmissionIds = new Set<number>();

  // 全ての提出IDを収集
  Object.values(state).forEach((cell: any) => {
    if (cell.submissionIds) {
      cell.submissionIds.forEach((id: number) => allSubmissionIds.add(id));
    }
  });

  // 提出IDからユーザー情報 (IDと名前) を取得
  const submissionUserMap: Record<number, { id: string; name: string }> = {};
  if (allSubmissionIds.size > 0) {
    const submissions = await prisma.submission.findMany({
      where: { id: { in: Array.from(allSubmissionIds) } },
      include: {
        user: {
          select: { id: true, name: true },
        },
      },
    });
    submissions.forEach((s) => {
      if (s.user) {
        submissionUserMap[s.id] = { id: s.user.id, name: s.user.name || 'Unknown' };
      }
    });
  }

  // stateにownerUsers (id, name) を補完
  const enrichedState: any = {};
  Object.entries(state).forEach(([cellId, cell]: [string, any]) => {
    const userMap = new Map<string, string>(); // userId -> name
    if (cell.submissionIds) {
      cell.submissionIds.forEach((sid: number) => {
        const user = submissionUserMap[sid];
        if (user) userMap.set(user.id, user.name);
      });
    }
    enrichedState[cellId] = {
      ...cell,
      ownerUsers: Array.from(userMap.entries()).map(([id, name]) => ({ id, name })),
    };
  });

  return {
    id: board.id,
    contestId: board.contestId,
    type: board.type as BoardType,
    config: board.config as any,
    state: enrichedState,
    lastUpdated: board.lastUpdated.toISOString(),
  };
}
