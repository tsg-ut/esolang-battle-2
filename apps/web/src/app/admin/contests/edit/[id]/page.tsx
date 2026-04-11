'use client';

import { useEffect, useState } from 'react';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { BulkDeleteButton } from '@/components/admin/BulkDeleteButton';
import { trpc } from '@/utils/trpc';
import { EyeOutlined } from '@ant-design/icons';
import { DeleteButton, Edit, EditButton, useForm, useTable } from '@refinedev/antd';
import { useParsed } from '@refinedev/core';
import {
  Button,
  Card,
  DatePicker,
  Form,
  Input,
  Select,
  Space,
  Table,
  Tabs,
  Tag,
  Tooltip,
  message,
} from 'antd';
import dayjs from 'dayjs';

export default function ContestEdit() {
  const { formProps, saveButtonProps } = useForm();
  const { id } = useParsed();
  const contestId = id ? Number(id) : undefined;

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // URLパラメータから現在のタブを取得 (デフォルトは "info")
  const activeTab = searchParams.get('tab') || 'info';

  const handleTabChange = (key: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', key);
    router.replace(`${pathname}?${params.toString()}`);
  };

  const { data: board, isLoading: isLoadingBoard } = trpc.adminGetBoardByContestId.useQuery(
    { contestId: contestId ?? 0 },
    { enabled: !!contestId }
  );

  const boardButton =
    contestId && !isLoadingBoard ? (
      board ? (
        <Button type="primary" onClick={() => router.push(`/admin/boards/edit/${board.id}`)}>
          Configure Board (B#{board.id})
        </Button>
      ) : (
        <Button onClick={() => router.push(`/admin/boards/create?contestId=${contestId}`)}>
          Create Board
        </Button>
      )
    ) : (
      <Button disabled loading={isLoadingBoard}>
        Loading Board Info...
      </Button>
    );

  return (
    <Edit
      saveButtonProps={saveButtonProps}
      headerButtons={({ defaultButtons }) => (
        <Space>
          {defaultButtons}
          {boardButton}
          {contestId && (
            <Button
              icon={<EyeOutlined />}
              onClick={() => window.open(`/contest/${contestId}/board`, '_blank')}
            >
              View Public Board
            </Button>
          )}
        </Space>
      )}
    >
      <Tabs activeKey={activeTab} onChange={handleTabChange}>
        <Tabs.TabPane tab="Basic Information" key="info">
          <div style={{ padding: '16px 0' }}>
            <Form {...formProps} layout="vertical">
              <Form.Item label="ID" name="id">
                <Input disabled />
              </Form.Item>
              <Form.Item label="Name" name="name" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
              <Form.Item
                label="Start At"
                name="startAt"
                rules={[{ required: true }]}
                getValueProps={(value) => ({ value: value ? dayjs(value) : undefined })}
              >
                <DatePicker showTime />
              </Form.Item>
              <Form.Item
                label="End At"
                name="endAt"
                rules={[{ required: true }]}
                getValueProps={(value) => ({ value: value ? dayjs(value) : undefined })}
              >
                <DatePicker showTime />
              </Form.Item>
            </Form>
          </div>
        </Tabs.TabPane>

        <Tabs.TabPane tab="Board Configuration" key="board">
          {contestId && <BoardSubEdit contestId={contestId} />}
        </Tabs.TabPane>

        <Tabs.TabPane tab="Problems" key="problems">
          {contestId && <ProblemSubList contestId={contestId} />}
        </Tabs.TabPane>

        <Tabs.TabPane tab="Teams" key="teams">
          {contestId && <TeamSubList contestId={contestId} />}
        </Tabs.TabPane>
      </Tabs>
    </Edit>
  );
}

function BoardSubEdit({ contestId }: { contestId: number }) {
  const { data: board, isLoading, refetch } = trpc.adminGetBoardByContestId.useQuery({ contestId });
  const upsertBoardMutation = trpc.adminUpsertBoard.useMutation();
  const recalculateMutation = trpc.adminRecalculateBoard.useMutation();

  const [type, setType] = useState('GRID');
  const [config, setConfig] = useState('');
  const [state, setState] = useState('');

  useEffect(() => {
    if (board) {
      setType(board.type);
      setConfig(JSON.stringify(board.config, null, 2));
      setState(JSON.stringify(board.state, null, 2));
    }
  }, [board]);

  const handleSave = async () => {
    try {
      const parsedConfig = JSON.parse(config);
      const parsedState = JSON.parse(state);
      await upsertBoardMutation.mutateAsync({
        id: board?.id ?? null,
        contestId,
        type,
        config: parsedConfig,
        state: parsedState,
      });
      message.success('Board saved successfully');
      refetch();
    } catch (e: any) {
      message.error('Save failed: ' + e.message);
    }
  };

  const handleRecalculate = async () => {
    if (!board) return;
    try {
      await recalculateMutation.mutateAsync({ boardId: board.id });
      message.success('Board recalculated from submissions');
      refetch();
    } catch (e: any) {
      message.error('Recalculation failed: ' + e.message);
    }
  };

  if (isLoading) return <div>Loading board info...</div>;

  return (
    <div style={{ padding: '16px 0' }}>
      <Card
        title={board ? `Edit Board for ${board.contestName}(#${contestId})` : 'Create New Board'}
        extra={
          <Space>
            {board && (
              <Button onClick={handleRecalculate} loading={recalculateMutation.isPending}>
                Recalculate
              </Button>
            )}
            <Button type="primary" onClick={handleSave} loading={upsertBoardMutation.isPending}>
              {board ? 'Save Changes' : 'Create Board'}
            </Button>
          </Space>
        }
      >
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
            Board Type
          </label>
          <Select
            value={type}
            onChange={setType}
            style={{ width: '200px' }}
            options={[
              { label: 'GRID', value: 'GRID' },
              { label: 'HONEYCOMB', value: 'HONEYCOMB' },
              { label: 'CROSS_GRID', value: 'CROSS_GRID' },
            ]}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
              Config (JSON)
            </label>
            <Input.TextArea
              value={config}
              onChange={(e) => setConfig(e.target.value)}
              rows={20}
              style={{ fontFamily: 'monospace', fontSize: '12px' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
              State (JSON)
            </label>
            <Input.TextArea
              value={state}
              onChange={(e) => setState(e.target.value)}
              rows={20}
              style={{ fontFamily: 'monospace', fontSize: '12px' }}
            />
          </div>
        </div>
      </Card>
    </div>
  );
}

function ProblemSubList({ contestId }: { contestId: number }) {
  const router = useRouter();
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const { tableProps } = useTable({
    resource: 'problems',
    permanentFilter: [{ field: 'contestId', operator: 'eq', value: contestId }],
    pagination: { mode: 'off' },
  });

  return (
    <div style={{ padding: '16px 0' }}>
      <Space style={{ marginBottom: '16px' }}>
        <Button
          type="primary"
          onClick={() => router.push(`/admin/problems/create?contestId=${contestId}`)}
        >
          Add Problem
        </Button>
        <BulkDeleteButton
          resource="problems"
          selectedKeys={selectedRowKeys}
          onSuccess={() => setSelectedRowKeys([])}
        />
      </Space>
      <Table
        {...tableProps}
        rowKey="id"
        rowSelection={{
          selectedRowKeys,
          onChange: (keys) => setSelectedRowKeys(keys),
        }}
      >
        <Table.Column dataIndex="id" title="ID" />
        <Table.Column dataIndex="title" title="Title" />
        <Table.Column
          title="Actions"
          render={(_, record: any) => (
            <Space>
              <Tooltip title="View on Site">
                <Button
                  size="small"
                  icon={<EyeOutlined />}
                  onClick={() => window.open(`/contest/${contestId}/problem`, '_blank')}
                />
              </Tooltip>
              <EditButton hideText size="small" resource="problems" recordItemId={record.id} />
              <DeleteButton hideText size="small" resource="problems" recordItemId={record.id} />
            </Space>
          )}
        />
      </Table>
    </div>
  );
}

function TeamSubList({ contestId }: { contestId: number }) {
  const router = useRouter();
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const { tableProps } = useTable({
    resource: 'teams',
    permanentFilter: [{ field: 'contestId', operator: 'eq', value: contestId }],
    pagination: { mode: 'off' },
  });

  return (
    <div style={{ padding: '16px 0' }}>
      <Space style={{ marginBottom: '16px' }}>
        <Button
          type="primary"
          onClick={() => router.push(`/admin/teams/create?contestId=${contestId}`)}
        >
          Add Team
        </Button>
        <BulkDeleteButton
          resource="teams"
          selectedKeys={selectedRowKeys}
          onSuccess={() => setSelectedRowKeys([])}
        />
      </Space>
      <Table
        {...tableProps}
        rowKey="id"
        rowSelection={{
          selectedRowKeys,
          onChange: (keys) => setSelectedRowKeys(keys),
        }}
      >
        <Table.Column dataIndex="id" title="ID" />
        <Table.Column
          dataIndex="color"
          title="Color"
          render={(color) => <Tag color={color}>{color}</Tag>}
        />
        <Table.Column
          title="Actions"
          render={(_, record: any) => (
            <Space>
              <Tooltip title="View Public Board">
                <Button
                  size="small"
                  icon={<EyeOutlined />}
                  onClick={() => window.open(`/contest/${contestId}/board`, '_blank')}
                />
              </Tooltip>
              <EditButton hideText size="small" resource="teams" recordItemId={record.id} />
              <DeleteButton hideText size="small" resource="teams" recordItemId={record.id} />
            </Space>
          )}
        />
      </Table>
    </div>
  );
}
