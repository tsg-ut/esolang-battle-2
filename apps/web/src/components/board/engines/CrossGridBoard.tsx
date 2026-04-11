'use client';

import React from 'react';

import { useRouter } from 'next/navigation';

import { BoardState, CrossGridBoardConfig } from '@esolang-battle/common';

type CrossGridBoardProps = {
  config: CrossGridBoardConfig;
  state: BoardState;
  contestId: number;
};

export const CrossGridBoard: React.FC<CrossGridBoardProps> = ({ config, state, contestId }) => {
  const router = useRouter();
  const { problemIds, languageIds, problemInfo, languageInfo } = config;

  const handleCellClick = (problemId: number, languageId: number) => {
    router.push(`/contest/${contestId}/submit?problemId=${problemId}&languageId=${languageId}`);
  };

  const getCellBgColor = (ownerTeamId: number | null) => {
    if (ownerTeamId === null) return 'bg-gray-800';
    return ownerTeamId % 2 === 0 ? 'bg-red-600' : 'bg-blue-700';
  };

  return (
    <div className="flex h-full w-full flex-col items-center justify-center overflow-auto rounded-lg bg-gray-900 p-8 shadow-2xl">
      <div className="inline-block border-collapse overflow-hidden rounded-lg border border-gray-700 bg-gray-800">
        <div className="flex border-b border-gray-700 bg-gray-900">
          <div className="flex h-16 w-32 items-center justify-center border-r border-gray-700 font-bold text-gray-400">
            Problem \ Language
          </div>
          {languageIds.map((lId) => (
            <div
              key={lId}
              className="flex h-16 w-24 items-center justify-center break-words border-r border-gray-700 px-2 text-center text-sm font-bold text-gray-300 last:border-r-0"
            >
              {languageInfo[String(lId)]}
            </div>
          ))}
        </div>
        {problemIds.map((pId) => (
          <div key={pId} className="flex border-b border-gray-700 last:border-b-0">
            <div className="flex h-16 w-32 items-center justify-center break-words border-r border-gray-700 px-2 text-center text-xs font-medium text-gray-400">
              {problemInfo[String(pId)]}
            </div>
            {languageIds.map((lId) => {
              const cellId = `p_${pId}_l_${lId}`;
              const cell = state[cellId];
              return (
                <div
                  key={lId}
                  role="button"
                  tabIndex={0}
                  className={`flex h-16 w-24 cursor-pointer flex-col items-center justify-center border-r border-gray-700 transition-all last:border-r-0 hover:bg-opacity-80 ${getCellBgColor(cell?.ownerTeamId ?? null)}`}
                  onClick={() => handleCellClick(pId, lId)}
                >
                  {cell?.score !== null && (
                    <div className="text-xs font-bold text-white">{cell.score}</div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};
