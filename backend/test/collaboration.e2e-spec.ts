import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { io, Socket } from 'socket.io-client';
import { TestAppModule } from './test-app.module';
import { TestHelper, cleanDatabase } from './test-utils';

describe('Collaboration (e2e)', () => {
  let app: INestApplication;
  let helper: TestHelper;
  let client1: Socket;
  let client2: Socket;
  let client3: Socket;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [TestAppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.listen(0);
    
    const address = app.getHttpServer().address();
    const baseUrl = `http://localhost:${address.port}`;
    
    helper = new TestHelper(app, baseUrl);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await cleanDatabase(app);
  });

  afterEach(() => {
    if (client1?.connected) client1.disconnect();
    if (client2?.connected) client2.disconnect();
    if (client3?.connected) client3.disconnect();
  });

  function createSocketClient(token: string): Socket {
    const address = app.getHttpServer().address();
    return io(`http://localhost:${address.port}/collaboration`, {
      auth: { token },
      transports: ['websocket'],
      forceNew: true,
      reconnection: false,
    });
  }

  async function connectClient(token: string): Promise<Socket> {
    const client = createSocketClient(token);
    await waitForEvent(client, 'connect');
    return client;
  }

  function waitForEvent(socket: Socket, event: string, timeout = 5000): Promise<any> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Timeout waiting for event: ${event}`));
      }, timeout);

      socket.once(event, (data) => {
        clearTimeout(timer);
        resolve(data);
      });
    });
  }

  describe('Connection and Authentication', () => {
    it('should connect with valid JWT token', async () => {
      const user = await helper.registerUser('user@example.com', 'Password123!', 'Test User');
      
      client1 = createSocketClient(user.token);
      
      await new Promise<void>((resolve, reject) => {
        client1.on('connect', () => resolve());
        client1.on('connect_error', (err) => reject(err));
        setTimeout(() => reject(new Error('Connection timeout')), 5000);
      });

      expect(client1.connected).toBe(true);
    });

    it('should reject join-diagram without valid token', async () => {
      const user = await helper.registerUser('user@example.com', 'Password123!', 'Test User');
      const diagram = await helper.createDiagram(user.token, 'Test Diagram');
      
      client1 = createSocketClient('');
      await waitForEvent(client1, 'connect');

      const errorPromise = waitForEvent(client1, 'exception');

      client1.emit('join-diagram', {
        diagramId: diagram.id,
        user: { id: user.id, name: user.name },
      });

      const error = await errorPromise;
      expect(error.message).toContain('Unauthorized');
    });

    it('should reject join-diagram with invalid token', async () => {
      const user = await helper.registerUser('user@example.com', 'Password123!', 'Test User');
      const diagram = await helper.createDiagram(user.token, 'Test Diagram');
      
      client1 = createSocketClient('invalid-token-123');
      await waitForEvent(client1, 'connect');

      const errorPromise = waitForEvent(client1, 'exception');

      client1.emit('join-diagram', {
        diagramId: diagram.id,
        user: { id: user.id, name: user.name },
      });

      const error = await errorPromise;
      expect(error.message).toContain('Unauthorized');
    });
  });

  describe('Room Management', () => {
    it('should allow user to join a diagram room', async () => {
      const user = await helper.registerUser('user@example.com', 'Password123!', 'Test User');
      const diagram = await helper.createDiagram(user.token, 'Test Diagram');
      
      client1 = createSocketClient(user.token);
      await waitForEvent(client1, 'connect');

      const joinPromise = waitForEvent(client1, 'room-joined');
      
      client1.emit('join-diagram', {
        diagramId: diagram.id,
        user: { id: user.id, name: user.name },
      });

      const response = await joinPromise;

      expect(response.diagramId).toBe(diagram.id);
      expect(response.activeUsers).toEqual([]);
      expect(response.yourColor).toBeDefined();
      expect(response.yourColor).toMatch(/^#[0-9A-F]{6}$/i);
    });

    it('should notify other users when someone joins', async () => {
      const user1 = await helper.registerUser('user1@example.com', 'Password123!', 'User 1');
      const user2 = await helper.registerUser('user2@example.com', 'Password123!', 'User 2');
      const diagram = await helper.createDiagram(user1.token, 'Test Diagram');
      
      client1 = await connectClient(user1.token);
      client2 = await connectClient(user2.token);

      client1.emit('join-diagram', {
        diagramId: diagram.id,
        user: { id: user1.id, name: user1.name },
      });
      await waitForEvent(client1, 'room-joined');

      const userJoinedPromise = waitForEvent(client1, 'user-joined');

      client2.emit('join-diagram', {
        diagramId: diagram.id,
        user: { id: user2.id, name: user2.name },
      });

      const joinNotification = await userJoinedPromise;

      expect(joinNotification.userId).toBe(user2.id);
      expect(joinNotification.userName).toBe('User 2');
      expect(joinNotification.socketId).toBeDefined();
      expect(joinNotification.color).toBeDefined();
    });

    it('should show active users when joining a room with existing users', async () => {
      const user1 = await helper.registerUser('user1@example.com', 'Password123!', 'User 1');
      const user2 = await helper.registerUser('user2@example.com', 'Password123!', 'User 2');
      const diagram = await helper.createDiagram(user1.token, 'Test Diagram');
      
      client1 = await connectClient(user1.token);
      client2 = await connectClient(user2.token);

      client1.emit('join-diagram', {
        diagramId: diagram.id,
        user: { id: user1.id, name: user1.name },
      });
      await waitForEvent(client1, 'room-joined');

      client2.emit('join-diagram', {
        diagramId: diagram.id,
        user: { id: user2.id, name: user2.name },
      });
      const response = await waitForEvent(client2, 'room-joined');

      expect(response.activeUsers).toHaveLength(1);
      expect(response.activeUsers[0].userId).toBe(user1.id);
      expect(response.activeUsers[0].userName).toBe('User 1');
    });

    it('should allow user to leave a diagram room', async () => {
      const user = await helper.registerUser('user@example.com', 'Password123!', 'Test User');
      const diagram = await helper.createDiagram(user.token, 'Test Diagram');
      
      client1 = createSocketClient(user.token);
      await waitForEvent(client1, 'connect');

      client1.emit('join-diagram', {
        diagramId: diagram.id,
        user: { id: user.id, name: user.name },
      });
      await waitForEvent(client1, 'room-joined');

      client1.emit('leave-diagram', { diagramId: diagram.id });

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(client1.connected).toBe(true);
    });

    it('should notify other users when someone leaves', async () => {
      const user1 = await helper.registerUser('user1@example.com', 'Password123!', 'User 1');
      const user2 = await helper.registerUser('user2@example.com', 'Password123!', 'User 2');
      const diagram = await helper.createDiagram(user1.token, 'Test Diagram');
      
      client1 = await connectClient(user1.token);
      client2 = await connectClient(user2.token);

      client1.emit('join-diagram', {
        diagramId: diagram.id,
        user: { id: user1.id, name: user1.name },
      });
      await waitForEvent(client1, 'room-joined');

      client2.emit('join-diagram', {
        diagramId: diagram.id,
        user: { id: user2.id, name: user2.name },
      });
      await waitForEvent(client2, 'room-joined');

      const userLeftPromise = waitForEvent(client2, 'user-left');

      client1.emit('leave-diagram', { diagramId: diagram.id });

      const leftNotification = await userLeftPromise;
      expect(leftNotification.socketId).toBeDefined();
    });

    it('should handle user disconnection gracefully', async () => {
      const user1 = await helper.registerUser('user1@example.com', 'Password123!', 'User 1');
      const user2 = await helper.registerUser('user2@example.com', 'Password123!', 'User 2');
      const diagram = await helper.createDiagram(user1.token, 'Test Diagram');
      
      client1 = await connectClient(user1.token);
      client2 = await connectClient(user2.token);

      client1.emit('join-diagram', {
        diagramId: diagram.id,
        user: { id: user1.id, name: user1.name },
      });
      await waitForEvent(client1, 'room-joined');

      client2.emit('join-diagram', {
        diagramId: diagram.id,
        user: { id: user2.id, name: user2.name },
      });
      await waitForEvent(client2, 'room-joined');

      // Disconnect client1
      client1.disconnect();

      // Wait a bit for disconnect to be processed
      await new Promise(resolve => setTimeout(resolve, 200));

      // Client2 should still be connected and functional
      expect(client2.connected).toBe(true);
      
      // Client2 should be able to send messages
      client2.emit('cursor-move', {
        diagramId: diagram.id,
        cursor: { x: 50, y: 50 },
      });

      await new Promise(resolve => setTimeout(resolve, 100));
      expect(client2.connected).toBe(true);
    });
  });

  describe('Cursor Tracking', () => {
    it('should broadcast cursor position to other users', async () => {
      const user1 = await helper.registerUser('user1@example.com', 'Password123!', 'User 1');
      const user2 = await helper.registerUser('user2@example.com', 'Password123!', 'User 2');
      const diagram = await helper.createDiagram(user1.token, 'Test Diagram');
      
      client1 = await connectClient(user1.token);
      client2 = await connectClient(user2.token);

      client1.emit('join-diagram', {
        diagramId: diagram.id,
        user: { id: user1.id, name: user1.name },
      });
      await waitForEvent(client1, 'room-joined');

      client2.emit('join-diagram', {
        diagramId: diagram.id,
        user: { id: user2.id, name: user2.name },
      });
      await waitForEvent(client2, 'room-joined');

      const cursorUpdatePromise = waitForEvent(client2, 'cursor-update');

      client1.emit('cursor-move', {
        diagramId: diagram.id,
        cursor: { x: 100, y: 200 },
      });

      const cursorUpdate = await cursorUpdatePromise;

      expect(cursorUpdate.socketId).toBeDefined();
      expect(cursorUpdate.cursor).toEqual({ x: 100, y: 200 });
    });

    it('should not broadcast cursor to the sender', async () => {
      const user = await helper.registerUser('user@example.com', 'Password123!', 'Test User');
      const diagram = await helper.createDiagram(user.token, 'Test Diagram');
      
      client1 = createSocketClient(user.token);
      await waitForEvent(client1, 'connect');

      client1.emit('join-diagram', {
        diagramId: diagram.id,
        user: { id: user.id, name: user.name },
      });
      await waitForEvent(client1, 'room-joined');

      let cursorReceived = false;
      client1.on('cursor-update', () => {
        cursorReceived = true;
      });

      client1.emit('cursor-move', {
        diagramId: diagram.id,
        cursor: { x: 100, y: 200 },
      });

      await new Promise(resolve => setTimeout(resolve, 200));

      expect(cursorReceived).toBe(false);
    });
  });

  describe('Y.js Synchronization', () => {
    it('should broadcast yjs-update to other users', async () => {
      const user1 = await helper.registerUser('user1@example.com', 'Password123!', 'User 1');
      const user2 = await helper.registerUser('user2@example.com', 'Password123!', 'User 2');
      const diagram = await helper.createDiagram(user1.token, 'Test Diagram');
      
      client1 = await connectClient(user1.token);
      client2 = await connectClient(user2.token);

      client1.emit('join-diagram', {
        diagramId: diagram.id,
        user: { id: user1.id, name: user1.name },
      });
      await waitForEvent(client1, 'room-joined');

      client2.emit('join-diagram', {
        diagramId: diagram.id,
        user: { id: user2.id, name: user2.name },
      });
      await waitForEvent(client2, 'room-joined');

      const yjsUpdatePromise = waitForEvent(client2, 'yjs-update');

      const mockUpdate = new Uint8Array([1, 2, 3, 4, 5]);
      client1.emit('yjs-update', {
        diagramId: diagram.id,
        update: mockUpdate,
      });

      const yjsUpdate = await yjsUpdatePromise;

      expect(yjsUpdate.from).toBeDefined();
      expect(yjsUpdate.update).toBeDefined();
    });

    it('should handle yjs-sync-step1 messages', async () => {
      const user1 = await helper.registerUser('user1@example.com', 'Password123!', 'User 1');
      const user2 = await helper.registerUser('user2@example.com', 'Password123!', 'User 2');
      const diagram = await helper.createDiagram(user1.token, 'Test Diagram');
      
      client1 = await connectClient(user1.token);
      client2 = await connectClient(user2.token);

      client1.emit('join-diagram', {
        diagramId: diagram.id,
        user: { id: user1.id, name: user1.name },
      });
      await waitForEvent(client1, 'room-joined');

      client2.emit('join-diagram', {
        diagramId: diagram.id,
        user: { id: user2.id, name: user2.name },
      });
      await waitForEvent(client2, 'room-joined');

      const syncStep1Promise = waitForEvent(client2, 'yjs-sync-step1');

      const mockStateVector = new Uint8Array([1, 2, 3]);
      client1.emit('yjs-sync-step1', {
        diagramId: diagram.id,
        stateVector: mockStateVector,
      });

      const syncStep1 = await syncStep1Promise;

      expect(syncStep1.from).toBeDefined();
      expect(syncStep1.stateVector).toBeDefined();
    });

    it('should handle yjs-sync-step2 messages', async () => {
      const user1 = await helper.registerUser('user1@example.com', 'Password123!', 'User 1');
      const user2 = await helper.registerUser('user2@example.com', 'Password123!', 'User 2');
      const diagram = await helper.createDiagram(user1.token, 'Test Diagram');
      
      client1 = await connectClient(user1.token);
      client2 = await connectClient(user2.token);

      client1.emit('join-diagram', {
        diagramId: diagram.id,
        user: { id: user1.id, name: user1.name },
      });
      await waitForEvent(client1, 'room-joined');

      client2.emit('join-diagram', {
        diagramId: diagram.id,
        user: { id: user2.id, name: user2.name },
      });
      await waitForEvent(client2, 'room-joined');

      const syncStep2Promise = waitForEvent(client2, 'yjs-sync-step2');

      const mockUpdate = new Uint8Array([4, 5, 6]);
      client1.emit('yjs-sync-step2', {
        diagramId: diagram.id,
        update: mockUpdate,
      });

      const syncStep2 = await syncStep2Promise;

      expect(syncStep2.from).toBeDefined();
      expect(syncStep2.update).toBeDefined();
    });

    it('should handle awareness-update messages', async () => {
      const user1 = await helper.registerUser('user1@example.com', 'Password123!', 'User 1');
      const user2 = await helper.registerUser('user2@example.com', 'Password123!', 'User 2');
      const diagram = await helper.createDiagram(user1.token, 'Test Diagram');
      
      client1 = await connectClient(user1.token);
      client2 = await connectClient(user2.token);

      client1.emit('join-diagram', {
        diagramId: diagram.id,
        user: { id: user1.id, name: user1.name },
      });
      await waitForEvent(client1, 'room-joined');

      client2.emit('join-diagram', {
        diagramId: diagram.id,
        user: { id: user2.id, name: user2.name },
      });
      await waitForEvent(client2, 'room-joined');

      const awarenessPromise = waitForEvent(client2, 'awareness-update');

      const mockAwareness = new Uint8Array([7, 8, 9]);
      client1.emit('awareness-update', {
        diagramId: diagram.id,
        update: mockAwareness,
      });

      const awareness = await awarenessPromise;

      expect(awareness.from).toBeDefined();
      expect(awareness.update).toBeDefined();
    });
  });

  describe('Multi-User Scenarios', () => {
    it('should handle three users in the same room', async () => {
      const user1 = await helper.registerUser('user1@example.com', 'Password123!', 'User 1');
      const user2 = await helper.registerUser('user2@example.com', 'Password123!', 'User 2');
      const user3 = await helper.registerUser('user3@example.com', 'Password123!', 'User 3');
      const diagram = await helper.createDiagram(user1.token, 'Test Diagram');
      
      client1 = await connectClient(user1.token);
      client2 = await connectClient(user2.token);
      client3 = await connectClient(user3.token);

      client1.emit('join-diagram', {
        diagramId: diagram.id,
        user: { id: user1.id, name: user1.name },
      });
      const room1 = await waitForEvent(client1, 'room-joined');
      expect(room1.activeUsers).toHaveLength(0);

      client2.emit('join-diagram', {
        diagramId: diagram.id,
        user: { id: user2.id, name: user2.name },
      });
      const room2 = await waitForEvent(client2, 'room-joined');
      expect(room2.activeUsers).toHaveLength(1);

      client3.emit('join-diagram', {
        diagramId: diagram.id,
        user: { id: user3.id, name: user3.name },
      });
      const room3 = await waitForEvent(client3, 'room-joined');
      expect(room3.activeUsers).toHaveLength(2);
    });

    it('should broadcast messages to all users except sender', async () => {
      const user1 = await helper.registerUser('user1@example.com', 'Password123!', 'User 1');
      const user2 = await helper.registerUser('user2@example.com', 'Password123!', 'User 2');
      const user3 = await helper.registerUser('user3@example.com', 'Password123!', 'User 3');
      const diagram = await helper.createDiagram(user1.token, 'Test Diagram');
      
      client1 = await connectClient(user1.token);
      client2 = await connectClient(user2.token);
      client3 = await connectClient(user3.token);

      client1.emit('join-diagram', {
        diagramId: diagram.id,
        user: { id: user1.id, name: user1.name },
      });
      await waitForEvent(client1, 'room-joined');

      client2.emit('join-diagram', {
        diagramId: diagram.id,
        user: { id: user2.id, name: user2.name },
      });
      await waitForEvent(client2, 'room-joined');

      client3.emit('join-diagram', {
        diagramId: diagram.id,
        user: { id: user3.id, name: user3.name },
      });
      await waitForEvent(client3, 'room-joined');

      const cursor2Promise = waitForEvent(client2, 'cursor-update');
      const cursor3Promise = waitForEvent(client3, 'cursor-update');

      let client1ReceivedCursor = false;
      client1.on('cursor-update', () => {
        client1ReceivedCursor = true;
      });

      client1.emit('cursor-move', {
        diagramId: diagram.id,
        cursor: { x: 150, y: 250 },
      });

      await Promise.all([cursor2Promise, cursor3Promise]);
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(client1ReceivedCursor).toBe(false);
    });

    it('should isolate messages between different diagram rooms', async () => {
      const user1 = await helper.registerUser('user1@example.com', 'Password123!', 'User 1');
      const user2 = await helper.registerUser('user2@example.com', 'Password123!', 'User 2');
      const diagram1 = await helper.createDiagram(user1.token, 'Diagram 1');
      const diagram2 = await helper.createDiagram(user1.token, 'Diagram 2');
      
      client1 = await connectClient(user1.token);
      client2 = await connectClient(user2.token);

      client1.emit('join-diagram', {
        diagramId: diagram1.id,
        user: { id: user1.id, name: user1.name },
      });
      await waitForEvent(client1, 'room-joined');

      client2.emit('join-diagram', {
        diagramId: diagram2.id,
        user: { id: user2.id, name: user2.name },
      });
      await waitForEvent(client2, 'room-joined');

      let client2ReceivedCursor = false;
      client2.on('cursor-update', () => {
        client2ReceivedCursor = true;
      });

      client1.emit('cursor-move', {
        diagramId: diagram1.id,
        cursor: { x: 100, y: 100 },
      });

      await new Promise(resolve => setTimeout(resolve, 200));

      expect(client2ReceivedCursor).toBe(false);
    });
  });
});
