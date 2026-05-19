# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
pnpm dev        # Dev server at localhost:3000 (Turbopack)
pnpm build      # Production build
pnpm start      # Run production server
```

No test runner or linter is configured.

## What This App Does

A Next.js intelligence dashboard for identifying and tracking enterprise certification candidates in Wuhan's Dongxi Lake District. It serves three user roles — ops managers (desktop dashboard), field agents (mobile), and enterprises (self-assessment) — across four government qualification types:

- **高企认定** (High-Tech Enterprise)
- **创新型中小企业** (Innovative SME)
- **专精特新中小企业** (Specialized & Sophisticated SME)
- **专精特新"小巨人"** (Little Giant)

## Architecture

### Routing

Uses Next.js App Router. Two layout trees:
- `app/(main)/` — Desktop routes (dashboard, targets, tasks, renewal, agent). Wrapped by `AppShell` which handles auth, sidebar, and agent panel overlay.
- `app/mobile/` — Mobile routes for field agents.
- `app/assessment/[token]/` — Public token-based self-assessment form.

### Data Layer

All data is in-memory mock functions — no database, no external API:
- `lib/mock-data.ts` — Candidate pool, KPIs, tasks
- `lib/renewal-data.ts` — Certified companies with 3-year metrics
- `lib/mobile-mock.ts` — Field visit records
- `lib/ops-mock.ts` — Ops stats and auth
- `lib/account-mock.ts` — User roles (`admin`, `ops_manager`, `field_agent`)

### State Management

Three Zustand stores (all `"use client"`, localStorage-persisted where noted):
- `lib/agent/store.ts` (`useAgentStore`) — Conversation messages and history
- `lib/qual-store.ts` (`useQualStore`) — Active qualification module (`activeQual`, `enabledModules`)
- `lib/layout-store.ts` (`useLayoutStore`) — Sidebar collapse, agent panel toggle

No Context API. No server-side state.

### Type System

`lib/types.ts` is the canonical source for all domain types: `Company`, `CertifiedCompany`, `VisitRecord`, `AssessmentRecord`, qualification types, tech field categories (8), and administrative streets (10). Always extend types here, not in components.

`lib/cn.ts` maps enums to Chinese display labels.

### AI Agent Module

`app/(main)/agent/` + `lib/agent/` — The agent is **not LLM-backed**. It uses deterministic intent detection (`lib/agent/intents.ts`) and hardcoded report templates (`lib/agent/report-templates.ts`). `askAgent()` in `lib/agent-mock.ts` simulates RAG by pattern-matching questions.

### Assessment Scoring

`lib/assessment.ts` scores companies across 5 dimensions (rd_expense 30pt, rd_staff 20pt, ip 30pt, hi_tech_revenue 10pt, management 10pt) and outputs a grade ("优秀" / "符合" / "待培育").

### Qualification-Aware Rendering

Components that vary by qualification type should read `useQualStore().activeQual` and use `QUAL_TYPE_META` from `lib/types.ts` for consistent labels and colors.
