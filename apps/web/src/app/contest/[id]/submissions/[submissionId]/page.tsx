'use client';

import React from 'react';

import { useParams } from 'next/navigation';

import { trpc } from '@/utils/trpc';

export default function SubmissionDetailPage() {
  const params = useParams();
  const submissionId = Number(params.submissionId);

  const {
    data: submission,
    isLoading,
    error,
  } = trpc.getSubmissionDetail.useQuery({ submissionId });

  if (isLoading) return <div className="py-8 text-center">Loading submission details...</div>;
  if (error) return <div className="py-8 text-red-600">Error: {error.message}</div>;
  if (!submission)
    return (
      <div className="py-8 text-center text-gray-500">
        提出が見つからないか、閲覧権限がありません。
      </div>
    );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AC':
        return 'text-green-600 font-bold';
      case 'WA':
        return 'text-yellow-600 font-bold';
      case 'RE':
        return 'text-red-600 font-bold';
      case 'TLE':
        return 'text-orange-600 font-bold';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="max-w-5xl space-y-8 pb-12">
      <div className="flex items-center justify-between border-b pb-4">
        <h2 className="text-2xl font-bold text-gray-900">提出詳細 #{submission.id}</h2>
        <div className="text-sm text-gray-500">
          提出時刻: {new Date(submission.submittedAt).toLocaleString()}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <span className="mb-1 block text-xs font-bold uppercase text-gray-500">問題</span>
          <span className="text-lg font-medium">{submission.problem.title}</span>
        </div>
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <span className="mb-1 block text-xs font-bold uppercase text-gray-500">言語</span>
          <span className="text-lg font-medium">{submission.language.name}</span>
        </div>
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <span className="mb-1 block text-xs font-bold uppercase text-gray-500">スコア</span>
          <span className="font-mono text-2xl font-bold text-blue-600">
            {submission.score !== null ? submission.score : '採点中...'}
          </span>
          <span className="ml-2 text-sm text-gray-400">({submission.codeLength} bytes)</span>
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-lg font-semibold text-gray-900">ソースコード</h3>
        <pre className="overflow-x-auto rounded-lg bg-gray-900 p-6 font-mono text-sm leading-relaxed text-gray-100 shadow-inner">
          {submission.code}
        </pre>
      </div>

      <div>
        <h3 className="mb-4 border-b pb-2 text-lg font-semibold text-gray-900">
          実行結果 (テストケース)
        </h3>
        <div className="space-y-4">
          {submission.executions.map((exec: any, idx: number) => (
            <div key={idx} className="overflow-hidden rounded-lg border bg-white shadow-sm">
              <div className="flex items-center justify-between border-b bg-gray-50 px-4 py-2 text-sm">
                <div className="font-medium text-gray-700">
                  Case #{idx + 1}{' '}
                  {exec.testcase.isSample && (
                    <span className="ml-2 rounded bg-blue-100 px-1.5 py-0.5 text-xs text-blue-700">
                      Sample
                    </span>
                  )}
                </div>
                <div className={getStatusColor(exec.status)}>
                  {exec.status} ({exec.executionTime} ms)
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 p-4">
                {exec.message && (
                  <div className="rounded border border-amber-200 bg-amber-50 p-2 text-xs text-amber-800">
                    <span className="mr-2 font-bold uppercase">Checker Message:</span>
                    {exec.message}
                  </div>
                )}
                {exec.testcase.input && (
                  <div>
                    <span className="text-xs font-bold uppercase text-gray-400">Input</span>
                    <pre className="mt-1 max-h-32 overflow-y-auto rounded border bg-gray-50 p-2 font-mono text-xs">
                      {exec.testcase.input}
                    </pre>
                  </div>
                )}
                <div>
                  <span className="text-xs font-bold uppercase text-gray-400">Stdout</span>
                  <pre className="mt-1 max-h-32 overflow-y-auto whitespace-pre-wrap rounded border bg-gray-50 p-2 font-mono text-xs">
                    {exec.stdout || <span className="italic opacity-50">(empty)</span>}
                  </pre>
                </div>
                {exec.stderr && (
                  <div>
                    <span className="text-xs font-bold uppercase text-red-400">Stderr</span>
                    <pre className="mt-1 max-h-32 overflow-y-auto whitespace-pre-wrap rounded border border-red-100 bg-red-50 p-2 font-mono text-xs text-red-700">
                      {exec.stderr}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
