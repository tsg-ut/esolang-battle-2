'use client';

import React from 'react';

import { DeleteOutlined } from '@ant-design/icons';
import { useDeleteMany } from '@refinedev/core';
import { Button, Popconfirm } from 'antd';

type BulkDeleteButtonProps = {
  selectedKeys: React.Key[];
  resource: string;
  onSuccess?: () => void;
};

export const BulkDeleteButton: React.FC<BulkDeleteButtonProps> = ({
  selectedKeys,
  resource,
  onSuccess,
}) => {
  const { mutate, isLoading } = useDeleteMany();

  if (selectedKeys.length === 0) return null;

  return (
    <Popconfirm
      title={`Delete ${selectedKeys.length} items?`}
      description="This action cannot be undone."
      onConfirm={() => {
        mutate(
          {
            resource,
            ids: selectedKeys.map(String),
          },
          {
            onSuccess: () => {
              if (onSuccess) onSuccess();
            },
          }
        );
      }}
      okText="Yes"
      cancelText="No"
      okButtonProps={{ danger: true, loading: isLoading }}
    >
      <Button danger icon={<DeleteOutlined />} loading={isLoading}>
        Delete Selected ({selectedKeys.length})
      </Button>
    </Popconfirm>
  );
};
