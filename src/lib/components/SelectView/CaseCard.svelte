<script lang="ts">
	import TwistyPlayerStatic from '$lib/components/TwistyPlayerStatic.svelte';
	import { casesStatic } from '$lib/casesStatic';
	import { casesState, getCaseName, updateCaseState } from '$lib/casesState.svelte';
	import { appSettings } from '$lib/appSettings.svelte';
	import type { CaseId, GroupId } from '$lib/types/group';
	import resolveStickerColors from '$lib/utils/resolveStickerColors';
	import CaseEditModal from './CaseEditModal.svelte';
	import type { Side } from '$lib/types/Side';

	let { groupId, caseId }: { groupId: GroupId; caseId: CaseId } = $props();

	let editModalRef = $state<CaseEditModal>();
	// dummy binds — we only need the 3D preview, not alg text on card
	let scramble = $state('');
	let alg = $state('');
	let side: Side = 'right';

	const staticData = casesStatic[groupId][caseId];
	const caseState = $derived(casesState[groupId][caseId]);

	const [crossColor, frontColor] = $derived(
		resolveStickerColors(
			(appSettings.crossColor ?? ['white']) as any,
			(appSettings.frontColor ?? ['red']) as any
		)
	);

	function handleClick() { editModalRef?.openModal(); }

	function handleContextMenu(e: MouseEvent) {
		e.preventDefault();
		updateCaseState(groupId, caseId, { inPool: !caseState.inPool });
	}

	const STATUS_BORDER: Record<string, string> = {
		unlearned: 'var(--border)',
		learning:  'var(--amber)',
		finished:  'var(--green)',
	};
	const STATUS_BG: Record<string, string> = {
		unlearned: 'transparent',
		learning:  'var(--amber-bg)',
		finished:  'var(--green-bg)',
	};
</script>

<button
	type="button"
	class="case-card"
	class:in-pool={caseState.inPool}
	style="border-color:{STATUS_BORDER[caseState.trainState]};background:{STATUS_BG[caseState.trainState]}"
	onclick={handleClick}
	oncontextmenu={handleContextMenu}
	title="Left-click: edit · Right-click: toggle pool"
>
	<div class="pool-dot" class:active={caseState.inPool}></div>

	<div class="cube-thumb">
		<TwistyPlayerStatic
			bind:scramble
			bind:alg
			{groupId}
			{caseId}
			algorithmSelection={caseState.algorithmSelection}
			{side}
			{crossColor}
			{frontColor}
			controlPanel="none"
			class="thumb-player"
		/>
	</div>
	<span class="case-name">{getCaseName(staticData)}</span>
</button>

<CaseEditModal bind:this={editModalRef} {groupId} {caseId} />

<style>
	.case-card {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		border: 1px solid;
		border-radius: var(--radius);
		padding: 10px 8px 9px;
		cursor: pointer;
		transition: box-shadow .15s, opacity .15s;
		text-align: center;
		width: 100%;
		gap: 7px;
		opacity: .3;
	}
	.case-card.in-pool { opacity: 1; }
	.case-card:hover { box-shadow: 0 0 0 1px var(--accent); }

	.pool-dot {
		position: absolute;
		top: 7px; right: 7px;
		width: 7px; height: 7px;
		border-radius: 50%;
		background: var(--border2);
		transition: background .15s;
	}
	.pool-dot.active { background: var(--accent); }

	.cube-thumb { width: 90px; height: 80px; }
	:global(.thumb-player) { width: 100%; height: 100%; }

	.case-name {
		font-size: 0.82rem;
		color: var(--text2);
		font-weight: 600;
		line-height: 1.2;
	}
</style>
