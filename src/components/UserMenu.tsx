// 用户菜单组件 - 显示在右上角

import { useState, useRef, useEffect } from 'react';
import { User, LogOut, ChevronDown, Settings } from 'lucide-react';
import type { User as UserType } from '../types/user';

interface UserMenuProps {
  user: UserType | null;
  isLoggedIn: boolean;
  onLoginClick: () => void;
  onLogout: () => void;
  onProfileClick: () => void;
}

export function UserMenu({ user, isLoggedIn, onLoginClick, onLogout, onProfileClick }: UserMenuProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isLoggedIn) {
    // 未登录：显示登录按钮
    return (
      <button
        onClick={onLoginClick}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '8px 16px',
          background: '#0f172a',
          color: '#fff',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: 500,
        }}
      >
        <User size={16} />
        登录
      </button>
    );
  }

  // 已登录：显示用户头像和下拉菜单
  return (
    <div
      ref={dropdownRef}
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 12px',
          background: 'transparent',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
        }}
      >
        {user?.avatar ? (
          <img
            src={user.avatar}
            alt="头像"
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              objectFit: 'cover',
            }}
          />
        ) : (
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: '#e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <User size={16} color="#64748b" />
          </div>
        )}
        <span style={{ fontSize: '14px', color: '#334155', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {user?.username || '用户'}
        </span>
        <ChevronDown size={16} color="#64748b" />
      </button>

      {/* 下拉菜单 */}
      {isDropdownOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            right: '0',
            marginTop: '8px',
            background: '#fff',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            minWidth: '150px',
            zIndex: 100,
          }}
        >
          <div
            style={{
              padding: '12px 16px',
              borderBottom: '1px solid #e2e8f0',
              fontSize: '12px',
              color: '#94a3b8',
            }}
          >
            {user?.phone}
          </div>
          <button
            onClick={() => {
              setIsDropdownOpen(false);
              onProfileClick();
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              width: '100%',
              padding: '12px 16px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              color: '#334155',
              textAlign: 'left',
            }}
          >
            <Settings size={16} />
            修改个人信息
          </button>
          <button
            onClick={() => {
              setIsDropdownOpen(false);
              onLogout();
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              width: '100%',
              padding: '12px 16px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              color: '#334155',
              textAlign: 'left',
            }}
          >
            <LogOut size={16} />
            退出登录
          </button>
        </div>
      )}
    </div>
  );
}