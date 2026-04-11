'use client';

import { Create, useForm } from '@refinedev/antd';
import { DatePicker, Form, Input } from 'antd';
import dayjs from 'dayjs';

export default function ContestCreate() {
  const { formProps, saveButtonProps } = useForm();

  return (
    <Create saveButtonProps={saveButtonProps}>
      <Form {...formProps} layout="vertical">
        <Form.Item label="Name" name="name" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item
          label="Start At"
          name="startAt"
          rules={[{ required: true }]}
          getValueProps={(value) => ({ value: value ? dayjs(value) : undefined })}
        >
          <DatePicker showTime />
        </Form.Item>
        <Form.Item
          label="End At"
          name="endAt"
          rules={[{ required: true }]}
          getValueProps={(value) => ({ value: value ? dayjs(value) : undefined })}
        >
          <DatePicker showTime />
        </Form.Item>
      </Form>
    </Create>
  );
}
