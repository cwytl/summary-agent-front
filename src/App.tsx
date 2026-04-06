import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { ProgressPanel } from './components/ProgressPanel';
import type { ProgressData } from './components/ProgressPanel';
import { sendChatStream, getHistory, stopChat, confirmZhihuLogin } from './api/chat';
import type { Message } from './types/chat';
import { useSessions } from './hooks/useSessions';

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
          Bili Agent
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
      padding: '50px 20px 150px',  // 顶部增加距离，底部留出输入框空间
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

              {/* 内容区域 - 垂直布局 */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {/* 消息气泡 - 固定宽度 */}
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
                        color: msg.role === 'user' ? '#1E293B' : '#1E293B',
                        border: msg.role === 'user' ? 'none' : '1px solid #e2e8f0',
                        whiteSpace: 'pre-wrap',
                        textAlign: 'left',
                        fontSize: '15px',
                        lineHeight: '1.6',
                        boxShadow: msg.role === 'user' ? 'none' : 'none',
                      }}>
                        {msg.content}
                      </div>
                    )
                  )}
                </div>

                {/* 进度面板 */}
                {msg.role === 'assistant' && (() => {
                  // 最后一条消息且正在输入，使用实时进度
                  if (isLastAssistantMessage && isTyping) {
                    return (progressData.intent || progressData.planner || progressData.plan.length > 0 || progressData.worker.length > 0) ? (
                      <div style={{ width: '680px', marginTop: '8px' }}>
                        <ProgressPanel data={progressData} isLive={true} onExpand={scrollToBottom} />
                      </div>
                    ) : null;
                  }
                  // 历史消息，使用消息自带的进度数据
                  if (msg.progressData && (msg.progressData.intent || msg.progressData.planner || msg.progressData.plan.length > 0 || msg.progressData.worker.length > 0)) {
                    // 转换为 ProgressPanel 需要的格式
                    const msgProgressData: ProgressData = {
                      totalNodes: (msg.progressData.intent ? 1 : 0) + (msg.progressData.planner ? 1 : 0) + (msg.progressData.worker.length > 0 ? 1 : 0),
                      intent: msg.progressData.intent ? { ...msg.progressData.intent, steps: [] } : null,
                      planner: msg.progressData.planner ? { ...msg.progressData.planner, steps: [] } : null,
                      plan: msg.progressData.plan,
                      worker: msg.progressData.worker,
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

function App() {
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

  // 用于保存最新的进度数据（在异步操作中访问）
  const progressDataRef = useRef(progressData);

  // 自定义 setProgressData，同时更新 state 和 ref
  const setProgressData = (data: React.SetStateAction<ProgressData>) => {
    setProgressDataState(prev => {
      const newData = typeof data === 'function' ? data(prev) : data;
      progressDataRef.current = newData;
      return newData;
    });
  };

  // --- 确认弹窗状态 ---
  const [confirmDialog, setConfirmDialog] = useState<{
    visible: boolean;
    action: string;
    message: string;
  }>({ visible: false, action: '', message: '' });

  // 用户是否在底部附近（允许自动滚动）
  const [isNearBottom, setIsNearBottom] = useState(true);

  // 滚动到底部的函数
  const scrollToBottom = () => {
    const scrollContainer = document.querySelector('[data-scroll-container]');
    if (scrollContainer) {
      scrollContainer.scrollTop = scrollContainer.scrollHeight;
      setIsNearBottom(true);
    }
  };

  // 监听用户滚动行为
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

  // 自动滚动到底部（仅在用户在底部时）
  useEffect(() => {
    if (isNearBottom) {
      scrollToBottom();
    }
  }, [messages, progressData, isNearBottom]);

  // --- 会话管理 ---
  const {
    sessions,
    currentSessionId,
    currentSession,
    setCurrentSessionId,
    addSession,
    updateSessionLastMessage,
    deleteSession,
  } = useSessions();

  // 是否处于欢迎模式（未选中会话且没有消息）
  const isWelcomeMode = !currentSessionId && messages.length === 0;

  // 初始化时：如果已有 currentSessionId，自动加载历史消息
  useEffect(() => {
    if (currentSessionId && messages.length === 0) {
      getHistory(currentSessionId).then(result => {
        setMessages(result.messages);
        setProgressData(result.progressData);
      }).catch(error => {
        console.error('加载历史消息失败:', error);
      });
    }
  }, [currentSessionId]);

  // 新建对话逻辑 - 回到欢迎页面
  const startNewChat = () => {
    setMessages([]);
    setCurrentSessionId(null);
    setProgressData({ totalNodes: 0, intent: null, planner: null, plan: [], worker: [] });
  };

  // 切换会话时加载历史消息
  const handleSelectSession = async (id: string) => {
    setCurrentSessionId(id);
    setProgressData({ totalNodes: 0, intent: null, planner: null, plan: [], worker: [] });

    try {
      const result = await getHistory(id);
      setMessages(result.messages);
      setProgressData(result.progressData);
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
        user_id: "react_ts_user",
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
          // PLAN 数据存储到 plan 字段
          setProgressData(prev => ({ ...prev, plan: planData }));
        },
        onNodeRunning: (nodeName, message) => {
          setProgressData(prev => {
            let newTotalNodes = prev.totalNodes;

            // intent 单独处理
            if (nodeName === 'intent') {
              // 如果是新节点，增加计数
              if (!prev.intent) {
                newTotalNodes += 1;
              }
              return {
                ...prev,
                totalNodes: newTotalNodes,
                intent: { name: nodeName, status: 'running', message, steps: [] },
              };
            }
            // planner 单独处理
            if (nodeName === 'planner') {
              // 如果是新节点，增加计数
              if (!prev.planner) {
                newTotalNodes += 1;
              }
              return {
                ...prev,
                totalNodes: newTotalNodes,
                planner: { name: nodeName, status: 'running', message, steps: [] },
              };
            }
            // 其他节点放到 worker
            const existingIndex = prev.worker.findIndex(n => n.name === nodeName);
            if (existingIndex !== -1) {
              // 已存在的节点，只更新状态
              const newWorker = [...prev.worker];
              newWorker[existingIndex] = { ...newWorker[existingIndex], status: 'running', message };
              return { ...prev, worker: newWorker };
            }
            // 新节点，增加计数
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

    // 流式完成后，把进度数据保存到最后一条消息
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

  // 停止/中断对话
  const handleStop = async () => {
    if (!currentSessionId) return;

    try {
      await stopChat(currentSessionId);
      setIsTyping(false);
    } catch (error) {
      console.error('停止请求失败:', error);
    }
  };

  // 处理确认弹窗
  const handleConfirm = async () => {
    try {
      await confirmZhihuLogin();
      setConfirmDialog({ visible: false, action: '', message: '' });
    } catch (error) {
      console.error('确认失败:', error);
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#fff' }}>
      {/* 左侧会话列表 - 固定 */}
      <Sidebar
        sessions={sessions}
        currentSessionId={currentSessionId}
        onNewSession={startNewChat}
        onSelectSession={handleSelectSession}
        onDeleteSession={deleteSession}
      />

      {/* 右侧内容区域 */}
      <div style={{ flex: 1, paddingRight: '10px', position: 'relative' }}>
        <div
          data-scroll-container
          style={{
            height: '100%',
            overflowY: 'scroll',
            position: 'relative',
          }}
        >
        {/* 会话标题 - 固定在左上角 */}
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

      {/* 输入框 - absolute 定位在外层容器底部（非欢迎模式） */}
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
            marginRight:'70px',
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

      {/* 滚动到底部按钮 - 定位在发送按钮上方 */}
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
    </div>
  );
}

export default App;