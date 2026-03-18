# `<tool-tip>` element

_Work-in-progress…_

A custom element that implements a tooltip as a label or a description.

Uses the Popover API for the tooltip and sets up an implicit anchor.

## Usage

As a description…

```html
<button id=instant-search aria-pressed=true>Instant search</button>

<tool-tip type=description for=instant-search>Navigates to search results as you type.</tool-tip>
```

As a label (for an icon button)…

```html
<button id=increment><span aria-hidden=true>+</span></button>

<tool-tip type=label for=increment>Increment</tool-tip>
```

## Styling

Use `:state(open)` to style the `<tool-tip>` element when it’s open. An implicit anchor is set up while the tooltip is open.
