export async function withSyncTab<T>(
  read: (tabId: number) => Promise<T>,
): Promise<T> {
  const { id: tabId } = await browser.tabs.create({
    url: "about:blank",
    active: false,
  });
  if (tabId === undefined) throw new Error("Firefox opened no tab.");
  try {
    return await read(tabId);
  } finally {
    await browser.tabs.remove(tabId);
  }
}

export async function navigate(tabId: number, url: string): Promise<string> {
  const loaded = await new Promise<string>((resolve, reject) => {
    const settle = (result: string | Error) => {
      browser.webNavigation.onCompleted.removeListener(onCompleted);
      clearTimeout(timeout);
      if (result instanceof Error) reject(result);
      else resolve(result);
    };
    const timeout = setTimeout(() => {
      settle(new Error(`${new URL(url).host} did not load in time.`));
    }, 60_000);
    // tabs.onUpdated reports "complete" while the previous page is still shown, so only webNavigation tells when the new page loaded.
    function onCompleted(details: browser.webNavigation._OnCompletedDetails) {
      if (details.tabId === tabId && details.frameId === 0) settle(details.url);
    }
    browser.webNavigation.onCompleted.addListener(onCompleted, {
      url: [{ schemes: ["https"] }],
    });
    browser.tabs.update(tabId, { url }).catch(settle);
  });
  // In an inactive tab, a file injected before the page's first idle period never ran, so navigation ends only after one.
  await browser.scripting.executeScript({
    target: { tabId },
    func: () =>
      new Promise<void>((resolve) => {
        requestIdleCallback(() => {
          resolve();
        });
      }),
  });
  return loaded;
}

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
