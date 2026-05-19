'use client';

import { useEffect } from 'react';

import { trpc } from '@/utils/trpc';
import { EyeOutlined } from '@ant-design/icons';
import { Edit, useForm } from '@refinedev/antd';
import { useParsed } from '@refinedev/core';
import { App, Button, Form, Input, Space } from 'antd';

export default function BoardEdit() {
  const { message } = App.useApp();
  const { formProps, saveButtonProps, form } = useForm({
    redirect: false,
  });
  const { id } = useParsed();
  const boardId = id ? Number(id) : undefined;

  // フォームの変更監視
  const currentValues = Form.useWatch([], form) as any;

  // URLのIDから直接ボードデータを取得
  const { data: board, refetch: refetchBoard } = trpc.adminGetBoard.useQuery(
    { id: boardId ?? 0 },
    { enabled: !!boardId }
  );

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
    (normalizeJson(currentValues.config) !== normalizeJson(board.config) ||
      normalizeJson(currentValues.state) !== normalizeJson(board.state));

  const boardIdStr = board?.id ? String(board.id) : undefined;

  useEffect(() => {
    if (board) {
      form.setFieldsValue({
        contestId: board.contestId,
        type: board.type,
        config:
          typeof board.config === 'string' ? board.config : JSON.stringify(board.config, null, 2),
        state: typeof board.state === 'string' ? board.state : JSON.stringify(board.state, null, 2),
      });
    }
  }, [boardIdStr, form, board]);

  const recalculateMutation = trpc.adminRecalculateBoard.useMutation();

  const handleRecalculate = async () => {
    if (!boardId) return;
    try {
      await recalculateMutation.mutateAsync({ boardId });
      message.success('Board recalculated successfully');
      refetchBoard();
    } catch (err: any) {
      message.error('Failed to recalculate: ' + err.message);
    }
  };

  return (
    <Edit
      saveButtonProps={{
        ...saveButtonProps,
        disabled: saveButtonProps.disabled || !isChanged,
        onClick: () => {
          form.submit();
        },
      }}
      headerButtons={({ defaultButtons }) => (
        <Space>
          {defaultButtons}
          {board?.contestId && (
            <Button
              icon={<EyeOutlined />}
              onClick={() => window.open(`/contest/${board.contestId}/board`, '_blank')}
            >
              View Public Board
            </Button>
          )}
          <Button onClick={handleRecalculate} loading={recalculateMutation.isPending}>
            Recalculate from Submissions
          </Button>
        </Space>
      )}
    >
      <Form
        {...formProps}
        form={form}
        layout="vertical"
        onFinish={(values: any) => {
          console.log('BoardEdit onFinish called with:', values);
          try {
            const config =
              typeof values.config === 'string' ? JSON.parse(values.config) : values.config;
            const state =
              typeof values.state === 'string' ? JSON.parse(values.state) : values.state;
            formProps.onFinish?.({ ...values, config, state });
          } catch (e: any) {
            console.error('JSON Parse Error:', e);
            message.error('Invalid JSON format: ' + e.message);
          }
        }}
        onFinishFailed={(errorInfo) => {
          console.error('BoardEdit Validation Failed:', errorInfo);
          message.error('Please check the form inputs');
        }}
      >
        <Form.Item name="contestId" hidden>
          <Input />
        </Form.Item>
        <Form.Item label="Contest">
          <Input value={board ? `${board.contestName}(#${board.contestId})` : ''} disabled />
        </Form.Item>
        <Form.Item label="Type" name="type">
          <Input disabled />
        </Form.Item>
        <Form.Item
          label="Config (JSON)"
          name="config"
          rules={[{ required: true }]}
          getValueProps={(value) => ({
            value: typeof value === 'string' ? value : JSON.stringify(value, null, 2),
          })}
        >
          <Input.TextArea rows={15} style={{ fontFamily: 'monospace' }} />
        </Form.Item>
        <Form.Item
          label="State (JSON)"
          name="state"
          rules={[{ required: true }]}
          getValueProps={(value) => ({
            value: typeof value === 'string' ? value : JSON.stringify(value, null, 2),
          })}
        >
          <Input.TextArea rows={15} style={{ fontFamily: 'monospace' }} />
        </Form.Item>
      </Form>
    </Edit>
  );
}
