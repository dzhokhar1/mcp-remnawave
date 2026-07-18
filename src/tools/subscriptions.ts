import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { RemnawaveClient } from '../client/index.js';
import { toolResult, toolResultRaw, toolError } from './helpers.js';
import { Config } from '../config.js';

export function registerSubscriptionTools(
    server: McpServer,
    client: RemnawaveClient,
    config: Config,
) {
    server.tool(
        'subscriptions_list',
        'List all subscriptions with pagination',
        {
            start: z.number().int().min(0).default(0).describe('Offset for pagination'),
            size: z.number().int().min(1).max(500).default(25).describe('Number of subscriptions (max 500)'),
        },
        async ({ start, size }) => {
            try {
                const result = await client.getSubscriptions(start, size);
                return toolResult(result);
            } catch (e) {
                return toolError(e);
            }
        },
    );

    server.tool(
        'subscriptions_get_by_uuid',
        'Get subscription details by UUID',
        {
            uuid: z.string().describe('Subscription UUID'),
        },
        async ({ uuid }) => {
            try {
                const result = await client.getSubscriptionByUuid(uuid);
                return toolResult(result);
            } catch (e) {
                return toolError(e);
            }
        },
    );

    server.tool(
        'subscriptions_get_by_username',
        'Get subscription details by username',
        {
            username: z.string().describe('Username'),
        },
        async ({ username }) => {
            try {
                const result =
                    await client.getSubscriptionByUsername(username);
                return toolResult(result);
            } catch (e) {
                return toolError(e);
            }
        },
    );

    server.tool(
        'subscriptions_get_by_short_uuid',
        'Get subscription details by short UUID',
        {
            shortUuid: z.string().describe('Short UUID'),
        },
        async ({ shortUuid }) => {
            try {
                const result =
                    await client.getSubscriptionByShortUuid(shortUuid);
                return toolResult(result);
            } catch (e) {
                return toolError(e);
            }
        },
    );

    server.tool(
        'subscription_info',
        'Get subscription info by short UUID (public endpoint)',
        {
            shortUuid: z.string().describe('Short UUID'),
        },
        async ({ shortUuid }) => {
            try {
                const result =
                    await client.getSubscriptionInfo(shortUuid);
                return toolResult(result);
            } catch (e) {
                return toolError(e);
            }
        },
    );

    // The following tools export live VPN connection credentials (raw vless://,
    // ss://, trojan:// URIs, Reality keys). Handing these to the model means
    // sending working credentials to the LLM/provider, logs and transcripts, so
    // they are OFF by default and only registered with an explicit opt-in. When
    // enabled, they intentionally return raw (unredacted) material — that is their
    // purpose — which is why the opt-in exists.
    if (config.allowSecretsExport) {
        server.tool(
            'subscriptions_get_raw_by_short_uuid',
            'Get raw subscription config by short UUID (exports live connection credentials)',
            { shortUuid: z.string().describe('Short UUID') },
            async ({ shortUuid }) => {
                try { return toolResultRaw(await client.getSubscriptionByShortUuidRaw(shortUuid)); } catch (e) { return toolError(e); }
            },
        );

        server.tool(
            'subscriptions_get_subpage_config',
            'Get subscription page configuration (may include connection credentials)',
            { shortUuid: z.string().describe('Short UUID') },
            async ({ shortUuid }) => {
                try { return toolResultRaw(await client.getSubscriptionSubpageConfig(shortUuid)); } catch (e) { return toolError(e); }
            },
        );

        server.tool(
            'subscriptions_get_connection_keys',
            'Get connection keys for a subscription (exports live connection credentials)',
            { uuid: z.string().describe('Subscription UUID') },
            async ({ uuid }) => {
                try { return toolResultRaw(await client.getConnectionKeysByUuid(uuid)); } catch (e) { return toolError(e); }
            },
        );
    }

    server.tool(
        'subscription_request_history_list',
        'List subscription request history',
        {},
        async () => {
            try { return toolResult(await client.getSubscriptionRequestHistory()); } catch (e) { return toolError(e); }
        },
    );

    server.tool(
        'subscription_request_history_stats',
        'Get subscription request history statistics',
        {},
        async () => {
            try { return toolResult(await client.getSubscriptionRequestHistoryStats()); } catch (e) { return toolError(e); }
        },
    );
}
