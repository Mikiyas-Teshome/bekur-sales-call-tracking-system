# Architecture

## Layout

- `src/app`: App Router routes, layouts, route handlers, and route-level composition.
- `src/actions`: Thin Server Action adapters that validate input and delegate to services.
- `src/features`: Domain-specific UI and view-model code grouped by business capability.
- `src/components/ui`: shadcn/ui generated primitives.
- `src/components/shared`: Reusable application components with no domain ownership.
- `src/components/quick-log-call`, `src/components/leads-table`, `src/components/call-history`, `src/components/kpi-cards`: Cross-route product components named for their stable workflows.
- `src/entities`: TypeORM entity definitions only.
- `src/db`: DataSource setup, migrations, and SQL views.
- `src/services`: Transactional business rules and database queries.
- `src/lib`: Cross-cutting framework-neutral utilities and shared Zod validation schemas.
- `src/types`: Shared TypeScript types that are not owned by a single feature.
- `tests/unit`: Fast framework-independent tests.
- `tests/integration`: Database and service integration tests.

## Dependency Direction

Routes and components call actions. Actions validate and call services. Services own database access and coordinate entities. Features may use shared components and libraries, but must not import from route files. Entities do not import from actions, features, components, or services.

## Conventions

Keep route files focused on composition. Put business rules in services, one feature per directory, and use feature-local components until they are shared across domains. Use the `@/` alias for imports from `src`. Keep generated shadcn primitives isolated in `components/ui`.
