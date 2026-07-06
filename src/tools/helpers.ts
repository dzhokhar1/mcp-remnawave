export function sanitizeData(data: unknown): unknown {
    if (data === null || data === undefined) {
        return data;
    }
    if (Array.isArray(data)) {
        return data.map(sanitizeData);
    }
    if (typeof data === 'object') {
        const sanitized: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
            const lowerKey = key.toLowerCase();
            if (
                lowerKey === 'token' ||
                lowerKey === 'password' ||
                lowerKey === 'secret' ||
                lowerKey === 'privatekey' ||
                lowerKey === 'connectionkey' ||
                lowerKey === 'subscriptionurl' ||
                lowerKey === 'apikey' ||
                lowerKey === 'cookie' ||
                lowerKey === 'cookies'
            ) {
                sanitized[key] = typeof value === 'string'
                    ? (value.length > 8 ? `${value.substring(0, 4)}***${value.substring(value.length - 4)}` : '***')
                    : '***';
            } else {
                sanitized[key] = sanitizeData(value);
            }
        }
        return sanitized;
    }
    return data;
}

export function toolResult(data: unknown) {
    return {
        content: [
            {
                type: 'text' as const,
                text: JSON.stringify(sanitizeData(data), null, 2),
            },
        ],
    };
}

export function toolError(error: unknown) {
    const message =
        error instanceof Error ? error.message : String(error);
    return {
        content: [
            {
                type: 'text' as const,
                text: `Error: ${message}`,
            },
        ],
        isError: true,
    };
}

