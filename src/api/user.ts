// 用户相关 API

import type { User, RegisterResponse, UserInfoResponse, UpdateUserRequest, UpdateUserResponse, UploadAvatarResponse } from '../types/user';

const BASE_URL = 'http://127.0.0.1:9000';
const API_BASE_URL = `${BASE_URL}/api/v1`;

// 将相对路径转换为完整 URL（用于静态资源，如头像）
function normalizeAvatarUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  // 如果已经是完整 URL，直接返回
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  // 否则拼接 BASE_URL（静态资源不带 /api/v1 前缀）
  return `${BASE_URL}${url}`;
}

// 注册接口
export async function registerUser(phone: string, password: string): Promise<User> {
  const response = await fetch(`${API_BASE_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, password }),
  });

  if (!response.ok) {
    if (response.status === 400) {
      throw new Error('手机号已注册');
    }
    throw new Error('服务器错误，请稍后重试');
  }

  const data: RegisterResponse = await response.json();

  // 转换为 User 类型
  return {
    id: data.user_id,
    phone: phone,
    username: data.username,
  };
}

// 登录接口
export async function loginUser(phone: string, password: string): Promise<User> {
  const response = await fetch(`${API_BASE_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, password }),
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('手机号或密码错误');
    }
    throw new Error('服务器错误，请稍后重试');
  }

  const data: RegisterResponse = await response.json();

  // 转换为 User 类型
  return {
    id: data.user_id,
    phone: phone,
    username: data.username,
  };
}

// 登出
export async function logoutUser(): Promise<void> {
  // TODO: 待用户提供登出接口定义
}

// 获取用户信息
export async function getUserInfo(userId: string): Promise<User> {
  const response = await fetch(`${API_BASE_URL}/user/${userId}`);

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('用户不存在');
    }
    throw new Error('服务器错误，请稍后重试');
  }

  const data: UserInfoResponse = await response.json();

  // 转换为 User 类型
  return {
    id: data.user_id,
    phone: data.phone,
    username: data.username,
    avatar: normalizeAvatarUrl(data.avatar_url),
    preferences: data.preferences || undefined,
    createdAt: data.created_at,
  };
}

// 更新用户信息
export async function updateUser(userId: string, data: UpdateUserRequest): Promise<User> {
  const response = await fetch(`${API_BASE_URL}/user/${userId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    if (response.status === 400) {
      throw new Error('用户名已被使用');
    }
    if (response.status === 404) {
      throw new Error('用户不存在');
    }
    throw new Error('服务器错误，请稍后重试');
  }

  const result: UpdateUserResponse = await response.json();

  // 转换为 User 类型
  return {
    id: result.user_id,
    username: result.username,
    avatar: normalizeAvatarUrl(result.avatar_url),
    preferences: result.preferences || undefined,
  };
}

// 删除用户（注销账号）
export async function deleteUser(userId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/user/${userId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('用户不存在');
    }
    throw new Error('服务器错误，请稍后重试');
  }
}

// 上传头像
export async function uploadAvatar(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/upload/avatar`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    if (response.status === 400) {
      throw new Error('只支持 jpg、png、gif 格式');
    }
    throw new Error('服务器错误，请稍后重试');
  }

  const data: UploadAvatarResponse = await response.json();
  return normalizeAvatarUrl(data.avatar_url) || '';
}