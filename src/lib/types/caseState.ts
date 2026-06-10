export type TrainState = 'unlearned' | 'learning' | 'finished';
export const TRAIN_STATES: readonly TrainState[] = ['unlearned', 'learning', 'finished'];

export interface AlgorithmSelection {
	left: number | null;
	right: number | null;
}
export interface CustomAlgorithm {
	left: string;
	right: string;
}
export interface CaseState {
	trainState: TrainState;
	inPool: boolean;
	algorithmSelection: AlgorithmSelection;
	customAlgorithm: CustomAlgorithm;
	identicalAlgorithm: boolean;
	lastModified: number;
	// alg ordering/visibility (shared between left/right, indices into algPool)
	algOrder: number[];    // ordered list of algPool indices
	algHidden: number[];   // algPool indices that are hidden
	algStarred: number[];  // algPool indices that are starred
}
