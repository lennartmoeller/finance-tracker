import { useEffect, useState, type SubmitEvent } from "react";
import { KeyRound } from "lucide-react";
import { saveConnection, storedConnection } from "../../api.ts";

export type ConnectErrors = { address?: string; apiToken?: string };

export function Connect({
  errors,
  onConnected,
}: {
  errors: ConnectErrors;
  onConnected: () => void;
}) {
  const [address, setAddress] = useState("");
  const [apiToken, setApiToken] = useState("");

  useEffect(() => {
    void storedConnection().then((stored) => {
      setAddress(stored.address);
      setApiToken(stored.apiToken);
    });
  }, []);

  const url = URL.parse(address.trim());
  const web = url?.protocol === "http:" || url?.protocol === "https:";
  const addressIssue =
    address.trim() && !web ? "Enter an http or https address." : undefined;

  async function connect(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!url) return;
    // Firefox grants a permission only while the click is handled, which ends at the first await, and its match patterns cannot name a port.
    await browser.permissions.request({
      origins: [`${url.protocol}//${url.hostname}/*`],
    });
    await saveConnection({ address: url.origin, apiToken: apiToken.trim() });
    onConnected();
  }

  return (
    <form className="form" onSubmit={(event) => void connect(event)}>
      <div className="intro">
        <div className="intro-icon">
          <KeyRound />
        </div>
        <p className="intro-title">Connect to the backend</p>
      </div>
      <div className="field">
        <label className="label" htmlFor="address">
          Address
        </label>
        <input
          className={
            (errors.address ?? addressIssue) ? "input invalid" : "input"
          }
          id="address"
          autoFocus={!errors.apiToken}
          autoComplete="off"
          spellCheck={false}
          inputMode="url"
          placeholder="http://localhost:3000"
          value={address}
          onChange={(event) => {
            setAddress(event.target.value);
          }}
        />
        <p className="field-msg error">{addressIssue ?? errors.address}</p>
      </div>
      <div className="field">
        <label className="label" htmlFor="token">
          API token
        </label>
        <input
          className={errors.apiToken ? "input invalid" : "input"}
          id="token"
          type="password"
          autoFocus={!!errors.apiToken}
          value={apiToken}
          onChange={(event) => {
            setApiToken(event.target.value);
          }}
        />
        <p className="field-msg error">{errors.apiToken}</p>
      </div>
      <button className="button primary block" disabled={!web}>
        Save
      </button>
    </form>
  );
}
