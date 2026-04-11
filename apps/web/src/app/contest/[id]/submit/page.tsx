'use client';

import React, { Suspense, useEffect, useState } from 'react';

import { useParams, useRouter, useSearchParams } from 'next/navigation';

import { trpc } from '@/utils/trpc';

function SubmitForm() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const contestId = Number(params.id);

  const { data: languages, isLoading: isLoadingLangs } = trpc.getLanguages.useQuery();
  const { data: problems, isLoading: isLoadingProbs } = trpc.listProblems.useQuery({ contestId });
  const submitMutation = trpc.submitCode.useMutation();

  const [code, setCode] = useState('');
  const [selectedLanguageId, setSelectedLanguageId] = useState<string>('');
  const [selectedProblemId, setSelectedProblemId] = useState<string>('');
  const [submitMessage, setSubmitMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  useEffect(() => {
    if (languages && languages.length > 0) {
      const langIdParam = searchParams.get('languageId');
      if (langIdParam) {
        setSelectedLanguageId(langIdParam);
      } else if (!selectedLanguageId) {
        setSelectedLanguageId(String(languages[0].id));
      }
    }
  }, [languages, searchParams, selectedLanguageId]);

  useEffect(() => {
    if (problems && problems.length > 0) {
      const probIdParam = searchParams.get('problemId');
      if (probIdParam) {
        setSelectedProblemId(probIdParam);
      } else if (!selectedProblemId) {
        setSelectedProblemId(String(problems[0].id));
      }
    }
  }, [problems, searchParams, selectedProblemId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitMessage(null);
    try {
      const submission = await submitMutation.mutateAsync({
        code,
        languageId: Number(selectedLanguageId),
        problemId: Number(selectedProblemId),
      });
      setSubmitMessage({ type: 'success', text: `提出に成功しました (ID: ${submission.id})` });
      setCode('');

      // 提出一覧へ遷移
      router.push(`/contest/${contestId}/submissions`);
    } catch (err: any) {
      setSubmitMessage({ type: 'error', text: `エラー: ${err.message}` });
    }
  };

  if (isLoadingLangs || isLoadingProbs) return <div className="py-4">Loading form...</div>;

  return (
    <form className="max-w-4xl space-y-6" onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <label htmlFor="problem-select" className="mb-2 block text-sm font-medium text-gray-700">
            問題
          </label>
          <select
            id="problem-select"
            value={selectedProblemId}
            onChange={(e) => setSelectedProblemId(e.target.value)}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
          >
            {problems?.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title} (ID {p.id})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="language-select" className="mb-2 block text-sm font-medium text-gray-700">
            言語
          </label>
          <select
            id="language-select"
            value={selectedLanguageId}
            onChange={(e) => setSelectedLanguageId(e.target.value)}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
          >
            {languages?.map((lang) => (
              <option key={lang.id} value={lang.id}>
                {lang.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="submit-code-area" className="mb-2 block text-sm font-medium text-gray-700">
          コード
        </label>
        <textarea
          id="submit-code-area"
          rows={12}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="block w-full rounded-md border border-gray-300 px-3 py-2 font-mono shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
          placeholder="コードをここに貼り付けてください..."
        />
        <p className="mt-2 text-sm text-gray-500">
          現在の文字数: <span className="font-bold">{code.length}</span> 文字
        </p>
      </div>

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={submitMutation.isPending || !code.trim()}
          className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-6 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitMutation.isPending ? '提出中...' : '提出する'}
        </button>
      </div>

      {submitMessage && (
        <div
          className={`rounded-md p-4 ${submitMessage.type === 'success' ? 'border-l-4 border-green-400 bg-green-50 text-green-800' : 'border-l-4 border-red-400 bg-red-50 text-red-800'}`}
        >
          {submitMessage.text}
        </div>
      )}
    </form>
  );
}

export default function SubmitPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SubmitForm />
    </Suspense>
  );
}
