import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { RemnawaveClient } from '../client/index.js';
import { toolResult, toolError, auditLog } from './helpers.js';
import { Config } from '../config.js';

export function registerNodeTools(server: McpServer, client: RemnawaveClient, config: Config) {
    server.tool(
        'nodes_list',
        'List all Remnawave nodes',
        {},
        async () => {
            try {
                const result = await client.getNodes();
                return toolResult(result);
            } catch (e) {
                return toolError(e);
            }
        },
    );

    server.tool(
        'nodes_get',
        'Get a specific node by UUID',
        {
            uuid: z.string().describe('Node UUID'),
        },
        async ({ uuid }) => {
            try {
                const result = await client.getNodeByUuid(uuid);
                return toolResult(result);
            } catch (e) {
                return toolError(e);
            }
        },
    );

    server.tool(
        'nodes_tags_list',
        'List all node tags',
        {},
        async () => {
            try {
                const result = await client.getNodeTags();
                return toolResult(result);
            } catch (e) {
                return toolError(e);
            }
        },
    );

    if (config.readonly) return;

    server.tool(
        'nodes_create',
        'Create a new node in Remnawave',
        {
            name: z.string().describe('Node name'),
            address: z.string().describe('Node address (IP or hostname)'),
            port: z.number().int().min(1).max(65535).optional().describe('Node port'),
            countryCode: z
                .string()
                .optional()
                .describe('Country code (e.g. US, DE, NL)'),
            isTrafficTrackingActive: z
                .boolean()
                .optional()
                .describe('Enable traffic tracking'),
            trafficLimitBytes: z
                .number()
                .optional()
                .describe('Traffic limit in bytes'),
            trafficResetDay: z
                .number()
                .optional()
                .describe('Day of month to reset traffic (1-31)'),
            notifyPercent: z
                .number()
                .optional()
                .describe('Traffic notification threshold percentage'),
            consumptionMultiplier: z
                .number()
                .optional()
                .describe('Traffic consumption multiplier'),
            nodeConsumptionMultiplier: z
                .number()
                .optional()
                .describe('Node traffic consumption multiplier'),
            proxyUrl: z
                .string()
                .optional()
                .describe('Node proxy URL'),
            note: z
                .string()
                .optional()
                .describe('Node note'),
            activeConfigProfileUuid: z
                .string()
                .describe('Config profile UUID to assign'),
            activeInbounds: z
                .array(z.string())
                .describe('Array of inbound UUIDs to enable'),
        },
        async (params) => {
            try {
                const body: Record<string, unknown> = {
                    name: params.name,
                    address: params.address,
                    configProfile: {
                        activeConfigProfileUuid:
                            params.activeConfigProfileUuid,
                        activeInbounds: params.activeInbounds,
                    },
                };
                if (params.port !== undefined) body.port = params.port;
                if (params.countryCode !== undefined)
                    body.countryCode = params.countryCode;
                if (params.isTrafficTrackingActive !== undefined)
                    body.isTrafficTrackingActive =
                        params.isTrafficTrackingActive;
                if (params.trafficLimitBytes !== undefined)
                    body.trafficLimitBytes = params.trafficLimitBytes;
                if (params.trafficResetDay !== undefined)
                    body.trafficResetDay = params.trafficResetDay;
                if (params.notifyPercent !== undefined)
                    body.notifyPercent = params.notifyPercent;
                if (params.consumptionMultiplier !== undefined)
                    body.consumptionMultiplier = params.consumptionMultiplier;
                if (params.nodeConsumptionMultiplier !== undefined)
                    body.nodeConsumptionMultiplier = params.nodeConsumptionMultiplier;
                if (params.proxyUrl !== undefined)
                    body.proxyUrl = params.proxyUrl;
                if (params.note !== undefined)
                    body.note = params.note;

                const result = await client.createNode(body);
                return toolResult(result);
            } catch (e) {
                return toolError(e);
            }
        },
    );

    server.tool(
        'nodes_update',
        'Update an existing node',
        {
            uuid: z.string().describe('Node UUID to update'),
            name: z.string().optional().describe('New node name'),
            address: z.string().optional().describe('New address'),
            port: z.number().int().min(1).max(65535).optional().describe('New port'),
            countryCode: z.string().optional().describe('New country code'),
            isTrafficTrackingActive: z
                .boolean()
                .optional()
                .describe('Enable/disable traffic tracking'),
            trafficLimitBytes: z
                .number()
                .optional()
                .describe('New traffic limit'),
            trafficResetDay: z
                .number()
                .optional()
                .describe('New traffic reset day'),
            notifyPercent: z
                .number()
                .optional()
                .describe('New notification threshold'),
            consumptionMultiplier: z
                .number()
                .optional()
                .describe('New consumption multiplier'),
            nodeConsumptionMultiplier: z
                .number()
                .optional()
                .describe('New node traffic consumption multiplier'),
            proxyUrl: z
                .string()
                .optional()
                .describe('New node proxy URL'),
            note: z
                .string()
                .optional()
                .describe('New node note'),
        },
        async (params) => {
            try {
                const result = await client.updateNode(params);
                return toolResult(result);
            } catch (e) {
                return toolError(e);
            }
        },
    );

    server.tool(
        'nodes_delete',
        'Delete a node from Remnawave',
        {
            uuid: z.string().describe('Node UUID to delete'),
        },
        async ({ uuid }) => {
            try {
                await client.deleteNode(uuid);
                return toolResult({
                    success: true,
                    message: `Node ${uuid} deleted`,
                });
            } catch (e) {
                return toolError(e);
            }
        },
    );

    server.tool(
        'nodes_enable',
        'Enable a disabled node',
        {
            uuid: z.string().describe('Node UUID'),
        },
        async ({ uuid }) => {
            try {
                const result = await client.enableNode(uuid);
                return toolResult(result);
            } catch (e) {
                return toolError(e);
            }
        },
    );

    server.tool(
        'nodes_disable',
        'Disable a node',
        {
            uuid: z.string().describe('Node UUID'),
        },
        async ({ uuid }) => {
            try {
                const result = await client.disableNode(uuid);
                return toolResult(result);
            } catch (e) {
                return toolError(e);
            }
        },
    );

    server.tool(
        'nodes_restart',
        'Restart a specific node',
        {
            uuid: z.string().describe('Node UUID'),
        },
        async ({ uuid }) => {
            try {
                const result = await client.restartNode(uuid);
                return toolResult(result);
            } catch (e) {
                return toolError(e);
            }
        },
    );

    // Fleet-wide restart: gated behind the destructive opt-in.
    if (config.allowDestructive) {
        server.tool(
            'nodes_restart_all',
            'Restart all nodes',
            {},
            async () => {
                try {
                    auditLog('nodes_restart_all invoked (all nodes)');
                    const result = await client.restartAllNodes();
                    return toolResult(result);
                } catch (e) {
                    return toolError(e);
                }
            },
        );
    }

    server.tool(
        'nodes_reset_traffic',
        'Reset traffic counter for a node',
        {
            uuid: z.string().describe('Node UUID'),
        },
        async ({ uuid }) => {
            try {
                const result = await client.resetNodeTraffic(uuid);
                return toolResult(result);
            } catch (e) {
                return toolError(e);
            }
        },
    );

    server.tool(
        'nodes_reorder',
        'Reorder nodes by providing an ordered array of UUIDs',
        {
            uuids: z
                .array(z.string())
                .describe('Ordered array of node UUIDs'),
        },
        async ({ uuids }) => {
            try {
                const result = await client.reorderNodes(uuids);
                return toolResult(result);
            } catch (e) {
                return toolError(e);
            }
        },
    );

    if (!config.allowDestructive) return;

    server.tool(
        'nodes_bulk_profile_modification',
        'Bulk modify config profile for selected nodes',
        {
            nodeUuids: z.array(z.string()).describe('Array of node UUIDs'),
            configProfileUuid: z.string().describe('New config profile UUID'),
        },
        async (params) => {
            try {
                const result = await client.bulkNodeProfileModification(params);
                return toolResult(result);
            } catch (e) {
                return toolError(e);
            }
        },
    );

    server.tool(
        'nodes_bulk_actions',
        'Bulk actions on selected nodes (enable/disable/restart)',
        {
            nodeUuids: z.array(z.string()).describe('Array of node UUIDs'),
            action: z.enum(['enable', 'disable', 'restart']).describe('Action to perform'),
        },
        async (params) => {
            try {
                const result = await client.bulkNodeActions(params);
                return toolResult(result);
            } catch (e) {
                return toolError(e);
            }
        },
    );

    server.tool(
        'nodes_bulk_update',
        'Bulk update properties for selected nodes',
        {
            nodeUuids: z.array(z.string()).describe('Array of node UUIDs'),
            countryCode: z.string().optional().describe('New country code'),
            consumptionMultiplier: z.number().optional().describe('New consumption multiplier'),
        },
        async (params) => {
            try {
                const result = await client.bulkUpdateNodes(params);
                return toolResult(result);
            } catch (e) {
                return toolError(e);
            }
        },
    );
}
