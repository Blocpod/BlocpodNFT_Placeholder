# BLOCPOD CREATIVE

An interactive NFT-universe landing experience: a data stream circles a refractive 3D orb and collapses into the BLOCPOD CREATIVE core.

## Development

Requires Node.js 22.

```bash
npm install
npm run dev
```

## Production

```bash
npm run build
npm start
```

This is a standard Next.js App Router project and deploys to Vercel with its default Next.js settings. No output-directory override is required.

## Static production build

Use Node 24.22.1 or newer on the 24.x line (`nvm use` selects the pinned version), then run `npm ci` and `npm run build`. Deploy the generated `out/` directory as static files. The experience runs in the browser and does not require a Node server or image optimizer. `npm start` previews that directory locally using Python 3.
