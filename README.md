# NoteDrop

NoteDrop is an experimental location-based note taking application built with Next.js and TypeScript.

## Getting Started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Run the development server on port 9002:

   ```bash
   npm run dev
   ```

3. Run quality checks:

   ```bash
   npm run lint
   npm run typecheck
   npm test
   ```

## Configuration

Set environment variables in a `.env.local` file to customize behavior. `NEXT_PUBLIC_PROXIMITY_RADIUS_M` defines the default distance (in meters) for proximity notifications, but users can adjust the radius later in their profile settings.

```bash
NEXT_PUBLIC_PROXIMITY_RADIUS_M=100 
```

If not provided, the default radius is 50 meters.

## Browser & Device Support

| Device/OS | Browser | AR Support | Notes |
|-----------|---------|------------|-------|
| Android (ARCore capable) | Chrome 81+ | ✅ WebXR AR | Requires HTTPS and camera permissions |
| Android (ARCore capable) | Samsung Internet 14+ | ✅ WebXR AR | May require enabling experimental WebXR flag |
| iOS 15+ | Safari | ❌ No WebXR | Falls back to non-AR experience |
| Desktop (Windows/macOS) | Chrome, Edge, Firefox | ❌ | AR features require mobile hardware |

## Documentation

A high level project blueprint is available in [`docs/blueprint.md`](docs/blueprint.md).

The main application entry point is [`src/app/page.tsx`](src/app/page.tsx).
