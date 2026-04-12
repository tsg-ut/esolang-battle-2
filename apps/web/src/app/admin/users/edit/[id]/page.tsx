'use client';

import React, { useEffect } from 'react';

import { trpc } from '@/utils/trpc';
import { Edit, useForm, useSelect } from '@refinedev/antd';
import { useParsed } from '@refinedev/core';
import { Checkbox, Form, Input, Select } from 'antd';

export default function UserEdit() {
  const { id } = useParsed();
  const userId = id ? Number(id) : undefined;

  const { formProps, saveButtonProps, form } = useForm({
    redirect: false,
  });

  const { data: user } = trpc.adminGetUser.useQuery({ id: userId ?? 0 }, { enabled: !!userId });

  const initialTeamId = user?.teams && user.teams.length > 0 ? user.teams[0].id : undefined;

  // 初期値のセット
  useEffect(() => {
    if (user) {
      form.setFieldsValue({
        name: user.name,
        isAdmin: user.isAdmin,
        teamId: initialTeamId,
      });
    }
  }, [user, initialTeamId, form]);

  const currentValues = Form.useWatch([], form) as any;

  const isChanged =
    user &&
    currentValues &&
    (currentValues.name !== user.name ||
      currentValues.isAdmin !== user.isAdmin ||
      Number(currentValues.teamId) !== Number(initialTeamId) ||
      !!currentValues.password); // パスワードが入力されていれば変更ありとみなす

  // For team selection
  const { selectProps: teamSelectProps } = useSelect({
    resource: 'teams',
    optionLabel: (item) =>
      `C#${(item as any).contestId}: ${(item as any).name || (item as any).color} (#${(item as any).id})`,
    optionValue: 'id',
  });

  return (
    <Edit
      saveButtonProps={{ ...saveButtonProps, disabled: saveButtonProps.disabled || !isChanged }}
    >
      <Form {...formProps} layout="vertical">
        <Form.Item label="ID" name="id">
          <Input disabled />
        </Form.Item>
        <Form.Item
          label="Name"
          name="name"
          rules={[{ required: true, message: 'Please input username' }]}
        >
          <Input />
        </Form.Item>
        <Form.Item label="Password (leave blank to keep current)" name="password">
          <Input.Password placeholder="Enter new password to reset" />
        </Form.Item>
        <Form.Item label="Is Admin" name="isAdmin" valuePropName="checked">
          <Checkbox>Grant administrator privileges</Checkbox>
        </Form.Item>
        <Form.Item label="Teams (Main Team)" name="teamId">
          <Select {...teamSelectProps} placeholder="Select a team to add/update" allowClear />
        </Form.Item>
      </Form>
    </Edit>
  );
}
