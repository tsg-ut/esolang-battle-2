'use client';

import React, { useState } from 'react';

import { BulkDeleteButton } from '@/components/admin/BulkDeleteButton';
import { StringFilterDropdown } from '@/components/admin/StringFilterDropdown';
import { DeleteButton, EditButton, FilterDropdown, List, useTable } from '@refinedev/antd';
import { Input, Space, Table } from 'antd';

export default function LanguageList() {
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const { tableProps } = useTable({
    sorters: {
      initial: [{ field: 'id', order: 'asc' }],
    },
  });

  return (
    <List
      headerButtons={({ defaultButtons }) => (
        <Space>
          {defaultButtons}
          <BulkDeleteButton
            resource="languages"
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
          dataIndex="name"
          title="Name"
          sorter
          filterDropdown={(props) => (
            <StringFilterDropdown {...props} placeholder="Search language" />
          )}
        />
        <Table.Column
          dataIndex="dockerImageId"
          title="Docker Image"
          filterDropdown={(props) => (
            <StringFilterDropdown {...props} placeholder="Search image ID" />
          )}
        />
        <Table.Column
          title="Actions"
          dataIndex="actions"
          render={(_, record: any) => (
            <Space>
              <EditButton hideText size="small" recordItemId={record.id} />
              <DeleteButton hideText size="small" recordItemId={record.id} />
            </Space>
          )}
        />
      </Table>
    </List>
  );
}
