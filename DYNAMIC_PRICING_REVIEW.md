# Dynamic Pricing — Functionality & UX Review

**File reviewed:** `src/SpaServicesPage.tsx` (the `DynamicPricingPage` component, the `HistoricalDemandPanel` heatmap, the rule builder modal, and the rules table)
**Date:** May 21, 2026
**Reviewed against:** the Dynamic Pricing UI overview drafted in ChatGPT

---

## Overall verdict

The dynamic pricing screen is in good shape as a working prototype. The core model is sound — rules carry a schedule, an optional inventory condition, a price adjustment, optional adjacent-slot pricing, and a priority — and that maps cleanly onto the concept in the overview. The heatmap-to-rule flow is a genuinely nice idea and mostly works.

What's holding it back from "this makes sense" is trust and clarity, not architecture. An admin setting a rule today never sees the actual dollar result of that rule, a couple of controls look broken or do nothing, and a few labels use words that mean different things in different places. None of these are hard to fix, and several are now fixed in the file directly.

This document is split into four parts: what was fixed in the code, functional issues still open, user-experience issues, and gaps versus the overview — followed by a recommended order of work.

---

## Part 1 — Fixed directly in `SpaServicesPage.tsx`

These were clear-cut and have been corrected. The file still compiles cleanly (verified with a TypeScript check).

### Discount amounts lost their minus sign

In the rules table, the Adjustment column ran a dollar discount through an absolute-value function, so a **−$10 discount displayed as "$10"** — visually identical to a $10 surcharge. It now renders consistently as `+$10`, `−$10`, `+10%`, `−10%`.

### The heatmap "Metric" dropdown did nothing

