## Context

The existing lancamentos screen is functional but table-oriented. On mobile, the target workflow is repeated scanning and quick filtering rather than dense comparison. The project already uses Tailwind v4 CSS-first styling and tokens from DESIGN.md, including Action Blue as the only primary interaction color.

The user explicitly chose Red Apple for delete actions, so this design introduces a narrow destructive-action exception.

## Goals / Non-Goals

**Goals:**
- Provide mobile-first quick category filtering with horizontal chips.
- Render lancamentos as one-line expandable rows/cards on mobile.
- Preserve desktop/table usability where viewport width supports it.
- Use existing API/contracts.
- Use Tailwind v4 and existing design tokens.
- Provide Red Apple styling only for destructive delete actions.

**Non-Goals:**
- No server API change.
- No new category data model beyond consuming the shared category list.
- No decorative gradients or chrome shadows.
- No generative UI.

## Decisions

### D1: Responsive composition instead of a separate mobile page

**Choice**: Keep the existing lancamentos route and switch presentation responsively: mobile uses chips and expandable rows; desktop can keep the table or a denser list.

**Rationale**: One route keeps export/filter behavior and state management unified.

**Alternative considered**: Build a separate mobile route. Rejected because it duplicates filtering and export behavior.

### D2: Chips are filter controls, not navigation

**Choice**: Category chips update the existing category filter state and reuse the same fetch/export semantics.

**Rationale**: The mental model remains "filter current list", not "navigate to category pages".

### D3: Expandable rows reveal secondary metadata and actions

**Choice**: The closed row shows description/category and amount. The expanded area reveals formatted date, responsible user, edit action, and delete action.

**Rationale**: Most mobile scans need only "what" and "how much"; actions should not crowd every row by default.

### D4: Red Apple is destructive-only

**Choice**: Add a `system-red`/destructive token for delete text/buttons only. All other interactive elements continue using Action Blue.

**Rationale**: This honors the requested delete affordance while containing the exception to a conventional destructive action.

## Risks / Trade-offs

- **[Risk] Hidden actions may reduce discoverability** -> Mitigation: use clear expanded state and accessible button labels.
- **[Risk] Horizontal chips can overflow awkwardly** -> Mitigation: use stable touch targets, `overflow-x-auto`, and no layout-shifting chip sizes.
- **[Risk] Red Apple conflicts with design rules** -> Mitigation: document it as destructive-only and test that no other interaction uses it.

## Migration Plan

1. Add destructive color token/class.
2. Extract/rework category chips and mobile lancamento row components.
3. Wire chips to existing filter hook.
4. Add responsive behavior and accessibility tests.
5. Verify desktop/table behavior and CSV export remain intact.

## Open Questions

- Should desktop keep the existing table permanently, or should expanded rows become the only list representation across all viewports?
