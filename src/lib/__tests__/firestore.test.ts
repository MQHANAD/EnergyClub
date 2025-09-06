/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-env jest */
// @ts-nocheck
import { eventsApi, registrationsApi } from '../firestore';
import { Event, Registration } from '@/types';

// Mock Firebase
const mockFirebase = {
  collection: jest.fn(),
  doc: jest.fn(),
  getDocs: jest.fn(),
  getDoc: jest.fn(),
  addDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  startAfter: jest.fn(),
  Timestamp: {
    now: jest.fn(() => ({ toDate: () => new Date() })),
    fromDate: jest.fn((date) => ({ toDate: () => date })),
  },
};

// Mock the db import
jest.mock('../firebase', () => ({
  db: mockFirebase,
}));

describe('Firestore API Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Events API', () => {
    const mockEvent: Event = {
      id: 'event123',
      title: 'Test Event',
      description: 'Test Description',
      date: new Date('2024-03-15T14:00:00Z'),
      location: 'Test Location',
      maxAttendees: 100,
      currentAttendees: 0,
      organizerId: 'organizer123',
      organizerName: 'Test Organizer',
      status: 'active',
      createdAt: new Date('2024-03-01T10:00:00Z'),
      updatedAt: new Date('2024-03-01T10:00:00Z'),
      tags: ['test', 'workshop'],
      imageUrl: 'https://example.com/image.jpg',
    };

    it('should fetch events successfully', async () => {
      const mockQuerySnapshot = {
        docs: [
          {
            id: 'event123',
            data: () => ({
              title: 'Test Event',
              description: 'Test Description',
              date: { toDate: () => new Date('2024-03-15T14:00:00Z') },
              location: 'Test Location',
              maxAttendees: 100,
              currentAttendees: 0,
              organizerId: 'organizer123',
              organizerName: 'Test Organizer',
              status: 'active',
              createdAt: { toDate: () => new Date('2024-03-01T10:00:00Z') },
              updatedAt: { toDate: () => new Date('2024-03-01T10:00:00Z') },
              tags: ['test', 'workshop'],
              imageUrl: 'https://example.com/image.jpg',
            }),
          },
        ],
      };

      mockFirebase.query.mockReturnValue('mockQuery');
      mockFirebase.getDocs.mockResolvedValue(mockQuerySnapshot);

      const result = await eventsApi.getEvents();

      expect(result.events).toHaveLength(1);
      expect(result.events[0].title).toBe('Test Event');
      expect(result.events[0].status).toBe('active');
      expect(mockFirebase.collection).toHaveBeenCalledWith(mockFirebase, 'events');
      expect(mockFirebase.where).toHaveBeenCalledWith('status', '==', 'active');
    });

    it('should handle errors when fetching events', async () => {
      const errorMessage = 'Failed to fetch events';
      mockFirebase.getDocs.mockRejectedValue(new Error(errorMessage));

      await expect(eventsApi.getEvents()).rejects.toThrow(errorMessage);
    });

    it('should fetch single event by ID', async () => {
      const mockDocSnapshot = {
        exists: () => true,
        id: 'event123',
        data: () => ({
          title: 'Test Event',
          description: 'Test Description',
          date: { toDate: () => new Date('2024-03-15T14:00:00Z') },
          location: 'Test Location',
          maxAttendees: 100,
          currentAttendees: 0,
          organizerId: 'organizer123',
          organizerName: 'Test Organizer',
          status: 'active',
          createdAt: { toDate: () => new Date('2024-03-01T10:00:00Z') },
          updatedAt: { toDate: () => new Date('2024-03-01T10:00:00Z') },
          tags: ['test', 'workshop'],
          imageUrl: 'https://example.com/image.jpg',
        }),
      };

      mockFirebase.getDoc.mockResolvedValue(mockDocSnapshot);

      const result = await eventsApi.getEvent('event123');

      expect(result).toBeTruthy();
      expect(result?.title).toBe('Test Event');
      expect(result?.id).toBe('event123');
    });

    it('should return null for non-existent event', async () => {
      const mockDocSnapshot = {
        exists: () => false,
      };

      mockFirebase.getDoc.mockResolvedValue(mockDocSnapshot);

      const result = await eventsApi.getEvent('nonexistent');

      expect(result).toBeNull();
    });

    it('should create event successfully', async () => {
      const newEventData = {
        title: 'New Event',
        description: 'New Description',
        date: new Date('2024-04-15T14:00:00Z'),
        location: 'New Location',
        maxAttendees: 50,
        organizerId: 'organizer123',
        organizerName: 'Test Organizer',
        status: 'active' as const,
        tags: ['new', 'event'],
      };

      const mockDocRef = {
        id: 'new-event-123',
      };

      mockFirebase.addDoc.mockResolvedValue(mockDocRef);

      const result = await eventsApi.createEvent(newEventData);

      expect(result).toBe('new-event-123');
      expect(mockFirebase.addDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          title: 'New Event',
          description: 'New Description',
          maxAttendees: 50,
          currentAttendees: 0,
        })
      );
    });

    it('should handle errors when creating event', async () => {
      const errorMessage = 'Failed to create event';
      mockFirebase.addDoc.mockRejectedValue(new Error(errorMessage));

      const newEventData = {
        title: 'New Event',
        description: 'New Description',
        date: new Date('2024-04-15T14:00:00Z'),
        location: 'New Location',
        maxAttendees: 50,
        organizerId: 'organizer123',
        organizerName: 'Test Organizer',
        status: 'active' as const,
        tags: ['new', 'event'],
      };

      await expect(eventsApi.createEvent(newEventData)).rejects.toThrow(errorMessage);
    });

    it('should update event successfully', async () => {
      const updates = {
        title: 'Updated Event',
        maxAttendees: 75,
      };

      mockFirebase.updateDoc.mockResolvedValue(undefined);

      await eventsApi.updateEvent('event123', updates);

      expect(mockFirebase.updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          title: 'Updated Event',
          maxAttendees: 75,
        })
      );
    });

    it('should delete event successfully', async () => {
      mockFirebase.deleteDoc.mockResolvedValue(undefined);

      await eventsApi.deleteEvent('event123');

      expect(mockFirebase.deleteDoc).toHaveBeenCalled();
    });
  });

  describe('Registrations API', () => {
    const mockRegistration: Registration = {
      id: 'reg123',
      eventId: 'event123',
      userId: 'user123',
      userName: 'John Doe',
      userEmail: 'john@example.com',
      registrationTime: new Date('2024-03-01T10:30:00Z'),
      status: 'confirmed',
      reason: 'Interested in the topic',
      notes: 'VIP guest',
      attendance: true,
    };

    it('should fetch event registrations successfully', async () => {
      const mockQuerySnapshot = {
        docs: [
          {
            id: 'reg123',
            data: () => ({
              eventId: 'event123',
              userId: 'user123',
              userName: 'John Doe',
              userEmail: 'john@example.com',
              registrationTime: { toDate: () => new Date('2024-03-01T10:30:00Z') },
              status: 'confirmed',
              reason: 'Interested in the topic',
              notes: 'VIP guest',
              attendance: true,
            }),
          },
        ],
      };

      mockFirebase.query.mockReturnValue('mockQuery');
      mockFirebase.getDocs.mockResolvedValue(mockQuerySnapshot);

      const result = await registrationsApi.getEventRegistrations('event123');

      expect(result).toHaveLength(1);
      expect(result[0].userName).toBe('John Doe');
      expect(result[0].status).toBe('confirmed');
    });

    it('should fetch user registrations successfully', async () => {
      const mockQuerySnapshot = {
        docs: [
          {
            id: 'reg123',
            data: () => ({
              eventId: 'event123',
              userId: 'user123',
              userName: 'John Doe',
              userEmail: 'john@example.com',
              registrationTime: { toDate: () => new Date('2024-03-01T10:30:00Z') },
              status: 'confirmed',
              reason: 'Interested in the topic',
            }),
          },
        ],
      };

      mockFirebase.query.mockReturnValue('mockQuery');
      mockFirebase.getDocs.mockResolvedValue(mockQuerySnapshot);

      const result = await registrationsApi.getUserRegistrations('user123');

      expect(result).toHaveLength(1);
      expect(result[0].userId).toBe('user123');
    });

    it('should register for event successfully', async () => {
      // Mock existing registrations query (empty result)
      const mockEmptyQuerySnapshot = {
        empty: true,
        docs: [],
      };

      // Mock event document
      const mockEventDoc = {
        exists: true,
        data: () => ({
          currentAttendees: 5,
        }),
      };

      const mockDocRef = {
        id: 'new-reg-123',
      };

      mockFirebase.query.mockReturnValue('mockQuery');
      mockFirebase.getDocs
        .mockResolvedValueOnce(mockEmptyQuerySnapshot) // Check existing registration
        .mockResolvedValueOnce({ docs: [] }); // User registrations

      mockFirebase.getDoc.mockResolvedValue(mockEventDoc);
      mockFirebase.addDoc.mockResolvedValue(mockDocRef);
      mockFirebase.updateDoc.mockResolvedValue(undefined);

      const result = await registrationsApi.registerForEvent(
        'event123',
        'user123',
        'John Doe',
        'john@example.com',
        'Interested in AI'
      );

      expect(result).toBe('new-reg-123');
      expect(mockFirebase.addDoc).toHaveBeenCalled();
      // Attendee count is now incremented upon admin approval, not on initial registration
    });

    it('should prevent duplicate registration', async () => {
      const mockExistingQuerySnapshot = {
        empty: false,
        docs: [
          {
            id: 'existing-reg',
            data: () => ({
              eventId: 'event123',
              userId: 'user123',
            }),
          },
        ],
      };

      mockFirebase.query.mockReturnValue('mockQuery');
      mockFirebase.getDocs.mockResolvedValue(mockExistingQuerySnapshot);

      await expect(
        registrationsApi.registerForEvent(
          'event123',
          'user123',
          'John Doe',
          'john@example.com',
          'Interested in AI'
        )
      ).rejects.toThrow('Already registered for this event');
    });

    it('should cancel registration successfully', async () => {
      // Mock event document
      const mockEventDoc = {
        exists: true,
        data: () => ({
          currentAttendees: 10,
        }),
      };

      mockFirebase.getDoc.mockResolvedValue(mockEventDoc);
      mockFirebase.updateDoc.mockResolvedValue(undefined);

      await registrationsApi.cancelRegistration('reg123', 'event123');

      expect(mockFirebase.updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          status: 'cancelled',
        })
      );
    });

    it('should handle errors when cancelling registration', async () => {
      const errorMessage = 'Failed to cancel registration';
      mockFirebase.updateDoc.mockRejectedValue(new Error(errorMessage));

      await expect(
        registrationsApi.cancelRegistration('reg123', 'event123')
      ).rejects.toThrow(errorMessage);
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      mockFirebase.getDocs.mockRejectedValue(new Error('Network error'));

      await expect(eventsApi.getEvents()).rejects.toThrow('Network error');
    });

    it('should handle permission errors', async () => {
      mockFirebase.getDocs.mockRejectedValue(new Error('Permission denied'));

      await expect(eventsApi.getEvents()).rejects.toThrow('Permission denied');
    });

    it('should handle invalid data formats', async () => {
      const mockQuerySnapshot = {
        docs: [
          {
            id: 'event123',
            data: () => ({
              // Missing required fields
              title: 'Test Event',
              // No description, date, etc.
            }),
          },
        ],
      };

      mockFirebase.query.mockReturnValue('mockQuery');
      mockFirebase.getDocs.mockResolvedValue(mockQuerySnapshot);

      const result = await eventsApi.getEvents();

      // Should handle missing fields gracefully
      expect(result.events).toHaveLength(1);
      expect(result.events[0].title).toBe('Test Event');
    });
  });
});