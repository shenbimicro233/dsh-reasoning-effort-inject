// dsh-reasoning-effort-inject — browser half (client plugin bundle).
//
// Per-model "思考强度 / thinking effort" configuration, mirroring CC switch's
// model directory where each model carries its own reasoningLevels list.
//
// DSH exposes no slot inside the model editor's per-model entry. This bundle
// mounts from the `settings.models.provider-card` slot, locates each model entry
// element (`.fS-I-G_modelEntry`) by DOM, and portals one effort editor into each
// matching model entry. UI is built from @deepseek-ai/dsh-client-ui-primitives
// (Button/Pill) so it follows DSH's theme exactly.
window.__ModuleLoader__.load({
	id: "dsh-reasoning-effort-inject",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let jsx = require("react/jsx-runtime");
		let _react = require("react");
		let prim = require("@deepseek-ai/dsh-client-ui-primitives");
		let react_dom = null;
		try { react_dom = require("react-dom"); } catch (error) { react_dom = null; }

		/** The settings namespace whose providers carry `models[].reasoningEfforts`. */
		const SETTINGS_NS = "llm-pi-ai";
		/** Reasoning effort levels the profile schema declares (THINKING_LEVELS). */
		const LEVELS = ["off", "minimal", "low", "medium", "high", "xhigh", "max"];
		/** The per-model entry class of the models settings editor. */
		const MODEL_ENTRY = ".fS-I-G_modelEntry";

		/** Client context captured in `apply` so the card never depends on slot inject merging. */
		let activeContext = null;

		/** Guard: only target the llm-pi-ai namespace and a resolvable provider path. */
		function isPiAiProvider(provider) {
			return provider !== null && typeof provider === "object"
				&& provider.settingsNs === SETTINGS_NS
				&& Array.isArray(provider.settingsPath)
				&& provider.settingsPath.length > 0
				&& typeof provider.provider === "string" && provider.provider !== "";
		}

		/** Read the resolved `llm-pi-ai` namespace view through the settings Remote. */
		async function readPiAiView(settingsRemote) {
			if (!settingsRemote || typeof settingsRemote.describe !== "function") return null;
			const res = await settingsRemote.describe();
			if (!res || res.ok === false) return null;
			const view = (Array.isArray(res.value?.namespaces) ? res.value.namespaces : [])
				.find((item) => item && item.ns === SETTINGS_NS) ?? null;
			return view === null ? null : { view };
		}

		/** The provider profile inside the resolved namespace view (`providers` dict). */
		function providerValueOf(view, providerId) {
			const root = view && view.value && typeof view.value === "object" ? view.value : null;
			if (root === null) return void 0;
			if (root.providers && typeof root.providers === "object") return root.providers[providerId];
			return root[providerId];
		}

		/** Current levels a model declares in its `reasoningEfforts` (empty when unset). */
		function levelsOf(model) {
			const efforts = model && typeof model === "object" ? model.reasoningEfforts : void 0;
			if (efforts && typeof efforts === "object" && !Array.isArray(efforts)) {
				return LEVELS.filter((level) => Object.prototype.hasOwnProperty.call(efforts, level));
			}
			return [];
		}

		/** Build a schema-valid `reasoningEfforts` from the selected levels (wire = level name). */
		function effortsFromLevels(levels) {
			const out = {};
			for (const level of LEVELS) {
				if (levels.includes(level)) out[level] = level === "off" ? null : level;
			}
			return levels.some((level) => level !== "off") ? out : false;
		}

		/** One model's effort editor, portaled into its model entry. */
		function ModelEffortEditor({ providerId, model, models, index, settingsPath, revision, onSaved }) {
			const [selected, setSelected] = _react.useState(() => levelsOf(model));
			const [status, setStatus] = _react.useState("idle");
			const [detail, setDetail] = _react.useState("");
			const settingsRemote = activeContext && activeContext.remote && activeContext.remote.settings
				? activeContext.remote.settings : null;

			// Resync after a reload so freshly saved values (and provider swaps) show up.
			_react.useEffect(() => {
				setSelected(levelsOf(model));
			}, [providerId, revision, model && model.id]);

			const toggle = (level) => {
				setSelected((previous) => previous.includes(level) ? previous.filter((l) => l !== level) : [...previous, level]);
				if (status !== "idle") { setStatus("idle"); setDetail(""); }
			};

			const save = () => {
				if (!settingsRemote || typeof settingsRemote.mutate !== "function") {
					setStatus("error");
					setDetail("remote.settings.mutate unavailable");
					return;
				}
				const efforts = effortsFromLevels(selected);
				const modelsValue = models.map((m, i) => i === index ? { ...m, reasoningEfforts: efforts } : m);
				const patch = { providers: { [providerId]: { models: modelsValue } } };
				setStatus("saving");
				setDetail("");
				settingsRemote.update(SETTINGS_NS, patch, typeof revision === "number" ? revision : void 0)
					.then((res) => {
						if (res && res.ok === true) {
							setStatus("saved");
						if (typeof onSaved === "function") onSaved();
						} else {
							setStatus(res && res.error && res.error.code === "settings/conflict" ? "conflict" : "error");
							setDetail(res && res.error ? (typeof res.error.message === "string" && res.error.message !== "" ? res.error.message : res.error.code || JSON.stringify(res.error)) : JSON.stringify(res));
						}
					})
					.catch((err) => {
						setStatus("error");
						setDetail(err && err.message ? err.message : String(err));
					});
			};

			const label = model && typeof model.name === "string" && model.name !== "" ? model.name : model && model.id;
			const modelId = model && typeof model.id === "string" ? model.id : "";

			return jsx.jsxs("div", { style: reiBlock(), children: [
				jsx.jsxs("div", { style: reiTitleRow(), children: [
					jsx.jsx("span", { style: reiTitle(), children: "思考强度 / Thinking effort" }),
					modelId !== "" && modelId !== label ? jsx.jsx("span", { style: reiSub(), children: modelId }) : null
				] }),
				jsx.jsx("div", { style: reiChips(), children: LEVELS.map((level) => jsx.jsx(prim.Pill, {
					active: selected.includes(level),
					onClick: () => toggle(level),
					children: level
				}, level)) }),
				jsx.jsxs("div", { style: reiActionRow(), children: [
					jsx.jsx(prim.Button, {
						variant: "secondary",
						size: "sm",
						disabled: status === "saving",
						onClick: save,
						children: status === "saving" ? "保存中…" : "保存 / Save"
					}),
					status === "saved" ? jsx.jsx("span", { style: reiOk(), children: "已保存 / Saved" }) : null,
					status === "error" ? jsx.jsx("span", { style: reiErr(), children: detail ? `保存失败 / ${detail}` : "保存失败 / Save failed" }) : null,
					status === "conflict" ? jsx.jsx("span", { style: reiErr(), children: "设置已变更，请重试 / Changed, retry" }) : null
				] })
			] });
		}

		/** Locates this provider's model entries and portals editors into them. */
		function ModelEntryHost({ providerId, models, revision, settingsPath, onSaved }) {
			const hostRef = _react.useRef(null);
			const [slots, setSlots] = _react.useState([]); // [{el, id}]

			_react.useEffect(() => {
				const self = hostRef.current;
				if (!self) return;
				const scan = () => {
					if (!self.isConnected) return;
					setSlots(Array.from(document.querySelectorAll(MODEL_ENTRY)).map((el) => {
						const firstInput = el.querySelector("input");
						return { el, id: firstInput ? firstInput.value : "" };
					}));
				};
				scan();
				const observer = typeof MutationObserver !== "undefined" ? new MutationObserver(scan) : null;
				if (observer) observer.observe(document.body, { subtree: true, childList: true, characterData: true });
				const timer = setInterval(scan, 800);
				return () => {
					if (observer) observer.disconnect();
					clearInterval(timer);
				};
			}, []);

			return jsx.jsx("div", { ref: hostRef, "data-plugin": "dsh-reasoning-effort-inject", style: { display: "none" }, children:
				react_dom === null ? null : slots.map(({ el, id }) => {
					const index = models.findIndex((model) => model && model.id === id);
					if (index < 0) return null;
					return react_dom.createPortal(jsx.jsx(ModelEffortEditor, {
						providerId,
						model: models[index],
						models,
						index,
						settingsPath,
						revision,
						onSaved
					}, `${id}-reasoning-effort`), el);
				})
			});
		}

		/** The provider-card entry: loads the namespace view, then hands it to the host. */
		function ReasoningEffortCard(props) {
			const provider = props && typeof props === "object" ? props.provider : null;
			const [loaded, setLoaded] = _react.useState(null); // {providerId, view}
			const settingsRemote = activeContext && activeContext.remote && activeContext.remote.settings
				? activeContext.remote.settings : null;

			_react.useEffect(() => {
				let cancelled = false;
				if (!isPiAiProvider(provider)) {
					setLoaded(null);
					return;
				}
				if (!settingsRemote || typeof settingsRemote.describe !== "function") return;
				readPiAiView(settingsRemote).then((result) => {
					if (!cancelled) setLoaded({ providerId: provider.provider, view: result ? result.view : null });
				}).catch(() => {
					if (!cancelled) setLoaded({ providerId: provider.provider, view: null });
				});
				return () => { cancelled = true; };
			}, [provider, settingsRemote]);

			const providerId = provider && typeof provider.provider === "string" ? provider.provider : null;
			if (!isPiAiProvider(provider) || providerId === null || !settingsRemote) return null;
			const view = loaded && loaded.providerId === providerId ? loaded.view : null;
			const providerValue = view ? providerValueOf(view, providerId) : void 0;
			const models = Array.isArray(providerValue?.models) ? providerValue.models : [];
			const revision = typeof view?.revision === "number" ? view.revision : void 0;

			const reload = () => {
				if (!settingsRemote || typeof settingsRemote.describe !== "function") return;
				readPiAiView(settingsRemote).then((result) => {
					setLoaded({ providerId, view: result ? result.view : null });
				}).catch(() => {});
			};

			return jsx.jsx(ModelEntryHost, {
				providerId,
				models,
				revision,
				settingsPath: provider.settingsPath,
				onSaved: reload
			});
		}
		//#region inline styles — minimal layout only; color comes from DSH theme
		function reiBlock() { return { display: "flex", flexDirection: "column", gap: "5px", margin: "8px 0 2px" }; }
		function reiTitleRow() { return { display: "flex", alignItems: "baseline", gap: "6px", flexWrap: "wrap" }; }
		function reiTitle() { return { fontSize: "12px", fontWeight: 600, color: "var(--dsw-alias-label-secondary)" }; }
		function reiSub() { return { fontSize: "11px", color: "var(--dsw-alias-label-tertiary)", overflowWrap: "anywhere" }; }
		function reiChips() { return { display: "flex", flexWrap: "wrap", gap: "5px" }; }
		function reiActionRow() { return { display: "flex", alignItems: "center", gap: "8px" }; }
		function reiOk() { return { fontSize: "11px", color: "var(--dsw-color-success, #2e7d32)" }; }
		function reiErr() { return { fontSize: "11px", color: "var(--dsw-color-error, #c62828)", overflowWrap: "anywhere" }; }
		//#endregion

		/** Required services (cordis fiber inject). The slot is declared by
		 * ui-settings-models; registration depends on it via `slots.inject()`. */
		const inject = ["slots", "remote", "remote.settings"];

		function apply(ctx) {
			// Capture the client context for the card (independent of slot inject merging).
			activeContext = ctx;
			ctx.slots.inject("settings.models.provider-card", () => ctx.slots.register({
				name: "settings.models.provider-card",
				key: SETTINGS_NS,
				order: 20,
				registrant: "dsh-reasoning-effort-inject",
				inject: () => ({ settingsRemote: ctx.remote && ctx.remote.settings })
			}, ReasoningEffortCard));
		}

		exports.SETTINGS_NS = SETTINGS_NS;
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});
