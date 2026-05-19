'use client';

import React from 'react';

import Link from 'next/link';

import { Alert } from 'antd';

export function LoginRequiredMessage() {
  return (
    <div className="my-4">
      <Alert
        message="ログインが必要です"
        description={
          <span>
            提出やテストを実行するには、
            <Link href="/login" className="font-bold text-blue-600 hover:underline">
              ログイン画面
            </Link>
            からログインしてください。
          </span>
        }
        type="warning"
        showIcon
      />
    </div>
  );
}
