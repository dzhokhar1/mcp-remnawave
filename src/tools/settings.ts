import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { RemnawaveClient } from '../client/index.js';
import { toolResult, toolError, auditLog } from './helpers.js';
import { Config } from '../config.js';

export function registerSettingsTools(server: McpServer, client: RemnawaveClient, config: Config) {
    server.tool('settings_get', 'Get Remnawave panel settings', {}, async () => {
        try { return toolResult(await client.getSettings()); } catch (e) { return toolError(e); }
    });

    // settings_update can rewrite security-critical panel configuration (webhook
    // targets, notification secrets, auth/HWID toggles) in a single call. It takes
    // an unconstrained key/value record because the panel's writable-settings schema
    // is version-specific, so it is kept OFF the LLM surface unless the operator
    // explicitly opts in — and every write is audit-logged.
    if (config.readonly || !config.allowSettingsWrite) return;

    server.tool('settings_update', 'Update Remnawave panel settings', {
        settings: z.record(z.unknown()).describe('Settings key-value pairs to update'),
    }, async ({ settings }) => {
        try {
            auditLog(`settings_update keys=${JSON.stringify(Object.keys(settings))}`);
            return toolResult(await client.updateSettings(settings));
        } catch (e) { return toolError(e); }
    });
}
