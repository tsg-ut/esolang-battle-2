import Docker from 'dockerode';
import tar from 'tar-stream';

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
 * Tar helper: Create a tarball buffer from a record of files
 */
async function createTar(files: Record<string, string | Buffer>): Promise<Buffer> {
  const pack = tar.pack();
  for (const [name, content] of Object.entries(files)) {
    pack.entry({ name, mode: 0o755 }, content);
  }
  pack.finalize();

  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    pack.on('data', (chunk) => chunks.push(chunk));
    pack.on('error', reject);
    pack.on('end', () => resolve(Buffer.concat(chunks)));
  });
}

/**
 * Tar helper: Extract files from a tar stream
 */
async function extractTar(stream: any): Promise<Record<string, string>> {
  const extract = tar.extract();
  const files: Record<string, string> = {};
  const MAX_FILE_SIZE = 1 * 1024 * 1024; // 各ファイル最大 1MB までキャプチャ

  return new Promise((resolve, reject) => {
    extract.on('entry', (header, stream, next) => {
      const chunks: Buffer[] = [];
      let currentSize = 0;
      const fileName = header.name.split('/').pop() || header.name;

      stream.on('data', (chunk) => {
        if (currentSize < MAX_FILE_SIZE) {
          const remaining = MAX_FILE_SIZE - currentSize;
          const toAdd = chunk.length > remaining ? chunk.slice(0, remaining) : chunk;
          chunks.push(toAdd);
          currentSize += toAdd.length;
        }
      });
      stream.on('end', () => {
        files[fileName] = Buffer.concat(chunks).toString('utf8');
        if (currentSize >= MAX_FILE_SIZE) {
          files[fileName] += '\n... (output truncated)';
        }
        next();
      });
      stream.on('error', reject);
    });
    extract.on('finish', () => resolve(files));
    extract.on('error', reject);
    stream.pipe(extract);
  });
}

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
  timeoutMs: number, // 各テストケースあたりのタイムアウト
  memoryLimit: number
): Promise<Record<number, DockerResult>> {
  const codeFileName = 'solution.src';
  const files: Record<string, string | Buffer> = {
    [codeFileName]: code,
  };

  const scriptLines: string[] = [];
  for (const tc of testCases) {
    const base = String(tc.id);
    files[`IN_${base}`] = tc.input;

    // /tmp に結果を書き出す
    scriptLines.push(
      `/usr/bin/time -v -o /tmp/TIME_${base} script /tmp/${codeFileName} < /tmp/IN_${base} > /tmp/OUT_${base} 2>/tmp/ERR_${base}; echo $? > /tmp/EXIT_${base}`
    );
  }

  files['runner.sh'] = scriptLines.join('\n');

  try {
    // 1. コンテナ作成
    console.log(`Creating container with image: ${image}`);
    const container = await docker.createContainer({
      Image: image,
      Cmd: ['sh', '/tmp/runner.sh'],
      HostConfig: getHostConfig(memoryLimit),
    });

    // 2. ファイルを送り込む (/tmp に展開)
    const tarBuffer = await createTar(files);
    await container.putArchive(tarBuffer, { path: '/tmp' });

    // 3. 開始
    await container.start();

    // 4. 監視
    const waitPromise = container.wait();
    const timeoutPromise = new Promise((resolve) =>
      setTimeout(() => resolve({ timeout: true }), timeoutMs * testCases.length)
    );

    const raceResult: any = await Promise.race([waitPromise, timeoutPromise]);
    const isTimeout = !!(raceResult && raceResult.timeout);

    if (isTimeout) {
      await container.kill().catch((err) => console.error('Failed to kill container:', err));
    }

    // 5. 結果回収 (/tmp から取得)
    const archiveStream = await container.getArchive({ path: '/tmp' });
    const outputFiles = await extractTar(archiveStream);

    await container
      .remove({ force: true })
      .catch((err) => console.error('Failed to remove container:', err));

    const results: Record<number, DockerResult> = {};
    for (const tc of testCases) {
      const base = String(tc.id);

      const stdout = outputFiles[`OUT_${base}`] || '';
      const stderr = outputFiles[`ERR_${base}`] || '';
      const exitText = outputFiles[`EXIT_${base}`] || '-1';
      const timeText = outputFiles[`TIME_${base}`] || '';

      let exitCode = parseInt(exitText.trim(), 10);
      let finalStderr = stderr;

      if (isTimeout && exitCode === -1) {
        exitCode = 137;
        finalStderr += '\nTime Limit Exceeded';
      }

      let durationMs = 0;
      const userTimeMatch = timeText.match(/User time \(seconds\): ([\d.]+)/);
      const sysTimeMatch = timeText.match(/System time \(seconds\): ([\d.]+)/);
      const elapsedMatch = timeText.match(
        /Elapsed \(wall clock\) time \(h:mm:ss or m:ss\): (?:(\d+):)?(\d+):([\d.]+)/
      );

      if (userTimeMatch && sysTimeMatch) {
        const userTime = parseFloat(userTimeMatch[1]);
        const sysTime = parseFloat(sysTimeMatch[1]);
        durationMs = Math.round((userTime + sysTime) * 1000);
      } else if (elapsedMatch) {
        const hours = elapsedMatch[1] ? parseInt(elapsedMatch[1], 10) : 0;
        const mins = parseInt(elapsedMatch[2], 10);
        const secs = parseFloat(elapsedMatch[3]);
        durationMs = Math.round((hours * 3600 + mins * 60 + secs) * 1000);
      }

      results[tc.id] = {
        stdout,
        stderr: finalStderr,
        exitCode: Number.isNaN(exitCode) ? -1 : exitCode,
        durationMs: Math.max(0, durationMs),
      };
    }
    return results;
  } catch (err) {
    console.error('Execution error:', err);
    throw err;
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
  const files: Record<string, string> = {
    'judge.src': code,
    'input.json': JSON.stringify(inputJson),
  };

  try {
    const tarBuffer = await createTar(files);
    const container = await docker.createContainer({
      Image: image,
      Cmd: ['sh', '-c', 'script /tmp/judge.src < /tmp/input.json'],
      HostConfig: getHostConfig(MEMORY_LIMIT),
    });

    await container.putArchive(tarBuffer, { path: '/tmp' });
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

    const logs = await container.logs({ stdout: true, stderr: true });
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
  } catch (err) {
    console.error('Judge error:', err);
    throw err;
  }
}

/**
 * Docker logs (Buffer) から stdout/stderr を抽出するユーティリティ
 */
function decodeDockerLogs(buffer: Buffer): { stdout: string; stderr: string } {
  let stdout = '';
  let stderr = '';
  let offset = 0;
  const MAX_LOG_SIZE = 1 * 1024 * 1024; // 各ストリーム最大 1MB まで

  while (offset < buffer.length) {
    const type = buffer.readUInt8(offset);
    const size = buffer.readUInt32BE(offset + 4);
    const payloadBuffer = buffer.slice(offset + 8, offset + 8 + size);
    const payload = payloadBuffer.toString('utf8');

    if (type === 1) {
      if (stdout.length < MAX_LOG_SIZE) stdout += payload;
    } else if (type === 2) {
      if (stderr.length < MAX_LOG_SIZE) stderr += payload;
    }

    offset += 8 + size;
  }

  if (stdout.length >= MAX_LOG_SIZE) stdout += '\n... (stdout truncated)';
  if (stderr.length >= MAX_LOG_SIZE) stderr += '\n... (stderr truncated)';

  return { stdout, stderr };
}
