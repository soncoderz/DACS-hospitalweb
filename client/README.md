# Hospital Web Application - Client

This repository contains the frontend code for the Hospital Management System, built with React.

## Features

- User authentication and authorization
- Appointment booking and management
- Doctor schedules and availability
- Medical services and specialties
- Patient profiles and medical records
- Admin dashboard for system management
- Doctor dashboard for patient management

## UI Improvements with Tailwind CSS

The application UI has been redesigned using Tailwind CSS, resulting in:

- Modern, consistent design language across all pages
- Improved responsive layouts for all device sizes
- Enhanced user experience with animations and transitions
- Better performance through optimized CSS
- Easier maintenance with utility-first approach

See [tailwind-migration.md](./tailwind-migration.md) for detailed information about the CSS migration process.

## Technology Stack

- React
- React Router
- Axios
- React Query
- React Hook Form
- Tailwind CSS
- Vite

## Installation

1. Clone the repository
2. Install dependencies
   ```bash
   npm install
   ```
3. Create a `.env` file with the following variables:
   ```
   VITE_API_URL=http://localhost:5000
   ```
4. Start the development server
   ```bash
   npm run dev
   ```

## Build

To build the application for production, run:

```bash
npm run build
```

The build output will be in the `dist` directory.

## Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build for production
- `npm run preview` - Preview the production build locally
- `npm run selenium` - Run the Selenium suite against an already running client and server
- `npm run selenium:local` - Start the client and server, then run the Selenium suite
- `npm run selenium:headed` - Run the Selenium suite against an already running stack and keep the browser visible
- `npm run selenium:local:headed` - Start the client and server when needed, then run the Selenium suite with a visible browser

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Selenium E2E

1. Copy `.env.selenium.example` to `.env.selenium` and adjust the values you need.
2. Make sure `SELENIUM_BROWSER` is set to `chrome` or `edge`, and that browser is installed on the machine.
3. Make sure `server/.env` is valid and MongoDB is reachable, because the suite creates a test user and books a real appointment in the local database.
4. Install dependencies with `npm install`.
5. Run `npm run selenium:local` from the `client` directory to start the stack and execute the suite.
6. If the app is already running, use `npm run selenium` or `npm run selenium:headed` instead of starting duplicate dev servers.
7. The PayPal step uses mock mode by default. To run the real PayPal sandbox popup, set `SELENIUM_PAYPAL_FLOW=sandbox`, fill `SELENIUM_PAYPAL_SANDBOX_EMAIL` and `SELENIUM_PAYPAL_SANDBOX_PASSWORD` in `.env.selenium`, and run the suite in headed mode.
8. Real PayPal sandbox mode relies on `localStorage` auth in the popup success page, so the Selenium runner automatically uses `remember me` for that payment step.

Reports and screenshots are written to `client/selenium/artifacts/`.
