import {generateServiceName} from '../shared/generate-service-name';
import {validateGcpRegion} from '../shared/validate-gcp-region';
import {validateImageRemotionVersion} from '../shared/validate-image-remotion-version';
import {validateProjectID} from '../shared/validate-project-id';
import {checkIfServiceExists} from './check-if-service-exists';
import {constructServiceTemplate} from './helpers/construct-service-deploy-request';
import {getCloudRunClient} from './helpers/get-cloud-run-client';

export type DeployServiceInput = {
	remotionVersion: string;
	performImageVersionValidation?: boolean;
	memoryLimit?: string;
	cpuLimit?: string;
	timeoutSeconds?: number;
	projectID: string;
	region: string;
};

export type DeployServiceOutput = {
	fullName: string | null | undefined;
	shortName: string | null | undefined;
	uri: string | null | undefined;
	alreadyExists: boolean;
};

/**
 * @description Creates a Cloud Run service in your project that will be able to render a video in GCP.
 * @link https://remotion.dev/docs/lambda/deployfunction
 * @param remotionVersion Which version of Remotion to use within the Cloud Run service.
 * @param projectID GCP Project ID to deploy the Cloud Run service to.
 * @param region The region you want to deploy your Cloud Run service to.
 * @returns {Promise<IService>} An object that contains the `functionName` property
 */
export const deployService = async ({
	remotionVersion,
	performImageVersionValidation = true, // default value set here
	memoryLimit,
	cpuLimit,
	timeoutSeconds,
	projectID,
	region,
}: DeployServiceInput): Promise<DeployServiceOutput> => {
	validateGcpRegion(region);
	validateProjectID(projectID);
	if (performImageVersionValidation) {
		validateImageRemotionVersion(remotionVersion);
	}

	if (!memoryLimit) {
		memoryLimit = '512Mi';
	}

	if (!cpuLimit) {
		cpuLimit = '1.0';
	}

	if (!timeoutSeconds) {
		timeoutSeconds = 300;
	}

	const parent = `projects/${projectID}/locations/${region}`;

	const cloudRunClient = getCloudRunClient();

	const existingService = await checkIfServiceExists({
		remotionVersion,
		memoryLimit,
		cpuLimit,
		timeoutSeconds,
		projectID,
		region,
	});

	const serviceName = generateServiceName({
		memoryLimit,
		cpuLimit,
		timeoutSeconds,
		remotionVersion,
	});

	if (existingService) {
		return {
			fullName: `projects/remotion-6/locations/${region}/services/${serviceName}`,
			shortName: serviceName,
			uri: null,
			alreadyExists: true,
		};
	}

	const request = {
		parent,
		service: {
			// service structure: https://googleapis.dev/nodejs/run/latest/google.cloud.run.v2.IService.html
			template: constructServiceTemplate({
				remotionVersion,
				memoryLimit,
				cpuLimit,
				timeoutSeconds,
			}),
		},
		serviceId: serviceName,
	};

	// Run request
	const [operation] = await cloudRunClient.createService(request);
	const [response] = await operation.promise();

	return {
		fullName: response.name,
		shortName: serviceName,
		uri: response.uri,
		alreadyExists: false,
	};
};
