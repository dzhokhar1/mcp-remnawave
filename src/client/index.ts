import { REST_API } from '@remnawave/backend-contract';
import { Config } from '../config.js';
import { redactSecretsInText } from '../redact.js';

// Percent-encode a single path-segment value so attacker/LLM-controlled
// identifiers (username, tag, email, uuid, jobId, ...) cannot inject `/`, `..`,
// `?`, `#` or `%` into the request path (same-origin path traversal / query &
// fragment injection). Applied to the individual value only, never to an
// already-assembled path.
const enc = encodeURIComponent;

const DEFAULT_TIMEOUT_MS = 30_000;

export class RemnawaveClient {
    private baseUrl: string;
    private headers: Record<string, string>;
    private readonly readonly: boolean;
    private readonly timeoutMs: number;

    constructor(config: Config) {
        this.baseUrl = config.baseUrl;
        this.readonly = config.readonly;
        this.timeoutMs = DEFAULT_TIMEOUT_MS;
        this.headers = {
            Authorization: `Bearer ${config.apiToken}`,
            'Content-Type': 'application/json',
        };
        if (config.apiKey) {
            this.headers['X-Api-Key'] = config.apiKey;
        }
        if (config.cookie) {
            this.headers['Cookie'] = config.cookie;
        }
    }

