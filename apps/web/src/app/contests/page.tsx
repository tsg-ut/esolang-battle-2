'use client';

import Link from 'next/link';

import { trpc } from '@/utils/trpc';

export default function ContestsPage() {
  const { data: contests, isLoading, error } = trpc.getContests.useQuery();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 border-b border-gray-200 pb-4">
          <h1 className="text-2xl font-bold text-gray-900">コンテスト一覧</h1>
        </div>

        {isLoading ? (
          <div className="py-12 text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading contests...</p>
          </div>
        ) : error ? (
          <div className="mb-8 border-l-4 border-red-400 bg-red-50 p-4">
            <p className="text-red-700">Error: {error.message}</p>
          </div>
        ) : !contests || contests.length === 0 ? (
          <div className="rounded-lg bg-white py-12 text-center shadow">
            <p className="text-gray-500">コンテストがありません。</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {contests.map((c) => (
              <Link
                key={c.id}
                href={`/contest/${c.id}/board`}
                className="block rounded-lg bg-white p-6 shadow transition-shadow hover:shadow-md"
              >
                <h2 className="mb-2 text-xl font-semibold text-gray-900">{c.name}</h2>
                <p className="text-sm text-gray-500">ID: {c.id}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
