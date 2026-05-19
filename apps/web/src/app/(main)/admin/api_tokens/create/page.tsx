'use client';

import { Create, useForm, useSelect } from '@refinedev/antd';
import { DatePicker, Form, Input, Select } from 'antd';

export default function ApiTokenCreate() {
  const { formProps, saveButtonProps } = useForm();

  const { selectProps: userSelectProps } = useSelect({
    resource: 'users',
    optionLabel: 'name',
    optionValue: 'id',
  });

  return (
    <Create saveButtonProps={saveButtonProps}>
      <Form {...formProps} layout="vertical">
        <Form.Item
          label="User"
          name="userId"
          rules={[{ required: true, message: 'Please select a user' }]}
        >
          <Select {...userSelectProps} placeholder="Select user for this token" />
        </Form.Item>
        <Form.Item
          label="Token Name"
          name="name"
          rules={[{ required: true, message: 'Please input token name' }]}
        >
          <Input placeholder="e.g. My External App" />
        </Form.Item>
        <Form.Item label="Expires At" name="expiresAt">
          <DatePicker
            showTime
            style={{ width: '100%' }}
            placeholder="Select expiration date (optional)"
          />
        </Form.Item>
      </Form>
    </Create>
  );
}
