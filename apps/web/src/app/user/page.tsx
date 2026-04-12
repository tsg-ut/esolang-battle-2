'use client';

import React, { useState } from 'react';

import { signIn, signOut, useSession } from 'next-auth/react';

import { trpc } from '@/utils/trpc';
import {
  LockOutlined,
  LogoutOutlined,
  SolutionOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Avatar,
  Button,
  Card,
  Divider,
  Form,
  Input,
  List,
  Space,
  Tabs,
  Typography,
} from 'antd';

const { Title, Text } = Typography;

export default function UserPage() {
  const { data: session, status } = useSession();
  const { data: user, refetch } = trpc.me.useQuery(undefined, {
    enabled: status === 'authenticated',
  });

  const [authMessage, setAuthMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const registerMutation = trpc.register.useMutation();
  const [loading, setLoading] = useState(false);

  async function onLogin(values: any) {
    setLoading(true);
    setAuthMessage(null);
    try {
      const result = await signIn('credentials', {
        name: values.username,
        password: values.password,
        redirect: false,
      });

      if (result?.error) {
        setAuthMessage({ type: 'error', text: 'ユーザ名またはパスワードが違います' });
      } else {
        setAuthMessage({ type: 'success', text: 'ログインしました' });
        await refetch();
      }
    } catch (err: any) {
      setAuthMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  }

  async function onRegister(values: any) {
    setLoading(true);
    setAuthMessage(null);
    try {
      await registerMutation.mutateAsync({ name: values.username, password: values.password });
      setAuthMessage({ type: 'success', text: 'ユーザ登録しました。ログインしてください。' });
    } catch (err: any) {
      setAuthMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  }

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">Loading...</div>
    );
  }

  const loginForm = (
    <Form layout="vertical" onFinish={onLogin} size="large">
      <Form.Item
        name="username"
        label="ユーザ名"
        rules={[{ required: true, message: 'ユーザ名を入力してください' }]}
      >
        <Input prefix={<UserOutlined />} placeholder="Username" />
      </Form.Item>
      <Form.Item
        name="password"
        label="パスワード"
        rules={[{ required: true, message: 'パスワードを入力してください' }]}
      >
        <Input.Password prefix={<LockOutlined />} placeholder="Password" />
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit" block loading={loading}>
          ログイン
        </Button>
      </Form.Item>
    </Form>
  );

  const registerForm = (
    <Form layout="vertical" onFinish={onRegister} size="large">
      <Form.Item
        name="username"
        label="ユーザ名"
        rules={[{ required: true, message: 'ユーザ名を入力してください' }]}
      >
        <Input prefix={<UserOutlined />} placeholder="Username" />
      </Form.Item>
      <Form.Item
        name="password"
        label="パスワード"
        rules={[{ required: true, message: 'パスワードを入力してください' }]}
      >
        <Input.Password prefix={<LockOutlined />} placeholder="Password" />
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit" block loading={loading}>
          新規登録
        </Button>
      </Form.Item>
    </Form>
  );

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        <Title level={2} className="mb-8 text-center">
          {session ? 'ユーザ設定' : 'ログイン / 新規登録'}
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

        {session?.user ? (
          <Card className="shadow-sm">
            <Space direction="vertical" size="large" className="w-full">
              <div className="flex items-center gap-4">
                <Avatar size={64} icon={<UserOutlined />} style={{ backgroundColor: '#1677ff' }} />
                <div>
                  <Title level={3} className="!mb-0">
                    {session.user.name}
                  </Title>
                  <Text type="secondary">
                    {(session.user as any).isAdmin ? '管理者' : '一般ユーザ'}
                  </Text>
                </div>
              </div>

              <Divider className="my-0" />

              <div>
                <Title level={4}>
                  <TeamOutlined className="mr-2" />
                  所属チーム
                </Title>
                <List
                  dataSource={(session.user as any).teams || []}
                  renderItem={(t: any) => (
                    <List.Item className="px-0">
                      <List.Item.Meta
                        avatar={<Avatar size="small" style={{ backgroundColor: t.color }} />}
                        title={`コンテスト #${t.contestId}`}
                        description={`チーム: ${t.color}`}
                      />
                    </List.Item>
                  )}
                  locale={{ emptyText: '所属チームはありません' }}
                />
              </div>

              <div className="mt-4 flex justify-center">
                <Button
                  danger
                  type="primary"
                  icon={<LogoutOutlined />}
                  onClick={() => signOut()}
                  size="large"
                >
                  ログアウト
                </Button>
              </div>
            </Space>
          </Card>
        ) : (
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
                  children: loginForm,
                },
                {
                  key: 'register',
                  label: (
                    <span className="flex items-center gap-2">
                      <UserOutlined />
                      新規登録
                    </span>
                  ),
                  children: registerForm,
                },
              ]}
            />
          </Card>
        )}
      </div>
    </div>
  );
}
