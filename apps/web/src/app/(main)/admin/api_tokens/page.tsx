'use client';

import React, { useState } from 'react';

import { BulkDeleteButton } from '@/components/admin/BulkDeleteButton';
import { StringFilterDropdown } from '@/components/admin/StringFilterDropdown';
import { DeleteButton, List, useTable } from '@refinedev/antd';
import { Space, Table, Typography } from 'antd';
import dayjs from 'dayjs';

const { Text } = Typography;

export default function ApiTokenList() {
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const { tableProps } = useTable({
    sorters: {
      initial: [{ field: 'createdAt', order: 'desc' }],
    },
  });

  return (
    <List
      headerButtons={({ defaultButtons }) => (
        <Space>
          {defaultButtons}
          <BulkDeleteButton
            resource="api_tokens"
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
          dataIndex="name"
          title="Token Name"
          sorter
          filterDropdown={(props) => <StringFilterDropdown {...props} placeholder="Search name" />}
        />
        <Table.Column dataIndex="userName" title="User" sorter />
        <Table.Column
          dataIndex="token"
          title="Token"
          render={(val: string) => <Text copyable={{ text: val }}>{val.substring(0, 8)}...</Text>}
        />
        <Table.Column
          dataIndex="createdAt"
          title="Created At"
          render={(val: string) => dayjs(val).format('YYYY-MM-DD HH:mm')}
          sorter
        />
        <Table.Column
          dataIndex="expiresAt"
          title="Expires At"
          render={(val: string | null) => (val ? dayjs(val).format('YYYY-MM-DD HH:mm') : 'Never')}
          sorter
        />
        <Table.Column
          title="Actions"
          dataIndex="actions"
          render={(_, record: any) => (
            <DeleteButton hideText size="small" recordItemId={record.id} />
          )}
        />
      </Table>
    </List>
  );
}
