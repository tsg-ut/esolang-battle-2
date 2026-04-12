'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { trpc } from '@/utils/trpc';
import { HomeOutlined, SettingOutlined, UserOutlined } from '@ant-design/icons';
import { Avatar, Button, Space } from 'antd';

export default function NavBar() {
  const pathname = usePathname();
  const { data: me } = trpc.me.useQuery();

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
            href="/languages"
            className={`text-sm font-medium transition-colors hover:text-blue-600 ${
              isActive('/languages') ? 'text-blue-600' : 'text-gray-600'
            }`}
          >
            言語一覧
          </Link>
        </Space>
      </Space>

      <Space size="middle">
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

        <Link href="/user">
          <Button
            type={isActive('/user') ? 'primary' : 'default'}
            icon={<UserOutlined />}
            className="flex items-center"
          >
            {me ? (
              <Space>
                <Avatar size="small" style={{ backgroundColor: '#87d068' }}>
                  {me.name?.[0]?.toUpperCase()}
                </Avatar>
                <span>{me.name}</span>
              </Space>
            ) : (
              'ログイン'
            )}
          </Button>
        </Link>
      </Space>
    </nav>
  );
}
