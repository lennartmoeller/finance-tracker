import { defineContentScript } from "wxt/utils/define-content-script";

export default defineContentScript({
  matches: ["https://banking.ing.de/*"],
  registration: "runtime",
  async main() {
    if (!visible(dateInput("von"))) {
      button(/^Filter$/).click();
      await step("open the filter", () => visible(dateInput("von")));
    }
    // ING clamps a range beyond the 390 days it keeps online, writes the clamped start back into the field, and closes the filter once the list is updated.
    const from = germanDate(new Date().getFullYear() - 15);
    setValue(dateInput("von"), from);
    setValue(dateInput("bis"), germanDate(new Date().getFullYear()));
    button(/^Filter anwenden$/).click();
    await step(
      "apply the filter",
      () =>
        dateInput("von")?.value !== from &&
        !visible(dateInput("von")) &&
        !busy(),
    );

    button(/^Exportieren$/).click();
    await step("open the export dialog", () =>
      findButton(/^Jetzt exportieren$/),
    );
    const csv = [
      ...document.querySelectorAll<HTMLInputElement>(
        'input[type=radio][name*="exportTypes"]',
      ),
    ].find((radio) =>
      (radio.closest("label") ?? radio.parentElement)?.textContent.includes(
        "CSV",
      ),
    );
    if (!csv) throw new Error("ING's export dialog offers no CSV.");
    // Choosing the format is a round trip of its own; confirming before it ends exports nothing.
    csv.click();
    await waitFor(busy, 2_000);
    await step("select CSV", () => !busy());
    button(/^Jetzt exportieren$/).click();
  },
});

function visible(element: Element | null | undefined): element is HTMLElement {
  if (!(element instanceof HTMLElement)) return false;
  const style = getComputedStyle(element);
  return (
    style.display !== "none" &&
    style.visibility === "visible" &&
    element.offsetHeight > 0
  );
}

function busy(): boolean {
  return [...document.querySelectorAll('[class*="busy-indicator"]')].some(
    visible,
  );
}

function dateInput(name: "von" | "bis"): HTMLInputElement | null {
  return document.querySelector(
    `input[name="filterAnzeige:datum:${name}:input"]`,
  );
}

function findButton(label: RegExp): HTMLElement | undefined {
  return [
    ...document.querySelectorAll<HTMLElement>("a, button, input[type=submit]"),
  ].find(
    (element) =>
      label.test(
        (element instanceof HTMLInputElement
          ? element.value
          : element.textContent
        ).trim(),
      ) && visible(element),
  );
}

function button(label: RegExp): HTMLElement {
  const found = findButton(label);
  if (!found) throw new Error(`ING shows no button ${label.source}.`);
  return found;
}

function setValue(input: HTMLInputElement | null, value: string) {
  if (!input) throw new Error("ING shows no date filter.");
  input.focus();
  input.value = value;
  for (const type of ["input", "change", "blur"])
    input.dispatchEvent(new Event(type, { bubbles: true }));
}

function germanDate(year: number): string {
  const date = new Date();
  date.setFullYear(year);
  return date.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

async function waitFor(
  condition: () => unknown,
  timeout: number,
): Promise<boolean> {
  for (const deadline = Date.now() + timeout; Date.now() < deadline;) {
    if (condition()) return true;
    // Each message counts as activity, which keeps Firefox from suspending the extension's background during a sync.
    void browser.runtime.sendMessage("keepalive");
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  return false;
}

async function step(what: string, condition: () => unknown) {
  if (!(await waitFor(condition, 60_000)))
    throw new Error(`ING did not ${what} in time.`);
}
