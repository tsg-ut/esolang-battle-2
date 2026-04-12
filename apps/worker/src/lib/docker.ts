import Docker from 'dockerode';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';

const docker = new Docker();

export type DockerResult = {
  stdout: string;
  stderr: string;
  exitCode: number;
  durationMs: number;
};

export type TestCaseWithIO = {
  id: number;
  input: string;
};

const DEFAULT_TIMEOUT_MS = 10000; // 10s
const MEMORY_LIMIT = 512 * 1024 * 1024; // 512MB
const BATCH_MEMORY_LIMIT = 1024 * 1024 * 1024; // 1GB

/**
 * コンテナの共通セキュリティ設定
 */
const getHostConfig = (memoryLimit: number): Docker.HostConfig => ({
  Memory: memoryLimit,
  MemorySwap: memoryLimit,
  Ulimits: [
    { Name: 'nofile', Soft: 65535, Hard: 65535 },
    { Name: 'nproc', Soft: 4096, Hard: 8192 },
  ],
  NetworkMode: 'none',
});

/**
 * 実行エンジンのコア: コンテナ内で複数の入力を処理する
 */
async function runExecutionBatch(
  image: string,
  code: string | Buffer,
  testCases: TestCaseWithIO[],
  timeoutMs: number,
  memoryLimit: number
): Promise<Record<number, DockerResult>> {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'esolang-exec-'));

  try {
    // 1. 準備: コードと各テストケースの入力を書き出す
    const codeFileName = 'solution.src';
    await fs.writeFile(path.join(tmpDir, codeFileName), code);

    const scriptLines: string[] = [];
    for (const tc of testCases) {
      const base = String(tc.id);
      await fs.writeFile(path.join(tmpDir, `IN_${base}`), tc.input, 'utf8');

      // script /volume/solution.src < /volume/INPUT 形式
      // ファイル名は固定なので直接埋め込み
      scriptLines.push(
        `script /volume/${codeFileName} < /volume/IN_${base} > /volume/OUT_${base} 2>/volume/ERR_${base}; echo $? > /volume/EXIT_${base}`
      );
    }

    // 実行制御用シェルスクリプト
    await fs.writeFile(path.join(tmpDir, 'runner.sh'), scriptLines.join('\n'), { mode: 0o755 });

    // 2. 実行: コンテナの作成と開始
    console.log(`Starting container with image: ${image}`);
    const container = await docker.createContainer({
      Image: image,
      Cmd: ['sh', '/volume/runner.sh'],
      HostConfig: {
        ...getHostConfig(memoryLimit),
        Binds: [`${tmpDir}:/volume:rw`],
      },
    });

    const start = Date.now();
    await container.start();

    // 3. 監視: 終了またはタイムアウトを待つ
    const waitPromise = container.wait();
    const timeoutPromise = new Promise((resolve) =>
      setTimeout(() => resolve({ timeout: true }), timeoutMs)
    );

    const raceResult: any = await Promise.race([waitPromise, timeoutPromise]);
    const end = Date.now();
    const isTimeout = !!(raceResult && raceResult.timeout);

    if (isTimeout) {
      await container.kill().catch((err) => console.error('Failed to kill container:', err));
    }

    // 4. 回収: コンテナ削除と結果ファイルの読み込み
    await container
      .remove({ force: true })
      .catch((err) => console.error('Failed to remove container:', err));

    const results: Record<number, DockerResult> = {};
    for (const tc of testCases) {
      const base = String(tc.id);
      const [stdout, stderr, exitText] = await Promise.all([
        fs.readFile(path.join(tmpDir, `OUT_${base}`), 'utf8').catch(() => ''),
        fs.readFile(path.join(tmpDir, `ERR_${base}`), 'utf8').catch(() => ''),
        fs.readFile(path.join(tmpDir, `EXIT_${base}`), 'utf8').catch(() => '-1'),
      ]);

      let exitCode = parseInt(exitText.trim(), 10);
      let finalStderr = stderr;

      if (isTimeout && exitCode === -1) {
        exitCode = 137;
        finalStderr += '\nTime Limit Exceeded';
      }

      results[tc.id] = {
        stdout,
        stderr: finalStderr,
        exitCode: Number.isNaN(exitCode) ? -1 : exitCode,
        durationMs: end - start,
      };
    }
    return results;
  } finally {
    await fs
      .rm(tmpDir, { recursive: true, force: true })
      .catch((err) => console.error('Failed to cleanup tmpDir:', err));
  }
}

