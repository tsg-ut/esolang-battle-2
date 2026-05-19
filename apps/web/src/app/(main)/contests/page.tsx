'use client';

import Link from 'next/link';

import { trpc } from '@/utils/trpc';
import { ClockCircleOutlined, LockOutlined, TrophyOutlined } from '@ant-design/icons';
import { Card, Col, Row, Spin, Tag, Typography } from 'antd';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;

export default function ContestsPage() {
  const { data: contests, isLoading, error } = trpc.getContests.useQuery();

  const getStatusTags = (startAt: string, endAt: string, isPublic: boolean) => {
    const now = dayjs();
    const start = dayjs(startAt);
    const end = dayjs(endAt);
    const tags = [];

    if (!isPublic) {
      tags.push(
        <Tag key="private" color="volcano" icon={<LockOutlined />}>
          非公開
        </Tag>
      );
    }

    if (now.isAfter(end)) {
      tags.push(
        <Tag key="status" color="default">
          終了
        </Tag>
      );
    } else if (now.isBefore(start)) {
      tags.push(
        <Tag key="status" color="blue">
          開始前
        </Tag>
      );
    } else {
      tags.push(
        <Tag key="status" color="green">
          開催中
        </Tag>
      );
    }

    return tags;
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 text-center">
          <Title level={2}>
            <TrophyOutlined className="mr-3 text-yellow-500" />
            コンテスト一覧
          </Title>
          <Paragraph className="text-gray-500">
            開催中および過去のコンテストを確認できます。
          </Paragraph>
        </div>

        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Spin size="large" tip="Loading contests..." />
          </div>
        ) : error ? (
          <Card className="border-red-200 bg-red-50">
            <Text type="danger">Error: {error.message}</Text>
          </Card>
        ) : !contests || contests.length === 0 ? (
          <Card className="text-center text-gray-500">コンテストがありません。</Card>
        ) : (
          <Row gutter={[24, 24]}>
            {contests.map((c) => (
              <Col xs={24} sm={12} lg={8} key={c.id}>
                <Link href={`/contest/${c.id}/board`}>
                  <Card
                    hoverable
                    className="h-full border-none shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
                    title={
                      <div className="flex items-center justify-between">
                        <span className="truncate">{c.name}</span>
                        <div className="flex gap-1">
                          {getStatusTags(c.startAt, c.endAt, c.isPublic)}
                        </div>
                      </div>
                    }
                  >
                    <div className="space-y-4">
                      <div className="flex flex-col gap-1">
                        <Text type="secondary" className="text-xs font-bold uppercase">
                          開催期間
                        </Text>
                        <div className="flex items-center gap-2 text-gray-700">
                          <ClockCircleOutlined className="text-blue-500" />
                          <span className="text-sm">
                            {dayjs(c.startAt).format('YYYY/MM/DD HH:mm')} 〜
                          </span>
                        </div>
                        <div className="ml-6 text-sm text-gray-700">
                          {dayjs(c.endAt).format('YYYY/MM/DD HH:mm')}
                        </div>
                      </div>

                      <div className="flex items-center justify-between border-t pt-4">
                        <Text type="secondary" className="text-xs">
                          ID: {c.id}
                        </Text>
                        <Text className="font-medium text-blue-600">参加する →</Text>
                      </div>
                    </div>
                  </Card>
                </Link>
              </Col>
            ))}
          </Row>
        )}
      </div>
    </div>
  );
}
