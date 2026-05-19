'use client';

import React, { useEffect } from 'react';

import { signOut, useSession } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { trpc } from '@/utils/trpc';
import { HomeOutlined, LogoutOutlined, SettingOutlined, UserOutlined } from '@ant-design/icons';
import { Avatar, Button, Dropdown, Space } from 'antd';

export default function NavBar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const { data: me, refetch } = trpc.me.useQuery(undefined, {
    enabled: status === 'authenticated',
  });

  // セッション状態が変わったら tRPC のデータも再取得する
  useEffect(() => {
    if (status === 'authenticated') {
      refetch();
    }
  }, [status, refetch]);

  const isAdmin = me?.isAdmin;

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/';
    return pathname.startsWith(path);
  };

  return (
    <nav className="flex w-full items-center justify-between bg-white px-6 py-3 shadow-sm">
      <Space size="large">
        <Link
          href="/"
          className="flex items-center text-xl font-bold text-blue-600 hover:text-blue-800"
        >
          <HomeOutlined className="mr-2" />
          <span className="hidden sm:inline">Esolang Battle 2</span>
        </Link>

        <Space size="middle">
          <Link
            href="/contests"
            className={`text-sm font-medium transition-colors hover:text-blue-600 ${
              isActive('/contests') ? 'text-blue-600' : 'text-gray-600'
            }`}
          >
            コンテスト
          </Link>
          <Link
            href="/docs/about"
            className={`text-sm font-medium transition-colors hover:text-blue-600 ${
              isActive('/docs') ? 'text-blue-600' : 'text-gray-600'
            }`}
          >
            ドキュメント
          </Link>
        </Space>
      </Space>

      <Space size="middle" wrap className="justify-end">
        {isAdmin && (
          <Link href="/admin/users">
            <Button
              type={isActive('/admin') ? 'primary' : 'default'}
              icon={<SettingOutlined />}
              className="flex items-center"
            >
              管理
            </Button>
          </Link>
        )}

        {me ? (
          <Dropdown
            menu={{
              items: [
                {
                  key: 'profile',
                  label: <Link href={`/user/${me.id}`}>プロフィール</Link>,
                  icon: <UserOutlined />,
                },
                {
                  key: 'settings',
                  label: <Link href="/user/settings">ユーザー設定</Link>,
                  icon: <SettingOutlined />,
                },
                {
                  type: 'divider',
                },
                {
                  key: 'logout',
                  label: 'ログアウト',
                  icon: <LogoutOutlined />,
                  danger: true,
                  onClick: () => signOut({ callbackUrl: '/' }),
                },
              ],
            }}
            placement="bottomRight"
            arrow
          >
            <Button
              type={isActive('/user') ? 'primary' : 'default'}
              icon={
                <Avatar size="small" src={me.image} icon={!me.image && <UserOutlined />}>
                  {me.name?.[0]?.toUpperCase()}
                </Avatar>
              }
              className="flex items-center"
            >
              <span>{me.name}</span>
            </Button>
          </Dropdown>
        ) : (
          <Link href="/login">
            <Button
              type={isActive('/login') ? 'primary' : 'default'}
              icon={<UserOutlined />}
              className="flex items-center"
            >
              ログイン
            </Button>
          </Link>
        )}
      </Space>
    </nav>
  );
}
