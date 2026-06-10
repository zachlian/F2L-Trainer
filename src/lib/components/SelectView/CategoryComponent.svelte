<script lang="ts">
	import { GROUP_DEFINITIONS, type GroupId } from '$lib/types/group';
	import CaseCard from './CaseCard.svelte';

	let { groupId, categoryIndex }: { groupId: GroupId; categoryIndex: number } = $props();
	const category = GROUP_DEFINITIONS[groupId].categories[categoryIndex];
	const sortedCases = $derived([...category.cases].sort((a, b) => a - b));
</script>

<div class="case-grid">
	{#each sortedCases as caseId}
		<CaseCard {groupId} {caseId} />
	{/each}
</div>

<style>
	.case-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
		gap: 8px;
	}
</style>
