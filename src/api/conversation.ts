// 会话相关 API

import type { Conversation, GetConversationsResponse, GetConversationsParams, ConversationMessage, GetMessagesResponse, UpdateTitleResponse, DeleteConversationResponse } from '../types/conversation';

const BASE_URL = 'http://127.0.0.1:9000';
const API_BASE_URL = `${BASE_URL}/api/v1`;

// 获取用户会话列表
export async function getConversations(params: GetConversationsParams): Promise<{
  conversations: Conversation[];
  total: number;
}> {
  const { userId, limit = 10, offset = 0 } = params;
  const url = `${API_BASE_URL}/conversations/${userId}?limit=${limit}&offset=${offset}`;

  const response = await fetch(url);

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('用户不存在');
    }
    throw new Error('服务器错误，请稍后重试');
  }

  const data: GetConversationsResponse = await response.json();

  // 转换为 Conversation 类型
  const conversations: Conversation[] = data.conversations.map((item) => ({
    id: item.thread_id,
    title: item.title,
    intent: item.intent,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
  }));

  return {
    conversations,
    total: data.total,
  };
}

// 获取会话消息列表
export async function getMessages(threadId: string): Promise<ConversationMessage[]> {
  const response = await fetch(`${API_BASE_URL}/messages/${threadId}`);

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('会话不存在');
    }
    throw new Error('服务器错误，请稍后重试');
  }

  const data: GetMessagesResponse = await response.json();

  // 转换为 ConversationMessage 类型
  return data.messages.map((msg) => ({
    id: msg.id,
    role: msg.role,
    content: msg.content,
    createdAt: msg.created_at,
  }));
}

// 更新会话标题
export async function updateConversationTitle(threadId: string, title: string): Promise<{ threadId: string; title: string }> {
  const response = await fetch(`${API_BASE_URL}/conversation/${threadId}/title`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('会话不存在');
    }
    throw new Error('服务器错误，请稍后重试');
  }

  const data: UpdateTitleResponse = await response.json();
  return {
    threadId: data.thread_id,
    title: data.title,
  };
}

// 删除会话
export async function deleteConversation(threadId: string): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/conversation/${threadId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('会话不存在');
    }
    throw new Error('服务器错误，请稍后重试');
  }

  const data: DeleteConversationResponse = await response.json();
  return data.thread_id;
}