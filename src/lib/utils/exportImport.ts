import { casesState, CASES_STATE_STORAGE_KEY } from '$lib/casesState.svelte';
import { appSettings } from '$lib/appSettings.svelte';
import { saveToLocalStorage } from './localStorage';
import { GROUP_IDS, type GroupId } from '$lib/types/group';
import type { CaseId } from '$lib/types/group';

export interface ExportData {
	version: 1;
	exportedAt: string;
	settings: {
		trainAddAuf: boolean;
		crossColor: string[];
		frontColor: string[];
		tempoScale: number;
	};
	cases: Record<string, Record<string, {
		trainState: string;
		inPool: boolean;
		algorithmSelection: { left: number | null; right: number | null };
		algOrder: number[];
		algHidden: number[];
	}>>;
}

export function exportData(): string {
	const data: ExportData = {
		version: 1,
		exportedAt: new Date().toISOString(),
		settings: {
			trainAddAuf: appSettings.trainAddAuf,
			crossColor: [...appSettings.crossColor],
			frontColor: [...appSettings.frontColor],
			tempoScale: appSettings.tempoScale,
		},
		cases: {},
	};

	for (const groupId of GROUP_IDS) {
		data.cases[groupId] = {};
		for (const [caseIdStr, cs] of Object.entries(casesState[groupId])) {
			data.cases[groupId][caseIdStr] = {
				trainState: cs.trainState,
				inPool: cs.inPool,
				algorithmSelection: { ...cs.algorithmSelection },
				algOrder: [...cs.algOrder],
				algHidden: [...cs.algHidden],
				algStarred: [...(cs.algStarred ?? [])],
			};
		}
	}

	return JSON.stringify(data, null, 2);
}

export function importData(jsonStr: string): { ok: boolean; error?: string } {
	let data: ExportData;
	try {
		data = JSON.parse(jsonStr);
	} catch {
		return { ok: false, error: 'Invalid JSON file.' };
	}

	if (data.version !== 1) {
		return { ok: false, error: `Unsupported version: ${data.version}` };
	}

	// Apply settings
	if (data.settings) {
		if (typeof data.settings.trainAddAuf === 'boolean') appSettings.trainAddAuf = data.settings.trainAddAuf;
		if (Array.isArray(data.settings.crossColor)) appSettings.crossColor = data.settings.crossColor;
		if (Array.isArray(data.settings.frontColor)) appSettings.frontColor = data.settings.frontColor;
		if (typeof data.settings.tempoScale === 'number') appSettings.tempoScale = data.settings.tempoScale;
	}

	// Apply cases
	if (data.cases) {
		for (const groupId of GROUP_IDS) {
			const groupData = data.cases[groupId];
			if (!groupData) continue;
			for (const [caseIdStr, cs] of Object.entries(groupData)) {
				const caseId = Number(caseIdStr) as CaseId;
				if (!casesState[groupId]?.[caseId]) continue;
				const target = casesState[groupId][caseId];
				if (cs.trainState) target.trainState = cs.trainState as any;
				if (typeof cs.inPool === 'boolean') target.inPool = cs.inPool;
				if (cs.algorithmSelection) target.algorithmSelection = { ...cs.algorithmSelection };
				if (Array.isArray(cs.algOrder)) target.algOrder = cs.algOrder;
				if (Array.isArray(cs.algHidden)) target.algHidden = cs.algHidden;
				if (Array.isArray(cs.algStarred)) target.algStarred = cs.algStarred;
			}
		}
		saveToLocalStorage(CASES_STATE_STORAGE_KEY, casesState);
	}

	return { ok: true };
}

export function downloadJson(filename: string, content: string) {
	const blob = new Blob([content], { type: 'application/json' });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = filename;
	a.click();
	URL.revokeObjectURL(url);
}
