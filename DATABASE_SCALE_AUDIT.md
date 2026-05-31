# OptiFit Database Scale Audit

This audit checks OptiFit against five production database risks that often feel fine in development and fail under real traffic: N+1 queries, unbounded pagination, missing indexes, unsafe connection lifecycle, and over-fetching.

Current database path:

- Runtime: SQLAlchemy.
- Current Render config: SQLite on a persistent disk at `/opt/render/project/data/optifit.db`.
- Long-term recommendation: Postgres when traffic or write concurrency grows.

## Summary

| Risk area | Findings | Severity | Fix applied | Remaining work |
| --- | --- | --- | --- | --- |
| N+1 queries | Workout detail and exercise serialization can lazy-load exercise equipment. Saving generated workouts queried exercises per row. | High | Added relationship preloading on workout/exercise hot paths and batched exercise lookup when saving generated workouts. | Batch exercise matching in workout generation if generated exercise counts grow beyond template-sized plans. |
| No pagination | Saved workouts had `skip` and `limit` but no validation cap. Progress history and exercise progress loaded all matching rows in the time window. Exercise alternatives loaded all exercises before slicing. | High | Added bounded `Query` limits for saved workouts, community templates, exercise lists/search, alternatives, progress history, and exercise progress. | Add frontend pagination controls for very large histories and saved workout lists. |
| Missing indexes | Existing schema had single-column indexes but missed scoped `(owner, created_at)` and `(owner, exercise_id, created_at)` patterns. | High | Added composite SQLAlchemy indexes and SQL schema indexes for workouts, progress entries, association tables, and equipment scans. Runtime schema reconciliation now creates declared indexes on existing DBs. | Add Alembic or another migration tool before moving to managed Postgres. |
| Connection pool / lifecycle | SQLAlchemy sessions are closed per request, but engine settings did not expose production pool controls. SQLite lacked busy timeout/WAL pragmas. | Medium | Added SQLite timeout and pragmas, plus configurable Postgres pool settings for `DB_POOL_SIZE`, `DB_MAX_OVERFLOW`, and `DB_POOL_RECYCLE_SECONDS`. | Tune pool values against the actual Render/Postgres plan. Keep SQLite to one web instance plus careful worker usage. |
| Over-fetching / `SELECT *` | ORM list endpoints returned full workout entities and could include relationship-heavy detail fields. | Medium | Saved workout and community template list endpoints now return explicit summary dictionaries; detail endpoints remain explicit full-detail routes. | Continue replacing raw ORM returns in new list endpoints with response DTOs. |

## Hot Paths Reviewed

- `GET /api/workouts/`
- `POST /api/workouts/save-generated`
- `GET /api/workouts/{workout_id}`
- `GET /api/workouts/templates/community`
- `GET /api/workouts/exercises/search`
- `GET /api/exercises/`
- `GET /api/exercises/{exercise_slug}/alternatives`
- `GET /api/progress/history`
- `GET /api/progress/exercise/{exercise_id}/progress`
- `GET /api/dashboard/summary`
- auth user lookup and profile equipment access
- SQLAlchemy engine/session setup
- Render SQLite persistent disk config

## Fixes Applied

Connection and pool settings:

- SQLite receives `timeout`, `busy_timeout`, WAL journal mode, foreign keys, and normal sync mode.
- Non-SQLite engines use `pool_pre_ping=True`.
- Non-SQLite pool sizing is configurable through:
  - `DB_POOL_SIZE`
  - `DB_MAX_OVERFLOW`
  - `DB_POOL_RECYCLE_SECONDS`

Composite indexes:

- `idx_workout_exercises_workout_order`
- `idx_workout_exercises_exercise`
- `idx_user_equipment_equipment`
- `idx_exercise_equipment_equipment`
- `idx_workouts_user_created`
- `idx_workouts_guest_created`
- `idx_workouts_template_goal_created`
- `idx_progress_user_created`
- `idx_progress_guest_created`
- `idx_progress_user_exercise_created`
- `idx_progress_guest_exercise_created`
- `idx_equipment_scans_user_created`

Pagination and bounded result fixes:

- Saved workout list caps `limit` at 100.
- Community templates cap `limit` at 50.
- Exercise library caps `limit` at 100.
- Exercise alternatives scan at most 250 candidates and return at most 25.
- Workout exercise search caps `limit` at 50.
- Progress history caps `limit` at 500 and `days` at 366.
- Exercise progress caps `limit` at 1000 and `days` at 3660.

N+1 and over-fetch fixes:

- Saved workout detail preloads workout exercises and exercise equipment.
- Exercise library and search paths preload equipment.
- Saving generated workouts batches exercise lookups by IDs and slugs.
- Saved workout list and template list return explicit summaries instead of full ORM entities.

## Intentional Exceptions

Workout generation still performs exercise matching per generated exercise. Current template-sized plans are small, and this path also may create missing canonical exercises. If generation grows into dozens or hundreds of exercise candidates per request, batch candidate slug/name matching before the loop.

Dashboard summary computes active training days from recent scoped progress rows. The route is bounded by a 30-day window and counts only the current user or guest scope. If users can log very high-volume telemetry, replace this with a date aggregation query.

## Production Recommendations

- Keep SQLite on Render persistent disk only for pilot usage.
- Avoid multiple API instances writing to the same SQLite file.
- Move to Postgres before high write concurrency, dedicated worker scaling, or team-heavy usage.
- Add Alembic migrations before Postgres.
- Tune Postgres pool size to the hosting plan connection limit.
- Keep saved workout and progress list defaults small.
- Add frontend pagination controls before large-user launch.
- Load-test saved workouts, progress history, dashboard summary, workout save, and exercise search.
- Track slow queries in Render logs or a database monitoring service.

## Verification

Tests added:

- Saved workout list pagination returns bounded summaries.
- Progress history pagination returns bounded entries and metadata.
- Hot-path scale indexes are declared in SQLAlchemy metadata.

Run:

```bash
cd backend
pytest
```

