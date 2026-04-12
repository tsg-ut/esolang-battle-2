'use client';

import React from 'react';

import { Card, Divider, List, Table, Typography } from 'antd';

const { Title, Paragraph, Text } = Typography;

const CodeBlock = ({ children }: { children: string }) => (
  <pre className="my-4 overflow-x-auto rounded border border-gray-200 bg-gray-100 p-4 font-mono text-sm">
    <code>{children}</code>
  </pre>
);

export default function JudgeDocsPage() {
  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '24px' }}>
      <Title level={2}>Judge System Documentation</Title>

      <Card className="mb-8 border-blue-200 bg-blue-50">
        <Title level={4}>2段階ジャッジシステム</Title>
        <Paragraph>
          Esolang Battle 2では、柔軟な得点計算を実現するために2段階の判定プロセスを採用しています。
        </Paragraph>
        <List
          dataSource={[
            {
              title: 'Case Checker',
              desc: '個々のテストケースに対して、ユーザーコードの出力を検証し、そのケース単体の成否とスコアを判定します。',
            },
            {
              title: 'Score Aggregator',
              desc: '全ケースの判定結果（Checkerの結果）をまとめ、提出全体の最終的なステータスとスコアを算出します。',
            },
          ]}
          renderItem={(item, index) => (
            <List.Item>
              <Text strong>
                {index + 1}. {item.title}:
              </Text>{' '}
              {item.desc}
            </List.Item>
          )}
        />
      </Card>

      <Card id="case-checker" title="1. Case Checker" className="mb-8 shadow-sm">
        <Paragraph>個別のテストケースごとの判定を行います。</Paragraph>

        <Card className="mb-6 border-amber-100 bg-amber-50" size="small">
          <Title level={5}>実行の優先順位</Title>
          <Paragraph className="mb-0">
            チェッカーは以下の順序で探索され、最初に見つかったものが使用されます：
          </Paragraph>
          <List
            size="small"
            dataSource={[
              '1. テストケース個別に設定されたカスタムスクリプト',
              '2. 問題全体に設定されたカスタムスクリプト',
              '3. 問題全体に設定された組み込みチェッカー',
            ]}
            renderItem={(item) => <List.Item>{item}</List.Item>}
          />
        </Card>

        <Title level={4}>Built-in Case Checkers</Title>
        <Table
          pagination={false}
          size="small"
          className="mb-6"
          dataSource={[
            { name: 'EXACT', desc: '完全一致' },
            { name: 'TRIM', desc: '前後の空白・改行を除去して一致' },
            { name: 'WHITESPACE', desc: '連続空白を1つに集約して一致' },
            { name: 'IGNORE_CASE', desc: '大文字小文字を区別せず一致' },
            { name: 'FLOAT', desc: '数値として指定誤差(epsilon)内で一致' },
            { name: 'CONTAINS', desc: '標準出力に期待される文字列が含まれるか' },
          ]}
          columns={[
            { title: 'Name', dataIndex: 'name', key: 'name', render: (t) => <code>{t}</code> },
            { title: 'Description', dataIndex: 'desc', key: 'desc' },
          ]}
        />

        <Title level={4}>Custom Case Checker</Title>
        <Paragraph>
          <Text strong>実行形式:</Text>{' '}
          <code>script /volume/judge.src &lt; /volume/input.json</code>
        </Paragraph>

        <Title level={5}>Input JSON (stdin)</Title>
        <CodeBlock>
          {`{
  "testCase": {
    "input": "string",
    "expectedOutput": "string",
    "isSample": boolean
  },
  "execution": {
    "stdout": "string",
    "stderr": "string",
    "exitCode": number,
    "durationMs": number
  },
  "config": any // 問題設定の checkerConfig
}`}
        </CodeBlock>

        <Title level={5}>Output JSON (stdout)</Title>
        <CodeBlock>
          {`{
  "status": "AC" | "WA" | "TLE" | "RE" | "WJ",
  "score": number, // このケースの獲得点数
  "message": "string" // (任意) 各ケースの表示メッセージ
}`}
        </CodeBlock>
      </Card>

      <Card id="score-aggregator" title="2. Score Aggregator" className="mb-8 shadow-sm">
        <Paragraph>全ケースの結果を集計し、提出全体の最終結果を決定します。</Paragraph>

        <Title level={4}>Built-in Aggregators</Title>
        <Paragraph>現在、組み込みは以下の共通ロジックです。</Paragraph>
        <Text type="secondary" className="mb-2 block">
          全ケースがACなら「AC
          (スコア=コード長)」。一つでもエラーがあれば、最悪のステータスを採用しスコア0。
        </Text>

        <Divider />

        <Title level={4}>Custom Score Aggregator</Title>
        <Title level={5}>Input JSON (stdin)</Title>
        <CodeBlock>
          {`{
  "submission": {
    "id": number,
    "codeLength": number,
    "languageId": number
  },
  "results": [
    {
      "testCaseId": number,
      "isSample": boolean,
      "checkerResult": {
        "status": "AC" | "WA" | ...,
        "score": number,
        "message": "string"
      }
    }
  ],
  "config": any // 問題設定の aggregatorConfig
}`}
        </CodeBlock>

        <Title level={5}>Output JSON (stdout)</Title>
        <CodeBlock>
          {`{
  "status": "AC" | "WA" | "TLE" | "RE" | "WJ",
  "finalScore": number | null,
  "summaryMessage": "string" // (任意) 提出全体のサマリー
}`}
        </CodeBlock>
      </Card>
    </div>
  );
}
