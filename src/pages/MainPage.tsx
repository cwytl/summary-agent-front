// 主页面（聊天页面）

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { ProgressPanel } from '../components/ProgressPanel';
import { UserMenu } from '../components/UserMenu';
import { LoginDialog } from '../components/LoginDialog';
import { Toast } from '../components/Toast';
import type { ProgressData } from '../components/ProgressPanel';
import { sendChatStream, stopChat, confirmZhihuLogin } from '../api/chat';
import { loginUser, registerUser } from '../api/user';
import { getMessages, updateConversationTitle, deleteConversation } from '../api/conversation';
import type { Message } from '../types/chat';
import { useSessions } from '../hooks/useSessions';
import { useUser } from '../context/UserContext';

// --- 欢迎页面组件 ---
function WelcomePage({
  input,
  setInput,
  handleSend,
  handleStop,
  isTyping,
}: {
  input: string;
  setInput: (value: string) => void;
  handleSend: () => void;
  handleStop: () => void;
  isTyping: boolean;
}) {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '40px 20px',
      fontFamily: 'Inter, system-ui, sans-serif',
      transform: 'translateY(-100px)',
    }}>
      {/* 欢迎标题 */}
      <div style={{ textAlign: 'center', marginBottom: '60px' }}>
        <h1 style={{
          margin: 0,
          color: '#1a1a1a',
          fontSize: '42px',
          fontWeight: 700,
          letterSpacing: '-1px',
        }}>
          Summary Agent
        </h1>
        <p style={{
          margin: '16px 0 0',
          color: '#64748b',
          fontSize: '18px',
        }}>
          智能探索 B 站内容，一键总结视频精华
        </p>
      </div>

      {/* 示例提示 */}
      <div style={{
        display: 'flex',
        gap: '16px',
        marginBottom: '40px',
        flexWrap: 'wrap',
        justifyContent: 'center',
      }}>
        {[
          '帮我总结最近收藏的5个视频',
          '分析这个视频的主要观点',
          '推荐类似风格的视频',
        ].map((example, idx) => (
          <div
            key={idx}
            onClick={() => setInput(example)}
            style={{
              padding: '12px 20px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              fontSize: '14px',
              color: '#475569',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {example}
          </div>
        ))}
      </div>

      {/* 居中输入框 */}
      <div style={{
        width: '100%',
        maxWidth: '600px',
        display: 'flex',
        gap: '12px',
        background: '#fff',
        padding: '12px',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
      }}>
        <input
          style={{
            flex: 1,
            padding: '12px 16px',
            border: 'none',
            fontSize: '16px',
            outline: 'none',
            background: 'transparent',
          }}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
              handleSend();
            }
          }}
          placeholder="告诉我想做什么..."
          autoFocus
        />
        <button
          onClick={isTyping ? handleStop : handleSend}
          disabled={!isTyping && !input.trim()}
          style={{
            padding: '12px 28px',
            background: isTyping ? '#ef4444' : (!input.trim() ? '#cbd5e1' : '#0F172A'),
            color: '#fff',
            border: 'none',
            borderRadius: '12px',
            cursor: (!isTyping && !input.trim()) ? 'not-allowed' : 'pointer',
            fontWeight: 600,
            fontSize: '15px',
            transition: 'background 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          {isTyping ? (
            <span style={{
              width: '14px',
              height: '14px',
              borderRadius: '2px',
              background: '#fff',
            }} />
          ) : '发送'}
        </button>
      </div>
    </div>
  );
}

