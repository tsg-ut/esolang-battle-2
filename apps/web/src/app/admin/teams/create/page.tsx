'use client';

import { useEffect } from 'react';

import { useSearchParams } from 'next/navigation';

import { Create, useForm, useSelect } from '@refinedev/antd';
import { ColorPicker, Form, Input, Select } from 'antd';

export default function TeamCreate() {
  const [form] = Form.useForm();
  const { formProps, saveButtonProps } = useForm({
    form,
  });
  const searchParams = useSearchParams();
  const contestId = searchParams.get('contestId');

  const { selectProps: contestSelectProps } = useSelect({
    resource: 'contests',
    optionLabel: (item) => `${item.name}(#${item.id})`,
    optionValue: 'id',
  });

  useEffect(() => {
    if (contestId) {
      form.setFieldsValue({ contestId: Number(contestId) });
    }
  }, [contestId, form]);

  return (
    <Create saveButtonProps={saveButtonProps}>
      <Form {...formProps} form={form} layout="vertical" initialValues={{ color: '#1677ff' }}>
        <Form.Item label="Contest" name="contestId" rules={[{ required: true }]}>
          <Select {...contestSelectProps} disabled={!!contestId} />
        </Form.Item>
        <Form.Item label="Team Name" name="name" rules={[{ required: true }]}>
          <Input placeholder="e.g. Team Blue" />
        </Form.Item>
        <Form.Item label="Color" name="color" rules={[{ required: true }]} trigger="onChange">
          <ColorPicker
            showText
            format="hex"
            onChange={(_, hex) => {
              form.setFieldsValue({ color: hex });
            }}
          />
        </Form.Item>
      </Form>
    </Create>
  );
}
