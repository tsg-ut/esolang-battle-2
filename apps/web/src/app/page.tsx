'use client';

import React from 'react';

import Link from 'next/link';

import { CodeOutlined, RocketOutlined, TeamOutlined, TrophyOutlined } from '@ant-design/icons';
import { Button, Card, Col, Row, Space, Typography } from 'antd';

const { Title, Paragraph, Text } = Typography;

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-blue-50 to-white px-6 py-24 text-center lg:py-32">
        <div className="mx-auto max-w-4xl">
          <Title className="!mb-6 !text-5xl !font-extrabold lg:!text-6xl">
            Esolang Battle <span className="text-blue-600">2</span>
          </Title>
          <Paragraph className="mb-10 text-xl text-gray-600 lg:text-2xl">
            難解プログラミング言語（Esolang）を駆使して陣地を奪い合う、
            究極のコードゴルフ・バトルプラットフォーム。
          </Paragraph>
          <Space size="large">
            <Link href="/contests">
              <Button
                type="primary"
                size="large"
                icon={<RocketOutlined />}
                className="h-12 px-8 text-lg"
              >
                コンテストに参加する
              </Button>
            </Link>
            <Link href="/languages">
              <Button size="large" className="h-12 px-8 text-lg">
                言語ドキュメントを見る
              </Button>
            </Link>
          </Space>
        </div>
      </section>

      {/* Features Section */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <Title level={2} className="mb-16 text-center">
          バトルのルール
        </Title>
        <Row gutter={[32, 32]}>
          <Col xs={24} md={8}>
            <Card className="h-full border-none bg-gray-50 text-center shadow-none">
              <div className="mb-6 flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100 text-3xl text-blue-600">
                  <CodeOutlined />
                </div>
              </div>
              <Title level={4}>コードゴルフ</Title>
              <Paragraph className="text-gray-600">
                より短いコードで問題を解くことが勝利の鍵です。
                一文字でも削り、最小のソースコードを目指しましょう。
              </Paragraph>
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card className="h-full border-none bg-gray-50 text-center shadow-none">
              <div className="mb-6 flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-green-100 text-3xl text-green-600">
                  <TrophyOutlined />
                </div>
              </div>
              <Title level={4}>陣取りバトル</Title>
              <Paragraph className="text-gray-600">
                盤面上のセルはそれぞれ異なる言語に対応しています。
                その言語で問題を解くことで、セルを自チームの陣地にできます。
              </Paragraph>
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card className="h-full border-none bg-gray-50 text-center shadow-none">
              <div className="mb-6 flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-100 text-3xl text-purple-600">
                  <TeamOutlined />
                </div>
              </div>
              <Title level={4}>チーム戦略</Title>
              <Paragraph className="text-gray-600">
                自分の得意な言語を攻めるか、相手の進軍を妨害するか。
                チームメンバーと協力して盤面を支配しましょう。
              </Paragraph>
            </Card>
          </Col>
        </Row>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 py-12 text-center text-gray-500">
        <div className="mx-auto max-w-7xl px-6">
          <Text className="text-gray-400">
            © 2026 TSG Esolang Battle Team. All rights reserved.
          </Text>
        </div>
      </footer>
    </div>
  );
}
