import {
  CaseCheckerInput,
  CaseCheckerOutput,
  ScoreAggregatorInput,
  ScoreAggregatorOutput,
} from '@esolang-battle/common';

/**
 * 組み込みチェッカー: 指定された名前のロジックで1ケースを判定する
 */
export function runBuiltinChecker(name: string, input: CaseCheckerInput): CaseCheckerOutput {
  const { expectedOutput } = input.testCase;
  const { stdout, exitCode } = input.execution;
  const config = (input.config || {}) as { epsilon?: number; ignoreExitCode?: boolean };

  // 1. 実行時エラーのチェック (オプションで無視可能)
  if (exitCode !== 0 && !config.ignoreExitCode) {
    return { status: 'RE', score: 0, message: `Exit code ${exitCode}` };
  }

  const exitCodeMessage = exitCode !== 0 ? ` (Exit code ${exitCode})` : '';

  const actual = stdout || '';
  const expected = expectedOutput || '';

  console.log(
    `[BuiltinChecker:${name}] Actual Size: ${actual.length}, Expected Size: ${expected.length}`
  );

  switch (name.toUpperCase()) {
    case 'EXACT':
      return actual === expected
        ? { status: 'AC', score: 1, message: exitCodeMessage || undefined }
        : {
            status: 'WA',
            score: 0,
            message: `Output does not match exactly${exitCodeMessage}`,
          };

    case 'TRIM': {
      const a = actual.trim();
      const e = expected.trim();
      return a === e
        ? { status: 'AC', score: 1, message: exitCodeMessage || undefined }
        : {
            status: 'WA',
            score: 0,
            message: `Expected [${e}], got [${a}]${exitCodeMessage}`,
          };
    }

    case 'WHITESPACE': {
      const normalize = (s: string) => s.replace(/\s+/g, ' ').trim();
      const a = normalize(actual);
      const e = normalize(expected);
      return a === e
        ? { status: 'AC', score: 1, message: exitCodeMessage || undefined }
        : {
            status: 'WA',
            score: 0,
            message: `Expected [${e}] (normalized), got [${a}]${exitCodeMessage}`,
          };
    }

    case 'IGNORE_CASE': {
      const a = actualBuf.toString('utf8').toLowerCase().trim();
      const e = expectedBuf.toString('utf8').toLowerCase().trim();
      return a === e
        ? { status: 'AC', score: 1, message: exitCodeMessage || undefined }
        : {
            status: 'WA',
            score: 0,
            message: `Expected [${e}] (ignore case), got [${a}]${exitCodeMessage}`,
          };
    }

    case 'FLOAT': {
      const aText = actualBuf.toString('utf8').trim();
      const eText = expectedBuf.toString('utf8').trim();
      const actualNum = parseFloat(aText);
      const expectedNum = parseFloat(eText);
      const epsilon = config.epsilon || 1e-7;

      if (isNaN(actualNum))
        return { status: 'WA', score: 0, message: `Not a number${exitCodeMessage}` };

      return Math.abs(actualNum - expectedNum) <= epsilon
        ? { status: 'AC', score: 1, message: exitCodeMessage || undefined }
        : {
            status: 'WA',
            score: 0,
            message: `Expected ${expectedNum} ± ${epsilon}, got ${actualNum}${exitCodeMessage}`,
          };
    }

    case 'CONTAINS': {
      const a = actualBuf.toString('utf8');
      const e = expectedBuf.toString('utf8');
      return a.includes(e)
        ? { status: 'AC', score: 1, message: exitCodeMessage || undefined }
        : {
            status: 'WA',
            score: 0,
            message: `Expected to contain [${e}], but did not${exitCodeMessage}`,
          };
    }

    default:
      return { status: 'RE', score: 0, message: `Unknown builtin checker: ${name}` };
  }
}

/**
 * 組み込みアグリゲーター: 全ケースの結果から最終スコアを算出する
 */
export function runBuiltinAggregator(
  name: string,
  input: ScoreAggregatorInput
): ScoreAggregatorOutput {
  const { results, submission } = input;

  // ステータスの優先順位 (後者ほど優先)
  const statusPriority = ['AC', 'WA', 'TLE', 'RE', 'WJ'];

  let finalStatus: any = 'AC';
  let maxPriority = 0;

  for (const res of results) {
    const priority = statusPriority.indexOf(res.checkerResult.status);
    if (priority > maxPriority) {
      maxPriority = priority;
      finalStatus = res.checkerResult.status;
    }
  }

  // デフォルト: 全ケースACならコード長をスコアにする
  if (finalStatus === 'AC') {
    return {
      status: 'AC',
      finalScore: submission.codeLength,
      summaryMessage: 'All cases passed!',
    };
  }

  return {
    status: finalStatus,
    finalScore: 0,
    summaryMessage: `Failed with status ${finalStatus}`,
  };
}
