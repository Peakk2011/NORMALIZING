export const serialize = (value: unknown): unknown => {
    if (value instanceof Error) {
        return {
            name: value.name,
            message: value.message,
            stack: value.stack,
        };
    }

    if (typeof value === "bigint") return value.toString();
    if (typeof value === "function") return `[function ${value.name || "anonymous"}]`;

    try {
        return JSON.parse(JSON.stringify(value));
    } catch {
        return String(value);
    }
};

export default serialize;