# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.

## Tests and scripts

Temporary and integration test scripts are available under `scripts/tests/`.

- Run the full integration test (requires backend running on http://localhost:3001):

```bash
node scripts/full_integration_test.js
```

- Quick targeted checks (products/purchases/sales etc):

```bash
node scripts/tests/targeted_checks_http.js
```

Advanced and concurrency tests used during refactor are stored in `scripts/tests/`.
