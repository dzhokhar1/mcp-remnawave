import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { RemnawaveClient } from '../client/index.js';
import { toolResult, toolResultRaw, toolError, auditLog } from './helpers.js';
import { Config } from '../config.js';

export function registerApiTokenTools(server: McpServer, client: RemnawaveClient, config: Config) {
    server.tool('api_tokens_list', 'List all API tokens', {}, async () => {
        try { return toolResult(await client.getApiTokens()); } catch (e) { return toolError(e); }
    });

    // Panel API token lifecycle mints/removes durable full-admin credentials that
    // outlive this process — a model-invokable persistence/lockout primitive. Kept
    // off the LLM surface entirely unless the operator explicitly opts in.
    if (config.readonly || !config.allowTokenAdmin) return;

    server.tool('api_tokens_create', 'Create a new API token', {
        tokenName: z.string().describe('Token name'),
        tokenDescription: z.string().optional().describe('Token description'),
    }, async (params) => {
        try {
            auditLog(`api_tokens_create name=${JSON.stringify(params.tokenName)}`);
            // Returned unredacted so the operator can see/rotate the new token;
            // creation is also flagged to the audit log above.
            return toolResultRaw(await client.createApiToken(params));
        } catch (e) { return toolError(e); }
    });

    server.tool('api_tokens_delete', 'Delete an API token', {
        uuid: z.string().describe('Token UUID to delete'),
    }, async ({ uuid }) => {
        try {
            auditLog(`api_tokens_delete uuid=${JSON.stringify(uuid)}`);
            await client.deleteApiToken(uuid);
            return toolResult({ success: true, message: `Token ${uuid} deleted` });
        } catch (e) { return toolError(e); }
    });
}
