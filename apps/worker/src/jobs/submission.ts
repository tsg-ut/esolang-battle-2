import { CaseCheckerInput, CaseCheckerOutput, ScoreAggregatorInput } from '@esolang-battle/common';
import { prisma } from '@esolang-battle/db';

import { runBuiltinAggregator, runBuiltinChecker } from '../lib/builtin-judge';
import { runAllTestCasesInSingleContainer, runJudgeScript } from '../lib/docker';
import { updateBoardFromSubmission } from '../lib/board';

export async function processSubmission(submissionId: number) {
  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: {
      language: true,
      problem: {
        include: {
          testCases: { orderBy: { id: 'asc' } },
          contest: true,
          checkerLanguage: true,
          aggregatorLanguage: true,
        },
      },
    },
  });

  if (!submission || !submission.problem) return;

  // 0. 以前の実行結果があれば削除 (再実行用)
  await prisma.execution.deleteMany({
    where: { submissionId: submission.id },
  });

  const image = submission.language.dockerImageId;
  if (!image) return;

  const problem = submission.problem;
  console.log(`[Judge] Processing submission ${submissionId} for problem ${problem.id}`);

  // 1. 全テストケースの実行
  const dockerResults = await runAllTestCasesInSingleContainer(
    image,
    submission.code,
    problem.testCases.map((tc) => ({ id: tc.id, input: tc.input }))
  );

  // 2. 個別ケースの判定 (Case Checking)
  const checkerResults: {
    testCaseId: number;
    isSample: boolean;
    checkerResult: CaseCheckerOutput;
  }[] = [];

  // 各テストケースに関連する言語情報を一括取得 (TC個別のチェッカー用)
  const tcLanguages = await prisma.language.findMany({
    where: {
      id: {
        in: problem.testCases
          .map((tc) => tc.checkerLanguageId)
          .filter((id) => id !== null) as number[],
      },
    },
  });

  for (const testcase of problem.testCases) {
    const execResult = dockerResults[testcase.id];
    if (!execResult) {
      checkerResults.push({
        testCaseId: testcase.id,
        isSample: testcase.isSample,
        checkerResult: { status: 'RE', score: 0, message: 'Execution failed or timeout' },
      });
      continue;
    }

    let result: CaseCheckerOutput;

    // 判定ロジックの決定: TC固有スクリプト > Problemカスタムスクリプト > Problem組み込み
    if (testcase.checkerScript && testcase.checkerLanguageId) {
      // TestCase 固有のカスタムチェッカー
      const lang = tcLanguages.find((l) => l.id === testcase.checkerLanguageId);
      if (lang) {
        try {
          const input: CaseCheckerInput = {
            testCase: {
              input: testcase.input,
              expectedOutput: testcase.output,
              isSample: testcase.isSample,
            },
            execution: {
              stdout: execResult.stdout,
              stderr: execResult.stderr,
              exitCode: execResult.exitCode,
              durationMs: execResult.durationMs,
            },
            config: problem.checkerConfig,
          };
          result = await runJudgeScript(lang.dockerImageId, testcase.checkerScript, input);
        } catch (e: any) {
          result = { status: 'RE', score: 0, message: `TC Checker Error: ${e.message}` };
        }
      } else {
        result = { status: 'RE', score: 0, message: 'TC Checker Language not found' };
      }
    } else if (
      problem.checkerType === 'CUSTOM' &&
      problem.checkerScript &&
      problem.checkerLanguage
    ) {
      // Problem 全体のカスタムチェッカー
      try {
        const input: CaseCheckerInput = {
          testCase: {
            input: testcase.input,
            expectedOutput: testcase.output,
            isSample: testcase.isSample,
          },
          execution: {
            stdout: execResult.stdout,
            stderr: execResult.stderr,
            exitCode: execResult.exitCode,
            durationMs: execResult.durationMs,
          },
          config: problem.checkerConfig,
        };
        result = await runJudgeScript(
          problem.checkerLanguage.dockerImageId,
          problem.checkerScript,
          input
        );
      } catch (e: any) {
        result = { status: 'RE', score: 0, message: `Problem Checker Error: ${e.message}` };
      }
    } else {
      // 組み込みチェッカー
      const input: CaseCheckerInput = {
        testCase: {
          input: testcase.input,
          expectedOutput: testcase.output,
          isSample: testcase.isSample,
        },
        execution: {
          stdout: execResult.stdout,
          stderr: execResult.stderr,
          exitCode: execResult.exitCode,
          durationMs: execResult.durationMs,
        },
        config: problem.checkerConfig,
      };
      result = runBuiltinChecker(problem.checkerName, input);
    }

    checkerResults.push({
      testCaseId: testcase.id,
      isSample: testcase.isSample,
      checkerResult: result,
    });

    // DBに実行詳細を保存
    await prisma.execution.create({
      data: {
        testcase: { connect: { id: testcase.id } },
        submission: { connect: { id: submission.id } },
        status: result.status as any,
        stdout: execResult.stdout,
        stderr: execResult.stderr,
        message: result.message,
        executionTime: execResult.durationMs,
        executedAt: new Date(),
      },
    });
  }

  // 3. 提出全体の集計 (Aggregation)
  let finalResult: { status: any; finalScore: number | null; summaryMessage?: string };

  if (
    problem.aggregatorType === 'CUSTOM' &&
    problem.aggregatorScript &&
    problem.aggregatorLanguage
  ) {
    try {
      const aggInput: ScoreAggregatorInput = {
        submission: {
          id: submission.id,
          codeLength: submission.codeLength,
          languageId: submission.languageId,
        },
        results: checkerResults,
        config: problem.aggregatorConfig,
      };
      const aggRes = await runJudgeScript(
        problem.aggregatorLanguage.dockerImageId,
        problem.aggregatorScript,
        aggInput
      );
      finalResult = {
        status: aggRes.status,
        finalScore: aggRes.finalScore,
        summaryMessage: aggRes.summaryMessage,
      };
    } catch (e: any) {
      finalResult = {
        status: 'RE',
        finalScore: 0,
        summaryMessage: `Aggregator Error: ${e.message}`,
      };
    }
  } else {
    // 組み込みアグリゲーター
    const aggInput: ScoreAggregatorInput = {
      submission: {
        id: submission.id,
        codeLength: submission.codeLength,
        languageId: submission.languageId,
      },
      results: checkerResults,
      config: problem.aggregatorConfig,
    };
    const aggRes = runBuiltinAggregator(problem.aggregatorName, aggInput);
    finalResult = {
      status: aggRes.status,
      finalScore: aggRes.finalScore,
      summaryMessage: aggRes.summaryMessage,
    };
  }

  // 最終結果の保存
  await prisma.submission.update({
    where: { id: submission.id },
    data: {
      score: finalResult.finalScore,
      status: finalResult.status,
    },
  });

  // 4. スコアが有効（正解）なら盤面を更新
  if (
    finalResult.status === 'AC' &&
    finalResult.finalScore !== null &&
    finalResult.finalScore > 0
  ) {
    const board = await prisma.board.findUnique({
      where: { contestId: problem.contestId },
    });
    if (board) {
      try {
        await updateBoardFromSubmission(board.id, submission.id);
      } catch (error) {
        console.error('Failed to update board:', error);
      }
    }
  }
}
