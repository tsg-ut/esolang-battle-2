'use client';

import React from 'react';

import Link from 'next/link';
import { useParams } from 'next/navigation';

import { trpc } from '@/utils/trpc';
import { Breadcrumb, Card, Spin, Typography } from 'antd';

const { Title, Paragraph } = Typography;

export default function LanguageDetailPage() {
  const params = useParams();
  const id = Number(params.id);

  const { data: lang, isLoading } = trpc.getLanguage.useQuery({ id });

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spin size="large" tip="Loading language details..." />
      </div>
    );
  }

  if (!lang) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Title level={4}>Language not found</Title>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Breadcrumb
            items={[{ title: <Link href="/languages">Languages</Link> }, { title: lang.name }]}
          />
        </div>

        <Card className="border-none shadow-sm">
          <Title level={2}>{lang.name}</Title>
          <div className="mb-6 space-y-4">
            <div>
              <Title level={4} className="text-gray-500">
                Docker Image
              </Title>
              <code className="rounded bg-gray-100 px-2 py-1 font-mono text-sm">
                {lang.dockerImageId}
              </code>
            </div>

            <div className="mt-8">
              <Title level={4} className="text-gray-500">
                Documentation / Description
              </Title>
              <div className="prose max-w-none rounded-lg bg-gray-50 p-6">
                <Paragraph className="leading-relaxed whitespace-pre-wrap">
                  {lang.description}
                </Paragraph>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
