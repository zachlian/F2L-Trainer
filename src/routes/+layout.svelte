<script lang="ts">
	import '../app.css';
	import { browser } from '$app/environment';
	import { casesState, CASES_STATE_STORAGE_KEY } from '$lib/casesState.svelte';
	import { saveToLocalStorage } from '$lib/utils/localStorage';

	let { children } = $props();

	if (browser) {
		$effect(() => {
			saveToLocalStorage(CASES_STATE_STORAGE_KEY, casesState);
		});
	}
</script>

{@render children()}
