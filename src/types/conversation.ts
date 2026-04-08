// 会话相关类型定义

export interface Conversation {
  id: string;           // 对应 API 的 thread_id
  title: string;
  intent?: string;
  createdAt: string;    // 对应 API 的 created_at
  updatedAt: string;    // 对应 API 的 updated_at
}

// 会话消息
export interface ConversationMessage {
  id: number;
  role: 'human' | 'ai' | 'system';
  content: string;
  createdAt: string;    // 对应 API 的 created_at
}

// 获取会话列表响应
export interface GetConversationsResponse {
  user_id: string;
  conversations: Array<{
    thread_id: string;
    title: string;
    intent: string;
    created_at: string;
    updated_at: string;
  }>;
  total: number;
}

// 获取会话列表参数
export interface GetConversationsParams {
  userId: string;
  limit?: number;
  offset?: number;
}

// 获取消息列表响应
export interface GetMessagesResponse {
  thread_id: string;
  messages: Array<{
    id: number;
    role: 'human' | 'ai' | 'system';
    content: string;
    created_at: string;
  }>;
}

// 更新会话标题响应
export interface UpdateTitleResponse {
  thread_id: string;
  title: string;
}

// 删除会话响应
export interface DeleteConversationResponse {
  thread_id: string;
}