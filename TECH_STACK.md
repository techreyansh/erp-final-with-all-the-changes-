# Reyansh ERP – Full Tech Stack

Complete technology stack and architecture for the Reyansh Factory Operations Monitoring System (ERP).

---

## 1. Overview

| Layer | Technology |
|-------|------------|
| **Application type** | Single-page application (SPA) |
| **Frontend framework** | React 18 |
| **Build tooling** | Create React App (react-scripts 5) |
| **Primary data source** | Google Sheets (via APIs) + session storage |
| **Authentication** | Google OAuth 2.0 (Identity Services + Sheets/Drive scopes) |
| **Deployment** | Static build; deployable to Vercel, Netlify, or any static host |

---

## 2. Frontend

### 2.1 Core

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | ^18.2.0 | UI library |
| **React DOM** | ^18.2.0 | React renderer for the browser |
| **react-router-dom** | ^6.22.1 | Client-side routing, nested routes, `Navigate`, `useLocation` |
| **react-scripts** | 5.0.1 | Create React App – build, dev server, test runner, Babel, Webpack |

### 2.2 UI & styling

| Technology | Version | Purpose |
|------------|---------|---------|
| **@mui/material** | ^7.1.0 | Component library (Material UI v7) |
| **@mui/icons-material** | ^7.1.0 | Icon set for MUI |
| **@mui/x-date-pickers** | ^8.5.2 | Date/time pickers |
| **@emotion/react** | ^11.14.0 | CSS-in-JS (used by MUI) |
| **@emotion/styled** | ^11.14.0 | Styled components (used by MUI) |
| **@date-io/date-fns** | ^3.2.1 | Date adapter for MUI date pickers (date-fns) |

- **Typography:** Plus Jakarta Sans (Google Fonts), fallback system fonts.
- **Theming:** Single MUI `createTheme` in `App.js` (palette, typography, shape, shadows, component overrides).
- **Motion:** CSS-based (keyframes, transitions, `prefers-reduced-motion`), no heavy animation library.

### 2.3 Data visualization & documents

| Technology | Version | Purpose |
|------------|---------|---------|
| **recharts** | ^3.1.2 | Charts (dashboard, analytics) |
| **react-google-charts** | ^4.0.1 | Google Charts wrapper |
| **react-big-calendar** | ^1.19.4 | Calendar UI (scheduling, events) |
| **jspdf** | ^2.5.2 | PDF generation |
| **jspdf-autotable** | ^3.8.4 | Tables in PDFs |
| **xlsx** | ^0.18.5 | Excel read/write (import/export) |

### 2.4 Utilities & data handling

| Technology | Version | Purpose |
|------------|---------|---------|
| **axios** | ^1.9.0 | HTTP client (e.g. Google APIs) |
| **date-fns** | ^4.1.0 | Date formatting and manipulation |
| **dayjs** | ^1.11.13 | Lightweight dates (used in some modules) |
| **moment** | ^2.30.1 | Legacy date handling where still used |
| **jwt-decode** | ^4.0.0 | Decode JWT (if used for tokens) |

### 2.5 Third-party integrations

| Technology | Version | Purpose |
|------------|---------|---------|
| **emailjs-com** | ^3.2.0 | Email sending from the client |
| **gapi-script** | ^1.2.0 | Google API client loading |
| **google-spreadsheet** | ^4.1.2 | Google Sheets API (read/write) |

---

## 3. Backend & data layer

- **No custom backend server.** The app talks directly to Google from the browser.
- **Google APIs used:**
  - **Google Identity Services (GIS)** – Sign-in, OAuth 2.0.
  - **Google Sheets API v4** – Primary data store (POs, SOs, inventory, users, purchase flow, sales flow, CRM, etc.).
  - **Google Drive API** – File/document access where configured.
- **Auth & persistence:**
  - **sessionStorage** – `currentUser`, `googleToken` (per tab).
  - **config.useLocalStorage** – Optional flag to use localStorage and mock user (e.g. for dev without Sheets).
- **User/role source:**  
  - Production: Users sheet in the same Google Spreadsheet (Email, Role, Permissions).  
  - Dev/mock: In-memory mock user (e.g. Customer Relations Manager or CEO via direct login).

---

## 4. Authentication & authorization

