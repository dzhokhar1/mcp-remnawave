export interface Config {
    baseUrl: string;
    apiToken: string;
    apiKey?: string;
    cookie?: string;
    readonly: boolean;
}

export function loadConfig(): Config {
    const baseUrl = process.env.REMNAWAVE_BASE_URL;
    const apiToken = process.env.REMNAWAVE_API_TOKEN;
    const apiKey = process.env.REMNAWAVE_API_KEY;
    const cookie = process.env.REMNAWAVE_COOKIE || process.env.REMNAWAVE_COOKIES;
    const readonly = process.env.REMNAWAVE_READONLY === 'true';

    if (!baseUrl) {
        throw new Error('REMNAWAVE_BASE_URL environment variable is required');
    }
    if (!apiToken) {
        throw new Error('REMNAWAVE_API_TOKEN environment variable is required');
    }

    return {
        baseUrl: baseUrl.replace(/\/+$/, ''),
        apiToken,
        apiKey,
        cookie,
        readonly,
    };
}