The heatmap lets you pick a metric — Bookings, Utilization, or Revenue index — but every cell always printed the demand score regardless of the selection. The dropdown looked broken. Cells now show the value for the metric you picked; the color still reflects the underlying demand score (that is the heatmap's job).

### The "Evaluation window" appeared when it had no effect

The days/hours "Evaluation window" was shown even when the inventory condition was switched off, where it does nothing. It has been moved inside the inventory-condition section and is hidden for the Lead time metric, where a look-ahead window is meaningless.

### The rule modal was too narrow

The rule builder used the default modal width (520px), which squeezed the two-column rows and the time-range picker. Widened to 640px so the form breathes.

### The "Op" field was cryptic

The comparison field was labeled just "Op" with options `<`, `≤`, `>`, `≥`. For a non-technical admin that is opaque. Renamed to "Comparison" with plain-English options: "is greater than (>)", "is at least (≥)", and so on.

### Minor cleanup

Removed a stray dependency on the heatmap's data calculation that caused it to recompute when only the display metric changed.

---

## Part 2 — Functional issues still open (decisions needed)

### The Preview column — works as designed; the label could be clearer — LOW

Confirmed with Nick: this column is an intentional inventory-condition tester. The "Mock availability" card above the table is the control — enter remaining slots, utilization, lead time, and adjacent demand, and the column reports, per rule, whether that rule's inventory condition would pass ("Applies", green) or fail ("Blocked", red). Rules with no inventory condition always show "Applies". This is working correctly.

The only refinement worth considering is naming. The header "Preview" plus the "Applies / Blocked" tag reads like a verdict on the whole rule, and by design it does not account for the rule's schedule (day-of-week, time, date range) — nor should it, since availability and schedule are separate axes. To prevent that misread, consider renaming the column header to something like "Condition check" and adding a short caption that ties it to the Mock availability card. Note also that "Preview" collides with the overview's Section 7, which uses "Preview" for the richer original-price/adjusted-price panel described in the next item.

### There is no real price preview anywhere — HIGH

This is the single biggest gap. You can set a rule to "+20%" and never see that $235 becomes $282. The overview's Section 7 calls for a table of Original price → Adjusted price per time slot, and it specifically says the preview matters "so admins trust the pricing logic." Right now there is nothing to build that trust.

There is a dependency to settle first: a preview needs a base price to work from, and base prices currently live on individual service durations, not at the category level where dynamic pricing rules are defined. So before this can be built, decide what price the preview runs against — a representative service, the selected service from a picker, or a typed-in sample price.

### "Demand score" is missing as a condition — HIGH

The heatmap is built entirely around a 0–100 demand score, and the overview explicitly lists "Demand score > 80" as a condition type. But the rule builder's metric list has no plain "Demand score" — only "Adjacent demand." When you highlight a hot window on the heatmap and click "Create pricing rule," it builds an *Adjacent demand ≥ X* condition. That is a conceptual mismatch: the admin highlighted a high-demand window expecting a "demand is high" rule and got something else. Add a "Demand score" metric and have the heatmap map to it.

### Two different things are both called "adjacent" — MEDIUM

"Adjacent demand" is a *condition* (it decides when a rule fires). "Adjacent time slots" pricing is an *effect* (it spreads a smaller adjustment to nearby slots). Same word, two meanings, in the same modal. This will confuse admins. Renaming the condition metric to "Demand score" (above) largely resolves it; if a nearby-pressure metric is still wanted, call it something distinct like "Nearby demand pressure."

### The evaluation window is not actually used by the logic — MEDIUM

The code comment says it plainly: "Lookahead is not simulated yet; it's only displayed in the rule summary." The condition check reads the global mock numbers directly and ignores the window. Fine for a prototype, but it needs to be called out clearly in the handoff to the dev team so the real backend wires it up rather than assuming it already works.

### Priority ties have no defined behavior — MEDIUM

Every new rule defaults to priority 100. Create three rules and they are all 100, so "higher priority wins" has no actual winner — it silently falls back to the order rules were created in, which the admin cannot see or predict. The overview stresses that priority must be visible "because overlapping rules will happen." Recommend auto-setting each new rule's priority to the current highest + 10, and warning when two rules share a priority.

### Times carry today's date — LOW (handoff note)

Rule start/end times are stored as full date-and-time objects with today's date baked in, even though the type comment says "time-of-day only." Harmless in the prototype, but the dev team should persist these as time-only values so a rule saved today still means "10:00 AM" next week.

### Rules reset when you leave the tab — LOW (expected for a mock)

Switching away from the Dynamic Pricing tab and back discards all rules and guardrails, because the component is rebuilt from scratch. This is expected for a front-end-only prototype, but flag it so it is not mistaken for a bug during a demo — and so it is clearly understood to be backend work.

### The category selector does not really drive the services list — LOW (known mock limit)

The "exclude specific services" dropdown is hardcoded to three massage services no matter which category is selected, so it will be wrong for "Personalized Facials." The code already acknowledges this. It means that, today, choosing a category only changes which bucket rules are stored in — nothing else on screen reacts to it.

---

## Part 3 — User-experience issues

### No plain-English summary inside the rule builder — HIGH

The overview repeatedly insists on showing the "human-readable version of every rule before saving." The table row builds a decent summary after the fact, but inside the modal — where the admin is actually making the decision — there is nothing. Add a live sentence at the bottom of the modal that updates as fields change, for example: *"When massage demand is above 80 on weekdays between 10am and 4pm, increase price by 20%. Nearby slots increase by 12%."*

### Discounts require typing a negative number — MEDIUM

Adjustment is a "Percent / Dollar" type plus a value, and the helper text says "use negative values for discounts." A non-technical admin will not think to type −10. The overview wanted explicit "Increase by / Decrease by" choices. Add a direction control (Increase / Decrease) so the value is always a positive number and the intent is unambiguous.

### Day-of-week uses a dropdown, but the rest of the page uses a grid — LOW

Day-of-week selection in the rule builder is a multi-select dropdown, while the duration pricing section uses a clean seven-box grid for the same Mon–Sun concept. A row of toggle buttons would read faster and match the rest of the UI.

### The heatmap is buried — LOW

The "Mock availability (demo)" card sits above the heatmap, pushing the most useful planning tool down the page. The mock card disappears in production, but consider ordering the heatmap higher regardless.

### Heatmap interaction is mixed and under-explained — LOW

The heatmap supports click-drag to select a range *and* double-click a single cell to instantly create a rule — two gestures for related actions, and the drag hint only appears after a selection already exists. Pick one primary gesture, or surface both hints up front.

### The heatmap legend colors do not match the cells — LOW

The legend uses standard tag colors (cyan, orange, red) while the cells use custom pale background colors. "Moderate" in the legend should look like a Moderate cell. Use the same swatches in both.

### Heatmap cells are not keyboard-accessible — LOW

The cells are plain elements with mouse-only handlers — no keyboard focus, no screen-reader labels. Likely acceptable for an internal admin tool's first version, but worth a deliberate decision rather than an accident.

---

## Part 4 — Gaps versus the ChatGPT overview

These are features described in the overview that are not built yet. Most are reasonable things to defer, but each should be a conscious decision rather than an oversight:

- **No "Set fixed price" adjustment type** — only percentage and dollar *changes* exist.
- **No rounding rule** — the overview's Section 5 wants "rounded to nearest $5."
- **Caps are per-category, not per-rule** — the overview put min/max on each rule. Per-category guardrails are arguably cleaner, so this may be a *better* choice — just confirm it intentionally.
- **No "Duplicate" rule action** — the overview wanted Edit / Duplicate / Disable / Delete; the table has Edit / Delete plus an enable toggle.
- **No description / internal notes field** on a rule.
- **"Applies To" is category-wide minus exclusions only** — there is no "specific services only" inclusion and no resource/room targeting.
- **No blackout dates and no seasonal presets.**
- **Adjacent pricing uses one slot count for both sides** — the overview wanted separate "before" and "after" controls.

---

## Build note (not dynamic pricing)

While verifying the changes, a TypeScript check surfaced **pre-existing errors in unrelated files** — `ClientDirectoryPage.tsx`, `ClientProfilePage.tsx`, and `ReportTablePage.tsx` (invalid size values, a missing `orderNo` field, an `address` field not in the `Client` type). These are not caused by the dynamic pricing work and do not block the Vite dev server, but they will fail a strict build or CI typecheck. Worth passing to the dev team so a clean production build is possible.

---

## Recommended order of work

1. **Build the real price preview.** Highest impact on admin trust. Settle the base-price question first.
2. **Add a "Demand score" condition and point the heatmap at it.** Fixes the most visible conceptual mismatch.
3. **Optionally rename the Preview column** (e.g. "Condition check") so it reads clearly as an inventory-condition tester rather than a full-rule verdict — a small clarity fix, not a bug.
4. **Add the live plain-English rule summary** inside the builder, and **explicit Increase/Decrease** direction.
5. **Handle priority defaults and ties** so overlapping rules are predictable.
6. **Make a conscious call on each Part 4 gap** — set-fixed-price, rounding, per-rule vs. per-category caps, duplicate action — and write the decisions down so the dev team builds the intended thing.
