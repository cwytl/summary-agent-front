// 会话列表侧边栏组件

import { useState, useRef, useEffect } from 'react';
import { Plus, MessageSquare, Trash2, Clock, MoreVertical, Pencil } from 'lucide-react';
import type { Session } from '../types/chat';

interface SidebarProps {
  sessions: Session[];
  currentSessionId: string | null;
  onNewSession: () => void;
  onSelectSession: (id: string) => void;
  onDeleteSession: (id: string) => void;
  onUpdateTitle: (id: string) => void;
}

export function Sidebar({
  sessions,
  currentSessionId,
  onNewSession,
  onSelectSession,
  onDeleteSession,
  onUpdateTitle,
}: SidebarProps) {
  // 下拉菜单状态
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpenId(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);
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
          Summary Agent
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
        <span style={{ fontSize: '16px', fontWeight: 450, color: '#323131', display: 'flex', alignItems: 'center', gap: '8px' }}>
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
            onClick={() => {
              if (menuOpenId !== session.id) {
                onSelectSession(session.id);
              }
            }}
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
              position: 'relative',
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
                flex: 1,
              }}
            >
              {session.title}
            </span>

            {/* 三个点按钮 */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpenId(menuOpenId === session.id ? null : session.id);
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
              <MoreVertical size={14} style={{ color: '#334155' }} />
            </button>

            {/* 下拉菜单 */}
            {menuOpenId === session.id && (
              <div
                ref={menuRef}
                style={{
                  position: 'absolute',
                  right: '0',
                  top: '100%',
                  background: '#fff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                  padding: '4px',
                  zIndex: 100,
                  minWidth: '120px',
                }}
              >
                {/* 修改标题 */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpenId(null);
                    onUpdateTitle(session.id);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    width: '100%',
                    padding: '8px 12px',
                    background: 'transparent',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    color: '#334155',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <Pencil size={14} />
                  修改标题
                </button>
                {/* 删除 */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpenId(null);
                    onDeleteSession(session.id);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    width: '100%',
                    padding: '8px 12px',
                    background: 'transparent',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    color: '#dc2626',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#fef2f2'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <Trash2 size={14} />
                  删除会话
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}