# AR Manual Testing Checklist

## Desktop Development & Simulation

Since desktop browsers lack the necessary sensors for AR, the best way to test is by using **Chrome's Remote Debugging** feature with a connected Android device. This allows you to run the app on your phone while viewing the console and debugging tools on your desktop.

1.  **Enable Developer Options on Android:**
    *   Go to **Settings** > **About phone**.
    *   Tap **Build number** seven times.
    *   Go back to **Settings** > **System** and find the new **Developer options** menu.
2.  **Enable USB Debugging:**
    *   In **Developer options**, enable **USB debugging**.
3.  **Connect to Desktop:**
    *   Connect your Android device to your computer via USB.
    *   On your desktop Chrome, navigate to `chrome://inspect`.
    *   Your device should appear. Find the tab running your application and click **inspect**.
    *   A DevTools window will open, connected to your phone's browser session.

---

## Device compatibility
- [ ] Chrome on ARCore-capable Android device
- [ ] Samsung Internet on ARCore-capable Android device
- [ ] Unsupported browsers show fallback message (e.g., iOS Safari)

## Permission flows
- [ ] Camera permission prompt appears and accepting starts AR session
- [ ] Denying camera permission shows helpful error and prevents AR session
- [ ] Location permission prompt appears; accepting updates note positions
- [ ] Denying location permission shows fallback message
- [ ] Motion/Orientation sensor permission requested on iOS 13+
- [ ] Revoking permissions and reloading triggers prompts again
