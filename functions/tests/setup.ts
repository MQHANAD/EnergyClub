// Test setup for Firebase Functions

// Mock Firebase Admin
jest.mock('firebase-admin', () => ({
  initializeApp: jest.fn(),
  firestore: jest.fn(() => ({
    collection: jest.fn(),
    doc: jest.fn(),
  })),
  auth: jest.fn(),
}));

// Mock Firebase Functions
jest.mock('firebase-functions', () => ({
  firestore: {
    document: jest.fn(() => ({
      onCreate: jest.fn(),
      onUpdate: jest.fn(),
      onDelete: jest.fn(),
    })),
  },
  https: {
    onCall: jest.fn(),
  },
  config: jest.fn(() => ({
    sendgrid: { key: 'test-sendgrid-key' },
    email: { from: 'test@example.com' },
    google: {
      private_key: 'test-private-key',
      client_email: 'test@example.com',
    },
  })),
  HttpsError: class HttpsError extends Error {
    constructor(code: string, message: string) {
      super(message);
      this.name = 'HttpsError';
    }
  },
}));

// Mock SendGrid
jest.mock('@sendgrid/mail', () => ({
  setApiKey: jest.fn(),
  send: jest.fn(),
}));

// Mock Google APIs
jest.mock('googleapis', () => ({
  google: {
    auth: {
      GoogleAuth: jest.fn(() => ({
        getClient: jest.fn(),
      })),
    },
    sheets: jest.fn(() => ({
      spreadsheets: {
        create: jest.fn(),
        values: {
          update: jest.fn(),
        },
      },
    })),
  },
}));

// Global test setup
beforeAll(() => {
  // Set up any global test configuration
  process.env.NODE_ENV = 'test';
});

afterAll(() => {
  // Clean up after all tests
  jest.clearAllMocks();
});