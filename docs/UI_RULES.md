# UI Rules

Binding rules for every screen, component, and state built in this repository. They describe the visual system that exists in the code today; new UI must match it exactly. When this document and a personal preference disagree, this document wins. When this document and the code disagree, fix the code or update this document in the same change — never leave them drifting.

The dashboard at `/` (`src/features/dashboard/today-dashboard.tsx`) is the real Phase 2 Today dashboard, not a mock — its layout and cards are the intended product, just still running on fixture data ahead of persistence. See `docs/IMPLEMENTATION_PLAN.md` for what is and isn't wired to real data yet. Phase 1's original throwaway reference mock has been deleted; nothing in the codebase should be built against it.

## 1. Sources of truth

| Concern | File | Rule |
| --- | --- | --- |
| Design tokens | `src/app/globals.css` | The only place colors, radii, shadows, and fonts are defined. |
| Fonts | `src/app/layout.tsx` | Plus Jakarta Sans (`--font-jakarta`) for everything; Geist Mono (`--font-geist-mono`) for code only. |
| Card surfaces | `src/components/shared/surface.tsx` | `Surface`, `SurfaceHeader`, `SurfaceTitle`. |
| Buttons and chips | `src/components/shared/pill.ts` | `primaryPillClass`, `softPillClass`, `chipClass`. |
| Circle icon buttons | `src/components/shared/app-shell/workspace-header.tsx` | `circleButtonClass`, `pillButtonClass` (re-exported from `@/components/shared/app-shell`). |
| Filter dropdowns | `src/components/shared/filter-menu.tsx` | `FilterMenu` — a popover with checkmarks on `md+`, a native `<select>` pill below it. Use for every filter/sort control; never hand-roll another dropdown. |
| Multi-field dialogs | `src/components/shared/responsive-dialog.tsx` | `ResponsiveDialog` — a centered dialog on `md+`, a draggable bottom sheet on mobile, exactly one mounted overlay root (switched by `useMediaQuery`, not by hiding one visually). Use for every dialog with more than one or two actions: forms, multi-step content, anything that could be tall. A single-action confirmation can stay a plain `Dialog`. |
| Shell and navigation | `src/components/shared/app-shell/*` | Rail, header, mobile tab bar, dock drawer, command launcher, `useLauncher()`. |
| Theme | `src/components/shared/theme-provider.tsx`, `theme-toggle.tsx` | `next-themes`, class strategy, `themeOptions`. |
| Empty and placeholder states | `src/components/shared/page-placeholder.tsx` | `PagePlaceholder`. |
| Role-based access | `src/lib/roles.ts`, `src/components/shared/role-preview.tsx`, `role-gate.tsx` | `Role`, capability functions (`canAccessTeamPage`, `canAccessProjects`, `canReassignLeads`, `canViewTeamReports`, `canAccessWorkspaceSettings`, `canViewTeamDashboardScope`), `useRolePreview()`, `RolePreviewBanner`, `RolePreviewToggle`, `RoleGate`. |
| Auth screens | `src/components/shared/auth-shell.tsx` | `AuthShell` — the unauthenticated layout (no rail, no header) used by every route in `src/app/(auth)`. |
| Generated primitives | `src/components/ui/*` | shadcn output. Never hand-edited. Compose and restyle from feature code. |

### On dialogs specifically

Never mount two dialog/sheet roots for the same piece of UI and switch between them with responsive `className`s (e.g. `hidden md:block` on one, `md:hidden` on the other) — each root renders its own backdrop regardless of whether its content is visually hidden, so you get a doubled, darker overlay and duplicate focus traps. Use `ResponsiveDialog`, which renders exactly one root chosen by `useMediaQuery`.

A `DialogContent` with the `rounded-3xl` class has its generated default close button (`[data-slot="dialog-close"]`) suppressed globally by a rule in `globals.css` — this is deliberate, because every `rounded-3xl` dialog in this app supplies its own 44px close circle in a custom header instead of the generated 28px one. If you add a new `rounded-3xl` dialog, you must supply that close control yourself (or use `ResponsiveDialog`, which already does).

`DropdownMenuLabel` (`src/components/ui/dropdown-menu.tsx`) renders base-ui's `Menu.GroupLabel`, which throws at runtime if it isn't a descendant of `Menu.Group` (`DropdownMenuGroup`) — this only surfaces when the menu is actually opened, not at build time, so it is easy to ship broken. **Always wrap `DropdownMenuLabel` in a `DropdownMenuGroup`**, even a `DropdownMenuGroup` with nothing else in it. `DropdownMenuGroup` itself never needs a label.

