'use client';

import React from 'react';

import { Card, Divider, Tabs, Typography } from 'antd';

const { Title, Paragraph, Text } = Typography;

const CodeBlock = ({ children }: { children: string }) => (
  <pre className="my-4 overflow-x-auto rounded border border-gray-200 bg-gray-100 p-4 font-mono text-sm leading-relaxed">
    <code>{children}</code>
  </pre>
);

export default function BoardDocsPage() {
  const items = [
    {
      key: 'grid',
      label: 'GRID Board',
      children: <GridBoardDocs />,
    },
    {
      key: 'cross-grid',
      label: 'CROSS_GRID Board',
      children: <CrossGridBoardDocs />,
    },
    {
      key: 'honeycomb',
      label: 'HONEYCOMB Board',
      children: <HoneycombBoardDocs />,
    },
  ];

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '24px' }}>
      <Title level={2}>Board Configuration Documentation</Title>
      <Paragraph>
        ボードエンジンの種類ごとに、<code>config</code> (静的設定) と <code>state</code> (動的状態)
        の構造が異なります。
      </Paragraph>

      <Tabs items={items} type="card" className="mt-6" />
    </div>
  );
}

function GridBoardDocs() {
  return (
    <Card bordered={false}>
      <Title level={4}>Description</Title>
      <Paragraph>正方形のマス目が並ぶ標準的なグリッドボードです。</Paragraph>
      <Paragraph>
        <Text strong>座標系:</Text> 左端を <code>x = 0</code> として右方向に増加、上端を{' '}
        <code>y = 0</code> として下方向に増加します。マス目は <code>&quot;x_y&quot;</code> (例:{' '}
        <code>&quot;0_0&quot;</code>, <code>&quot;1_2&quot;</code>) で表現されます。
      </Paragraph>

      <Title level={4}>Config JSON</Title>
      <CodeBlock>
        {`{
  "width": 5,
  "height": 5,
  "mapping": {
    "1": "0_0", // languageId: "x_y" (どの言語がどのマスに対応するか)
    "2": "1_0"
  },
  "cellInfo": {
    "0_0": { 
      "label": "Ruby",
      "languageId": 1 // (任意) セルに表示するラベルと言語ID
    }
  },
  "startingPositions": {
    "1": ["0_0"], // teamId: ["x_y", ...] (最初からチームが所有しているセル)
    "2": ["4_4"]
  }
}`}
      </CodeBlock>

      <Divider />

      <Title level={4}>State JSON</Title>
      <Paragraph>
        現在の所有者やスコアを保持します。キーは <code>&quot;x_y&quot;</code> です。
      </Paragraph>
      <CodeBlock>
        {`{
  "0_0": {
    "ownerTeamId": 1,   // 所有しているチームのID
    "score": 120,       // 現在のベストスコア
    "submissionId": 45  // ベストスコアを記録した提出ID
  },
  "1_0": {
    "ownerTeamId": null, // 誰にも所有されていない場合
    "score": null,
    "submissionId": null
  }
}`}
      </CodeBlock>
    </Card>
  );
}

function CrossGridBoardDocs() {
  return (
    <Card bordered={false}>
      <Title level={4}>Description</Title>
      <Paragraph>
        縦軸に問題、横軸に言語を配置したボードです。 特定の「問題 ×
        言語」の組み合わせが1つのセルになります。
      </Paragraph>

      <Title level={4}>Config JSON</Title>
      <CodeBlock>
        {`{
  "problemIds": [1, 2],
  "languageIds": [1, 2, 3],
  "problemInfo": {
    "1": "Problem A", // problemId: 表示名
    "2": "Problem B"
  },
  "languageInfo": {
    "1": "Ruby", // languageId: 表示名
    "2": "Python"
  },
  "startingPositions": {
    "1": ["p_1_l_1"], // teamId: ["p_PROBID_l_LANGID", ...] (初期所有セル)
    "2": ["p_2_l_3"]
  }
}`}
      </CodeBlock>

      <Divider />

      <Title level={4}>State JSON</Title>
      <Paragraph>
        キーは <code>{`p_{problemId}_l_{languageId}`}</code> の形式です。
      </Paragraph>
      <CodeBlock>
        {`{
  "p_1_l_1": {
    "ownerTeamId": 1,
    "score": 50,
    "submissionId": 10
  }
}`}
      </CodeBlock>
    </Card>
  );
}

function HoneycombBoardDocs() {
  return (
    <Card bordered={false}>
      <Title level={4}>Description</Title>
      <Paragraph>
        六角形のマス目が並ぶボードです。座標系は Axial Coordinates (q, r) を使用します。
      </Paragraph>

      <Title level={4}>Config JSON</Title>
      <CodeBlock>
        {`{
  "cellIds": ["0_0", "1_0", ...],
  "cellInfo": {
    "0_0": {
      "label": "Ruby",
      "q": 0,
      "r": 0,
      "languageId": 1
    }
  },
  "mapping": {
    "1": "0_0" // languageId: cellId (1つの言語がどのセルを代表するか)
  },
  "startingPositions": {
    "1": ["0_0"] // 初期所有セル
  }
}`}
      </CodeBlock>

      <Divider />

      <Title level={4}>State JSON</Title>
      <Paragraph>
        キーは <code>cellId</code> です。
      </Paragraph>
      <CodeBlock>
        {`{
  "0_0": {
    "ownerTeamId": 2,
    "score": 80,
    "submissionId": 102
  }
}`}
      </CodeBlock>
    </Card>
  );
}
