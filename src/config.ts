export interface Config {
    baseUrl: string;
    apiToken: string;
    apiKey?: string;
    cookie?: string;
    // Master gate: when true (the default), no create/update/delete tools are
    // registered AND the HTTP client refuses any non-GET request.
    readonly: boolean;
    // Fine-grained, off-by-default capability flags. Each unlocks a high-risk
    // subset even when readonly is false. Defaults are fail-closed.
    allowDestructive: boolean; // bulk / all-users / all-nodes destructive ops
    allowTokenAdmin: boolean; // create / delete panel API tokens
    allowSettingsWrite: boolean; // PATCH panel settings
    allowKeygen: boolean; // node SECRET_KEY + X25519 private key generation
    allowSecretsExport: boolean; // raw subscription config / connection keys
    allowPii: boolean; // fetch/reveal real client IP addresses
    allowPluginExec: boolean; // execute node plugins / truncate reports
    allowInsecureHttp: boolean; // permit non-loopback http:// base URL
}

function boolEnv(name: string, defaultValue: boolean): boolean {
    const raw = process.env[name];
    if (raw === undefined || raw === '') {
        return defaultValue;
    }
    const value = raw.trim().toLowerCase();
    return value === 'true' || value === '1' || value === 'yes';
}

// Header values are placed into fetch() headers verbatim. Reject control
// characters (incl. CR/LF, code points < 0x20 and DEL) to prevent
// header/request smuggling via a poisoned env value.
function assertNoControlChars(name: string, value: string): void {
    for (let i = 0; i < value.length; i++) {
        const code = value.charCodeAt(i);
        if (code < 0x20 || code === 0x7f) {
            throw new Error(
                `${name} contains control characters (possible header injection); refusing to start`,
            );
        }
    }
}

export function loadConfig(): Config {
    const baseUrlRaw = process.env.REMNAWAVE_BASE_URL;
    const apiToken = process.env.REMNAWAVE_API_TOKEN;
    const apiKey = process.env.REMNAWAVE_API_KEY;
    const cookie = process.env.REMNAWAVE_COOKIE || process.env.REMNAWAVE_COOKIES;

    if (!baseUrlRaw) {
        throw new Error('REMNAWAVE_BASE_URL environment variable is required');
    }
    if (!apiToken) {
        throw new Error('REMNAWAVE_API_TOKEN environment variable is required');
    }

    const allowInsecureHttp = boolEnv('REMNAWAVE_ALLOW_INSECURE_HTTP', false);

    // Validate the base URL and enforce https so the full-admin Bearer token is
    // never sent in cleartext. Plain http is allowed only for loopback panels or
    // with an explicit opt-in.
    let parsed: URL;
    try {
        parsed = new URL(baseUrlRaw);
    } catch {
        throw new Error(
            'REMNAWAVE_BASE_URL must be a valid absolute URL (e.g. https://vpn.example.com)',
        );
    }
    const isLoopback = ['localhost', '127.0.0.1', '[::1]', '::1'].includes(
        parsed.hostname,
    );
    if (parsed.protocol !== 'https:') {
        const httpAllowed =
            parsed.protocol === 'http:' && (isLoopback || allowInsecureHttp);
        if (!httpAllowed) {
            throw new Error(
                `REMNAWAVE_BASE_URL must use https:// (got ${parsed.protocol}//). ` +
                    'Plaintext http transmits the admin Bearer token in cleartext. ' +
                    'Loopback hosts are allowed automatically; otherwise set ' +
                    'REMNAWAVE_ALLOW_INSECURE_HTTP=true to override.',
            );
        }
    }

    assertNoControlChars('REMNAWAVE_API_TOKEN', apiToken);
    if (apiKey) {
        assertNoControlChars('REMNAWAVE_API_KEY', apiKey);
    }
    if (cookie) {
        assertNoControlChars('REMNAWAVE_COOKIE', cookie);
    }

    return {
        baseUrl: baseUrlRaw.replace(/\/+$/, ''),
        apiToken,
        apiKey,
        cookie,
        // Secure default: read-only unless the operator explicitly opts into writes.
        readonly: boolEnv('REMNAWAVE_READONLY', true),
        allowDestructive: boolEnv('REMNAWAVE_ALLOW_DESTRUCTIVE', false),
        allowTokenAdmin: boolEnv('REMNAWAVE_ALLOW_TOKEN_ADMIN', false),
        allowSettingsWrite: boolEnv('REMNAWAVE_ALLOW_SETTINGS_WRITE', false),
        allowKeygen: boolEnv('REMNAWAVE_ALLOW_KEYGEN', false),
        allowSecretsExport: boolEnv('REMNAWAVE_ALLOW_SECRETS_EXPORT', false),
        allowPii: boolEnv('REMNAWAVE_ALLOW_PII', false),
        allowPluginExec: boolEnv('REMNAWAVE_ALLOW_PLUGIN_EXEC', false),
        allowInsecureHttp,
    };
}
