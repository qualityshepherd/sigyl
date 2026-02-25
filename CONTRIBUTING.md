# contributing to sigyl

Sigyl is intentionally minimal. Before contributing, understand what it is and what it isn't.

## what sigyl is

A lightweight web of trust protocol. Domain as stake. Humans required. The crawler, the trust graph, the admin interface, the HTML generator. That's it.

## what sigyl is not

A platform. A social network. A startup. A TypeScript project.

## rules

**No TypeScript.** Plain JavaScript ESM. The runtime understands it. You should too.

**No frameworks.** No Express, no Hono, no React. Workers stdlib is enough.

**No production dependencies.** Dev dependencies for testing are fine. Nothing in `dependencies`.

**Tests required.** Every feature needs a test. Tests are the spec. Read `tests/worker.test.js` before writing anything.

**Tests as documentation.** Test names are requirement statements. Write them so a non-developer understands what the system does.

## getting started

```bash
npm install
npm test        # run tests
npm run dev     # local dev with scheduled trigger
```

## submitting changes

Open an issue first. Describe the problem you're solving. Wait for a response before writing code.

PRs without tests will not be merged. PRs that add dependencies will not be merged. PRs that add TypeScript will be closed with a sad face.

## the vibe

Small. Honest. Permanent. If it makes the codebase bigger without making it meaningfully better, it doesn't belong here.
