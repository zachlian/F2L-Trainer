<script lang="ts">
	import { appSettings } from '$lib/appSettings.svelte';
	import { exportData, importData, downloadJson } from '$lib/utils/exportImport';

	// Cross: white + yellow only
	const CROSS_COLORS = ['white', 'yellow'] as const;
	// Front: red, orange, blue, green only
	const FRONT_COLORS = ['red', 'orange', 'blue', 'green'] as const;

	const COLOR_HEX: Record<string, string> = {
		white: '#f0f0f0', yellow: '#f5c518',
		red: '#d63a3a', orange: '#e07030',
		blue: '#3a72d6', green: '#3d9e6a',
	};

	const DEFAULT_TEMPO = 1;
	const TEMPO_MIN = 0.2;
	const TEMPO_MAX = 3;
	const TEMPO_STEP = 0.1;

	function toggleColor(arr: string[], color: string): string[] {
		const i = arr.indexOf(color);
		if (i >= 0) { if (arr.length === 1) return arr; return arr.filter((c) => c !== color); }
		return [...arr, color];
	}

	let importError = $state('');
	let importSuccess = $state(false);
	let fileInput = $state<HTMLInputElement>();

	function handleExport() {
		const json = exportData();
		const date = new Date().toISOString().slice(0, 10);
		downloadJson(`f2l-trainer-${date}.json`, json);
	}

	async function handleImport(e: Event) {
		importError = '';
		importSuccess = false;
		const file = (e.target as HTMLInputElement).files?.[0];
		if (!file) return;
		const text = await file.text();
		const result = importData(text);
		if (result.ok) {
			importSuccess = true;
			setTimeout(() => (importSuccess = false), 3000);
		} else {
			importError = result.error ?? 'Import failed.';
		}
		if (fileInput) fileInput.value = '';
	}
</script>

<div class="settings-wrap">

	<div class="sec">
		<h3>Training</h3>
		<div class="setting-row">
			<span class="setting-name">Add random U move</span>
			<button
				class="toggle"
				class:on={appSettings.trainAddAuf}
				onclick={() => (appSettings.trainAddAuf = !appSettings.trainAddAuf)}
			><span class="toggle-knob"></span></button>
		</div>
	</div>

	<div class="sec">
		<h3>Animation Speed</h3>
		<div class="speed-row">
			<input
				type="range"
				min={TEMPO_MIN} max={TEMPO_MAX} step={TEMPO_STEP}
				bind:value={appSettings.tempoScale}
				class="slider"
			/>
			<span class="speed-val">{appSettings.tempoScale.toFixed(1)}×</span>
			<button
				class="reset-tempo"
				onclick={() => (appSettings.tempoScale = DEFAULT_TEMPO)}
			>↺ Reset</button>
		</div>
	</div>

	<div class="sec">
		<h3>Cross Color</h3>
		<div class="color-grid">
			{#each CROSS_COLORS as color}
				<button
					class="color-btn"
					class:selected={appSettings.crossColor.includes(color)}
					style="--c:{COLOR_HEX[color]}"
					onclick={() => (appSettings.crossColor = toggleColor(appSettings.crossColor, color))}
				>
					<span class="color-dot"></span><span>{color}</span>
				</button>
			{/each}
		</div>
	</div>

	<div class="sec">
		<h3>Front Color</h3>
		<div class="color-grid">
			{#each FRONT_COLORS as color}
				<button
					class="color-btn"
					class:selected={appSettings.frontColor.includes(color)}
					style="--c:{COLOR_HEX[color]}"
					onclick={() => (appSettings.frontColor = toggleColor(appSettings.frontColor, color))}
				>
					<span class="color-dot"></span><span>{color}</span>
				</button>
			{/each}
		</div>
	</div>

	<div class="sec">
		<h3>Data</h3>
		<div class="data-btns">
			<button class="data-btn" onclick={handleExport}>⬇ Export JSON</button>
			<label class="data-btn import-label">
				⬆ Import JSON
				<input
					bind:this={fileInput}
					type="file"
					accept=".json,application/json"
					onchange={handleImport}
					class="hidden-input"
				/>
			</label>
		</div>
		{#if importSuccess}
			<p class="import-ok">✓ Imported successfully</p>
		{/if}
		{#if importError}
			<p class="import-err">{importError}</p>
		{/if}
	</div>

</div>

<style>
	.settings-wrap {
		max-width: 600px; margin: 0 auto;
		padding: 32px 24px 80px; display: flex; flex-direction: column; gap: 40px;
	}
	.sec h3 {
		font-size: 0.78rem; font-weight: 700; color: var(--text3);
		text-transform: uppercase; letter-spacing: .13em; margin-bottom: 14px;
	}

	.setting-row {
		display: flex; align-items: center; justify-content: space-between;
		background: var(--bg2); border: 1px solid var(--border);
		border-radius: var(--radius); padding: 18px 20px;
	}
	.setting-name { font-size: 1.05rem; font-weight: 500; color: var(--text); }

	.toggle {
		width: 50px; height: 28px; background: var(--border2);
		border: none; border-radius: 14px; cursor: pointer;
		position: relative; transition: background .2s; flex-shrink: 0;
	}
	.toggle.on { background: var(--accent); }
	.toggle-knob {
		position: absolute; top: 4px; left: 4px;
		width: 20px; height: 20px; background: #fff;
		border-radius: 50%; transition: transform .2s; display: block;
	}
	.toggle.on .toggle-knob { transform: translateX(22px); }

	.speed-row {
		display: flex; align-items: center; gap: 14px;
		background: var(--bg2); border: 1px solid var(--border);
		border-radius: var(--radius); padding: 16px 20px;
	}
	.slider { flex: 1; accent-color: var(--accent); height: 4px; cursor: pointer; }
	.speed-val {
		font-size: 0.9rem; font-weight: 600; color: var(--text);
		min-width: 40px; text-align: right; flex-shrink: 0;
	}
	.reset-tempo {
		background: none; border: none; color: var(--accent);
		font-size: 0.85rem; cursor: pointer; padding: 2px 6px;
		border-radius: 6px; transition: opacity .12s; flex-shrink: 0;
	}
	.reset-tempo:hover { opacity: .7; }

	.color-grid { display: flex; flex-wrap: wrap; gap: 8px; }
	.color-btn {
		display: flex; align-items: center; gap: 9px;
		background: var(--bg2); border: 1px solid var(--border2);
		border-radius: var(--radius); padding: 10px 16px;
		cursor: pointer; color: var(--text2); font-size: 0.9rem; transition: all .15s;
	}
	.color-btn:hover { background: var(--bg3); }
	.color-btn.selected { border-color: var(--c); color: var(--text); }
	.color-dot { width: 14px; height: 14px; border-radius: 50%; background: var(--c); flex-shrink: 0; }

	.data-btns { display: flex; gap: 8px; flex-wrap: wrap; }
	.data-btn {
		padding: 10px 20px; background: var(--bg2); border: 1px solid var(--border2);
		border-radius: var(--radius); color: var(--text2);
		font-size: 0.95rem; font-weight: 500; cursor: pointer; transition: all .15s;
	}
	.data-btn:hover { background: var(--bg3); color: var(--text); }
	.import-label { display: inline-flex; align-items: center; cursor: pointer; }
	.hidden-input { display: none; }
	.import-ok { font-size: 0.88rem; color: var(--green-text); margin-top: 4px; }
	.import-err { font-size: 0.88rem; color: #e05555; margin-top: 4px; }
</style>
