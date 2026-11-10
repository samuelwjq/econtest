# Economics diagrams

Interactive diagrams for H2 A-level Economics, for teacher-led lessons (widgets marked **Guided**) and independent revision.

Page: https://samuelwjq.github.io/econwidgets/index.html

To embed in Google Sites, use *Insert → Embed → By URL* with the page above. To open a single widget directly, add its name after `#`, for example `…/index.html#fiscal-policy`. The names are listed in the menu at the bottom of `index.html`.

## Files

| File | What it holds | When to edit it |
| --- | --- | --- |
| `glossary.js` | Every glossary definition, in one place | To correct or add a definition. The change appears in every widget that uses the term. |
| `tips.js` | Every hover/tap explanation on the diagrams | To reword an explanation. |
| `topics/*.js` | The widgets, one file per topic: their controls, model and written explanations | To change how a widget behaves or what its explanation says. |
| `index.html` | The page and the topic menu | To rename or reorder widgets in the menu. |
| `ew.js`, `ew.css` | The shared engine: drawing, label placement, controls, glossary panel, saving images | Rarely. |
| `404.html` | Forwards old links (e.g. `Fiscal_Policy.html`) to the same widget in `index.html` | Only if a widget is renamed. |

## Conventions

- **Colours** are set once in `ew.js` (`C`): demand/benefit curves blue, supply/cost curves green, social curves and phenomena red, policy-created curves and government revenue violet, perceived curves orange. Initial curves are drawn in a lighter shade.
- **Labels** are placed by the engine, not by hand. Point labels avoid curves and other labels. Axis values stay in one row or column, with grey leader lines when they are crowded. Phenomenon labels ("Shortage at P₀", "Unemployment") stay centred over their arrow.
- **Text** is in sentence case. Topic and widget names in the menu are in Title Case.
- A widget lists the glossary terms it needs by key (`glossary: ['demand', 'supply']`). A sentence that applies to one widget only goes in that widget's `glossaryNotes`. If a key is missing from `glossary.js` or `tips.js`, the browser console shows a warning naming it.
