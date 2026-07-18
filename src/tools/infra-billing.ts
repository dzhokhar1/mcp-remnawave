import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { RemnawaveClient } from '../client/index.js';
import { toolResult, toolError } from './helpers.js';
import { Config } from '../config.js';

export function registerInfraBillingTools(server: McpServer, client: RemnawaveClient, config: Config) {
    server.tool('billing_providers_list', 'List all infrastructure billing providers', {}, async () => {
        try { return toolResult(await client.getBillingProviders()); } catch (e) { return toolError(e); }
    });

    server.tool('billing_provider_get', 'Get a billing provider by UUID', {
        uuid: z.string().describe('Provider UUID'),
    }, async ({ uuid }) => {
        try { return toolResult(await client.getBillingProviderByUuid(uuid)); } catch (e) { return toolError(e); }
    });

    server.tool('billing_nodes_list', 'List all billing nodes', {}, async () => {
        try { return toolResult(await client.getBillingNodes()); } catch (e) { return toolError(e); }
    });

    server.tool('billing_history_list', 'List billing history', {}, async () => {
        try { return toolResult(await client.getBillingHistory()); } catch (e) { return toolError(e); }
    });

    if (config.readonly) return;

    server.tool('billing_provider_create', 'Create a new billing provider', {
        name: z.string().describe('Provider name'),
        description: z.string().optional().describe('Provider description'),
    }, async (params) => {
        try { return toolResult(await client.createBillingProvider(params)); } catch (e) { return toolError(e); }
    });

    server.tool('billing_provider_update', 'Update a billing provider', {
        uuid: z.string().describe('Provider UUID'),
        name: z.string().optional().describe('New name'),
        description: z.string().optional().describe('New description'),
    }, async (params) => {
        try { return toolResult(await client.updateBillingProvider(params)); } catch (e) { return toolError(e); }
    });

    server.tool('billing_provider_delete', 'Delete a billing provider', {
        uuid: z.string().describe('Provider UUID'),
    }, async ({ uuid }) => {
        try { await client.deleteBillingProvider(uuid); return toolResult({ success: true, message: `Provider ${uuid} deleted` }); } catch (e) { return toolError(e); }
    });

    server.tool('billing_node_create', 'Create a billing node', {
        nodeUuid: z.string().describe('Node UUID'),
        providerUuid: z.string().describe('Provider UUID'),
        pricePerMonth: z.number().optional().describe('Monthly price'),
    }, async (params) => {
        try { return toolResult(await client.createBillingNode(params)); } catch (e) { return toolError(e); }
    });

    server.tool('billing_node_update', 'Update a billing node', {
        uuid: z.string().describe('Billing node UUID'),
        pricePerMonth: z.number().optional().describe('New monthly price'),
    }, async (params) => {
        try { return toolResult(await client.updateBillingNode(params)); } catch (e) { return toolError(e); }
    });

    server.tool('billing_node_delete', 'Delete a billing node', {
        uuid: z.string().describe('Billing node UUID'),
    }, async ({ uuid }) => {
        try { await client.deleteBillingNode(uuid); return toolResult({ success: true, message: `Billing node ${uuid} deleted` }); } catch (e) { return toolError(e); }
    });

    server.tool('billing_history_create', 'Create a billing history entry', {
        providerUuid: z.string().describe('Provider UUID'),
        amount: z.number().describe('Amount'),
        description: z.string().optional().describe('Description'),
    }, async (params) => {
        try { return toolResult(await client.createBillingHistory(params)); } catch (e) { return toolError(e); }
    });

    server.tool('billing_history_delete', 'Delete a billing history entry', {
        uuid: z.string().describe('History entry UUID'),
    }, async ({ uuid }) => {
        try { await client.deleteBillingHistory(uuid); return toolResult({ success: true, message: `History entry ${uuid} deleted` }); } catch (e) { return toolError(e); }
    });
}
