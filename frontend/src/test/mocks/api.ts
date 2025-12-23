import { vi } from 'vitest';

export const mockDiagramApi = {
  register: vi.fn(),
  login: vi.fn(),
  createGuest: vi.fn(),
  getCurrentUser: vi.fn(),
  createDiagram: vi.fn(),
  listDiagrams: vi.fn(),
  getDiagram: vi.fn(),
  updateDiagram: vi.fn(),
  deleteDiagram: vi.fn(),
  addCollaborator: vi.fn(),
  removeCollaborator: vi.fn(),
  getCollaborators: vi.fn(),
  getDiagramByShareToken: vi.fn(),
};

export const mockAuthResponse = {
  accessToken: 'mock-token',
  user: {
    id: 'user-1',
    email: 'test@example.com',
    name: 'Test User',
    isGuest: false,
    isAdmin: false,
  },
};

export const mockDiagram = {
  id: 'diagram-1',
  title: 'Test Diagram',
  ownerId: 'user-1',
  shareToken: 'share-token-123',
  isPublic: false,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  userRole: 'owner' as const,
};
