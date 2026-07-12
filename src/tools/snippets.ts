import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { RemnawaveClient } from '../client/index.js';
import { toolResult, toolError } from './helpers.js';
import { Config } from '../config.js';

export function registerSnippetTools(server: McpServer, client: RemnawaveClient, config: Config) {
    server.tool('snippets_list', 'List all configuration snippets', {}, async () => {
        try { return toolResult(await client.getSnippets()); } catch (e) { return toolError(e); }
    });

    if (config.readonly) return;

    server.tool('snippets_create', 'Create a new configuration snippet', {
        name: z.string().describe('Snippet name'),
        content: z.string().describe('Snippet content'),
    }, async (params) => {
        try { return toolResult(await client.createSnippet(params)); } catch (e) { return toolError(e); }
    });

    server.tool('snippets_update', 'Update an existing snippet', {
        uuid: z.string().describe('Snippet UUID'),
        name: z.string().optional().describe('New name'),
        content: z.string().optional().describe('New content'),
    }, async (params) => {
        try { return toolResult(await client.updateSnippet(params)); } catch (e) { return toolError(e); }
    });

    server.tool('snippets_delete', 'Delete a snippet', {
        uuid: z.string().describe('Snippet UUID to delete'),
    }, async (params) => {
        try { return toolResult(await client.deleteSnippet(params)); } catch (e) { return toolError(e); }
    });
}
