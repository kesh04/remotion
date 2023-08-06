import {
	getIdealMaximumFrameCacheItems,
	startLongRunningCompositor,
} from './compositor/compositor';
import type {GetSilentPartsResponse} from './compositor/payloads';
import type {LogLevel} from './log-level';

export const getSilentParts = async ({
	src,
	noiseThresholdInDecibels: passednoiseThresholdInDecibels,
	minDuration: passedMinDuration,
	logLevel,
}: {
	src: string;
	minDuration?: number;
	logLevel?: LogLevel;
	noiseThresholdInDecibels?: number;
}): Promise<GetSilentPartsResponse> => {
	const compositor = startLongRunningCompositor(
		getIdealMaximumFrameCacheItems(),
		logLevel ?? 'info',
		false
	);

	const minDuration = passedMinDuration ?? 1;

	if (typeof minDuration !== 'number') {
		throw new Error(`minDuration must be a number, but was ${minDuration}`);
	}

	if (minDuration <= 0) {
		throw new Error(
			`minDuration must be greater than 0, but was ${minDuration}`
		);
	}

	const noiseThresholdInDecibels = passednoiseThresholdInDecibels ?? -20;

	if (typeof noiseThresholdInDecibels !== 'number') {
		throw new Error(
			`noiseThresholdInDecibels must be a number, but was ${noiseThresholdInDecibels}`
		);
	}

	if (noiseThresholdInDecibels >= 30) {
		throw new Error(
			`noiseThresholdInDecibels must be less than 30, but was ${noiseThresholdInDecibels}`
		);
	}

	const res = await compositor.executeCommand('GetSilences', {
		src,
		minDuration,
		noiseThresholdInDecibels,
	});

	const response = JSON.parse(res.toString('utf-8')) as GetSilentPartsResponse;

	compositor.finishCommands();
	await compositor.waitForDone();
	return response;
};
