import { casesState } from './casesState.svelte';
import { appSettings } from '$lib/appSettings.svelte';
import TrainCase, { gernerateTrainCases } from './trainCases';
import { GROUP_DEFINITIONS, type GroupId } from './types/group';

export const trainCaseQueue = $state<TrainCase[]>([]);

export const trainState: {
	index: number;
	current: TrainCase | undefined;
} = $state({
	index: 0,
	current: undefined,
});

export function getNumberOfSelectedCases(): number {
	let count = 0;
	for (const groupId of Object.keys(GROUP_DEFINITIONS) as GroupId[]) {
		const groupCaseStates = casesState[groupId];
		for (const caseIdStr of Object.keys(groupCaseStates)) {
			const caseId = Number(caseIdStr);
			if (Number.isNaN(caseId)) continue;
			if (casesState[groupId][caseId].inPool) count++;
		}
	}
	return count;
}

export function regenerateTrainCaseQueue(): number {
	const cases = gernerateTrainCases();
	trainCaseQueue.length = 0;
	trainCaseQueue.push(...cases);
	trainState.index = 0;
	if (trainCaseQueue.length > 0) {
		trainState.current = trainCaseQueue[0];
	} else {
		trainState.current = undefined;
	}
	return trainCaseQueue.length;
}

export function advanceToNextTrainCase() {
	// Skip cases that are no longer in pool (user may have changed pool during session)
	let next = trainState.index + 1;

	// Scan forward for a valid case
	while (true) {
		if (next >= trainCaseQueue.length) {
			// Refill queue
			const newCases = gernerateTrainCases();
			if (newCases.length === 0) {
				trainState.current = undefined;
				return;
			}
			trainCaseQueue.push(...newCases);
		}
		const candidate = trainCaseQueue[next];
		if (candidate && casesState[candidate.groupId][candidate.caseId]?.inPool) {
			break; // Found a valid case
		}
		next++;
	}

	trainState.index = next;
	trainState.current = trainCaseQueue[trainState.index];
}

export function advanceToPreviousTrainCase() {
	const prev = trainState.index - 1;
	if (prev >= 0) {
		trainState.index = prev;
		trainState.current = trainCaseQueue[trainState.index];
	}
}
