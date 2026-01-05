This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Environment Variables

Copy `.env.example` to `.env.local` and fill in the values:

```bash
cp .env.example .env.local
```

### Monobank "Покупка частинами" (Installments) Configuration

For testing, use the test platform credentials:

| Variable | Value | Description |
|----------|-------|-------------|
| `MONO_CHAST_BASE_URL` | `https://u2-demo-ext.mono.st4g3.com` | API base URL |
| `MONO_CHAST_STORE_ID` | `test_store_with_confirm` | Store identifier |
| `MONO_CHAST_SECRET` | `secret_98765432--123-123` | HMAC secret for signatures |
| `MONO_CHAST_CALLBACK_URL` | `https://YOUR_DOMAIN/api/webhooks/mono-installments` | Webhook URL |
| `MONO_CHAST_MOCK` | `true` (optional) | Enable mock mode for local dev |

**API Endpoints:**
- Create: `POST /api/order/create`
- Confirm: `POST /api/order/confirm`
- Status: `POST /api/order/status`

**Request Headers:**
- `store-id` - Store identifier
- `signature` - HMAC-SHA256 Base64 signature of request body
- `Content-Type: application/json`
- `Accept: application/json`

**Phone Format:** Must be `+380XXXXXXXXX` with valid Ukrainian operator code (e.g., `+380671234561`).

**Test scenarios** (based on customer phone last digit):
- **1** → Approved callback after ~5 seconds
- **2** → Waiting for customer confirmation (PENDING_CUSTOMER)
- **3** → Declined (insufficient limit) callback after ~5 seconds  
- **4** → Customer confirmed, waiting for merchant confirmation (2-step flow)

For production, obtain credentials from the Monobank merchant portal.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
