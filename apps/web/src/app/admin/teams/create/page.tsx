'use client';

import { useEffect } from 'react';

import { useSearchParams } from 'next/navigation';

import { Create, useForm, useSelect } from '@refinedev/antd';
import { Form, Input, Select } from 'antd';

export default function TeamCreate() {
  const { formProps, saveButtonProps, form } = useForm();
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
      <Form {...formProps} layout="vertical">
        <Form.Item label="Contest" name="contestId" rules={[{ required: true }]}>
          <Select {...contestSelectProps} disabled={!!contestId} />
        </Form.Item>
        <Form.Item label="Color" name="color" rules={[{ required: true }]}>
          <Input placeholder="e.g. red, #ff0000" />
        </Form.Item>
      </Form>
    </Create>
  );
}
