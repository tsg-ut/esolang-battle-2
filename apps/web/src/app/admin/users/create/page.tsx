'use client';

import { Create, useForm, useSelect } from '@refinedev/antd';
import { Checkbox, Form, Input, Select } from 'antd';

export default function UserCreate() {
  const { formProps, saveButtonProps } = useForm();

  // For team selection
  const { selectProps: teamSelectProps } = useSelect({
    resource: 'teams',
    optionLabel: (item) => `C#${item.contestId}: ${item.name || item.color} (#${item.id})`,
    optionValue: 'id',
  });

  return (
    <Create saveButtonProps={saveButtonProps}>
      <Form {...formProps} layout="vertical">
        <Form.Item
          label="Name"
          name="name"
          rules={[{ required: true, message: 'Please input username' }]}
        >
          <Input placeholder="Enter username" />
        </Form.Item>
        <Form.Item
          label="Password"
          name="password"
          rules={[{ required: true, message: 'Please input password' }]}
        >
          <Input.Password placeholder="Enter initial password" />
        </Form.Item>
        <Form.Item label="Is Admin" name="isAdmin" valuePropName="checked">
          <Checkbox>Grant administrator privileges</Checkbox>
        </Form.Item>
        <Form.Item label="Initial Team" name="teamId">
          <Select {...teamSelectProps} placeholder="Select an optional initial team" allowClear />
        </Form.Item>
      </Form>
    </Create>
  );
}
