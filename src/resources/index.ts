import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { RemnawaveClient } from '../client/index.js';
import { sanitizeData, redactSecretsInText } from '../redact.js';

// Resource callbacks are a parallel surface to tools and must apply the same
// redaction on success AND contain/sanitize errors (a raw upstream error body
// could otherwise leak verbatim). This helper wraps a fetch+serialize so every
// resource shares identical, safe behavior.
async function jsonResource(
    uri: string,
    fetcher: () => Promise<unknown>,
) {
    try {
        const data = await fetcher();
        return {
            contents: [
                {
                    uri,
                    mimeType: 'application/json',
                    text: JSON.stringify(sanitizeData(data), null, 2),
                },
            ],
        };
    } catch (err) {
        const message = redactSecretsInText(
            err instanceof Error ? err.message : String(err),
        );
        return {
            contents: [
                {
                    uri,
                    mimeType: 'application/json',
                    text: JSON.stringify({ error: message }, null, 2),
                },
            ],
        };
    }
}

export function registerAllResources(
    server: McpServer,
    client: RemnawaveClient,
) {
    server.resource(
        'panel-stats',
        'remnawave://stats',
        {
            description:
                'Current Remnawave panel statistics (users, nodes, traffic, system)',
            mimeType: 'application/json',
        },
        async () => jsonResource('remnawave://stats', () => client.getStats()),
    );

    server.resource(
        'panel-nodes',
        'remnawave://nodes',
        {
            description: 'Status of all Remnawave nodes (online/offline, traffic)',
            mimeType: 'application/json',
        },
        async () => jsonResource('remnawave://nodes', () => client.getNodes()),
    );

    server.resource(
        'panel-health',
        'remnawave://health',
        {
            description: 'Remnawave panel health check',
            mimeType: 'application/json',
        },
        async () => jsonResource('remnawave://health', () => client.getHealth()),
    );

    server.resource(
        'user-details',
        new ResourceTemplate('remnawave://users/{uuid}', {
            list: undefined,
        }),
        {
            description: 'Detailed information about a specific Remnawave user',
            mimeType: 'application/json',
        },
        async (uri, params) => {
            const uuid = params.uuid as string;
            // Path encoding is handled in the client; errors are sanitized here.
            return jsonResource(uri.href, () => client.getUserByUuid(uuid));
        },
    );
}
