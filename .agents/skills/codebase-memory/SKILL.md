---
name: codebase-memory
description: Persist and reload codebase investigation results across grilling sessions. Use whenever a /grilling session starts or ends, or when the user mentions "memory", "前回の調査", or asks why the agent is re-investigating something it already explored. Prevents redundant codebase exploration and keeps memory small via an index, path/tag matching, and commit-hash staleness checks.
---

# Codebase Memory

Cache layer for grilling sessions. Decisions live in ADRs and terminology
lives in CONTEXT.md (managed by `/domain-modeling`). This skill manages the
third kind of memory: **facts discovered by exploring the codebase**, which
are expensive to rediscover but cheap to verify.

Memory lives in `.grill-memory/` at the repo root:

```
.grill-memory/
├── INDEX.md      # the ONLY file loaded unconditionally. Keep it small.
├── facts/        # one file per topic. Overwritten, never appended.
└── archive/      # raw Q&A logs. NEVER load these during a session.
```

If `.grill-memory/` does not exist, create it silently with an empty INDEX.md.

## INDEX.md format

A single markdown table. One row per memory entry, one line each:

```markdown
| tags | paths | summary | file |
|---|---|---|---|
| auth, session | src/auth/** | Auth middleware lives in src/auth; session tokens, no JWT | facts/auth.md |
| notifications | src/notifications/**, src/queue/** | Uses BullMQ; worker in src/queue/worker.ts | facts/notifications.md |
```

Hard limit: 100 rows. If adding a row would exceed it, ask the user which
stale entries to prune before proceeding.

## facts/ file format

```markdown
---
verified_at_commit: <full git commit hash>
paths:
  - src/auth/**
tags: [auth, session]
---

- Auth middleware: `src/auth/middleware.ts`, applied globally in `src/app.ts`
- Sessions stored in Redis, 24h TTL (`src/auth/session-store.ts`)
- No JWT anywhere in the codebase
```

Facts are bullet points of verifiable statements about the code, each with a
file path where possible. No prose, no reasoning, no decisions (those go to
ADRs via `/domain-modeling`).

## LOAD procedure (run before the first grilling question)

1. Read the user's plan. Infer (a) likely touched paths, (b) 2-5 domain tags.
2. Read `.grill-memory/INDEX.md`. Select rows where any inferred path
   glob-overlaps the row's paths, OR any inferred tag matches.
3. For each selected row, read its facts file, then verify freshness:
   ```
   git diff --stat <verified_at_commit>..HEAD -- <each path in frontmatter>
   ```
   - Empty diff → trust the facts as-is. Do not re-explore these areas.
   - Non-empty diff → treat the facts as HYPOTHESES. Re-explore only the
     changed files, correct the facts file, update `verified_at_commit`.
4. Also load `CONTEXT.md` and any ADRs whose filenames match the inferred
   tags (do NOT load all ADRs).
5. Open the session by telling the user, in one short block, what memory was
   loaded and what was found stale. Example:
   > 記憶をロード: auth (最新), notifications (2コミット分の差分あり→再検証済み)。
   > 関連ADR: 0007-auth-session-token。
6. During grilling: never re-ask a question whose answer is in a loaded ADR
   or facts file. Instead confirm briefly: "前回の決定ではX。維持でいい?"

## COMPACT procedure (run when the grilling session concludes)

1. Decisions and terminology: hand off to `/domain-modeling` as usual
   (ADRs + CONTEXT.md).
2. New codebase facts discovered this session: write or overwrite the
   relevant `facts/<topic>.md`. Set `verified_at_commit` to current HEAD.
   Overwrite stale bullets — facts files must not grow monotonically.
3. Update INDEX.md: add or amend the affected rows. One line per row.
4. Write the raw Q&A log to `archive/YYYY-MM-DD-<slug>.md`. Do not summarize
   it; do not reference it from INDEX.md.
5. Report to the user in 3 lines or fewer what was persisted.

## Rules

- INDEX.md is the only unconditional read. Everything else is loaded by
  match, verified by commit hash, or not loaded at all.
- A fact you cannot point to a file path for is not a fact — it is a guess.
  Do not persist guesses.
- When facts and code disagree, code wins. Fix the facts file immediately.
- Never load `archive/` into context. It exists only for the human.
