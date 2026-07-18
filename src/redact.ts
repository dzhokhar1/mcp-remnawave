// Centralized secret-redaction layer.
//
// Design goals (fail-closed):
//  - Redact by BOTH key-name patterns (case/separator-insensitive substring match,
//    so compound camelCase names like `webhookSecret`, `telegramBotToken`,
//    `vlessUuid` are covered) AND by value shape (proxy URIs, JWTs, URLs with
//    embedded credentials), so a secret leaks through neither channel.
//  - Fully mask matched values (no first-4/last-4 preview that would still leak
//    entropy for short/low-entropy secrets).
//  - The plain `uuid` primary-key field is intentionally NOT redacted: operators
//    need it to drive update/delete/enable/disable flows. Only the connection-secret
//    UUID variants (vlessUuid / shortUuid / subscriptionUuid) are redacted.

export const REDACTED = '[REDACTED]';

// Normalized-key substrings that indicate a secret. Keys are lowercased and
// stripped of non-alphanumerics before matching, so `webhook-secret`,
// `webhookSecret` and `WEBHOOK_SECRET` all normalize to `webhooksecret`.
const SECRET_KEY_SUBSTRINGS = [
    'password',
    'passphrase',
    'secret',
    'token',
    'apikey',
    'privatekey',
    'privkey',
    'publickey', // Reality public key etc. — cheap to hide, not needed by the model
    'pubkey',
    'connectionkey',
    'subscriptionurl',
    'subscriptionuuid',
    'shortuuid',
    'vlessuuid',
    'vmessuuid',
    'trojanpassword',
    'sspassword',
    'shadowsocks',
    'cookie',
    'credential',
    'clientsecret',
    'webhook',
    'bearer',
    'jwt',
    'x25519',
    'keypair',
    'mnemonic',
    'seedphrase',
];

// Value-shape detectors (anchored) used on the string branch of sanitizeData.
const PROXY_URI_RE =
    /^(vless|vmess|trojan|ss|ss2022|ssr|shadowsocks|hysteria2?|tuic|socks5?|wireguard|naive|juicity):\/\//i;
const JWT_RE = /^ey[A-Za-z0-9_-]{5,}\.ey[A-Za-z0-9_-]{5,}\.[A-Za-z0-9_-]+$/;
const URL_USERINFO_RE = /^[a-z][a-z0-9+.-]*:\/\/[^/@\s]+:[^/@\s]+@/i;

// Global scanners used to strip secrets that appear EMBEDDED inside free text
// (e.g. an API error message that echoes a connection string).
const EMBEDDED_PROXY_RE =
    /\b(?:vless|vmess|trojan|ss|ss2022|ssr|hysteria2?|tuic|socks5?|wireguard|naive|juicity):\/\/\S+/gi;
const EMBEDDED_JWT_RE =
    /\bey[A-Za-z0-9_-]{5,}\.ey[A-Za-z0-9_-]{5,}\.[A-Za-z0-9_-]+/g;
const EMBEDDED_USERINFO_RE =
    /([a-z][a-z0-9+.-]*:\/\/)[^/@\s]+:[^/@\s]+@/gi;

function normalizeKey(key: string): string {
    return key.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function isSecretKey(key: string): boolean {
    const normalized = normalizeKey(key);
    return SECRET_KEY_SUBSTRINGS.some((needle) => normalized.includes(needle));
}

export function looksLikeSecretValue(value: string): boolean {
    return (
        PROXY_URI_RE.test(value) ||
        JWT_RE.test(value) ||
        URL_USERINFO_RE.test(value)
    );
}

// Redact a standalone string value (used by the string branch of sanitizeData).
export function redactString(value: string): string {
    return looksLikeSecretValue(value) ? REDACTED : value;
}

// Redact secrets that appear embedded inside a larger free-text string, such as
// an error message. Used on the error path where we cannot mask by key name.
export function redactSecretsInText(text: string): string {
    return text
        .replace(EMBEDDED_PROXY_RE, REDACTED)
        .replace(EMBEDDED_JWT_RE, REDACTED)
        .replace(EMBEDDED_USERINFO_RE, `$1${REDACTED}@`);
}

export function sanitizeData(data: unknown): unknown {
    if (data === null || data === undefined) {
        return data;
    }
    if (typeof data === 'string') {
        return redactString(data);
    }
    if (Array.isArray(data)) {
        return data.map(sanitizeData);
    }
    if (typeof data === 'object') {
        const sanitized: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(
            data as Record<string, unknown>,
        )) {
            if (isSecretKey(key)) {
                sanitized[key] = REDACTED;
            } else {
                sanitized[key] = sanitizeData(value);
            }
        }
        return sanitized;
    }
    return data;
}