    private async request<T = unknown>(
        method: string,
        path: string,
        body?: unknown,
    ): Promise<T> {
        // Enforce readonly at the transport layer: ordering-proof and cannot be
        // bypassed by a tool-registration slip.
        if (this.readonly && method !== 'GET') {
            throw new Error(
                `Blocked: server is in readonly mode; ${method} operations are not permitted`,
            );
        }

        const url = `${this.baseUrl}${path}`;
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), this.timeoutMs);

        let res: Response;
        try {
            res = await fetch(url, {
                method,
                headers: this.headers,
                body: body !== undefined ? JSON.stringify(body) : undefined,
                // Never follow redirects: undici does not strip custom auth
                // headers (e.g. X-Api-Key) on a cross-origin redirect, so an
                // attacker-controlled Location could exfiltrate credentials or
                // pivot into internal services.
                redirect: 'manual',
                signal: controller.signal,
            });
        } catch (err) {
            const name = (err as { name?: string }).name;
            if (name === 'AbortError') {
                throw new Error(
                    `Remnawave API request timed out after ${this.timeoutMs}ms`,
                );
            }
            // Do not leak raw network error detail (may include the URL/creds).
            throw new Error('Remnawave API request failed (network error)');
        } finally {
            clearTimeout(timer);
        }

        if (res.type === 'opaqueredirect' || (res.status >= 300 && res.status < 400)) {
            throw new Error(
                `Remnawave API returned an unexpected redirect (HTTP ${res.status}); refusing to follow`,
            );
        }

        if (!res.ok) {
            let detail = '';
            try {
                const errorBody = (await res.json()) as { message?: unknown };
                if (typeof errorBody?.message === 'string') {
                    // Include only the short message field, scrubbed of any
                    // embedded secret material, and never the full body/payload.
                    detail = ` - ${redactSecretsInText(errorBody.message).slice(0, 300)}`;
                }
            } catch {
                // non-JSON error body — ignore, use status only
            }
            throw new Error(
                `Remnawave API error: HTTP ${res.status} ${res.statusText}${detail}`,
            );
        }

        // Guard against a reverse proxy / captive portal / login page returning
        // HTML where JSON is expected.
        const contentType = res.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) {
            const text = await res.text();
            if (text.trim() === '') {
                return undefined as T;
            }
            throw new Error(
                `Remnawave API returned a non-JSON response (content-type: ${contentType || 'none'})`,
            );
        }

        return res.json() as Promise<T>;
    }

    private async get<T = unknown>(path: string): Promise<T> {
        return this.request<T>('GET', path);
    }

    private async post<T = unknown>(path: string, body?: unknown): Promise<T> {
        return this.request<T>('POST', path, body);
    }

    private async patch<T = unknown>(
        path: string,
        body?: unknown,
    ): Promise<T> {
        return this.request<T>('PATCH', path, body);
    }

    private async put<T = unknown>(path: string, body?: unknown): Promise<T> {
        return this.request<T>('PUT', path, body);
    }

    private async delete<T = unknown>(path: string): Promise<T> {
        return this.request<T>('DELETE', path);
    }

    // Users

    async getUsers(start = 0, size = 25) {
        return this.get(
            `${REST_API.USERS.GET}?start=${start}&size=${size}`,
        );
    }

    async getUserByUuid(uuid: string) {
        return this.get(REST_API.USERS.GET_BY_UUID(enc(uuid)));
    }

    async getUserByUsername(username: string) {
        return this.get(REST_API.USERS.GET_BY.USERNAME(enc(username)));
    }

    async getUserByShortUuid(shortUuid: string) {
        return this.get(REST_API.USERS.GET_BY.SHORT_UUID(enc(shortUuid)));
    }

    async getUserByTelegramId(telegramId: string) {
        return this.get(REST_API.USERS.GET_BY.TELEGRAM_ID(enc(telegramId)));
    }

    async getUserByEmail(email: string) {
        return this.get(REST_API.USERS.GET_BY.EMAIL(enc(email)));
    }

    async getUserByTag(tag: string) {
        return this.get(REST_API.USERS.GET_BY.TAG(enc(tag)));
    }

    async getUserById(id: string) {
        return this.get(REST_API.USERS.GET_BY.ID(enc(id)));
    }

    async getUserBySubscriptionUuid(subscriptionUuid: string) {
        return this.get(REST_API.USERS.GET_BY.SUBSCRIPTION_UUID(enc(subscriptionUuid)));
    }

    async getUserTags() {
        return this.get(REST_API.USERS.TAGS.GET);
    }

    async getUserAccessibleNodes(uuid: string) {
        return this.get(REST_API.USERS.ACCESSIBLE_NODES(enc(uuid)));
    }

    async getUserSubscriptionRequestHistory(uuid: string) {
        return this.get(REST_API.USERS.SUBSCRIPTION_REQUEST_HISTORY(enc(uuid)));
    }

    async resolveUsers(params: Record<string, unknown>) {
        return this.post(REST_API.USERS.RESOLVE, params);
    }

    async createUser(params: Record<string, unknown>) {
        return this.post(REST_API.USERS.CREATE, params);
    }

    async updateUser(params: Record<string, unknown>) {
        return this.patch(REST_API.USERS.UPDATE, params);
    }

    async deleteUser(uuid: string) {
        return this.delete(REST_API.USERS.DELETE(enc(uuid)));
    }

    async enableUser(uuid: string) {
        return this.post(REST_API.USERS.ACTIONS.ENABLE(enc(uuid)));
    }

    async disableUser(uuid: string) {
        return this.post(REST_API.USERS.ACTIONS.DISABLE(enc(uuid)));
    }

    async revokeUserSubscription(uuid: string) {
        return this.post(REST_API.USERS.ACTIONS.REVOKE_SUBSCRIPTION(enc(uuid)));
    }

    async resetUserTraffic(uuid: string) {
        return this.post(REST_API.USERS.ACTIONS.RESET_TRAFFIC(enc(uuid)));
    }

    async bulkDeleteUsersByStatus(params: Record<string, unknown>) {
        return this.post(REST_API.USERS.BULK.DELETE_BY_STATUS, params);
    }

    async bulkUpdateUsers(params: Record<string, unknown>) {
        return this.post(REST_API.USERS.BULK.UPDATE, params);
    }

    async bulkResetUsersTraffic(params: Record<string, unknown>) {
        return this.post(REST_API.USERS.BULK.RESET_TRAFFIC, params);
    }

    async bulkRevokeUsersSubscription(params: Record<string, unknown>) {
        return this.post(REST_API.USERS.BULK.REVOKE_SUBSCRIPTION, params);
    }

    async bulkDeleteUsers(params: Record<string, unknown>) {
        return this.post(REST_API.USERS.BULK.DELETE, params);
    }

    async bulkUpdateUserSquads(params: Record<string, unknown>) {
        return this.post(REST_API.USERS.BULK.UPDATE_SQUADS, params);
    }

    async bulkExtendUsersExpiration(params: Record<string, unknown>) {
        return this.post(REST_API.USERS.BULK.EXTEND_EXPIRATION_DATE, params);
    }

    async bulkAllUpdateUsers(params: Record<string, unknown>) {
        return this.post(REST_API.USERS.BULK.ALL.UPDATE, params);
    }

    async bulkAllResetUsersTraffic() {
        return this.post(REST_API.USERS.BULK.ALL.RESET_TRAFFIC);
    }

    async bulkAllExtendUsersExpiration(params: Record<string, unknown>) {
        return this.post(REST_API.USERS.BULK.ALL.EXTEND_EXPIRATION_DATE, params);
    }

    // Nodes

    async getNodes() {
        return this.get(REST_API.NODES.GET);
    }

    async getNodeByUuid(uuid: string) {
        return this.get(REST_API.NODES.GET_BY_UUID(enc(uuid)));
    }

    async getNodeTags() {
        return this.get(REST_API.NODES.TAGS.GET);
    }

    async createNode(params: Record<string, unknown>) {
        return this.post(REST_API.NODES.CREATE, params);
    }

    async updateNode(params: Record<string, unknown>) {
        return this.patch(REST_API.NODES.UPDATE, params);
    }

    async deleteNode(uuid: string) {
        return this.delete(REST_API.NODES.DELETE(enc(uuid)));
    }

    async enableNode(uuid: string) {
        return this.post(REST_API.NODES.ACTIONS.ENABLE(enc(uuid)));
    }

    async disableNode(uuid: string) {
        return this.post(REST_API.NODES.ACTIONS.DISABLE(enc(uuid)));
    }

    async restartNode(uuid: string) {
        return this.post(REST_API.NODES.ACTIONS.RESTART(enc(uuid)));
    }

    async restartAllNodes() {
        return this.post(REST_API.NODES.ACTIONS.RESTART_ALL);
    }

    async resetNodeTraffic(uuid: string) {
        return this.post(REST_API.NODES.ACTIONS.RESET_TRAFFIC(enc(uuid)));
    }

    async reorderNodes(uuids: string[]) {
        return this.post(REST_API.NODES.ACTIONS.REORDER, uuids);
    }

    async bulkNodeProfileModification(params: Record<string, unknown>) {
        return this.post(REST_API.NODES.BULK_ACTIONS.PROFILE_MODIFICATION, params);
    }

    async bulkNodeActions(params: Record<string, unknown>) {
        return this.post(REST_API.NODES.BULK_ACTIONS.ACTIONS, params);
    }

    async bulkUpdateNodes(params: Record<string, unknown>) {
        return this.post(REST_API.NODES.BULK_ACTIONS.UPDATE, params);
    }

    // Hosts

    async getHosts() {
        return this.get(REST_API.HOSTS.GET);
    }

    async getHostByUuid(uuid: string) {
        return this.get(REST_API.HOSTS.GET_BY_UUID(enc(uuid)));
    }

    async getHostTags() {
        return this.get(REST_API.HOSTS.TAGS.GET);
    }

    async createHost(params: Record<string, unknown>) {
        return this.post(REST_API.HOSTS.CREATE, params);
    }

    async updateHost(params: Record<string, unknown>) {
        return this.patch(REST_API.HOSTS.UPDATE, params);
    }

    async deleteHost(uuid: string) {
        return this.delete(REST_API.HOSTS.DELETE(enc(uuid)));
    }

    async bulkEnableHosts(params: Record<string, unknown>) {
        return this.post(REST_API.HOSTS.BULK.ENABLE_HOSTS, params);
    }

    async bulkDisableHosts(params: Record<string, unknown>) {
        return this.post(REST_API.HOSTS.BULK.DISABLE_HOSTS, params);
    }

    async bulkDeleteHosts(params: Record<string, unknown>) {
        return this.post(REST_API.HOSTS.BULK.DELETE_HOSTS, params);
    }

    // Remnawave 2.8.x: the per-field bulk endpoints (SET_INBOUND / SET_PORT) were
    // removed in favor of a single generic bulk update taking uuids + any fields.
    async bulkUpdateHosts(params: Record<string, unknown>) {
        return this.patch(REST_API.HOSTS.BULK.UPDATE, params);
    }

    async reorderHosts(params: Record<string, unknown>) {
        return this.post(REST_API.HOSTS.ACTIONS.REORDER, params);
    }

    // System

    async getStats() {
        return this.get(REST_API.SYSTEM.STATS.SYSTEM_STATS);
    }

    async getBandwidthStats() {
        return this.get(REST_API.SYSTEM.STATS.BANDWIDTH_STATS);
    }

    async getNodesMetrics() {
        return this.get(REST_API.SYSTEM.STATS.NODES_METRICS);
    }

    async getNodesStatistics() {
        return this.get(REST_API.SYSTEM.STATS.NODES_STATS);
    }

    async getStatsRecap() {
        return this.get(REST_API.SYSTEM.STATS.RECAP);
    }

    async getHealth() {
        return this.get(REST_API.SYSTEM.HEALTH);
    }

    async getSystemMetadata() {
        return this.get(REST_API.SYSTEM.METADATA);
    }

    async generateX25519() {
        return this.get(REST_API.SYSTEM.TOOLS.GENERATE_X25519);
    }

    async testSrrMatcher(params: Record<string, unknown>) {
        return this.post(REST_API.SYSTEM.TESTERS.SRR_MATCHER, params);
    }

    // Subscriptions

    async getSubscriptions(start = 0, size = 25) {
        return this.get(
            `${REST_API.SUBSCRIPTIONS.GET}?start=${start}&size=${size}`,
        );
    }

    async getSubscriptionByUuid(uuid: string) {
        return this.get(REST_API.SUBSCRIPTIONS.GET_BY.UUID(enc(uuid)));
    }

    async getSubscriptionByUsername(username: string) {
        return this.get(REST_API.SUBSCRIPTIONS.GET_BY.USERNAME(enc(username)));
    }

    async getSubscriptionByShortUuid(shortUuid: string) {
        return this.get(REST_API.SUBSCRIPTIONS.GET_BY.SHORT_UUID(enc(shortUuid)));
    }

    async getSubscriptionByShortUuidRaw(shortUuid: string) {
        return this.get(REST_API.SUBSCRIPTIONS.GET_BY.SHORT_UUID_RAW(enc(shortUuid)));
    }

    async getSubscriptionSubpageConfig(shortUuid: string) {
        return this.get(REST_API.SUBSCRIPTIONS.SUBPAGE.GET_CONFIG(enc(shortUuid)));
    }

    async getConnectionKeysByUuid(uuid: string) {
        return this.get(REST_API.SUBSCRIPTIONS.GET_CONNECTION_KEYS_BY_UUID(enc(uuid)));
    }

    async getSubscriptionInfo(shortUuid: string) {
        return this.get(REST_API.SUBSCRIPTION.GET_INFO(enc(shortUuid)));
    }

    async getSubscriptionRequestHistory() {
        return this.get(REST_API.SUBSCRIPTION_REQUEST_HISTORY.GET);
    }

    async getSubscriptionRequestHistoryStats() {
        return this.get(REST_API.SUBSCRIPTION_REQUEST_HISTORY.STATS);
    }

    // Config Profiles / Inbounds

    async getConfigProfiles() {
        return this.get(REST_API.CONFIG_PROFILES.GET);
    }

    async getConfigProfileByUuid(uuid: string) {
        return this.get(REST_API.CONFIG_PROFILES.GET_BY_UUID(enc(uuid)));
    }

    async getAllInbounds() {
        return this.get(REST_API.CONFIG_PROFILES.GET_ALL_INBOUNDS);
    }

    async getInboundsByProfileUuid(uuid: string) {
        return this.get(REST_API.CONFIG_PROFILES.GET_INBOUNDS_BY_PROFILE_UUID(enc(uuid)));
    }

    async getComputedConfigByProfileUuid(uuid: string) {
        return this.get(REST_API.CONFIG_PROFILES.GET_COMPUTED_CONFIG_BY_PROFILE_UUID(enc(uuid)));
    }

    async createConfigProfile(params: Record<string, unknown>) {
        return this.post(REST_API.CONFIG_PROFILES.CREATE, params);
    }

    async updateConfigProfile(params: Record<string, unknown>) {
        return this.patch(REST_API.CONFIG_PROFILES.UPDATE, params);
    }

    async deleteConfigProfile(uuid: string) {
        return this.delete(REST_API.CONFIG_PROFILES.DELETE(enc(uuid)));
    }

    async reorderConfigProfiles(params: Record<string, unknown>) {
        return this.post(REST_API.CONFIG_PROFILES.ACTIONS.REORDER, params);
    }

    // Internal Squads

    async getInternalSquads() {
        return this.get(REST_API.INTERNAL_SQUADS.GET);
    }

    async getSquadAccessibleNodes(uuid: string) {
        return this.get(REST_API.INTERNAL_SQUADS.ACCESSIBLE_NODES(enc(uuid)));
    }

    async createInternalSquad(params: Record<string, unknown>) {
        return this.post(REST_API.INTERNAL_SQUADS.CREATE, params);
    }

    async updateInternalSquad(params: Record<string, unknown>) {
        return this.patch(REST_API.INTERNAL_SQUADS.UPDATE, params);
    }

    async deleteInternalSquad(uuid: string) {
        return this.delete(REST_API.INTERNAL_SQUADS.DELETE(enc(uuid)));
    }

    async addUsersToSquad(squadUuid: string, userUuids: string[]) {
        return this.post(
            REST_API.INTERNAL_SQUADS.BULK_ACTIONS.ADD_USERS(enc(squadUuid)),
            { userUuids },
        );
    }

    async removeUsersFromSquad(squadUuid: string, userUuids: string[]) {
        return this.post(
            REST_API.INTERNAL_SQUADS.BULK_ACTIONS.REMOVE_USERS(enc(squadUuid)),
            { userUuids },
        );
    }

    async reorderInternalSquads(params: Record<string, unknown>) {
        return this.post(REST_API.INTERNAL_SQUADS.ACTIONS.REORDER, params);
    }

    // HWID

    async getUserHwidDevices(userUuid: string) {
        return this.get(REST_API.HWID.GET_USER_HWID_DEVICES(enc(userUuid)));
    }

    async getAllHwidDevices() {
        return this.get(REST_API.HWID.GET_ALL_HWID_DEVICES);
    }

    async getHwidStats() {
        return this.get(REST_API.HWID.STATS);
    }

    async getHwidTopUsers() {
        return this.get(REST_API.HWID.TOP_USERS_BY_DEVICES);
    }

    async createUserHwidDevice(params: Record<string, unknown>) {
        return this.post(REST_API.HWID.CREATE_USER_HWID_DEVICE, params);
    }

    async deleteHwidDevice(deviceUuid: string) {
        return this.post(REST_API.HWID.DELETE_USER_HWID_DEVICE, {
            uuid: deviceUuid,
        });
    }

    async deleteAllUserHwidDevices(userUuid: string) {
        return this.post(REST_API.HWID.DELETE_ALL_USER_HWID_DEVICES, {
            userUuid,
        });
    }

    // Bandwidth Stats

    async getNodesBandwidth() {
        return this.get(REST_API.BANDWIDTH_STATS.NODES.GET);
    }

    async getNodesRealtimeBandwidth() {
        return this.get(REST_API.BANDWIDTH_STATS.NODES.GET_REALTIME);
    }

    async getUserBandwidthByUuid(uuid: string) {
        return this.get(REST_API.BANDWIDTH_STATS.USERS.GET_BY_UUID(enc(uuid)));
    }

    async getNodeUsersBandwidth(nodeUuid: string) {
        return this.get(REST_API.BANDWIDTH_STATS.NODES.GET_USERS(enc(nodeUuid)));
    }

    async getUsersBandwidthByNodes() {
        return this.get(REST_API.BANDWIDTH_STATS.NODES.GET_USERS_BY_NODES);
    }

    // Auth

    async getAuthStatus() {
        return this.get(REST_API.AUTH.GET_STATUS);
    }

    // API Tokens

    async getApiTokens() {
        return this.get(REST_API.API_TOKENS.GET);
    }

    async getApiTokenScopes() {
        return this.get(REST_API.API_TOKENS.GET_SCOPES);
    }

    async createApiToken(params: Record<string, unknown>) {
        return this.post(REST_API.API_TOKENS.CREATE, params);
    }

    async deleteApiToken(uuid: string) {
        return this.delete(REST_API.API_TOKENS.DELETE(enc(uuid)));
    }

    // Keygen

    async getKeygen() {
        return this.get(REST_API.KEYGEN.GET);
    }

    // Infra Billing

    async getBillingProviders() {
        return this.get(REST_API.INFRA_BILLING.GET_PROVIDERS);
    }

    async getBillingProviderByUuid(uuid: string) {
        return this.get(REST_API.INFRA_BILLING.GET_PROVIDER_BY_UUID(enc(uuid)));
    }

    async createBillingProvider(params: Record<string, unknown>) {
        return this.post(REST_API.INFRA_BILLING.CREATE_PROVIDER, params);
    }

    async updateBillingProvider(params: Record<string, unknown>) {
        return this.patch(REST_API.INFRA_BILLING.UPDATE_PROVIDER, params);
    }

    async deleteBillingProvider(uuid: string) {
        return this.delete(REST_API.INFRA_BILLING.DELETE_PROVIDER(enc(uuid)));
    }

    async getBillingNodes() {
        return this.get(REST_API.INFRA_BILLING.GET_BILLING_NODES);
    }

    async createBillingNode(params: Record<string, unknown>) {
        return this.post(REST_API.INFRA_BILLING.CREATE_BILLING_NODE, params);
    }

    async updateBillingNode(params: Record<string, unknown>) {
        return this.patch(REST_API.INFRA_BILLING.UPDATE_BILLING_NODE, params);
    }

    async deleteBillingNode(uuid: string) {
        return this.delete(REST_API.INFRA_BILLING.DELETE_BILLING_NODE(enc(uuid)));
    }

    async getBillingHistory() {
        return this.get(REST_API.INFRA_BILLING.GET_BILLING_HISTORY);
    }

    async createBillingHistory(params: Record<string, unknown>) {
        return this.post(REST_API.INFRA_BILLING.CREATE_BILLING_HISTORY, params);
    }

    async deleteBillingHistory(uuid: string) {
        return this.delete(REST_API.INFRA_BILLING.DELETE_BILLING_HISTORY(enc(uuid)));
    }

    // Snippets

    async getSnippets() {
        return this.get(REST_API.SNIPPETS.GET);
    }

    async createSnippet(params: Record<string, unknown>) {
        return this.post(REST_API.SNIPPETS.CREATE, params);
    }

    async updateSnippet(params: Record<string, unknown>) {
        return this.patch(REST_API.SNIPPETS.UPDATE, params);
    }

    async deleteSnippet(params: Record<string, unknown>) {
        return this.post(REST_API.SNIPPETS.DELETE, params);
    }

    // External Squads

    async getExternalSquads() {
        return this.get(REST_API.EXTERNAL_SQUADS.GET);
    }

    async getExternalSquadByUuid(uuid: string) {
        return this.get(REST_API.EXTERNAL_SQUADS.GET_BY_UUID(enc(uuid)));
    }

    async createExternalSquad(params: Record<string, unknown>) {
        return this.post(REST_API.EXTERNAL_SQUADS.CREATE, params);
    }

    async updateExternalSquad(params: Record<string, unknown>) {
        return this.patch(REST_API.EXTERNAL_SQUADS.UPDATE, params);
    }

    async deleteExternalSquad(uuid: string) {
        return this.delete(REST_API.EXTERNAL_SQUADS.DELETE(enc(uuid)));
    }

    async addUsersToExternalSquad(squadUuid: string, userUuids: string[]) {
        return this.post(
            REST_API.EXTERNAL_SQUADS.BULK_ACTIONS.ADD_USERS(enc(squadUuid)),
            { userUuids },
        );
    }

    async removeUsersFromExternalSquad(squadUuid: string, userUuids: string[]) {
        return this.post(
            REST_API.EXTERNAL_SQUADS.BULK_ACTIONS.REMOVE_USERS(enc(squadUuid)),
            { userUuids },
        );
    }

    async reorderExternalSquads(params: Record<string, unknown>) {
        return this.post(REST_API.EXTERNAL_SQUADS.ACTIONS.REORDER, params);
    }

    // Settings

    async getSettings() {
        return this.get(REST_API.REMNAAWAVE_SETTINGS.GET);
    }

    async updateSettings(params: Record<string, unknown>) {
        return this.patch(REST_API.REMNAAWAVE_SETTINGS.UPDATE, params);
    }

    // Subscription Settings (Remnawave 2.8.x)

    async getSubscriptionSettings() {
        return this.get(REST_API.SUBSCRIPTION_SETTINGS.GET);
    }

    async updateSubscriptionSettings(params: Record<string, unknown>) {
        return this.patch(REST_API.SUBSCRIPTION_SETTINGS.UPDATE, params);
    }

    // Subscription Templates (Remnawave 2.8.x)

    async getSubscriptionTemplates() {
        return this.get(REST_API.SUBSCRIPTION_TEMPLATE.GET_ALL);
    }

    async getSubscriptionTemplate(uuid: string) {
        return this.get(REST_API.SUBSCRIPTION_TEMPLATE.GET(enc(uuid)));
    }

    async createSubscriptionTemplate(params: Record<string, unknown>) {
        return this.post(REST_API.SUBSCRIPTION_TEMPLATE.CREATE, params);
    }

    async updateSubscriptionTemplate(params: Record<string, unknown>) {
        return this.patch(REST_API.SUBSCRIPTION_TEMPLATE.UPDATE, params);
    }

    async deleteSubscriptionTemplate(uuid: string) {
        return this.delete(REST_API.SUBSCRIPTION_TEMPLATE.DELETE(enc(uuid)));
    }

    async reorderSubscriptionTemplates(params: Record<string, unknown>) {
        return this.post(REST_API.SUBSCRIPTION_TEMPLATE.ACTIONS.REORDER, params);
    }

    // Subscription Page Configs

    async getSubscriptionPageConfigs() {
        return this.get(REST_API.SUBSCRIPTION_PAGE_CONFIGS.GET_ALL);
    }

    async getSubscriptionPageConfig(uuid: string) {
        return this.get(REST_API.SUBSCRIPTION_PAGE_CONFIGS.GET(enc(uuid)));
    }

    async createSubscriptionPageConfig(params: Record<string, unknown>) {
        return this.post(REST_API.SUBSCRIPTION_PAGE_CONFIGS.CREATE, params);
    }

    async updateSubscriptionPageConfig(params: Record<string, unknown>) {
        return this.patch(REST_API.SUBSCRIPTION_PAGE_CONFIGS.UPDATE, params);
    }

    async deleteSubscriptionPageConfig(uuid: string) {
        return this.delete(REST_API.SUBSCRIPTION_PAGE_CONFIGS.DELETE(enc(uuid)));
    }

    async reorderSubscriptionPageConfigs(params: Record<string, unknown>) {
        return this.post(REST_API.SUBSCRIPTION_PAGE_CONFIGS.ACTIONS.REORDER, params);
    }

    async cloneSubscriptionPageConfig(params: Record<string, unknown>) {
        return this.post(REST_API.SUBSCRIPTION_PAGE_CONFIGS.ACTIONS.CLONE, params);
    }

    // Node Plugins

    async getNodePlugins() {
        return this.get(REST_API.NODE_PLUGINS.GET_ALL);
    }

    async getNodePlugin(uuid: string) {
        return this.get(REST_API.NODE_PLUGINS.GET(enc(uuid)));
    }

    async createNodePlugin(params: Record<string, unknown>) {
        return this.post(REST_API.NODE_PLUGINS.CREATE, params);
    }

    async updateNodePlugin(params: Record<string, unknown>) {
        return this.patch(REST_API.NODE_PLUGINS.UPDATE, params);
    }

    async deleteNodePlugin(uuid: string) {
        return this.delete(REST_API.NODE_PLUGINS.DELETE(enc(uuid)));
    }

    async reorderNodePlugins(params: Record<string, unknown>) {
        return this.post(REST_API.NODE_PLUGINS.ACTIONS.REORDER, params);
    }

    async cloneNodePlugin(params: Record<string, unknown>) {
        return this.post(REST_API.NODE_PLUGINS.ACTIONS.CLONE, params);
    }

    async executeNodePlugin(params: Record<string, unknown>) {
        return this.post(REST_API.NODE_PLUGINS.EXECUTOR, params);
    }

    async getTorrentBlockerReports() {
        return this.get(REST_API.NODE_PLUGINS.TORRENT_BLOCKER.GET_REPORTS);
    }

    async getTorrentBlockerStats() {
        return this.get(REST_API.NODE_PLUGINS.TORRENT_BLOCKER.GET_REPORTS_STATS);
    }

    async truncateTorrentBlockerReports() {
        return this.post(REST_API.NODE_PLUGINS.TORRENT_BLOCKER.TRUNCATE_REPORTS);
    }

    // IP Control

    async fetchIps(uuid: string) {
        return this.post(REST_API.IP_CONTROL.FETCH_IPS(enc(uuid)));
    }

    async getFetchIpsResult(jobId: string) {
        return this.get(REST_API.IP_CONTROL.GET_FETCH_IPS_RESULT(enc(jobId)));
    }

    async dropConnections(params: Record<string, unknown>) {
        return this.post(REST_API.IP_CONTROL.DROP_CONNECTIONS, params);
    }

    async fetchUsersIps(nodeUuid: string) {
        return this.post(REST_API.IP_CONTROL.FETCH_USERS_IPS(enc(nodeUuid)));
    }

    async getFetchUsersIpsResult(jobId: string) {
        return this.get(REST_API.IP_CONTROL.GET_FETCH_USERS_IPS_RESULT(enc(jobId)));
    }

    // Metadata

    async getNodeMetadata(uuid: string) {
        return this.get(REST_API.METADATA.NODE.GET(enc(uuid)));
    }

    async upsertNodeMetadata(uuid: string, params: Record<string, unknown>) {
        return this.put(REST_API.METADATA.NODE.UPSERT(enc(uuid)), params);
    }

    async getUserMetadata(uuid: string) {
        return this.get(REST_API.METADATA.USER.GET(enc(uuid)));
    }

    async upsertUserMetadata(uuid: string, params: Record<string, unknown>) {
        return this.put(REST_API.METADATA.USER.UPSERT(enc(uuid)), params);
    }
}
