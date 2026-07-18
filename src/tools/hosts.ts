import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { RemnawaveClient } from '../client/index.js';
import { toolResult, toolError, auditLog } from './helpers.js';
import { Config } from '../config.js';

const SUBSCRIPTION_TYPES = ['XRAY_JSON', 'XRAY_BASE64', 'MIHOMO', 'STASH', 'CLASH', 'SINGBOX'] as const;

export function registerHostTools(server: McpServer, client: RemnawaveClient, config: Config) {
    server.tool(
        'hosts_list',
        'List all Remnawave hosts',
        {},
        async () => {
            try {
                const result = await client.getHosts();
                return toolResult(result);
            } catch (e) {
                return toolError(e);
            }
        },
    );

    server.tool(
        'hosts_get',
        'Get a specific host by UUID',
        {
            uuid: z.string().describe('Host UUID'),
        },
        async ({ uuid }) => {
            try {
                const result = await client.getHostByUuid(uuid);
                return toolResult(result);
            } catch (e) {
                return toolError(e);
            }
        },
    );

    server.tool(
        'hosts_tags_list',
        'List all host tags',
        {},
        async () => {
            try {
                const result = await client.getHostTags();
                return toolResult(result);
            } catch (e) {
                return toolError(e);
            }
        },
    );

    if (config.readonly) return;

    server.tool(
        'hosts_create',
        'Create a new host in Remnawave',
        {
            remark: z.string().describe('Host remark/name'),
            address: z.string().describe('Host address'),
            port: z.number().int().min(1).max(65535).describe('Host port'),
            configProfileUuid: z
                .string()
                .describe('Config profile UUID'),
            configProfileInboundUuid: z
                .string()
                .describe('Config profile inbound UUID'),
            path: z.string().optional().describe('URL path'),
            sni: z.string().optional().describe('SNI (Server Name Indication)'),
            host: z.string().optional().describe('Host header'),
            alpn: z
                .enum(['h3', 'h2', 'http/1.1', 'h2,http/1.1', 'h3,h2,http/1.1', 'h3,h2'])
                .optional()
                .describe('ALPN protocol'),
            fingerprint: z
                .enum([
                    'chrome',
                    'firefox',
                    'safari',
                    'ios',
                    'android',
                    'edge',
                    'qq',
                    'random',
                    'randomized',
                ])
                .optional()
                .describe('TLS fingerprint'),
            isDisabled: z
                .boolean()
                .optional()
                .describe('Create in disabled state'),
            securityLayer: z
                .enum(['DEFAULT', 'TLS', 'NONE'])
                .optional()
                .describe('Security layer'),
            tag: z.string().optional().describe('Host tag'),
            tags: z.array(z.string()).optional().describe('Array of host tags'),
            pinnedPeerCertSha256: z.string().optional().describe('Pinned peer certificate SHA256'),
            verifyPeerCertByName: z.boolean().optional().describe('Verify peer certificate by name'),
            mihomoIpVersion: z.enum(['ipv4', 'ipv6', 'dual']).optional().describe('Mihomo IP version configuration'),
            serverDescription: z
                .string()
                .optional()
                .describe('Server description'),
            nodes: z
                .array(z.string())
                .optional()
                .describe('Array of node UUIDs to assign'),
            excludeFromSubscriptionTypes: z
                .array(z.enum(SUBSCRIPTION_TYPES))
                .optional()
                .describe('Subscription types to exclude this host from'),
        },
        async (params) => {
            try {
                const body: Record<string, unknown> = {
                    remark: params.remark,
                    address: params.address,
                    port: params.port,
                    inbound: {
                        configProfileUuid: params.configProfileUuid,
                        configProfileInboundUuid:
                            params.configProfileInboundUuid,
                    },
                };
                if (params.path !== undefined) body.path = params.path;
                if (params.sni !== undefined) body.sni = params.sni;
                if (params.host !== undefined) body.host = params.host;
                if (params.alpn !== undefined) body.alpn = params.alpn;
                if (params.fingerprint !== undefined)
                    body.fingerprint = params.fingerprint;
                if (params.isDisabled !== undefined)
                    body.isDisabled = params.isDisabled;
                if (params.securityLayer !== undefined)
                    body.securityLayer = params.securityLayer;
                if (params.tag !== undefined) body.tag = params.tag;
                if (params.tags !== undefined) body.tags = params.tags;
                if (params.pinnedPeerCertSha256 !== undefined) body.pinnedPeerCertSha256 = params.pinnedPeerCertSha256;
                if (params.verifyPeerCertByName !== undefined) body.verifyPeerCertByName = params.verifyPeerCertByName;
                if (params.mihomoIpVersion !== undefined) body.mihomoIpVersion = params.mihomoIpVersion;
                if (params.serverDescription !== undefined)
                    body.serverDescription = params.serverDescription;
                if (params.nodes !== undefined) body.nodes = params.nodes;
                if (params.excludeFromSubscriptionTypes !== undefined)
                    body.excludeFromSubscriptionTypes = params.excludeFromSubscriptionTypes;

                const result = await client.createHost(body);
                return toolResult(result);
            } catch (e) {
                return toolError(e);
            }
        },
    );

    server.tool(
        'hosts_update',
        'Update an existing host',
        {
            uuid: z.string().describe('Host UUID to update'),
            remark: z.string().optional().describe('New remark/name'),
            address: z.string().optional().describe('New address'),
            port: z.number().int().min(1).max(65535).optional().describe('New port'),
            path: z.string().optional().describe('New URL path'),
            sni: z.string().optional().describe('New SNI'),
            host: z.string().optional().describe('New host header'),
            alpn: z
                .enum(['h3', 'h2', 'http/1.1', 'h2,http/1.1', 'h3,h2,http/1.1', 'h3,h2'])
                .optional()
                .describe('New ALPN'),
            fingerprint: z
                .enum([
                    'chrome',
                    'firefox',
                    'safari',
                    'ios',
                    'android',
                    'edge',
                    'qq',
                    'random',
                    'randomized',
                ])
                .optional()
                .describe('New fingerprint'),
            isDisabled: z
                .boolean()
                .optional()
                .describe('Enable/disable host'),
            securityLayer: z
                .enum(['DEFAULT', 'TLS', 'NONE'])
                .optional()
                .describe('New security layer'),
            tag: z.string().optional().describe('New tag'),
            tags: z.array(z.string()).optional().describe('New array of host tags'),
            pinnedPeerCertSha256: z.string().optional().describe('New pinned peer certificate SHA256'),
            verifyPeerCertByName: z.boolean().optional().describe('New verify peer certificate by name'),
            mihomoIpVersion: z.enum(['ipv4', 'ipv6', 'dual']).optional().describe('New Mihomo IP version configuration'),
            serverDescription: z
                .string()
                .optional()
                .describe('New server description'),
            excludeFromSubscriptionTypes: z
                .array(z.enum(SUBSCRIPTION_TYPES))
                .optional()
                .describe('Subscription types to exclude this host from'),
        },
        async (params) => {
            try {
                const result = await client.updateHost(params);
                return toolResult(result);
            } catch (e) {
                return toolError(e);
            }
        },
    );

    server.tool(
        'hosts_delete',
        'Delete a host from Remnawave',
        {
            uuid: z.string().describe('Host UUID to delete'),
        },
        async ({ uuid }) => {
            try {
                await client.deleteHost(uuid);
                return toolResult({
                    success: true,
                    message: `Host ${uuid} deleted`,
                });
            } catch (e) {
                return toolError(e);
            }
        },
    );

    if (!config.allowDestructive) return;

    server.tool(
        'hosts_bulk_enable',
        'Bulk enable selected hosts',
        { uuids: z.array(z.string()).describe('Array of host UUIDs') },
        async (params) => {
            try { return toolResult(await client.bulkEnableHosts(params)); } catch (e) { return toolError(e); }
        },
    );

    server.tool(
        'hosts_bulk_disable',
        'Bulk disable selected hosts',
        { uuids: z.array(z.string()).describe('Array of host UUIDs') },
        async (params) => {
            try { return toolResult(await client.bulkDisableHosts(params)); } catch (e) { return toolError(e); }
        },
    );

    server.tool(
        'hosts_bulk_delete',
        'Bulk delete selected hosts',
        { uuids: z.array(z.string()).describe('Array of host UUIDs') },
        async (params) => {
            try {
                auditLog(`hosts_bulk_delete count=${(params.uuids as string[]).length}`);
                return toolResult(await client.bulkDeleteHosts(params));
            } catch (e) { return toolError(e); }
        },
    );

    server.tool(
        'hosts_bulk_set_inbound',
        'Bulk set inbound for selected hosts',
        {
            uuids: z.array(z.string()).describe('Array of host UUIDs'),
            configProfileUuid: z.string().describe('Config profile UUID'),
            configProfileInboundUuid: z.string().describe('Inbound UUID'),
        },
        async (params) => {
            try { return toolResult(await client.bulkSetHostInbound(params)); } catch (e) { return toolError(e); }
        },
    );

    server.tool(
        'hosts_bulk_set_port',
        'Bulk set port for selected hosts',
        {
            uuids: z.array(z.string()).describe('Array of host UUIDs'),
            port: z.number().int().min(1).max(65535).describe('New port number'),
        },
        async (params) => {
            try { return toolResult(await client.bulkSetHostPort(params)); } catch (e) { return toolError(e); }
        },
    );
}
