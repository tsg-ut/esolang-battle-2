'use client';

import React from 'react';

import Link from 'next/link';

import { trpc } from '@/utils/trpc';
import { Card, Col, Row, Spin, Typography } from 'antd';

const { Title, Paragraph } = Typography;

export default function LanguagesPage() {
  const { data: languages, isLoading } = trpc.getLanguages.useQuery();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Title level={2}>Languages</Title>
        </div>

        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Spin size="large" tip="Loading languages..." />
          </div>
        ) : (
          <Row gutter={[24, 24]}>
            {languages?.map((lang) => (
              <Col xs={24} sm={12} lg={8} key={lang.id}>
                <Link href={`/languages/${lang.id}`}>
                  <Card
                    hoverable
                    title={lang.name}
                    className="h-full border-none shadow-sm transition-shadow hover:shadow-md"
                  >
                    <Paragraph ellipsis={{ rows: 3 }} className="text-gray-600">
                      {lang.description}
                    </Paragraph>
                    <div className="mt-4 font-medium text-blue-600">View Details →</div>
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
