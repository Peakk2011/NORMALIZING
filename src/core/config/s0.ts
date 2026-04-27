let sessionHandlersSetup = false;

export const setupSessionHandlers = (ses: Electron.Session): void => {
    if (sessionHandlersSetup) return;

    ses.webRequest.onBeforeSendHeaders((details, callback) => {
        details.requestHeaders["User-Agent"] = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";
        callback({ requestHeaders: details.requestHeaders });
    });

    ses.webRequest.onHeadersReceived((details, callback) => {
        const headers = { ...details.responseHeaders };
        delete headers["x-frame-options"];
        delete headers["X-Frame-Options"];
        callback({ responseHeaders: headers });
    });

    sessionHandlersSetup = true;
};