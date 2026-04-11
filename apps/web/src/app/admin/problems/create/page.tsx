'use client';

import { useEffect } from 'react';

import { useSearchParams } from 'next/navigation';

import { Create, useForm, useSelect } from '@refinedev/antd';
import { Form, Input, Select } from 'antd';

export default function ProblemCreate() {
  const { formProps, saveButtonProps, form } = useForm();
  const searchParams = useSearchParams();
  const contestId = searchParams.get('contestId');

  const { selectProps: contestSelectProps } = useSelect({
    resource: 'contests',
    optionLabel: 'name',
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
        <Form.Item label="Title" name="title" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item label="Problem Statement" name="problemStatement" rules={[{ required: true }]}>
          <Input.TextArea rows={10} />
        </Form.Item>
      </Form>
    </Create>
  );
}
