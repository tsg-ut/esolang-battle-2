'use client';

import React, { useState } from 'react';

import { BulkDeleteButton } from '@/components/admin/BulkDeleteButton';
import { EyeOutlined } from '@ant-design/icons';
import {
  DeleteButton,
  EditButton,
  FilterDropdown,
  List,
  useSelect,
  useTable,
} from '@refinedev/antd';
import { Button, Input, Select, Space, Table, Tooltip, Typography } from 'antd';

const { Text } = Typography;

export default function TeamList() {
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const { tableProps } = useTable({
    sorters: {
      initial: [{ field: 'id', order: 'asc' }],
    },
  });

  const { selectProps: contestSelectProps } = useSelect({
    resource: 'contests',
    optionLabel: (item) => `${(item as any).name}(#${(item as any).id})`,
    optionValue: 'id',
  });

  return (
    <List
      headerButtons={({ defaultButtons }) => (
        <Space>
          {defaultButtons}
          <BulkDeleteButton
            resource="teams"
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
          width={80}
          filterDropdown={(props) => (
            <FilterDropdown {...props}>
              <Input type="number" placeholder="Exact ID" />
            </FilterDropdown>
          )}
        />
        <Table.Column
          dataIndex="name"
          title="Name"
          sorter
          render={(val) => val || <span className="text-gray-400 italic">(Unnamed)</span>}
        />
        <Table.Column
          dataIndex="contestId"
          title="Contest"
          sorter
          render={(contestId, record: any) => `${record.contestName || 'Unknown'}(#${contestId})`}
          filterDropdown={(props) => (
            <FilterDropdown {...props}>
              <Select
                {...contestSelectProps}
                style={{ minWidth: 200 }}
                placeholder="Filter by contest"
              />
            </FilterDropdown>
          )}
        />
        <Table.Column
          dataIndex="color"
          title="Color"
          render={(val: string) => (
            <div className="flex items-center gap-2">
              <div
                className="h-4 w-4 rounded-full border border-gray-200"
                style={{ backgroundColor: val }}
              />
              <Text code>{val}</Text>
            </div>
          )}
        />
        <Table.Column
          title="Actions"
          dataIndex="actions"
          render={(_, record: any) => (
            <Space>
              <Tooltip title="View Public Board">
                <Button
                  size="small"
                  icon={<EyeOutlined />}
                  onClick={() => window.open(`/contest/${record.contestId}/board`, '_blank')}
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
