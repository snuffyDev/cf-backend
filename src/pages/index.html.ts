export default `
<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>API Console</title>
	<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/modern-normalize/3.0.1/modern-normalize.min.css" integrity="sha512-q6WgHqiHlKyOqslT/lgBgodhd03Wp4BEqKeW6nNtlOY4quzyG3VoQKFrieaCeSnuVseNKRGpGeDU3qPmabCANg==" crossorigin="anonymous" referrerpolicy="no-referrer" />
	<script src="https://cdn.jsdelivr.net/npm/htmx.org@2.0.8/dist/htmx.min.js" integrity="sha384-/TgkGk7p307TH7EXJDuUlgG3Ce1UVolAOFopFekQkkXihi5u/6OCvVKyz1W+idaz" crossorigin="anonymous"></script>
	<style>
		:root {
			color-scheme: light dark;
			--bg: #f7f7fa;
			--panel: #ffffff;
			--text: #111418;
			--muted: #5c6570;
			--stroke: #e4e7ee;
			--accent: #318eff;
			--form-bg: #fff;
			--radius: 12px;
			font-family: -apple-system, system-ui, "Segoe UI", sans-serif;
		}

		@media (prefers-color-scheme: dark) {
			:root {
				--bg: #0d1016;
				--panel: #141925;
				--text: #e8ebf2;
				--muted: #9aa4b5;
				--stroke: #1e2431;
				--form-bg: hsla(0,0%,100%,0.05);
			}
		}

		:where(body) {
			margin: 0;
			min-height: 100vh;
			max-width: 100%;
			background: var(--bg);
			color: var(--text);

			justify-content: center;
			padding: 32px 18px 64px;
		}

		main {
			width: 100%;
			max-width: 960px;
			margin-inline: auto;
			display: grid;
			gap: 16px;
		}

		header {
			display: flex;
			align-items: baseline;
			gap: 8px;
			margin-bottom: 4px;
		}

		header h1 { margin: 0; font-size: 24px; letter-spacing: -0.01em; }
		header span { color: var(--muted); font-size: 14px; }

		.panel {
			background: var(--panel);
			border: 1px solid var(--stroke);
			border-radius: var(--radius);
			padding: 18px 18px 20px;
			box-shadow: 0 12px 30px rgba(0, 0, 0, 0.06);
		}

		form { display: grid; gap: 14px; }

		label { font-weight: 600; }

		input[type="text"], select, textarea {
			width: 100%;
			padding: 10px 12px;
			border-radius: 10px;
			border: 1px solid var(--stroke);
			background: var(--form-bg);
			color: inherit;
			font-size: 14px;
		}

		textarea { min-height: 100px; resize: vertical; }

		fieldset {
			border: 1px solid var(--stroke);
			border-radius: var(--radius);
			padding: 12px 12px 10px;
			margin: 0;
		}

		legend { padding: 0 6px; color: var(--muted); font-size: 13px; }

		.row { display: grid; gap: 6px; }

		.inline { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }

		button[type="submit"] {
			width: fit-content;
			padding: 10px 14px;
			border-radius: 10px;
			border: 1px solid var(--accent);
			background: var(--accent);
			color: #fff;
			font-weight: 700;
			cursor: pointer;
		}

		.pill-switch { display: inline-flex; gap: 6px; align-items: center; }
		.pill {
			padding: 8px 12px;
			border-radius: 999px;
			border: 1px solid var(--stroke);
			background: transparent;
			cursor: pointer;
			font-weight: 600;
			color: var(--muted);
		}
		.pill.active { background: var(--accent); border-color: var(--accent); color: #fff; }
		select option * {
			background: var(--panel);
			color: var(--text);
		}
		.builder {
			display: grid;
			gap: 10px;
			padding: 12px;
			border: 1px dashed var(--stroke);
			border-radius: var(--radius);
			background: rgba(0,0,0,0.02);
		}
		.kv-row { display: grid; grid-template-columns: 1fr 140px 1fr auto; gap: 8px; align-items: center; }
		.kv-row input[type="text"] { width: 100%; }
		.kv-row .remove { border: 1px solid var(--stroke); background: transparent; color: var(--muted); padding: 6px 10px; border-radius: 8px; cursor: pointer; }
		.nested { grid-column: 1 / -1; padding-left: 14px; display: grid; gap: 8px; }
		.nested > .kv-row { background: rgba(0,0,0,0.03); padding: 8px; border-radius: 10px; }
		.hidden { display: none; }

		.muted { color: var(--muted); font-size: 13px; }
		select, option {
			appearance: none;
			-webkit-appearance: none;
			-moz-appearance: none;
			background-color: hsla(0,0%,2%,0.8);
			border: 1px solid var(--stroke);
			radius: 10px;
			padding: 10px 12px;
			font-size: 14px;
			color: inherit;
		}

		.response {
			min-height: 140px;
			white-space: pre-wrap;
			border: 1px dashed var(--stroke);
			border-radius: var(--radius);
			padding: 12px;
			font-family: "SFMono-Regular", Consolas, monospace;
			color: var(--muted);
			background: rgba(0,0,0,0.02);
		}

		.indicator { visibility: hidden; font-size: 13px; color: var(--muted); }
		.indicator.htmx-request { visibility: visible; }
		fieldset, input, select, textarea, button {
			transition: border-color 0.2s, background-color 0.2s, color 0.2s;
			position: relative;

		}
		[disabled], label:has([disabled]) {
			opacity: 0.6;
			cursor: not-allowed;
		}
		:where([disabled])::before, [disabled] {

			background: hsla(0,0%,100%,0.6);
			border-radius: var(--radius);
		}
		[disabled]::before {

			position: absolute;
			content: "";
			z-index: 1;
			inset: 0;
		}
		button {
			border: 1px solid var(--accent);
			background: var(--accent);
			color: #fff;
			font-weight: 700;
			cursor: pointer;
			padding: 10px 14px;
			border-radius: 10px;

		}
	</style>
</head>
<body>
<main>
		<header>
			<h1>API Console</h1>
			<span>Send HTML crawls or API probes without leaving the page.</span>
		</header>
		<section class="panel">
			<form id="scrape-form">
				<div class="row">
					<label for="url">Target URL</label>
					<input id="url" name="url" type="text" placeholder="https://example.com" required>
				</div>

				<div class="row">
					<label for="mode">Mode</label>
					<select id="mode" name="mode" value="api"  hx-on:change="const form=document.getElementById('scrape-form'); const htmlOptions=document.getElementById('html-options'); const apiOptions=document.getElementById('api-options'); const sendHtml=document.getElementById('send-html'); const sendApi=document.getElementById('send-api'); const isHtml=this.value==='html'; htmlOptions.hidden=!isHtml; htmlOptions.disabled=!isHtml; apiOptions.hidden=isHtml; apiOptions.disabled=isHtml; if(sendHtml){ sendHtml.hidden = !isHtml; sendHtml.disabled = !isHtml; } if(sendApi){ sendApi.hidden = isHtml; sendApi.disabled = isHtml; }">
						<option value="html">HTML</option>
						<option value="api" selected>API (JSON)</option>
					</select>
					<span class="muted">Endpoint will switch between /crawl and /api automatically.</span>
				</div>

				<fieldset id="html-options" hidden disabled>
					<legend>HTML options</legend>
					<div class="inline">
						<label class="inline"><input type="radio" name="htmlMode" value="full" disabled checked hx-on:change="const selectors=document.getElementById('selectors'); const wantsExtract=this.value==='extract'; selectors.toggleAttribute('disabled', !wantsExtract); if(!wantsExtract) selectors.value='';"> Full HTML</label>
						<label class="inline"><input type="radio" name="htmlMode" value="extract" disabled hx-on:change="const selectors=document.getElementById('selectors'); const wantsExtract=this.value==='extract'; selectors.toggleAttribute('disabled', !wantsExtract); if(!wantsExtract) selectors.value='';"> Extract elements</label>
					</div>
					<div class="row">
						<label for="selectors">Selectors (one per line)</label>
						<textarea disabled id="selectors" name="selectors" placeholder="main\narticle h2\nmeta[name=description]" disabled></textarea>
					</div>
				</fieldset>

				<fieldset id="api-options">
					<legend>API options</legend>
					<div class="row">
						<label for="method">HTTP method</label>
						<select id="method" name="method">
							<option value="GET">GET</option>
							<option value="POST" selected>POST</option>
							<option value="PUT">PUT</option>
							<option value="PATCH">PATCH</option>
						</select>
					</div>
					<div class="row">
						<label for="headers">Headers (JSON)</label>
						<textarea id="headers" name="headers" placeholder='{"Authorization":"Bearer ..."}'>{ "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 15_7_3) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Safari/605.1.15" }</textarea>
					</div>
					<div class="row">
						<label for="body">Request body</label>
						<div class="pill-switch" role="group" aria-label="Body input mode">
							<button type="button" class="pill active" data-body-mode="json">JSON text</button>
							<button type="button" class="pill" data-body-mode="builder">Key / value</button>
						</div>
						<textarea id="body-json" placeholder='{"q":"coffee"}'></textarea>
						<div id="body-builder" class="builder" hidden>
							<div class="kv-row kv-head">
								<span style="font-weight: 700;">Root object</span>
								<button type="button" class="pill" data-add-root>Add field</button>
							</div>
							<div data-builder-root class="nested"></div>
						</div>
						<textarea id="body-hidden" name="body" hidden></textarea>
						<span class="muted">Switch between raw JSON and a guided builder with types and nested objects.</span>
					</div>
					<div class="row">
						<label for="schema">Expected schema</label>
						<textarea id="schema" name="schema" placeholder='{"item":{"name":"string","price":"number"}}'></textarea>
					</div>
				</fieldset>

				<div class="inline">
					<button id="send-html" type="button" hx-post="/crawl" hx-target="#response" hx-swap="innerHTML" hx-indicator="#loading" hx-include="#scrape-form input, #scrape-form textarea, #scrape-form select" disabled hidden>Send</button>
					<button id="send-api" type="button" hx-post="/api" hx-target="#response" hx-swap="innerHTML" hx-indicator="#loading" hx-include="#scrape-form input, #scrape-form textarea, #scrape-form select" >Send (API)</button>
					<span id="loading" class="indicator">Sending…</span>
				</div>
			</form>
		</section>

		<section class="panel">
			<h3 style="margin: 0 0 8px;">Response</h3>
			<div id="response" class="response">Waiting for a response…</div>
		</section>
	</main>
	<script>
		// Initialize form based on default mode
		document.body.addEventListener('htmx:beforeSwap', (event) => {
			if (event.target.id === 'response') {
				const responseText = event.detail.xhr.responseText;
				localStorage.setItem('lastResponse', responseText);
				location.reload = () => {
				}
				event.target.innerHTML = responseText;
			}
});

		// Body input modes: raw JSON vs key/value builder
		(function setupBodyBuilder() {
			const modeButtons = Array.from(document.querySelectorAll('[data-body-mode]'));
			const jsonArea = document.getElementById('body-json');
			const builder = document.getElementById('body-builder');
			const hidden = document.getElementById('body-hidden');
			const root = builder?.querySelector('[data-builder-root]');
			const form = document.getElementById('scrape-form');

			function setMode(mode) {
				modeButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.bodyMode === mode));
				const isJson = mode === 'json';
				jsonArea.hidden = !isJson;
				builder.hidden = isJson;
				syncHidden();
			}

			function createValueInput(typeSelect) {
				const input = document.createElement('input');
				input.type = 'text';
				input.placeholder = 'value';
				input.dataset.value = 'value';
				input.addEventListener('input', syncHidden);
				typeSelect.onchange = () => {
					const isObject = typeSelect.value === 'object';
					input.classList.toggle('hidden', isObject);
					syncHidden();
				};
				return input;
			}

			function createEntry() {
				const row = document.createElement('div');
				row.className = 'kv-row';
				row.dataset.entry = 'entry';

				const keyInput = document.createElement('input');
				keyInput.type = 'text';
				keyInput.placeholder = 'key';
				keyInput.dataset.key = 'key';
				keyInput.oninput = (input) => {
					syncHidden(input);
				}

				const typeSelect = document.createElement('select');
				typeSelect.dataset.type = 'type';
				['string','number','boolean','null','object'].forEach(type => {
					const opt = document.createElement('option');
					opt.value = type;
					opt.textContent = type.charAt(0).toUpperCase() + type.slice(1);
					typeSelect.appendChild(opt);
				});
				typeSelect.onchange = syncHidden;

				const valueInput = createValueInput(typeSelect);

				const remove = document.createElement('button');
				remove.type = 'button';
				remove.textContent = 'Remove';
				remove.className = 'remove';
				remove.onclick = () => {
					row.remove();
					syncHidden();
				};

				const nested = document.createElement('div');
				nested.className = 'nested';
				nested.dataset.nested = 'nested';
				nested.hidden = true;

				const addChild = document.createElement('button');
				addChild.type = 'button';
				addChild.textContent = 'Add nested field';
				addChild.className = 'pill';
				addChild.onclick = () => {
					nested.hidden = false;
					nested.appendChild(createEntry());
					syncHidden();
				};

				typeSelect.onchange = () => {
					const isObject = typeSelect.value === 'object';
					nested.hidden = !isObject;
					if (!isObject) {
						nested.querySelectorAll('[data-entry]').forEach(child => child.remove());
					}
					if (!nested.contains(addChild)) nested.appendChild(addChild);
					syncHidden();
				};

				nested.appendChild(addChild);

				row.append(keyInput, typeSelect, valueInput, remove, nested);
				return row;
			}

			function ensureRootSeeded() {
				if (!root) return;
				if (!root.querySelector('[data-entry]')) root.appendChild(createEntry());
			}

			function parseValue(type, raw) {
				const trimmed = raw.trim();
				if (type === 'number') {
					const n = Number(trimmed);
					return Number.isFinite(n) ? n : 0;
				}
				if (type === 'boolean') return trimmed.toLowerCase() === 'true';
				if (type === 'null') return null;
				return trimmed;
			}

			function serializeEntry(entry) {
				const key = entry.querySelector('[data-key]')?.value.trim();
				const type = entry.querySelector('[data-type]')?.value;
				if (!key || !type) return null;
				if (type === 'object') {
					const nested = entry.querySelector('[data-nested]');
					return [key, serializeContainer(nested)];
				}
				const valueRaw = entry.querySelector('[data-value]')?.value ?? '';
				return [key, parseValue(type, valueRaw)];
			}

			function serializeContainer(container) {
				const obj = {};
				container.querySelectorAll(':scope > [data-entry]').forEach(entry => {
					const pair = serializeEntry(entry);
					if (pair) obj[pair[0]] = pair[1];
				});
				return obj;
			}

			function syncHidden() {
				if (jsonArea.hidden) {
					if (!root) return;
					ensureRootSeeded();
					const built = serializeContainer(root);
					hidden.value = JSON.stringify(built, null, 2);
				} else {
					hidden.value = jsonArea.value;
				}
			}

			modeButtons.forEach(btn => btn.onclick = () => setMode(btn.dataset.bodyMode));
			builder.querySelector('[data-add-root]').onclick = () => {
				if (!root) return;
				root.appendChild(createEntry());
				syncHidden();
			};

			form.oninput =  (event) => {
				if ((builder && builder.contains(event.target)) || event.target === jsonArea) syncHidden();
			};

			document.body.addEventListener('htmx:configRequest', syncHidden);

			ensureRootSeeded();
			setMode('json');
		})();

	</script>
</body>
</html>
`;
