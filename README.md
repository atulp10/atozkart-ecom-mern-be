# AtoZKart Backend

Express and MongoDB API for AtoZKart.

## Local setup

1. Copy `.env.example` to `.env` and fill in the required credentials.
2. Install dependencies with `npm install`.
3. Start MongoDB, then run `npm run dev`.

Useful commands:

```bash
npm run lint
npm test
npm run seed
npm start
```

Production startup validates all required environment variables. `ALLOWED_ORIGINS` accepts a comma-separated list of trusted frontend origins.

## API notes

- Browser mutation requests must include an allowed `Origin` header.
- Authentication uses an HTTP-only session cookie. Registration always creates a `User`; admin accounts must be assigned outside the public registration endpoint.
- Product creation, updates, deletion, and image uploads require an authenticated admin.
- `POST /products/images` accepts one image in the `image` multipart field, up to 2 MB.
- `GET /orders` returns only the current user's orders unless the current user is an admin.
- `POST /orders/payment-intent` creates a Stripe payment intent from product IDs and quantities. Prices are loaded from MongoDB.
- `POST /orders` requires an `Idempotency-Key` header for COD orders. Online orders may use the Stripe payment intent ID as their idempotency key.
- Order totals, customer identity, product snapshots, and stock changes are controlled by the server.
- Only admins may move orders through valid status transitions. Cancelling restores inventory and refunds paid online orders.
- Configure Stripe to send signed events to `POST /webhooks/stripe`.

Error responses use this shape:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed"
  }
}
```
