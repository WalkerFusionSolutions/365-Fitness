# 365 Fitness Web

The production website uses Next.js, TypeScript, Tailwind CSS, and the existing
Supabase project. The public marketing site has two presentation variants; auth
and the protected coach dashboard are shared.

## Environment

Create `.env.local` from `.env.local.example` and provide the existing public
Supabase URL and publishable key. Never place a service-role key in the web app.

`NEXT_PUBLIC_MARKETING_VARIANT` supports:

- `lovable` - the default editorial production presentation
- `php` - the isolated presentation translated from `../php-reference`

The PHP source is a visual reference only. PHP is not a runtime dependency.

## Development

From `web/`, run either variant in PowerShell:

```powershell
$env:NEXT_PUBLIC_MARKETING_VARIANT="lovable"
npm run dev
```

```powershell
$env:NEXT_PUBLIC_MARKETING_VARIANT="php"
npm run dev
```

Restart the development server after changing the variant.

## Validation

```powershell
npm run lint
npm run build
```

Validate the public routes from `/` through `/contact`, plus `/login`. The
variant setting must not change the authenticated `/dashboard` experience.
