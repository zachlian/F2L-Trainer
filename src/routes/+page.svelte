<script lang="ts">
	import { viewState } from '$lib/viewState.svelte';
	import SelectView from '$lib/components/SelectView/SelectView.svelte';
	import TrainView from '$lib/components/TrainView/TrainView.svelte';
	import SettingsView from '$lib/components/SettingsView.svelte';
	import { getNumberOfSelectedCases } from '$lib/trainCaseQueue.svelte';
	import type { View } from '$lib/viewState.svelte';

	let prevView: View = $state('select');

	function goToSettings() {
		prevView = viewState.current;
		viewState.current = 'settings';
	}
</script>

<div class="app-shell">
	<nav class="top-nav">
		<span class="nav-title">F2L Trainer</span>
		<div class="nav-actions">
			{#if viewState.current === 'select'}
				<button class="nav-btn" onclick={goToSettings}>
					<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
					Settings
				</button>
				<button class="nav-btn primary" onclick={() => (viewState.current = 'train')}>
					Train
				</button>
			{:else if viewState.current === 'train'}
				<button class="nav-btn" onclick={goToSettings}>
					<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
					Settings
				</button>
				<button class="nav-btn" onclick={() => (viewState.current = 'select')}>← Cases</button>
			{:else if viewState.current === 'settings'}
				<button class="nav-btn" onclick={() => (viewState.current = prevView)}>← Back</button>
			{/if}
		</div>
	</nav>

	<main class="main-content">
		{#if viewState.current === 'select'}
			<SelectView />
		{:else if viewState.current === 'train'}
			<TrainView />
		{:else if viewState.current === 'settings'}
			<SettingsView />
		{/if}
	</main>
</div>

<style>
	:global(*) { box-sizing: border-box; margin: 0; padding: 0; }
	:global(:root) {
		--bg:         #161616;
		--bg2:        #1e1e1e;
		--bg3:        #272727;
		--border:     #2a2a2a;
		--border2:    #3a3a3a;
		--text:       #e2e2e2;
		--text2:      #9a9a9a;
		--text3:      #585858;
		--accent:     #00ffff;
		--accent-dim: #00cccc;
		--green:      #3d9e6a;
		--green-bg:   #122018;
		--green-text: #4ecb88;
		--amber:      #c48c2a;
		--amber-bg:   #231b0c;
		--amber-text: #d4a84a;
		--radius:     10px;
		--radius-lg:  16px;
		font-size: 18px;
	}
	:global(body) {
		background: var(--bg);
		color: var(--text);
		font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
		font-size: 1rem;
		line-height: 1.5;
		min-height: 100vh;
	}

	.app-shell { display: flex; flex-direction: column; min-height: 100vh; }

	.top-nav {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 16px 24px;
		border-bottom: 1px solid var(--border);
		position: sticky;
		top: 0;
		background: var(--bg);
		z-index: 50;
	}
	.nav-title {
		font-size: 0.78rem;
		font-weight: 700;
		color: var(--text3);
		letter-spacing: .15em;
		text-transform: uppercase;
	}
	.nav-actions { display: flex; gap: 10px; align-items: center; }

	:global(.nav-btn) {
		display: flex;
		align-items: center;
		gap: 8px;
		background: transparent;
		border: 1px solid var(--border2);
		border-radius: var(--radius);
		padding: 10px 18px;
		cursor: pointer;
		color: var(--text2);
		font-size: 1rem;
		font-weight: 500;
		transition: all .15s;
	}
	:global(.nav-btn:hover) { background: var(--bg3); color: var(--text); }
	:global(.nav-btn.primary) {
		background: var(--accent);
		color: #000;
		border-color: transparent;
		font-weight: 700;
	}
	:global(.nav-btn.primary:hover) { opacity: .85; }
	:global(.nav-btn svg) {
		width: 16px; height: 16px;
		stroke: currentColor; fill: none;
		stroke-width: 2; stroke-linecap: round; stroke-linejoin: round;
	}
	.main-content { flex: 1; }
</style>
