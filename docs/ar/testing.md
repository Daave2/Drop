# AR Manual Testing Checklist

## Desktop Development & Simulation

Since desktop browsers lack the necessary sensors for AR, use the **WebXR API Emulator** browser extension to simulate a mobile device for development and testing.

1.  **Install the Extension:**
    *   [For Chrome](https://chrome.google.com/webstore/detail/webxr-api-emulator/mjddjgeghkdijejnciaefnkjmkafnnje)
    *   [For Firefox](https://addons.mozilla.org/en-US/firefox/addon/webxr-api-emulator/)
2.  **Using the Emulator:**
    *   Open your browser's DevTools.
    *   Navigate to the **WebXR** tab.
    *   Select a device to emulate (e.g., "Generic Headset (AR)").
    *   Use the controls in the panel to move and rotate the virtual device to test your application's AR logic.

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
