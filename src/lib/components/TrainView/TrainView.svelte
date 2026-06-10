<script lang="ts">
	import {
		advanceToNextTrainCase,
		advanceToPreviousTrainCase,
		getNumberOfSelectedCases,
		regenerateTrainCaseQueue,
		trainState
	} from '$lib/trainCaseQueue.svelte';
	import { casesState, getCaseAlg } from '$lib/casesState.svelte';
	import { casesStatic } from '$lib/casesStatic';
	import TwistyPlayer from '../TwistyPlayer.svelte';
	import CaseEditModal from '../SelectView/CaseEditModal.svelte';
	import { tick, onMount } from 'svelte';
	import type { TrainState, AlgorithmSelection } from '$lib/types/caseState';
	import { appSettings } from '$lib/appSettings.svelte';

	const TWISTY_INIT_DELAY = 120;

	let twistyPlayerRef = $state<TwistyPlayer>();
	let algViewerContainer = $state<HTMLElement>();
	let twistyAlgViewerLoaded = $state(false);
	let showAlg = $state(false);
	let editModalRef = $state<CaseEditModal>();

	let scramble = $state('');
	let alg = $state('');

	// Local algorithmSelection — drives TwistyPlayer
	let activeAlgorithmSelection = $state<AlgorithmSelection>({ left: 0, right: 0 });
	let activeAlgIndex = $state(0);

	let currentTrainCase = $derived(trainState.current);
	let currentCaseState = $derived(
		currentTrainCase ? casesState[currentTrainCase.groupId][currentTrainCase.caseId] : undefined
	);
	let currentStaticData = $derived(
		currentTrainCase ? casesStatic[currentTrainCase.groupId][currentTrainCase.caseId] : undefined
	);

	// Algs displayed to user — ordered, filtered, using getCaseAlg for exact match with TwistyPlayer
	let allAlgs = $derived.by(() => {
		if (!currentStaticData || !currentTrainCase || !currentCaseState) return [];
		const poolSize = currentStaticData.algPool?.length ?? 0;
		const savedOrder: number[] = currentCaseState.algOrder ?? [];
		const hidden = new Set<number>(currentCaseState.algHidden ?? []);
		const seen = new Set(savedOrder);
		const fullOrder = [
			...savedOrder.filter(i => i < poolSize),
			...Array.from({length: poolSize}, (_, i) => i).filter(i => !seen.has(i))
		];
		const starred = new Set<number>(currentCaseState.algStarred ?? []);
		return fullOrder
			.filter(i => !hidden.has(i))
			.map(i => ({
				poolIndex: i,
				alg: getCaseAlg(
					currentStaticData!,
					{ left: i, right: i },
					{ left: '', right: '' },
					currentTrainCase!.side
				),
				starred: starred.has(i),
			}));
	});

	const STATUS_INFO: Record<TrainState, { label: string; cls: string }> = {
		unlearned: { label: 'Not started', cls: 'badge-unseen' },
		learning:  { label: 'Learning',    cls: 'badge-learning' },
		finished:  { label: 'Learned',     cls: 'badge-learned' },
	};

	let statusInfo = $derived.by(() => {
		if (!currentTrainCase || !currentCaseState) return null;
		return STATUS_INFO[currentCaseState.trainState];
	});

	// Reset when case changes
	$effect(() => {
		void currentTrainCase;
		activeAlgIndex = 0;
		activeAlgorithmSelection = { left: 0, right: 0 };
		showAlg = false;
		twistyAlgViewerLoaded = false;
	});

	async function onNext() {
		advanceToNextTrainCase();
		await tick();
		setTimeout(mountAlgViewer, TWISTY_INIT_DELAY);
	}

	function onPrevious() { advanceToPreviousTrainCase(); }

	function handleKeydown(e: KeyboardEvent) {
		const active = document.activeElement;
		const isTyping = active?.tagName === 'INPUT' || active?.tagName === 'TEXTAREA';
		const isModal = document.querySelector('[role="dialog"]') !== null;
		if (isTyping || isModal) return;
		if (e.code === 'Space' || e.code === 'ArrowRight') { e.preventDefault(); onNext(); }
		if (e.code === 'ArrowLeft') { e.preventDefault(); onPrevious(); }
	}

	async function mountAlgViewer() {
		await tick();
		if (!twistyPlayerRef || !algViewerContainer) return;
		try {
			const { TwistyAlgViewer } = await import('cubing/twisty');
			const el = twistyPlayerRef.getElement?.();
			if (el && algViewerContainer) {
				algViewerContainer.innerHTML = '';
				algViewerContainer.appendChild(new TwistyAlgViewer({ twistyPlayer: el }));
				twistyAlgViewerLoaded = true;
			}
		} catch (e) { console.error('TwistyAlgViewer:', e); }
	}

	async function selectAndPlayAlg(poolIndex: number) {
		if (!currentTrainCase) return;
		activeAlgIndex = poolIndex;
		activeAlgorithmSelection = { ...activeAlgorithmSelection, [currentTrainCase.side]: poolIndex };
		await tick();
		setTimeout(async () => {
			twistyPlayerRef?.jumpToStart();
			setTimeout(() => twistyPlayerRef?.play(), 80);
			setTimeout(mountAlgViewer, 160);
		}, 60);
	}

	async function handleShowAlg() {
		showAlg = true;
		await tick();
		setTimeout(mountAlgViewer, TWISTY_INIT_DELAY);
	}

	onMount(async () => {
		regenerateTrainCaseQueue();
		await tick();
		setTimeout(mountAlgViewer, TWISTY_INIT_DELAY);
	});
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="train-wrap">
	{#if getNumberOfSelectedCases() === 0}
		<div class="empty-state">
			<p>No cases in pool.</p>
			<p class="sub">Go back to Cases and right-click cards to add them to your pool.</p>
		</div>

	{:else if currentTrainCase}
		<!-- Scramble row with status/edit flanking -->
		<div class="scramble-row">
			{#if statusInfo}
				<span class="status-pill {statusInfo.cls}">{statusInfo.label}</span>
			{:else}
				<span></span>
			{/if}
			<span class="scramble-text">{scramble}</span>
			<button class="edit-pill" onclick={() => editModalRef?.openModal()}>Edit case</button>
		</div>

		<!-- 3D cube -->
		<div class="cube-wrap">
			<TwistyPlayer
				bind:this={twistyPlayerRef}
				bind:scramble
				bind:alg
				groupId={currentTrainCase.groupId}
				caseId={currentTrainCase.caseId}
				algorithmSelection={activeAlgorithmSelection}
				customAlgorithm={currentCaseState?.customAlgorithm}
				auf={currentTrainCase.auf}
				side={currentTrainCase.side}
				crossColor={currentTrainCase.crossColor}
				frontColor={currentTrainCase.frontColor}
				scrambleSelection={currentTrainCase.scramble}
				stickering="f2l"
				experimentalDragInput="auto"
				controlPanel="bottom-row"
				tempoScale={appSettings.tempoScale}
				class="cube-player"
			/>
		</div>

		<!-- Show Alg -->
		{#if !showAlg}
			<button class="show-alg-btn" onclick={handleShowAlg}>Show Algorithm</button>
		{:else}
			<div class="alg-card">
				<!-- Alg viewer FIRST -->
				<div
					bind:this={algViewerContainer}
					class="alg-viewer"
					class:hidden={!twistyAlgViewerLoaded}
				></div>

				<div class="alg-label">All Algorithms</div>
				<div class="alg-list">
					{#each allAlgs as item, i}
						<button
							class="alg-row"
							class:active={activeAlgIndex === item.poolIndex}
							onclick={() => selectAndPlayAlg(item.poolIndex)}
						>
							<span class="alg-index">{i + 1}</span>
							<span class="alg-str" class:starred={item.starred}>{item.alg}</span>
							<span class="play-icon">▶</span>
						</button>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Next -->
		<button class="next-btn" onclick={onNext}>Next →</button>
	{/if}
</div>

{#if currentTrainCase}
	<CaseEditModal
		bind:this={editModalRef}
		groupId={currentTrainCase.groupId}
		caseId={currentTrainCase.caseId}
	/>
{/if}

<style>
	.train-wrap {
		max-width: 600px;
		margin: 0 auto;
		padding: 32px 24px 80px;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 22px;
	}
	.empty-state {
		text-align: center; padding: 80px 20px;
		color: var(--text2); font-size: 1.1rem;
	}
	.empty-state .sub { font-size: 0.9rem; margin-top: 10px; color: var(--text3); }

	.scramble-row {
		display: flex; align-items: center;
		justify-content: space-between;
		gap: 10px; width: 100%;
	}
	.scramble-text {
		flex: 1; text-align: center;
		font-family: "SF Mono", Monaco, Menlo, Consolas, monospace;
		font-size: 1.05rem; font-weight: 500; color: var(--text);
		line-height: 1.7; word-break: break-all;
	}

	.cube-wrap { width: 100%; max-width: 380px; }
	:global(.cube-player) { width: 100%; height: 340px; }

	.show-alg-btn {
		width: 100%; padding: 15px; background: transparent;
		border: 1px solid var(--border2); border-radius: var(--radius);
		color: var(--text2); font-size: 1.05rem; font-weight: 500;
		cursor: pointer; transition: all .15s;
	}
	.show-alg-btn:hover { background: var(--bg3); color: var(--text); }

	.alg-card {
		width: 100%; background: var(--bg2);
		border: 1px solid var(--border); border-radius: var(--radius-lg);
		padding: 18px; display: flex; flex-direction: column; gap: 14px;
	}
	.alg-viewer { width: 100%; }
	.alg-viewer.hidden { display: none; }

	.alg-label {
		font-size: 0.75rem; font-weight: 700;
		color: var(--text3); text-transform: uppercase; letter-spacing: .1em;
	}
	.alg-list { display: flex; flex-direction: column; gap: 4px; }
	.alg-row {
		display: flex; align-items: center; gap: 10px;
		padding: 10px 12px; border-radius: var(--radius);
		border: 1px solid transparent; background: transparent;
		cursor: pointer; transition: all .12s;
		text-align: left; width: 100%;
	}
	.alg-row:hover { background: var(--bg3); border-color: var(--border2); }
	.alg-row.active { background: var(--bg3); border-color: var(--accent); }
	.alg-index { font-size: 0.78rem; color: var(--text3); min-width: 16px; flex-shrink: 0; }
	.alg-str {
		flex: 1; font-family: "SF Mono", Monaco, Menlo, Consolas, monospace;
		font-size: 1rem; color: var(--text); line-height: 1.5; word-break: break-all;
		transition: color .12s;
	}
	.alg-str.starred { color: #ffc759; }
	.alg-row:hover .alg-str { color: var(--accent); }
	.play-icon { font-size: 0.7rem; color: var(--text3); flex-shrink: 0; transition: color .12s; }
	.alg-row:hover .play-icon, .alg-row.active .play-icon { color: var(--accent); }

	.next-btn {
		width: 100%; padding: 15px; background: var(--accent); color: #000;
		border: none; border-radius: var(--radius);
		font-size: 1.1rem; font-weight: 700; cursor: pointer; transition: opacity .15s;
	}
	.next-btn:hover { opacity: .85; }

	/* Footer — status left, edit right, centred around midline */
	.case-footer {
		width: 100%;
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 10px;
	}
	.status-pill {
		justify-self: end;
		padding: 6px 16px; border-radius: 20px;
		font-size: 0.82rem; font-weight: 600; border: 1px solid;
		cursor: default; white-space: nowrap;
	}
	.badge-learned  { background: var(--green-bg); color: var(--green-text); border-color: var(--green); }
	.badge-learning { background: var(--amber-bg); color: var(--amber-text); border-color: var(--amber); }
	.badge-unseen   { background: var(--bg3);       color: var(--text3);      border-color: var(--border2); }
	.edit-pill {
		justify-self: start;
		padding: 6px 16px; border-radius: 20px;
		font-size: 0.82rem; font-weight: 600;
		border: 1px solid var(--border2);
		background: transparent; color: var(--text2);
		cursor: pointer; transition: all .15s; white-space: nowrap;
	}
	.edit-pill:hover { background: var(--bg3); color: var(--text); }
</style>
