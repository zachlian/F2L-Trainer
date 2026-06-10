import { GROUP_DEFINITIONS, type GroupId } from './types/group';
import {
	OPPOSITE_COLOR,
	SIDE_COLOR,
	type StickerColor,
	type StickerHidden
} from './types/stickering';
import { casesStatic } from './casesStatic';
import { casesState, getCaseScramblePool } from './casesState.svelte';
import type { Side } from '$lib/types/Side';
import { AUF, type Auf } from './types/trainCase';
import shuffleArray from './utils/shuffleArray';



import { appSettings } from '$lib/appSettings.svelte';

export function gernerateTrainCases(): TrainCase[] {
	// console.log('gernerateTrainCases() called');
	const result: TrainCase[] = [];

	const trainSideSelection = appSettings.trainSideSelection;
	const crossColor = appSettings.crossColor as any;
	const frontColor = appSettings.frontColor as any;

	// Collect all candidates first
	const candidates: { groupId: GroupId; caseId: number; side: Side }[] = [];

	for (const groupId of Object.keys(GROUP_DEFINITIONS) as GroupId[]) {
		const groupCaseStates = casesState[groupId];

		for (const caseIdStr of Object.keys(groupCaseStates)) {
			const caseId = Number(caseIdStr);
			if (Number.isNaN(caseId)) continue;

			// Only include cases that are in the pool
			const caseState = groupCaseStates[caseId];
			if (!caseState.inPool) continue;

			if (trainSideSelection.right) candidates.push({ groupId, caseId, side: 'right' });
			if (trainSideSelection.left) candidates.push({ groupId, caseId, side: 'left' });
		}
	}

	if (candidates.length === 0) return result;

	// Uniform weights
	let weights: number[] = new Array(candidates.length).fill(1);


	// Generate result array based on weights
	for (let i = 0; i < candidates.length; i++) {
		const candidate = candidates[i];
		const weight = Math.round(weights[i]);

		for (let k = 0; k < weight; k++) {
			result.push(
				new TrainCase(candidate.groupId, candidate.caseId, candidate.side, crossColor, frontColor)
			);
		}
	}

	console.log(`Generated ${result.length} cases from ${candidates.length} unique candidates.`);

	shuffleArray(result);
	return result;
}

export default class TrainCase {
	#groupId: GroupId;
	#caseId: number;
	#side: Side;
	#crossColor: StickerColor;
	#frontColor: StickerColor;
	#stickerHidden: StickerHidden;
	#scrambleSelection: number;
	#auf: Auf;
	#solved: boolean = false;
	#time: number | null | undefined = undefined;
	#solveId: string | undefined = undefined;

	constructor(
		groupId: GroupId,
		caseId: number,
		side: Side,
		crossColors: StickerColor[],
		frontColors: StickerColor[],
		options?: {
			scrambleSelection?: number;
			auf?: Auf;
			solveId?: string;
			time?: number | null;
		}
	) {
		this.#groupId = groupId;
		this.#caseId = caseId;
		this.#side = side;
		this.#crossColor = 'white';
		this.#frontColor = 'red';
		this.#scrambleSelection = 0;
		this.#auf = '';

		this.#stickerHidden = casesStatic[groupId][caseId].pieceToHide;

		if (options?.scrambleSelection !== undefined) {
			this.#scrambleSelection = options.scrambleSelection;
		} else {
			this.setRandomScramble();
		}

		if (options?.auf !== undefined) {
			this.#auf = options.auf;
		} else {
			this.setAuf();
		}

		if (options?.solveId !== undefined) {
			this.#solveId = options.solveId;
		}

		if (options?.time !== undefined) {
			this.#time = options.time;
		}

		this.setCrossAndFrontColor(crossColors, frontColors);
	}

	private setRandomScramble() {
		const staticData = casesStatic[this.#groupId][this.#caseId];
		const scramblePool = getCaseScramblePool(staticData);
		this.#scrambleSelection = Math.floor(Math.random() * scramblePool.length);
	}

	private setAuf() {
		if (appSettings.trainAddAuf === false)
			return; // Do nothing if user selected no AUF

		const staticData = casesStatic[this.#groupId][this.#caseId];
		if (staticData.ignoreAUF) return; // Do nothing if case doesn't need AUF

		const aufIndex = Math.floor(Math.random() * AUF.length);
		this.#auf = AUF[aufIndex];
	}

	private setCrossAndFrontColor(crossColors: StickerColor[], frontColors: StickerColor[]) {
		// Generate all valid pairs
		const validPairs: [StickerColor, StickerColor][] = [];

		for (const cross of crossColors) {
			// If frontColors is empty, consider ALL valid neighbors
			const potentialFrontColors =
				frontColors.length > 0 ? frontColors : (Object.keys(SIDE_COLOR[cross]) as StickerColor[]);

			for (const front of potentialFrontColors) {
				if (cross !== front && OPPOSITE_COLOR[cross] !== front) {
					validPairs.push([cross, front]);
				}
			}
		}

		if (validPairs.length > 0) {
			// Pick a random valid pair
			const [selectedCross, selectedFront] =
				validPairs[Math.floor(Math.random() * validPairs.length)];
			this.#crossColor = selectedCross;
			this.#frontColor = selectedFront;
		} else {
			// Fallback (should be prevented by validation)
			this.#crossColor = 'white';
			this.#frontColor = 'red';
		}
	}

	get groupId() {
		return this.#groupId;
	}
	get caseId() {
		return this.#caseId;
	}
	get side() {
		return this.#side;
	}
	get crossColor() {
		return this.#crossColor;
	}
	get frontColor() {
		return this.#frontColor;
	}
	get stickerHidden() {
		return this.#stickerHidden;
	}
	get scramble() {
		return this.#scrambleSelection;
	}
	get auf() {
		return this.#auf;
	}
	get solved() {
		return this.#solved;
	}
	set solved(value: boolean) {
		this.#solved = value;
	}
	get time() {
		return this.#time;
	}
	set time(value: number | null | undefined) {
		this.#time = value;
	}
	get solveId() {
		return this.#solveId;
	}
	set solveId(value: string | undefined) {
		this.#solveId = value;
	}
}
