'use client';

import React from 'react';

import { useParams } from 'next/navigation';

import { trpc } from '@/utils/trpc';
import { DownloadOutlined, FileUnknownOutlined } from '@ant-design/icons';
import { Button, Tag } from 'antd';

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

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = `data:application/octet-stream;base64,${submission.codeBase64}`;
    link.download = `submission_${submission.id}_${submission.language.name.toLowerCase().replace(/\s+/g, '_')}`;
    link.click();
  };

  return (
    <div className="max-w-5xl space-y-8 pb-12">
      <div className="flex items-center justify-between border-b pb-4">
        <h2 className="text-2xl font-bold text-gray-900">提出詳細 #{submission.id}</h2>
        <div className="flex items-center gap-4">
          <Tag
            color={
              submission.status === 'AC'
                ? 'success'
                : submission.status === 'WJ'
                  ? 'default'
                  : 'error'
            }
            className="px-3 py-1 text-sm font-bold"
          >
            {submission.status}
          </Tag>
          <div className="text-sm text-gray-500">
            提出時刻: {new Date(submission.submittedAt).toLocaleString()}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <span className="mb-1 block text-xs font-bold text-gray-500 uppercase">問題</span>
          <span className="text-lg font-medium">{submission.problem.title}</span>
        </div>
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <span className="mb-1 block text-xs font-bold text-gray-500 uppercase">言語</span>
          <span className="text-lg font-medium">{submission.language.name}</span>
        </div>
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <span className="mb-1 block text-xs font-bold text-gray-500 uppercase">ステータス</span>
          <div className={`text-lg font-bold ${getStatusColor(submission.status)}`}>
            {submission.status}
          </div>
        </div>
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <span className="mb-1 block text-xs font-bold text-gray-500 uppercase">スコア</span>
          <span className="font-mono text-2xl font-bold text-blue-600">
            {submission.score !== null ? submission.score : '-'}
          </span>
          <span className="ml-2 text-sm text-gray-400">({submission.codeLength} bytes)</span>
        </div>
      </div>

      {submission.message && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-blue-800">
          <div className="mb-1 flex items-center gap-2 font-bold">
            <span className="text-lg">Result Summary</span>
          </div>
          <p className="text-sm whitespace-pre-wrap">{submission.message}</p>
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">ソースコード</h3>
          <Button icon={<DownloadOutlined />} onClick={handleDownload}>
            Download Code
          </Button>
        </div>

        {submission.isBinary ? (
          <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-12 text-center">
            <FileUnknownOutlined className="mb-4 text-4xl text-gray-400" />
            <div className="font-medium text-gray-600">Binary Data Detected</div>
            <p className="mt-1 text-sm text-gray-400">
              This file contains non-UTF-8 characters and cannot be displayed as text.
            </p>
            <Button className="mt-4" onClick={handleDownload}>
              Download to View
            </Button>
          </div>
        ) : (
          <pre className="max-h-[500px] overflow-x-auto overflow-y-auto rounded-lg bg-gray-900 p-6 font-mono text-sm leading-relaxed text-gray-100 shadow-inner">
            {submission.codeText}
          </pre>
        )}
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
                    <span className="text-xs font-bold text-gray-400 uppercase">Input</span>
                    <pre className="mt-1 max-h-32 overflow-y-auto rounded border bg-gray-50 p-2 font-mono text-xs">
                      {exec.testcase.input}
                    </pre>
                  </div>
                )}
                <div>
                  <span className="text-xs font-bold text-gray-400 uppercase">Stdout</span>
                  <pre className="mt-1 max-h-32 overflow-y-auto rounded border bg-gray-50 p-2 font-mono text-xs whitespace-pre-wrap">
                    {exec.stdout || <span className="italic opacity-50">(empty)</span>}
                  </pre>
                </div>
                {exec.stderr && (
                  <div>
                    <span className="text-xs font-bold text-red-400 uppercase">Stderr</span>
                    <pre className="mt-1 max-h-32 overflow-y-auto rounded border border-red-100 bg-red-50 p-2 font-mono text-xs whitespace-pre-wrap text-red-700">
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
