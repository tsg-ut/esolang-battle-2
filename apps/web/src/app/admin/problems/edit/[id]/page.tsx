'use client';

import React, { useEffect, useState } from 'react';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { BulkDeleteButton } from '@/components/admin/BulkDeleteButton';
import { trpc } from '@/utils/trpc';
import { EyeOutlined } from '@ant-design/icons';
import { DeleteButton, Edit, EditButton, useForm, useSelect, useTable } from '@refinedev/antd';
import { useParsed } from '@refinedev/core';
import { Button, Form, Input, Select, Space, Table, Tabs, Tag, Transfer } from 'antd';

export default function ProblemEdit() {
  const { formProps, saveButtonProps, form } = useForm();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { id } = useParsed();
  const problemId = id ? Number(id) : undefined;

  // URLパラメータから現在のタブを取得 (デフォルトは "info")
  const activeTab = searchParams.get('tab') || 'info';

  const handleTabChange = (key: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', key);
    router.replace(`${pathname}?${params.toString()}`);
  };

  // URLのIDから直接問題データを取得（ボタン用および初期値ロード用）
  const { data: problem, refetch: refetchProblem } = trpc.adminGetProblem.useQuery(
    { id: problemId ?? 0 },
    { enabled: !!problemId }
  );

  // 初期値のロード: acceptedLanguages を languageIds に変換してフォームにセット
  useEffect(() => {
    if (problem?.acceptedLanguages) {
      form.setFieldsValue({
        languageIds: problem.acceptedLanguages.map((lang: any) => lang.id),
      });
    }
  }, [problem, form]);

  const { selectProps: contestSelectProps } = useSelect({
    resource: 'contests',
    optionLabel: (item) => `${item.name}(#${item.id})`,
    optionValue: 'id',
  });

  const { data: allLanguages } = trpc.adminGetLanguages.useQuery();

  return (
    <Edit
      saveButtonProps={saveButtonProps}
      headerButtons={({ defaultButtons }) => (
        <Space>
          {defaultButtons}
          {problem?.contestId && (
            <Button
              icon={<EyeOutlined />}
              onClick={() =>
                window.open(`/contest/${problem.contestId}/problem/${problem.id}`, '_blank')
              }
            >
              View on Site
            </Button>
          )}
        </Space>
      )}
    >
      <Form {...formProps} layout="vertical">
        <Tabs activeKey={activeTab} onChange={handleTabChange}>
          <Tabs.TabPane tab="Basic Information" key="info">
            <div style={{ padding: '16px 0' }}>
              <Form.Item label="ID" name="id">
                <Input disabled />
              </Form.Item>
              <Form.Item label="Contest" name="contestId" rules={[{ required: true }]}>
                <Select {...contestSelectProps} />
              </Form.Item>
              <Form.Item label="Title" name="title" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
              <Form.Item
                label="Problem Statement"
                name="problemStatement"
                rules={[{ required: true }]}
              >
                <Input.TextArea rows={15} />
              </Form.Item>
            </div>
          </Tabs.TabPane>

          <Tabs.TabPane tab="Submittable Languages" key="languages">
            <div style={{ padding: '16px 0' }}>
              <Form.Item
                label="Select accepted languages for this problem"
                name="languageIds"
                valuePropName="targetKeys"
                trigger="onChange"
              >
                <Transfer
                  dataSource={
                    allLanguages?.map((lang) => ({
                      key: lang.id,
                      title: lang.name,
                      description: lang.description,
                    })) || []
                  }
                  showSearch
                  listStyle={{
                    width: 300,
                    height: 400,
                  }}
                  render={(item) => item.title}
                  titles={['Available', 'Accepted']}
                />
              </Form.Item>
            </div>
          </Tabs.TabPane>

          <Tabs.TabPane tab="Test Cases" key="testcases">
            {problemId && <TestCasesSubList problemId={problemId} />}
          </Tabs.TabPane>
        </Tabs>
      </Form>
    </Edit>
  );
}

function TestCasesSubList({ problemId }: { problemId: number }) {
  const router = useRouter();
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const { tableProps } = useTable({
    resource: 'testcases',
    permanentFilter: [{ field: 'problemId', operator: 'eq', value: problemId }],
    pagination: { mode: 'off' },
  });

  return (
    <div style={{ padding: '16px 0' }}>
      <Space style={{ marginBottom: '16px' }}>
        <Button
          type="primary"
          onClick={() => router.push(`/admin/testcases/create?problemId=${problemId}`)}
        >
          Add Test Case
        </Button>
        <BulkDeleteButton
          resource="testcases"
          selectedKeys={selectedRowKeys}
          onSuccess={() => setSelectedRowKeys([])}
        />
      </Space>
      <Table
        {...tableProps}
        rowKey="id"
        rowSelection={{
          selectedRowKeys,
          onChange: (keys) => setSelectedRowKeys(keys),
        }}
      >
        <Table.Column dataIndex="id" title="ID" />
        <Table.Column
          dataIndex="isSample"
          title="Sample"
          render={(val) => <Tag color={val ? 'green' : 'blue'}>{val ? 'Yes' : 'No'}</Tag>}
        />
        <Table.Column
          dataIndex="input"
          title="Input"
          render={(val: string) => (
            <div
              style={{
                whiteSpace: 'pre-wrap',
                fontFamily: 'monospace',
                fontSize: '10px',
                maxHeight: '60px',
                overflow: 'auto',
              }}
            >
              {(val || '').slice(0, 100)}
              {(val || '').length > 100 ? '...' : ''}
            </div>
          )}
        />
        <Table.Column
          dataIndex="output"
          title="Output"
          render={(val: string) => (
            <div
              style={{
                whiteSpace: 'pre-wrap',
                fontFamily: 'monospace',
                fontSize: '10px',
                maxHeight: '60px',
                overflow: 'auto',
              }}
            >
              {(val || '').slice(0, 100)}
              {(val || '').length > 100 ? '...' : ''}
            </div>
          )}
        />
        <Table.Column
          title="Actions"
          render={(_, record: any) => (
            <Space>
              <EditButton hideText size="small" resource="testcases" recordItemId={record.id} />
              <DeleteButton hideText size="small" resource="testcases" recordItemId={record.id} />
            </Space>
          )}
        />
      </Table>
    </div>
  );
}
