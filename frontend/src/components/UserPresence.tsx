interface RemoteUser {
  socketId: string;
  userId: string;
  userName: string;
  color: string;
}

interface UserPresenceProps {
  users: RemoteUser[];
  myColor: string;
  myName: string;
  isConnected: boolean;
}

export function UserPresence({ users, myColor, myName, isConnected }: UserPresenceProps) {
  return (
    <div
      style={{
        position: 'absolute',
        top: '16px',
        right: '16px',
        background: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        padding: '12px',
        zIndex: 10,
        minWidth: '200px',
      }}
    >
      <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#666', marginBottom: '8px' }}>
        {isConnected ? (
          <span style={{ color: '#4caf50' }}>● Connected</span>
        ) : (
          <span style={{ color: '#f44336' }}>● Disconnected</span>
        )}
      </div>

      <div style={{ fontSize: '11px', color: '#999', marginBottom: '8px' }}>
        {users.length + 1} {users.length === 0 ? 'user' : 'users'} online
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: myColor,
            }}
          />
          <span style={{ fontSize: '13px', color: '#333' }}>
            {myName} <span style={{ color: '#999', fontSize: '11px' }}>(you)</span>
          </span>
        </div>

        {users.map((user) => (
          <div key={user.socketId} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                background: user.color,
              }}
            />
            <span style={{ fontSize: '13px', color: '#333' }}>{user.userName}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
