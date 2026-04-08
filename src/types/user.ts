// 用户相关类型定义

export interface User {
  id: string;           // 对应 API 的 user_id
  phone?: string;       // 手机号，某些接口可能不返回
  username: string;
  avatar?: string;      // 对应 API 的 avatar_url
  preferences?: object; // 用户偏好设置
  createdAt?: string;   // 注册时间
}

// 注册响应
export interface RegisterResponse {
  user_id: string;
  username: string;
}

// 获取用户信息响应
export interface UserInfoResponse {
  user_id: string;
  phone: string;
  username: string;
  avatar_url: string | null;
  preferences: object | null;
  created_at: string;
}

// 更新用户信息请求
export interface UpdateUserRequest {
  username?: string;
  avatar_url?: string;
  preferences?: object;
}

// 更新用户信息响应
export interface UpdateUserResponse {
  user_id: string;
  username: string;
  avatar_url: string | null;
  preferences: object | null;
}

// 上传头像响应
export interface UploadAvatarResponse {
  avatar_url: string;
}