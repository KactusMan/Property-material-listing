# MatFlow

Materials ordering for property renovation teams. Vendors order materials for the properties assigned to them and suggest new items or cheaper sources. The office approves requests and suggestions, and the buying assistant turns WhatsApp material lists into a ready Amazon cart.

React (Vite) front end, Express API (one serverless function on Vercel), MongoDB Atlas.

## Roles

**Vendors** (stored as `contractor` users)
- Register themselves; the account stays in the admin's approval queue until approved and linked to a vendor record.
- See and order only for their assigned properties.
- Suggest a new material or a better price for a catalogue item, with the link where they found it. Nothing reaches the catalogue until an admin approves it.
- English and Spanish.

**Admin**
- Reviews requests (Submitted → Approved → Ordered → Delivered, or Rejected). Items with an `amazon.com/dp/…` link go into the Amazon cart in one click.
- Reviews vendor suggestions; approving updates the catalogue price or adds the material, with price history.
- Sees every vendor from the workbook, which ones are active in the portal and when they last signed in, assigns properties, and creates logins.
- **Buying assistant**: paste a WhatsApp list. The assistant (Groq `openai/gpt-oss-120b` with live browser search) reads each item, finds the cheapest suitable Amazon listing, compares it with the catalogue and returns an order list. Links and Amazon product IDs are only kept when they appeared in the live search results; anything unconfirmed falls back to an Amazon search. Selected items open in Amazon's cart in one click. The free Groq plan allows 200,000 tokens per day per model, which is a handful of lists; when the main model runs out the assistant moves to `openai/gpt-oss-20b`.
- **Email alerts**: new requests, vendor suggestions and sign-ups are emailed to `NOTIFY_EMAIL` through Resend.

## Environment

Copy `.env.example` to `.env`. On Vercel, set the same variables under Project → Settings → Environment Variables:

| Variable | Notes |
| --- | --- |
| `MONGODB_URI` | Atlas connection string including the database name, e.g. `…mongodb.net/property-materials?retryWrites=true&w=majority` |
| `JWT_SECRET` | 32+ random characters (`openssl rand -hex 32`). The API refuses to start in production without it. |
| `GROQ_API_KEY` | Server-side only. Never prefix it with `VITE_`. |
| `GROQ_MODEL`, `GROQ_FALLBACK_MODEL` | Optional, default to `openai/gpt-oss-120b` and `openai/gpt-oss-20b`. |
| `RESEND_API_KEY`, `NOTIFY_EMAIL` | Optional. Both are needed for email alerts. Without a verified domain, the Resend account must be registered under `NOTIFY_EMAIL`. |
| `MAIL_FROM`, `APP_URL` | Optional. Sender address once a domain is verified, and the site address used in email links. |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Only used by `npm run import-data` to create the first admin when none exists. |

## Commands

```bash
npm install
npm run dev          # API on :5000 (API_PORT) + Vite on :5173
npm run import-data  # sync MongoDB with the workbooks (safe to rerun)
npm run build
npm run lint
```

`npm run import-data` reads `property materials manager.xlsx` and `material list with links.xlsx`. It only adds what is missing (products, properties, vendors, linked materials, and the vendor-property pairs found in the Requests sheet). It never overwrites anything edited in the app.

## Security notes

- Sessions are signed JWTs in an `HttpOnly`, `SameSite=Strict`, `Secure` cookie. No tokens in `localStorage`.
- Mutating requests must be JSON, which also blocks cross-site form posts.
- Every input is type-checked and length-limited before it reaches MongoDB; links must be `http(s)` so stored URLs can never run script.
- Vendors are authorised per property on the server, not just hidden in the UI.
- Rate limits on sign-in, sign-up, suggestions and the assistant (per serverless instance).
- Security headers and a strict Content-Security-Policy are set in `vercel.json` and by the API.
