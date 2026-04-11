'use client';

import React, { useEffect, useState } from 'react';

import { useRouter } from 'next/navigation';

import { trpcDataProvider } from '@/lib/refine-trpc-provider';
import { trpc } from '@/utils/trpc';
import {
  AppstoreOutlined,
  CheckSquareOutlined,
  CodeOutlined,
  DatabaseOutlined,
  FileTextOutlined,
  TeamOutlined,
  TrophyOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { ThemedLayout, ThemedTitle, useNotificationProvider } from '@refinedev/antd';
import '@refinedev/antd/dist/reset.css';
import { Refine } from '@refinedev/core';
import { RefineKbar, RefineKbarProvider } from '@refinedev/kbar';
import routerProvider from '@refinedev/nextjs-router';
import { App as AntdApp, ConfigProvider } from 'antd';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: me, isLoading } = trpc.me.useQuery();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isLoading && (!me || !me.isAdmin)) {
      router.push('/');
    }
  }, [me, isLoading, router, mounted]);

  if (!mounted || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-gray-500">Loading admin panel...</div>
      </div>
    );
  }

  if (!me || !me.isAdmin) return null;

  return (
    <RefineKbarProvider>
      <ConfigProvider
        theme={{
          token: {
            colorPrimary: '#1677ff',
          },
        }}
      >
        <AntdApp>
          <Refine
            dataProvider={trpcDataProvider()}
            notificationProvider={useNotificationProvider}
            routerProvider={routerProvider}
            resources={[
              {
                name: 'users',
                list: '/admin/users',
                edit: '/admin/users/edit/:id',
                meta: { label: 'Users', icon: <UserOutlined /> },
              },
              {
                name: 'languages',
                list: '/admin/languages',
                create: '/admin/languages/create',
                edit: '/admin/languages/edit/:id',
                meta: { label: 'Languages', icon: <CodeOutlined /> },
              },
              {
                name: 'contests',
                list: '/admin/contests',
                create: '/admin/contests/create',
                edit: '/admin/contests/edit/:id',
                meta: { label: 'Contests', icon: <TrophyOutlined /> },
              },
              {
                name: 'all_contest_data',
                meta: { label: 'All Contest Data', icon: <DatabaseOutlined /> },
              },
              {
                name: 'teams',
                list: '/admin/teams',
                create: '/admin/teams/create',
                edit: '/admin/teams/edit/:id',
                meta: { label: 'Teams', icon: <TeamOutlined />, parent: 'all_contest_data' },
              },
              {
                name: 'problems',
                list: '/admin/problems',
                create: '/admin/problems/create',
                edit: '/admin/problems/edit/:id',
                meta: { label: 'Problems', icon: <FileTextOutlined />, parent: 'all_contest_data' },
              },
              {
                name: 'boards',
                list: '/admin/boards',
                create: '/admin/boards/create',
                edit: '/admin/boards/edit/:id',
                meta: { label: 'Boards', icon: <AppstoreOutlined />, parent: 'all_contest_data' },
              },
              {
                name: 'testcases',
                list: '/admin/testcases',
                create: '/admin/testcases/create',
                edit: '/admin/testcases/edit/:id',
                meta: {
                  label: 'TestCases',
                  icon: <CheckSquareOutlined />,
                  parent: 'all_contest_data',
                  hide: true,
                },
              },
            ]}
            options={{
              syncWithLocation: true,
              warnWhenUnsavedChanges: true,
            }}
          >
            <ThemedLayout
              Title={({ collapsed }) => (
                <ThemedTitle collapsed={collapsed} text="Esolang Battle Admin" />
              )}
            >
              {children}
            </ThemedLayout>
            <RefineKbar />
          </Refine>
        </AntdApp>
      </ConfigProvider>
    </RefineKbarProvider>
  );
}
