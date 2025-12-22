# Planning

## Background and context

I really like Miro as a diagramming too, but I have a few issues with it:
- I want better alignment and structuring options
- I specifically want to be able to create C4 model diagrams
- I want to create hierachical C4 diagrams (e.g. System Context -> Container -> Component -> Code)
- I want to be able to version control my diagrams alongside my code
- I want to be able to generate diagrams from code (e.g. terraform, architecture decision records, etc)
_ I like Structurizr, but it's not a great tool for free-form diagramming

Basically:
- The ease of use of Miro
- The version control and code generation of Structurizr

## Research

1. **Target platform**: Are you envisioning this as a web app, desktop app (Electron), or both?

   ✅ **Decision**: Web app

2. **Tech stack preferences**: Do you have any preferences for frontend framework (React, Vue, Svelte, etc.) or canvas/diagramming libraries (e.g., Fabric.js, Konva, React Flow, tldraw)?

   ### Canvas Library Comparison

   #### Fabric.js
   **Pros:**
   - Mature, battle-tested (10+ years)
   - Excellent object manipulation (select, move, resize, rotate with handles)
   - Built-in serialization to JSON (great for version control)
   - Rich text support, image filters, SVG import/export
   - Large community, good documentation

   **Cons:**
   - Not React-native (requires wrapper/imperative code)
   - Can feel heavy for simple use cases
   - Less suited for node-and-edge diagrams out of the box

   #### Konva
   **Pros:**
   - High-performance canvas rendering with layering system
   - Official React bindings (`react-konva`)
   - Good for complex scenes with many objects
   - Supports animations, transitions, caching
   - JSON serialization built-in

   **Cons:**
   - Lower-level than Fabric (you build more yourself)
   - No built-in connector/edge system for diagrams
   - Less rich object manipulation UI out of the box

   #### React Flow
   **Pros:**
   - Purpose-built for node-based diagrams (flowcharts, architecture diagrams)
   - Native React, declarative API
   - Built-in edges/connectors with routing
   - Handles, minimap, controls, zoom/pan included
   - Active development, good TypeScript support
   - Nodes can contain any React component

   **Cons:**
   - Focused on node graphs—less suited for free-form drawing
   - Customizing edge routing can be tricky
   - Not ideal for arbitrary shapes or image editing

   #### tldraw
   **Pros:**
   - Closest to Miro's UX (free-form whiteboard feel)
   - Modern React architecture, excellent DX
   - Built-in shapes, connectors, selection, undo/redo
   - Collaborative-ready (CRDT-based)
   - Open source with permissive license
   - JSON-based document format (git-friendly)

   **Cons:**
   - Younger project (less battle-tested)
   - Opinionated—customizing deeply may fight the framework
   - Node-based diagramming requires more custom work than React Flow

   #### Recommendation Summary

   | Requirement | Best fit |
   |-------------|----------|
   | Miro-like ease of use | **tldraw** |
   | C4 diagrams (nodes + connectors) | **React Flow** or tldraw |
   | Version control (JSON files) | All support this |
   | Hierarchical drill-down | Custom work needed in any |
   | Code generation/import | Custom work needed in any |

   **Suggestion**: tldraw if you want the Miro feel with free-form diagramming + custom C4 shapes; React Flow if you want a more structured node-graph approach with less free-form drawing.

   **Note on licensing**: tldraw requires $6,000/year for commercial use without watermark. React Flow is MIT licensed (free).

   ✅ **Decision**: React + React Flow (MIT licensed, purpose-built for node diagrams)

3. **Storage/version control approach**: 
   - Should diagrams be saved as JSON/YAML files that can be committed to git?
   - Do you want a local-first approach, or cloud storage with git integration?

   ✅ **Decision**: Phased approach:
   1. Browser storage (localStorage/IndexedDB) first
   2. Add cloud storage
   3. Add export to JSON/YAML + git integration

4. **C4 model specifics**:
   - Do you want strict C4 element types (Person, Software System, Container, Component, Code)?
   - Should the hierarchical navigation be drill-down (click a System to see its Containers) or side-by-side views?

   ✅ **Decision**: Strict C4 element types. Phased approach:
   1. Individual diagrams (System Context, Container, Component, Code as separate views)
   2. Drill-down navigation between levels
   3. Side-by-side views or similar

5. **Code generation priority**: Which integrations matter most initially?
   - Import from Terraform
   - Import from ADRs
   - Export to Structurizr DSL
   - Other (OpenAPI, CloudFormation, etc.)

   ✅ **Decision**: Defer for now. Focus on a sensible semantic data model that can be translated to IaC formats later.

6. **MVP scope**: What's the minimum you'd want for a first usable version? For example:
   - Basic canvas with C4 shapes + connectors
   - Save/load to local JSON files
   - One level of hierarchy

   ✅ **Decision**: MVP includes:
   - Full window canvas with ability to place shapes
   - Add text to shapes
   - Save structure to localStorage

   **Future scope:**
   - Detailed object types (e.g. AWS resources)
   - Object colours, linking
   - User accounts (register/login)
   - Cloud storage

   **Tech stack:**
   - Frontend: React + React Flow
   - Backend: NestJS

7. **Alignment/structuring features**: Can you elaborate on what "better alignment and structuring" means to you? Auto-layout, snap-to-grid, grouping, templates?

   ✅ **Decision**: Snap-to-grid, auto-layout, grouping. Templates deferred for later.

---

## Data Model Design

### Database Schema

