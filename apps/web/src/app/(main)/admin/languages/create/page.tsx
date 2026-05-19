'use client';

import { Create, useForm } from '@refinedev/antd';
import { Form, Input } from 'antd';

export default function LanguageCreate() {
  const { formProps, saveButtonProps } = useForm();

  return (
    <Create saveButtonProps={saveButtonProps}>
      <Form {...formProps} layout="vertical">
        <Form.Item label="Name" name="name" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item label="Description" name="description" rules={[{ required: true }]}>
          <Input.TextArea rows={2} />
        </Form.Item>
        <Form.Item label="Docker Image ID" name="dockerImageId" rules={[{ required: true }]}>
          <Input placeholder="e.g. esolang/brainfuck" />
        </Form.Item>
      </Form>
    </Create>
  );
}
