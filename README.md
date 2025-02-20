# Bufo Blender 2000

> Be the artist you always wanted to be

## Quickstart 🚀

```bash
# Install dependencies
pnpm install

# Preprocess bufos
pnpm preprocess-bufos

# Deploy image processing lambda
pnpm sso
pnpm run deploy

# Create .env file with the image processing lambda endpoint
echo "IMAGE_PROCESSING_ENDPOINT=https://xxx/" > .env

# Start the development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
