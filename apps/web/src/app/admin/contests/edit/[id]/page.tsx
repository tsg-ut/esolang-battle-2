'use client';

import { useEffect, useState } from 'react';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { BulkDeleteButton } from '@/components/admin/BulkDeleteButton';
import { trpc } from '@/utils/trpc';
import { DeleteOutlined, EditOutlined, EyeOutlined } from '@ant-design/icons';
import { DeleteButton, Edit, EditButton, useForm, useTable } from '@refinedev/antd';
import { useParsed } from '@refinedev/core';
import {
  App,
  Button,
  Card,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tabs,
  Tag,
  Tooltip,
} from 'antd';
import dayjs from 'dayjs';

export default function ContestEdit() {
  const { formProps, saveButtonProps, form } = useForm({
    redirect: false,
  });
  const { id } = useParsed();
  const contestId = id ? Number(id) : undefined;

  // フォームの変更監視
  const currentValues = Form.useWatch([], form) as any;
  const { data: initialContest } = trpc.adminGetContest.useQuery(
    { id: contestId ?? 0 },
    { enabled: !!contestId }
  );

  const isChanged =
    initialContest &&
    currentValues &&
    (currentValues.name !== initialContest.name ||
      dayjs(currentValues.startAt).toISOString() !== dayjs(initialContest.startAt).toISOString() ||
      dayjs(currentValues.endAt).toISOString() !== dayjs(initialContest.endAt).toISOString());

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

  const adjustedSaveButtonProps = {
    ...saveButtonProps,
    disabled: saveButtonProps.disabled || !isChanged,
    style: { display: activeTab === 'info' ? 'inline-flex' : 'none' },
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
      saveButtonProps={adjustedSaveButtonProps}
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

        <Tabs.TabPane tab="Submissions" key="submissions">
          {contestId && <SubmissionSubList contestId={contestId} />}
        </Tabs.TabPane>
      </Tabs>
    </Edit>
  );
}

function SubmissionSubList({ contestId }: { contestId: number }) {
  const { message } = App.useApp();
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const {
    data: submissions,
    isLoading,
    refetch,
  } = trpc.getSubmissions.useQuery({
    contestId,
  });

  const { data: languages } = trpc.getLanguages.useQuery();
  const { data: problems } = trpc.adminGetProblems.useQuery({ contestId });

  const deleteMutation = trpc.adminDeleteSubmission.useMutation();
  const updateMutation = trpc.adminUpdateSubmission.useMutation();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingSubmission, setEditingSubmission] = useState<any>(null);
  const [editForm] = Form.useForm();

  const handleDelete = async (id: number) => {
    try {
      await deleteMutation.mutateAsync({ id });
      message.success('Submission deleted');
      refetch();
    } catch (e: any) {
      message.error('Delete failed: ' + e.message);
    }
  };

  const handleEdit = (record: any) => {
    setEditingSubmission(record);
    editForm.setFieldsValue({
      problemId: record.problem?.id,
      languageId: record.language?.id,
      score: record.score,
      code: record.code,
    });
    setIsEditModalOpen(true);
  };

  const handleUpdate = async (values: any) => {
    try {
      await updateMutation.mutateAsync({
        id: editingSubmission.id,
        ...values,
        score: values.score === null ? null : Number(values.score),
      });
      message.success('Submission updated');
      setIsEditModalOpen(false);
      refetch();
    } catch (e: any) {
      message.error('Update failed: ' + e.message);
    }
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: 'Problem',
      dataIndex: ['problem', 'title'],
      key: 'problem',
    },
    {
      title: 'User',
      dataIndex: ['user', 'name'],
      key: 'user',
    },
    {
      title: 'Language',
      dataIndex: ['language', 'name'],
      key: 'language',
    },
    {
      title: 'Score',
      dataIndex: 'score',
      key: 'score',
      render: (score: number | null) =>
        score !== null ? <Tag color="blue">{score}</Tag> : <Tag>WJ</Tag>,
    },
    {
      title: 'Length',
      dataIndex: 'codeLength',
      key: 'codeLength',
      render: (len: number) => `${len} bytes`,
    },
    {
      title: 'Submitted At',
      dataIndex: 'submittedAt',
      key: 'submittedAt',
      render: (date: Date) => dayjs(date).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: any) => (
        <Space>
          <Tooltip title="View Details">
            <Button
              size="small"
              icon={<EyeOutlined />}
              onClick={() =>
                window.open(`/contest/${contestId}/submissions/${record.id}`, '_blank')
              }
            />
          </Tooltip>
          <Tooltip title="Edit Submission">
            <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          </Tooltip>
          <Popconfirm
            title="Are you sure you want to delete this submission?"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button
              size="small"
              danger
              icon={<DeleteOutlined />}
              loading={deleteMutation.isPending && deleteMutation.variables?.id === record.id}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '16px 0' }}>
      <Space style={{ marginBottom: '16px' }}>
        <BulkDeleteButton
          resource="submissions"
          selectedKeys={selectedRowKeys}
          onSuccess={() => {
            setSelectedRowKeys([]);
            refetch();
          }}
        />
      </Space>
      <Table
        dataSource={submissions ?? []}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        pagination={{ pageSize: 50 }}
        rowSelection={{
          selectedRowKeys,
          onChange: (keys) => setSelectedRowKeys(keys),
        }}
      />

      <Modal
        title={`Edit Submission #${editingSubmission?.id}`}
        open={isEditModalOpen}
        onOk={() => editForm.submit()}
        onCancel={() => setIsEditModalOpen(false)}
        width={800}
        confirmLoading={updateMutation.isPending}
      >
        <Form form={editForm} layout="vertical" onFinish={handleUpdate}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Form.Item label="Problem" name="problemId" rules={[{ required: true }]}>
              <Select options={problems?.map((p) => ({ label: p.title, value: p.id }))} />
            </Form.Item>
            <Form.Item label="Language" name="languageId" rules={[{ required: true }]}>
              <Select options={languages?.map((l) => ({ label: l.name, value: l.id }))} />
            </Form.Item>
          </div>
          <Form.Item label="Score" name="score">
            <InputNumber style={{ width: '100%' }} placeholder="Score (null for WJ)" />
          </Form.Item>
          <Form.Item label="Source Code" name="code" rules={[{ required: true }]}>
            <Input.TextArea rows={15} style={{ fontFamily: 'monospace' }} />
          </Form.Item>
          <p style={{ color: 'gray', fontSize: '12px' }}>
            Note: Updating source code will automatically update the code length. To trigger
            re-evaluation, use the recalculate feature.
          </p>
        </Form>
      </Modal>
    </div>
  );
}

