<script lang="ts">
	import { casesState, updateCaseState, getCaseAlg } from '$lib/casesState.svelte';
	import { casesStatic } from '$lib/casesStatic';
	import { appSettings } from '$lib/appSettings.svelte';
	import type { CaseId, GroupId } from '$lib/types/group';
	import type { TrainState, AlgorithmSelection } from '$lib/types/caseState';
	import TwistyPlayer from '$lib/components/TwistyPlayer.svelte';
	import resolveStickerColors from '$lib/utils/resolveStickerColors';
	import type { Side } from '$lib/types/Side';
	import type { StickerColor } from '$lib/types/stickering';
	import { tick } from 'svelte';

	let { groupId, caseId }: { groupId: GroupId; caseId: CaseId } = $props();

	let open = $state(false);
	let side: Side = $state('right');

	// All state is live (instant-save — no draft)
	const caseState = $derived(casesState[groupId][caseId]);
	const staticData = $derived(casesStatic[groupId][caseId]);

	const [crossColor, frontColor] = $derived(
		resolveStickerColors(
			(appSettings.crossColor ?? ['white']) as any as StickerColor[],
			(appSettings.frontColor ?? ['red']) as any as StickerColor[]
		)
	);

	const poolSize = $derived(staticData?.algPool?.length ?? 0);

	// Live alg order (from caseState, built on open)
	let liveOrder = $state<number[]>([]);

	const orderedAlgs = $derived.by(() => {
		if (!staticData) return [];
		const hidden  = new Set<number>(caseState.algHidden  ?? []);
		const starred = new Set<number>(caseState.algStarred ?? []);
		return liveOrder.map(i => ({
			poolIndex: i,
			alg: getCaseAlg(staticData, { left: i, right: i }, { left: '', right: '' }, side),
			hidden:  hidden.has(i),
			starred: starred.has(i),
		}));
	});

	// Preview selection for TwistyPlayer
	let previewSelection = $state<AlgorithmSelection>({ left: 0, right: 0 });
	const activeIndex = $derived(previewSelection[side]);

	let twistyRef = $state<TwistyPlayer>();

	export function openModal() {
		previewSelection = {
			right: caseState.algorithmSelection?.right ?? 0,
			left:  caseState.algorithmSelection?.left  ?? 0,
		};
		// Build live order from saved order
		const savedOrder = caseState.algOrder ?? [];
		const full = Array.from({ length: poolSize }, (_, i) => i);
		const seen = new Set(savedOrder);
		liveOrder = [...savedOrder.filter((i: number) => i < poolSize), ...full.filter(i => !seen.has(i))];
		open = true;
	}

	function close() {
		// Save final order and algorithmSelection on close
		updateCaseState(groupId, caseId, {
			algOrder: [...liveOrder],
			algorithmSelection: { ...previewSelection },
		});
		open = false;
	}

	// Instant-save helpers
	function setStatus(v: TrainState) {
		updateCaseState(groupId, caseId, { trainState: v });
	}

	function toggleHidden(poolIndex: number) {
		const s = new Set(caseState.algHidden ?? []);
		s.has(poolIndex) ? s.delete(poolIndex) : s.add(poolIndex);
		updateCaseState(groupId, caseId, { algHidden: [...s] });
	}

	function toggleStarred(poolIndex: number) {
		const s = new Set(caseState.algStarred ?? []);
		s.has(poolIndex) ? s.delete(poolIndex) : s.add(poolIndex);
		updateCaseState(groupId, caseId, { algStarred: [...s] });
	}

	let resetConfirm = $state(false);
	let resetTimer: ReturnType<typeof setTimeout> | null = null;

	function handleResetClick() {
		if (!resetConfirm) {
			resetConfirm = true;
			resetTimer = setTimeout(() => { resetConfirm = false; }, 3000);
		} else {
			if (resetTimer) clearTimeout(resetTimer);
			resetConfirm = false;
			const defaultOrder = Array.from({ length: poolSize }, (_, i) => i);
			liveOrder = defaultOrder;
			updateCaseState(groupId, caseId, { algStarred: [], algHidden: [] });
		}
	}

	async function selectAlg(poolIndex: number) {
		previewSelection = { ...previewSelection, [side]: poolIndex };
		await tick();
		setTimeout(() => {
			twistyRef?.jumpToStart();
			setTimeout(() => twistyRef?.play(), 100);
		}, 80);
	}

	// Drag-to-reorder (updates liveOrder; saved on close)
	let dragFrom = $state<number | null>(null);
	function onDragStart(pos: number) { dragFrom = pos; }
	function onDragOver(e: DragEvent, pos: number) {
		e.preventDefault();
		if (dragFrom === null || dragFrom === pos) return;
		const arr = [...liveOrder];
		const [moved] = arr.splice(dragFrom, 1);
		arr.splice(pos, 0, moved);
		liveOrder = arr;
		dragFrom = pos;
	}
	function onDragEnd() { dragFrom = null; }

	const STATUS_OPTIONS: { value: TrainState; label: string }[] = [
		{ value: 'unlearned', label: 'Not started' },
		{ value: 'learning',  label: 'Learning' },
		{ value: 'finished',  label: 'Learned' },
	];