Passing a function (an event handler wrapped in a capability check, a component reference used as an `icon` prop, anything not a plain value or a React element) as a prop from a Server Component into a Client Component fails the production build with "Functions cannot be passed directly to Client Components." `RoleGate` takes a `capability` string key and resolves the check internally for exactly this reason — page.tsx files stay Server Components and never pass a function into it. If a similar pattern is needed elsewhere, follow the same shape: the Client Component owns the lookup table, the Server Component passes only serializable values.

New shared visual components go in `src/components/shared`. Feature-local components go in `src/features/<feature>/components`. Neither may introduce a new color, radius, shadow, or font.

## 2. Color

All color comes from tokens. Raw hex, rgb, oklch, or Tailwind palette classes (`bg-blue-500`, `text-slate-400`, `bg-black`, `bg-white` outside the hero card) are forbidden in feature and shared code.

### 2.1 Roles

| Token | Use it for | Never use it for |
| --- | --- | --- |
| `primary` | The one primary action per surface, the mobile Log-call button, active-state fills, focus rings, data series 1 | Body text, borders, backgrounds of large areas other than the hero card |
| `primary-deep` | Dark-blue text on white inside the hero card, hero gradient start | Anything outside the hero card |
| `accent` / `accent-foreground` | Secondary actions, tinted identity circles (initials, icons), active tab pill, "High"-style informational chips | Primary actions, status meaning |
| `success` | Positive deltas and confirmations, always paired with a `+` sign or icon | Brand emphasis, series color |
| `destructive` | Overdue, errors, dangerous actions, always paired with an icon or explicit wording | Decorative emphasis |
| `warning` | Due-soon and caution states | Anything without an icon or label |
| `muted` / `muted-foreground` | Neutral control backgrounds (`circleButtonClass`, search pill), secondary text | Disabled-looking primary actions |
| `border` | Hairlines, card outlines, heatmap zero cells | Text |
| `canvas` / `canvas-foreground` / `canvas-muted` | Navigation surfaces only: desktop rail, dock drawer, the page background behind the workspace panel | Any content component |
| `ink` / `ink-foreground` / `ink-muted` | Reserved. Only the theme toggle inside the dock uses it. Do not add new usages. | Buttons, chips, avatars, cards |
| `chart-1` … `chart-5` | Data marks only (see section 8) | UI chrome |

### 2.2 Hierarchy of emphasis

The content layer has exactly this ladder. Do not invent a rung.

1. **Primary action** — vibrant blue pill (`primaryPillClass`). One per card or view region. Examples: Log call, Open pipeline, the call button on a follow-up row.
2. **Secondary action** — soft blue tint (`softPillClass`). Examples: New lead, View all links may also be plain `text-muted-foreground` text.
3. **Hero surface** — `Surface tone="primary"` (blue gradient). **At most one per view.**
4. **Status** — green, red, amber tints at `/10`–`/12` background opacity with matching text; always accompanied by a sign, icon, or word.
5. **Identity marks** — `bg-accent text-primary` circles for initials and leading icons.

Black is a navigation color. **No black or near-black fills in content components** — no dark buttons, dark chips, dark avatars, dark cards, dark tooltips (the hero tooltip is white on blue).

### 2.3 Themes

Every component must be correct in light and dark without per-component `dark:` color overrides. Achieve this by using tokens only. The only allowed `dark:`-style exceptions are structural (`dark:hidden` / `dark:block` for swapping the theme icon) and hairline rings on canvas surfaces (`ring-1 ring-white/10`). Verify both themes before calling any UI done.

## 3. Typography

One family: Plus Jakarta Sans via `font-sans`. Never add a font.

| Role | Classes | Where |
| --- | --- | --- |
| Page title, desktop | `text-[28px] font-bold tracking-tight` | Workspace header |
| Page title, mobile | `text-xl font-bold tracking-tight` | Mobile app bar |
| Section greeting | `text-2xl font-bold tracking-tight` with `text-sm font-medium text-primary` eyebrow | Mobile only |
| Card title | `SurfaceTitle` (`text-lg font-bold tracking-tight`) | Every card |
| Card subtitle | `text-sm text-muted-foreground` (`text-white/75` on hero) | Directly under a card title |
| Hero figure | `text-[40px] leading-none font-bold tracking-tight` | One per view |
| Stat value | `text-[32px] leading-none font-bold tracking-tight` | Stat tiles, secondary figures |
| Row title | `text-sm font-bold` | List rows |
| Body | `text-sm` | Default |
| Meta | `text-xs text-muted-foreground` | Second lines, timestamps |
| Micro label | `text-[10px]` or `text-[11px] font-medium` | Axis labels, keyboard hints, tab labels |
| Chip | `text-xs font-bold` | `chipClass` |

