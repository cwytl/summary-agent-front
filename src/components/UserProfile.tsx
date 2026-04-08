// 个人信息页面组件

import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, User, Save, Camera } from 'lucide-react';
import type { User as UserType } from '../types/user';
import { getUserInfo, updateUser, uploadAvatar } from '../api/user';

interface UserProfileProps {
  userId: string;
  onBack: () => void;
  onUserUpdate: (user: UserType) => void;
}

export function UserProfile({ userId, onBack, onUserUpdate }: UserProfileProps) {
  const [user, setUser] = useState<UserType | null>(null);
  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [localPreview, setLocalPreview] = useState(''); // 本地预览
  const [avatarFile, setAvatarFile] = useState<File | null>(null); // 待上传的文件
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 显示的头像（优先本地预览，否则用服务器URL）
  const displayAvatar = localPreview || avatarUrl;

  // 获取用户信息
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await getUserInfo(userId);
        setUser(userData);
        setUsername(userData.username);
        setAvatarUrl(userData.avatar || '');
      } catch (err) {
        setError(err instanceof Error ? err.message : '获取用户信息失败');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [userId]);

  // 点击头像打开文件选择器
  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  // 选择图片后本地预览
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 检查文件类型
    const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      setError('只支持 jpg、png、gif 格式');
      return;
    }

    // 检查文件大小（限制为2MB）
    if (file.size > 2 * 1024 * 1024) {
      setError('图片大小不能超过2MB');
      return;
    }

    // 本地预览
    const reader = new FileReader();
    reader.onload = (event) => {
      setLocalPreview(event.target?.result as string);
      setAvatarFile(file);
      setError('');
    };
    reader.onerror = () => {
      setError('读取图片失败');
    };
    reader.readAsDataURL(file);

    // 清空input，允许重复选择同一文件
    e.target.value = '';
  };

  // 保存修改
  const handleSave = async () => {
    setError('');
    setSuccess('');
    setIsSaving(true);

    try {
      let newAvatarUrl = avatarUrl;

      // 如果有新选择的图片，先上传
      if (avatarFile) {
        newAvatarUrl = await uploadAvatar(avatarFile);
      }

      // 更新用户信息
      const updatedUser = await updateUser(userId, {
        username: username.trim() || undefined,
        avatar_url: newAvatarUrl || undefined,
      });

      setUser(updatedUser);
      setAvatarUrl(updatedUser.avatar || '');
      setLocalPreview('');
      setAvatarFile(null);
      onUserUpdate(updatedUser);
      setSuccess('个人信息已更新');
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新失败');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}>
        <span style={{ color: '#64748b' }}>加载中...</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}>
        <span style={{ color: '#64748b', marginBottom: '16px' }}>获取用户信息失败</span>
        <button
          onClick={onBack}
          style={{
            padding: '10px 20px',
            background: '#0f172a',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
          }}
        >
          返回
        </button>
      </div>
    );
  }

  return (
    <div style={{
      height: '100vh',
      fontFamily: 'Inter, system-ui, sans-serif',
      background: '#fff',
    }}>
      {/* 隐藏的文件选择器 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      {/* 顶部导航 */}
      <div style={{
        padding: '16px 24px',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
      }}>
        <button
          onClick={onBack}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: '#334155',
            fontSize: '14px',
          }}
        >
          <ArrowLeft size={20} />
          返回
        </button>
        <h1 style={{
          margin: 0,
          fontSize: '20px',
          fontWeight: 600,
          color: '#1e293b',
        }}>
          个人信息
        </h1>
      </div>

      {/* 内容区域 */}
      <div style={{
        maxWidth: '600px',
        margin: '40px auto',
        padding: '0 24px',
      }}>
        {/* 头像展示 - 可点击上传 */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: '32px',
        }}>
          <div
            onClick={handleAvatarClick}
            style={{
              position: 'relative',
              cursor: 'pointer',
              width: '100px',
              height: '100px',
              borderRadius: '50%',
              overflow: 'hidden',
              border: '2px solid #e2e8f0',
            }}
            onMouseEnter={(e) => {
              const overlay = e.currentTarget.querySelector('.avatar-overlay') as HTMLElement;
              if (overlay) overlay.style.opacity = '1';
            }}
            onMouseLeave={(e) => {
              const overlay = e.currentTarget.querySelector('.avatar-overlay') as HTMLElement;
              if (overlay) overlay.style.opacity = '0';
            }}
          >
            {displayAvatar ? (
              <img
                src={displayAvatar}
                alt="头像"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            ) : (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  background: '#e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <User size={40} color="#64748b" />
              </div>
            )}
            {/* 悬浮遮罩 */}
            <div
              className="avatar-overlay"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: 0,
                transition: 'opacity 0.2s',
              }}
            >
              <Camera size={24} color="#fff" />
              <span style={{ color: '#fff', fontSize: '12px', marginTop: '4px' }}>更换头像</span>
            </div>
          </div>
        </div>

        {/* 用户名 */}
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
            用户名
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="请输入用户名"
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

        {/* 用户信息展示 */}
        <div style={{
          padding: '16px',
          background: '#f8fafc',
          borderRadius: '8px',
          marginBottom: '24px',
        }}>
          <div style={{
            fontSize: '13px',
            color: '#64748b',
            marginBottom: '8px',
          }}>
            手机号：{user.phone}
          </div>
          {user.createdAt && (
            <div style={{
              fontSize: '13px',
              color: '#64748b',
            }}>
              注册时间：{new Date(user.createdAt).toLocaleDateString('zh-CN')}
            </div>
          )}
        </div>

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

        {/* 成功提示 */}
        {success && (
          <div
            style={{
              marginBottom: '16px',
              padding: '12px',
              background: '#dcfce7',
              border: '1px solid #86efac',
              borderRadius: '8px',
              color: '#166534',
              fontSize: '14px',
            }}
          >
            {success}
          </div>
        )}

        {/* 保存按钮 */}
        <button
          onClick={handleSave}
          disabled={isSaving}
          style={{
            width: '100%',
            padding: '14px',
            background: isSaving ? '#94a3b8' : '#0f172a',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            cursor: isSaving ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          <Save size={18} />
          {isSaving ? '保存中...' : '保存修改'}
        </button>
      </div>
    </div>
  );
}