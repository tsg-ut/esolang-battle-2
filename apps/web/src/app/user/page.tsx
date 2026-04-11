'use client';

import React, { useState } from 'react';

import { signIn, signOut, useSession } from 'next-auth/react';

import NavBar from '@/components/NavBar';
import { trpc } from '@/utils/trpc';

export default function UserPage() {
  const { data: session, status } = useSession();
  const { data: user, refetch } = trpc.me.useQuery(undefined, {
    enabled: status === 'authenticated',
  });

  const [nameInput, setNameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [regNameInput, setRegNameInput] = useState('');
  const [regPasswordInput, setRegPasswordInput] = useState('');
  const [authMessage, setAuthMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const registerMutation = trpc.register.useMutation();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setAuthMessage(null);
    try {
      const result = await signIn('credentials', {
        name: nameInput,
        password: passwordInput,
        redirect: false,
      });

      if (result?.error) {
        setAuthMessage({ type: 'error', text: 'ユーザ名またはパスワードが違います' });
      } else {
        setAuthMessage({ type: 'success', text: 'ログインしました' });
        setPasswordInput('');
        await refetch();
      }
    } catch (err: any) {
      setAuthMessage({ type: 'error', text: err.message });
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setAuthMessage(null);
    try {
      await registerMutation.mutateAsync({ name: regNameInput, password: regPasswordInput });
      setAuthMessage({ type: 'success', text: 'ユーザ登録しました。ログインしてください。' });
      setRegNameInput('');
      setRegPasswordInput('');
    } catch (err: any) {
      setAuthMessage({ type: 'error', text: err.message });
    }
  }

  if (status === 'loading') return <div className="p-8">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex items-center border-b border-gray-200 pb-4">
          <h1 className="text-2xl font-bold text-gray-900">ユーザ設定</h1>
          <NavBar />
        </div>

        {authMessage && (
          <div
            className={`mb-6 rounded-md p-4 ${authMessage.type === 'success' ? 'border-l-4 border-green-400 bg-green-50 text-green-800' : 'border-l-4 border-red-400 bg-red-50 text-red-800'}`}
          >
            {authMessage.text}
          </div>
        )}

        {session?.user ? (
          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 border-b pb-2 text-xl font-semibold text-gray-900">ログイン情報</h2>
            <div className="space-y-4">
              <div className="flex flex-col">
                <span className="text-sm font-bold uppercase text-gray-500">ユーザ名</span>
                <span className="text-lg font-medium text-gray-900">{session.user.name}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold uppercase text-gray-500">ロール</span>
                <span className="text-gray-900">
                  {(session.user as any).isAdmin ? '管理者' : '一般ユーザ'}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold uppercase text-gray-500">所属チーム</span>
                <div className="mt-2">
                  {(session.user as any).teams && (session.user as any).teams.length > 0 ? (
                    <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {(session.user as any).teams.map((t: any) => (
                        <li
                          key={t.id}
                          className="flex items-center gap-3 rounded border border-gray-200 bg-gray-50 p-3"
                        >
                          <span
                            className={`h-3 w-3 rounded-full bg-${t.color === 'red' ? 'red-600' : t.color === 'blue' ? 'blue-700' : 'gray-400'}`}
                          ></span>
                          <span className="text-sm text-gray-700">
                            コンテスト #{t.contestId}: チーム {t.color}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="italic text-gray-500">所属チームはありません</p>
                  )}
                </div>
              </div>
              <button
                onClick={() => signOut()}
                className="mt-6 inline-flex justify-center rounded-md border border-transparent bg-red-600 px-6 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                ログアウト
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="mb-6 border-b pb-2 text-xl font-semibold text-gray-900">ログイン</h2>
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label
                    htmlFor="login-username"
                    className="mb-1 block text-sm font-medium text-gray-700"
                  >
                    ユーザ名
                  </label>
                  <input
                    id="login-username"
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label
                    htmlFor="login-password"
                    className="mb-1 block text-sm font-medium text-gray-700"
                  >
                    パスワード
                  </label>
                  <input
                    id="login-password"
                    type="password"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!nameInput || !passwordInput}
                  className="inline-flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                >
                  ログイン
                </button>
              </form>
            </div>

            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="mb-6 border-b pb-2 text-xl font-semibold text-gray-900">新規登録</h2>
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label
                    htmlFor="register-username"
                    className="mb-1 block text-sm font-medium text-gray-700"
                  >
                    ユーザ名
                  </label>
                  <input
                    id="register-username"
                    type="text"
                    value={regNameInput}
                    onChange={(e) => setRegNameInput(e.target.value)}
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label
                    htmlFor="register-password"
                    className="mb-1 block text-sm font-medium text-gray-700"
                  >
                    パスワード
                  </label>
                  <input
                    id="register-password"
                    type="password"
                    value={regPasswordInput}
                    onChange={(e) => setRegPasswordInput(e.target.value)}
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!regNameInput || !regPasswordInput || registerMutation.isPending}
                  className="inline-flex w-full justify-center rounded-md border border-transparent bg-gray-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-black focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50"
                >
                  {registerMutation.isPending ? '登録中...' : '登録する'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
