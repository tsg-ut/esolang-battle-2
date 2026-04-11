'use client';

import { Edit, useForm, useSelect } from '@refinedev/antd';
import { Checkbox, Form, Input, Select } from 'antd';

export default function UserEdit() {
  const { formProps, saveButtonProps } = useForm();

  // For team selection
  const { selectProps: teamSelectProps } = useSelect({
    resource: 'teams',
    optionLabel: (item) => `C#${item.contestId}: ${item.color} (#${item.id})`,
    optionValue: 'id',
  });

  return (
    <Edit saveButtonProps={saveButtonProps}>
      <Form {...formProps} layout="vertical">
        <Form.Item label="Name" name="name">
          <Input disabled />
        </Form.Item>
        <Form.Item label="Is Admin" name="isAdmin" valuePropName="checked">
          <Checkbox disabled />
        </Form.Item>
        <Form.Item label="Teams" name="teamId">
          <Select {...teamSelectProps} placeholder="Select a team to add/update" allowClear />
        </Form.Item>
        <p style={{ fontSize: '12px', color: '#666' }}>
          Note: Currently updating a user only supports setting/changing their team via this form.
        </p>
      </Form>
    </Edit>
  );
}
