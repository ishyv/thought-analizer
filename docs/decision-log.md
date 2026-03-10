# Decision Log

## 2026-03-10 - Iteration 1: centralize thought-analysis core and break the store cycle

Change:
- Added `src/lib/core/thought-analysis` for the domain model, selection model, and pure active-set derivation.
- Converted `$lib/types` and `$lib/active-set` into compatibility wrappers.
- Updated UI stores and routes to reuse shared empty-state constants instead of redefining them locally.

Motivo:
- `stores.ts` and `active-set.ts` formed a false boundary and a real import cycle.
- The domain contract and selection types were spread across UI-oriented modules.
- This was the smallest cut that improved structure without changing runtime behavior.

Alternativas:
- Move every pure helper into the new core namespace in one pass.
- Remove legacy wrappers immediately and update all imports at once.

Riesgos:
- Import churn while old and new paths coexist.
- Hidden callers might rely on wrapper side effects, though these modules were type/helper-only.

Como verificar:
- Run `npm run check`.
- Run `npm run lint` and confirm no new lint classes were introduced beyond the existing baseline.
- Run `npm run test` once the new core tests are in place.
