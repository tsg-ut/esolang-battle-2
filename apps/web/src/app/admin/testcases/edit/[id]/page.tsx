'use client';

import React from 'react';

import { trpc } from '@/utils/trpc';
import { Edit, useForm, useSelect } from '@refinedev/antd';
import { useParsed } from '@refinedev/core';
import { Checkbox, Form, Input, Select } from 'antd';

export default function TestCaseEdit() {
  const { id } = useParsed();
  const testCaseId = id ? Number(id) : undefined;

  const { formProps, saveButtonProps, form } = useForm({
    redirect: false,
  });

  const { data: testCase } = trpc.adminGetTestCase.useQuery(
    { id: testCaseId ?? 0 },
    { enabled: !!testCaseId }
  );

  const { data: allLanguages } = trpc.adminGetLanguages.useQuery();

  const currentValues = Form.useWatch([], form);

  const isChanged =
    testCase &&
    currentValues &&
    (currentValues.input !== testCase.input ||
      currentValues.output !== testCase.output ||
      currentValues.isSample !== testCase.isSample ||
      currentValues.checkerScript !== (testCase.checkerScript ?? undefined) ||
      Number(currentValues.checkerLanguageId || 0) !== Number(testCase.checkerLanguageId || 0) ||
      currentValues.checkerScript !== testCase.checkerScript);

  const { selectProps: problemSelectProps } = useSelect({
    resource: 'problems',
    optionLabel: (item) => `${item.title} (#${item.id})`,
    optionValue: 'id',
  });

  return (
    <Edit
      saveButtonProps={{ ...saveButtonProps, disabled: saveButtonProps.disabled || !isChanged }}
    >
      <Form {...formProps} layout="vertical">
        <Form.Item label="Problem" name="problemId" rules={[{ required: true }]}>
          <Select {...problemSelectProps} disabled />
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
          <h3>Custom Checker (Overrides Problem Checker)</h3>
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
    </Edit>
  );
}
