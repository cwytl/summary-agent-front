// 会话管理 Hook

import { useState, useEffect, useCallback } from 'react';
import type { Session } from '../types/chat';

const STORAGE_KEY_SESSIONS = 'bili_agent_sessions';
const STORAGE_KEY_CURRENT = 'bili_agent_current_session_id';  // 使用 sessionStorage

export function useSessions() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  // 初始化：从 localStorage 加载会话列表，从 sessionStorage 加载当前ID
  useEffect(() => {
    // 会话列表用 localStorage（关闭浏览器后仍保留）
    const storedSessions = localStorage.getItem(STORAGE_KEY_SESSIONS);
    if (storedSessions) {
      try {
        const parsed = JSON.parse(storedSessions) as Session[];
        setSessions(parsed);
      } catch {
        setSessions([]);
      }
    }

    // 当前会话ID用 sessionStorage（关闭浏览器后清除）
    const storedCurrentId = sessionStorage.getItem(STORAGE_KEY_CURRENT);
    if (storedCurrentId) {
      setCurrentSessionId(storedCurrentId);
    }
  }, []);

  // 同步 sessions 到 localStorage
  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(sessions));
    } else {
      localStorage.removeItem(STORAGE_KEY_SESSIONS);
    }
  }, [sessions]);

  // 同步 currentSessionId 到 sessionStorage（关闭浏览器后清除）
  useEffect(() => {
    if (currentSessionId) {
      sessionStorage.setItem(STORAGE_KEY_CURRENT, currentSessionId);
    } else {
      sessionStorage.removeItem(STORAGE_KEY_CURRENT);
    }
  }, [currentSessionId]);

  // 添加新会话
  const addSession = useCallback((id: string, title: string) => {
    const now = Date.now();
    const newSession: Session = {
      id,
      title: title.slice(0, 20) + (title.length > 20 ? '...' : ''),
      createdAt: now,
      lastMessageAt: now,
    };

    setSessions(prev => {
      // 避免重复添加
      if (prev.some(s => s.id === id)) {
        return prev;
      }
      return [newSession, ...prev];
    });

    setCurrentSessionId(id);
  }, []);

  // 更新会话最后消息时间
  const updateSessionLastMessage = useCallback((id: string) => {
    setSessions(prev =>
      prev.map(s =>
        s.id === id ? { ...s, lastMessageAt: Date.now() } : s
      )
    );
  }, []);

  // 删除会话
  const deleteSession = useCallback((id: string) => {
    setSessions(prev => prev.filter(s => s.id !== id));

    // 如果删除的是当前会话，切换到第一个或 null
    if (currentSessionId === id) {
      const remaining = sessions.filter(s => s.id !== id);
      setCurrentSessionId(remaining.length > 0 ? remaining[0].id : null);
    }
  }, [currentSessionId, sessions]);

  // 切换会话
  const switchSession = useCallback((id: string) => {
    setCurrentSessionId(id);
  }, []);

  // 获取当前会话
  const currentSession = sessions.find(s => s.id === currentSessionId);

  return {
    sessions,
    currentSessionId,
    currentSession,
    setCurrentSessionId,
    addSession,
    updateSessionLastMessage,
    deleteSession,
    switchSession,
  };
}