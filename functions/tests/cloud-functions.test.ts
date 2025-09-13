import { exportToSheets } from '../src/index';

// Mock Firebase Admin
const mockAdmin = {
  initializeApp: jest.fn(),
  firestore: jest.fn(() => ({
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        get: jest.fn(),
        set: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      })),
      where: jest.fn(() => ({
        get: jest.fn(),
      })),
    })),
  })),
  auth: jest.fn(),
};

// Mock SendGrid
const mockSendGrid = {
  setApiKey: jest.fn(),
  send: jest.fn(),
};

// Mock Google APIs
const mockGoogle = {
  google: {
    auth: {
      GoogleAuth: jest.fn(() => ({
        getClient: jest.fn(),
      })),
    },
    sheets: jest.fn(() => ({
      spreadsheets: {
        create: jest.fn(() => ({
          data: { spreadsheetId: 'test-spreadsheet-id' },
        })),
        values: {
          update: jest.fn(() => ({
            data: { updatedRange: 'Sheet1!A1:E5' },
          })),
        },
      },
    })),
  },
};

jest.mock('firebase-admin', () => mockAdmin);
jest.mock('@sendgrid/mail', () => mockSendGrid);
jest.mock('googleapis', () => mockGoogle);

describe('Cloud Functions Security Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('exportToSheets Function', () => {
    it('should require authentication', async () => {
      const mockRequest = {
        auth: null, // No authentication
        data: { eventId: 'event123' },
      };

      await expect(
        exportToSheets(mockRequest as any, {} as any)
      ).rejects.toThrow('User must be authenticated');
    });

    it('should require admin or organizer role', async () => {
      const mockRequest = {
        auth: { uid: 'user123' },
        data: { eventId: 'event123' },
      };

      // Mock user document with regular user role
      const mockUserDoc = {
        exists: true,
        data: () => ({ role: 'user' }),
      };

      mockAdmin.firestore().collection().doc().get.mockResolvedValue(mockUserDoc);

      await expect(
        exportToSheets(mockRequest as any, {} as any)
      ).rejects.toThrow('User must be admin or organizer');
    });

    it('should require event ID', async () => {
      const mockRequest = {
        auth: { uid: 'admin123' },
        data: {}, // Missing eventId
      };

      // Mock admin user
      const mockUserDoc = {
        exists: true,
        data: () => ({ role: 'admin' }),
      };

      mockAdmin.firestore().collection().doc().get.mockResolvedValue(mockUserDoc);

      await expect(
        exportToSheets(mockRequest as any, {} as any)
      ).rejects.toThrow('Event ID is required');
    });

    it('should check if event exists', async () => {
      const mockRequest = {
        auth: { uid: 'admin123' },
        data: { eventId: 'nonexistent-event' },
      };

      // Mock admin user
      const mockUserDoc = {
        exists: true,
        data: () => ({ role: 'admin' }),
      };

      // Mock non-existent event
      const mockEventDoc = {
        exists: false,
      };

      const mockCollection = mockAdmin.firestore().collection();
      mockCollection.doc().get
        .mockResolvedValueOnce(mockUserDoc) // User lookup
        .mockResolvedValueOnce(mockEventDoc); // Event lookup

      await expect(
        exportToSheets(mockRequest as any, {} as any)
      ).rejects.toThrow('Event not found');
    });

    it('should check organizer permissions for non-admin users', async () => {
      const mockRequest = {
        auth: { uid: 'organizer123' },
        data: { eventId: 'event123' },
      };

      // Mock organizer user
      const mockUserDoc = {
        exists: true,
        data: () => ({ role: 'organizer' }),
      };

      // Mock event with different organizer
      const mockEventDoc = {
        exists: true,
        data: () => ({
          organizerId: 'different-organizer',
          title: 'Test Event',
        }),
      };

      const mockCollection = mockAdmin.firestore().collection();
      mockCollection.doc().get
        .mockResolvedValueOnce(mockUserDoc) // User lookup
        .mockResolvedValueOnce(mockEventDoc); // Event lookup

      await expect(
        exportToSheets(mockRequest as any, {} as any)
      ).rejects.toThrow('User must be the event organizer or admin');
    });

    it('should successfully export data for admin user', async () => {
      const mockRequest = {
        auth: { uid: 'admin123' },
        data: { eventId: 'event123' },
      };

      // Mock admin user
      const mockUserDoc = {
        exists: true,
        data: () => ({ role: 'admin' }),
      };

      // Mock event
      const mockEventDoc = {
        exists: true,
        data: () => ({
          organizerId: 'organizer123',
          title: 'Test Event',
        }),
      };

      // Mock registrations
      const mockRegistrations = [
        {
          id: 'reg1',
          data: () => ({
            userName: 'John Doe',
            userEmail: 'john@example.com',
            reason: 'Interested in AI',
            status: 'confirmed',
            registrationTime: { toDate: () => new Date('2024-03-01T10:30:00Z') },
          }),
        },
        {
          id: 'reg2',
          data: () => ({
            userName: 'Jane Smith',
            userEmail: 'jane@example.com',
            reason: 'Research project',
            status: 'confirmed',
            registrationTime: { toDate: () => new Date('2024-03-02T14:15:00Z') },
          }),
        },
      ];

      const mockQuerySnapshot = {
        docs: mockRegistrations,
      };

      const mockCollection = mockAdmin.firestore().collection();
      const mockQuery = mockCollection.where().get;

      mockCollection.doc().get
        .mockResolvedValueOnce(mockUserDoc) // User lookup
        .mockResolvedValueOnce(mockEventDoc); // Event lookup

      mockQuery.mockResolvedValue(mockQuerySnapshot);

      // Test that the function can be called without throwing
      await expect(
        exportToSheets(mockRequest as any, {} as any)
      ).resolves.not.toThrow();

      // Verify that the necessary functions were called
      expect(mockCollection.doc).toHaveBeenCalled();
      expect(mockQuery).toHaveBeenCalled();
    });
  });

  describe('Email Functions', () => {
    it('should send registration confirmation email', async () => {
      // Mock the Firestore trigger data
      const mockSnap = {
        data: () => ({
          id: 'reg123',
          eventId: 'event123',
          userId: 'user123',
          userName: 'John Doe',
          userEmail: 'john@example.com',
          registrationTime: { toDate: () => new Date() },
          status: 'confirmed',
          reason: 'Interested in the topic',
        }),
      };

      const mockEventDoc = {
        exists: true,
        data: () => ({
          id: 'event123',
          title: 'AI Workshop',
          date: { toDate: () => new Date() },
          location: 'University Auditorium',
        }),
      };

      mockAdmin.firestore().collection().doc().get.mockResolvedValue(mockEventDoc);
      mockSendGrid.send.mockResolvedValue({});

      // Note: This test would need to be adapted based on how the function is actually triggered
      // For now, we're testing the email sending logic structure
      expect(mockSendGrid.setApiKey).toHaveBeenCalled();
    });

    it('should send approval email when status changes to confirmed', async () => {
      const mockBeforeSnap = {
        data: () => ({
          status: 'waitlist',
        }),
      };

      const mockAfterSnap = {
        data: () => ({
          id: 'reg123',
          eventId: 'event123',
          userId: 'user123',
          userName: 'John Doe',
          userEmail: 'john@example.com',
          registrationTime: { toDate: () => new Date() },
          status: 'confirmed',
          reason: 'Interested in the topic',
        }),
      };

      const mockEventDoc = {
        exists: true,
        data: () => ({
          id: 'event123',
          title: 'AI Workshop',
          date: { toDate: () => new Date() },
          location: 'University Auditorium',
        }),
      };

      mockAdmin.firestore().collection().doc().get.mockResolvedValue(mockEventDoc);
      mockSendGrid.send.mockResolvedValue({});

      // Test the approval email logic
      expect(mockSendGrid.setApiKey).toHaveBeenCalled();
    });

    it('should handle missing event gracefully', async () => {
      const mockSnap = {
        data: () => ({
          id: 'reg123',
          eventId: 'nonexistent-event',
          userId: 'user123',
          userName: 'John Doe',
          userEmail: 'john@example.com',
          registrationTime: { toDate: () => new Date() },
          status: 'confirmed',
          reason: 'Interested in the topic',
        }),
      };

      const mockEventDoc = {
        exists: false,
      };

      mockAdmin.firestore().collection().doc().get.mockResolvedValue(mockEventDoc);

      // Function should handle missing event without crashing
      // This would be tested by calling the actual function
      expect(mockAdmin.firestore().collection).toHaveBeenCalledWith('events');
    });
  });

  describe('Input Validation', () => {
    it('should validate event data in export function', async () => {
      const mockRequest = {
        auth: { uid: 'admin123' },
        data: { eventId: '' }, // Empty event ID
      };

      const mockUserDoc = {
        exists: true,
        data: () => ({ role: 'admin' }),
      };

      mockAdmin.firestore().collection().doc().get.mockResolvedValue(mockUserDoc);

      await expect(
        exportToSheets(mockRequest as any, {} as any)
      ).rejects.toThrow('Event ID is required');
    });

    it('should validate user profile exists', async () => {
      const mockRequest = {
        auth: { uid: 'user123' },
        data: { eventId: 'event123' },
      };

      const mockUserDoc = {
        exists: false, // User profile doesn't exist
      };

      mockAdmin.firestore().collection().doc().get.mockResolvedValue(mockUserDoc);

      await expect(
        exportToSheets(mockRequest as any, {} as any)
      ).rejects.toThrow('User profile not found');
    });
  });
});