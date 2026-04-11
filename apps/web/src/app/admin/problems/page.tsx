'use client';

import React, { useState } from 'react';

import { BulkDeleteButton } from '@/components/admin/BulkDeleteButton';
import { StringFilterDropdown } from '@/components/admin/StringFilterDropdown';
import { EyeOutlined } from '@ant-design/icons';
import {
  DeleteButton,
  EditButton,
  FilterDropdown,
  List,
  useSelect,
  useTable,
} from '@refinedev/antd';
import { Button, Input, Select, Space, Table, Tooltip } from 'antd';

export default function ProblemList() {
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const { tableProps } = useTable({
    sorters: {
      initial: [{ field: 'id', order: 'desc' }],
    },
  });

  const { selectProps: contestSelectProps } = useSelect({
    resource: 'contests',
    optionLabel: (item) => `${item.name}(#${item.id})`,
    optionValue: 'id',
  });

  return (
    <List
      headerButtons={({ defaultButtons }) => (
        <Space>
          {defaultButtons}
          <BulkDeleteButton
            resource="problems"
            selectedKeys={selectedRowKeys}
            onSuccess={() => setSelectedRowKeys([])}
          />
        </Space>
      )}
    >
      <Table
        {...tableProps}
        rowKey="id"
        rowSelection={{
          selectedRowKeys,
          onChange: (keys) => setSelectedRowKeys(keys),
        }}
      >
        <Table.Column
          dataIndex="id"
          title="ID"
          sorter
          filterDropdown={(props) => (
            <FilterDropdown {...props}>
              <Input type="number" placeholder="Exact ID" />
            </FilterDropdown>
          )}
        />
        <Table.Column
          dataIndex="contestId"
          title="Contest"
          sorter
          render={(contestId, record: any) => `${record.contestName || 'Unknown'}(#${contestId})`}
          filterDropdown={(props) => (
            <FilterDropdown
              {...props}
              mapWithFormData={(formData) => ({
                field: 'contestId',
                operator: 'eq',
                value: formData.contestId,
              })}
            >
              <Select
                {...contestSelectProps}
                style={{ minWidth: 200 }}
                placeholder="Filter by contest"
              />
            </FilterDropdown>
          )}
        />
        <Table.Column
          dataIndex="title"
          title="Title"
          sorter
          filterDropdown={(props) => <StringFilterDropdown {...props} placeholder="Search title" />}
        />
        <Table.Column
          title="Actions"
          dataIndex="actions"
          render={(_, record: any) => (
            <Space>
              <Tooltip title="View on Site">
                <Button
                  size="small"
                  icon={<EyeOutlined />}
                  onClick={() => window.open(`/contest/${record.contestId}/problem`, '_blank')}
                />
              </Tooltip>
              <EditButton hideText size="small" recordItemId={record.id} />
              <DeleteButton hideText size="small" recordItemId={record.id} />
            </Space>
          )}
        />
      </Table>
    </List>
  );
}
