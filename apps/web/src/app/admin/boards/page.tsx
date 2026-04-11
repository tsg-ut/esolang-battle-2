'use client';

import { EyeOutlined } from '@ant-design/icons';
import { EditButton, FilterDropdown, List, useSelect, useTable } from '@refinedev/antd';
import { Button, Input, Select, Space, Table, Tooltip } from 'antd';

export default function BoardList() {
  const { tableProps } = useTable({
    sorters: {
      initial: [{ field: 'id', order: 'asc' }],
    },
  });

  const { selectProps: contestSelectProps } = useSelect({
    resource: 'contests',
    optionLabel: (item) => `${item.name}(#${item.id})`,
    optionValue: 'id',
  });

  return (
    <List>
      <Table {...tableProps} rowKey="id">
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
            <FilterDropdown {...props}>
              <Select
                {...contestSelectProps}
                style={{ minWidth: 200 }}
                placeholder="Filter by contest"
              />
            </FilterDropdown>
          )}
        />
        <Table.Column dataIndex="type" title="Type" />
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
            </Space>
          )}
        />
      </Table>
    </List>
  );
}
