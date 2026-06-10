<script lang="ts">
	import { GROUP_DEFINITIONS, GROUP_IDS, type GroupId } from '$lib/types/group';
	import { casesState } from '$lib/casesState.svelte';
	import GroupComponent from './GroupComponent.svelte';

	const groups = GROUP_IDS.map((id) => ({ id, name: GROUP_DEFINITIONS[id].name }));
	let selectedGroup: GroupId = $state('basic');

	function getGroupPoolCount(groupId: GroupId) {
		const def = GROUP_DEFINITIONS[groupId];
		let n = 0;
		for (const cat of def.categories)
			for (const id of cat.cases)
				if (casesState[groupId][id]?.inPool) n++;
		return n;
	}

	const totalInPool = $derived.by(() => GROUP_IDS.reduce((s, g) => s + getGroupPoolCount(g), 0));
</script>

<div class="select-wrap">
	<div class="tab-row">
		{#each groups as g}
			{@const count = getGroupPoolCount(g.id)}
			<button
				class="tab-btn"
				class:active={selectedGroup === g.id}
				onclick={() => (selectedGroup = g.id)}
			>
				{g.name}
				{#if count > 0}<span class="tab-badge">{count}</span>{/if}
			</button>
		{/each}
	</div>

	<p class="hint">Left-click to edit · Right-click to toggle pool</p>

	<GroupComponent groupId={selectedGroup} />
</div>

<style>
	.select-wrap {
		max-width: 880px;
		margin: 0 auto;
		padding: 24px 24px 80px;
	}
	.tab-row {
		display: flex;
		gap: 8px;
		margin-bottom: 14px;
		flex-wrap: wrap;
	}
	.tab-btn {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 9px 18px;
		background: transparent;
		border: 1px solid var(--border2);
		border-radius: var(--radius);
		color: var(--text2);
		font-size: 1rem;
		font-weight: 500;
		cursor: pointer;
		transition: all .15s;
	}
	.tab-btn:hover { background: var(--bg3); color: var(--text); }
	.tab-btn.active { background: var(--bg3); border-color: var(--accent); color: var(--text); }

	.tab-badge {
		background: var(--accent);
		color: #000;
		font-size: 0.7rem;
		font-weight: 800;
		padding: 1px 7px;
		border-radius: 10px;
	}
	.hint {
		font-size: 0.82rem;
		color: var(--text3);
		margin-bottom: 18px;
	}
	.hint strong { color: var(--text2); }
</style>
