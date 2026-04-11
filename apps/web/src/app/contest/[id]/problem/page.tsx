'use client';

import React from 'react';

import { useParams, useRouter } from 'next/navigation';

import { trpc } from '@/utils/trpc';

export default function ProblemListPage() {
  const params = useParams();
  const router = useRouter();
  const contestId = Number(params.id);

  const { data: problems, isLoading, error } = trpc.listProblems.useQuery({ contestId });

  if (isLoading) return <div>Loading problems...</div>;
  if (error) return <div className="text-red-600">Error: {error.message}</div>;
  if (!problems || problems.length === 0) return <div>問題がありません。</div>;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {problems.map((problem) => (
        <div
          key={problem.id}
          onClick={() => router.push(`/contest/${contestId}/problem/${problem.id}`)}
          className="group cursor-pointer rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:border-blue-300 hover:shadow-md"
        >
          <h3 className="mb-2 text-xl font-bold text-gray-900 group-hover:text-blue-600">
            {problem.title}
          </h3>
          <p className="line-clamp-3 text-sm text-gray-600">{problem.problemStatement}</p>
          <div className="mt-4 flex items-center text-sm font-semibold text-blue-500">
            View Details →
          </div>
        </div>
      ))}
    </div>
  );
}
