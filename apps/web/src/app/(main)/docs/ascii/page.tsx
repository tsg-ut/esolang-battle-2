'use client';

import React from 'react';

import Link from 'next/link';

import { AsciiTable } from '@/components/docs/AsciiTable';
import { FullscreenOutlined } from '@ant-design/icons';
import { Button, Tooltip } from 'antd';

export default function AsciiPage() {
  return (
    <AsciiTable
      extraTitleAction={
        <Tooltip title="フルスクリーンで開く">
          <Link href="/docs/ascii/full" target="_blank">
            <Button icon={<FullscreenOutlined />} type="text" />
          </Link>
        </Tooltip>
      }
    />
  );
}
