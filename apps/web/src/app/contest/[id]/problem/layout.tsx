'use client';

import React from 'react';

import { useParams, usePathname, useRouter } from 'next/navigation';

import { trpc } from '@/utils/trpc';

export default function ProblemLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const contestId = Number(params.id);

  const { data: problems } = trpc.listProblems.useQuery({ contestId });

  // 現在どの問題を表示しているか、または一覧にいるかを判定
  const isListPage = pathname === `/contest/${contestId}/problem`;

  return (
    <div className="flex flex-col space-y-6">
      {/* タブナビゲーション */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          <button
            onClick={() => router.push(`/contest/${contestId}/problem`)}
            className={`whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium transition-colors ${
              isListPage
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            }`}
          >
            All Problems
          </button>
          {problems?.map((p) => {
            const problemUrl = `/contest/${contestId}/problem/${p.id}`;
            const isActive = pathname === problemUrl;
            return (
              <button
                key={p.id}
                onClick={() => router.push(problemUrl)}
                className={`whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium transition-colors ${
                  isActive
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                {p.title}
              </button>
            );
          })}
        </nav>
      </div>

      {/* コンテンツエリア */}
      <div className="min-h-[400px]">{children}</div>
    </div>
  );
}
