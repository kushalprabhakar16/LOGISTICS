# LogiSphere Global

Multimodal cargo and port operations platform. This repository is **Stage 1**: a working React + Vite + TypeScript + Tailwind app that runs entirely in the browser (demo data saved in localStorage), so it deploys to GitHub Pages.

## Run locally
```
npm install
npm run dev      # http://localhost:5173
npm test         # unit tests: units, packaging, capacity, time zones
npm run build    # production build in dist/
```

## Deploy to GitHub Pages
1. Create a GitHub repo and push this folder to the `main` branch.
2. In the repo go to Settings > Pages > Build and deployment > Source: **GitHub Actions**.
3. Push again (or run the workflow manually). The site appears at `https://<user>.github.io/<repo>/`.

## What works now
12 portals with role-based tabs, dynamic cargo entry for 8 categories, mass/volume/count separation (litres never become kg without density), capacity checks, QR codes, searchable/sortable/exportable cargo table, port and airport operations (receive/load/unload with variance, handovers needing receiver confirmation, tasks, incidents), shipment timeline with IANA time zones, world clock and converter.

## Not built yet (next stages)
FastAPI + MySQL backend, real login and server-side authorization, audit logs, quotations/invoices, Leaflet map, Playwright tests, light theme. GitHub Pages cannot host Python or MySQL, so the backend needs separate hosting.
