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
  const config = input.config || {};

  // 1. 実行時エラーのチェック
  if (exitCode !== 0) {
    return { status: 'RE', score: 0, message: `Exit code ${exitCode}` };
  }

  const actual = stdout;
  const expected = expectedOutput;

  console.log(`[BuiltinChecker:${name}] Actual: [${actual}], Expected: [${expected}]`);

  switch (name.toUpperCase()) {
    case 'EXACT':
      return actual === expected ? { status: 'AC', score: 1 } : { status: 'WA', score: 0 };

    case 'TRIM':
      return actual.trim() === expected.trim()
        ? { status: 'AC', score: 1 }
        : { status: 'WA', score: 0 };

    case 'WHITESPACE': {
      const normalize = (s: string) => s.replace(/\s+/g, ' ').trim();
      return normalize(actual) === normalize(expected)
        ? { status: 'AC', score: 1 }
        : { status: 'WA', score: 0 };
    }

    case 'IGNORE_CASE':
      return actual.toLowerCase().trim() === expected.toLowerCase().trim()
        ? { status: 'AC', score: 1 }
        : { status: 'WA', score: 0 };

    case 'FLOAT': {
      const actualNum = parseFloat(actual.trim());
      const expectedNum = parseFloat(expected.trim());
      const epsilon = config.epsilon || 1e-7;

      if (isNaN(actualNum)) return { status: 'WA', score: 0, message: 'Not a number' };

      return Math.abs(actualNum - expectedNum) <= epsilon
        ? { status: 'AC', score: 1 }
        : { status: 'WA', score: 0 };
    }

    case 'CONTAINS':
      return actual.includes(expected) ? { status: 'AC', score: 1 } : { status: 'WA', score: 0 };

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

  // デフォルト: 全ケースACならコード長をスコアにする
  // 1つでもAC以外があれば、そのステータス（最初に見つかったもの）を返す
  const firstNonAC = results.find((r) => r.checkerResult.status !== 'AC');

  if (firstNonAC) {
    return {
      status: firstNonAC.checkerResult.status,
      finalScore: null,
      summaryMessage:
        firstNonAC.checkerResult.message || `Failed at testcase ${firstNonAC.testCaseId}`,
    };
  }

  return {
    status: 'AC',
    finalScore: submission.codeLength,
    summaryMessage: 'All cases passed!',
  };
}
