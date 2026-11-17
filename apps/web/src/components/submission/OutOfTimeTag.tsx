import React from 'react';

import { Tag, Tooltip } from 'antd';

/** コンテスト時間外の提出であることを示すタグ */
export function OutOfTimeTag() {
  return (
    <Tooltip title="コンテスト時間外の提出のため、スコア・盤面には反映されません">
      <Tag color="default" style={{ borderStyle: 'dashed' }}>
        時間外
      </Tag>
    </Tooltip>
  );
}
