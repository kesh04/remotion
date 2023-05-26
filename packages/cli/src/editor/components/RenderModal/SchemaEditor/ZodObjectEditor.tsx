import React, {useMemo} from 'react';
import type {z} from 'zod';
import {INPUT_BORDER_COLOR_UNHOVERED} from '../../../helpers/colors';
import {useZodIfPossible} from '../../get-zod-if-possible';
import {optionRow} from '../layout';
import {SchemaFieldsetLabel} from './SchemaLabel';
import type {JSONPath} from './zod-types';
import {ZodSwitch} from './ZodSwitch';

const container: React.CSSProperties = {
	width: '100%',
};

const fullWidth: React.CSSProperties = {
	width: '100%',
};

const fieldset: React.CSSProperties = {
	borderRadius: 4,
	borderColor: INPUT_BORDER_COLOR_UNHOVERED,
};

export const ZodObjectEditor: React.FC<{
	schema: z.ZodTypeAny;
	jsonPath: JSONPath;
	value: unknown;
	defaultValue: unknown;
	setValue: (
		updater: (oldState: Record<string, unknown>) => Record<string, unknown>
	) => void;
	compact: boolean;
	onSave: (
		updater: (oldVal: Record<string, unknown>) => Record<string, unknown>
	) => void;
	showSaveButton: boolean;
	onRemove: null | (() => void);
	saving: boolean;
	saveDisabledByParent: boolean;
}> = ({
	schema,
	jsonPath,
	setValue,
	value,
	compact,
	defaultValue,
	onSave,
	showSaveButton,
	onRemove,
	saving,
	saveDisabledByParent,
}) => {
	const z = useZodIfPossible();
	if (!z) {
		throw new Error('expected zod');
	}

	const def = schema._def;

	const typeName = def.typeName as z.ZodFirstPartyTypeKind;
	if (typeName !== z.ZodFirstPartyTypeKind.ZodObject) {
		throw new Error('expected object');
	}

	const shape = def.shape();
	const keys = Object.keys(shape);

	const isRoot = jsonPath.length === 0;
	const Element = isRoot ? 'div' : 'fieldset';

	const {paddingTop} = optionRow;

	const style = useMemo((): React.CSSProperties => {
		if (isRoot) {
			return {};
		}

		return {paddingTop};
	}, [isRoot, paddingTop]);

	return (
		<div style={style}>
			<div style={fullWidth}>
				<Element style={fieldset}>
					{isRoot ? null : (
						<SchemaFieldsetLabel jsonPath={jsonPath} onRemove={onRemove} />
					)}
					<div style={isRoot ? undefined : container}>
						{keys.map((key) => {
							return (
								<ZodSwitch
									key={key}
									jsonPath={[...jsonPath, key]}
									schema={shape[key]}
									value={(value as Record<string, string>)[key]}
									// In case of null | {a: string, b: string} type, we need to fallback to the default value
									defaultValue={
										((defaultValue as Record<string, string>) ?? value)[key]
									}
									setValue={(val) => {
										setValue((oldVal) => {
											return {
												...oldVal,
												[key]:
													typeof val === 'function' ? val(oldVal[key]) : val,
											};
										});
									}}
									onSave={(val) => {
										onSave((oldVal) => {
											return {
												...oldVal,
												[key]:
													typeof val === 'function' ? val(oldVal[key]) : val,
											};
										});
									}}
									onRemove={null}
									compact={compact}
									showSaveButton={showSaveButton}
									saving={saving}
									saveDisabledByParent={saveDisabledByParent}
								/>
							);
						})}
					</div>
				</Element>
			</div>
		</div>
	);
};
