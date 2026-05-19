'use client';

import React from 'react';

import Link from 'next/link';

import { ArrowRightOutlined, CodeOutlined, FlagOutlined, RocketOutlined } from '@ant-design/icons';
import { Button, Card, Divider, Space, Steps, Typography } from 'antd';

const { Title, Paragraph, Text } = Typography;

export default function AboutPage() {
  return (
    <div className="space-y-12 pb-20">
      {/* ヒーローセクション */}
      <div className="py-8 text-center">
        <Title level={1}>Esolang Battle 2 へようこそ</Title>
        <Paragraph className="text-lg text-gray-500">
          難解言語とコードゴルフを融合させた、新しい形の競技プログラミング・プラットフォームです。
        </Paragraph>
      </div>

      {/* コードゴルフとは */}
      <section>
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-xl text-blue-600">
            <CodeOutlined />
          </div>
          <Title level={2} className="!mb-0">
            コードゴルフとは？
          </Title>
        </div>
        <Card className="border-none bg-blue-50/30 shadow-sm">
          <Paragraph className="text-base leading-relaxed">
            コードゴルフとは、与えられた問題を<Text strong>「いかに短いソースコードで解くか」</Text>
            を競う競技です。
            通常の競技プログラミングが実行速度やメモリ使用量を重視するのに対し、コードゴルフでは
            <Text strong>バイト数</Text>こそがすべてです。
          </Paragraph>
          <Paragraph className="text-base leading-relaxed">
            一見すると読みにくい、魔法のようなテクニックを駆使して、ソースコードを極限まで削り落とす楽しさを体験してください。
          </Paragraph>
        </Card>
      </section>

      {/* 陣取りバトルのルール */}
      <section>
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-xl text-purple-600">
            <FlagOutlined />
          </div>
          <Title level={2} className="!mb-0">
            バトルのルール
          </Title>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Card title="盤面の支配" size="small">
            盤面（Scoreboard）上の各セルは特定のプログラミング言語に対応しています。その言語を使って問題を解くことで、セルをあなたのチームの陣地にできます。
          </Card>
          <Card title="スコアと逆転" size="small">
            他のチームが既に持っているセルであっても、より短いコード（少ないバイト数）で提出すれば、そのセルを奪い取ることができます。
          </Card>
        </div>
      </section>

      <Divider />

      {/* チュートリアル */}
      <section>
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 text-xl text-green-600">
            <RocketOutlined />
          </div>
          <Title level={2} className="!mb-0">
            クイック・チュートリアル
          </Title>
        </div>

        <Steps
          direction="vertical"
          current={-1}
          items={[
            {
              title: <span className="text-lg font-bold">コンテストを探す</span>,
              description: (
                <div className="py-2">
                  <Paragraph>まずは開催中のコンテストに参加しましょう。</Paragraph>
                  <Link href="/contests">
                    <Button type="primary" ghost icon={<ArrowRightOutlined />}>
                      コンテスト一覧を見る
                    </Button>
                  </Link>
                </div>
              ),
            },
            {
              title: <span className="text-lg font-bold">問題と言語を選ぶ</span>,
              description: (
                <div className="py-2">
                  <Paragraph>
                    コンテスト内の「盤面」タブから、自分が得意そうな言語や、戦略的に重要なセルを選びます。
                    セルをクリックすると、その言語の提出画面へ進めます。
                  </Paragraph>
                </div>
              ),
            },
            {
              title: <span className="text-lg font-bold">コードを削って提出する</span>,
              description: (
                <div className="py-2">
                  <Paragraph>
                    プログラムが完成したら、提出画面から送信！
                    判定（ジャッジ）が終わると、盤面があなたのチームの色に塗り替わります。
                  </Paragraph>
                  <Text type="secondary" className="text-xs">
                    ※ 特殊な文字を使う場合は
                    <Link href="/docs/ascii" className="mx-1 text-blue-600">
                      ASCIIコード表
                    </Link>
                    が便利です。
                  </Text>
                </div>
              ),
            },
            {
              title: <span className="text-lg font-bold">戦況を監視する</span>,
              description: (
                <div className="py-2">
                  <Paragraph>
                    他のチームに抜かされていないか、「順位表」や「盤面」を定期的にチェックしましょう。
                  </Paragraph>
                </div>
              ),
            },
          ]}
        />
      </section>

      <div className="mt-12 rounded-xl bg-gray-100 p-8 text-center">
        <Title level={3}>準備はいいですか？</Title>
        <Space size="middle" className="mt-4 justify-center" wrap>
          <Link href="/contests">
            <Button type="primary" size="large">
              競技を開始する
            </Button>
          </Link>
          <Link href="/docs/languages">
            <Button size="large">対応言語を確認する</Button>
          </Link>
        </Space>
      </div>
    </div>
  );
}
