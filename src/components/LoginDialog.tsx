// 登录/注册弹窗组件

import React, { useState } from 'react';
import { X } from 'lucide-react';

interface LoginDialogProps {
  visible: boolean;
  onClose: () => void;
  onLogin: (phone: string, password: string) => Promise<boolean>;
  onRegister: (phone: string, password: string) => Promise<boolean>;
}

export function LoginDialog({ visible, onClose, onLogin, onRegister }: LoginDialogProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!visible) return null;

  const switchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setError('');
    setConfirmPassword('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // 基本验证
    if (!phone.trim()) {
      setError('请输入手机号');
      return;
    }
    if (!password.trim()) {
      setError('请输入密码');
      return;
    }

    // 注册时验证确认密码
    if (mode === 'register') {
      if (!confirmPassword.trim()) {
        setError('请确认密码');
        return;
      }
      if (password !== confirmPassword) {
        setError('两次输入的密码不一致');
        return;
      }
    }

    setIsLoading(true);
    try {
      const success = mode === 'login'
        ? await onLogin(phone, password)
        : await onRegister(phone, password);

      if (success) {
        setPhone('');
        setPassword('');
        setConfirmPassword('');
        onClose();
      } else {
        setError(mode === 'login' ? '登录失败，请检查手机号和密码' : '注册失败，请稍后重试');
      }
    } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : (mode === 'login' ? '登录失败，请稍后重试' : '注册失败，请稍后重试');
        setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: '0',
        left: '0',
        right: '0',
        bottom: '0',
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        style={{
          background: '#fff',
          padding: '32px',
          borderRadius: '16px',
          width: '400px',
          maxWidth: '90%',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
        }}
      >
        {/* 标题和关闭按钮 */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px',
          }}
        >
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 600, color: '#1e293b' }}>
            {mode === 'login' ? '登录' : '注册'}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
            }}
          >
            <X size={20} color="#64748b" />
          </button>
        </div>

        {/* 表单 */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                color: '#334155',
                fontWeight: 500,
              }}
            >
              手机号
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="请输入手机号"
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '15px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => e.target.style.borderColor = '#0f172a'}
              onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                color: '#334155',
                fontWeight: 500,
              }}
            >
              密码
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码"
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '15px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => e.target.style.borderColor = '#0f172a'}
              onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
            />
          </div>

          {/* 注册时的确认密码 */}
          {mode === 'register' && (
            <div style={{ marginBottom: '24px' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  color: '#334155',
                  fontWeight: 500,
                }}
              >
                确认密码
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="请再次输入密码"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '15px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
                onFocus={(e) => e.target.style.borderColor = '#0f172a'}
                onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
              />
            </div>
          )}

          {/* 错误提示 */}
          {error && (
            <div
              style={{
                marginBottom: '16px',
                padding: '12px',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                color: '#dc2626',
                fontSize: '14px',
              }}
            >
              {error}
            </div>
          )}

          {/* 提交按钮 */}
          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '14px',
              background: isLoading ? '#94a3b8' : '#0f172a',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              fontWeight: 600,
            }}
          >
            {isLoading
              ? (mode === 'login' ? '登录中...' : '注册中...')
              : (mode === 'login' ? '登录' : '注册')}
          </button>

          {/* 切换登录/注册 */}
          <div
            style={{
              textAlign: 'center',
              marginTop: '16px',
              fontSize: '14px',
              color: '#64748b',
            }}
          >
            {mode === 'login' ? (
              <>
                还没有账号？
                <span
                  onClick={switchMode}
                  style={{
                    color: '#0f172a',
                    cursor: 'pointer',
                    fontWeight: 500,
                    marginLeft: '4px',
                  }}
                >
                  立即注册
                </span>
              </>
            ) : (
              <>
                已有账号？
                <span
                  onClick={switchMode}
                  style={{
                    color: '#0f172a',
                    cursor: 'pointer',
                    fontWeight: 500,
                    marginLeft: '4px',
                  }}
                >
                  立即登录
                </span>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}