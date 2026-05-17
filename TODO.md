# TODO

## Trips page auth handling

- [x] Identify why Trips shows while logged out
- [ ] Patch `src/app/(tabs)/trips.tsx` so it clears bookings when auth token is missing (or re-fetches on focus)

- [ ] (Optional) Prevent stale UI by reloading on screen focus using `useFocusEffect`
- [ ] Smoke test: login -> visit trips -> logout -> trips shows empty state
