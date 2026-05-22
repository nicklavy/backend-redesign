# Dynamic Pricing — Mini User Guide

A quick walkthrough of the Dynamic Pricing screen for the staff who set up and manage pricing rules.

## Getting there

Open the direct link **backend-redesign.vercel.app/dynamicpricing**, or inside the app go to **Resources → Services → Dynamic Pricing**.

## 1. Turn it on for a category

Pick a **Service category** at the top, then flip **Enable dynamic pricing** on. Rules only run while this is on, and each category keeps its own separate set of rules. Nothing changes for guests until a rule is both enabled and its category is enabled.

## 2. Set guardrails (optional)

**Min price** and **Max price** clamp the final price *after* every rule has been applied. They are your safety net — no rule can ever push a price below the minimum or above the maximum you set here.

## 3. Read the demand heatmap

The heatmap shows demand as an hourly grid, Monday–Sunday. Each cell carries a **demand score from 0 to 100**, color-coded Low, Moderate, High, and Peak. Use the controls above it to choose a service, a **look-back window** (30, 60, or 90 days), and which metric to display.

To turn a busy window into a rule: **click and drag** across the cells you want, then click **Create pricing rule** — the rule builder opens with the time window and demand condition already filled in. Double-clicking a single cell does the same thing for that one hour.

## 4. Mock availability (demo only)

The **Mock availability** card holds three test values — Utilization %, Remaining slots, and Demand score. They let you preview how rules behave: enter different numbers and watch the **Condition check** column in the rules table update. This card is a demo aid only; in the live system these values come from real bookings.

## 5. Create a pricing rule

Click **Add rule** (or create one from the heatmap). The rule builder has these sections:

- **Rule name** — an internal label so you can recognize the rule later.
- **Days of week** / **Date range** — when the rule is eligible. Leave days blank for every day; leave the date range blank for any date.
- **Time window** — the daily start and end time the rule covers (required).
- **Priority** — when two rules overlap, the higher number wins.
- **Lead time** — choose *None*, or *Lead-time window* to gate the rule by how far ahead the booking is made (e.g. "less than 6 days 23 hours before the slot"). Use it for last-minute or early-bird pricing.
- **Trigger condition** — optional. Only apply the rule when a live signal meets a condition: **Utilization %**, **Remaining slots**, or **Demand score**, compared against a threshold (less than, at most, greater than, at least).
- **Price adjustment** — choose Percent or Dollar amount. A positive value raises the price; a negative value discounts it.
- **Adjacent time slots** — optionally pass a smaller adjustment to nearby slots so spillover demand is captured.
- **Service scope** — the rule applies to all services in the category by default; you can exclude specific services here.

Click **Save rule** when done.

## 6. The rules table

Every rule appears in the table at the bottom:

- **Enabled** — toggle the rule on or off without deleting it.
- **Rule** — the name plus a plain-English summary of its schedule, condition, and lead time.
- **Adjustment** — the price change it applies.
- **Condition check** — given the current Mock availability values, whether the rule's trigger condition would pass (**Applies**) or not (**Blocked**).
- **Priority** — the tie-breaker for overlapping rules.
- **Actions** — Edit or Delete.

## How a price is decided

For any slot, the system works in this order: start from the base price → apply any day or date override → apply the highest-priority matching rule (including its trigger condition and lead-time gate) → clamp the result to the Min/Max guardrails.
