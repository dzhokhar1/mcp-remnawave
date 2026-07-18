import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { RemnawaveClient } from '../client/index.js';
import { toolResult, toolError } from './helpers.js';

// Bandwidth statistics (read-only). The client already had these methods but no
// tools were exposed for them; 2.8.x also adds per-node user breakdowns.
export function registerBandwidthTools(server: McpServer, client: RemnawaveClient) {
    server.tool('bandwidth_nodes', 'Get bandwidth usage per node', {}, async () => {
        try { return toolResult(await client.getNodesBandwidth()); } catch (e) { return toolError(e); }
    });

    server.tool('bandwidth_nodes_realtime', 'Get realtime bandwidth usage per node', {}, async () => {
        try { return toolResult(await client.getNodesRealtimeBandwidth()); } catch (e) { return toolError(e); }
    });

    server.tool('bandwidth_node_users', 'Get bandwidth usage of users on a specific node (Remnawave 2.8.x)', {
        nodeUuid: z.string().describe('Node UUID'),
    }, async ({ nodeUuid }) => {
        try { return toolResult(await client.getNodeUsersBandwidth(nodeUuid)); } catch (e) { return toolError(e); }
    });

    server.tool('bandwidth_users_by_nodes', 'Get per-user bandwidth usage broken down by node (Remnawave 2.8.x)', {}, async () => {
        try { return toolResult(await client.getUsersBandwidthByNodes()); } catch (e) { return toolError(e); }
    });

    server.tool('bandwidth_user', 'Get bandwidth usage for a specific user', {
        uuid: z.string().describe('User UUID'),
    }, async ({ uuid }) => {
        try { return toolResult(await client.getUserBandwidthByUuid(uuid)); } catch (e) { return toolError(e); }
    });
}
