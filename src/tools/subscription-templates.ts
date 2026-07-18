import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { RemnawaveClient } from '../client/index.js';
import { toolResult, toolError } from './helpers.js';
import { Config } from '../config.js';

const TEMPLATE_TYPES = ['XRAY_JSON', 'XRAY_BASE64', 'MIHOMO', 'STASH', 'CLASH', 'SINGBOX'] as const;

// Subscription templates (Remnawave 2.8.x): per-client-type config templates used
// to render subscriptions (Xray JSON/Base64, Mihomo, Stash, Clash, Sing-box).
export function registerSubscriptionTemplateTools(server: McpServer, client: RemnawaveClient, config: Config) {
    server.tool('subscription_templates_list', 'List all subscription templates', {}, async () => {
        try { return toolResult(await client.getSubscriptionTemplates()); } catch (e) { return toolError(e); }
    });

    server.tool('subscription_templates_get', 'Get a subscription template by UUID', {
        uuid: z.string().describe('Template UUID'),
    }, async ({ uuid }) => {
        try { return toolResult(await client.getSubscriptionTemplate(uuid)); } catch (e) { return toolError(e); }
    });

    if (config.readonly) return;

    server.tool('subscription_templates_create', 'Create a subscription template', {
        name: z.string().describe('Template name'),
        templateType: z.enum(TEMPLATE_TYPES).describe('Template/client type'),
    }, async (params) => {
        try { return toolResult(await client.createSubscriptionTemplate(params)); } catch (e) { return toolError(e); }
    });

    server.tool('subscription_templates_update', 'Update a subscription template', {
        uuid: z.string().describe('Template UUID'),
        name: z.string().optional().describe('New name'),
        templateJson: z.record(z.unknown()).optional().describe('Template JSON body (for JSON-based types)'),
        encodedTemplateYaml: z.string().optional().describe('Base64-encoded YAML body (for YAML-based types)'),
    }, async (params) => {
        try { return toolResult(await client.updateSubscriptionTemplate(params)); } catch (e) { return toolError(e); }
    });

    server.tool('subscription_templates_delete', 'Delete a subscription template', {
        uuid: z.string().describe('Template UUID'),
    }, async ({ uuid }) => {
        try { await client.deleteSubscriptionTemplate(uuid); return toolResult({ success: true, message: `Template ${uuid} deleted` }); } catch (e) { return toolError(e); }
    });

    server.tool('subscription_templates_reorder', 'Reorder subscription templates by view position', {
        items: z.array(z.object({
            uuid: z.string().describe('Template UUID'),
            viewPosition: z.number().int().min(0).describe('New position'),
        })).describe('Templates with their new positions'),
    }, async (params) => {
        try { return toolResult(await client.reorderSubscriptionTemplates(params)); } catch (e) { return toolError(e); }
    });
}
