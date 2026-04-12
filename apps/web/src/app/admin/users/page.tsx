'use client';

import React, { useState } from 'react';

import { BulkDeleteButton } from '@/components/admin/BulkDeleteButton';
import { StringFilterDropdown } from '@/components/admin/StringFilterDropdown';
import { EditButton, FilterDropdown, List, useTable } from '@refinedev/antd';
import { Input, Space, Table, Tag } from 'antd';

export default function UserList() {
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
            resource="users"
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
          filterDropdown={(props) => <StringFilterDropdown {...props} placeholder="Search name" />}
        />
        <Table.Column
          dataIndex="isAdmin"
          title="Role"
          render={(val: boolean) => (
            <Tag color={val ? 'purple' : 'green'}>{val ? 'admin' : 'user'}</Tag>
          )}
        />
        <Table.Column
          dataIndex="teams"
          title="Teams"
          render={(teams: any[]) => (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
              {(teams || []).map((t) => (
                <Tag key={t.id} color="blue">
                  C#{t.contestId}: #{t.id} ({t.name || t.color})
                </Tag>
              ))}
            </div>
          )}
        />
        <Table.Column
          title="Actions"
          dataIndex="actions"
          render={(_, record: any) => <EditButton hideText size="small" recordItemId={record.id} />}
        />
      </Table>
    </List>
  );
}
