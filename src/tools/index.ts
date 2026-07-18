import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { RemnawaveClient } from '../client/index.js';
import { Config } from '../config.js';
import { registerUserTools } from './users.js';
import { registerNodeTools } from './nodes.js';
import { registerHostTools } from './hosts.js';
import { registerSystemTools } from './system.js';
import { registerSubscriptionTools } from './subscriptions.js';
import { registerInboundTools } from './inbounds.js';
import { registerSquadTools } from './squads.js';
import { registerHwidTools } from './hwid.js';
import { registerApiTokenTools } from './api-tokens.js';
import { registerKeygenTools } from './keygen.js';
import { registerInfraBillingTools } from './infra-billing.js';
import { registerSnippetTools } from './snippets.js';
import { registerExternalSquadTools } from './external-squads.js';
import { registerSettingsTools } from './settings.js';
import { registerSubPageConfigTools } from './subscription-page-configs.js';
import { registerNodePluginTools } from './node-plugins.js';
import { registerIpControlTools } from './ip-control.js';
import { registerMetadataTools } from './metadata.js';
import { registerBandwidthTools } from './bandwidth.js';
import { registerSubscriptionTemplateTools } from './subscription-templates.js';
import { registerSubscriptionSettingsTools } from './subscription-settings.js';

export function registerAllTools(
    server: McpServer,
    client: RemnawaveClient,
    config: Config,
) {
    registerUserTools(server, client, config);
    registerNodeTools(server, client, config);
    registerHostTools(server, client, config);
    registerSystemTools(server, client, config);
    registerSubscriptionTools(server, client, config);
    registerInboundTools(server, client, config);
    registerSquadTools(server, client, config);
    registerHwidTools(server, client, config);
    registerApiTokenTools(server, client, config);
    registerKeygenTools(server, client, config);
    registerInfraBillingTools(server, client, config);
    registerSnippetTools(server, client, config);
    registerExternalSquadTools(server, client, config);
    registerSettingsTools(server, client, config);
    registerSubPageConfigTools(server, client, config);
    registerNodePluginTools(server, client, config);
    registerIpControlTools(server, client, config);
    registerMetadataTools(server, client, config);
    registerBandwidthTools(server, client);
    registerSubscriptionTemplateTools(server, client, config);
    registerSubscriptionSettingsTools(server, client, config);
}
