# Cluster Back

A [Scalpel](https://github.com/scalpelpoe/scalpel) plugin for Path of Exile 1
Large Cluster Jewels: pick two desired notables and see every notable that can
roll in the skippable middle position (position 2), with trade searches that
only return jewels where your pair lands in the pathable spots. Copy a Large
Cluster Jewel in game and the tab shows its notable layout and which one you
can skip.

Ported, with permission, from Theodore J Bieber's
[PoE Cluster Jewel Calculator](https://theodorejbieber.github.io/PoEClusterJewelCalculator/)
([source](https://github.com/TheodoreJBieber/PoEClusterJewelCalculator) - "Feel
free to take any code you want").

## How it works

Notable positions on a Large Cluster Jewel are ordered by the internal stat row
id of each notable. Given two desired notables, any compatible notable whose id
sits between theirs can roll into the middle socket you never path through.
Compatibility means: a shared jewel base, different mod groups, and at most two
prefixes across the trio. See the upstream README for the full mechanic
explanation.

## Development

- `npm install`
- `npm test` - vitest suite
- `npm run typecheck`
- `npm run build` - emits `dist/plugin.js` + `dist/manifest.json`
- `npm run trim-data` - regenerate `src/data/cluster-data.json` from
  `scripts/vendor/data-full.json` (upstream dataset copy)
- `node scripts/verify-parity.mjs` - manual parity probe against the live site