#### User
```typescript
{
  id: uuid (PK)
  email?: string (unique, nullable for guests)
  name: string
  passwordHash?: string (nullable for guests)
  isGuest: boolean
  createdAt: timestamp
  updatedAt: timestamp
}
```

#### Diagram
```typescript
{
  id: uuid (PK)
  title: string
  ownerId: uuid (FK -> User)
  shareToken: string (unique, for guest access)
  isPublic: boolean
  createdAt: timestamp
  updatedAt: timestamp
}
```

#### DiagramVersion
```typescript
{
  id: uuid (PK)
  diagramId: uuid (FK -> Diagram)
  version: int
  data: jsonb // Full React Flow state (nodes, edges, viewport)
  createdAt: timestamp
  createdBy: uuid (FK -> User)
}
```

#### DiagramCollaborator
```typescript
{
  id: uuid (PK)
  diagramId: uuid (FK -> Diagram)
  userId: uuid (FK -> User)
  role: enum ('owner', 'editor', 'viewer')
  addedAt: timestamp
}
```

#### ActiveSession (Redis or in-memory)
```typescript
{
  sessionId: uuid
  diagramId: uuid
  userId: uuid
  userName: string
  cursor: { x: number, y: number }
  color: string
  lastSeen: timestamp
}
```

### Diagram Data Structure (JSONB)

Stored in `DiagramVersion.data`:

```typescript
{
  nodes: [
    {
      id: string
      type: 'c4Node'
      position: { x: number, y: number }
      data: {
        label: string
        description?: string
        type: 'person' | 'softwareSystem' | 'container' | 'component'
        color?: string // For future customization
        metadata?: Record<string, any> // Extensible for AWS resources, etc.
      }
    }
  ],
  edges: [
    {
      id: string
      source: string // node id
      target: string // node id
      label?: string
      type?: string
      animated?: boolean
      style?: Record<string, any>
    }
  ],
  viewport: { 
    x: number, 
    y: number, 
    zoom: number 
  }
}
```

### API Endpoints (Planned)

**Auth:**
- `POST /auth/register` - Create user account
- `POST /auth/login` - Login with email/password
- `POST /auth/guest` - Create guest user
- `GET /auth/me` - Get current user

**Diagrams:**
- `POST /diagrams` - Create new diagram
- `GET /diagrams` - List user's diagrams
- `GET /diagrams/:id` - Get diagram by ID
- `PUT /diagrams/:id` - Update diagram metadata
- `DELETE /diagrams/:id` - Delete diagram
- `POST /diagrams/:id/share` - Generate/regenerate share token
- `GET /diagrams/shared/:token` - Access diagram via share token

**Collaboration:**
- `WebSocket /collaboration/:diagramId` - Real-time sync
- `GET /diagrams/:id/collaborators` - List collaborators
- `POST /diagrams/:id/collaborators` - Add collaborator
- `DELETE /diagrams/:id/collaborators/:userId` - Remove collaborator

---

## Task List

### Phase 1: MVP ✅ COMPLETE
- [x] Project setup (React + Vite + TypeScript)
- [x] Install and configure React Flow
- [x] Full-window canvas component
- [x] Basic shape palette (C4 elements: Person, Software System, Container, Component)
- [x] Drag shapes onto canvas
- [x] Add/edit text on shapes
- [x] Save diagram to localStorage
- [x] Load diagram from localStorage
- [x] Basic styling (clean, modern UI)

### Phase 2: Real-Time Collaboration (PRIORITY)

#### Tech Stack
- **Backend**: NestJS + WebSockets (socket.io) + Yjs + PostgreSQL + Redis (optional)
- **Frontend**: Yjs + y-websocket + React Flow integration
- **Auth**: JWT + Passport.js (with guest access support)

#### Tasks
- [ ] Backend setup
  - [ ] NestJS project initialization
  - [ ] PostgreSQL database setup
  - [ ] Database schema and migrations (User, Diagram, DiagramVersion, DiagramCollaborator)
  - [ ] WebSocket gateway with socket.io
  - [ ] Yjs WebSocket provider integration
- [ ] Authentication
  - [ ] User registration/login (JWT)
  - [ ] Guest user creation with diagram links
  - [ ] Share token generation for diagrams
  - [ ] Auth guards and middleware
- [ ] Diagram persistence
  - [ ] Save diagram API endpoint
  - [ ] Load diagram API endpoint
  - [ ] Diagram versioning/snapshots
  - [ ] List user's diagrams
- [ ] Real-time collaboration
  - [ ] Yjs document synchronization
  - [ ] Multi-user editing (concurrent node/edge updates)
  - [ ] Cursor position broadcasting
  - [ ] User presence indicators (active users list)
  - [ ] Cursor rendering with user colors/names
- [ ] Sharing & permissions
  - [ ] Generate shareable links
  - [ ] Permission levels (owner, editor, viewer)
  - [ ] Guest access via share token
  - [ ] Diagram access control

### Phase 3: Enhanced Diagramming
- [ ] Connect shapes with edges/arrows (basic connection exists, enhance with labels)
- [ ] Snap-to-grid
- [ ] Object colour customization
- [ ] Grouping elements
- [ ] Auto-layout options
- [ ] Multiple diagrams (list/select in UI)
- [ ] Diagram search and filtering
- [ ] Export to JSON/YAML
- [ ] Import from JSON/YAML

### Phase 4: Advanced Features
- [ ] Detailed object types (AWS resources, etc.)
- [ ] Drill-down navigation between C4 levels
- [ ] Side-by-side views
- [ ] Templates
- [ ] Diagram history/version control UI
- [ ] Comments and annotations
- [ ] Git integration