function BoardSubEdit({ contestId }: { contestId: number }) {
  const { data: board, isLoading, refetch } = trpc.adminGetBoardByContestId.useQuery({ contestId });
  const upsertBoardMutation = trpc.adminUpsertBoard.useMutation();
  const recalculateMutation = trpc.adminRecalculateBoard.useMutation();

  const { message } = App.useApp();
  const [form] = Form.useForm();

  // フォームの変更監視
  const currentValues = Form.useWatch([], form) as any;

  const normalizeJson = (val: any) => {
    if (!val) return '';
    if (typeof val !== 'string') return JSON.stringify(val);
    try {
      return JSON.stringify(JSON.parse(val));
    } catch (e) {
      return val;
    }
  };

  const isChanged =
    board &&
    currentValues &&
    (currentValues.type !== board.type ||
      normalizeJson(currentValues.config) !== normalizeJson(board.config) ||
      normalizeJson(currentValues.state) !== normalizeJson(board.state));

  useEffect(() => {
    if (board) {
      form.setFieldsValue({
        type: board.type,
        config: JSON.stringify(board.config, null, 2),
        state: JSON.stringify(board.state, null, 2),
      });
    } else {
      form.setFieldsValue({
        type: 'GRID',
        config: '{}',
        state: '{}',
      });
    }
  }, [board?.id, form]);

  const onFinish = async (values: any) => {
    console.log('onFinish called with:', values);
    try {
      const parsedConfig = JSON.parse(values.config);
      const parsedState = JSON.parse(values.state);
      await upsertBoardMutation.mutateAsync({
        id: board?.id ?? null,
        contestId,
        type: values.type,
        config: parsedConfig,
        state: parsedState,
      });
      message.success('Board saved successfully');
      refetch();
    } catch (e: any) {
      console.error('Save failed:', e);
      if (e instanceof SyntaxError) {
        message.error('Invalid JSON format: ' + e.message);
      } else {
        message.error('Save failed: ' + e.message);
      }
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
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        onFinishFailed={(errorInfo) => {
          console.error('Form Validation Failed:', errorInfo);
          message.error('Please check the form inputs');
        }}
      >
        <Card
          title={board ? `Edit Board for ${board.contestName}(#${contestId})` : 'Create New Board'}
          extra={
            <Space>
              {board && (
                <Button onClick={handleRecalculate} loading={recalculateMutation.isPending}>
                  Recalculate
                </Button>
              )}
              <Button
                type="primary"
                onClick={() => form.submit()}
                loading={upsertBoardMutation.isPending}
                disabled={upsertBoardMutation.isPending || !isChanged}
              >
                {board ? 'Save Changes' : 'Create Board'}
              </Button>
            </Space>
          }
        >
          <Form.Item label="Board Type" name="type" rules={[{ required: true }]}>
            <Select
              style={{ width: '200px' }}
              options={[
                { label: 'GRID', value: 'GRID' },
                { label: 'HONEYCOMB', value: 'HONEYCOMB' },
                { label: 'CROSS_GRID', value: 'CROSS_GRID' },
              ]}
            />
          </Form.Item>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Form.Item label="Config (JSON)" name="config" rules={[{ required: true }]}>
              <Input.TextArea
                rows={20}
                style={{ fontFamily: 'monospace', fontSize: '12px' }}
                placeholder="{}"
              />
            </Form.Item>
            <Form.Item label="State (JSON)" name="state" rules={[{ required: true }]}>
              <Input.TextArea
                rows={20}
                style={{ fontFamily: 'monospace', fontSize: '12px' }}
                placeholder="{}"
              />
            </Form.Item>
          </div>
        </Card>
      </Form>
    </div>
  );
}

function ProblemSubList({ contestId }: { contestId: number }) {
  const router = useRouter();
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const { tableProps } = useTable({
    resource: 'problems',
    filters: {
      permanent: [{ field: 'contestId', operator: 'eq', value: contestId }],
    },
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
    filters: {
      permanent: [{ field: 'contestId', operator: 'eq', value: contestId }],
    },
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
