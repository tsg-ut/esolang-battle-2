'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { trpc } from '@/utils/trpc';

type Scope = "self" | "team" | "all";

export default function SubmissionsPage() {
  const params = useParams();
  const contestId = Number(params.id);

  const { data: me } = trpc.me.useQuery();
  const [scope, setScope] = useState<Scope>("self");

  const myTeam = me?.teams.find(t => t.contestId === contestId);

  const filter: any = { contestId };
  if (scope === "self") filter.userId = me?.id;
  if (scope === "team") filter.teamId = myTeam?.id;

  const { data: submissions, isLoading, error } = trpc.getSubmissions.useQuery(
    filter,
    { 
      enabled: !!me,
      refetchInterval: 10000 
    }
  );

  if (isLoading) return <div className="py-4">Loading submissions...</div>;
  if (error) return <div className="text-red-600 py-4">Error: {error.message}</div>;

  return (
    <div className="w-full max-w-6xl">
      <div className="flex gap-2 mb-6">
        <button 
          onClick={() => setScope("self")} 
          disabled={scope === "self"}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            scope === "self" 
              ? 'bg-blue-600 text-white cursor-default' 
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          自分の提出
        </button>
        <button 
          onClick={() => setScope("team")} 
          disabled={scope === "team" || !myTeam}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            scope === "team" 
              ? 'bg-blue-600 text-white cursor-default' 
              : !myTeam
                ? 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          自チームの提出
        </button>
        {me?.isAdmin && (
          <button 
            onClick={() => setScope("all")} 
            disabled={scope === "all"}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              scope === "all" 
                ? 'bg-blue-600 text-white cursor-default' 
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            全ての提出
          </button>
        )}
      </div>

      {!submissions || submissions.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <p className="text-gray-500">提出はまだありません。</p>
        </div>
      ) : (
        <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm">
          <table className="min-w-full divide-y divide-gray-200 bg-white">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">ユーザ</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">チーム</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">問題</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">言語</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">長</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">スコア</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">提出時刻</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">詳細</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {submissions.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-mono">
                    <Link href={`/contest/${contestId}/submissions/${s.id}`} className="text-blue-600 hover:underline">
                      {s.id}
                    </Link>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{s.user.name}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <span className={`px-2 py-1 rounded text-xs font-bold text-white bg-${s.user.teams.find(t => t.contestId === contestId)?.color === 'red' ? 'red-600' : s.user.teams.find(t => t.contestId === contestId)?.color === 'blue' ? 'blue-700' : 'gray-500'}`}>
                      {s.user.teams.find(t => t.contestId === contestId)?.color ?? "-"}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{s.problem.title}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{s.language.name}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 text-center font-mono">{s.codeLength}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                    {s.score !== null ? (
                      <span className="font-bold text-blue-600 font-mono text-lg">{s.score}</span>
                    ) : (
                      <span className="text-gray-400 italic text-xs animate-pulse">採点中...</span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{new Date(s.submittedAt).toLocaleString()}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-mono">
                    <Link href={`/contest/${contestId}/submissions/${s.id}`} className="text-blue-600 hover:underline">
                      {s.id}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
