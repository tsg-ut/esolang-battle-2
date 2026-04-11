'use client';

import { useEffect } from 'react';

import { useSearchParams } from 'next/navigation';

import { Create, useForm } from '@refinedev/antd';
import { Checkbox, Form, Input } from 'antd';

export default function TestCaseCreate() {
  const { formProps, saveButtonProps, form } = useForm();
  const searchParams = useSearchParams();
  const problemId = searchParams.get('problemId');

  useEffect(() => {
    if (problemId) {
      form.setFieldsValue({ problemId: Number(problemId) });
    }
  }, [problemId, form]);

  return (
    <Create saveButtonProps={saveButtonProps}>
      <Form {...formProps} layout="vertical">
        <Form.Item label="Problem ID" name="problemId" rules={[{ required: true }]}>
          <Input type="number" disabled={!!problemId} />
        </Form.Item>
        <Form.Item label="Input" name="input" rules={[{ required: true }]}>
          <Input.TextArea rows={5} style={{ fontFamily: 'monospace' }} />
        </Form.Item>
        <Form.Item label="Expected Output" name="output" rules={[{ required: true }]}>
          <Input.TextArea rows={5} style={{ fontFamily: 'monospace' }} />
        </Form.Item>
        <Form.Item name="isSample" valuePropName="checked">
          <Checkbox>Is Sample?</Checkbox>
        </Form.Item>
        <Form.Item label="Checker Script (Optional)" name="checkerScript">
          <Input.TextArea rows={3} placeholder="Python script for checking" />
        </Form.Item>
      </Form>
    </Create>
  );
}
