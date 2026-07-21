# Notable stat tooltips

Show what each Large Cluster Jewel notable does: hovering any notable name in
the plugin shows its in-game stat lines in a tooltip.

## Data source

RePoE-fork (repoe-fork.github.io), the maintained RePoE successor, updated per
league:

- `https://repoe-fork.github.io/stat_translations.json` (~12 MB)
- `https://repoe-fork.github.io/stat_translations/passive_skill.json` (~330 KB)

These map internal stat ids + values to in-game text. `data-full.json` already
carries each notable's stat ids and values (`PassiveSkill.Stats`), so the join
needs no new game data. Feasibility was verified: all 253 stat lines across the
107 Large notables translate cleanly with these two files plus a
`locations_to_metres` handler.

The full translation files are NOT committed. A vendor-time script fetches
them, resolves the per-notable lines, and commits only the ~15 KB result —
same pattern as `fetch-icons.mjs`.

## Vendor pipeline

1. **New `scripts/fetch-notable-stats.mjs`** (run manually at data-refresh
   time, like fetch-icons):
   - Downloads the two translation files.
   - For each Large notable in `scripts/vendor/data-full.json`, translates its
     stats to in-game lines.
   - Writes `scripts/vendor/notable-stats.json`:
     `{ "<notable name>": ["<line>", ...] }`, keys name-sorted. Committed.
2. **`scripts/trim-data.mjs`** reads `notable-stats.json` and adds
   `stats: string[]` to each notable record in `src/data/cluster-data.json`.
   Fails if any notable is missing from the mapping or has zero lines.
   The existing `--check` mode now also catches stat drift.

## Translation algorithm (in fetch-notable-stats.mjs)

- Index translation entries by stat id. Entries from `passive_skill.json`
  override the main file (attribute stats like `base_strength` only exist
  there).
- Per notable, loop until all stat ids are consumed: pick the candidate entry
  covering the most remaining ids (multi-stat lines), select the `English`
  branch whose conditions match the values, apply `index_handlers`, substitute
  `{i}` placeholders per the `format` specifier (`#`, `+#`, `ignore`). Ids in
  a multi-id entry that the notable lacks contribute value 0.
- Implement only the handlers the current data needs (`negate`,
  `locations_to_metres` = value/10, and whatever else fires). Unknown handler,
  unknown format specifier, missing translation, or unmatched condition branch
  → hard `fail()` (exit 1), matching fetch-icons conventions. A future data
  refresh that introduces an untranslatable stat fails loudly instead of
  shipping a broken line.

## Runtime

- **`src/data.ts`**: `NotableInfo` gains `stats: string[]`. No new API; it
  rides along on `getNotable` / `allNotables`.
- **`src/NotableLabel.tsx`**: hover shows a custom tooltip (the SDK has no
  Tooltip component):
  - `position: fixed` div anchored to the label's bounding rect, clamped to
    the viewport, so `overflowY: auto` option lists cannot clip it. No portal.
  - Dark panel styling consistent with `PANEL_BOX` in `ui.ts`; one line per
    stat in mod-blue (`#8888ff`-family, matching the game's magic-mod color).
  - Instant show on mouse enter, hidden on leave. ~40 lines, no dependencies.
  - No tooltip when the name has no stats (unknown notable).
- Every notable name already renders through `NotableLabel` (select boxes,
  chips, results list, copied-jewel strip), so all surfaces get the tooltip
  from this one change.

## Testing

- `src/data.test.ts`: every notable exposes non-empty `stats`.
- `src/NotableLabel.test.tsx`: tooltip appears on hover with the notable's
  stat lines; no tooltip for a name with no data.
- `npm run trim-data -- --check` (existing CI step) guards the generated data.

## Out of scope

- Medium/Small cluster notables (the plugin only handles Large jewels).
- Tooltips on the base dropdown (already has native `title`).
- Any runtime fetching; the plugin stays fully offline.

## README

Add one dev-section line documenting `node scripts/fetch-notable-stats.mjs`.
