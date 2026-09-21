/**
 * dsh-reasoning-effort-inject — host half.
 *
 * Deliberately trivial: this plugin's only job lives in the browser half
 * (lib/client.js), which registers a per-model "思考强度 / thinking effort"
 * editor into the `settings.models.provider-card` slot and persists
 * `reasoningEfforts` into the `llm-pi-ai` settings namespace through the
 * settings Remote. The Host has nothing to serve, so this apply is a no-op —
 * it exists only so the bundle resolves, mirroring the near-empty host entry of
 * @deepseek-ai/dsh-client-ui-settings-models.
 */

/** Cordis plugin name (matches the cordis.patch.yml loader id). */
export const name = 'reasoning-effort-inject';

/** Host plugin body — no host-side behavior for this plugin. */
export function apply() {}
