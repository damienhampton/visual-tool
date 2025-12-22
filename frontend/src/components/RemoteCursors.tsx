interface CursorPosition {
  x: number;
  y: number;
}

interface RemoteUser {
  socketId: string;
  userId: string;
  userName: string;
  color: string;
  cursor?: CursorPosition;
}

interface RemoteCursorsProps {
  users: RemoteUser[];
}

export function RemoteCursors({ users }: RemoteCursorsProps) {
  return (
    <>
      {users.map((user) =>
        user.cursor ? (
          <div
            key={user.socketId}
            style={{
              position: 'absolute',
              left: user.cursor.x,
              top: user.cursor.y,
              pointerEvents: 'none',
              zIndex: 1000,
              transform: 'translate(-2px, -2px)',
            }}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))' }}
            >
              <path
                d="M5.65376 12.3673L8.04999 19.1808C8.52312 20.4788 10.2563 20.615 10.9099 19.3942L12.6949 16.2029C13.0636 15.5128 13.7663 15.0417 14.5604 14.9417L18.3494 14.4434C19.6907 14.2667 20.1736 12.5397 19.1013 11.6865L5.65376 12.3673Z"
                fill={user.color}
              />
            </svg>
            <div
              style={{
                marginTop: '4px',
                marginLeft: '12px',
                padding: '4px 8px',
                background: user.color,
                color: 'white',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: 'bold',
                whiteSpace: 'nowrap',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
              }}
            >
              {user.userName}
            </div>
          </div>
        ) : null
      )}
    </>
  );
}
