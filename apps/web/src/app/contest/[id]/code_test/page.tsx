'use client';

import React, { useEffect, useState } from 'react';

import { useParams } from 'next/navigation';

import { LoginRequiredMessage } from '@/components/LoginRequiredMessage';
import { CodeSubmitForm } from '@/components/submission/CodeSubmitForm';
import { trpc } from '@/utils/trpc';
import { Button, Popconfirm } from 'antd';

export default function CodeTestPage() {
  const params = useParams();
  const contestId = Number(params.id);

  const { data: me, isLoading: isLoadingMe } = trpc.me.useQuery();
  const isLoggedIn = !!me;

  const {
    data: languages,
    isLoading: isLoadingLanguages,
    error: languagesError,
  } = trpc.getLanguages.useQuery();
  const testCodeMutation = trpc.testCode.useMutation();

  const [selectedLanguageId, setSelectedLanguageId] = useState<string>('');
  const [testCodeText, setTestCodeText] = useState('');
  const [stdinText, setStdinText] = useState('');
  const [result, setResult] = useState<any>(null);

  const storageKey = `esolang_battle_codetest_${contestId}`;

  // 初期読み込み
  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.languageId) setSelectedLanguageId(data.languageId);
        if (data.code) setTestCodeText(data.code);
        if (data.stdin) setStdinText(data.stdin);
        if (data.result) setResult(data.result);
      } catch (e) {
        console.error('Failed to parse saved codetest data', e);
      }
    }
  }, [storageKey]);

  // 自動保存
  useEffect(() => {
    const data = {
      languageId: selectedLanguageId,
      code: testCodeText,
      stdin: stdinText,
      result,
    };
    localStorage.setItem(storageKey, JSON.stringify(data));
  }, [selectedLanguageId, testCodeText, stdinText, result, storageKey]);

  useEffect(() => {
    if (languages && languages.length > 0 && !selectedLanguageId) {
      const saved = localStorage.getItem(storageKey);
      if (!saved) {
        setSelectedLanguageId(String(languages[0].id));
      }
    }
  }, [languages, selectedLanguageId, storageKey]);

  const handleRunTest = async (data: { code: string; isBase64: boolean }) => {
    if (!isLoggedIn) return;
    try {
      const res = await testCodeMutation.mutateAsync({
        code: data.code,
        languageId: Number(selectedLanguageId),
        stdin: stdinText,
      });
      setResult(res);
      setTestCodeText(data.code); // 状態を同期
    } catch (err) {
      console.error(err);
    }
  };

  const handleReset = () => {
    setTestCodeText('');
    setStdinText('');
    setResult(null);
    testCodeMutation.reset();
    const data = {
      languageId: selectedLanguageId,
      code: '',
      stdin: '',
      result: null,
    };
    localStorage.setItem(storageKey, JSON.stringify(data));
  };

  if (isLoadingLanguages || isLoadingMe) return <div className="py-4">Loading...</div>;
  if (languagesError)
    return <div className="py-4 text-red-600">Error: {languagesError.message}</div>;
  if (!languages || languages.length === 0)
    return <div className="py-4">言語が定義されていません。</div>;

  const displayResult = testCodeMutation.data || result;

  return (
    <div className="max-w-4xl space-y-8">
      {isLoggedIn ? (
        <>
          <CodeSubmitForm
            languages={languages}
            selectedLanguageId={selectedLanguageId}
            onLanguageChange={setSelectedLanguageId}
            onSubmit={handleRunTest}
            submitLoading={testCodeMutation.isPending}
            submitText="テスト実行"
            initialCode={testCodeText}
            afterCodeFields={
              <div>
                <label
                  htmlFor="stdin-area"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  標準入力 (stdin)
                </label>
                <textarea
                  id="stdin-area"
                  rows={4}
                  value={stdinText}
                  onChange={(e) => setStdinText(e.target.value)}
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 font-mono shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none sm:text-sm"
                  placeholder="標準入力として与えたい文字列を入力..."
                />
              </div>
            }
            footerActions={
              <Popconfirm
                title="コードと結果のリセット"
                description="コード、標準入力、および実行結果をリセットしますか？（言語設定は保持されます）"
                onConfirm={handleReset}
                okText="リセットする"
                cancelText="キャンセル"
                okButtonProps={{ danger: true }}
              >
                <Button type="text" danger>
                  コードと結果をリセット
                </Button>
              </Popconfirm>
            }
          />

          {displayResult && (
            <div className="mt-8 space-y-4 border-t pt-8">
              <h3 className="text-xl font-bold text-gray-900">実行結果</h3>

              <div className="grid max-w-sm grid-cols-2 gap-4">
                <div className="rounded-md bg-gray-100 p-3">
                  <span className="mb-1 block text-xs font-bold text-gray-500 uppercase">
                    Exit Code
                  </span>
                  <span
                    className={`font-mono font-bold ${displayResult.exitCode === 0 ? 'text-green-600' : 'text-red-600'}`}
                  >
                    {displayResult.exitCode}
                  </span>
                </div>
                <div className="rounded-md bg-gray-100 p-3">
                  <span className="mb-1 block text-xs font-bold text-gray-500 uppercase">
                    Duration
                  </span>
                  <span className="font-mono font-bold text-gray-800">
                    {displayResult.durationMs}{' '}
                    <small className="font-normal text-gray-500">ms</small>
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="mb-2 text-sm font-semibold tracking-wider text-gray-700 uppercase">
                    stdout
                  </h4>
                  <pre className="min-h-[4rem] overflow-x-auto rounded-lg bg-gray-900 p-4 font-mono text-sm text-gray-100">
                    {displayResult.stdout || <span className="text-gray-500 italic">(empty)</span>}
                  </pre>
                </div>
                <div>
                  <h4 className="mb-2 text-sm font-semibold tracking-wider text-gray-700 uppercase">
                    stderr
                  </h4>
                  <pre className="min-h-[4rem] overflow-x-auto rounded-lg bg-gray-900 p-4 font-mono text-sm text-red-400">
                    {displayResult.stderr || <span className="text-gray-500 italic">(empty)</span>}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <LoginRequiredMessage />
      )}
    </div>
  );
}
