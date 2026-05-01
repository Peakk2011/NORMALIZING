let sessionHandlersSetup = false;

const getPlatformString = (): string => {
    if (process.platform === "darwin") return "Macintosh; Intel Mac OS X 10_15_7";
    if (process.platform === "linux") return "X11; Linux x86_64";
    return "Windows NT 10.0; Win64; x64";
};

export const setupSessionHandlers = (ses: Electron.Session): void => {
    if (sessionHandlersSetup) return;

    ses.webRequest.onBeforeSendHeaders((details, callback) => {
        const platform = getPlatformString();
        details.requestHeaders["User-Agent"] = `Mozilla/5.0 (${platform}) AppleWebKit/537.36 (KHTML, like Gecko) Normalizing/1.0.0 Safari/537.36`;
        callback({ requestHeaders: details.requestHeaders });
    });

    sessionHandlersSetup = true;
};