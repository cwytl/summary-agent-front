// 会话列表侧边栏组件

import React from 'react';
import { Plus, MessageSquare, Trash2, Clock } from 'lucide-react';
import type { Session } from '../types/chat';

interface SidebarProps {
  sessions: Session[];
  currentSessionId: string | null;
  onNewSession: () => void;
  onSelectSession: (id: string) => void;
  onDeleteSession: (id: string) => void;
}

export function Sidebar({
  sessions,
  currentSessionId,
  onNewSession,
  onSelectSession,
  onDeleteSession,
}: SidebarProps) {
  return (
    <div
      style={{
        width: '250px',
        height: '100vh',
        background: '#f8fafc',
        borderRight: '1px solid #e2e8f0',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
      }}
    >
      {/* 顶部：品牌标题 */}
      <div
        style={{
          padding: '24px 16px 16px',
          borderBottom: '1px solid #e2e8f0',
        }}
      >
        <span style={{ fontSize: '20px', fontWeight: 700, color: '#1e293b' }}>
          Bili Agent
        </span>
      </div>

      {/* 会话管理区：标题 + 新建按钮 */}
      <div
        style={{
          padding: '16px 16px 12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span style={{ fontSize: '16px', fontWeight: 500, color: '#323131', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Clock size={18} />
          历史会话
        </span>
        <button
          onClick={onNewSession}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '2px',
            padding: '6px 12px',
            background: '#0f172a',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '13px',
            marginRight:'10px',
            fontWeight: 500,
          }}
        >
          <Plus size={16} />
          新建
        </button>
      </div>

      {/* 会话列表 */}
      <div
        className="sidebar-session-list"
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1px 8px',
        }}
      >
        {sessions.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              color: '#94a3b8',
              fontSize: '14px',
              padding: '40px 16px',
            }}
          >
            <MessageSquare size={32} style={{ opacity: 0.5, marginBottom: '12px' }} />
            <p>暂无会话</p>
            <p style={{ fontSize: '12px', marginTop: '8px' }}>点击"新建"开始对话</p>
          </div>
        )}

        {sessions.map(session => (
          <div
            key={session.id}
            onClick={() => onSelectSession(session.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '9px 9px',
              marginBottom: '4px',
              borderRadius: '5px',
              cursor: 'pointer',
              background: session.id === currentSessionId ? '#9c9b9b41' : 'transparent',
              transition: 'background 0.15s',
              width: '180px',
              margin: '0 auto 4px',
              marginLeft:'20px',
            }}
          >
            <span
              style={{
                fontSize: '15px',
                color: session.id === currentSessionId ? '#1b1a1a' : '#5e5e5f',
                fontWeight: session.id === currentSessionId ? 400 : 400,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                textAlign: 'left',
              }}
            >
              {session.title}
            </span>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteSession(session.id);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '4px',
                background: 'transparent',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                opacity: 0.5,
                transition: 'opacity 0.15s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '0.5'}
            >
              <Trash2 size={14} style={{ color: '#ff0000' }} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}