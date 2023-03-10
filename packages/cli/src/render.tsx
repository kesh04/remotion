// eslint-disable-next-line no-restricted-imports
import {ConfigInternals} from './config';
import {convertEntryPointToServeUrl} from './convert-entry-point-to-serve-url';
import {findEntryPoint} from './entry-point';
import {getResolvedAudioCodec} from './get-audio-codec';
import {getCliOptions} from './get-cli-options';
import {Log} from './log';
import {parsedCli, quietFlagProvided} from './parse-command-line';
import {renderCompFlow} from './render-flows/render';

export const render = async (remotionRoot: string, args: string[]) => {
	const {
		file,
		remainingArgs,
		reason: entryPointReason,
	} = findEntryPoint(args, remotionRoot);

	if (!file) {
		Log.error('No entry point specified. Pass more arguments:');
		Log.error(
			'   npx remotion render [entry-point] [composition-name] [out-name]'
		);
		Log.error('Documentation: https://www.remotion.dev/docs/render');
		process.exit(1);
	}

	const fullEntryPoint = convertEntryPointToServeUrl(file);

	if (parsedCli.frame) {
		Log.error(
			'--frame flag was passed to the `render` command. This flag only works with the `still` command. Did you mean `--frames`? See reference: https://www.remotion.dev/docs/cli/'
		);
		process.exit(1);
	}

	const {
		concurrency,
		frameRange,
		shouldOutputImageSequence,
		overwrite,
		inputProps,
		envVariables,
		quality,
		browser,
		browserExecutable,
		scale,
		chromiumOptions,
		port,
		everyNthFrame,
		puppeteerTimeout,
		publicDir,
		height,
		width,
		crf,
		ffmpegOverride,
		audioBitrate,
		muted,
		enforceAudioTrack,
		proResProfile,
		pixelFormat,
		videoBitrate,
		numberOfGifLoops,
	} = await getCliOptions({
		isLambda: false,
		type: 'series',
		remotionRoot,
	});

	const audioCodec = getResolvedAudioCodec();

	const jobCleanups: (() => void)[] = [];
	try {
		await renderCompFlow({
			fullEntryPoint,
			remotionRoot,
			browserExecutable,
			indent: false,
			logLevel: ConfigInternals.Logging.getLogLevel(),
			browser,
			chromiumOptions,
			scale,
			shouldOutputImageSequence,
			publicDir,
			envVariables,
			inputProps,
			puppeteerTimeout,
			port,
			height,
			width,
			remainingArgs,
			compositionIdFromUi: null,
			entryPointReason,
			overwrite,
			quiet: quietFlagProvided(),
			concurrency,
			everyNthFrame,
			frameRange,
			quality,
			onProgress: () => undefined,
			addCleanupCallback: (c) => {
				jobCleanups.push(c);
			},
			outputLocationFromUI: null,
			uiCodec: null,
			// TODO: Check if none makes sense here
			uiImageFormat: 'none',
			cancelSignal: null,
			crf,
			ffmpegOverride,
			audioBitrate,
			muted,
			enforceAudioTrack,
			proResProfile,
			pixelFormat,
			videoBitrate,
			numberOfGifLoops,
			audioCodec,
		});
	} finally {
		await Promise.all(jobCleanups.map((c) => c()));
	}
};
