'use client';

import React from 'react';

import Link from 'next/link';

import { trpc } from '@/utils/trpc';
import { Card, Col, Empty, Row, Spin, Typography } from 'antd';

const { Title, Paragraph, Text } = Typography;

export default function LanguagesPage() {
  const { data: languages, isLoading } = trpc.getLanguages.useQuery();

  return (
    <div className="space-y-6">
      <div>
        <Title level={2}>利用可能な言語</Title>
        <Paragraph>
          本サイトで使用可能なプログラミング言語の一覧です。
          各言語の仕様や実行環境の詳細を確認できます。
        </Paragraph>
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Spin size="large" tip="Loading languages..." />
        </div>
      ) : languages && languages.length > 0 ? (
        <Row gutter={[24, 24]}>
          {languages
            ?.sort((a, b) => a.name.localeCompare(b.name))
            .map((lang) => (
              <Col xs={24} sm={12} key={lang.id}>
                <Link href={`/docs/languages/${lang.id}`}>
                  <Card
                    hoverable
                    className="h-full border border-gray-200 shadow-sm transition-all hover:border-blue-300 hover:shadow-md"
                  >
                    <span className="text-lg font-bold">{lang.name}</span>
                  </Card>
                </Link>
              </Col>
            ))}
        </Row>
      ) : (
        <Empty description="言語が登録されていません" />
      )}
    </div>
  );
}
