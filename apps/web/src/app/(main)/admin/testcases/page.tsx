'use client';

import { StringFilterDropdown } from '@/components/admin/StringFilterDropdown';
import {
  DeleteButton,
  EditButton,
  FilterDropdown,
  List,
  useSelect,
  useTable,
} from '@refinedev/antd';
import { Input, Select, Space, Table } from 'antd';

export default function TestCaseList() {
  const { tableProps } = useTable({
    sorters: {
      initial: [{ field: 'id', order: 'asc' }],
    },
  });
  const { selectProps: problemSelectProps } = useSelect({
    resource: 'problems',
    optionLabel: 'title',
    optionValue: 'id',
  });

  return (
    <List
      headerButtons={({ defaultButtons }) => (
        <Space>
          {defaultButtons}
          <DeleteButton
            size="small"
            resource="testcases"
            recordItemId={tableProps.rowSelection?.selectedRowKeys as any}
            style={{
              display: tableProps.rowSelection?.selectedRowKeys?.length ? 'inline-flex' : 'none',
            }}
          >
            Delete Selected
          </DeleteButton>
        </Space>
      )}
    >
      <Table
        {...tableProps}
        rowKey="id"
        rowSelection={{ type: 'checkbox', ...tableProps.rowSelection }}
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
          dataIndex="problemId"
          title="Problem"
          filterDropdown={(props) => (
            <FilterDropdown {...props}>
              <Select
                style={{ minWidth: 200 }}
                {...problemSelectProps}
                placeholder="Filter by Problem"
              />
            </FilterDropdown>
          )}
        />
        <Table.Column
          dataIndex="input"
          title="Input"
          render={(val: string) => (
            <div
              style={{
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: '200px',
                fontFamily: 'monospace',
              }}
            >
              {val}
            </div>
          )}
          filterDropdown={(props) => <StringFilterDropdown {...props} placeholder="Search input" />}
        />
        <Table.Column
          dataIndex="output"
          title="Output"
          render={(val: string) => (
            <div
              style={{
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: '200px',
                fontFamily: 'monospace',
              }}
            >
              {val}
            </div>
          )}
          filterDropdown={(props) => (
            <StringFilterDropdown {...props} placeholder="Search output" />
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
