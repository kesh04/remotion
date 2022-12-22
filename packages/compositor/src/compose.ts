import {spawn} from 'child_process';
import {getExecutablePath} from './get-executable-path';
import type {CliInput, Layer} from './payload';

export const compose = ({
	height,
	width,
	layers,
	output,
}: {
	height: number;
	width: number;
	layers: Layer[];
	output: string;
}) => {
	const bin = getExecutablePath();

	const payload: CliInput = {
		v: 1,
		height,
		width,
		layers,
		output,
	};

	// TODO: Don't use sync
	// TODO: Get error message
	return new Promise<void>((resolve, reject) => {
		const child = spawn(bin);
		child.stdin.write(JSON.stringify(payload));
		child.stdin.end();

		child.on('close', (code) => {
			if (code === 0) {
				resolve();
			} else {
				reject(new Error(`Closed with code ${code}`));
			}
		});
	});
};
