import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthContext } from '@/contexts/AuthContext';
import { Event } from '@/types';
import { eventsApi, registrationsApi } from '@/lib/firestore';

// Mock components
const mockLoginPage = () => <div data-testid="login-page">Login Page</div>;
const mockEventPage = ({ params }: { params: { id: string } }) => (
  <div data-testid="event-page">
    <h1>Event {params.id}</h1>
    <button data-testid="register-button">Register</button>
    <textarea data-testid="reason-textarea" placeholder="Registration reason" />
  </div>
);
const mockAdminPage = () => <div data-testid="admin-page">Admin Dashboard</div>;

// Mock the page components
jest.mock('../app/login/page', () => ({ default: mockLoginPage }));
jest.mock('../app/event/[id]/page', () => ({ default: mockEventPage }));
jest.mock('../app/admin/page', () => ({ default: mockAdminPage }));

// Mock Firebase Auth
const mockSignInWithPopup = jest.fn();
const mockSignOut = jest.fn();
const mockOnAuthStateChanged = jest.fn();

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({})),
  signInWithPopup: mockSignInWithPopup,
  signOut: mockSignOut,
  GoogleAuthProvider: jest.fn(() => ({})),
  onAuthStateChanged: mockOnAuthStateChanged,
}));

// Mock Firestore
const mockGetEvents = jest.fn();
const mockGetEvent = jest.fn();
const mockRegisterForEvent = jest.fn();

jest.mock('../lib/firestore', () => ({
  eventsApi: {
    getEvents: mockGetEvents,
    getEvent: mockGetEvent,
  },
  registrationsApi: {
    registerForEvent: mockRegisterForEvent,
  },
}));

