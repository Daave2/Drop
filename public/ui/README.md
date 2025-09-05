# NoteDrop UI SVGs (Extended)
Use the sprite (`notedrop-ui-sprite-extended.svg`) inline at the root of your HTML (or inject via JS), then reference icons with:
```html
<svg width="24" height="24" viewBox="0 0 64 64"><use href="#nd-pin-default"/></svg>
```
Symbols included:

Pins: nd-pin-default • nd-pin-ghost • nd-pin-limited • nd-pin-lowtrust • nd-pin-selected • nd-pin-reported

Map: nd-cluster • nd-compass • nd-sight-arc • nd-lock • nd-camera • nd-countdown

Actions: nd-heart • nd-bookmark • nd-reply • nd-share • nd-flag

System: nd-user • nd-settings • nd-accessibility • nd-location-on • nd-location-off

Badges: nd-badge-starter • nd-badge-verified

Colors are baked from the brand palette. You can override fills with CSS if you embed the sprite in the DOM.
