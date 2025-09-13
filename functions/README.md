# University Club Platform - Backend

This directory contains the Firebase Cloud Functions backend for the University Club Web Platform.

## 🚀 Features

- **Email Notifications**: Automated emails for registration and approval
- **Google Sheets Export**: Export event registrations to Google Sheets
- **Enhanced Security**: Firestore rules with rate limiting and input validation
- **Real-time Triggers**: Firestore triggers for automatic workflows

## 📁 Project Structure

```
functions/
├── src/
│   └── index.ts          # Main Cloud Functions
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
├── firebase.json         # Firebase configuration
├── .firebaserc           # Firebase project configuration
├── firestore.indexes.json # Firestore indexes
├── deploy.sh            # Deployment script
└── README.md            # This file
```

## ⚙️ Setup Instructions

### 1. Prerequisites

- Node.js 20.x
- Firebase CLI (`npm install -g firebase-tools`)
- Google Cloud Project with Firebase enabled
- SendGrid account for email functionality
- Google Service Account for Sheets API

### 2. Installation

```bash
# Install dependencies
npm install

# Login to Firebase
firebase login

# Initialize Firebase project (if not already done)
firebase init
```

### 3. Configuration

#### SendGrid Setup
1. Create a SendGrid account at https://sendgrid.com
2. Get your API key from the dashboard
3. Set the environment variable:
   ```bash
   firebase functions:config:set sendgrid.key="YOUR_SENDGRID_API_KEY"
   ```

#### Google Sheets API Setup
1. Go to Google Cloud Console
2. Enable Google Sheets API
3. Create a Service Account
4. Download the JSON key file
5. Set environment variables:
   ```bash
   firebase functions:config:set google.private_key="YOUR_PRIVATE_KEY"
   firebase functions:config:set google.client_email="YOUR_CLIENT_EMAIL"
   ```

#### Email Configuration
```bash
firebase functions:config:set email.from="noreply@universityclub.com"
```

### 4. Deployment

```bash
# Make deploy script executable
chmod +x deploy.sh

# Run deployment script
./deploy.sh
```

Or deploy manually:
```bash
# Install dependencies
npm install

# Build functions
npm run build

# Deploy
firebase deploy --only functions,firestore
```

## 🔧 Cloud Functions

### sendOnRegisterEmail
**Trigger**: Firestore document creation in `registrations/{registrationId}`
**Purpose**: Send confirmation email when user registers for an event

### sendOnApproveEmail
**Trigger**: Firestore document update in `registrations/{registrationId}`
**Purpose**: Send approval email when admin sets registration status to 'confirmed'

### exportToSheets
**Trigger**: HTTPS callable function
**Purpose**: Export event registrations to Google Sheets
**Parameters**:
- `eventId` (string): Event ID to export
- `spreadsheetId` (optional): Existing spreadsheet ID

## 📊 Firestore Security Rules

Enhanced security rules include:
- **Rate Limiting**: Prevents abuse with configurable limits
- **Input Validation**: Validates all user inputs
- **Role-based Access**: Proper permission checks
- **Data Sanitization**: Prevents injection attacks

### Rate Limits
- User profile updates: 10 per minute
- Event creation: 5 per hour
- Event updates: 20 per hour
- Registration creation: 10 per hour
- Registration updates: 50 per hour

## 🔍 Monitoring and Logging

### View Function Logs
```bash
# View all function logs
firebase functions:log

# View specific function logs
firebase functions:log --only sendOnRegisterEmail

# View logs in real-time
firebase functions:log --only sendOnRegisterEmail --open
```

### Error Handling
All functions include comprehensive error handling:
- Structured logging
- Proper error responses
- Graceful degradation
- Retry mechanisms

## 🧪 Testing

### Local Testing
```bash
# Start Firebase emulators
npm run serve

# Test functions locally
firebase functions:shell
```

### Unit Testing
```bash
# Run tests (when implemented)
npm test
```

## 📈 Performance Optimization

- **Cold Start Minimization**: Functions are optimized for quick startup
- **Connection Pooling**: Reused connections for external APIs
- **Batch Operations**: Efficient bulk data processing
- **Caching**: Reduced redundant operations

## 🔒 Security Best Practices

- **Authentication Required**: All functions require Firebase Auth
- **Authorization Checks**: Proper role-based access control
- **Input Validation**: All inputs are validated and sanitized
- **Rate Limiting**: Prevents abuse and DoS attacks
- **Error Handling**: No sensitive information in error messages

## 🚨 Troubleshooting

### Common Issues

1. **Functions not deploying**
   - Check Firebase project configuration
   - Verify billing is enabled for your project
   - Check function logs for errors

2. **Email not sending**
   - Verify SendGrid API key
   - Check email templates
   - Review function logs

3. **Sheets export failing**
   - Verify Google Service Account credentials
   - Check Sheets API is enabled
   - Ensure proper permissions on spreadsheet

### Debug Mode
Enable debug logging by setting environment variable:
```bash
firebase functions:config:set debug.enabled="true"
```

## 📝 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `SENDGRID_API_KEY` | SendGrid API key for emails | Yes |
| `GOOGLE_PRIVATE_KEY` | Google Service Account private key | Yes |
| `GOOGLE_CLIENT_EMAIL` | Google Service Account email | Yes |
| `EMAIL_FROM` | Email address for sending emails | Yes |
| `DEBUG_ENABLED` | Enable debug logging | No |

## 🔄 CI/CD Integration

This setup is ready for CI/CD integration with:
- GitHub Actions
- GitLab CI
- Jenkins
- Any other CI/CD platform

Example GitHub Actions workflow:
```yaml
name: Deploy Backend
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '20'
      - run: npm install
      - run: npm run build
      - run: firebase deploy --only functions,firestore --token ${{ secrets.FIREBASE_TOKEN }}
```

## 📞 Support

For issues and questions:
1. Check the function logs: `firebase functions:log`
2. Review Firestore rules for permission issues
3. Verify environment variables are set correctly
4. Check the Firebase Console for errors

## 📋 Changelog

### v1.0.0
- Initial implementation
- Email notifications for registration and approval
- Google Sheets export functionality
- Enhanced Firestore security rules
- Comprehensive error handling and logging