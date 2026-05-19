'use client';

import { useEffect, useState } from 'react';

import { useSearchParams } from 'next/navigation';

import { MarkdownRenderer } from '@/components/MarkdownRenderer';
import { Create, useForm, useSelect } from '@refinedev/antd';
import { Col, Form, Input, Row, Segmented, Select } from 'antd';

export default function ProblemCreate() {
  const { formProps, saveButtonProps, form } = useForm();
  const searchParams = useSearchParams();
  const contestId = searchParams.get('contestId');

  const [viewMode, setViewMode] = useState<'editor' | 'both' | 'preview'>('both');

  const problemStatement = Form.useWatch('problemStatement', form);

  const { selectProps: contestSelectProps } = useSelect({
    resource: 'contests',
    optionLabel: 'name',
    optionValue: 'id',
  });

  useEffect(() => {
    if (contestId) {
      form.setFieldsValue({ contestId: Number(contestId) });
    }
  }, [contestId, form]);

  return (
    <Create saveButtonProps={saveButtonProps}>
      <Form {...formProps} layout="vertical">
        <Form.Item label="Contest" name="contestId" rules={[{ required: true }]}>
          <Select {...contestSelectProps} disabled={!!contestId} />
        </Form.Item>
        <Form.Item label="Title" name="title" rules={[{ required: true }]}>
          <Input />
        </Form.Item>

        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
          <Segmented
            options={[
              { label: 'Editor', value: 'editor' },
              { label: 'Both', value: 'both' },
              { label: 'Preview', value: 'preview' },
            ]}
            value={viewMode}
            onChange={(value) => setViewMode(value as any)}
          />
        </div>

        <Row gutter={24}>
          <Col
            span={viewMode === 'both' ? 12 : 24}
            style={{ display: viewMode === 'preview' ? 'none' : 'block' }}
          >
            <Form.Item
              label="Problem Statement"
              name="problemStatement"
              rules={[{ required: true }]}
            >
              <Input.TextArea rows={20} />
            </Form.Item>
          </Col>
          <Col
            span={viewMode === 'both' ? 12 : 24}
            style={{ display: viewMode === 'editor' ? 'none' : 'block' }}
          >
            <div style={{ marginBottom: 8, fontWeight: 'bold' }}>Preview</div>
            <div
              style={{
                border: '1px solid #d9d9d9',
                borderRadius: 4,
                padding: '8px 16px',
                minHeight: '400px',
                height: viewMode === 'both' ? 'calc(100% - 32px)' : 'auto',
                overflow: 'auto',
                backgroundColor: '#fff',
              }}
            >
              <MarkdownRenderer content={problemStatement || ''} />
            </div>
          </Col>
        </Row>
      </Form>
    </Create>
  );
}
