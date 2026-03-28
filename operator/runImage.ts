import path from "path";
import Docker from "dockerode";

const docker = new Docker();

/**
 * code.bf を含むディレクトリをコンテナにマウントして実行する。
 * Docker Hub の例:
 *   docker run --rm -v "$PWD":/code:ro esolang/brainfuck-esomer brainfuck-esomer /code/hello.bf
 */
export async function runBrainfuckImage(
	image: string,
	codePath: string,
): Promise<void> {
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

	stream.on("data", (chunk: Buffer) => {
		process.stdout.write(chunk);
	});

	await container.start();

	const result = await container.wait();
	console.log("\ncontainer exited with status", result.StatusCode);

	await container.remove({ force: true });
}

async function main() {
	// usage:
	//   npx tsx operator/runImage.ts esolang/brainfuck-esomer ./code.bf
	const [, , imageArg, codePathArg] = process.argv;
	const image = imageArg ?? "esolang/brainfuck-esomer";
	const codePath = codePathArg ?? "code.bf";

	console.log("Running image:", image);
	console.log("with code:", codePath);

	await runBrainfuckImage(image, codePath);
}

if (import.meta.url === `file://${process.argv[1]}`) {
	main().catch((err) => {
		console.error(err);
		process.exit(1);
	});
}

