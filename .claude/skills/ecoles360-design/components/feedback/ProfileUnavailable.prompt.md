Shown over an establishment profile when its page is temporarily offline (credits/subscription lapsed — surfaced simply as "en mise à jour"). Full-screen blurred overlay by default.

```jsx
<ProfileUnavailable onSearch={goSearch} onContact={openWhatsApp} />

// inline (inside a container, no backdrop)
<ProfileUnavailable overlay={false} image="https://…/campus.jpg" />
```

Renders over the blurred profile behind it. Primary CTA (red) searches another establishment; green CTA contacts support. Pass `image` for a real photo, omit for the placeholder, or `image={false}` to drop the slot. Keep the copy generic ("mise à jour") — don't expose the billing reason.
