'use client';

import React from 'react';

import { FilterDropdown, FilterDropdownProps } from '@refinedev/antd';
import { Checkbox, Input, Space } from 'antd';

type StringFilterDropdownProps = Omit<FilterDropdownProps, 'children'> & {
  placeholder?: string;
};

export const StringFilterDropdown: React.FC<StringFilterDropdownProps> = (props) => {
  const { setSelectedKeys, selectedKeys, confirm, clearFilters } = props;

  // selectedKeys[0] に { operator, value } が入る形式を維持
  const currentFilter: any = selectedKeys[0] || { operator: 'contains', value: '' };

  // Refine の自動処理をバイパスするためのダミー関数
  const dummySetSelectedKeys: typeof setSelectedKeys = (_) => undefined;
  const filterDropdownProps = { ...props, setSelectedKeys: dummySetSelectedKeys };

  return (
    <FilterDropdown {...filterDropdownProps}>
      <Space direction="vertical" style={{ padding: '8px' }}>
        <Checkbox
          checked={currentFilter.operator === 'eq'}
          onChange={(e) =>
            setSelectedKeys([{ ...currentFilter, operator: e.target.checked ? 'eq' : 'contains' }])
          }
        >
          Exact Match
        </Checkbox>
        <Input
          placeholder={props.placeholder || 'Search...'}
          value={currentFilter.value}
          onChange={(e) => setSelectedKeys([{ ...currentFilter, value: e.target.value }])}
          onPressEnter={() => confirm()}
          style={{ width: 188, display: 'block' }}
        />
      </Space>
    </FilterDropdown>
  );
};