| Aspect | Implementation |
|--------|----------------|
| **Provider** | Google OAuth 2.0 (GIS + `https://apis.google.com/js/api.js`) |
| **Scopes** | `openid`, `userinfo.email`, `userinfo.profile`, `spreadsheets`, `drive.file`, `drive` |
| **Client IDs** | Separate IDs for localhost vs Vercel (see `oauthConfig.js`) |
| **Redirect URI** | Vercel URL when on localhost or Vercel; otherwise `window.location.origin` |
| **Token storage** | sessionStorage (`googleToken`, `currentUser`) |
| **Validation** | Token checked with `https://www.googleapis.com/oauth2/v3/userinfo`; periodic re-check (e.g. every 9 hours) |
| **Role-based access** | `authService.hasRole(role)`, `getUserRole()` from `authUtils`; menu and routes filtered by role (e.g. CEO-only `/ceo-command`) |
| **CEO-only route** | `CEOOnlyRoute` + `ceoDashboardAccessLog` for access attempts (ready for backend audit later) |

---

## 5. Configuration

| File / env | Purpose |
|------------|---------|
| **src/config/config.js** | Spreadsheet ID, API key, sheet names, status codes, purchase/sales flow config, feature flags |
| **src/config/oauthConfig.js** | OAuth client IDs, scopes, redirect URI, allowed origins |
| **REACT_APP_USE_LOCAL_STORAGE** | When `"true"`, use localStorage and mock user (no Sheets auth required) |
| **public/** | Static assets (favicon, manifest, logo, `index.html`) |

---

## 6. Application structure (high level)

```
src/
├── config/           # config.js, oauthConfig.js
├── context/          # AuthContext, StepStatusContext
├── services/         # sheetService, authService, *Service (client, po, flow, CRM, etc.)
├── utils/            # authUtils, ceoAccess, dateRestrictions, backwardPlanning, etc.
├── components/
│   ├── auth/         # Login, PrivateRoute, CEOOnlyRoute
│   ├── common/       # Header, LoadingSpinner, SkeletonLoader, FullScreenLogoLoader, etc.
│   ├── dashboard/    # Dashboard (main)
│   ├── ceoDashboard/ # CEO Executive Dashboard (Coming Soon)
│   ├── purchaseFlow/ # Purchase flow steps & layout
│   ├── salesFlow/    # Sales flow steps & layout
│   ├── Inventory/, dispatch/, product/, crm/, etc.
├── App.js            # Theme, routes, layout, AuthProvider, StepStatusProvider
├── index.js          # React root, Google API load, CssBaseline
└── index.css         # Global styles, motion tokens, keyframes
```

- **Routing:** React Router v6; routes defined in `App.js` (e.g. `/login`, `/dashboard`, `/ceo-command`, `/purchase-flow/*`, `/sales-flow/*`, inventory, molding, etc.).
- **State:** React state + Context (auth, step status); no Redux or other global store.

---

## 7. Build & run

| Command | Purpose |
|---------|---------|
| **npm start** | Dev server (default port 3000) |
| **npm run build** | Production build (`build/`) |
| **npm test** | Jest via react-scripts |
| **npm run eject** | Eject CRA (irreversible) |

- **Browserslist:** Production/development targets in `package.json` (e.g. “>0.2%”, not dead; last Chrome/Firefox/Safari for dev).

---

## 8. Testing

| Technology | Version | Purpose |
|------------|---------|---------|
| **@testing-library/react** | ^16.3.0 | Component testing |
| **@testing-library/jest-dom** | ^6.6.3 | DOM matchers |
| **@testing-library/user-event** | ^13.5.0 | User interaction simulation |
| **@testing-library/dom** | ^10.4.0 | DOM utilities |

- Test runner: Jest via `react-scripts test`; config extended with `react-app` / `react-app/jest` in `package.json`.

---

## 9. DevOps & deployment

- **Hosting:** Static hosting (e.g. Vercel); build output is `build/`.
- **Environment:** `REACT_APP_*` for env vars; OAuth redirect and client IDs vary by host (localhost vs Vercel).
- **API key / secrets:** Google API key and spreadsheet ID are in `config.js` (frontend). For production, consider env-based config and restricting API key by referrer/domain.

---

## 10. Summary table

| Category | Stack |
|----------|--------|
| **UI framework** | React 18 |
| **UI library** | MUI v7 (Material UI + Emotion) |
| **Routing** | React Router v6 |
| **Data / backend** | Google Sheets API + Google Drive (no Node backend) |
| **Auth** | Google OAuth 2.0 (GIS), sessionStorage, role from Sheets or mock |
| **Charts** | Recharts, react-google-charts |
| **PDF/Excel** | jsPDF, jspdf-autotable, xlsx |
| **Build** | Create React App (Webpack, Babel) |
| **Testing** | Jest + React Testing Library |
| **Fonts** | Plus Jakarta Sans (Google Fonts) |
| **Deploy** | Static build → Vercel or any static host |

This is the full tech stack of the project with the details needed for onboarding, documentation, or migration planning.
