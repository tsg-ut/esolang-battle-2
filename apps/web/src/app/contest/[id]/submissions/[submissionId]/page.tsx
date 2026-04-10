'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { trpc } from '@/utils/trpc';

export default function SubmissionDetailPage() {
  const params = useParams();
  const submissionId = Number(params.submissionId);

  const { data: submission, isLoading, error } = trpc.getSubmissionDetail.useQuery({ submissionId });

  if (isLoading) return <div className="py-8 text-center">Loading submission details...</div>;
  if (error) return <div className="py-8 text-red-600">Error: {error.message}</div>;
  if (!submission) return <div className="py-8 text-center text-gray-500">提出が見つからないか、閲覧権限がありません。</div>;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AC': return 'text-green-600 font-bold';
      case 'WA': return 'text-yellow-600 font-bold';
      case 'RE': return 'text-red-600 font-bold';
      case 'TLE': return 'text-orange-600 font-bold';
      default: return 'text-gray-600';
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <span className="text-xs font-bold text-gray-500 uppercase block mb-1">問題</span>
          <span className="text-lg font-medium">{submission.problem.title}</span>
        </div>
        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <span className="text-xs font-bold text-gray-500 uppercase block mb-1">言語</span>
          <span className="text-lg font-medium">{submission.language.name}</span>
        </div>
        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <span className="text-xs font-bold text-gray-500 uppercase block mb-1">スコア</span>
          <span className="text-2xl font-mono font-bold text-blue-600">
            {submission.score !== null ? submission.score : '採点中...'}
          </span>
          <span className="text-sm text-gray-400 ml-2">({submission.codeLength} bytes)</span>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">ソースコード</h3>
        <pre className="bg-gray-900 text-gray-100 p-6 rounded-lg overflow-x-auto font-mono text-sm shadow-inner leading-relaxed">
          {submission.code}
        </pre>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">実行結果 (テストケース)</h3>
        <div className="space-y-4">
          {submission.executions.map((exec, idx) => (
            <div key={idx} className="bg-white border rounded-lg overflow-hidden shadow-sm">
              <div className="bg-gray-50 px-4 py-2 flex items-center justify-between border-b text-sm">
                <div className="font-medium text-gray-700">
                  Case #{idx + 1} {exec.testcase.isSample && <span className="ml-2 px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">Sample</span>}
                </div>
                <div className={getStatusColor(exec.status)}>
                  {exec.status} ({exec.executionTime} ms)
                </div>
              </div>
              <div className="p-4 grid grid-cols-1 gap-4">
                {exec.testcase.input && (
                  <div>
                    <span className="text-xs font-bold text-gray-400 uppercase">Input</span>
                    <pre className="mt-1 bg-gray-50 p-2 rounded border text-xs font-mono max-h-32 overflow-y-auto">{exec.testcase.input}</pre>
                  </div>
                )}
                <div>
                  <span className="text-xs font-bold text-gray-400 uppercase">Stdout</span>
                  <pre className="mt-1 bg-gray-50 p-2 rounded border text-xs font-mono max-h-32 overflow-y-auto whitespace-pre-wrap">{exec.stdout || <span className="italic opacity-50">(empty)</span>}</pre>
                </div>
                {exec.stderr && (
                  <div>
                    <span className="text-xs font-bold text-red-400 uppercase">Stderr</span>
                    <pre className="mt-1 bg-red-50 p-2 rounded border border-red-100 text-xs font-mono text-red-700 max-h-32 overflow-y-auto whitespace-pre-wrap">{exec.stderr}</pre>
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
