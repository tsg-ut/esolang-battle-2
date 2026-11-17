/**
 * コンテスト時間の判定
 *
 * 時間内かどうかは提出のサーバー受信時刻 (Submission.submittedAt) で判定する。
 * 提出時の通知・盤面計算・順位表で同じ判定を使うため、ここに集約する。
 */

type DateLike = Date | string;

const toTime = (d: DateLike) => (typeof d === 'string' ? Date.parse(d) : d.getTime());

/** startAt <= at <= endAt なら時間内 */
export function isInContestTime(
  contest: { startAt: DateLike; endAt: DateLike },
  at: DateLike
): boolean {
  const t = toTime(at);
  return toTime(contest.startAt) <= t && t <= toTime(contest.endAt);
}

/** コンテスト終了後、この時間内の時間外提出には Modal で通知する (それ以降は控えめな通知のみ) */
export const OUT_OF_TIME_MODAL_WINDOW_MS = 40 * 60 * 1000;
