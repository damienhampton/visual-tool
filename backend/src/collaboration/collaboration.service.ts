import { Injectable } from '@nestjs/common';

interface CursorPosition {
  x: number;
  y: number;
}

interface RoomUser {
  socketId: string;
  userId: string;
  userName: string;
  color: string;
  cursor?: CursorPosition;
  lastSeen: Date;
}

@Injectable()
export class CollaborationService {
  private rooms: Map<string, Map<string, RoomUser>> = new Map();
  private userColors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
    '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B739', '#52B788',
  ];

  async addUserToRoom(
    diagramId: string,
    user: Omit<RoomUser, 'lastSeen'>,
  ): Promise<void> {
    if (!this.rooms.has(diagramId)) {
      this.rooms.set(diagramId, new Map());
    }

    const room = this.rooms.get(diagramId);
    if (room) {
      room.set(user.socketId, {
        ...user,
        lastSeen: new Date(),
      });
    }
  }

  async removeUserFromRoom(diagramId: string, socketId: string): Promise<void> {
    const room = this.rooms.get(diagramId);
    if (room) {
      room.delete(socketId);
      if (room.size === 0) {
        this.rooms.delete(diagramId);
      }
    }
  }

  async removeUserByUserId(diagramId: string, userId: string): Promise<void> {
    const room = this.rooms.get(diagramId);
    if (room) {
      // Find and remove all socket connections for this user
      const socketsToRemove: string[] = [];
      for (const [socketId, user] of room.entries()) {
        if (user.userId === userId) {
          socketsToRemove.push(socketId);
        }
      }
      
      for (const socketId of socketsToRemove) {
        room.delete(socketId);
      }

      if (room.size === 0) {
        this.rooms.delete(diagramId);
      }
    }
  }

  async getRoomUsers(diagramId: string): Promise<RoomUser[]> {
    const room = this.rooms.get(diagramId);
    if (!room) {
      return [];
    }

    return Array.from(room.values());
  }

  updateUserCursor(
    diagramId: string,
    socketId: string,
    cursor: CursorPosition,
  ): void {
    const room = this.rooms.get(diagramId);
    if (room) {
      const user = room.get(socketId);
      if (user) {
        user.cursor = cursor;
        user.lastSeen = new Date();
      }
    }
  }

  generateUserColor(): string {
    return this.userColors[Math.floor(Math.random() * this.userColors.length)];
  }

  getRoomCount(): number {
    return this.rooms.size;
  }

  getTotalUserCount(): number {
    let count = 0;
    for (const room of this.rooms.values()) {
      count += room.size;
    }
    return count;
  }
}
