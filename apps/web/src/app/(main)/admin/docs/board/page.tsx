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

  const teamTargetFields = [
    { key: '1', name: 'width', type: 'number', desc: 'ボードの横幅（セルの数）。' },
    { key: '2', name: 'height', type: 'number', desc: 'ボードの縦幅（セルの数）。' },
    {
      key: '3',
      name: 'defaultScore',
      type: 'number',
      desc: 'score を省略した目標セルの獲得点数（オプション）。デフォルト: 1',
    },
    {
      key: '4',
      name: 'cells',
      type: 'Record<"x_y", object>',
      desc: '各セルの定義。teamId / languageId / problemId / label / score の組み合わせでセルの種類が決まります（下表）。',
    },
  ];

  const teamTargetCellKinds = [
    {
      key: '1',
      name: '目標セル',
      type: '{ teamId, languageId?, problemId?, label?, score? }',
      desc: 'languageId / problemId の少なくとも一方を指定します。そのチームのメンバーが指定した条件（省略した方は任意）を満たす提出で AC すると獲得し、score 点（省略時は defaultScore）を得ます。未獲得の間はチーム色を薄く表示します。',
    },
    {
      key: '2',
      name: '固定セル',
      type: '{ teamId, label? }',
      desc: '最初からそのチームが所有し、塗り替えられないセル。得点には含まれません。',
    },
    {
      key: '3',
      name: 'ラベルセル',
      type: '{ label }',
      desc: '見出しなどの表示専用セル。',
    },
    {
      key: '4',
      name: '共有セル',
      type: '{ shared: true, languageId?, problemId?, label?, score? }',
      desc: '目標セルと同じ条件で、どのチームのメンバーでも AC すれば獲得できるセル。複数チームが獲得でき、獲得したチームそれぞれが score 点を得ます。teamId とは同時に指定できません。同じ言語 × 問題の組み合わせに共有セルとチームの目標セルの両方を置くことはできません。未獲得の間は灰色、獲得したチームの色で塗り分けます。',
    },
  ];

  const rankingTableFields = [
    {
      key: '1',
      name: 'problemId',
      type: 'number',
      desc: '対象の問題（オプション）。省略時はコンテスト内の全問題が対象。',
    },
    {
      key: '2',
      name: 'languageIds',
      type: 'number[]',
      desc: '対象の言語（オプション）。これ以外の言語の提出は無視します。省略時は全言語が対象。',
    },
    {
      key: '3',
      name: 'teams',
      type: '{ teamId, languageId? }[]',
      desc: '表に載せるチーム。languageId を指定すると、そのチームはその言語の提出のみが対象になります。',
    },
    {
      key: '4',
      name: 'points',
      type: 'object',
      desc: '得点ルール（オプション）。デフォルト: { type: "RANK", values: [100, 80, 60] }（下表）',
    },
    {
      key: '5',
      name: 'showMultiplier',
      type: 'boolean',
      desc: '係数（スコア ÷ バイト数）とスコアの列を表示するか（オプション）。集計スクリプトでスコアを「バイト数 × 係数」にする場合に使います。',
    },
  ];

  const rankingTablePointKinds = [
    {
      key: '1',
      name: 'RANK',
      type: '{ type: "RANK", values: number[], noSubmissionPoints? }',
      desc: '順位に応じて values[順位 - 1] 点（範囲外は 0 点）。同じスコアは同じ順位で、次の順位は詰めます（1-1-2）。提出のないチームは noSubmissionPoints 点（デフォルト: values の最後の値）。',
    },
    {
      key: '2',
      name: 'RATIO',
      type: '{ type: "RATIO", base?, noSubmissionPoints? }',
      desc: 'base × 最良スコア ÷ チームのスコア（scoreOrder が DESC なら チームのスコア ÷ 最良スコア）。base のデフォルト: 100。提出のないチームは noSubmissionPoints 点（デフォルト: 0）。',
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
    {
      key: 'teamtarget',
      label: 'TEAM_TARGET Board',
      children: (
        <Card className="mt-4 shadow-sm">
          <Paragraph>
            各セルに「チーム × 言語 / 問題」を割り当てたボードです。<b>隣接ルールはありません。</b>{' '}
            チームのメンバーがセルの条件を満たす提出で AC するとセルを獲得し、config
            で指定した点数を得ます。一度獲得したセルは失われず、同じセルに AC
            したメンバーは全員記録されます。制限時間内にどれだけ多くの言語・問題で AC
            できたかを競う用途を想定しています。
          </Paragraph>
          <ul className="mb-4 list-disc pl-6 text-sm text-gray-600">
            <li>
              <Text code>{'{ teamId, languageId }'}</Text>: その言語で（どの問題でも）AC すれば獲得
            </li>
            <li>
              <Text code>{'{ teamId, problemId }'}</Text>: その問題に（どの言語でも）AC すれば獲得
            </li>
            <li>
              <Text code>{'{ teamId, problemId, languageId }'}</Text>: その問題にその言語で AC
              したときのみ獲得
            </li>
          </ul>
          <Paragraph type="secondary">
            1 つの提出が複数のセルの条件を満たす場合は、そのすべてに反映されます。共通設定項目の{' '}
            <Text code>allowMultiOwner</Text> / <Text code>startingPositions</Text>{' '}
            は使用しません（初期所有は固定セルで表現します）。同じ「チーム × 言語 ×
            問題」の組み合わせを複数のセルに割り当てると保存時にエラーになります。
          </Paragraph>
          <Table
            dataSource={teamTargetFields}
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
          <Table
            dataSource={teamTargetCellKinds}
            pagination={false}
            size="small"
            className="mb-4"
            columns={[
              { title: 'Cell', dataIndex: 'name', key: 'name' },
              {
                title: 'Shape',
                dataIndex: 'type',
                key: 'type',
                render: (t) => <Text code>{t}</Text>,
              },
              { title: 'Description', dataIndex: 'desc', key: 'desc' },
            ]}
          />
          <Title level={5}>JSON Example</Title>
          <CodeBlock>
            {JSON.stringify(
              {
                width: 4,
                height: 3,
                defaultScore: 10,
                cells: {
                  '1_0': { label: 'Problem A' },
                  '2_0': { label: 'Problem B' },
                  '3_0': { label: 'Problem C' },
                  '0_1': { teamId: 1, label: 'Red' },
                  '1_1': { teamId: 1, problemId: 1, label: 'A' },
                  '2_1': { teamId: 1, problemId: 2, label: 'B' },
                  '3_1': { teamId: 1, problemId: 3, label: 'C', score: 30 },
                  '0_2': { teamId: 2, label: 'Blue' },
                  '1_2': { teamId: 2, problemId: 1, label: 'A' },
                  '2_2': { teamId: 2, problemId: 2, label: 'B' },
                  '3_2': { teamId: 2, problemId: 3, label: 'C', score: 30 },
                },
              },
              null,
              2
            )}
          </CodeBlock>
          <Title level={5}>共有セルの例</Title>
          <CodeBlock>
            {JSON.stringify(
              {
                width: 2,
                height: 1,
                defaultScore: 15,
                cells: {
                  '0_0': { shared: true, languageId: 1, label: 'Brainfuck' },
                  '1_0': { shared: true, languageId: 2, label: 'Python' },
                },
              },
              null,
              2
            )}
          </CodeBlock>
        </Card>
      ),
    },
    {
      key: 'rankingtable',
      label: 'RANKING_TABLE Board',
      children: (
        <Card className="mt-4 shadow-sm">
          <Paragraph>
            チームごとに最良の提出を 1 つ記録し、順位表として表示するボードです。最良はコンテストの{' '}
            <Text code>scoreOrder</Text>{' '}
            で判定し、同じスコアなら先の提出を残します。対象の問題・言語以外の提出は無視します。
            表には順位・チーム・提出者・バイト数・1 位との差・得点を表示します。
          </Paragraph>
          <Paragraph type="secondary">
            state はチーム ID をキーとし、最良の提出の <Text code>score</Text> /{' '}
            <Text code>codeLength</Text> / <Text code>languageId</Text> と、順位{' '}
            <Text code>rank</Text>（提出がなければ null）・得点 <Text code>points</Text>{' '}
            を持ちます。得点は小数を保持し、表示では小数第 2 位まで切り捨てます。共通設定項目の{' '}
            <Text code>allowMultiOwner</Text> / <Text code>startingPositions</Text> は使用しません。
          </Paragraph>
          <Table
            dataSource={rankingTableFields}
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
          <Table
            dataSource={rankingTablePointKinds}
            pagination={false}
            size="small"
            className="mb-4"
            columns={[
              { title: 'points', dataIndex: 'name', key: 'name' },
              {
                title: 'Shape',
                dataIndex: 'type',
                key: 'type',
                render: (t) => <Text code>{t}</Text>,
              },
              { title: 'Description', dataIndex: 'desc', key: 'desc' },
            ]}
          />
          <Title level={5}>JSON Example</Title>
          <CodeBlock>
            {JSON.stringify(
              {
                problemId: 1,
                teams: [
                  { teamId: 1, languageId: 3 },
                  { teamId: 2, languageId: 5 },
                  { teamId: 3, languageId: 8 },
                ],
                points: { type: 'RATIO', base: 100 },
                showMultiplier: true,
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
