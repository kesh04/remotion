import {useCallback, useMemo} from 'react';
import type {JSONPath} from './zod-types';
import {ZodSwitch} from './ZodSwitch';

export const ZodArrayItemEditor: React.FC<{
	jsonPath: JSONPath;
	onChange: (
		updater: (oldV: unknown[]) => unknown[],
		incrementRevision: boolean
	) => void;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	def: any;
	index: number;
	value: unknown;
	compact: boolean;
	defaultValue: unknown;
	onSave: (updater: (oldState: unknown[]) => unknown[]) => void;
	showSaveButton: boolean;
	saving: boolean;
	saveDisabledByParent: boolean;
}> = ({
	def,
	onChange,
	jsonPath,
	index,
	value,
	compact,
	defaultValue,
	onSave: onSaveObject,
	showSaveButton,
	saving,
	saveDisabledByParent,
}) => {
	const onRemove = useCallback(() => {
		onChange(
			(oldV) => [...oldV.slice(0, index), ...oldV.slice(index + 1)],
			true
		);
	}, [index, onChange]);

	const setValue = useCallback(
		(val: ((newV: unknown) => unknown) | unknown) => {
			onChange(
				(oldV) => [
					...oldV.slice(0, index),
					typeof val === 'function' ? val(oldV[index]) : val,
					...oldV.slice(index + 1),
				],
				false
			);
		},
		[index, onChange]
	);

	const newJsonPath = useMemo(() => [...jsonPath, index], [index, jsonPath]);

	const onSave = useCallback(
		(updater: (oldState: unknown) => unknown) => {
			onSaveObject((oldV) => [
				...oldV.slice(0, index),
				updater(oldV[index]),
				...oldV.slice(index + 1),
			]);
		},
		[index, onSaveObject]
	);

	return (
		<ZodSwitch
			jsonPath={newJsonPath}
			schema={def.type}
			value={value}
			setValue={setValue}
			compact={compact}
			defaultValue={defaultValue}
			onSave={onSave}
			showSaveButton={showSaveButton}
			onRemove={onRemove}
			saving={saving}
			saveDisabledByParent={saveDisabledByParent}
		/>
	);
};
