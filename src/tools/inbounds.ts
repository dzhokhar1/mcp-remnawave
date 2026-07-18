import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { RemnawaveClient } from '../client/index.js';
import { toolResult, toolError } from './helpers.js';
import { Config } from '../config.js';

export function registerInboundTools(
    server: McpServer,
    client: RemnawaveClient,
    config: Config,
) {
    server.tool(
        'config_profiles_list',
        'List all config profiles',
        {},
        async () => {
            try {
                const result = await client.getConfigProfiles();
                return toolResult(result);
            } catch (e) {
                return toolError(e);
            }
        },
    );

    server.tool(
        'config_profiles_get',
        'Get a config profile by UUID',
        {
            uuid: z.string().describe('Config profile UUID'),
        },
        async ({ uuid }) => {
            try {
                const result = await client.getConfigProfileByUuid(uuid);
                return toolResult(result);
            } catch (e) {
                return toolError(e);
            }
        },
    );

    server.tool(
        'inbounds_list',
        'List all inbounds from all config profiles',
        {},
        async () => {
            try {
                const result = await client.getAllInbounds();
                return toolResult(result);
            } catch (e) {
                return toolError(e);
            }
        },
    );

    server.tool(
        'config_profiles_get_inbounds',
        'Get inbounds for a specific config profile',
        {
            uuid: z.string().describe('Config profile UUID'),
        },
        async ({ uuid }) => {
            try {
                const result = await client.getInboundsByProfileUuid(uuid);
                return toolResult(result);
            } catch (e) {
                return toolError(e);
            }
        },
    );

    server.tool(
        'config_profiles_get_computed_config',
        'Get computed configuration for a config profile',
        {
            uuid: z.string().describe('Config profile UUID'),
        },
        async ({ uuid }) => {
            try {
                const result = await client.getComputedConfigByProfileUuid(uuid);
                return toolResult(result);
            } catch (e) {
                return toolError(e);
            }
        },
    );

    if (config.readonly) return;

    server.tool(
        'config_profiles_create',
        'Create a new config profile',
        {
            name: z.string().describe('Profile name'),
        },
        async (params) => {
            try {
                const result = await client.createConfigProfile(params);
                return toolResult(result);
            } catch (e) {
                return toolError(e);
            }
        },
    );

    server.tool(
        'config_profiles_update',
        'Update a config profile',
        {
            uuid: z.string().describe('Profile UUID'),
            name: z.string().optional().describe('New name'),
        },
        async (params) => {
            try {
                const result = await client.updateConfigProfile(params);
                return toolResult(result);
            } catch (e) {
                return toolError(e);
            }
        },
    );

    server.tool(
        'config_profiles_delete',
        'Delete a config profile',
        {
            uuid: z.string().describe('Profile UUID'),
        },
        async ({ uuid }) => {
            try {
                await client.deleteConfigProfile(uuid);
                return toolResult({ success: true, message: `Profile ${uuid} deleted` });
            } catch (e) {
                return toolError(e);
            }
        },
    );

    server.tool(
        'config_profiles_reorder',
        'Reorder config profiles',
        {
            uuids: z.array(z.string()).describe('Ordered array of profile UUIDs'),
        },
        async (params) => {
            try {
                const result = await client.reorderConfigProfiles(params);
                return toolResult(result);
            } catch (e) {
                return toolError(e);
            }
        },
    );
}
