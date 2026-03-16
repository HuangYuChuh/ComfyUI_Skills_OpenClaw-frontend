# ComfyUI Skills OpenClaw — Frontend

Frontend UI for [ComfyUI_Skills_OpenClaw](https://github.com/HuangYuChuh/ComfyUI_Skills_OpenClaw).

## Development

```bash
npm install
npm run dev      # dev server
npm test         # run tests
npm run build    # production build → dist/
```

## Release

Push a version tag to trigger a GitHub Release with the built assets:

```bash
git tag v0.1.0
git push origin v0.1.0
```

The main repo can then pull the latest release via `scripts/update_frontend.sh`.
