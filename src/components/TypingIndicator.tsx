// 思考中动画组件 - 三个跳动的点



export function TypingIndicator() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '14px 20px',
      borderRadius: '18px',
      backgroundColor: '#F1F5F9',
    }}>
      <span style={{
        fontSize: '14px',
        color: '#64748b',
      }}>
        思考中
      </span>
      <span style={{
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        backgroundColor: '#94a3b8',
        animation: 'typing-bounce 1.4s infinite ease-in-out both',
      }} />
      <span style={{
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        backgroundColor: '#94a3b8',
        animation: 'typing-bounce 1.4s infinite ease-in-out both',
        animationDelay: '0.2s',
      }} />
      <span style={{
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        backgroundColor: '#94a3b8',
        animation: 'typing-bounce 1.4s infinite ease-in-out both',
        animationDelay: '0.4s',
      }} />
      <style>{`
        @keyframes typing-bounce {
          0%, 80%, 100% {
            transform: scale(0.6);
            opacity: 0.5;
          }
          40% {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}