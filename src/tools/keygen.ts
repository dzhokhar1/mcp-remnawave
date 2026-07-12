import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { RemnawaveClient } from '../client/index.js';
import { toolResultRaw, toolError, auditLog } from './helpers.js';
import { Config } from '../config.js';

export function registerKeygenTools(server: McpServer, client: RemnawaveClient, config: Config) {
    // keygen returns the node-registration SECRET_KEY — a credential that lets a
    // holder register a rogue node. Off by default (regardless of readonly, since
    // it is a GET that mints/returns a secret); enable only with an explicit flag.
    if (!config.allowKeygen) return;

    server.tool('keygen_get', 'Generate a new SECRET_KEY for node configuration', {}, async () => {
        try {
            auditLog('keygen_get invoked (node SECRET_KEY generated)');
            // Returned unredacted: producing the secret is the tool's purpose and it
            // is gated behind an explicit opt-in.
            return toolResultRaw(await client.getKeygen());
        } catch (e) { return toolError(e); }
    });
}
