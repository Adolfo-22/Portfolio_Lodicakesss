This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Private photo album

Open `/private`, or select **Open post** on the **Just us** post in the blog carousel. The last carousel post opens a password dialog, then displays the album inside that same modal. The album requires a password; every photo request checks the server session. Sessions expire after one hour. Anyone you share the password with can save photos they can view.

Original photos live in `private/gallery-originals/`, outside `public/` and ignored by Git. Only AES-256-GCM encrypted WebP copies in `private/gallery/` are committed. Never put private originals back in `public/`.

Run `npm run gallery:setup` after changing the originals. It creates optimized encrypted photos and, on first use, a random password. Find the password in the ignored `private/gallery-access.txt` file. Back up your originals and `.env.local` securely. Do not commit or share either file.

For deployment, copy **GALLERY_MEDIA_KEY** and **GALLERY_PASSWORD_HASH** from `.env.local` into your hosting provider's server environment variables, then redeploy. Neither variable may use a `NEXT_PUBLIC_` prefix. Without these settings, the deployed album stays locked. Use HTTPS in production. A fresh clone needs these same settings to decrypt the committed assets; do not run setup with a new key unless you intend to replace the album.

To change the password, provide `GALLERY_NEW_PASSWORD` (at least 6 characters) as an environment variable when running `npm run gallery:setup`, then update the hosting password hash and redeploy. Existing sessions become invalid. The setup script retains the media key. For removed photos, the manifest allowlist immediately prevents access; old encrypted files may be removed from `private/gallery/` before committing. The application has a basic per-server login limiter; configure a hosting/WAF rate limit for `/private/session` when deploying across multiple instances. Authorized viewers can retain downloaded images even after logout.

## Getting Started

The Contact message form uses FormSubmit AJAX to send submissions to `adolfoproilan@gmail.com`. Activate it through FormSubmit's confirmation email before using it publicly. Visitors stay on the portfolio while sending; failed submissions retain the typed message and offer a direct email link. No email API key is stored in the website.

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

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
