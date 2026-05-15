# API extensions for listing detail

Apply these changes on the Render backend (`airbnb-api`).

## Listing model

Add optional fields:

```prisma
latitude   Float?
longitude  Float?
reviewCount Int? @default(0)
```

Seed coordinates from `location` (one-time script).

## GET /listings/:id

Return sanitized host only:

```json
{
  "host": {
    "id": "...",
    "name": "Jane Doe",
    "avatar": "https://...",
    "isSuperhost": true,
    "hostingSince": "2024-01-01T00:00:00.000Z"
  },
  "latitude": 47.2184,
  "longitude": -1.5536
}
```

Never return: `password`, `resetToken`, `email` (unless needed for host contact).

## GET /listings/:id/reviews

```json
{
  "data": [
    {
      "id": "uuid",
      "rating": 5,
      "comment": "Great stay!",
      "createdAt": "2026-04-20T12:00:00.000Z",
      "author": { "name": "Emma", "avatar": null }
    }
  ],
  "meta": { "total": 22, "averageRating": 4.95 }
}
```

Until deployed, the mobile app uses client-side fallbacks (geocoding + generated reviews).
