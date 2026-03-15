# ADR-0004: Static i18n with Type-Safe Keys

## Status: Accepted

## Context
Need bilingual (Russian primary, English secondary) support across 25,000+ strings.

## Decision
- Two static TypeScript files: `ru.ts` (always loaded) and `en.ts` (lazy-loaded)
- Nested objects matching module structure
- `t(key, params?)` function with compile-time key validation
- Russian is default and always bundled; English loaded dynamically

## Consequences
- Fast: no runtime parsing, tree-shakeable
- Type-safe: typos caught at compile time
- Large files (25k lines each) -- must stay structurally identical
- Adding keys requires editing both files simultaneously
