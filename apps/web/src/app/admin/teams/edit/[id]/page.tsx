'use client';

import { Edit, useForm, useSelect } from '@refinedev/antd';
import { Form, Input, Select } from 'antd';

export default function TeamEdit() {
  const { formProps, saveButtonProps } = useForm();
  const { selectProps: contestSelectProps } = useSelect({
    resource: 'contests',
    optionLabel: (item) => `${item.name}(#${item.id})`,
    optionValue: 'id',
  });

  return (
    <Edit saveButtonProps={saveButtonProps}>
      <Form {...formProps} layout="vertical">
        <Form.Item label="Contest" name="contestId" rules={[{ required: true }]}>
          <Select {...contestSelectProps} />
        </Form.Item>
        <Form.Item label="Color" name="color" rules={[{ required: true }]}>
          <Input placeholder="e.g. red, #ff0000" />
        </Form.Item>
      </Form>
    </Edit>
  );
}
