import fs from "fs/promises";
import path from "path";
import os from "os";
import Docker from "dockerode";

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
 * code.bf を含むディレクトリをコンテナにマウントして 1 回だけ実行する。
 * Docker Hub の例:
 *   docker run --rm -v "$PWD":/code:ro esolang/brainfuck-esomer brainfuck-esomer /code/hello.bf
 */
export async function runCode(
	image: string,
	codePath: string,
): Promise<DockerResult> {
	console.log("Pulling image:", image);
	const resolvedCodePath = path.resolve(codePath);
	const hostDir = path.dirname(resolvedCodePath);
	const filename = path.basename(resolvedCodePath);

	const container = await docker.createContainer({
		Image: image,
		Cmd: ["brainfuck-esomer", `/code/${filename}`],
		AttachStdout: true,
		AttachStderr: true,
		Tty: false,
		HostConfig: {
			Binds: [`${hostDir}:/code:ro`],
		},
	});

	const stream = await container.attach({
		stream: true,
		stdout: true,
		stderr: true,
	});

	const outputChunks: Buffer[] = [];
	stream.on("data", (chunk: Buffer) => {
		outputChunks.push(chunk);
		process.stdout.write(chunk);
	});

	const start = Date.now();
	await container.start();
	const result = await container.wait();
	const end = Date.now();

	console.log("\ncontainer exited with status", result.StatusCode);

	await container.remove({ force: true });

	return {
		stdout: Buffer.concat(outputChunks).toString("utf8"),
		stderr: "",
		exitCode: result.StatusCode ?? -1,
		durationMs: end - start,
	};
}

/**
 * 1 つのコンテナ内で複数のテストケースを順番に実行する。
 * 各テストケースの input をファイル経由で渡し、出力/終了コードを per testCase で返す。
 */
export async function runAllTestCasesInSingleContainer(
	image: string,
	codePath: string,
	testCases: TestCaseWithIO[],
): Promise<Record<number, DockerResult>> {
	const resolvedCodePath = path.resolve(codePath);
	const hostCodeDir = path.dirname(resolvedCodePath);
	const codeFileName = path.basename(resolvedCodePath);

	const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "esolang-tests-"));

	try {
		const scriptLines: string[] = [];

		for (const tc of testCases) {
			const base = String(tc.id);
			const inputPath = path.join(tmpDir, `INPUT_${base}`);
			await fs.writeFile(inputPath, tc.input, "utf8");

			scriptLines.push(
				`brainfuck-esomer /code/${codeFileName} < /volume/INPUT_${base} > /volume/OUTPUT_${base} 2>/volume/ERR_${base}; echo $? > /volume/EXIT_${base}`,
			);
		}

		const scriptPath = path.join(tmpDir, "run_all.sh");
		await fs.writeFile(scriptPath, scriptLines.join("\n"), { mode: 0o755 });

		const container = await docker.createContainer({
			Image: image,
			Cmd: ["sh", "/volume/run_all.sh"],
			AttachStdout: true,
			AttachStderr: true,
			Tty: false,
			HostConfig: {
				Binds: [
					`${hostCodeDir}:/code:ro`,
					`${tmpDir}:/volume:rw`,
				],
			},
		});

		const stream = await container.attach({
			stream: true,
			stdout: true,
			stderr: true,
		});

		stream.on("data", (chunk: Buffer) => {
			process.stdout.write(chunk);
		});

		const start = Date.now();
		await container.start();
		const waitResult = await container.wait();
		const end = Date.now();

		console.log("\ncontainer exited with status", waitResult.StatusCode);

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

async function main() {
	// usage:
	//   npx tsx operator/runCode.ts esolang/brainfuck-esomer ./code.bf
	const [, , imageArg, codePathArg] = process.argv;
	const image = imageArg ?? "esolang/brainfuck-esomer";
	const codePath = codePathArg ?? "code.bf";

	console.log("Running image:", image);
	console.log("with code:", codePath);

	await runCode(image, codePath);
}

if (import.meta.url === `file://${process.argv[1]}`) {
	main().catch((err) => {
		console.error(err);
		process.exit(1);
	});
}
