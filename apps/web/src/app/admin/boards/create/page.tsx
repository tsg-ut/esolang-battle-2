'use client';

import { useEffect } from 'react';

import { useSearchParams } from 'next/navigation';

import { Create, useForm } from '@refinedev/antd';
import { Form, Input, Select, message } from 'antd';

export default function BoardCreate() {
  const { formProps, saveButtonProps, form } = useForm();
  const searchParams = useSearchParams();
  const contestId = searchParams.get('contestId');

  useEffect(() => {
    if (contestId) {
      form.setFieldsValue({
        contestId: Number(contestId),
        type: 'GRID',
        config: JSON.stringify({ width: 5, height: 5, mapping: {}, cellInfo: {} }, null, 2),
        state: JSON.stringify({}, null, 2),
      });
    }
  }, [contestId, form]);

  return (
    <Create saveButtonProps={saveButtonProps}>
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
        <Form.Item label="Contest ID" name="contestId" rules={[{ required: true }]}>
          <Input type="number" disabled={!!contestId} />
        </Form.Item>
        <Form.Item label="Type" name="type" rules={[{ required: true }]}>
          <Select
            options={[
              { label: 'GRID', value: 'GRID' },
              { label: 'HONEYCOMB', value: 'HONEYCOMB' },
              { label: 'CROSS_GRID', value: 'CROSS_GRID' },
            ]}
          />
        </Form.Item>
        <Form.Item label="Config (JSON)" name="config" rules={[{ required: true }]}>
          <Input.TextArea rows={10} style={{ fontFamily: 'monospace' }} />
        </Form.Item>
        <Form.Item label="State (JSON)" name="state" rules={[{ required: true }]}>
          <Input.TextArea rows={5} style={{ fontFamily: 'monospace' }} />
        </Form.Item>
      </Form>
    </Create>
  );
}
