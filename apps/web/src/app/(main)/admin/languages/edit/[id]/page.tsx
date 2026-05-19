'use client';

import { trpc } from '@/utils/trpc';
import { Edit, useForm } from '@refinedev/antd';
import { useParsed } from '@refinedev/core';
import { Form, Input } from 'antd';

export default function LanguageEdit() {
  const { id } = useParsed();
  const languageId = id ? Number(id) : undefined;

  const { formProps, saveButtonProps, form } = useForm({
    redirect: false,
  });

  const { data: language } = trpc.adminGetLanguage.useQuery(
    { id: languageId ?? 0 },
    { enabled: !!languageId }
  );

  const currentValues = Form.useWatch([], form) as any;

  const isChanged =
    language &&
    currentValues &&
    (currentValues.name !== language.name ||
      currentValues.description !== language.description ||
      currentValues.dockerImageId !== language.dockerImageId);

  return (
    <Edit
      saveButtonProps={{ ...saveButtonProps, disabled: saveButtonProps.disabled || !isChanged }}
    >
      <Form {...formProps} layout="vertical">
        <Form.Item label="Name" name="name" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item label="Description" name="description" rules={[{ required: true }]}>
          <Input.TextArea rows={2} />
        </Form.Item>
        <Form.Item label="Docker Image ID" name="dockerImageId" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
      </Form>
    </Edit>
  );
}
