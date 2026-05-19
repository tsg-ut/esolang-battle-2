'use client';

import React, { useState } from 'react';

import { BulkDeleteButton } from '@/components/admin/BulkDeleteButton';
import { StringFilterDropdown } from '@/components/admin/StringFilterDropdown';
import { EyeOutlined } from '@ant-design/icons';
import {
  DateField,
  DeleteButton,
  EditButton,
  FilterDropdown,
  List,
  useTable,
} from '@refinedev/antd';
import { Button, Input, Space, Table, Tooltip } from 'antd';

export default function ContestList() {
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const { tableProps } = useTable({
    sorters: {
      initial: [{ field: 'id', order: 'desc' }],
    },
  });

  return (
    <List
      headerButtons={({ defaultButtons }) => (
        <Space>
          {defaultButtons}
          <BulkDeleteButton
            resource="contests"
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
            <StringFilterDropdown {...props} placeholder="Search contest name" />
          )}
        />
        <Table.Column
          dataIndex="startAt"
          title="Start At"
          sorter
          render={(val: string) => <DateField value={val} format="YYYY-MM-DD HH:mm:ss" />}
        />
        <Table.Column
          dataIndex="endAt"
          title="End At"
          sorter
          render={(val: string) => <DateField value={val} format="YYYY-MM-DD HH:mm:ss" />}
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
                  onClick={() => window.open(`/contest/${record.id}/board`, '_blank')}
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
