'use client';

import { trpc } from '@/utils/trpc';
import { EyeOutlined } from '@ant-design/icons';
import { Edit, useForm } from '@refinedev/antd';
import { useParsed } from '@refinedev/core';
import { Button, Form, Input, Space, message } from 'antd';

export default function BoardEdit() {
  const { formProps, saveButtonProps } = useForm();
  const { id } = useParsed();
  const boardId = id ? Number(id) : undefined;

  // URLのIDから直接ボードデータを取得（queryResultの不具合回避）
  const { data: board, refetch: refetchBoard } = trpc.adminGetBoard.useQuery(
    { id: boardId ?? 0 },
    { enabled: !!boardId }
  );

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
      saveButtonProps={saveButtonProps}
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
        layout="vertical"
        onFinish={(values) => {
          try {
            const config = JSON.parse(values.config);
            const state = JSON.parse(values.state);
            formProps.onFinish?.({ ...values, config, state });
          } catch (e) {
            message.error('Invalid JSON');
          }
        }}
      >
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
          getValueProps={(value) => ({ value: JSON.stringify(value, null, 2) })}
        >
          <Input.TextArea rows={15} style={{ fontFamily: 'monospace' }} />
        </Form.Item>
        <Form.Item
          label="State (JSON)"
          name="state"
          rules={[{ required: true }]}
          getValueProps={(value) => ({ value: JSON.stringify(value, null, 2) })}
        >
          <Input.TextArea rows={15} style={{ fontFamily: 'monospace' }} />
        </Form.Item>
      </Form>
    </Edit>
  );
}
