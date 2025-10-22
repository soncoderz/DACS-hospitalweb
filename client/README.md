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

## License

This project is licensed under the MIT License - see the LICENSE file for details.
