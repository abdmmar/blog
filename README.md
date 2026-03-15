# ✤ abdmmar.com

Personal site. Built using [Astro](https://astro.build/) and [Inter](https://rsms.me/inter/) typeface

## ✦ Development

```bash
# clone project
git clone https://github.com/abdmmar/blog.git
cd blog

# install dependencies
pnpm install

# start dev server
pnpm dev
```

## Scripts

### Adding photos

Photos are served from Cloudflare R2. The workflow to add new photos:

**1. Compress and resize the raw image**

```sh
pnpm convert-images src/assets/photo/2024/
```

**2. Generate MDX content from the image (reads EXIF data)**

```sh
pnpm generate-content
```

This creates a `.mdx` file in `src/content/photo/` with local `filepath` and extracted EXIF metadata.

**3. Upload to Cloudflare R2**

Copy `.env.example` to `.env` and fill in your R2 credentials:

```sh
cp .env.example .env
```

Required env vars:

| Variable | Description |
|---|---|
| `CLOUDFLARE_ACCOUNT_ID` | Your Cloudflare account ID |
| `CLOUDFLARE_R2_ACCESS_KEY_ID` | R2 API token access key |
| `CLOUDFLARE_R2_SECRET_ACCESS_KEY` | R2 API token secret |
| `CLOUDFLARE_R2_BUCKET_NAME` | Name of the R2 bucket |
| `CLOUDFLARE_R2_PUBLIC_URL` | Public URL of the bucket (e.g. `https://your-bucket.r2.dev`) |

Then run:

```sh
pnpm upload-images
```

This uploads any new images to R2, updates `scripts/cloudflare-images-manifest.json`, and rewrites the `filepath` in each MDX file from the local path to the R2 URL.

**4. Commit the changes**

```sh
git add src/content/photo/ scripts/cloudflare-images-manifest.json
git commit -m "feat: add new photos"
```

---


## ✽ References

- https://chia.design/
- https://chester.how/
- https://www.yihui.work/
