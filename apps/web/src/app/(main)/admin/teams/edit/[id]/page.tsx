'use client';

import { trpc } from '@/utils/trpc';
import { Edit, useForm, useSelect } from '@refinedev/antd';
import { useParsed } from '@refinedev/core';
import { ColorPicker, Form, Input, Select } from 'antd';

export default function TeamEdit() {
  const { id } = useParsed();
  const teamId = id ? Number(id) : undefined;

  const { formProps, saveButtonProps, form } = useForm({
    redirect: false,
  });

  const { data: team } = trpc.adminGetTeam.useQuery({ id: teamId ?? 0 }, { enabled: !!teamId });

  const currentValues = Form.useWatch([], form) as any;
  const initialData = team;

  const isChanged =
    initialData &&
    currentValues &&
    (currentValues.name !== initialData.name ||
      currentValues.color !== initialData.color ||
      Number(currentValues.contestId) !== Number(initialData.contestId) ||
      JSON.stringify(currentValues.userIds) !== JSON.stringify(initialData.userIds));

  const { selectProps: contestSelectProps } = useSelect({
    resource: 'contests',
    optionLabel: (item) => `${(item as any).name}(#${(item as any).id})`,
    optionValue: 'id',
  });

  const { selectProps: userSelectProps } = useSelect({
    resource: 'users',
    optionLabel: (item) => `${(item as any).name || 'No Name'} (${(item as any).id})`,
    optionValue: 'id',
  });

  return (
    <Edit
      saveButtonProps={{ ...saveButtonProps, disabled: saveButtonProps.disabled || !isChanged }}
    >
      <Form {...formProps} layout="vertical">
        <Form.Item label="Contest" name="contestId" rules={[{ required: true }]}>
          <Select
            {...contestSelectProps}
            showSearch
            filterOption={(input, option) =>
              String(option?.label ?? '')
                .toLowerCase()
                .includes(input.toLowerCase())
            }
          />
        </Form.Item>
        <Form.Item label="Team Name" name="name" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item label="Members" name="userIds">
          <Select
            {...userSelectProps}
            mode="multiple"
            placeholder="Select users"
            showSearch
            filterOption={(input, option) =>
              String(option?.label ?? '')
                .toLowerCase()
                .includes(input.toLowerCase())
            }
          />
        </Form.Item>
        <Form.Item
          label="Color"
          name="color"
          rules={[{ required: true }]}
          getValueProps={(value) => ({ value: value || '#1677ff' })}
          trigger="onChange"
        >
          <ColorPicker
            showText
            format="hex"
            onChange={(_, hex) => {
              form.setFieldsValue({ color: hex });
            }}
          />
        </Form.Item>
      </Form>
    </Edit>
  );
}