Proportional figures everywhere; `tabular-nums` only in columns that must align (money columns, tables).

## 4. Shape, elevation, spacing

- Radius scale is set by `--radius: 0.75rem`. Cards use `rounded-3xl`; nested tiles and menu popovers use `rounded-2xl`; menu items use `rounded-xl`; heatmap cells use `rounded-[5px]`; every button, chip, input, avatar, tab, and segmented control is `rounded-full`. The desktop workspace panel is `rounded-[28px]`. No other radii.
- Shadows: `shadow-card` on light cards, `shadow-float` on floating chrome (tab bar, dock, dropdowns, hero tooltip), `shadow-workspace` on the workspace panel, and the blue glow `shadow-[0_8px_20px_-8px_var(--primary)]` only on primary pills. No other shadows.
- Card padding is `p-5`. Card content blocks are separated by `mt-5`/`mt-6`; a hero figure sits `mt-8` under its header.
- Grid gaps are `gap-4` below `lg` and `gap-5` at `lg+`. Page sections are separated by `space-y-4 lg:space-y-5`.
- Page gutters: mobile `px-4`, `sm:px-6`, desktop `px-8`. Mobile content ends with `pb-32` to clear the floating tab bar.
- Horizontal scrollers bleed to the gutter with `-mx-4 px-4` (or `-mx-5 px-5` inside a card), use `snap-x snap-mandatory`, and hide the scrollbar with `scrollbar-none`.

## 5. Controls

| Control | Recipe | Size |
| --- | --- | --- |
| Primary button | `cn(primaryPillClass, "h-11 px-5 text-sm")` | 44px |
| Primary full-width | `cn(primaryPillClass, "h-12 w-full text-sm")` | 48px |
| Secondary button | `cn(softPillClass, "h-9 pr-4 pl-3 text-xs font-bold")` in cards; `h-11 px-5 text-sm` standalone | 36 / 44px |
| Circle icon button | `circleButtonClass` (`size-11 rounded-full bg-muted`) | 44px |
| Primary circle | `cn(primaryPillClass, "size-11 rounded-full p-0")` | 44px |
| Chip | `cn(chipClass, "bg-success/12 text-success")` etc. | 28px |
| Segmented control | container `rounded-full bg-muted p-1` (hero: `bg-white/15`); option `h-8 rounded-full px-3 text-xs font-semibold`; selected `bg-background text-foreground shadow-sm` (hero: `bg-white text-primary-deep`) | 32px |
| Search trigger | The header search pill opens the command launcher via `useLauncher().setOpen(true)`; this is the only global/cross-workspace search. | 44px |
| List filter search | A plain `<input aria-label="Search …">` inside a `Surface`, `h-11 rounded-full border border-input bg-background pr-4 pl-10`, `Search` icon absolutely positioned left. Scoped to filtering the list on the current page only (leads, team, projects, campaigns). | 44px |
| Filter/sort control | `FilterMenu` — never a one-off dropdown. | 36px |
| Toggle | shadcn `Switch` (`src/components/ui/switch.tsx`) unstyled beyond its generated classes — it already reads `--primary` for the checked state. Never build a custom toggle. | — |
| Text link | `text-sm font-semibold text-muted-foreground hover:text-foreground` | — |

Rules:

- Minimum interactive size is 44×44px on every breakpoint. Compact 36px pills are allowed only inside a card header on desktop.
- Every icon-only control has an `aria-label`. Every icon in a control is a Lucide icon with `strokeWidth={1.75}` at rest and `2.25` when active/selected; `2.5` on the plus glyph of primary circles.
- Icon sizes: `size-5` in circle buttons, nav, and tabs; `size-4` inside pills and chips; `size-4.5` for the search glyph and brand mark.
- Press feedback is `active:scale-95` (circles) or `active:scale-[0.98]` (pills). Focus is `focus-visible:ring-2 focus-visible:ring-ring/50` on light surfaces and `ring-white/40` on canvas surfaces. Never remove focus styles.
- Action buttons without a backend yet are still rendered with their final label and `aria-label`; do not use placeholder text like "TODO" or "Coming soon" in controls.

