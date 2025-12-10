# Installation Instructions for Analytics Dashboard

## Required Packages

The Analytics Dashboard requires the following packages to be installed:

1. **@google-cloud/bigquery** - For querying BigQuery data from Firebase Analytics export
2. **recharts** - For data visualization with charts
3. **swr** - For data fetching and caching (optional, current implementation uses native fetch)

## Installation Command

Run the following command in your terminal from the project root directory:

```bash
npm install @google-cloud/bigquery recharts swr
```

Or if using yarn:

```bash
yarn add @google-cloud/bigquery recharts swr
```

Or if using pnpm:

```bash
pnpm add @google-cloud/bigquery recharts swr
```

## Environment Variables

To use BigQuery (optional - the dashboard works with fallback data), add these to your `.env.local` file:

```env
BIGQUERY_SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":"...","private_key_id":"...","private_key":"...","client_email":"...","client_id":"...","auth_uri":"...","token_uri":"...","auth_provider_x509_cert_url":"...","client_x509_cert_url":"..."}'
GOOGLE_CLOUD_PROJECT_ID=your-firebase-project-id
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-firebase-project-id

# Optional: If you know your analytics dataset ID, set it here
# Otherwise, the system will try to discover it automatically
# Example: ANALYTICS_DATASET_ID=analytics_123456789
```

## Current Implementation

The analytics dashboard is already configured to:
- ✅ Work without installing packages (uses fallback data)
- ✅ Show placeholder messages when packages are missing
- ✅ Load real BigQuery data when packages and credentials are available
- ✅ Display charts using Recharts when installed
- ✅ Handle errors gracefully

## What Was Implemented

### Backend (`/src/app/api/analytics/route.ts`)
- API route that connects to BigQuery (with fallback to mock data)
- Queries for:
  - Total users
  - Active users per day (last 30 days)
  - Event frequency (most common events)
  - Screen views (most visited pages)
- Dynamically imports BigQuery to avoid build errors when not installed

### Frontend (`/src/app/admin/analytics/page.tsx`)
- Modern dashboard with Tailwind CSS
- Three chart types:
  - **Line Chart**: Daily Active Users (last 30 days)
  - **Bar Chart**: Event Frequency (most common events)
  - **Pie Chart**: Screen Views Distribution (most visited pages)
- Four stat cards:
  - Total Users
  - Active Users (last 30 days)
  - Total Events
  - Screen Views
- Fully localized for English and Arabic
- Loading states and error handling
- Graceful degradation when packages are not installed

## Next Steps

1. Run `npm install @google-cloud/bigquery recharts swr` to install required packages
2. (Optional) Configure BigQuery credentials in `.env.local` for production analytics
3. Access the dashboard at `/admin/analytics` (requires admin/organizer access)

## Features

- 📊 **Visual Analytics**: Beautiful charts and graphs
- 🌍 **Multi-language**: Supports English and Arabic
- 🔒 **Secure**: API routes protected by Next.js
- ⚡ **Fast**: Uses SWR for caching (when installed)
- 🎨 **Modern UI**: Tailwind CSS with brand colors
- 📱 **Responsive**: Works on all devices
- ⚠️ **Graceful**: Works with or without BigQuery credentials

## Finding Your Analytics Dataset ID

If you're unsure of your Firebase Analytics dataset ID, you can find it in the BigQuery console:

1. Go to [BigQuery Console](https://console.cloud.google.com/bigquery)
2. Select your Firebase project
3. Look for datasets that start with `analytics_` (e.g., `analytics_123456789`)
4. Copy the exact dataset name and set it as `ANALYTICS_DATASET_ID` in your `.env.local`

Alternatively, if you don't set `ANALYTICS_DATASET_ID`, the system will attempt to automatically discover the dataset from your BigQuery project.

## Troubleshooting

**Error: "Does not match any table"**
- This means the analytics export is not set up or the dataset name is incorrect
- Check that Firebase Analytics → BigQuery export is enabled
- Verify the `ANALYTICS_DATASET_ID` matches your actual dataset name

**Error: "BigQuery package not installed"**
- Run `npm install @google-cloud/bigquery` to install the package
- The dashboard will still work with fallback data if not installed

## Notes

- The dashboard will work with fallback data if packages are not installed
- BigQuery integration is optional - you can use the dashboard with mock data for development
- Charts will show placeholder messages until Recharts is installed
- All data is aggregated and optimized for performance

