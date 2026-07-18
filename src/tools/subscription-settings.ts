import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { RemnawaveClient } from '../client/index.js';
import { toolResult, toolError } from './helpers.js';
import { Config } from '../config.js';

// Subscription settings (Remnawave 2.8.x): global subscription-page behavior
// (profile title, support link, update interval, Happ announce/routing, etc.).
export function registerSubscriptionSettingsTools(server: McpServer, client: RemnawaveClient, config: Config) {
    server.tool('subscription_settings_get', 'Get global subscription settings', {}, async () => {
        try { return toolResult(await client.getSubscriptionSettings()); } catch (e) { return toolError(e); }
    });

    if (config.readonly) return;

    server.tool('subscription_settings_update', 'Update global subscription settings', {
        uuid: z.string().describe('Subscription settings UUID (from subscription_settings_get)'),
        profileTitle: z.string().optional().describe('Profile title shown to clients'),
        supportLink: z.string().optional().describe('Support link'),
        profileUpdateInterval: z.number().int().min(1).optional().describe('Profile update interval (hours)'),
        isProfileWebpageUrlEnabled: z.boolean().optional().describe('Enable profile webpage URL'),
        serveJsonAtBaseSubscription: z.boolean().optional().describe('Serve JSON at base subscription URL'),
        happAnnounce: z.string().nullable().optional().describe('Happ announce text'),
        happRouting: z.string().nullable().optional().describe('Happ routing config'),
        isShowCustomRemarks: z.boolean().optional().describe('Show custom remarks'),
        randomizeHosts: z.boolean().optional().describe('Randomize host order'),
        customResponseHeaders: z.record(z.string()).optional().describe('Custom HTTP response headers'),
    }, async (params) => {
        try { return toolResult(await client.updateSubscriptionSettings(params)); } catch (e) { return toolError(e); }
    });
}
