import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { RemnawaveClient } from '../client/index.js';
import { toolResult, toolError } from './helpers.js';
import { Config } from '../config.js';

export function registerIpControlTools(server: McpServer, client: RemnawaveClient, config: Config) {
    // Everything here is a POST job-trigger or reveals sensitive data, so nothing
    // is registered in readonly mode (the client would block the POSTs anyway).
    if (config.readonly) return;

    // Fetching/reading client IPs deanonymizes VPN users and triggers node-side
    // jobs. Gated behind an explicit PII opt-in on top of write mode.
    if (config.allowPii) {
        server.tool('ip_control_fetch_ips', 'Fetch active IPs for a user (async job)', {
            uuid: z.string().describe('User UUID'),
        }, async ({ uuid }) => {
            try { return toolResult(await client.fetchIps(uuid)); } catch (e) { return toolError(e); }
        });

        server.tool('ip_control_get_fetch_ips_result', 'Get result of an IP fetch job', {
            jobId: z.string().describe('Job ID from fetch_ips'),
        }, async ({ jobId }) => {
            try { return toolResult(await client.getFetchIpsResult(jobId)); } catch (e) { return toolError(e); }
        });

        server.tool('ip_control_fetch_users_ips', 'Fetch IPs for all users on a node (async job)', {
            nodeUuid: z.string().describe('Node UUID'),
        }, async ({ nodeUuid }) => {
            try { return toolResult(await client.fetchUsersIps(nodeUuid)); } catch (e) { return toolError(e); }
        });

        server.tool('ip_control_get_fetch_users_ips_result', 'Get result of a users IP fetch job', {
            jobId: z.string().describe('Job ID from fetch_users_ips'),
        }, async ({ jobId }) => {
            try { return toolResult(await client.getFetchUsersIpsResult(jobId)); } catch (e) { return toolError(e); }
        });
    }

    server.tool('ip_control_drop_connections', 'Drop active connections for specified IPs', {
        ips: z.array(z.string()).describe('Array of IPs to drop connections for'),
        nodeUuid: z.string().describe('Node UUID'),
    }, async (params) => {
        try { return toolResult(await client.dropConnections(params)); } catch (e) { return toolError(e); }
    });
}
