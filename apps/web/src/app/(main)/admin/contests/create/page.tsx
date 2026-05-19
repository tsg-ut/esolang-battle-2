'use client';

import { Create, useForm } from '@refinedev/antd';
import { Checkbox, DatePicker, Form, Input, Select } from 'antd';
import dayjs from 'dayjs';

export default function ContestCreate() {
  const { formProps, saveButtonProps } = useForm({
    defaultFormValues: {
      isPublic: true,
      scoreOrder: 'DESC',
    },
  });

  return (
    <Create saveButtonProps={saveButtonProps}>
      <Form {...formProps} layout="vertical">
        <Form.Item label="Name" name="name" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <Form.Item
            label="Start At"
            name="startAt"
            rules={[{ required: true }]}
            getValueProps={(value) => ({ value: value ? dayjs(value) : undefined })}
          >
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            label="End At"
            name="endAt"
            rules={[{ required: true }]}
            getValueProps={(value) => ({ value: value ? dayjs(value) : undefined })}
          >
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <Form.Item label="Score Standing Order" name="scoreOrder" rules={[{ required: true }]}>
            <Select
              options={[
                { label: 'Descending (Higher is better - Battle)', value: 'DESC' },
                { label: 'Ascending (Lower is better - Golf)', value: 'ASC' },
              ]}
            />
          </Form.Item>
          <Form.Item name="isPublic" valuePropName="checked" style={{ marginTop: '32px' }}>
            <Checkbox>Public Visibility (visible on home page)</Checkbox>
          </Form.Item>
        </div>
      </Form>
    </Create>
  );
}
