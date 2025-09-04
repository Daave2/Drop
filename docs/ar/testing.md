# AR Manual Testing Checklist

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
