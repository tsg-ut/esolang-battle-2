'use client';

import React, { useEffect, useState } from 'react';

import { useSession } from 'next-auth/react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

import { SlackIcon } from '@/components/icons/SlackIcon';
import { LoginForm } from '@/components/user/LoginForm';
import { RegisterForm } from '@/components/user/RegisterForm';
import { SolutionOutlined, UserOutlined } from '@ant-design/icons';
import { Alert, Button, Card, Divider, Tabs, Typography } from 'antd';

const { Title } = Typography;

export default function LoginPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [authMessage, setAuthMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // 既にログイン済みの場合はプロフィールへ飛ばす
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id) {
      router.push(`/user/${session.user.id}`);
    }
  }, [status, session, router]);

  const handleSuccess = (message: string) => {
    setAuthMessage({ type: 'success', text: message });
    // 少し待ってからリダイレクト（sessionの更新を待つ意味も込めて）
    if (session?.user?.id) {
      setTimeout(() => router.push(`/user/${session.user.id}`), 500);
    } else {
      // まだsessionがない場合はトップか、再度useEffectでの遷移を待つ
      setTimeout(() => router.refresh(), 500);
    }
  };

  const handleError = (error: string) => {
    setAuthMessage({ type: 'error', text: error });
  };

  if (status === 'loading' || status === 'authenticated') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">Loading...</div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-2xl">
        <Title level={2} className="mb-8 text-center">
          ログイン / 新規登録
        </Title>

        {authMessage && (
          <Alert
            message={authMessage.text}
            type={authMessage.type}
            showIcon
            closable
            className="mb-6"
            onClose={() => setAuthMessage(null)}
          />
        )}

        <Card className="shadow-sm">
          <Tabs
            defaultActiveKey="login"
            centered
            items={[
              {
                key: 'login',
                label: (
                  <span className="flex items-center gap-2">
                    <SolutionOutlined />
                    ログイン
                  </span>
                ),
                children: (
                  <LoginForm
                    onSuccess={() => handleSuccess('ログインしました')}
                    onError={handleError}
                  />
                ),
              },
              {
                key: 'register',
                label: (
                  <span className="flex items-center gap-2">
                    <UserOutlined />
                    新規登録
                  </span>
                ),
                children: (
                  <RegisterForm
                    onSuccess={() =>
                      setAuthMessage({
                        type: 'success',
                        text: 'ユーザ登録しました。ログインしてください。',
                      })
                    }
                    onError={handleError}
                  />
                ),
              },
            ]}
          />

          <Divider>または</Divider>

          <div className="px-4 pb-4">
            <Button block size="large" onClick={() => signIn('slack')} icon={<SlackIcon />}>
              Slack でログイン / 新規登録
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