## 6. Surfaces and cards

- Every card is a `Surface`. Do not hand-write card wrappers.
- `Surface` (light): white card, hairline border, `shadow-card`, `p-5`, `rounded-3xl`, `min-w-0`.
- `Surface tone="primary"` (hero): blue gradient, white text, one per view, used for the single most important visual (a trend, a primary KPI). Text on it is `text-white` / `text-white/75`; data marks are white; the tooltip and selected segment are white with `text-primary-deep`.
- Card header is `SurfaceHeader` with `SurfaceTitle` on the left and one of: a chip, a secondary pill, or a "View all" text link on the right. Never two actions in a card header.
- Card grids: the main content column plus an optional `340px` side column at `xl` (`xl:grid-cols-[minmax(0,1fr)_340px]`); three-up rows use `md:grid-cols-2 xl:grid-cols-3`. Stat tiles are a horizontal snap scroller below `sm` (`w-[78vw]` each) and a `sm:grid-cols-3` grid above.
- Lists inside cards are `ul` with rows `flex items-center gap-3 rounded-2xl px-2 py-2.5 hover:bg-muted/70`, an identity circle on the left, title/meta in the middle, status text and one primary circle action on the right.

## 7. Shell and navigation

These are built and approved. Extend them by adding items to `src/components/shared/app-shell/navigation.ts`; do not restyle them.

