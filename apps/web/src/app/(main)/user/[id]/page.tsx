'use client';

import React, { useMemo } from 'react';

import Link from 'next/link';
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation';

import { trpc } from '@/utils/trpc';
import {
  BarChartOutlined,
  CalendarOutlined,
  FileTextOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Avatar, Button, Empty, Space, Spin, Table, Tag, Typography } from 'antd';
import dayjs from 'dayjs';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts';

const { Title, Text } = Typography;

export default function UserProfilePage() {
  const params = useParams();
  const userId = String(params.id);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const activeTab = searchParams.get('tab') || 'stats';

  const { data: user, isLoading: isLoadingUser } = trpc.getUserProfile.useQuery({ id: userId });
  const { data: me } = trpc.me.useQuery();

  const handleTabChange = (key: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', key);
    router.replace(`${pathname}?${params.toString()}`);
  };

  if (isLoadingUser) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spin size="large" tip="ユーザー情報を読み込み中..." />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Empty description="ユーザーが見つかりません" />
      </div>
    );
  }

  const tabs = [
    {
      id: 'stats',
      label: (
        <span>
          <BarChartOutlined /> 統計情報
        </span>
      ),
      children: <UserStatsTab user={user} />,
    },
    {
      id: 'contests',
      label: (
        <span>
          <TeamOutlined /> 参加コンテスト
        </span>
      ),
      children: <UserContestsTab user={user} />,
    },
    {
      id: 'submissions',
      label: (
        <span>
          <FileTextOutlined /> 提出一覧
        </span>
      ),
      children: <UserSubmissionsList userId={userId} />,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header - Cleaned up per request */}
        <div className="mb-8 flex flex-col items-center gap-8 sm:flex-row sm:items-center">
          <Avatar
            size={120}
            src={user.image}
            icon={!user.image && <UserOutlined />}
            className="shrink-0 border-4 border-white shadow-sm"
            style={{ backgroundColor: '#1677ff' }}
          />
          <div className="flex flex-1 flex-col gap-4 text-center sm:text-left">
            <div className="flex flex-col items-center gap-4 sm:flex-row">
              <Title level={1} className="!mb-0">
                {user.name}
              </Title>
              {me?.id === user.id && (
                <Link href="/user/settings">
                  <Button size="large" type="primary">
                    ユーザー設定
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Content Tabs */}
        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="flex border-b border-gray-200">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`flex-1 py-4 text-center text-sm font-medium transition-colors ${
                    isActive
                      ? 'border-b-2 border-blue-600 text-blue-600'
                      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
          <div className="p-8">{tabs.find((t) => t.id === activeTab)?.children || <Empty />}</div>
        </div>
      </div>
    </div>
  );
}

function UserStatsTab({ user }: { user: any }) {
  const { data, isLoading } = trpc.getSubmissions.useQuery({
    userId: user.id,
    status: 'AC',
  });

  const statsData = useMemo(() => {
    if (!data?.items) return [];
    const languageStats: Record<number, { name: string; solved: Set<number> }> = {};

    data.items.forEach((sub) => {
      if (!languageStats[sub.languageId]) {
        languageStats[sub.languageId] = {
          name: sub.language.name,
          solved: new Set(),
        };
      }
      languageStats[sub.languageId].solved.add(sub.problemId);
    });

    return Object.values(languageStats)
      .map((s) => ({
        name: s.name,
        count: s.solved.size,
      }))
      .sort((a, b) => b.count - a.count);
  }, [data?.items]);

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3 rounded-lg bg-blue-50 p-4">
        <CalendarOutlined className="text-blue-500" />
        <Text strong>登録日:</Text>
        <Text>{dayjs(user.createdAt).format('YYYY年MM月DD日')}</Text>
      </div>

      <div className="space-y-4">
        <Title level={4}>言語別正解問題数</Title>
        {isLoading ? (
          <Spin tip="統計データを計算中..." />
        ) : statsData.length > 0 ? (
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={statsData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" allowDecimals={false} />
                <YAxis dataKey="name" type="category" width={100} />
                <RechartsTooltip />
                <Bar
                  dataKey="count"
                  name="正解数"
                  fill="#1677ff"
                  radius={[0, 4, 4, 0]}
                  barSize={30}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <Empty description="AC済みの提出がありません" />
        )}
      </div>
    </div>
  );
}

function UserContestsTab({ user }: { user: any }) {
  const sortedTeams = useMemo(() => {
    return [...(user.teams || [])].sort((a, b) =>
      dayjs(b.contest?.startAt).diff(dayjs(a.contest?.startAt))
    );
  }, [user.teams]);

  if (sortedTeams.length === 0) return <Empty description="参加したコンテストはありません" />;

  return (
    <div className="space-y-2">
      {sortedTeams.map((t: any) => (
        <div
          key={t.id}
          className="flex flex-wrap items-center justify-between gap-4 rounded border-b px-4 py-4 transition-colors last:border-0 hover:bg-gray-50"
        >
          <div className="flex flex-1 flex-col gap-x-4 gap-y-1 sm:flex-row sm:items-center">
            <div className="flex flex-col">
              <span className="text-lg font-bold text-gray-900">
                {t.contest?.name || `コンテスト #${t.contestId}`}
              </span>
              <span className="text-xs text-gray-400">
                {dayjs(t.contest?.startAt).format('YYYY/MM/DD HH:mm')} 〜{' '}
                {dayjs(t.contest?.endAt).format('YYYY/MM/DD HH:mm')}
              </span>
            </div>

            <div className="hidden h-8 w-px bg-gray-200 sm:block" />

            <div className="flex items-center gap-2">
              <Tag color="blue">チーム: {t.name || `Team ${t.id}`}</Tag>
              <div
                className="h-3 w-3 rounded-full border shadow-sm"
                style={{ backgroundColor: t.color }}
                title={t.color}
              />
            </div>
          </div>

          <Space size="middle">
            <Link href={`/contest/${t.contestId}/board`}>
              <Button type="default" size="small">
                盤面
              </Button>
            </Link>
            <Link href={`/contest/${t.contestId}/standings`}>
              <Button type="default" size="small">
                順位表
              </Button>
            </Link>
          </Space>
        </div>
      ))}
    </div>
  );
}

