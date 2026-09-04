# ASG Docs — Triage screen (post-scan)

Build the screen an operator lands on when a scan completes. It sits between the document list and the Editor: the scan has produced findings, and this screen is where a human decides what each finding actually is before any remediation runs.

Reuse the established shell and design system — sidebar, top bar, tokens, type, badges, button states. Nothing new visually.

## Why this screen exists

A scanner reports what it detects, not what is true. The clearest case is in the demo document below: it flags five images with no alt text, but three of them are a departmental seal (twice) and a decorative divider rule. Under WCAG those take an **empty** alt attribute and should be tagged as artifacts. If AI writes "a thin grey horizontal line" for a divider, the score improves and the document gets worse — a screen reader user now has to listen to it.

Triage is where a human separates the two. It runs **before** `Fix with AI`, and its output is what makes the auto pass safe.

## Demo assets

Attached, all real and consistent with each other:

- `Benefits-Overview.pdf` — 2 pages, genuinely untagged, with deliberate failures
- `page-1.png`, `page-2.png` — page renders at 110dpi for the preview
- `findings.json` — the complete scan result: 80 findings, grouped, each with WCAG reference, page, locator, remediation class and severity

Use `findings.json` as the data source. Do not invent findings.

**Scan summary:** 80 findings · 77 blocking · 3 advisory · 66 auto · 9 assisted · 5 manual · 0 decided

## Layout

Two columns beneath the standard shell.

Breadcrumb: `Documents › All Documents › Benefits-Overview.pdf`

### Readiness banner — full width, above both columns

The result of the pre-flight check, because a document that can't be remediated shouldn't reach the Editor at all.

Checks: text layer present · tag tree present · fonts embedded · encryption · page count. One of three outcomes:

- **Ready to remediate** — proceed
- **Needs pre-processing** — OCR required before tagging is possible
- **Needs re-authoring** — structure unrecoverable, this is a client conversation not a remediation task

The demo document is **ready**: text layer present, no tag tree, fonts embedded, not encrypted.

### Left column — finding queue

Grouped by type, ordered blocking first then by count. Each group row shows type, count, severity badge, remediation class label, WCAG reference, and a decision progress indicator (`0 of 5 decided`).

Expanding a group lists its individual findings with page number and locator. Selecting one highlights it in the preview.

### Right column — page preview

The page render with the selected finding highlighted in place. Read-only — no editing tools, since nothing is being fixed here. Page navigation (`1 of 2`), and selecting a finding on another page switches the preview to it.

## Decisions

Four, available per finding and per group:

| Decision | Meaning |
|---|---|
| **Confirm** | Real issue, remediate it |
| **Mark decorative** | Correctly takes empty alt — route to artifact tagging, not description generation |
| **Dismiss as false positive** | Not a real issue. **Reason required.** |
| **Defer** | Out of scope for this engagement. **Reason required.** |

`Mark decorative` applies only to images and graphical elements. Do not offer it on text findings.

Reasons are required on dismiss and defer because both remove a finding from the count, and a document that reaches 100% needs to be able to account for how. Reasons write to the audit trail.

### Scope decisions

- Exclude specific pages — covers, blanks, legal boilerplate the client has excluded
- Confirm the applicable standard — the client may have asked for 2.2 while the scan ran 2.1

### Class overrides

The `auto` / `assisted` / `manual` classification is a system guess. Allow an operator to override it per group. A table the scanner read as simple may be genuinely complex, and forcing it to `assisted` prevents a bad auto-fix.

### Bulk decisions

Apply one decision to every finding in a group. Essential — 63 untagged-content findings cannot be triaged individually. Bulk actions state how many findings they affect and require confirmation.

## Exit gate

Triage is complete when **every finding has a decision**. Nothing may remain undecided.

Show progress persistently (`0 of 80 decided`). The primary action — `Begin remediation` — stays disabled until the count is complete, with the number outstanding stated in text rather than only greyed out. It routes to the Editor.

## Audit trail

Every triage decision is a logged Human action: what was decided, on which findings, by whom, with the reason where one was required. Bulk decisions log as one entry naming the count.

## Requirements

- WCAG 2.1 AA throughout, checked against both beige surfaces
- Severity, remediation class, and decision state each carry a non-colour signal
- Full keyboard operation: move through findings, decide, and move on without a mouse
- The preview highlight is announced, not purely visual
- Decision state visible on a group row without expanding it
- Minimum 44×44px targets