/**
 * 単一のコード execution (コードテスト用)
 */
export async function runCode(
  image: string,
  code: string | Buffer,
  stdin = '',
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<DockerResult> {
  const results = await runExecutionBatch(
    image,
    code,
    [{ id: 0, input: stdin }],
    timeoutMs,
    MEMORY_LIMIT
  );
  return results[0];
}

/**
 * 全テストケースの一括実行 (提出用)
 */
export async function runAllTestCasesInSingleContainer(
  image: string,
  code: string | Buffer,
  testCases: TestCaseWithIO[],
  timeoutMs: number = DEFAULT_TIMEOUT_MS * 2
): Promise<Record<number, DockerResult>> {
  return await runExecutionBatch(image, code, testCases, timeoutMs, BATCH_MEMORY_LIMIT);
}

/**
 * ジャッジ用スクリプト (Checker/Aggregator) を実行する
 */
export async function runJudgeScript(
  image: string,
  code: string,
  inputJson: any,
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<any> {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'esolang-judge-'));

  try {
    const codeFileName = 'judge.src';
    await fs.writeFile(path.join(tmpDir, codeFileName), code, 'utf8');
    await fs.writeFile(path.join(tmpDir, 'input.json'), JSON.stringify(inputJson), 'utf8');

    // 実行コマンド: script /volume/judge.src < /volume/input.json
    const runnerCmd = `script /volume/${codeFileName} < /volume/input.json`;

    const container = await docker.createContainer({
      Image: image,
      Cmd: ['sh', '-c', runnerCmd],
      HostConfig: {
        ...getHostConfig(MEMORY_LIMIT),
        Binds: [`${tmpDir}:/volume:rw`],
      },
    });

    await container.start();

    const waitPromise = container.wait();
    const timeoutPromise = new Promise((resolve) =>
      setTimeout(() => resolve({ timeout: true }), timeoutMs)
    );

    const raceResult: any = await Promise.race([waitPromise, timeoutPromise]);
    const isTimeout = !!(raceResult && raceResult.timeout);

    if (isTimeout) {
      await container.kill().catch((err) => console.error('Failed to kill judge container:', err));
    }

    // 標準出力を取得
    const logs = await container.logs({ stdout: true, stderr: true });
    // Dockerのログ形式（ヘッダー付き）をデコード
    const output = decodeDockerLogs(logs);

    await container
      .remove({ force: true })
      .catch((err) => console.error('Failed to remove judge container:', err));

    if (isTimeout) throw new Error('Judge script timeout');

    try {
      return JSON.parse(output.stdout.trim());
    } catch (e) {
      console.error('Failed to parse judge script output:', output.stdout);
      throw new Error(`Invalid JSON from judge script: ${output.stderr}`);
    }
  } finally {
    await fs
      .rm(tmpDir, { recursive: true, force: true })
      .catch((err) => console.error('Failed to remove tmpDir:', err));
  }
}

/**
 * Docker logs (Buffer) から stdout/stderr を抽出するユーティリティ
 */
function decodeDockerLogs(buffer: Buffer): { stdout: string; stderr: string } {
  let stdout = '';
  let stderr = '';
  let offset = 0;

  while (offset < buffer.length) {
    const type = buffer.readUInt8(offset);
    const size = buffer.readUInt32BE(offset + 4);
    const payload = buffer.toString('utf8', offset + 8, offset + 8 + size);

    if (type === 1) stdout += payload;
    else if (type === 2) stderr += payload;

    offset += 8 + size;
  }

  return { stdout, stderr };
}