function UserSubmissionsList({ userId }: { userId: string }) {
  const [currentPage, setCurrentPage] = React.useState(1);
  const pageSize = 15;

  const { data, isLoading } = trpc.getSubmissions.useQuery(
    {
      userId,
      limit: pageSize,
      offset: (currentPage - 1) * pageSize,
    },
    {
      refetchInterval: 60000,
    }
  );

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      render: (id: number, record: any) => (
        <Link
          href={`/contest/${record.problem?.contestId || 0}/submissions/${id}`}
          className="font-mono text-blue-600"
        >
          {id}
        </Link>
      ),
    },
    {
      title: 'コンテスト',
      key: 'contest',
      render: (_: any, record: any) => (
        <Link
          href={`/contest/${record.problem?.contest?.id}/board`}
          className="font-medium text-gray-600 hover:text-blue-600"
        >
          {record.problem?.contest?.name || `コンテスト #${record.problem?.contest?.id}`}
        </Link>
      ),
    },
    {
      title: '問題',
      key: 'problem',
      render: (_: any, record: any) => (
        <Link
          href={`/contest/${record.problem?.contest?.id}/problem/${record.problemId}`}
          className="font-bold text-gray-900 hover:text-blue-600"
        >
          {record.problem?.title}
        </Link>
      ),
    },
    {
      title: '言語',
      dataIndex: ['language', 'name'],
      key: 'language',
    },
    {
      title: 'ステータス',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colorMap: any = {
          AC: 'success',
          WA: 'warning',
          TLE: 'warning',
          RE: 'error',
          WJ: 'default',
        };
        return <Tag color={colorMap[status] || 'default'}>{status}</Tag>;
      },
    },
    {
      title: 'スコア',
      dataIndex: 'score',
      key: 'score',
      align: 'right' as const,
      render: (score: number | null) => (score !== null ? <b>{score}</b> : '-'),
    },
    {
      title: '提出時刻',
      dataIndex: 'submittedAt',
      key: 'submittedAt',
      render: (date: string) => dayjs(date).format('MM/DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Link href={`/contest/${record.problem?.contest?.id}/submissions/${record.id}`}>
          <Button size="small" type="primary" ghost>
            詳細
          </Button>
        </Link>
      ),
    },
  ];

  return (
    <Table
      dataSource={data?.items}
      columns={columns}
      rowKey="id"
      loading={isLoading}
      size="middle"
      pagination={{
        current: currentPage,
        pageSize: pageSize,
        total: data?.total,
        onChange: (page) => setCurrentPage(page),
      }}
      scroll={{ x: 'max-content' }}
    />
  );
}
