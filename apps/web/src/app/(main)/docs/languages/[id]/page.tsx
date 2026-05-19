'use client';

import React from 'react';

import Link from 'next/link';
import { useParams } from 'next/navigation';

import { MarkdownRenderer } from '@/components/MarkdownRenderer';
import { trpc } from '@/utils/trpc';
import { Breadcrumb, Card, Divider, Spin, Tag, Typography } from 'antd';

const { Title, Paragraph, Text } = Typography;

export default function LanguageDetailPage() {
  const params = useParams();
  const id = Number(params.id);

  const { data: lang, isLoading } = trpc.getLanguage.useQuery({ id });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spin size="large" tip="言語情報を読み込み中..." />
      </div>
    );
  }

  if (!lang) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Title level={4}>Language not found</Title>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[{ title: <Link href="/docs/languages">言語一覧</Link> }, { title: lang.name }]}
      />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <Title level={2} className="!mb-0">
          {lang.name}
        </Title>
        <Tag color="blue" className="font-mono">
          ID: {lang.id}
        </Tag>
      </div>

      <Card className="overflow-hidden border border-gray-200 shadow-sm">
        <div className="p-2">
          <Title level={4} className="mb-2 text-[10px] tracking-widest text-gray-400">
            Docker Image
          </Title>
          <div className="flex items-center justify-between rounded bg-white p-3">
            {lang.dockerImageId}
          </div>
        </div>

        <Divider className="my-0" />

        <div className="mt-4 p-2">
          <Title level={4} className="mb-4 text-[10px] tracking-widest text-gray-400">
            Language Description
          </Title>
          <div className="bg-white pt-4">
            <MarkdownRenderer content={lang.description} />
          </div>
        </div>
      </Card>

      <div className="pt-8">
        <Link href="/docs/languages">
          <Text className="cursor-pointer text-blue-600 hover:text-blue-400">← 言語一覧に戻る</Text>
        </Link>
      </div>
    </div>
  );
}
