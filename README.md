# EstateFlow materials dashboard

A mobile-friendly materials workflow for property teams. Contractors choose an approved property and approved materials, submit quantities with notes, and track their request. Administrators review the exact requested products, costs, supplier links, and move each request through Submitted, Approved, Ordered, and Delivered.

## Before first use

1. Copy `.env.example` to `.env` and set a MongoDB connection string, a long random `JWT_SECRET`, and the first administrator's credentials.
2. Run `npm install`.
3. Run `npm run import-data` once. This imports the checked-in workbook's products, properties, and contractors, and creates the initial administrator only if no users exist.
4. Run `npm run dev` for local development, or deploy using the included Vercel configuration.

The workbook import is safe to rerun. It updates existing products, properties, and contractors by their stable IDs. It does not create material requests or publish passwords.

## Access rules

- New registrations create contractor accounts only. Administrator accounts must be created by the team.
- Passwords are bcrypt-hashed before storage.
- The API validates a signed session token for every property, product, contractor, and request operation.
- Contractors can only read their own requests and can only submit their own requests.
- Only administrators can review requests or change a request status.

## Later enhancements

Email notifications, password recovery, translations, and supplier-cart automation are intentionally out of this first release.
