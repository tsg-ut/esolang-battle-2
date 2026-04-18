'use client';

import React from 'react';

import { Card, Divider, Table, Tabs, Typography } from 'antd';

const { Title, Paragraph, Text } = Typography;

const CodeBlock = ({ children }: { children: string }) => (
  <pre className="my-4 overflow-x-auto rounded border border-gray-200 bg-gray-100 p-4 font-mono text-sm text-gray-800">
    <code>{children}</code>
  </pre>
);

export default function BoardDocsPage() {
  const commonConfigFields = [
    {
      key: '1',
      name: 'allowMultiOwner',
      type: 'boolean',
      desc: '同じベストスコアを出した複数チームによる同時占有を許可するか（オプション）。デフォルト: false',
    },
    {
      key: '2',
      name: 'startingPositions',
      type: 'Record<teamId, cellId[]>',
      desc: '各チームの初期拠点セルID。初期化時に強制的に所有されます。',
    },
  ];

  const gridFields = [
    { key: '1', name: 'width', type: 'number', desc: 'ボードの横幅（セルの数）。' },
    { key: '2', name: 'height', type: 'number', desc: 'ボードの縦幅（セルの数）。' },
    {
      key: '3',
      name: 'mapping',
      type: 'Record<langId, "x_y">',
      desc: '言語IDとセルの座標（"x_y" 形式）の対応付け。',
    },
    {
      key: '4',
      name: 'cellInfo',
      type: 'Record<"x_y", object>',
      desc: '各セルのメタデータ。label (表示名) と languageId (任意) を含みます。',
    },
  ];

  const honeycombFields = [
    { key: '1', name: 'cellIds', type: 'string[]', desc: 'ボードを構成する全セルのIDリスト。' },
    {
      key: '2',
      name: 'cellInfo',
      type: 'Record<id, object>',
      desc: 'セルの座標 (q, r) とメタデータを定義。',
    },
    {
      key: '3',
      name: 'mapping',
      type: 'Record<langId, cellId>',
      desc: '言語IDとセルIDの対応付け。',
    },
    { key: '4', name: 'size', type: 'number', desc: '六角形タイルの表示サイズ（ピクセル）。' },
  ];

  const crossGridFields = [
    { key: '1', name: 'problemIds', type: 'number[]', desc: '表示対象とする問題IDのリスト。' },
    { key: '2', name: 'languageIds', type: 'number[]', desc: '表示対象とする言語IDのリスト。' },
    {
      key: '3',
      name: 'problemInfo',
      type: 'Record<id, string>',
      desc: '問題IDと表示用の名前の対応。',
    },
    {
      key: '4',
      name: 'languageInfo',
      type: 'Record<id, string>',
      desc: '言語IDと表示用の名前の対応。',
    },
  ];

  const cellStateFields = [
    {
      key: '1',
      name: 'ownerTeamIds',
      type: 'number[]',
      desc: '現在そのセルを所有しているチームIDの配列。空配列の場合は未占領。',
    },
    { key: '2', name: 'score', type: 'number | null', desc: 'そのセルの現在のベストスコア。' },
    {
      key: '3',
      name: 'submissionId',
      type: 'number | null',
      desc: 'ベストスコアを最初に記録した提出ID。',
    },
  ];

  const tabItems = [
    {
      key: 'grid',
      label: 'GRID Board',
      children: (
        <Card className="mt-4 shadow-sm">
          <Paragraph>
            標準的な四角形の格子状ボードです。隣接するセルを占有している場合のみ、新しいセルを占領できます。
          </Paragraph>
          <Table
            dataSource={gridFields}
            pagination={false}
            size="small"
            className="mb-4"
            columns={[
              {
                title: 'Property',
                dataIndex: 'name',
                key: 'name',
                render: (t) => <Text code>{t}</Text>,
              },
              { title: 'Type', dataIndex: 'type', key: 'type' },
              { title: 'Description', dataIndex: 'desc', key: 'desc' },
            ]}
          />
          <Title level={5}>JSON Example</Title>
          <CodeBlock>
            {JSON.stringify(
              {
                type: 'GRID',
                width: 10,
                height: 10,
                mapping: { '1': '0_0', '2': '1_0' },
                cellInfo: {
                  '0_0': { label: 'C', languageId: 1 },
                  '1_0': { label: 'Python', languageId: 2 },
                },
                startingPositions: { '1': ['0_0'], '2': ['9_9'] },
              },
              null,
              2
            )}
          </CodeBlock>
        </Card>
      ),
    },
    {
      key: 'honeycomb',
      label: 'HONEYCOMB Board',
      children: (
        <Card className="mt-4 shadow-sm">
          <Paragraph>
            六角形のタイルが並ぶ、戦略的なボードです。隣接関係に基づいて占領が伝播します。座標は立方座標系（q,
            r）を使用します。
          </Paragraph>
          <Table
            dataSource={honeycombFields}
            pagination={false}
            size="small"
            className="mb-4"
            columns={[
              {
                title: 'Property',
                dataIndex: 'name',
                key: 'name',
                render: (t) => <Text code>{t}</Text>,
              },
              { title: 'Type', dataIndex: 'type', key: 'type' },
              { title: 'Description', dataIndex: 'desc', key: 'desc' },
            ]}
          />
          <Title level={5}>JSON Example</Title>
          <CodeBlock>
            {JSON.stringify(
              {
                type: 'HONEYCOMB',
                cellIds: ['0_0', '1_0', '0_1'],
                cellInfo: {
                  '0_0': { q: 0, r: 0, label: 'Center', languageId: 1 },
                  '1_0': { q: 1, r: 0, label: 'Right', languageId: 2 },
                },
                mapping: { '1': '0_0', '2': '1_0' },
                startingPositions: { '1': ['0_0'] },
              },
              null,
              2
            )}
          </CodeBlock>
        </Card>
      ),
    },
    {
      key: 'crossgrid',
      label: 'CROSS_GRID Board',
      children: (
        <Card className="mt-4 shadow-sm">
          <Paragraph>
            「問題 × 言語」の全組み合わせをセルとしたボードです。<b>隣接ルールはありません。</b>{' '}
            スコア条件を満たせばどこでも占領可能です。
          </Paragraph>
          <Table
            dataSource={crossGridFields}
            pagination={false}
            size="small"
            className="mb-4"
            columns={[
              {
                title: 'Property',
                dataIndex: 'name',
                key: 'name',
                render: (t) => <Text code>{t}</Text>,
              },
              { title: 'Type', dataIndex: 'type', key: 'type' },
              { title: 'Description', dataIndex: 'desc', key: 'desc' },
            ]}
          />
          <Title level={5}>JSON Example</Title>
          <CodeBlock>
            {JSON.stringify(
              {
                type: 'CROSS_GRID',
                problemIds: [1, 2, 3],
                languageIds: [1, 2],
                problemInfo: { '1': 'Problem A', '2': 'Problem B' },
                languageInfo: { '1': 'Brainfuck', '2': 'Python' },
                allowMultiOwner: true,
              },
              null,
              2
            )}
          </CodeBlock>
        </Card>
      ),
    },
  ];

  return (
    <div className="mx-auto max-w-4xl pb-12">
      <Title level={2}>Board Configuration Guide</Title>
      <Paragraph>
        ボードは、コンテスト中のチームの勢力争いを可視化するための動的なコンポーネントです。
        各ボードエンジンは、JSON形式の <code>config</code>{' '}
        を持ち、それに基づいて盤面を生成し、提出を処理します。
      </Paragraph>

      <Card title="共通設定項目 (config JSON)" className="mb-6 shadow-sm">
        <Table
          dataSource={commonConfigFields}
          pagination={false}
          columns={[
            {
              title: 'Property',
              dataIndex: 'name',
              key: 'name',
              render: (t) => <Text code>{t}</Text>,
            },
            { title: 'Type', dataIndex: 'type', key: 'type' },
            { title: 'Description', dataIndex: 'desc', key: 'desc' },
          ]}
        />
      </Card>

      <div className="mb-8 rounded-lg border border-blue-100 bg-blue-50 p-4 shadow-sm">
        <Text strong>Note on allowMultiOwner:</Text>
        <br />
        <Paragraph className="mt-2 mb-0">
          このオプションが有効な場合、既に占有されているセルに対して、現在のベストスコアと
          <b>全く同じ</b>スコアの提出があると、そのチームも所有者に追加されます。
          より良いスコアが記録された瞬間、所有者は新しい記録を出したチーム単独にリセットされます。
        </Paragraph>
      </div>

      <Divider />

      <Tabs type="card" items={tabItems} className="mb-8" />

      <Divider />

      <Title level={3}>Board State (Internal Data)</Title>
      <Paragraph>
        ボードの <code>state</code> は DB に保存される動的なデータです。
      </Paragraph>
      <Table
        dataSource={cellStateFields}
        pagination={false}
        columns={[
          {
            title: 'Field',
            dataIndex: 'name',
            key: 'name',
            render: (t) => <Text strong>{t}</Text>,
          },
          { title: 'Type', dataIndex: 'type', key: 'type', render: (t) => <Text code>{t}</Text> },
          { title: 'Description', dataIndex: 'desc', key: 'desc' },
        ]}
      />
    </div>
  );
}