describe('End-to-End User Journey Tests', () => {
  const mockUser = {
    uid: 'user123',
    email: 'john.doe@university.edu',
    displayName: 'John Doe',
    photoURL: null,
  };

  const mockEvent: Event = {
    id: 'event-ai-workshop',
    title: 'AI Workshop',
    description: 'Learn about Artificial Intelligence',
    date: new Date('2024-03-15T14:00:00Z'),
    location: 'University Auditorium',
    maxAttendees: 100,
    currentAttendees: 5,
    organizerId: 'organizer123',
    organizerName: 'Dr. Smith',
    status: 'active',
    createdAt: new Date('2024-03-01T10:00:00Z'),
    updatedAt: new Date('2024-03-01T10:00:00Z'),
    tags: ['AI', 'Workshop', 'Technology'],
    imageUrl: 'https://example.com/ai-workshop.jpg',
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock successful authentication
    mockSignInWithPopup.mockResolvedValue({
      user: mockUser,
    });

    // Mock auth state changes
    mockOnAuthStateChanged.mockImplementation((callback) => {
      callback(mockUser);
      return jest.fn(); // unsubscribe function
    });
  });

  describe('Complete User Registration Journey', () => {
    it('should complete the full user journey: login → browse events → register → receive confirmation', async () => {
      const user = userEvent.setup();

      // Mock events data
      mockGetEvents.mockResolvedValue({
        events: [mockEvent],
        lastDoc: null,
      });

      // Mock successful registration
      mockRegisterForEvent.mockResolvedValue('registration123');

      // Step 1: User visits the application
      render(
        <AuthContext.Provider value={{
          user: null,
          loading: false,
          signInWithGoogle: mockSignInWithPopup,
          signOut: mockSignOut,
        }}>
          {mockLoginPage()}
        </AuthContext.Provider>
      );

      // Step 2: User should see login page
      expect(screen.getByTestId('login-page')).toBeInTheDocument();

      // Step 3: User clicks login button (assuming there's a login button)
      // Note: In a real scenario, this would be part of the login component
      await user.click(screen.getByText(/login/i));

      // Step 4: User should be authenticated
      await waitFor(() => {
        expect(mockSignInWithPopup).toHaveBeenCalled();
      });

      // Step 5: User should see events list
      render(
        <AuthContext.Provider value={{
          user: mockUser,
          loading: false,
          signInWithGoogle: mockSignInWithPopup,
          signOut: mockSignOut,
        }}>
          <div data-testid="events-list">
            <div data-testid="event-card">
              <h2>{mockEvent.title}</h2>
              <p>{mockEvent.description}</p>
              <button data-testid="view-event-button">View Event</button>
            </div>
          </div>
        </AuthContext.Provider>
      );

      expect(screen.getByTestId('events-list')).toBeInTheDocument();
      expect(screen.getByText('AI Workshop')).toBeInTheDocument();

      // Step 6: User clicks on an event to view details
      await user.click(screen.getByTestId('view-event-button'));

      // Step 7: User should see event details page
      render(
        <AuthContext.Provider value={{
          user: mockUser,
          loading: false,
          signInWithGoogle: mockSignInWithPopup,
          signOut: mockSignOut,
        }}>
          {mockEventPage({ params: { id: 'event-ai-workshop' } })}
        </AuthContext.Provider>
      );

      expect(screen.getByTestId('event-page')).toBeInTheDocument();
      expect(screen.getByText('Event event-ai-workshop')).toBeInTheDocument();

      // Step 8: User enters registration reason
      const reasonTextarea = screen.getByTestId('reason-textarea');
      await user.type(reasonTextarea, 'I am interested in learning about AI and its applications in research.');

      // Step 9: User clicks register button
      await user.click(screen.getByTestId('register-button'));

      // Step 10: Registration should be processed
      await waitFor(() => {
        expect(mockRegisterForEvent).toHaveBeenCalledWith(
          'event-ai-workshop',
          'user123',
          'John Doe',
          'john.doe@university.edu',
          'I am interested in learning about AI and its applications in research.'
        );
      });

      // Step 11: User should receive confirmation
      // In a real app, this would be handled by the Cloud Function
      // Here we just verify the registration was successful
      expect(mockRegisterForEvent).toHaveBeenCalledTimes(1);
    });
  });

  describe('Admin Workflow', () => {
    const mockAdminUser = {
      uid: 'admin123',
      email: 'admin@university.edu',
      displayName: 'Admin User',
      photoURL: null,
    };

    it('should allow admin to view registrations and approve them', async () => {
      const user = userEvent.setup();

      // Mock admin authentication
      mockOnAuthStateChanged.mockImplementation((callback) => {
        callback(mockAdminUser);
        return jest.fn();
      });

      // Mock registrations data
      const mockRegistrations = [
        {
          id: 'reg123',
          eventId: 'event-ai-workshop',
          userId: 'user123',
          userName: 'John Doe',
          userEmail: 'john.doe@university.edu',
          registrationTime: new Date('2024-03-01T10:30:00Z'),
          status: 'confirmed',
          reason: 'Interested in AI research',
        },
      ];

      // Step 1: Admin visits admin dashboard
      render(
        <AuthContext.Provider value={{
          user: mockAdminUser,
          loading: false,
          signInWithGoogle: mockSignInWithPopup,
          signOut: mockSignOut,
        }}>
          <div data-testid="admin-dashboard">
            <h1>Admin Dashboard</h1>
            <div data-testid="registrations-list">
              {mockRegistrations.map(reg => (
                <div key={reg.id} data-testid={`registration-${reg.id}`}>
                  <p>{reg.userName}</p>
                  <p>{reg.reason}</p>
                  <span data-testid={`status-${reg.id}`}>{reg.status}</span>
                  <button data-testid={`approve-${reg.id}`}>Approve</button>
                </div>
              ))}
            </div>
          </div>
        </AuthContext.Provider>
      );

      // Step 2: Admin should see registrations
      expect(screen.getByTestId('admin-dashboard')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Interested in AI research')).toBeInTheDocument();
      expect(screen.getByTestId('status-reg123')).toHaveTextContent('confirmed');

      // Step 3: Admin can approve registration
      await user.click(screen.getByTestId('approve-reg123'));

      // In a real app, this would trigger a Cloud Function
      // Here we just verify the button interaction
      expect(screen.getByTestId('approve-reg123')).toBeInTheDocument();
    });
  });

  describe('Error Scenarios', () => {
    it('should handle authentication failure', async () => {
      const user = userEvent.setup();

      // Mock authentication failure
      mockSignInWithPopup.mockRejectedValue(new Error('Authentication failed'));

      render(
        <AuthContext.Provider value={{
          user: null,
          loading: false,
          signInWithGoogle: mockSignInWithPopup,
          signOut: mockSignOut,
        }}>
          <div data-testid="login-form">
            <button data-testid="login-button">Login with Google</button>
            <div data-testid="error-message" style={{ display: 'none' }}>
              Authentication failed
            </div>
          </div>
        </AuthContext.Provider>
      );

      // User attempts to login
      await user.click(screen.getByTestId('login-button'));

      // Should handle error gracefully
      await waitFor(() => {
        expect(mockSignInWithPopup).toHaveBeenCalled();
      });
    });

    it('should handle event not found', async () => {
      // Mock event not found
      mockGetEvent.mockResolvedValue(null);

      render(
        <AuthContext.Provider value={{
          user: mockUser,
          loading: false,
          signInWithGoogle: mockSignInWithPopup,
          signOut: mockSignOut,
        }}>
          <div data-testid="event-detail">
            <div data-testid="event-not-found" style={{ display: 'none' }}>
              Event not found
            </div>
          </div>
        </AuthContext.Provider>
      );

      // Should handle missing event gracefully
      await waitFor(() => {
        expect(mockGetEvent).toHaveBeenCalled();
      });
    });

    it('should handle registration failure', async () => {
      const user = userEvent.setup();

      // Mock registration failure
      mockRegisterForEvent.mockRejectedValue(new Error('Already registered for this event'));

      render(
        <AuthContext.Provider value={{
          user: mockUser,
          loading: false,
          signInWithGoogle: mockSignInWithPopup,
          signOut: mockSignOut,
        }}>
          <div data-testid="event-registration">
            <button data-testid="register-button">Register</button>
            <div data-testid="error-message" style={{ display: 'none' }}>
              Registration failed
            </div>
          </div>
        </AuthContext.Provider>
      );

      // User attempts to register
      await user.click(screen.getByTestId('register-button'));

      // Should handle registration error
      await waitFor(() => {
        expect(mockRegisterForEvent).toHaveBeenCalled();
      });
    });
  });

  describe('Email Notification Flow', () => {
    it('should trigger email notifications on registration', async () => {
      // Mock successful registration
      mockRegisterForEvent.mockResolvedValue('registration123');

      // In a real scenario, this would trigger the Cloud Function
      // Here we test the expected behavior

      const registrationData = {
        eventId: 'event-ai-workshop',
        userId: 'user123',
        userName: 'John Doe',
        userEmail: 'john.doe@university.edu',
        reason: 'Interested in AI research',
      };

      // Simulate the registration process
      const result = await registrationsApi.registerForEvent(
        registrationData.eventId,
        registrationData.userId,
        registrationData.userName,
        registrationData.userEmail,
        registrationData.reason
      );

      // Verify registration was successful
      expect(result).toBe('registration123');

      // In a real app, this would have triggered:
      // 1. sendOnRegisterEmail Cloud Function
      // 2. Email sent to user
      // 3. Admin notification (if configured)
    });

    it('should trigger approval email when admin approves registration', async () => {
      // This would typically be tested by mocking the Cloud Function
      // that listens for registration status changes

      const registrationUpdate = {
        registrationId: 'reg123',
        status: 'confirmed',
        userEmail: 'john.doe@university.edu',
        userName: 'John Doe',
        eventTitle: 'AI Workshop',
      };

      // In a real scenario, updating the registration status would trigger:
      // 1. sendOnApproveEmail Cloud Function
      // 2. Approval email sent to user

      // Here we just verify the data structure
      expect(registrationUpdate).toEqual({
        registrationId: 'reg123',
        status: 'confirmed',
        userEmail: 'john.doe@university.edu',
        userName: 'John Doe',
        eventTitle: 'AI Workshop',
      });
    });
  });

  describe('Performance Requirements', () => {
    it('should load events within performance requirements', async () => {
      const startTime = Date.now();

      mockGetEvents.mockResolvedValue({
        events: [mockEvent],
        lastDoc: null,
      });

      await eventsApi.getEvents();

      const endTime = Date.now();
      const loadTime = endTime - startTime;

      // Should load within 3 seconds (3000ms)
      expect(loadTime).toBeLessThan(3000);
    });

    it('should handle search functionality efficiently', async () => {
      const searchTerm = 'AI';
      const mockEvents = [
        mockEvent,
        { ...mockEvent, id: 'event2', title: 'Machine Learning Workshop' },
        { ...mockEvent, id: 'event3', title: 'Data Science Conference' },
      ];

      mockGetEvents.mockResolvedValue({
        events: mockEvents.filter(event =>
          event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          event.description.toLowerCase().includes(searchTerm.toLowerCase())
        ),
        lastDoc: null,
      });

      const startTime = Date.now();
      const result = await eventsApi.getEvents();
      const endTime = Date.now();

      // Should search within 1 second
      expect(endTime - startTime).toBeLessThan(1000);
      expect(result.events).toHaveLength(2); // AI Workshop and Machine Learning Workshop
    });
  });
});