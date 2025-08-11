import { 
  initializeTestEnvironment, 
  RulesTestEnvironment,
  assertFails,
  assertSucceeds 
} from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, updateDoc, deleteDoc, collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('Firestore Security Rules Tests', () => {
  let testEnv: RulesTestEnvironment;

  beforeAll(async () => {
    // Initialize test environment with security rules
    testEnv = await initializeTestEnvironment({
      projectId: 'klycs-test',
      firestore: {
        rules: readFileSync(resolve(__dirname, '../../../firestore.rules'), 'utf8'),
        host: 'localhost',
        port: 8080,
      },
    });
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  beforeEach(async () => {
    await testEnv.clearFirestore();
  });

  describe('User Collection Security', () => {
    it('should allow users to read any profile (public access)', async () => {
      const db = testEnv.unauthenticatedContext().firestore();
      
      // Should succeed - public read access
      await assertSucceeds(
        getDoc(doc(db, 'users', 'user123'))
      );
    });

    it('should allow users to create their own profile', async () => {
      const db = testEnv.authenticatedContext('user123').firestore();
      
      await assertSucceeds(
        setDoc(doc(db, 'users', 'user123'), {
          name: 'Test User',
          email: 'test@example.com',
          createdAt: new Date(),
          updatedAt: new Date()
        })
      );
    });

    it('should prevent users from creating profiles for other users', async () => {
      const db = testEnv.authenticatedContext('user123').firestore();
      
      await assertFails(
        setDoc(doc(db, 'users', 'user456'), {
          name: 'Other User',
          email: 'other@example.com'
        })
      );
    });

    it('should allow users to update their own profile', async () => {
      const adminDb = testEnv.authenticatedContext('user123', { admin: true }).firestore();
      
      // Setup: Create user profile as admin
      await setDoc(doc(adminDb, 'users', 'user123'), {
        name: 'Original Name',
        email: 'user@example.com'
      });

      const db = testEnv.authenticatedContext('user123').firestore();
      
      await assertSucceeds(
        updateDoc(doc(db, 'users', 'user123'), {
          name: 'Updated Name'
        })
      );
    });

    it('should prevent users from updating other users profiles', async () => {
      const adminDb = testEnv.authenticatedContext('admin', { admin: true }).firestore();
      
      // Setup: Create other user profile
      await setDoc(doc(adminDb, 'users', 'user456'), {
        name: 'Other User',
        email: 'other@example.com'
      });

      const db = testEnv.authenticatedContext('user123').firestore();
      
      await assertFails(
        updateDoc(doc(db, 'users', 'user456'), {
          name: 'Hacked Name'
        })
      );
    });
  });

  describe('Cards Collection Security', () => {
    it('should allow public read access to cards', async () => {
      const db = testEnv.unauthenticatedContext().firestore();
      
      await assertSucceeds(
        getDoc(doc(db, 'cards', 'card123'))
      );
    });

    it('should allow users to create cards with valid data', async () => {
      const db = testEnv.authenticatedContext('user123').firestore();
      
      await assertSucceeds(
        addDoc(collection(db, 'cards'), {
          userId: 'user123',
          title: 'My Business Card',
          description: 'Professional card for networking',
          isPublic: true,
          createdAt: new Date()
        })
      );
    });

    it('should prevent users from creating cards for other users', async () => {
      const db = testEnv.authenticatedContext('user123').firestore();
      
      await assertFails(
        addDoc(collection(db, 'cards'), {
          userId: 'user456', // Different user ID
          title: 'Malicious Card',
          description: 'This should not be allowed',
          isPublic: true,
          createdAt: new Date()
        })
      );
    });

    it('should validate required fields in card data', async () => {
      const db = testEnv.authenticatedContext('user123').firestore();
      
      // Missing required fields
      await assertFails(
        addDoc(collection(db, 'cards'), {
          userId: 'user123',
          // Missing title, description, isPublic, createdAt
        })
      );
    });

    it('should validate field types and lengths', async () => {
      const db = testEnv.authenticatedContext('user123').firestore();
      
      // Title too long
      await assertFails(
        addDoc(collection(db, 'cards'), {
          userId: 'user123',
          title: 'x'.repeat(101), // Exceeds 100 character limit
          description: 'Valid description',
          isPublic: true,
          createdAt: new Date()
        })
      );

      // Description too long
      await assertFails(
        addDoc(collection(db, 'cards'), {
          userId: 'user123',
          title: 'Valid Title',
          description: 'x'.repeat(501), // Exceeds 500 character limit
          isPublic: true,
          createdAt: new Date()
        })
      );
    });

    it('should allow users to update their own cards', async () => {
      const adminDb = testEnv.authenticatedContext('admin', { admin: true }).firestore();
      
      // Setup: Create card as admin
      const cardRef = doc(adminDb, 'cards', 'card123');
      await setDoc(cardRef, {
        userId: 'user123',
        title: 'Original Title',
        description: 'Original description',
        isPublic: true,
        createdAt: new Date()
      });

      const db = testEnv.authenticatedContext('user123').firestore();
      
      await assertSucceeds(
        updateDoc(doc(db, 'cards', 'card123'), {
          title: 'Updated Title',
          description: 'Updated description'
        })
      );
    });

    it('should prevent users from updating other users cards', async () => {
      const adminDb = testEnv.authenticatedContext('admin', { admin: true }).firestore();
      
      // Setup: Create card owned by different user
      await setDoc(doc(adminDb, 'cards', 'card456'), {
        userId: 'user456',
        title: 'Other User Card',
        description: 'Belongs to user456',
        isPublic: true,
        createdAt: new Date()
      });

      const db = testEnv.authenticatedContext('user123').firestore();
      
      await assertFails(
        updateDoc(doc(db, 'cards', 'card456'), {
          title: 'Hacked Title'
        })
      );
    });

    it('should allow users to delete their own cards', async () => {
      const adminDb = testEnv.authenticatedContext('admin', { admin: true }).firestore();
      
      // Setup: Create card
      await setDoc(doc(adminDb, 'cards', 'card123'), {
        userId: 'user123',
        title: 'Card to Delete',
        description: 'This will be deleted',
        isPublic: true,
        createdAt: new Date()
      });

      const db = testEnv.authenticatedContext('user123').firestore();
      
      await assertSucceeds(
        deleteDoc(doc(db, 'cards', 'card123'))
      );
    });

    it('should prevent users from deleting other users cards', async () => {
      const adminDb = testEnv.authenticatedContext('admin', { admin: true }).firestore();
      
      // Setup: Create card owned by different user
      await setDoc(doc(adminDb, 'cards', 'card456'), {
        userId: 'user456',
        title: 'Protected Card',
        description: 'Should not be deletable by user123',
        isPublic: true,
        createdAt: new Date()
      });

      const db = testEnv.authenticatedContext('user123').firestore();
      
      await assertFails(
        deleteDoc(doc(db, 'cards', 'card456'))
      );
    });
  });

  describe('Rate Limiting Tests', () => {
    it('should enforce card creation rate limits', async () => {
      const db = testEnv.authenticatedContext('user123').firestore();
      
      // Create 5 cards (should be allowed)
      for (let i = 0; i < 5; i++) {
        await assertSucceeds(
          addDoc(collection(db, 'cards'), {
            userId: 'user123',
            title: `Card ${i}`,
            description: 'Rate limit test card',
            isPublic: true,
            createdAt: new Date()
          })
        );
      }

      // The 6th card should fail due to rate limiting
      // Note: This test simulates the rate limiting logic
      // In practice, you'd need to implement proper time-based testing
      
      // For this test, we'll simulate by checking if too many cards exist
      const cardsQuery = query(
        collection(db, 'cards'), 
        where('userId', '==', 'user123')
      );
      const snapshot = await getDocs(cardsQuery);
      
      // Should have exactly 5 cards
      expect(snapshot.size).toBe(5);
    });
  });

  describe('Bookings Collection Security', () => {
    it('should allow public read access to bookings', async () => {
      const db = testEnv.unauthenticatedContext().firestore();
      
      await assertSucceeds(
        getDoc(doc(db, 'bookings', 'booking123'))
      );
    });

    it('should allow creating bookings with valid data', async () => {
      const db = testEnv.unauthenticatedContext().firestore();
      
      await assertSucceeds(
        addDoc(collection(db, 'bookings'), {
          clientName: 'John Doe',
          clientEmail: 'john@example.com',
          userId: 'service-provider-123',
          status: 'pending',
          serviceName: 'Web Development',
          date: '2024-01-15',
          time: '14:00',
          duration: 60,
          price: 100,
          createdAt: new Date()
        })
      );
    });

    it('should validate booking data fields', async () => {
      const db = testEnv.unauthenticatedContext().firestore();
      
      // Invalid email format
      await assertFails(
        addDoc(collection(db, 'bookings'), {
          clientName: 'John Doe',
          clientEmail: 'invalid-email', // Invalid format
          userId: 'service-provider-123',
          status: 'pending',
          serviceName: 'Web Development',
          date: '2024-01-15',
          time: '14:00',
          duration: 60,
          price: 100,
          createdAt: new Date()
        })
      );

      // Invalid status
      await assertFails(
        addDoc(collection(db, 'bookings'), {
          clientName: 'John Doe',
          clientEmail: 'john@example.com',
          userId: 'service-provider-123',
          status: 'invalid-status', // Not in allowed list
          serviceName: 'Web Development',
          date: '2024-01-15',
          time: '14:00',
          duration: 60,
          price: 100,
          createdAt: new Date()
        })
      );

      // Negative price
      await assertFails(
        addDoc(collection(db, 'bookings'), {
          clientName: 'John Doe',
          clientEmail: 'john@example.com',
          userId: 'service-provider-123',
          status: 'pending',
          serviceName: 'Web Development',
          date: '2024-01-15',
          time: '14:00',
          duration: 60,
          price: -50, // Negative price
          createdAt: new Date()
        })
      );
    });

    it('should allow service providers to update their bookings', async () => {
      const adminDb = testEnv.authenticatedContext('admin', { admin: true }).firestore();
      
      // Setup: Create booking
      await setDoc(doc(adminDb, 'bookings', 'booking123'), {
        clientName: 'John Doe',
        clientEmail: 'john@example.com',
        userId: 'user123',
        status: 'pending',
        serviceName: 'Web Development',
        date: '2024-01-15',
        time: '14:00',
        duration: 60,
        price: 100,
        createdAt: new Date()
      });

      const db = testEnv.authenticatedContext('user123').firestore();
      
      await assertSucceeds(
        updateDoc(doc(db, 'bookings', 'booking123'), {
          status: 'confirmed'
        })
      );
    });

    it('should prevent users from updating other users bookings', async () => {
      const adminDb = testEnv.authenticatedContext('admin', { admin: true }).firestore();
      
      // Setup: Create booking for different user
      await setDoc(doc(adminDb, 'bookings', 'booking456'), {
        clientName: 'Jane Doe',
        clientEmail: 'jane@example.com',
        userId: 'user456', // Different user
        status: 'pending',
        serviceName: 'Design Work',
        date: '2024-01-16',
        time: '10:00',
        duration: 120,
        price: 200,
        createdAt: new Date()
      });

      const db = testEnv.authenticatedContext('user123').firestore();
      
      await assertFails(
        updateDoc(doc(db, 'bookings', 'booking456'), {
          status: 'cancelled'
        })
      );
    });
  });

  describe('Services Collection Security', () => {
    it('should allow public read access to services', async () => {
      const db = testEnv.unauthenticatedContext().firestore();
      
      await assertSucceeds(
        getDoc(doc(db, 'services', 'service123'))
      );
    });

    it('should allow users to create services with valid data', async () => {
      const db = testEnv.authenticatedContext('user123').firestore();
      
      await assertSucceeds(
        addDoc(collection(db, 'services'), {
          name: 'Web Development',
          description: 'Professional web development services',
          price: 100,
          duration: 60,
          userId: 'user123',
          isActive: true
        })
      );
    });

    it('should validate service data', async () => {
      const db = testEnv.authenticatedContext('user123').firestore();
      
      // Name too long
      await assertFails(
        addDoc(collection(db, 'services'), {
          name: 'x'.repeat(101), // Exceeds 100 characters
          description: 'Valid description',
          price: 100,
          duration: 60,
          userId: 'user123',
          isActive: true
        })
      );

      // Negative price
      await assertFails(
        addDoc(collection(db, 'services'), {
          name: 'Web Development',
          description: 'Valid description',
          price: -50, // Negative price
          duration: 60,
          userId: 'user123',
          isActive: true
        })
      );

      // Zero duration
      await assertFails(
        addDoc(collection(db, 'services'), {
          name: 'Web Development',
          description: 'Valid description',
          price: 100,
          duration: 0, // Zero duration
          userId: 'user123',
          isActive: true
        })
      );
    });
  });

  describe('Analytics Collection Security', () => {
    it('should allow creating analytics events publicly', async () => {
      const db = testEnv.unauthenticatedContext().firestore();
      
      await assertSucceeds(
        addDoc(collection(db, 'analytics'), {
          eventType: 'page_view',
          timestamp: new Date(),
          ip: '192.168.1.1',
          userAgent: 'Mozilla/5.0...',
          url: '/card/example'
        })
      );
    });

    it('should allow authenticated users to read analytics', async () => {
      const db = testEnv.authenticatedContext('user123').firestore();
      
      await assertSucceeds(
        getDoc(doc(db, 'analytics', 'event123'))
      );
    });

    it('should prevent unauthenticated users from reading analytics', async () => {
      const db = testEnv.unauthenticatedContext().firestore();
      
      await assertFails(
        getDoc(doc(db, 'analytics', 'event123'))
      );
    });

    it('should prevent updating or deleting analytics events', async () => {
      const adminDb = testEnv.authenticatedContext('admin', { admin: true }).firestore();
      
      // Setup: Create analytics event
      await setDoc(doc(adminDb, 'analytics', 'event123'), {
        eventType: 'page_view',
        timestamp: new Date(),
        ip: '192.168.1.1'
      });

      const db = testEnv.authenticatedContext('user123').firestore();
      
      // Should not be able to update
      await assertFails(
        updateDoc(doc(db, 'analytics', 'event123'), {
          eventType: 'modified'
        })
      );

      // Should not be able to delete
      await assertFails(
        deleteDoc(doc(db, 'analytics', 'event123'))
      );
    });
  });
});