'use client';

import React, { useEffect, useState } from 'react';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

import { LoginRequiredMessage } from '@/components/LoginRequiredMessage';
import { CodeSubmitForm } from '@/components/submission/CodeSubmitForm';
import { trpc } from '@/utils/trpc';
import { CopyOutlined } from '@ant-design/icons';
import { App, Button, Tooltip } from 'antd';

// コピーボタン用のサブコンポーネント
const CopyButton = ({ text, label }: { text: string; label: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Tooltip title={copied ? 'Copied!' : `Copy ${label}`} open={copied ? true : undefined}>
      <Button
        type="text"
        size="small"
        icon={<CopyOutlined className={copied ? 'text-green-500' : 'text-gray-400'} />}
        onClick={handleCopy}
      />
    </Tooltip>
  );
};

export default function ProblemDetailPage() {
  const params = useParams();
  const contestId = Number(params.id);
  const problemId = Number(params.problemId);
  const router = useRouter();
  const { message } = App.useApp();

  const { data: me, isLoading: isLoadingMe } = trpc.me.useQuery();
  const isLoggedIn = !!me;

  const {
    data: problem,
    isLoading,
    error,
  } = trpc.getProblem.useQuery({ problemId }, { enabled: !!problemId });

  const submitMutation = trpc.submitCode.useMutation();

  const [selectedLanguageId, setSelectedLanguageId] = useState<string>('');

  useEffect(() => {
    if (problem?.acceptedLanguages && problem.acceptedLanguages.length > 0 && !selectedLanguageId) {
      setSelectedLanguageId(String(problem.acceptedLanguages[0].id));
    }
  }, [problem, selectedLanguageId]);

  const handleSubmit = async (data: { code: string; isBase64: boolean }) => {
    if (!isLoggedIn) return;
    try {
      await submitMutation.mutateAsync({
        problemId,
        languageId: Number(selectedLanguageId),
        code: data.code,
        isBase64: data.isBase64,
      });
      message.success('提出が完了しました');
      router.push(`/contest/${contestId}/submissions`);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      message.error('提出に失敗しました: ' + errorMsg);
    }
  };

  if (isLoading || isLoadingMe) return <div>Loading problem details...</div>;
  if (error) return <div className="text-red-600">Error: {error.message}</div>;
  if (!problem) return <div>問題が見つかりませんでした。</div>;

  const sampleTestCases = problem.testCases || [];

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 max-w-4xl space-y-8 pb-20 duration-300">
      <div className="flex items-center justify-between">
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
        </div>
      </div>

      <div className="bg-white py-8">
        <h3 className="text-lg font-bold text-gray-900">問題文</h3>
        <div className="prose prose-blue max-w-none">
          <div className="font-sans text-lg leading-relaxed whitespace-pre-wrap text-gray-800">
            {problem.problemStatement}
          </div>
        </div>
      </div>

      {sampleTestCases.length > 0 && (
        <div className="space-y-4 border-t pt-8">
          <h3 className="text-lg font-bold text-gray-900">Sample Test Cases</h3>
          <div className="grid gap-4 md:grid-cols-2">
            {sampleTestCases.map((tc, index) => (
              <div
                key={tc.id}
                className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
              >
                <div className="border-b border-gray-200 bg-gray-50 px-4 py-2 text-sm font-bold text-gray-600">
                  Sample {index + 1}
                </div>
                <div className="space-y-3 p-4">
                  <div>
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-xs font-semibold text-gray-400 uppercase">Input</span>
                      <CopyButton text={tc.input || ''} label="Input" />
                    </div>
                    <pre className="rounded border border-gray-100 bg-gray-50 p-2 font-mono text-xs whitespace-pre-wrap">
                      {tc.input || <span className="italic opacity-50">(empty)</span>}
                    </pre>
                  </div>
                  <div>
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-xs font-semibold text-gray-400 uppercase">Output</span>
                      <CopyButton text={tc.output || ''} label="Output" />
                    </div>
                    <pre className="rounded border border-gray-100 bg-gray-50 p-2 font-mono text-xs whitespace-pre-wrap">
                      {tc.output || <span className="italic opacity-50">(empty)</span>}
                    </pre>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="border-t pt-8">
        <h3 className="mb-6 text-xl font-bold text-gray-900">Submit Solution</h3>
        {isLoggedIn ? (
          <CodeSubmitForm
            languages={problem.acceptedLanguages}
            selectedLanguageId={selectedLanguageId}
            onLanguageChange={setSelectedLanguageId}
            onSubmit={handleSubmit}
            submitLoading={submitMutation.isPending}
            submitText="提出する"
          />
        ) : (
          <LoginRequiredMessage />
        )}
      </div>
    </div>
  );
}