// --- 聊天页面组件 ---
function ChatPage({
  isTyping,
  messages,
  progressData,
  scrollToBottom,
}: {
  isTyping: boolean;
  messages: Message[];
  progressData: ProgressData;
  scrollToBottom: () => void;
}) {
  return (
    <div style={{
      padding: '50px 20px 150px',
      boxSizing: 'border-box',
      fontFamily: 'Inter, system-ui, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    }}>
      {/* 消息展示区域 */}
      <div style={{
        width: '800px',
        display: 'flex',
        flexDirection: 'column',
        gap: '32px',
        marginLeft: '-20px',
      }}>
        {messages.map((msg, index) => {
          const isLastAssistantMessage = msg.role === 'assistant' && index === messages.length - 1;

          return (
            <div key={index} style={{
              width: '90%',
              display: 'flex',
              justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
              alignItems: 'flex-start',
              gap: '10px',
            }}>
              {/* AI 头像 */}
              {msg.role === 'assistant' && (
                <img
                  src="/agent.png"
                  alt="AI"
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '5%',
                    flexShrink: 0,
                  }}
                />
              )}

              {/* 内容区域 */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ width: 'fit-content', minWidth: '80px' }}>
                  {msg.role === 'assistant' && isLastAssistantMessage && isTyping && !msg.content ? (
                    <div style={{
                      padding: '14px 20px',
                      borderRadius: '18px',
                      backgroundColor: '#ffffff',
                      border: '1px solid #e2e8f0',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}>
                      <span style={{ fontSize: '14px', color: '#64748b' }}>思考中</span>
                      <span style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: '#94a3b8',
                        animation: 'typing-bounce 1.4s infinite ease-in-out both',
                      }} />
                      <span style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: '#94a3b8',
                        animation: 'typing-bounce 1.4s infinite ease-in-out both',
                        animationDelay: '0.2s',
                      }} />
                      <span style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: '#94a3b8',
                        animation: 'typing-bounce 1.4s infinite ease-in-out both',
                        animationDelay: '0.4s',
                      }} />
                      <style>{`
                        @keyframes typing-bounce {
                          0%, 80%, 100% { transform: scale(0.6); opacity: 0.5; }
                          40% { transform: scale(1); opacity: 1; }
                        }
                      `}</style>
                    </div>
                  ) : (
                    msg.content && (
                      <div style={{
                        padding: '14px 20px',
                        borderRadius: '18px',
                        backgroundColor: msg.role === 'user' ? '#f1f5f9' : '#ffffff',
                        color: '#1E293B',
                        border: msg.role === 'user' ? 'none' : '1px solid #e2e8f0',
                        whiteSpace: 'pre-wrap',
                        textAlign: 'left',
                        fontSize: '15px',
                        lineHeight: '1.6',
                      }}>
                        {msg.content}
                      </div>
                    )
                  )}
                </div>

                {/* 进度面板 */}
                {msg.role === 'assistant' && (() => {
                  if (isLastAssistantMessage && isTyping) {
                    return (progressData.intent || progressData.planner || progressData.plan.length > 0 || progressData.worker.length > 0) ? (
                      <div style={{ width: '680px', marginTop: '8px' }}>
                        <ProgressPanel data={progressData} isLive={true} onExpand={scrollToBottom} />
                      </div>
                    ) : null;
                  }
                  if (msg.progressData && (msg.progressData.intent || msg.progressData.planner || msg.progressData.plan.length > 0 || msg.progressData.worker.length > 0)) {
                    const msgProgressData: ProgressData = {
                      totalNodes: (msg.progressData.intent ? 1 : 0) + (msg.progressData.planner ? 1 : 0) + (msg.progressData.worker.length > 0 ? 1 : 0),
                      intent: msg.progressData.intent ? { ...msg.progressData.intent } : null,
                      planner: msg.progressData.planner ? { ...msg.progressData.planner } : null,
                      plan: msg.progressData.plan,
                      worker: msg.progressData.worker.map(w => ({ ...w, steps: [...w.steps] })),
                    };
                    return (
                      <div style={{ width: '680px', marginTop: '8px' }}>
                        <ProgressPanel data={msgProgressData} isLive={false} />
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function MainPage() {
  const navigate = useNavigate();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  // --- 进度状态 ---
  const [progressData, setProgressDataState] = useState<ProgressData>({
    totalNodes: 0,
    intent: null,
    planner: null,
    plan: [],
    worker: [],
  });

  const progressDataRef = useRef(progressData);

  const setProgressData = (data: React.SetStateAction<ProgressData>) => {
    setProgressDataState(prev => {
      const newData = typeof data === 'function' ? data(prev) : data;
      progressDataRef.current = newData;
      return newData;
    });
  };

  // --- 弹窗状态 ---
  const [confirmDialog, setConfirmDialog] = useState<{
    visible: boolean;
    action: string;
    message: string;
  }>({ visible: false, action: '', message: '' });

  const [loginDialogVisible, setLoginDialogVisible] = useState(false);

  // 修改标题弹窗
  const [editTitleDialog, setEditTitleDialog] = useState<{
    visible: boolean;
    sessionId: string;
    currentTitle: string;
    newTitle: string;
  }>({ visible: false, sessionId: '', currentTitle: '', newTitle: '' });

  // 删除确认弹窗
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState<{
    visible: boolean;
    sessionId: string;
    sessionTitle: string;
  }>({ visible: false, sessionId: '', sessionTitle: '' });

  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    type: 'success' | 'error';
  }>({ visible: false, message: '', type: 'success' });

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ visible: true, message, type });
  };

  // --- 用户状态 ---
  const { user, isLoggedIn, login, logout } = useUser();

  // --- 会话管理 ---
  const {
    sessions,
    currentSessionId,
    currentSession,
    setCurrentSessionId,
    addSession,
    updateSessionLastMessage,
    updateSessionTitle,
    deleteSession,
    loadSessionsFromServer,
  } = useSessions();

  // 用户已登录时加载会话列表
  useEffect(() => {
    if (isLoggedIn && user?.id) {
      loadSessionsFromServer(user.id);
    }
  }, [isLoggedIn, user?.id, loadSessionsFromServer]);

  // --- 滚动状态 ---
  const [isNearBottom, setIsNearBottom] = useState(true);

  const scrollToBottom = () => {
    const scrollContainer = document.querySelector('[data-scroll-container]');
    if (scrollContainer) {
      scrollContainer.scrollTop = scrollContainer.scrollHeight;
      setIsNearBottom(true);
    }
  };

  useEffect(() => {
    const scrollContainer = document.querySelector('[data-scroll-container]');
    if (!scrollContainer) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
      const nearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setIsNearBottom(nearBottom);
    };

    scrollContainer.addEventListener('scroll', handleScroll);
    return () => scrollContainer.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (isNearBottom) {
      scrollToBottom();
    }
  }, [messages, progressData, isNearBottom]);

  const isWelcomeMode = !currentSessionId && messages.length === 0;

  useEffect(() => {
    if (currentSessionId && messages.length === 0) {
      getMessages(currentSessionId).then(conversationMessages => {
        // 转换消息格式
        const msgs: Message[] = conversationMessages
          .filter(msg => msg.role !== 'system')
          .map(msg => ({
            role: msg.role === 'human' ? 'user' : 'assistant',
            content: msg.content,
          }));
        setMessages(msgs);
      }).catch(error => {
        console.error('加载历史消息失败:', error);
      });
    }
  }, [currentSessionId]);

  const startNewChat = () => {
    setMessages([]);
    setCurrentSessionId(null);
    setProgressData({ totalNodes: 0, intent: null, planner: null, plan: [], worker: [] });
  };

  const handleSelectSession = async (id: string) => {
    setCurrentSessionId(id);
    setProgressData({ totalNodes: 0, intent: null, planner: null, plan: [], worker: [] });

    try {
      const conversationMessages = await getMessages(id);
      // 转换消息格式：human -> user, ai -> assistant，跳过 system
      const messages: Message[] = conversationMessages
        .filter(msg => msg.role !== 'system')
        .map(msg => ({
          role: msg.role === 'human' ? 'user' : 'assistant',
          content: msg.content,
        }));
      setMessages(messages);
    } catch (error) {
      console.error('获取历史记录失败:', error);
      setMessages([]);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userQuery = input;
    setInput('');
    setIsTyping(true);
    setProgressData({ totalNodes: 0, intent: null, planner: null, plan: [], worker: [] });

    setMessages(prev => [...prev, { role: 'user', content: userQuery }]);
    setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

    await sendChatStream(
      {
        query: userQuery,
        user_id: user?.id || "anonymous",
        thread_id: currentSessionId
      },
      {
        onThreadId: (id) => {
          if (!currentSessionId) {
            addSession(id, userQuery);
          }
          setCurrentSessionId(id);
        },
        onPlan: (planData: string[]) => {
          setProgressData(prev => ({ ...prev, plan: planData }));
        },
        onNodeRunning: (nodeName, message) => {
          setProgressData(prev => {
            let newTotalNodes = prev.totalNodes;

            if (nodeName === 'intent') {
              if (!prev.intent) {
                newTotalNodes += 1;
              }
              return {
                ...prev,
                totalNodes: newTotalNodes,
                intent: { name: nodeName, status: 'running', message, steps: [] },
              };
            }
            if (nodeName === 'planner') {
              if (!prev.planner) {
                newTotalNodes += 1;
              }
              return {
                ...prev,
                totalNodes: newTotalNodes,
                planner: { name: nodeName, status: 'running', message, steps: [] },
              };
            }
            const existingIndex = prev.worker.findIndex(n => n.name === nodeName);
            if (existingIndex !== -1) {
              const newWorker = [...prev.worker];
              newWorker[existingIndex] = { ...newWorker[existingIndex], status: 'running', message };
              return { ...prev, worker: newWorker };
            }
            return {
              ...prev,
              totalNodes: prev.totalNodes + 1,
              worker: [...prev.worker, { name: nodeName, status: 'running', message, steps: [] }],
            };
          });
        },
        onNodeCompleted: (nodeName, message) => {
          setProgressData(prev => {
            if (nodeName === 'intent') {
              return {
                ...prev,
                intent: prev.intent ? { ...prev.intent, status: 'completed', message } : null,
              };
            }
            if (nodeName === 'planner') {
              return {
                ...prev,
                planner: prev.planner ? { ...prev.planner, status: 'completed', message } : null,
              };
            }
            const newWorker = [...prev.worker];
            const nodeIndex = newWorker.findIndex(n => n.name === nodeName);
            if (nodeIndex !== -1) {
              newWorker[nodeIndex] = { ...newWorker[nodeIndex], status: 'completed', message };
            }
            return { ...prev, worker: newWorker };
          });
        },
        onStepRunning: (stepIndex, message) => {
          setProgressData(prev => {
            const newWorker = [...prev.worker];
            const runningNode = newWorker.find(n => n.status === 'running');
            if (runningNode) {
              const stepIndexInNode = runningNode.steps.findIndex(s => s.index === stepIndex);
              if (stepIndexInNode !== -1) {
                runningNode.steps[stepIndexInNode] = { index: stepIndex, status: 'running', message };
              } else {
                runningNode.steps.push({ index: stepIndex, status: 'running', message });
              }
            }
            return { ...prev, worker: newWorker };
          });
        },
        onStepCompleted: (stepIndex, message) => {
          setProgressData(prev => {
            const newWorker = [...prev.worker];
            const runningNode = newWorker.find(n => n.status === 'running');
            if (runningNode) {
              const stepIndexInNode = runningNode.steps.findIndex(s => s.index === stepIndex);
              if (stepIndexInNode !== -1) {
                runningNode.steps[stepIndexInNode] = { index: stepIndex, status: 'completed', message };
              }
            }
            return { ...prev, worker: newWorker };
          });
        },
        onStepError: (stepIndex, message) => {
          setProgressData(prev => {
            const newWorker = [...prev.worker];
            const runningNode = newWorker.find(n => n.status === 'running');
            if (runningNode) {
              const stepIndexInNode = runningNode.steps.findIndex(s => s.index === stepIndex);
              if (stepIndexInNode !== -1) {
                runningNode.steps[stepIndexInNode] = { index: stepIndex, status: 'error', message };
              }
            }
            return { ...prev, worker: newWorker };
          });
        },
        onContent: (content) => {
          setMessages(prev => {
            const newMessages = [...prev];
            if (newMessages.length > 0) {
              newMessages[newMessages.length - 1].content = content;
            }
            return newMessages;
          });
          if (currentSessionId) {
            updateSessionLastMessage(currentSessionId);
          }
        },
        onError: (error) => {
          console.error('Streaming Error:', error);
          setMessages(prev => {
            const newMessages = [...prev];
            newMessages[newMessages.length - 1].content = '⚠️ 连接失败，请检查后端。';
            return newMessages;
          });
        },
        onCancelled: () => {
          setMessages(prev => {
            const newMessages = [...prev];
            const lastMessage = newMessages[newMessages.length - 1];
            if (lastMessage && lastMessage.role === 'assistant' && !lastMessage.content) {
              lastMessage.content = '请求已中断';
            }
            return newMessages;
          });
        },
        onConfirm: (action, message) => {
          setConfirmDialog({ visible: true, action, message });
        }
      }
    );

    const currentProgress = progressDataRef.current;
    setMessages(prev => {
      const newMessages = [...prev];
      const lastMessage = newMessages[newMessages.length - 1];
      if (lastMessage && lastMessage.role === 'assistant') {
        lastMessage.progressData = {
          intent: currentProgress.intent ? { ...currentProgress.intent } : null,
          planner: currentProgress.planner ? { ...currentProgress.planner } : null,
          plan: [...currentProgress.plan],
          worker: currentProgress.worker.map(w => ({ ...w, steps: [...w.steps] })),
        };
      }
      return newMessages;
    });

    setIsTyping(false);
  };

  const handleStop = async () => {
    if (!currentSessionId) return;

    try {
      await stopChat(currentSessionId);
      setIsTyping(false);
    } catch (error) {
      console.error('停止请求失败:', error);
    }
  };

  const handleConfirm = async () => {
    try {
      await confirmZhihuLogin();
      setConfirmDialog({ visible: false, action: '', message: '' });
    } catch (error) {
      console.error('确认失败:', error);
    }
  };

  const handleLogin = async (phone: string, password: string): Promise<boolean> => {
    try {
      const user = await loginUser(phone, password);
      login(user);
      // 加载用户会话列表
      loadSessionsFromServer(user.id);
      showToast('登录成功', 'success');
      return true;
    } catch (error) {
      console.error('登录失败:', error);
      throw error;
    }
  };

  const handleRegister = async (phone: string, password: string): Promise<boolean> => {
    try {
      const user = await registerUser(phone, password);
      login(user);
      showToast('注册成功', 'success');
      return true;
    } catch (error) {
      console.error('注册失败:', error);
      throw error;
    }
  };

  // 处理修改标题
  const handleUpdateTitle = (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      setEditTitleDialog({
        visible: true,
        sessionId,
        currentTitle: session.title.replace(/\.\.\.$/, ''), // 移除省略号
        newTitle: session.title.replace(/\.\.\.$/, ''),
      });
    }
  };

  // 确认修改标题
  const handleConfirmUpdateTitle = async () => {
    const { sessionId, newTitle } = editTitleDialog;
    if (!newTitle.trim()) {
      showToast('标题不能为空', 'error');
      return;
    }

    try {
      await updateConversationTitle(sessionId, newTitle.trim());
      updateSessionTitle(sessionId, newTitle.trim());
      setEditTitleDialog({ visible: false, sessionId: '', currentTitle: '', newTitle: '' });
      showToast('标题已更新', 'success');
    } catch (error) {
      console.error('更新标题失败:', error);
      showToast('更新标题失败', 'error');
    }
  };

  // 删除会话 - 打开确认弹窗
  const handleDeleteSession = (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    setDeleteConfirmDialog({
      visible: true,
      sessionId,
      sessionTitle: session?.title || '',
    });
  };

  // 确认删除会话
  const handleConfirmDelete = async () => {
    const { sessionId } = deleteConfirmDialog;
    try {
      await deleteConversation(sessionId);
      deleteSession(sessionId);
      setDeleteConfirmDialog({ visible: false, sessionId: '', sessionTitle: '' });
      showToast('会话已删除', 'success');
    } catch (error) {
      console.error('删除会话失败:', error);
      showToast('删除会话失败', 'error');
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#fff' }}>
      {/* 左侧会话列表 */}
      <Sidebar
        sessions={sessions}
        currentSessionId={currentSessionId}
        onNewSession={startNewChat}
        onSelectSession={handleSelectSession}
        onDeleteSession={handleDeleteSession}
        onUpdateTitle={handleUpdateTitle}
      />

      {/* 右侧内容区域 */}
      <div style={{ flex: 1, paddingRight: '10px', position: 'relative' }}>
        {/* 用户菜单 - 右上角 */}
        <div style={{
          position: 'absolute',
          top: '16px',
          right: '20px',
          zIndex: 50,
        }}>
          <UserMenu
            user={user}
            isLoggedIn={isLoggedIn}
            onLoginClick={() => setLoginDialogVisible(true)}
            onLogout={logout}
            onProfileClick={() => navigate('/profile')}
          />
        </div>

        <div
          data-scroll-container
          style={{
            height: '100%',
            overflowY: 'scroll',
            position: 'relative',
          }}
        >
          {/* 会话标题 */}
          {!isWelcomeMode && (
            <div style={{
              position: 'sticky',
              top: '0',
              left: '0',
              padding: '16px 20px',
              background: '#fff',
              zIndex: 10,
            }}>
              <h2 style={{
                margin: 0,
                fontSize: '18px',
                fontWeight: 600,
                color: '#1E293B',
              }}>
                {currentSession?.title || '新对话'}
              </h2>
            </div>
          )}
          {isWelcomeMode ? (
            <WelcomePage
              input={input}
              setInput={setInput}
              handleSend={handleSend}
              handleStop={handleStop}
              isTyping={isTyping}
            />
          ) : (
            <ChatPage
              isTyping={isTyping}
              messages={messages}
              progressData={progressData}
              scrollToBottom={scrollToBottom}
            />
          )}
        </div>

        {/* 输入框 */}
        {!isWelcomeMode && (
          <div style={{
            position: 'absolute',
            bottom: '0',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '1000px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            zIndex: 100,
            padding: '16px 0 10px',
            background: '#fff',
          }}>
            <div style={{
              width: '750px',
              background: '#fff',
              padding: '16px',
              borderRadius: '14px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              display: 'flex',
              gap: '12px',
              marginRight: '70px',
            }}>
              <input
                style={{ flex: 1, padding: '14px 16px', border: 'none', fontSize: '16px', outline: 'none', background: 'transparent' }}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                    handleSend();
                  }
                }}
                placeholder="继续对话..."
              />
              <button
                onClick={isTyping ? handleStop : handleSend}
                style={{
                  padding: '14px 20px',
                  background: isTyping ? '#ef4444' : '#0F172A',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  transition: 'background 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                {isTyping ? (
                  <span style={{
                    width: '14px',
                    height: '14px',
                    borderRadius: '2px',
                    background: '#fff',
                  }} />
                ) : '发送'}
              </button>
            </div>
            <div style={{
              width: '800px',
              textAlign: 'center',
              padding: '8px 0',
              fontSize: '12px',
              color: '#94a3b8',
              marginRight: '85px',
            }}>
              内容由AI生成，请仔细甄别
            </div>
          </div>
        )}

        {/* 滚动到底部按钮 */}
        {!isWelcomeMode && !isNearBottom && (
          <div
            onClick={scrollToBottom}
            style={{
              position: 'absolute',
              bottom: '150px',
              right: '280px',
              width: '36px',
              height: '36px',
              background: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: '50%',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              cursor: 'pointer',
              color: '#64748b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 50,
            }}
          >
            <span style={{ fontSize: '18px' }}>↓</span>
          </div>
        )}

        {/* 确认弹窗 */}
        {confirmDialog.visible && (
          <div style={{
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
          }}>
            <div style={{
              background: '#fff',
              padding: '24px',
              borderRadius: '12px',
              maxWidth: '400px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
            }}>
              <p style={{ margin: '0 0 20px', fontSize: '15px', color: '#334155', lineHeight: '1.6' }}>
                {confirmDialog.message}
              </p>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  onClick={() => setConfirmDialog({ visible: false, action: '', message: '' })}
                  style={{
                    padding: '10px 20px',
                    background: '#f1f5f9',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    color: '#64748b',
                  }}
                >
                  取消
                </button>
                <button
                  onClick={handleConfirm}
                  style={{
                    padding: '10px 20px',
                    background: '#0F172A',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 600,
                  }}
                >
                  确认
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 登录弹窗 */}
      <LoginDialog
        visible={loginDialogVisible}
        onClose={() => setLoginDialogVisible(false)}
        onLogin={handleLogin}
        onRegister={handleRegister}
      />

      {/* 修改标题弹窗 */}
      {editTitleDialog.visible && (
        <div style={{
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
        }}>
          <div style={{
            background: '#fff',
            padding: '24px',
            borderRadius: '12px',
            width: '400px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
          }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: 600, color: '#1e293b' }}>
              修改会话标题
            </h3>
            <input
              type="text"
              value={editTitleDialog.newTitle}
              onChange={(e) => setEditTitleDialog(prev => ({ ...prev, newTitle: e.target.value }))}
              placeholder="请输入新标题"
              maxLength={256}
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
              autoFocus
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
              <button
                onClick={() => setEditTitleDialog({ visible: false, sessionId: '', currentTitle: '', newTitle: '' })}
                style={{
                  padding: '10px 20px',
                  background: '#f1f5f9',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  color: '#64748b',
                }}
              >
                取消
              </button>
              <button
                onClick={handleConfirmUpdateTitle}
                style={{
                  padding: '10px 20px',
                  background: '#0f172a',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 600,
                }}
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 删除确认弹窗 */}
      {deleteConfirmDialog.visible && (
        <div style={{
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
        }}>
          <div style={{
            background: '#fff',
            padding: '24px',
            borderRadius: '12px',
            width: '400px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
          }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: 600, color: '#1e293b' }}>
              删除会话
            </h3>
            <p style={{ margin: '0', fontSize: '15px', color: '#475569', lineHeight: '1.6' }}>
              确定要删除会话「{deleteConfirmDialog.sessionTitle}」吗？删除后无法恢复。
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
              <button
                onClick={() => setDeleteConfirmDialog({ visible: false, sessionId: '', sessionTitle: '' })}
                style={{
                  padding: '10px 20px',
                  background: '#f1f5f9',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  color: '#64748b',
                }}
              >
                取消
              </button>
              <button
                onClick={handleConfirmDelete}
                style={{
                  padding: '10px 20px',
                  background: '#dc2626',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 600,
                }}
              >
                删除
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast 提示 */}
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, visible: false })}
      />
    </div>
  );
}