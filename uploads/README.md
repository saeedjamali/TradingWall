# Uploads (outside `public/`)

User-uploaded images are stored here so they survive `next build` / redeploy of `.next`.

Structure:
- `profiles/` — profile photos
- `plans/` — trade plan screenshots
- `trades/` — per-trade screenshots
- `messages/` — feedback / chat images

Public URL shape is unchanged: `/uploads/<subdir>/<filename>`
and is served by `app/uploads/[...path]/route.js`.

On the server after deploy:
1. Ensure this folder exists and is writable by the Node process (`chmod` / ownership).
2. Do **not** put uploads under `public/` anymore.
3. If you had old files in `public/uploads`, move them here once, then delete `public/uploads`.
