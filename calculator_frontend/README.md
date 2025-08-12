# Scientific Calculator (React)

A modern, minimalistic, and responsive scientific calculator built with React. It supports basic arithmetic and scientific functions, keyboard input, clear/delete actions, and optional Supabase-backed history.

## Features

- Basic arithmetic: `+ - × ÷ ^`
- Scientific functions: `sin cos tan log ln √ x² 1/x EXP |x| π e`
- Angle modes: `DEG` and `RAD`
- Keyboard support: digits, `+ - * / ^`, `.`, `Enter`, `Backspace`, `Escape`
- Clear (`C`) and Delete (`DEL`)
- Responsive layout for mobile and desktop
- Optional Supabase integration for recent calculation history

## Quick Start

From the `calculator_frontend` directory:

```bash
npm install
npm start
```

Open http://localhost:3000 to use the app.

## Supabase (Optional)

1. Copy `.env.example` to `.env` and fill the values:

```
REACT_APP_SUPABASE_URL=...
REACT_APP_SUPABASE_KEY=...
```

2. Create a `calc_history` table and enable simple RLS as documented in `../assets/supabase.md`.

The UI will show "Supabase Connected" when ready.

## Scripts

- `npm start` – Run dev server
- `npm test` – Run tests
- `npm run build` – Production build

## Notes

- This app uses plain CSS, no heavy UI framework.
- The calculator will function fully without Supabase; history will be local-only (in-memory).
