import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { CollaborationService } from './collaboration.service';
import { WsJwtGuard } from './guards/ws-jwt.guard';

interface CursorPosition {
  x: number;
  y: number;
}

interface UserPresence {
  userId: string;
  userName: string;
  color: string;
  cursor?: CursorPosition;
}

@WebSocketGateway({
  cors: {
    origin: 'http://localhost:5173',
    credentials: true,
  },
  namespace: '/collaboration',
})
export class CollaborationGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  constructor(private collaborationService: CollaborationService) {}

  async handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  async handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    const rooms = Array.from(client.rooms).filter((room) => room !== client.id);
    
    for (const room of rooms) {
      await this.collaborationService.removeUserFromRoom(room, client.id);
      this.server.to(room).emit('user-left', {
        socketId: client.id,
      });
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('join-diagram')
  async handleJoinDiagram(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { diagramId: string; user: { id: string; name: string } },
  ) {
    const { diagramId, user } = data;

    await client.join(diagramId);

    const color = this.collaborationService.generateUserColor();
    
    await this.collaborationService.addUserToRoom(diagramId, {
      socketId: client.id,
      userId: user.id,
      userName: user.name,
      color,
    });

    const activeUsers = await this.collaborationService.getRoomUsers(diagramId);

    client.emit('room-joined', {
      diagramId,
      activeUsers,
      yourColor: color,
    });

    client.to(diagramId).emit('user-joined', {
      socketId: client.id,
      userId: user.id,
      userName: user.name,
      color,
    });

    return { success: true };
  }

  @SubscribeMessage('leave-diagram')
  async handleLeaveDiagram(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { diagramId: string },
  ) {
    const { diagramId } = data;

    await client.leave(diagramId);
    await this.collaborationService.removeUserFromRoom(diagramId, client.id);

    client.to(diagramId).emit('user-left', {
      socketId: client.id,
    });

    return { success: true };
  }

  @SubscribeMessage('cursor-move')
  handleCursorMove(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { diagramId: string; cursor: CursorPosition },
  ) {
    const { diagramId, cursor } = data;

    this.collaborationService.updateUserCursor(diagramId, client.id, cursor);

    client.to(diagramId).emit('cursor-update', {
      socketId: client.id,
      cursor,
    });
  }

  @SubscribeMessage('yjs-update')
  handleYjsUpdate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { diagramId: string; update: Uint8Array },
  ) {
    const { diagramId, update } = data;

    client.to(diagramId).emit('yjs-update', {
      update,
      from: client.id,
    });
  }

  @SubscribeMessage('yjs-sync-step1')
  handleYjsSyncStep1(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { diagramId: string; stateVector: Uint8Array },
  ) {
    const { diagramId, stateVector } = data;

    client.to(diagramId).emit('yjs-sync-step1', {
      stateVector,
      from: client.id,
    });
  }

  @SubscribeMessage('yjs-sync-step2')
  handleYjsSyncStep2(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { diagramId: string; update: Uint8Array },
  ) {
    const { diagramId, update } = data;

    client.to(diagramId).emit('yjs-sync-step2', {
      update,
      from: client.id,
    });
  }

  @SubscribeMessage('awareness-update')
  handleAwarenessUpdate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { diagramId: string; update: Uint8Array },
  ) {
    const { diagramId, update } = data;

    client.to(diagramId).emit('awareness-update', {
      update,
      from: client.id,
    });
  }
}
