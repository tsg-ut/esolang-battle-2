import Docker from 'dockerode';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

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

/**
 * 単一のコンテナでコードを実行する
 */
export async function runCode(image: string, code: string): Promise<DockerResult> {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "esolang-test-"));
  const cmd = image.split("/").slice(-1)[0];

  try {
    const codeFileName = "code.bf";
    const codePath = path.join(tmpDir, codeFileName);
    await fs.writeFile(codePath, code, "utf8");

    const container = await docker.createContainer({
      Image: image,
      Cmd: [cmd!, `/volume/${codeFileName}`],
      HostConfig: {
        Binds: [`${tmpDir}:/volume:ro`],
      },
    });

    const start = Date.now();
    await container.start();
    const waitResult = await container.wait();
    const end = Date.now();

    const logBuffer = await container.logs({ stdout: true, stderr: true });
    // Docker ログ形式 (8バイトヘッダ) を考慮した簡易的な文字列化
    const output = logBuffer.toString('utf8').replace(/[\x00-\x1F\x7F-\x9F]/g, "");

    await container.remove({ force: true });

    return {
      stdout: output,
      stderr: "",
      exitCode: waitResult.StatusCode ?? -1,
      durationMs: end - start,
    };
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true });
  }
}

/**
 * 単一のコンテナで全テストケースを一括実行する
 */
export async function runAllTestCasesInSingleContainer(
  image: string,
  code: string,
  testCases: TestCaseWithIO[],
): Promise<Record<number, DockerResult>> {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "esolang-worker-"));
  const cmd = image.split("/").slice(-1)[0];

  try {
    const codeFileName = "code.bf";
    const codePath = path.join(tmpDir, codeFileName);
    await fs.writeFile(codePath, code, "utf8");

    const scriptLines: string[] = [];
    for (const tc of testCases) {
      const base = String(tc.id);
      const inputPath = path.join(tmpDir, `INPUT_${base}`);
      await fs.writeFile(inputPath, tc.input, "utf8");

      scriptLines.push(
        `${cmd} /volume/${codeFileName} < /volume/INPUT_${base} > /volume/OUTPUT_${base} 2>/volume/ERR_${base}; echo $? > /volume/EXIT_${base}`,
      );
    }

    const scriptPath = path.join(tmpDir, "run_all.sh");
    await fs.writeFile(scriptPath, scriptLines.join("\n"), { mode: 0o755 });

    const container = await docker.createContainer({
      Image: image,
      Cmd: ["sh", "/volume/run_all.sh"],
      HostConfig: {
        Binds: [`${tmpDir}:/volume:rw`],
      },
    });

    const start = Date.now();
    await container.start();
    await container.wait();
    const end = Date.now();
    await container.remove({ force: true });

    const results: Record<number, DockerResult> = {};
    for (const tc of testCases) {
      const base = String(tc.id);
      const outPath = path.join(tmpDir, `OUTPUT_${base}`);
      const errPath = path.join(tmpDir, `ERR_${base}`);
      const exitPath = path.join(tmpDir, `EXIT_${base}`);

      const [stdoutBuf, stderrBuf, exitText] = await Promise.all([
        fs.readFile(outPath).catch(() => Buffer.alloc(0)),
        fs.readFile(errPath).catch(() => Buffer.alloc(0)),
        fs.readFile(exitPath, "utf8").catch(() => "-1"),
      ]);

      const exitCode = parseInt(String(exitText).trim(), 10);
      results[tc.id] = {
        stdout: stdoutBuf.toString("utf8"),
        stderr: stderrBuf.toString("utf8"),
        exitCode: Number.isNaN(exitCode) ? -1 : exitCode,
        durationMs: end - start,
      };
    }
    return results;
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true });
  }
}
