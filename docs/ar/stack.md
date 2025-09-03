# AR Stack Evaluation

## WebXR via three.js or A-Frame

- Runs directly in modern browsers without app store deployment.
- `three.js` offers fine-grained control and strong TypeScript support.
- `A-Frame` provides a declarative layer but adds extra overhead.
- Browser support is limited: effective today on Chrome and Samsung Internet for ARCore-capable Android devices; iOS Safari lacks WebXR.
- Tracking and performance depend on browser implementations and may lag behind native capabilities.

## Native ARKit/ARCore Wrappers

- Full access to device sensors and the latest AR features with best performance.
- Requires building and maintaining separate native apps for iOS and Android.
- Slower iteration and distribution through app stores.
- Harder to integrate with a primarily web-based codebase.

## Chosen Stack

The project will use **WebXR with `three.js`**. It keeps the stack web-centric alongside Next.js, avoids native app maintenance, and allows us to progressively enhance features for supported browsers. `A-Frame` was considered but deemed heavier than necessary.

## Required Polyfills

- [`webxr-polyfill`](https://github.com/immersive-web/webxr-polyfill) to expose WebXR APIs on browsers without native support.
- `@webxr-input-profiles/motion-controllers` for loading controller profiles used by `three.js` WebXR helpers.
- Graceful degradation on iOS Safari where WebXR is unavailable.

