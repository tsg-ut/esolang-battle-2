'use client';

import React from 'react';

import Link from 'next/link';
import { useParams } from 'next/navigation';

import { trpc } from '@/utils/trpc';

export default function ProblemDetailPage() {
  const params = useParams();
  const problemId = Number(params.problemId);

  const {
    data: problem,
    isLoading,
    error,
  } = trpc.getProblem.useQuery({ problemId }, { enabled: !!problemId });

  const { data: me } = trpc.me.useQuery();

  if (isLoading) return <div>Loading problem details...</div>;
  if (error) return <div className="text-red-600">Error: {error.message}</div>;
  if (!problem) return <div>問題が見つかりませんでした。</div>;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 max-w-4xl duration-300">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-3xl font-extrabold text-gray-900">
          {problem.title}{' '}
          <span className="ml-2 text-xl font-normal text-gray-400"># {problem.id}</span>
        </h2>
        <div className="flex space-x-3">
          {me?.isAdmin && (
            <Link
              href={`/admin/problems/edit/${problem.id}`}
              className="rounded-md bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-200"
            >
              Edit (Admin)
            </Link>
          )}
          <Link
            href={`/contest/${problem.contestId}/submit?problemId=${problem.id}`}
            className="rounded-md bg-blue-600 px-6 py-2 text-sm font-bold text-white shadow-sm transition-all hover:bg-blue-700"
          >
            Submit Code
          </Link>
        </div>
      </div>

      <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <h3 className="font-uppercase mb-4 text-sm font-bold tracking-wider text-gray-400">
          PROBLEM STATEMENT
        </h3>
        <div className="prose prose-blue max-w-none">
          <pre className="whitespace-pre-wrap font-sans text-lg leading-relaxed text-gray-800">
            {problem.problemStatement}
          </pre>
        </div>
      </div>

      {problem.acceptedLanguages && problem.acceptedLanguages.length > 0 && (
        <div className="mb-8 rounded-xl border border-gray-100 bg-gray-50 p-6">
          <h3 className="mb-4 text-lg font-bold text-gray-900">Accepted Languages</h3>
          <div className="flex flex-wrap gap-2">
            {problem.acceptedLanguages.map((lang) => (
              <span
                key={lang.id}
                className="rounded-full border border-gray-200 bg-white px-3 py-1 text-sm font-medium text-gray-600 shadow-sm"
              >
                {lang.description}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
