<script lang="ts">
	import { GROUP_DEFINITIONS, type GroupId, type CaseId } from '$lib/types/group';
	import { casesState, updateCaseState } from '$lib/casesState.svelte';
	import type { TrainState } from '$lib/types/caseState';
	import CategoryComponent from './CategoryComponent.svelte';

	let { groupId }: { groupId: GroupId } = $props();
	const groupDef = $derived(GROUP_DEFINITIONS[groupId]);

	let openMap = $state<Record<number, boolean>>({});
	$effect(() => {
		void groupId;
		openMap = Object.fromEntries(groupDef.categories.map((_, i) => [i, false]));
	});

	function toggle(i: number) { openMap[i] = !openMap[i]; }

	function setCategoryCases(cases: readonly CaseId[], inPool: boolean) {
		for (const caseId of cases) updateCaseState(groupId, caseId, { inPool });
	}

	function setCategoryStatus(cases: readonly CaseId[], trainState: TrainState) {
		for (const caseId of cases) updateCaseState(groupId, caseId, { trainState });
	}

	function isCategoryAllIn(cases: readonly CaseId[]): boolean {
		return cases.every(id => casesState[groupId][id]?.inPool);
	}

	function toggleCategory(cases: readonly CaseId[]) {
		setCategoryCases(cases, !isCategoryAllIn(cases));
	}

	function setAllInGroup(inPool: boolean) {
		for (const cat of groupDef.categories) setCategoryCases(cat.cases, inPool);
	}

	const poolCount = $derived.by(() => {
		let n = 0;
		for (const cat of groupDef.categories)
			for (const caseId of cat.cases)
				if (casesState[groupId][caseId]?.inPool) n++;
		return n;
	});
	const totalCount = $derived(groupDef.categories.reduce((s, c) => s + c.cases.length, 0));
	const groupAllIn = $derived(poolCount === totalCount && totalCount > 0);
	const groupPartial = $derived(poolCount > 0 && poolCount < totalCount);
</script>

<div class="group-wrap">
	<!-- Group-level bar -->
	<div class="group-bar">
		<span class="pool-count">{poolCount} / {totalCount} in pool</span>
		<div class="cat-actions">
			<span class="status-dot-spacer"></span>
			<span class="status-dot-spacer"></span>
			<span class="status-dot-spacer"></span>
			<div class="actions-divider"></div>
			<button
				class="circle-btn"
				class:all-in={groupAllIn}
				onclick={() => setAllInGroup(!groupAllIn)}
				title={groupAllIn ? 'Remove all from pool' : 'Add all to pool'}
			></button>
		</div>
	</div>

	{#each groupDef.categories as category, i}
		{@const catAllIn = isCategoryAllIn(category.cases)}
		{@const catPartial = !catAllIn && category.cases.some(id => casesState[groupId][id]?.inPool)}
		<div class="category-block">
			<!-- Header row -->
			<div class="cat-header">
				<button class="cat-toggle" onclick={() => toggle(i)}>
					<span class="cat-chevron" class:open={openMap[i]}>›</span>
					<span class="cat-name">{category.name.split(' / ').join(' · ')}</span>
				</button>
				<!-- Status buttons + pool circle, all in one aligned group -->
				<div class="cat-actions">
					<button class="status-dot dot-unlearned" onclick={(e) => { e.stopPropagation(); setCategoryStatus(category.cases, 'unlearned'); }} title="Set all: Not started"></button>
					<button class="status-dot dot-learning"  onclick={(e) => { e.stopPropagation(); setCategoryStatus(category.cases, 'learning');  }} title="Set all: Learning"></button>
					<button class="status-dot dot-learned"   onclick={(e) => { e.stopPropagation(); setCategoryStatus(category.cases, 'finished');  }} title="Set all: Learned"></button>
					<div class="actions-divider"></div>
					<button
						class="circle-btn"
						class:all-in={catAllIn}
						class:partial={catPartial}
						onclick={(e) => { e.stopPropagation(); toggleCategory(category.cases); }}
						title={catAllIn ? 'Remove all from pool' : 'Add all to pool'}
					></button>
				</div>
			</div>

			{#if openMap[i]}
				<div class="cat-body">
					<CategoryComponent {groupId} categoryIndex={i} />
				</div>
			{/if}
		</div>
	{/each}
</div>

<style>
	.group-wrap { display: flex; flex-direction: column; gap: 6px; }

	.group-bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 4px 14px 10px;
	}
	.pool-count { font-size: 0.9rem; color: var(--text3); }

	.category-block {
		background: var(--bg2);
		border: 1px solid var(--border);
		border-radius: var(--radius);
		overflow: hidden;
	}

	.cat-header {
		display: flex;
		align-items: center;
		padding: 12px 14px;
		gap: 8px;
		transition: background .15s;
	}
	.cat-header:hover { background: var(--bg3); }

	.cat-toggle {
		flex: 1;
		display: flex;
		align-items: center;
		gap: 8px;
		background: transparent;
		border: none;
		cursor: pointer;
		color: inherit;
		text-align: left;
		padding: 0;
		min-width: 0;
	}
	.cat-chevron {
		font-size: 20px;
		color: var(--text3);
		transition: transform .2s;
		flex-shrink: 0;
		line-height: 1;
	}
	.cat-chevron.open { transform: rotate(90deg); }
	.cat-name {
		font-size: 0.95rem; font-weight: 600; color: var(--text);
	}

	/* Right side actions — all in one row */
	.cat-actions {
		display: flex;
		align-items: center;
		gap: 6px;
		flex-shrink: 0;
	}
	.actions-divider {
		width: 1px;
		height: 14px;
		background: var(--border2);
		margin: 0 2px;
	}

	/* Status dots */
	.status-dot-spacer {
		width: 14px; height: 14px;
		border-radius: 50%;
		flexibility: 0;
		opacity: 0;
		pointer-events: none;
		flex-shrink: 0;
	}
	.status-dot {
		width: 14px; height: 14px;
		border-radius: 50%;
		border: none;
		cursor: pointer;
		transition: transform .12s, opacity .12s;
		opacity: .65;
	}
	.status-dot:hover { transform: scale(1.3); opacity: 1; }
	.dot-unlearned { background: var(--border2); }
	.dot-learning  { background: var(--amber); }
	.dot-learned   { background: var(--green); }

	/* Pool circle — same row as status dots */
	.circle-btn {
		width: 14px; height: 14px;
		border-radius: 50%;
		border: 2px solid var(--border2);
		background: transparent;
		cursor: pointer;
		flex-shrink: 0;
		margin: 0;
		padding: 0;
		transition: border-color .15s, background .15s;
	}
	.circle-btn:hover { border-color: var(--accent); }
	.circle-btn.partial { border-color: var(--accent); }
	.circle-btn.all-in { background: var(--accent); border-color: var(--accent); }

	.cat-body { padding: 10px; }
</style>
