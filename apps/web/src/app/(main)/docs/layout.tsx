'use client';

import React, { useEffect, useState } from 'react';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { trpc } from '@/utils/trpc';
import {
  FileTextOutlined,
  InfoCircleOutlined,
  MenuOutlined,
  TableOutlined,
} from '@ant-design/icons';
import { Button, Drawer, Layout, Menu, Spin, Typography } from 'antd';

const { Sider, Content } = Layout;
const { Text } = Typography;

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: languages, isLoading } = trpc.getLanguages.useQuery();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // 画面遷移時にドロワーを閉じる
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const menuItems = [
    {
      key: '/docs/about',
      icon: <InfoCircleOutlined />,
      label: <Link href="/docs/about">Esolang Battle 2 とは</Link>,
    },
    {
      key: '/docs/ascii',
      icon: <TableOutlined />,
      label: <Link href="/docs/ascii">ASCIIコード表</Link>,
    },
    {
      key: '/docs/languages-menu',
      icon: <FileTextOutlined />,
      label: (
        <Link href="/docs/languages" style={{ color: 'inherit' }}>
          言語一覧
        </Link>
      ),
      children: isLoading
        ? [{ key: 'loading', label: <Spin size="small" /> }]
        : [
            {
              key: '/docs/languages',
              label: <Link href="/docs/languages">すべて表示</Link>,
            },
            ...(languages
              ?.sort((a, b) => a.name.localeCompare(b.name))
              .map((lang) => ({
                key: `/docs/languages/${lang.id}`,
                label: (
                  <Link href={`/docs/languages/${lang.id}`} className="block truncate">
                    {lang.name}
                  </Link>
                ),
              })) || []),
          ],
    },
  ];

  return (
    <Layout className="min-h-[calc(100vh-64px)] bg-white">
      {/* デスクトップ用サイドバー */}
      <Sider width={250} theme="light" className="hidden border-r border-gray-200 md:block">
        <div className="p-4">
          <Text strong className="text-xs tracking-wider text-gray-400">
            Documentation
          </Text>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[pathname]}
          defaultOpenKeys={['/docs/languages']}
          items={menuItems}
          className="border-none"
        />
      </Sider>

      {/* モバイル用ドロワー */}
      <Drawer
        title="Documentation"
        placement="left"
        onClose={() => setIsMobileMenuOpen(false)}
        open={isMobileMenuOpen}
        styles={{ body: { padding: 0 } }}
        width={280}
      >
        <Menu
          mode="inline"
          selectedKeys={[pathname]}
          defaultOpenKeys={['/docs/languages']}
          items={menuItems}
          className="border-none"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      </Drawer>

      {/* モバイル用メニューボタン */}
      <div className="fixed bottom-6 left-6 z-50 md:hidden">
        <Button
          type="primary"
          shape="circle"
          size="large"
          icon={<MenuOutlined />}
          onClick={() => setIsMobileMenuOpen(true)}
          className="flex h-12 w-12 items-center justify-center shadow-lg"
        />
      </div>

      <Content className="bg-white">
        <div className="mx-auto min-h-screen max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</div>
      </Content>
    </Layout>
  );
}
