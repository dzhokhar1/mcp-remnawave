import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { RemnawaveClient } from '../client/index.js';
import { toolResult, toolResultRaw, toolError, auditLog } from './helpers.js';
import { Config } from '../config.js';

export function registerSystemTools(
    server: McpServer,
    client: RemnawaveClient,
    config: Config,
) {
    server.tool(
        'system_stats',
        'Get overall Remnawave panel statistics (users, nodes, traffic, memory, CPU)',
        {},
        async () => {
            try {
                const result = await client.getStats();
                return toolResult(result);
            } catch (e) {
                return toolError(e);
            }
        },
    );

    server.tool(
        'system_bandwidth_stats',
        'Get bandwidth statistics',
        {},
        async () => {
            try {
                const result = await client.getBandwidthStats();
                return toolResult(result);
            } catch (e) {
                return toolError(e);
            }
        },
    );

    server.tool(
        'system_nodes_metrics',
        'Get detailed node metrics',
        {},
        async () => {
            try {
                const result = await client.getNodesMetrics();
                return toolResult(result);
            } catch (e) {
                return toolError(e);
            }
        },
    );

    server.tool(
        'system_nodes_statistics',
        'Get node statistics',
        {},
        async () => {
            try {
                const result = await client.getNodesStatistics();
                return toolResult(result);
            } catch (e) {
                return toolError(e);
            }
        },
    );

    server.tool(
        'system_health',
        'Check Remnawave panel health status',
        {},
        async () => {
            try {
                const result = await client.getHealth();
                return toolResult(result);
            } catch (e) {
                return toolError(e);
            }
        },
    );

    server.tool(
        'system_metadata',
        'Get Remnawave panel metadata and version information',
        {},
        async () => {
            try {
                const result = await client.getSystemMetadata();
                return toolResult(result);
            } catch (e) {
                return toolError(e);
            }
        },
    );

    // Mints an X25519 private key for VLESS Reality. Off by default (returns
    // secret material); enable with the keygen opt-in.
    if (config.allowKeygen) {
        server.tool(
            'system_generate_x25519',
            'Generate X25519 key pair for VLESS Reality',
            {},
            async () => {
                try {
                    auditLog('system_generate_x25519 invoked (X25519 keypair generated)');
                    return toolResultRaw(await client.generateX25519());
                } catch (e) {
                    return toolError(e);
                }
            },
        );
    }

    server.tool(
        'auth_status',
        'Check current authentication status with Remnawave panel',
        {},
        async () => {
            try {
                const result = await client.getAuthStatus();
                return toolResult(result);
            } catch (e) {
                return toolError(e);
            }
        },
    );

    server.tool(
        'system_stats_recap',
        'Get system statistics recap',
        {},
        async () => {
            try {
                const result = await client.getStatsRecap();
                return toolResult(result);
            } catch (e) {
                return toolError(e);
            }
        },
    );

    // POST-backed tester with a server-side side effect — treat as a write and
    // keep it out of the readonly surface.
    if (!config.readonly) {
        server.tool(
            'system_srr_matcher',
            'Test subscription request routing rules',
            {
                input: z.string().describe('Input string to test against SRR rules'),
            },
            async (params) => {
                try {
                    const result = await client.testSrrMatcher(params);
                    return toolResult(result);
                } catch (e) {
                    return toolError(e);
                }
            },
        );
    }
}
