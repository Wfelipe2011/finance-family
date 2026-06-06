## 1. Design Tokens and Shared Inputs

- [x] 1.1 Add a destructive Red Apple token/class scoped to delete actions
- [x] 1.2 Ensure category chip options consume the current shared category list
- [x] 1.3 Confirm Tailwind v4 CSS-first styling remains the implementation path

## 2. Category Chips

- [x] 2.1 Create a mobile category chip component with horizontal overflow behavior
- [x] 2.2 Wire chip selection to the existing lancamento category filter state
- [x] 2.3 Add "Todos" chip behavior to clear the category filter
- [x] 2.4 Add active, focus, and pressed states without layout shift

## 3. Expandable Mobile Rows

- [x] 3.1 Create an expandable lancamento row/card component for mobile
- [x] 3.2 Show description, category, and value in the closed state
- [x] 3.3 Reveal formatted date, responsible user, edit, and delete actions in the expanded state
- [x] 3.4 Style delete with Red Apple and edit/filter actions with Action Blue or neutral styling
- [x] 3.5 Ensure row expansion works with pointer and keyboard activation

## 4. Responsive Lancamentos Page

- [x] 4.1 Integrate chips and mobile rows into the existing lancamentos page
- [x] 4.2 Preserve desktop/table-compatible scanning on wider viewports
- [x] 4.3 Preserve date filtering and CSV export behavior
- [x] 4.4 Verify no text overlap on small phone and desktop widths

## 5. Tests and Validation

- [x] 5.1 Add tests for category chip filtering and clear behavior
- [x] 5.2 Add tests for expanding/collapsing mobile rows
- [x] 5.3 Add tests for destructive delete styling scope
- [x] 5.4 Add responsive/accessibility checks for touch target and keyboard behavior
- [x] 5.5 Run client tests with `nvm use`
- [x] 5.6 Run OpenSpec status for `mobile-lancamentos-experience`