- **Desktop (`lg+`)**: dark canvas, white workspace panel inset `my-3 mr-3`, 80px rail fixed left that expands to 240px on hover intent (150ms) or keyboard focus and collapses after a click until the pointer leaves. Header is 96px tall: page title left; search pill (opens the launcher), theme button, notifications, avatar menu, and the primary "Log call" pill on the right.
- **Scrolling is contained inside the rounded panel, not the page.** At `lg+` the outer shell and workspace panel are height-locked to the viewport (`lg:h-dvh` / `lg:h-[calc(100dvh-1.5rem)]`, `lg:overflow-hidden`); only `<main>` scrolls (`lg:min-h-0 lg:overflow-y-auto`). The rail and header never move and the panel's rounded corners stay on screen at every scroll position — this is deliberate, don't revert it to page-level (`body`) scrolling. Below `lg` the page scrolls normally (there's no rounded panel on mobile; the sticky app bar and fixed tab bar handle staying in place on their own).
- **Mobile (`<lg`)**: white page, 64px sticky app bar: menu (opens the dock drawer), page title, search, notifications, primary Log-call circle. Floating frosted bottom tab bar (`inset-x-4`, `rounded-full`, `bg-background/90 backdrop-blur-xl`, `shadow-float`) with four expanding tabs: inactive tabs are 48px icon circles; the active tab grows into an `bg-accent text-primary` pill with its label. No FAB in the bar.
- **Dock drawer**: left sheet on `canvas`, 300px, `rounded-r-[28px]`, brand, user card, full navigation, theme toggle, log out.
- **Command launcher**: Ctrl/⌘+K, `CommandDialog` wrapped in a `Command` root, groups for Actions, Leads, Pages, Theme. New global actions are added here, not as extra header buttons.
- Page titles come from `pageTitleFor()` in `navigation.ts`; a new route must be registered there.
- Active navigation uses `aria-current="page"`.
- Navigation is role-aware: the rail, dock, and command launcher all call `navigationFor(effectiveRole)` rather than rendering `primaryNavigation` directly. A route hidden from a role by `navigationFor` must also be gated at the page level with `RoleGate` (see §9) — hiding the link is a convenience, not the boundary.
- **Auth screens** (`src/app/(auth)/*`: login, forgot-password, reset-password, activate, session-expired) use `AuthShell`, not `AppShell` — no rail, no header, no bottom bar. Centered `Surface` card, max width `max-w-md`, brand mark above it built from `BrandMark` plus a plain-token title/subtitle (never `BrandMark`'s own `withName` mode, whose subtitle is tuned for the dark canvas and reads too light on `AuthShell`'s light page).

## 8. Data visualization

Follow the dataviz method: pick the form for the data's job, then assign color by job, then apply mark specs, then add hover, then check both themes.

- **Single series on the hero**: white 2px line (`vectorEffect="non-scaling-stroke"`), white-to-transparent area wash (28% → 0), persistent marker on the peak with a white tooltip, hover crosshair that snaps to the nearest point, axis labels positioned by percentage with the first left-aligned and the last right-aligned, at most five labels. Segmented time-range control in the card header.
- **Sparklines** in light cards: `stroke-primary` 2px line, `fill-primary/15` area, no axes.
- **Magnitude and ordinal ramps** (heatmaps, stage mixes, funnels): one hue, light → deep: `chart-5` → `chart-2` → `chart-1` → `chart-4`. Zero cells use `bg-muted`. Never introduce a second hue for magnitude and never use black as the peak step.
- **Stacked bars**: `h-2.5 rounded-full` with a `gap-0.5` surface gap between segments; a legend list below with `size-3 rounded-[4px]` swatches, label, percentage in `text-xs text-muted-foreground`, value right-aligned in `tabular-nums`.
- **Categorical series** (when more than one series shares a chart): fixed order `chart-1`, `chart-3`, `chart-4`, `chart-2`; more than four series folds into "Other" or small multiples. Legend always present for ≥2 series.
- Text never wears the data color. Deltas are `text-success` / `text-destructive` with an explicit sign.
- One axis per chart. No dual-axis charts, no pie charts for more than three slices, no 3D, no decorative gradients outside the hero card.
- Every chart has an `aria-label` that names the series and, for small data, enumerates the values.

## 9. States

Every screen ships all of these before it is considered complete, using fixture data:

| State | Rule |
| --- | --- |
| Loading | `Skeleton` blocks in the exact layout of the loaded content, same radii, inside the same `Surface`. |
| Empty | `PagePlaceholder` for whole pages; inside a card, an `accent` icon circle, a one-line title, a one-line description, and at most one primary pill. |
| Error | Same anatomy as empty with a `destructive/10` icon circle and a retry primary pill. |
| Disabled | `disabled:opacity-50 disabled:pointer-events-none` on the control; never hide a control to disable it. |
| Permission-restricted | `RoleGate` (whole page) or the same `PagePlaceholder` anatomy inline (a single section or tab within an otherwise-accessible page, e.g. Settings' Workspace tab, Reports' Team performance tab) — `Lock` icon, "Restricted" title, a description naming who the page is for and what role is currently being previewed. Reactive to `useRolePreview()`: switching roles updates the page in place, no reload needed. |

Mobile below `md` turns tables into stacked action rows following the list-row recipe in section 6.

### Role preview

`useRolePreview()` exposes `ownRole` (always the signed-in identity, `Administrator` in this app), `previewRole` (`null` or an override), and `effectiveRole` (`previewRole ?? ownRole` — always use this one for gating and nav filtering, never `ownRole`). Previewing a role is a reviewer tool, not a role switch: it never changes `currentUser`, only what capability checks return. It is not persisted (plain `useState` in `RolePreviewProvider`, mounted once in `AppShell`) — a hard navigation or reload resets it to `null`, which is intended, not a bug to fix by adding persistence. `RolePreviewBanner` renders inside `<main>` whenever `previewRole` is set; every gated page and section must key off `effectiveRole`, not assume Administrator.

## 10. Forbidden

- Any color, shadow, radius, or font value not defined in `globals.css`.
- `bg-ink`, black, `zinc`/`slate`/`gray` palette classes, or `#000`-style fills in content components.
- A second hero surface, a second primary pill in the same card, or a primary pill used as decoration.
- Tooltips as the only label for an action on touch devices.
- Editing `src/components/ui/*`.
- A standalone global/workspace search box outside the command launcher. In-page list filtering is not this — use the list-filter-search recipe in §5.
- `Geist` sans, Inter, or any new font import.
- Fixed-width layouts, horizontal page scroll at 375px, tap targets under 44px.
- Comments in source. Explanations belong in this document (see `DEVELOPER_BRIEFING.md` §15).

## 11. Definition of done for UI work

1. Uses `Surface`, `pill.ts` recipes, `circleButtonClass`, and tokens exclusively; no new visual primitives without updating this document.
2. Renders correctly in light and dark; screenshots of both at 375px and 1440px are attached to the review.
3. Loading, empty, error, disabled, and permission-restricted states exist and use fixture data.
4. Keyboard reachable, focus visible, every icon-only control labeled, active navigation marked with `aria-current`.
5. No horizontal overflow at 375px; every grid child that can shrink has `min-w-0`.
6. Charts follow section 8 and both themes were checked for contrast.
7. `npm run lint`, `tsc --noEmit`, and `next build` pass.
