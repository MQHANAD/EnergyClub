#!/bin/bash

# University Club Platform - Backend Deployment Script

echo "🚀 Starting University Club Platform Backend Deployment"

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI is not installed. Please install it first:"
    echo "   npm install -g firebase-tools"
    exit 1
fi

# Check if user is logged in to Firebase
if ! firebase projects:list &> /dev/null; then
    echo "❌ Not logged in to Firebase. Please login first:"
    echo "   firebase login"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the functions
echo "🔨 Building functions..."
npm run build

# Deploy Firestore rules and indexes
echo "📋 Deploying Firestore rules and indexes..."
firebase deploy --only firestore:rules,firestore:indexes

# Deploy Cloud Functions
echo "⚡ Deploying Cloud Functions..."
firebase deploy --only functions

# Set environment variables (you'll need to update these with actual values)
echo "🔧 Setting environment variables..."
echo "Please set the following environment variables in your Firebase project:"
echo "  - SENDGRID_API_KEY: Your SendGrid API key"
echo "  - GOOGLE_PRIVATE_KEY: Your Google Service Account private key"
echo "  - GOOGLE_CLIENT_EMAIL: Your Google Service Account client email"
echo "  - EMAIL_FROM: The email address to send emails from"

echo "To set environment variables, run:"
echo "  firebase functions:config:set sendgrid.key=\"YOUR_SENDGRID_API_KEY\""
echo "  firebase functions:config:set google.private_key=\"YOUR_PRIVATE_KEY\""
echo "  firebase functions:config:set google.client_email=\"YOUR_CLIENT_EMAIL\""
echo "  firebase functions:config:set email.from=\"noreply@universityclub.com\""

echo "✅ Backend deployment completed!"
echo ""
echo "📝 Next steps:"
echo "1. Update the environment variables in Firebase"
echo "2. Test the functions using Firebase CLI:"
echo "   firebase functions:log --only sendOnRegisterEmail"
echo "3. Verify email templates and Google Sheets integration"