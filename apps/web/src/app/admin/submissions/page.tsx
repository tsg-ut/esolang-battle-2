'use client';

import React, { useMemo, useState } from 'react';

import { trpc } from '@/utils/trpc';
import { DeleteOutlined, EditOutlined, EyeOutlined, ReloadOutlined } from '@ant-design/icons';
import { List, useTable } from '@refinedev/antd';
import { useInvalidate } from '@refinedev/core';
import {
  App,
  Button,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import dayjs from 'dayjs';

const { Text } = Typography;

export default function SubmissionList() {
  const { message } = App.useApp();
  const invalidate = useInvalidate();
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const { tableProps } = useTable({
    resource: 'submissions',
    pagination: { pageSize: 50 },
    sorters: { initial: [{ field: 'id', order: 'desc' }] },
  });

  const { data: languages } = trpc.getLanguages.useQuery();
  const { data: problems } = trpc.adminGetProblems.useQuery();
  const { data: users } = trpc.adminGetUsers.useQuery();

  const updateMutation = trpc.adminUpdateSubmission.useMutation();
  const deleteMutation = trpc.adminDeleteSubmission.useMutation();
  const deleteManyMutation = trpc.adminDeleteSubmissions.useMutation();
  const rejudgeMutation = trpc.adminRejudgeSubmissions.useMutation();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingSubmission, setEditingSubmission] = useState<any>(null);
  const [editForm] = Form.useForm();

  const watchedCode = Form.useWatch('code', editForm) || '';

  // フィルタ用データの準備
  const contestFilters = useMemo(() => {
    const contests = Array.from(
      new Set(tableProps.dataSource?.map((s: any) => s.contestName))
    ).filter(Boolean);
    return contests.map((name) => ({ text: name, value: name }));
  }, [tableProps.dataSource]);

  const problemFilters = useMemo(() => {
    const ps = Array.from(new Set(tableProps.dataSource?.map((s: any) => s.problemTitle))).filter(
      Boolean
    );
    return ps.map((title) => ({ text: title, value: title }));
  }, [tableProps.dataSource]);

  const langFilters = useMemo(() => {
    return languages?.map((l) => ({ text: l.name, value: l.name })) || [];
  }, [languages]);

  const userFilters = useMemo(() => {
    return users?.map((u) => ({ text: u.name, value: u.name })) || [];
  }, [users]);

  const handleEdit = (record: any) => {
    setEditingSubmission(record);
    editForm.setFieldsValue({
      problemId: record.problem?.id || record.problemId,
      languageId: record.language?.id || record.languageId,
      userId: record.userId,
      submittedAt: dayjs(record.submittedAt),
      status: record.status,
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
        submittedAt: values.submittedAt.toDate(),
        score: values.score === null ? null : Number(values.score),
      });
      message.success('Submission updated');
      setIsEditModalOpen(false);
      invalidate({ resource: 'submissions', invalidates: ['list', 'detail'] });
    } catch (e: any) {
      message.error('Update failed: ' + e.message);
    }
  };

  const handleDeleteMany = async () => {
    const ids = selectedRowKeys as number[];
    try {
      await deleteManyMutation.mutateAsync({ ids });
      message.success(`${ids.length} submissions and related executions deleted`);
      setSelectedRowKeys([]);
      invalidate({ resource: 'submissions', invalidates: ['list'] });
    } catch (e: any) {
      message.error('Delete failed: ' + e.message);
    }
  };

  const handleRejudge = async (ids: number[]) => {
    try {
      await rejudgeMutation.mutateAsync({ ids });
      message.success(`Rejudging ${ids.length} submission(s)...`);
      if (ids.length > 1) setSelectedRowKeys([]);
      invalidate({ resource: 'submissions', invalidates: ['list'] });
    } catch (e: any) {
      message.error('Rejudge failed: ' + e.message);
    }
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      sorter: true,
      width: 80,
    },
    {
      title: 'Contest',
      dataIndex: 'contestName',
      key: 'contestName',
      filters: contestFilters,
      onFilter: (value: any, record: any) => record.contestName === value,
      filterSearch: true,
    },
    {
      title: 'Problem',
      dataIndex: 'problemTitle',
      key: 'problemTitle',
      filters: problemFilters,
      onFilter: (value: any, record: any) => record.problemTitle === value,
      filterSearch: true,
    },
    {
      title: 'User',
      dataIndex: 'userName',
      key: 'userName',
      filters: userFilters,
      onFilter: (value: any, record: any) => record.userName === value,
      filterSearch: true,
    },
    {
      title: 'Lang',
      dataIndex: 'languageName',
      key: 'languageName',
      filters: langFilters,
      onFilter: (value: any, record: any) => record.languageName === value,
      filterSearch: true,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      filters: [
        { text: 'AC', value: 'AC' },
        { text: 'WA', value: 'WA' },
        { text: 'TLE', value: 'TLE' },
        { text: 'RE', value: 'RE' },
        { text: 'WJ', value: 'WJ' },
      ],
      onFilter: (value: any, record: any) => record.status === value,
      render: (status: string) => {
        const colorMap: any = {
          AC: 'success',
          WA: 'warning',
          TLE: 'warning',
          RE: 'error',
          WJ: 'default',
        };
        return <Tag color={colorMap[status] || 'default'}>{status}</Tag>;
      },
    },
    {
      title: 'Score',
      dataIndex: 'score',
      key: 'score',
      sorter: (a: any, b: any) => (a.score || 0) - (b.score || 0),
      render: (score: number | null) =>
        score !== null ? <span className="font-bold">{score}</span> : '-',
    },
    {
      title: 'Len',
      dataIndex: 'codeLength',
      key: 'codeLength',
      sorter: (a: any, b: any) => a.codeLength - b.codeLength,
      render: (len: number) => `${len} B`,
    },
    {
      title: 'Time',
      dataIndex: 'submittedAt',
      key: 'submittedAt',
      render: (date: any) => dayjs(date).format('MM/DD HH:mm'),
      sorter: true,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: any) => (
        <Space>
          <Tooltip title="View Public Page">
            <Button
              size="small"
              icon={<EyeOutlined />}
              onClick={() =>
                window.open(`/contest/${record.problemId}/submissions/${record.id}`, '_blank')
              }
            />
          </Tooltip>
          <Tooltip title="Rejudge">
            <Button
              size="small"
              icon={<ReloadOutlined />}
              onClick={() => handleRejudge([record.id])}
              loading={
                rejudgeMutation.isPending && rejudgeMutation.variables?.ids.includes(record.id)
              }
            />
          </Tooltip>
          <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          <Popconfirm
            title="Delete?"
            description="Related executions will be deleted."
            onConfirm={() => {
              setSelectedRowKeys([record.id]);
              handleDeleteMany();
            }}
          >
            <Button
              size="small"
              danger
              icon={<DeleteOutlined />}
              loading={deleteManyMutation.isPending && selectedRowKeys.includes(record.id)}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <List
      headerButtons={
        <Space wrap>
          <Button
            icon={<ReloadOutlined />}
            disabled={selectedRowKeys.length === 0}
            onClick={() => handleRejudge(selectedRowKeys as number[])}
            loading={rejudgeMutation.isPending}
          >
            Rejudge {selectedRowKeys.length > 0 ? `(${selectedRowKeys.length})` : ''}
          </Button>

          <Popconfirm
            title={`Delete ${selectedRowKeys.length} submissions?`}
            description="This will also delete all related execution records. This action cannot be undone."
            onConfirm={handleDeleteMany}
            disabled={selectedRowKeys.length === 0}
            okButtonProps={{ danger: true }}
          >
            <Button
              danger
              icon={<DeleteOutlined />}
              disabled={selectedRowKeys.length === 0}
              loading={deleteManyMutation.isPending}
            >
              Delete {selectedRowKeys.length > 0 ? `(${selectedRowKeys.length})` : ''}
            </Button>
          </Popconfirm>
        </Space>
      }
    >
      <div style={{ marginBottom: 16 }}>
        <Text type="secondary">{selectedRowKeys.length} items selected</Text>
      </div>
      <Table
        {...tableProps}
        rowKey="id"
        columns={columns}
        size="small"
        rowSelection={{
          selectedRowKeys,
          onChange: (keys) => setSelectedRowKeys(keys),
          selections: [Table.SELECTION_ALL, Table.SELECTION_INVERT, Table.SELECTION_NONE],
        }}
      />

      <Modal
        title={`Edit Submission #${editingSubmission?.id}`}
        open={isEditModalOpen}
        onOk={() => editForm.submit()}
        onCancel={() => setIsEditModalOpen(false)}
        width={1000}
        confirmLoading={updateMutation.isPending}
      >
        <Form form={editForm} layout="vertical" onFinish={handleUpdate}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
            <Form.Item label="Contest / Problem" name="problemId" rules={[{ required: true }]}>
              <Select
                showSearch
                optionFilterProp="label"
                options={problems?.map((p) => ({
                  label: `${p.contestName} > ${p.title}`,
                  value: p.id,
                }))}
              />
            </Form.Item>
            <Form.Item label="Language" name="languageId" rules={[{ required: true }]}>
              <Select options={languages?.map((l) => ({ label: l.name, value: l.id }))} />
            </Form.Item>
            <Form.Item label="User" name="userId" rules={[{ required: true }]}>
              <Select
                showSearch
                optionFilterProp="label"
                options={users?.map((u) => ({ label: u.name, value: u.id }))}
              />
            </Form.Item>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
            <Form.Item label="Submitted At" name="submittedAt" rules={[{ required: true }]}>
              <DatePicker showTime style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label="Status" name="status" rules={[{ required: true }]}>
              <Select
                options={['AC', 'WA', 'TLE', 'RE', 'WJ'].map((s) => ({ label: s, value: s }))}
              />
            </Form.Item>
            <Form.Item label="Score" name="score">
              <InputNumber style={{ width: '100%' }} placeholder="Score" />
            </Form.Item>
          </div>

          <div style={{ marginBottom: '8px' }}>
            <Text type="secondary">
              Current Code Length: <b>{watchedCode.length} bytes</b>
            </Text>
          </div>
          <Form.Item label="Source Code" name="code" rules={[{ required: true }]}>
            <Input.TextArea rows={20} style={{ fontFamily: 'monospace' }} />
          </Form.Item>
        </Form>
      </Modal>
    </List>
  );
}
