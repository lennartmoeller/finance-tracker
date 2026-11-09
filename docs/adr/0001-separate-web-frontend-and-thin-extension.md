---
status: superseded by ADR-0005
---

# Separate web frontend and thin extension

The web frontend does everything except reading bank websites, and the Firefox extension only reads the bank websites no affordable API reaches and sends their raw transactions to the backend; the two meet only at the backend.
The extension exists only because a web page cannot read bank websites in the user's session ([components](../architecture.md#components)), while a web frontend works from any device once the system moves to Kubernetes and deploys as a container instead of a signed extension release.

## Considered options

- The extension as the whole user interface, which would ship every interface change as a signed extension release and work only in the Firefox it is installed in.
- A frontend that starts extension syncs, which would need a content-script relay because Firefox lacks `externally_connectable`, and gains nothing while the user must have the bank tab open anyway.
