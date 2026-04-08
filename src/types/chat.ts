// 聊天相关类型定义

//对话消息结构-存储页面中的每一条消息
export interface Message {
  role: 'user' | 'assistant';
  content: string;
  progressData?: ProgressDataForMessage;
}

// 消息的进度数据
export interface ProgressDataForMessage {
  intent?: {
    name: string;
    status: 'pending' | 'running' | 'completed';
    message: string;
    steps: {
      index: number;
      status: 'running' | 'completed' | 'error';
      message: string;
    }[];
  } | null;
  planner?: {
    name: string;
    status: 'pending' | 'running' | 'completed';
    message: string;
    steps: {
      index: number;
      status: 'running' | 'completed' | 'error';
      message: string;
    }[];
  } | null;
  plan: string[];
  worker: {
    name: string;
    status: 'pending' | 'running' | 'completed';
    message: string;
    steps: {
      index: number;
      status: 'running' | 'completed' | 'error';
      message: string;
    }[];
  }[];
}


//发送给后端的请求参数
export interface ChatRequest {
  query: string;
  user_id: string;
  thread_id: string | null;
}


//处理流式响应的回调函数集合
export interface ChatStreamCallbacks {
  onThreadId: (threadId: string) => void;
  onPlan: (plan: string[]) => void;
  onNodeRunning: (nodeName: string, message: string) => void;
  onNodeCompleted: (nodeName: string, message: string) => void;
  onStepRunning: (stepIndex: number, message: string) => void;
  onStepCompleted: (stepIndex: number, message: string) => void;
  onStepError: (stepIndex: number, message: string) => void;
  onContent: (content: string) => void;
  onError: (error: Error) => void;
  onCancelled: () => void;
  onConfirm?: (action: string, message: string) => void;
}


//会话结构-用于会话列表管理
export interface Session {
  id: string;              // thread_id
  title: string;           // 用户第一条消息（截取前20字符）
  createdAt: number;       // 创建时间戳
  lastMessageAt: number;   // 最后消息时间戳
}


//历史消息记录项
export interface HistoryItem {
  type: 'human' | 'ai';
  content: string;
}

//历史记录响应
export interface HistoryResponse {
  thread_id: string;
  history: HistoryItem[];
}