</script>

{#if open}
<div class="overlay" role="dialog" aria-modal="true" onpointerdown={close}>
	<div class="modal" onpointerdown={(e) => e.stopPropagation()}>

		<div class="modal-header">
			<span class="modal-title">Case {caseId}</span>
			<button class="close-btn" onclick={close}>×</button>
		</div>

		<div class="preview-wrap">
			<TwistyPlayer
				bind:this={twistyRef}
				{groupId}
				{caseId}
				algorithmSelection={previewSelection}
				{side}
				{crossColor}
				{frontColor}
				tempoScale={appSettings.tempoScale}
				stickering="f2l"
				controlPanel="bottom-row"
				experimentalDragInput="auto"
				class="modal-player"
			/>
		</div>

		<!-- Side -->
		<div class="field">
			<div class="field-label">Side</div>
			<div class="seg">
				<button class="seg-b" class:on={side === 'right'} onclick={() => (side = 'right')}>Right</button>
				<button class="seg-b" class:on={side === 'left'}  onclick={() => (side = 'left')}>Left</button>
			</div>
		</div>

		<!-- Algorithms -->
		{#if orderedAlgs.length > 0}
		<div class="field">
			<div class="field-label-row">
				<span class="field-label">Algorithms</span>
				<button
					class="reset-stars-btn"
					class:confirming={resetConfirm}
					onclick={handleResetClick}
					title={resetConfirm ? 'Click again to confirm reset' : 'Reset order and stars'}
				>
					{#if resetConfirm}
						<strong>Sure?</strong>
					{:else}
						<strong>↺</strong>
					{/if}
				</button>
			</div>
			<span class="field-hint">Drag · Right-click to hide · Click to preview</span>
			<div class="alg-list">
				{#each orderedAlgs as item, pos (item.poolIndex)}
					<div
						class="alg-row"
						class:hidden-alg={item.hidden}
						draggable="true"
						ondragstart={() => onDragStart(pos)}
						ondragover={(e) => onDragOver(e, pos)}
						ondragend={onDragEnd}
						oncontextmenu={(e) => { e.preventDefault(); toggleHidden(item.poolIndex); }}
					>
						<!-- Main clickable area: index + alg text + play icon -->
						<button
							class="alg-main"
							class:active={activeIndex === item.poolIndex}
							onclick={() => selectAlg(item.poolIndex)}
						>
							<span class="alg-index">{pos + 1}</span>
							<span class="alg-str" class:starred={item.starred}>{item.alg}</span>
							<span class="play-icon">▶</span>
						</button>
						<!-- Square mark button -->
						<button
							class="mark-sq"
							class:marked={item.starred}
							onclick={(e) => { e.stopPropagation(); toggleStarred(item.poolIndex); }}
							title="Mark algorithm"
						></button>
					</div>
				{/each}
			</div>
		</div>
		{/if}

		<!-- Status -->
		<div class="field">
			<div class="field-label">Status</div>
			<div class="seg">
				{#each STATUS_OPTIONS as opt}
					<button
						class="seg-b"
						class:on={caseState.trainState === opt.value}
						onclick={() => setStatus(opt.value)}
					>{opt.label}</button>
				{/each}
			</div>
		</div>

		<!-- Pool -->
		<div class="field">
			<div class="field-label">Pool</div>
			<div class="seg">
				<button class="seg-b" class:on={!caseState.inPool} onclick={() => updateCaseState(groupId, caseId, { inPool: false })}>Excluded</button>
				<button class="seg-b pool-on" class:on={caseState.inPool} onclick={() => updateCaseState(groupId, caseId, { inPool: true })}>In Pool</button>
			</div>
		</div>

	</div>
</div>
{/if}

<style>
	.overlay {
		position: fixed; inset: 0; background: rgba(0,0,0,.72);
		display: flex; align-items: center; justify-content: center;
		z-index: 200; padding: 16px;
	}
	.modal {
		background: var(--bg2); border: 1px solid var(--border2);
		border-radius: var(--radius-lg); padding: 26px; width: 100%;
		max-width: 460px; display: flex; flex-direction: column;
		gap: 18px; max-height: 90vh; overflow-y: auto;
	}
	.modal-header { display: flex; align-items: center; justify-content: space-between; }
	.modal-title { font-size: 1.1rem; font-weight: 700; color: var(--text); }
	.close-btn {
		background: none; border: none; color: var(--text3);
		font-size: 1.5rem; cursor: pointer; line-height: 1; padding: 0 4px;
		transition: color .12s;
	}
	.close-btn:hover { color: var(--text); }

	.preview-wrap { display: flex; justify-content: center; }
	:global(.modal-player) { width: 240px !important; height: 200px !important; }

	.field { display: flex; flex-direction: column; gap: 8px; }
	.field-label {
		font-size: 0.75rem; font-weight: 700; color: var(--text3);
		text-transform: uppercase; letter-spacing: .09em;
	}
	.field-label-row {
		display: flex; align-items: center;
		justify-content: space-between; gap: 8px;
	}
	.field-hint { font-size: 0.72rem; color: var(--text3); margin-top: -4px; }
	.reset-stars-btn {
		background: none; border: none; color: var(--text3);
		font-size: 0.88rem; cursor: pointer; padding: 3px 8px;
		border-radius: 6px; transition: all .15s; line-height: 1;
		white-space: nowrap;
	}
	.reset-stars-btn:hover { color: var(--accent); background: var(--bg3); }
	.reset-stars-btn.confirming {
		color: #ff6b6b; background: #ff6b6b18; border: 1px solid #ff6b6b55;
	}
	.reset-stars-btn.confirming:hover { background: #ff6b6b30; }

	.seg {
		display: flex; background: var(--bg);
		border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden;
	}
	.seg-b {
		flex: 1; padding: 10px; font-size: 0.92rem; font-weight: 500;
		border: none; background: transparent; cursor: pointer;
		color: var(--text3); transition: all .12s;
	}
	.seg-b:hover { color: var(--text2); background: var(--bg3); }
	.seg-b.on { background: var(--bg3); color: var(--text); }
	.seg-b.pool-on.on { color: var(--accent); }

	/* Alg list */
	.alg-list { display: flex; flex-direction: column; gap: 3px; }

	.alg-row {
		display: flex; align-items: stretch; gap: 0;
		border-radius: 8px;
		border: 1px solid var(--border);
		overflow: hidden;
		transition: border-color .12s;
		cursor: default; user-select: none;
	}
	.alg-row:hover { border-color: var(--border2); }
	.alg-row.hidden-alg { opacity: .3; }

	/* Main area: takes up most of row */
	.alg-main {
		display: flex; align-items: center; gap: 8px;
		flex: 1; min-width: 0;
		padding: 8px 10px;
		background: var(--bg); border: none; cursor: pointer;
		text-align: left; transition: background .12s;
	}
	.alg-main:hover { background: var(--bg3); }
	.alg-main.active { background: var(--bg3); border-color: var(--accent); }
	.alg-row:has(.alg-main.active) { border-color: var(--accent); }

	.alg-index { font-size: 0.72rem; color: var(--text3); min-width: 14px; flex-shrink: 0; }

	.alg-str {
		flex: 1;
		font-family: "SF Mono", Monaco, Menlo, Consolas, monospace;
		font-size: 0.9rem; color: var(--text); line-height: 1.5;
		word-break: break-all; transition: color .12s;
	}
	.alg-str.starred { color: #ffc759; }
	.alg-main:hover .alg-str { color: var(--accent); }

	.play-icon {
		font-size: 0.7rem; color: var(--text3); flex-shrink: 0; transition: color .12s;
	}
	.alg-main:hover .play-icon { color: var(--accent); }
	.alg-main.active .play-icon { color: var(--accent); }

	/* Square mark button — same height as row, no border-radius issues */
	.mark-sq {
		width: 36px; flex-shrink: 0;
		align-self: stretch;
		background: var(--bg2);
		border: none;
		border-left: 1px solid var(--border);
		cursor: pointer;
		transition: background .15s;
	}
	.mark-sq:hover { background: #ffc75930; }
	.mark-sq.marked { background: #ffc759; }
</style>
