# Reyansh ERP (React + Supabase)

Internal ERP-style web app: sales flow, purchase flow, CRM, inventory-related screens, and more. Frontend is **Create React App** (React 18); data and auth use **Supabase** (Postgres + REST + Storage).

## Quick start

1. **Clone** this repository.
2. **Install:** `npm ci` (or `npm install`).
3. **Environment:** copy `.env.example` to `.env.local` and set at least:
   - `REACT_APP_SUPABASE_URL`
   - `REACT_APP_SUPABASE_ANON_KEY` (and/or publishable key per `.env.example`)
   - Optional: `REACT_APP_GOOGLE_OAUTH_CLIENT_ID`, `REACT_APP_WHATSAPP_LINK`, `REACT_APP_OAUTH_REDIRECT_URL` for production OAuth.
4. **Database:** create a Supabase project and apply SQL under `supabase/migrations/` in order (or use [Supabase CLI](https://supabase.com/docs/guides/cli) `db push` against your linked project). Do not commit real keys; `.env` and `.env.local` are gitignored.
5. **Run dev:** `npm start` → [http://localhost:3000](http://localhost:3000).
6. **Production build:** `npm run build` → static files in `build/` (deploy to Vercel, Netlify, Cloudflare Pages, etc.; configure SPA fallback to `index.html` and the same `REACT_APP_*` vars in the host’s dashboard). The committed `.env.production` sets `DISABLE_ESLINT_PLUGIN=true` so CI builds (e.g. Vercel with `CI=true`) do not fail on legacy ESLint warnings; remove it after lint cleanup if you want strict checks in CI.

## Repository

- Remote for this line: [techreyansh/reyansh-erp-with-data](https://github.com/techreyansh/reyansh-erp-with-data).

---

# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
