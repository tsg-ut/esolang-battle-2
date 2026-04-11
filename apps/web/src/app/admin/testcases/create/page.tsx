'use client';

import { Suspense } from 'react';

import { useSearchParams } from 'next/navigation';

import { trpc } from '@/utils/trpc';
import { Create, useForm, useSelect } from '@refinedev/antd';
import { Checkbox, Form, Input, Select } from 'antd';

function TestCaseCreateForm() {
  const searchParams = useSearchParams();
  const problemIdParam = searchParams.get('problemId');

  const { formProps, saveButtonProps } = useForm();

  const { selectProps: problemSelectProps } = useSelect({
    resource: 'problems',
    optionLabel: (item) => `${item.title} (#${item.id})`,
    optionValue: 'id',
    defaultValue: problemIdParam ? Number(problemIdParam) : undefined,
  });

  const { data: allLanguages } = trpc.adminGetLanguages.useQuery();

  return (
    <Create saveButtonProps={saveButtonProps}>
      <Form
        {...formProps}
        layout="vertical"
        initialValues={{
          problemId: problemIdParam ? Number(problemIdParam) : undefined,
          isSample: false,
        }}
      >
        <Form.Item label="Problem" name="problemId" rules={[{ required: true }]}>
          <Select {...problemSelectProps} />
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

        <div style={{ marginTop: '24px', borderTop: '1px solid #f0f0f0', paddingTop: '24px' }}>
          <h3>Custom Checker (Optional)</h3>
          <Form.Item label="Checker Language" name="checkerLanguageId">
            <Select
              options={allLanguages?.map((l) => ({ label: l.name, value: l.id }))}
              placeholder="Select language if using custom checker for this case"
              allowClear
            />
          </Form.Item>
          <Form.Item label="Checker Script" name="checkerScript">
            <Input.TextArea
              rows={10}
              style={{ fontFamily: 'monospace' }}
              placeholder="Script that returns CaseCheckerOutput JSON"
            />
          </Form.Item>
        </div>
      </Form>
    </Create>
  );
}

export default function TestCaseCreate() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TestCaseCreateForm />
    </Suspense>
  );
}
