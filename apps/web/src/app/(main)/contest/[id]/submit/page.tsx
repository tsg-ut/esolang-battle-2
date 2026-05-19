'use client';

import React, { Suspense, useEffect, useState } from 'react';

import { useParams, useRouter, useSearchParams } from 'next/navigation';

import { LoginRequiredMessage } from '@/components/LoginRequiredMessage';
import { CodeSubmitForm } from '@/components/submission/CodeSubmitForm';
import { trpc } from '@/utils/trpc';
import { App, Select } from 'antd';

function SubmitForm() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const contestId = Number(params.id);
  const { message } = App.useApp();

  const { data: me, isLoading: isLoadingMe } = trpc.me.useQuery();
  const isLoggedIn = !!me;

  const { data: languages, isLoading: isLoadingLangs } = trpc.getLanguages.useQuery();
  const { data: problems, isLoading: isLoadingProbs } = trpc.listProblems.useQuery({ contestId });
  const submitMutation = trpc.submitCode.useMutation();

  const [selectedLanguageId, setSelectedLanguageId] = useState<string>('');
  const [selectedProblemId, setSelectedProblemId] = useState<string>('');

  const { data: currentProblem, isLoading: isLoadingProbDetail } = trpc.getProblem.useQuery(
    { problemId: Number(selectedProblemId) },
    { enabled: !!selectedProblemId }
  );

  const availableLanguages = currentProblem?.acceptedLanguages || languages || [];

  useEffect(() => {
    if (availableLanguages.length > 0) {
      const langIdParam = searchParams.get('languageId');
      // URLパラメータがあればそれを優先、なければ現在の選択が利用可能言語に含まれているかチェック
      if (langIdParam && availableLanguages.some((l) => String(l.id) === langIdParam)) {
        setSelectedLanguageId(langIdParam);
      } else if (
        !selectedLanguageId ||
        !availableLanguages.some((l) => String(l.id) === selectedLanguageId)
      ) {
        setSelectedLanguageId(String(availableLanguages[0].id));
      }
    }
  }, [availableLanguages, searchParams, selectedLanguageId]);

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

  const handleSubmit = async (data: {
    code: string;
    isBase64: boolean;
    fileName: string | null;
  }) => {
    if (!isLoggedIn) return;
    if (!selectedProblemId) {
      message.error('問題を選択してください');
      return;
    }
    try {
      await submitMutation.mutateAsync({
        code: data.code,
        isBase64: data.isBase64,
        languageId: Number(selectedLanguageId),
        problemId: Number(selectedProblemId),
      });
      message.success('提出が完了しました');
      router.push(`/contest/${contestId}/submissions`);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      message.error('提出に失敗しました: ' + errorMsg);
    }
  };

  if (isLoadingLangs || isLoadingProbs || isLoadingMe)
    return <div className="py-4">Loading form...</div>;

  return (
    <div className="max-w-4xl space-y-8">
      {isLoggedIn ? (
        <>
          <div className="max-w-md">
            <label
              htmlFor="problem-select-main"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              問題を選択
            </label>
            <Select
              id="problem-select-main"
              showSearch
              className="w-full"
              placeholder="問題を選択してください"
              optionFilterProp="label"
              value={selectedProblemId || undefined}
              onChange={(value) => setSelectedProblemId(value)}
              options={problems?.map((p) => ({
                value: String(p.id),
                label: `${p.title} (ID ${p.id})`,
              }))}
              filterOption={(input, option) =>
                String(option?.label ?? '')
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
            />
          </div>

          <CodeSubmitForm
            languages={availableLanguages}
            selectedLanguageId={selectedLanguageId}
            onLanguageChange={setSelectedLanguageId}
            onSubmit={handleSubmit}
            submitLoading={submitMutation.isPending || isLoadingProbDetail}
            submitText="提出する"
          />
        </>
      ) : (
        <LoginRequiredMessage />
      )}
    </div>
  );
}

export default function SubmitPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SubmitForm />
    </Suspense>
  );
}
