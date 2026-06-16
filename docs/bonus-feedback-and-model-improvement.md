# Bonus — Feedback Storage and Model Improvement (Proposal)

**Scope:** This document describes how dashboard feedback is persisted in Moveo Crypto Advisor and outlines a **proposed** path for using that data to improve AI-generated content. Nothing below is implemented — no export jobs, training pipelines, or live personalization.

---

## Summary

Users vote **UP** or **DOWN** on four dashboard sections. Votes are stored in PostgreSQL with stable content identifiers. For AI insight and memes, each vote can be joined to a persisted daily row that includes a **`sourceDataSnapshot`** of the inputs used at generation time. That join is the foundation for offline evaluation and, eventually, model or prompt improvement — starting with analytics and prompt tuning, and progressing to preference-based fine-tuning for the OpenRouter insight model when sufficient labeled data exists.

---

## 1. How feedback is stored

### `feedback` table

| Column | Description |
|--------|-------------|
| `userId` | Authenticated user (FK → `users`, cascade delete) |
| `contentType` | `MARKET` \| `NEWS` \| `INSIGHT` \| `MEME` |
| `contentId` | Stable identifier for the voted item |
| `feedbackType` | `UP` \| `DOWN` |
| `createdAt`, `updatedAt` | First vote and last change |

**Unique constraint:** `(userId, contentType, contentId)` — at most one vote per user per item. UP ↔ DOWN updates the row in place.

**Intentionally excluded:** prompts, model IDs, raw provider payloads, JWTs, emails, free-text comments.

### Content identifiers

Dashboard items expose `feedbackContentId`, validated on `PUT /api/feedback`:

| Section | `contentType` | Example `contentId` | Training-relevant join |
|---------|---------------|---------------------|------------------------|
| Coin Prices | `MARKET` | `coin:1` | User's selected coin |
| Market News | `NEWS` | `article-abc123` | Article metadata from NewsData |
| AI Insight | `INSIGHT` | `daily-insight:42` | `daily_insights` row + snapshot |
| Crypto Meme | `MEME` | `daily-meme:7` | `daily_memes` row + snapshot |

For **`INSIGHT`** and **`MEME`**, `contentId` resolves to a daily persisted row containing:

- Generated output (`title`/`content` or caption text + image metadata)
- `sourceDataSnapshot` — investor profile, selected coins, market facts, news headlines, and (for memes) template/caption variation
- `contextHash`, `generatedForDate`

Additional context is available via `user_preferences` and `user_selected_coins`. A labeled dataset can therefore be assembled with SQL joins — **without replaying external API calls**.

### Runtime behavior (today)

1. `GET /api/dashboard` returns votable items with `feedbackContentId`.
2. `GET /api/feedback?contentIds=…` batch-loads existing votes.
3. `PUT /api/feedback` upserts a vote; the dashboard is not refetched and insight/meme content is not regenerated.

Feedback is a **durable signal only**. It does not alter ranking, prompts, or model selection at request time.

---

## 2. Proposed improvement pipeline

A practical sequence for this app, ordered by cost and risk:

```text
Collect votes + snapshots (PostgreSQL)
        ↓ periodic export (not implemented)
Analyze UP/DOWN by content type, profile, context
        ↓
Improve: prompt/rules first; model training when data allows
        ↓ offline eval + small A/B
Deploy candidate; monitor new feedback
        ↓ loop
```

### Phase A — Measurement (no model changes)

Export `feedback` joined to `daily_insights`, `daily_memes`, and `user_preferences`. Compute segment metrics (e.g. insight UP rate by `investorProfile`, meme UP rate by `templateId`, news DOWN rate when coin mention is title-only). Use DOWN votes on insights to catalog failure modes (generic tone, weak fact use, profile mismatch). Output: dashboards and a prioritized fix list — SQL/notebook only.

### Phase B — Prompt and rule optimization (primary near-term lever)

| Target | Use of feedback | Action |
|--------|-----------------|--------|
| **AI Insight** (OpenRouter) | `(sourceDataSnapshot, output, UP/DOWN)` | Revise system/user prompts; add profile-specific few-shot examples from high-UP rows; A/B prompt versions |
| **News** | Article text + UP/DOWN | Tune relevance filter/ranking — content is not LLM-generated |
| **Meme** | Template/caption metadata + UP/DOWN | Adjust deterministic template/caption weights — captions are rule-based, not LLM output |
| **Market** | Coin-level UP/DOWN | UX/product signals only — not model training |

Most quality gains are expected here before any fine-tuning investment.

### Phase C — Preference learning for AI Insight (when scale permits)

Once **INSIGHT** votes are sufficient in volume and diversity, construct preference pairs:

- **Preferred:** insight text from `UP` rows
- **Rejected:** insight text from `DOWN` rows  
- **Input:** `sourceDataSnapshot` (same structure already stored at generation time)

These pairs support **offline DPO/RLHF-style fine-tuning** or **best-of-N reranking** at inference. Training runs on anonymized exports; production retains existing safety rules (educational tone, no buy/sell advice, no price predictions).

### Phase D — Controlled rollout

Hold out a labeled validation set. Batch-generate with candidate prompt/model; validate schema, policy checks, and estimated UP rate. Ship via shadow mode or cohort A/B; compare DOWN rate before full rollout.

---

## 3. What is not in scope today

- Export APIs, ETL, or admin analytics
- Automatic prompt/model selection from votes
- Fine-tuning, RLHF, or embedding pipelines
- Real-time personalization on dashboard load
- Free-text or multi-dimensional ratings

Current implementation: **persist votes + expose UI** — the data layer required for the pipeline above.

---

## 4. Privacy and safety constraints

- Hash or omit `userId` in external training datasets; define retention for raw votes.
- Disclose that votes may improve the product; support opt-out where required.
- Never export secrets (API keys, JWTs, raw OpenRouter responses).
- Do not optimize toward speculative or advisory language based on negative engagement alone.

---

## Code references

| Topic | Path |
|-------|------|
| Feedback API & entity | `backend/src/feedback/` |
| Content ID format | `backend/src/feedback/utils/feedback-content-id.utils.ts` |
| Insight generation & snapshot | `backend/src/insights/` |
| Meme generation & snapshot | `backend/src/memes/` |
| Frontend voting UI | `frontend/src/dashboard/FeedbackControls.tsx` |
| API details | [backend/README.md](../backend/README.md#feedback-put--get-apifeedback) |
