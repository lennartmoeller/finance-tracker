export async function withSyncTab<T>(
  read: (tabId: number) => Promise<T>,
): Promise<T> {
  const { id } = await browser.tabs.create({
    url: "about:blank",
    active: false,
  });
  if (id === undefined) throw new Error("Firefox opened no tab.");
  try {
    return await read(id);
  } finally {
    await browser.tabs.remove(id);
  }
}

export async function navigate(tabId: number, url: string): Promise<string> {
  const loaded = await new Promise<string>((resolve, reject) => {
    const timeout = setTimeout(() => {
      settle(new Error(`${new URL(url).host} did not load in time.`));
    }, 60_000);
    // tabs.onUpdated reports "complete" while the previous page is still shown, so only webNavigation tells when the new page loaded.
    const onCompleted = ({
      tabId: loadedTabId,
      frameId,
      url: loadedUrl,
    }: browser.webNavigation._OnCompletedDetails) => {
      if (loadedTabId === tabId && frameId === 0) settle(loadedUrl);
    };
    function settle(result: string | Error) {
      browser.webNavigation.onCompleted.removeListener(onCompleted);
      clearTimeout(timeout);
      if (result instanceof Error) reject(result);
      else resolve(result);
    }
    browser.webNavigation.onCompleted.addListener(onCompleted, {
      url: [{ schemes: ["https"] }],
    });
    browser.tabs.update(tabId, { url }).catch(settle);
  });
  // The extension may not inject into another host, such as a bank's login page, which the adapter rejects anyway.
  if (new URL(loaded).host !== new URL(url).host) return loaded;
  // In an inactive tab, a script injected before the page's first idle period never runs, so navigation ends only after one.
  await inject(tabId, {
    func: () =>
      new Promise<void>((resolve) => {
        requestIdleCallback(() => {
          resolve();
        });
      }),
  });
  return loaded;
}

// executeScript serializes a func into the page, so it uses nothing from outside its body, not even the import WXT makes of a bare browser.
export async function inject<T>(
  tabId: number,
  script: Omit<browser.scripting.ScriptInjection, "target">,
): Promise<T> {
  const [injection] = await browser.scripting.executeScript({
    ...script,
    target: { tabId },
  });
  if (injection?.error !== undefined) throw new Error(String(injection.error));
  return injection?.result as T;
}

export async function notLoggedIn(loginUrl: string): Promise<Error> {
  await browser.tabs.create({ url: loginUrl });
  return new Error("Log in first on the tab that opened.");
}
