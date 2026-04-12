'use client';

import React from 'react';

import { useParams } from 'next/navigation';

import { trpc } from '@/utils/trpc';
import { Spin, Table, Tabs } from 'antd';

export default function StandingsPage() {
  const params = useParams();
  const contestId = Number(params.id);

  const { data, isLoading } = trpc.getStandings.useQuery({ contestId });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spin size="large" tip="順位表を読み込み中..." />
      </div>
    );
  }

  if (!data) return null;

  const { problems, userStandings, teamStandings } = data;

  // 問題ごとのカラム動的生成
  const problemColumns = problems.map((p) => ({
    title: p.title,
    dataIndex: ['problemScores', p.id],
    key: `problem-${p.id}`,
    align: 'center' as const,
    render: (score: number) =>
      score > 0 ? <span className="font-bold text-green-600">{score}</span> : '-',
  }));

  const userColumns = [
    {
      title: '順位',
      key: 'rank',
      width: 60,
      render: (_: any, __: any, index: number) => index + 1,
    },
    {
      title: 'ユーザー',
      dataIndex: 'userName',
      key: 'userName',
      render: (name: string, record: any) => (
        <div className="flex flex-col">
          <span className="font-bold">{name}</span>
          <span className="text-xs text-gray-500">{record.teamName}</span>
        </div>
      ),
    },
    ...problemColumns,
    {
      title: '合計点',
      dataIndex: 'totalScore',
      key: 'totalScore',
      align: 'right' as const,
      className: 'bg-blue-50 font-extrabold text-blue-700',
    },
  ];

  const teamColumns = [
    {
      title: '順位',
      key: 'rank',
      width: 60,
      render: (_: any, __: any, index: number) => index + 1,
    },
    {
      title: 'チーム',
      dataIndex: 'teamName',
      key: 'teamName',
      render: (name: string, record: any) => (
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded-full" style={{ backgroundColor: record.teamColor }} />
          <span className="font-bold">{name}</span>
        </div>
      ),
    },
    ...problemColumns,
    {
      title: '合計点',
      dataIndex: 'totalScore',
      key: 'totalScore',
      align: 'right' as const,
      className: 'bg-green-50 font-extrabold text-green-700',
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">順位表</h1>

      <Tabs
        defaultActiveKey="user"
        items={[
          {
            key: 'user',
            label: '個人順位',
            children: (
              <Table
                dataSource={userStandings}
                columns={userColumns}
                rowKey="userId"
                pagination={false}
                bordered
                size="middle"
              />
            ),
          },
          {
            key: 'team',
            label: 'チーム順位',
            children: (
              <Table
                dataSource={teamStandings}
                columns={teamColumns}
                rowKey="teamId"
                pagination={false}
                bordered
                size="middle"
              />
            ),
          },
        ]}
      />
    </div>
  );
}
