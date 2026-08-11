# Mini ERP Task Tracker

A small task-tracking application built with Cloudflare Pages, Cloudflare Workers, and Cloudflare D1.

## Deployment

This project uses automatic deployment from the `main` branch.

- Cloudflare Pages deploys the static frontend.
- Cloudflare Workers Builds deploys the API Worker.
- Cloudflare D1 stores persistent task data.

Every approved push to `main` triggers the connected Cloudflare deployment pipelines.