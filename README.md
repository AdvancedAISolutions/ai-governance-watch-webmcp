# AI Governance Watch

A standalone, source-grounded WebMCP Briefing Desk for AI governance research.

- Live demo: https://md-gov-watch.lovable.app/webmcp
- Final deployed implementation: `310114de0dfcc426b19f9f2b438b9e7c54dbd487`
- Verified pre-challenge baseline: `c5543d31d7cfc9bd4492bc539112c8801bada8b9`

## What it does

The desk exposes four browser-native tools through `document.modelContext.registerTool`:

| Tool                | Scope         | Purpose                                                                                                   |
| ------------------- | ------------- | --------------------------------------------------------------------------------------------------------- |
| `search_updates`    | Read only     | Searches the dated governance snapshot with structured filters.                                           |
| `get_source_record` | Read only     | Retrieves one exact Source Ledger record by MSR identifier.                                               |
| `compare_updates`   | Read only     | Compares two or three developments while preserving dates, status, confidence, jurisdiction, and sources. |
| `build_briefing`    | Session write | Builds a visible, reversible briefing in React memory for human review.                                   |

All handlers operate only on the bundled 2026-08-22 snapshot containing 12 records and a 62-entry Source Ledger. They make no network, database, AI-provider, storage, publication, email, or download calls.

Tool inputs use strict JSON Schema plus runtime validation. Results are bounded, directly JSON-serializable objects with a top-level `ok` field. Registration uses one `AbortController` per mount lifecycle, awaits all four registration promises, preserves same-origin exposure, and cleans up on unmount.

## Run locally

No environment variables are required.

```sh
npm install
npm run dev
npm run verify:webmcp
npm run build
npm run lint
```

Open `http://localhost:3000/webmcp` or follow the URL printed by Vite. The root route redirects to `/webmcp`.

WebMCP requires the ChatGPT in-app browser or a compatible Chrome build with WebMCP testing enabled. Without `document.modelContext`, the human interface remains available and explains that tools were not registered.

## Human-agent workflow

1. Search the snapshot for relevant developments.
2. Retrieve exact supporting Source Ledger records.
3. Compare developments without collapsing event dates into publication dates or softening recorded legal status.
4. Build a one-to-four-item briefing.
5. Review, edit, reorder, remove, or clear the visible session-only draft.

Reloading clears the briefing. Nothing is persisted or published.

## Challenge-work boundary

The broader Maryland AI Governance Monitor existed before the challenge. This repository intentionally contains only the standalone WebMCP challenge surface and the minimum evidence data and components required to run and verify it. The gated monitor, MRAC presentation shell, Jay assistant, authentication, Supabase integration, events, unrelated routes, and Lovable planning metadata are excluded.

Only the WebMCP extension and its human-agent briefing workflow are presented as challenge work.

## Independence

This is an independent editorial prototype by Justin Gallucci. It is not affiliated with, endorsed by, sponsored by, or published by the Maryland Responsible AI Council, the State of Maryland, or any government body.

The snapshot is dated 2026-08-22. It is not a live feed or automated legal analysis. Third-party materials remain the property of their owners.

## License

Original source code is available under the MIT License. See `LICENSE` and `NOTICE.md`.
