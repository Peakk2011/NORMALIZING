/**
 * Returns a Promise that resolves after a given delay.
 * Supports cancellation via AbortSignal — integrates with
 * the same AbortController used for fetch or other async ops.
 */

/**
 * @param ms - Delay in milliseconds (must be ≥ 0)
 * @param signal - Optional AbortSignal to cancel the wait early.
 *                 Rejects with `signal.reason` if aborted.
 */

/**
 * @example
 * // Basic usage
 * await wait(1000);
 */

/**
 * @example
 * // With cancellation
 * const controller = new AbortController();
 * setTimeout(() => controller.abort(), 500);
 * await wait(2000, controller.signal); // rejects at 500ms
 */
const wait = (ms: number, signal?: AbortSignal): Promise<void> => {
    return new Promise((resolve, reject) => {
        if (signal?.aborted) return reject(signal.reason);

        const onAbort = () => {
            clearTimeout(id);
            reject(signal!.reason);
        };

        const id = setTimeout(() => {
            signal?.removeEventListener("abort", onAbort);
            resolve();
        }, ms);

        signal?.addEventListener("abort", onAbort, { once: true });
    });
};

export default wait;