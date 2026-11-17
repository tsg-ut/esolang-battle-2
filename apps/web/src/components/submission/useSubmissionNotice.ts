'use client';

import { useCallback } from 'react';

import { App } from 'antd';
import dayjs from 'dayjs';

import { OUT_OF_TIME_MODAL_WINDOW_MS } from '@esolang-battle/common';

const dismissedKey = (contestId: number) => `outOfTimeNoticeDismissed:${contestId}`;

function isDismissed(contestId: number): boolean {
  try {
    return window.localStorage.getItem(dismissedKey(contestId)) === '1';
  } catch {
    return false;
  }
}

function markDismissed(contestId: number) {
  try {
    window.localStorage.setItem(dismissedKey(contestId), '1');
  } catch {
    // 保存できない環境では次回も Modal が出るだけ
  }
}

/**
 * 提出完了時の通知。
 * - 時間内: 成功メッセージ
 * - 時間外 かつ 終了後 OUT_OF_TIME_MODAL_WINDOW_MS 以内 かつ このコンテストで Modal を閉じていない: Modal
 * - それ以外の時間外: 控えめな警告メッセージ
 * 経過時間は submittedAt と contestEndAt (どちらもサーバー時刻) で判定する。
 */
export function useSubmissionNotice() {
  const { message, modal } = App.useApp();

  return useCallback(
    (
      contestId: number,
      result: { inTime: boolean; submittedAt: Date | string; contestEndAt: string }
    ) => {
      if (result.inTime) {
        message.success('提出が完了しました');
        return;
      }

      const submittedAt = dayjs(result.submittedAt);
      const endAt = dayjs(result.contestEndAt);
      const elapsed = submittedAt.diff(endAt);

      if (elapsed >= 0 && elapsed <= OUT_OF_TIME_MODAL_WINDOW_MS && !isDismissed(contestId)) {
        modal.warning({
          title: 'コンテストは終了しています',
          content: `この提出はコンテスト終了後（${submittedAt.format('HH:mm:ss')} 受付、${endAt.format('HH:mm:ss')} 終了）のため、スコア・盤面には反映されません。提出自体はジャッジされます。`,
          okText: '閉じる',
          maskClosable: false,
          keyboard: false,
          onOk: () => markDismissed(contestId),
        });
        return;
      }

      message.warning('コンテスト終了後の提出です（スコア・盤面には反映されません）');
    },
    [message, modal]
  );
}
