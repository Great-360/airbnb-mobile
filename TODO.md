# TODO

## Host role navbar + pages

- [ ] Inspect existing navigation/entry points (tabs vs routes)
- [ ] Create host tabs UI components (native + web)
  - [ ] `src/components/host-tabs.tsx`
  - [ ] `src/components/host-tabs.web.tsx`
- [ ] Create host screens (placeholders first)
  - [ ] `src/app/host/listings.tsx`
  - [ ] `src/app/host/booking.tsx`
  - [ ] `src/app/host/dashboard.tsx`
  - [ ] `src/app/host/inbox.tsx`
  - [ ] `src/app/host/profile.tsx` (reuse existing profile)
- [ ] Wire host tabs route into app layout / router
- [ ] Add role-based redirection after login (use `user.role === "HOST"`)
- [ ] Lint + run web/mobile sanity checks
