// 聊天相关 API

import type { ChatRequest, ChatStreamCallbacks, HistoryResponse, Message, ProgressDataForMessage } from '../types/chat';
import type { ProgressData } from '../components/ProgressPanel';

const BASE_URL = 'http://127.0.0.1:9000';
const API_BASE_URL = `${BASE_URL}/api/v1`;

export async function sendChatStream(
  request: ChatRequest,
  callbacks: ChatStreamCallbacks
): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    if (!response.body) {
      throw new Error('Response body is null');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let accumulatedContent = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');

      for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine) continue;

        // 1. THREAD_ID
        if (trimmedLine.startsWith('data: [THREAD_ID]:')) {
          callbacks.onThreadId(trimmedLine.replace('data: [THREAD_ID]:', ''));
          continue;
        }

        // 2. CANCELLED
        if (trimmedLine.includes('[CANCELLED]')) {
          callbacks.onCancelled();
          continue;
        }

        // 2. PLAN
        if (trimmedLine.startsWith('data: [PLAN]:')) {
          try {
            const planData = JSON.parse(trimmedLine.replace('data: [PLAN]:', ''));
            callbacks.onPlan(planData);
          } catch (e) {
            console.error('解析计划失败', e);
          }
          continue;
        }

        // 3. RUNNING_NODE
        if (trimmedLine.includes('RUNNING_NODE:')) {
          const match = trimmedLine.match(/RUNNING_NODE:([^:]+):(.+)/);
          if (match) {
            callbacks.onNodeRunning(match[1], match[2]);
          }
          continue;
        }

        // 4. COMPLETED_NODE
        if (trimmedLine.includes('COMPLETED_NODE:')) {
          const match = trimmedLine.match(/COMPLETED_NODE:([^:]+):(.+)/);
          if (match) {
            callbacks.onNodeCompleted(match[1], match[2]);
          }
          continue;
        }

        // 5. RUNNING_STEP
        if (trimmedLine.includes('RUNNING_STEP:')) {
          const match = trimmedLine.match(/RUNNING_STEP:(\d+):(.+)/);
          if (match) {
            callbacks.onStepRunning(parseInt(match[1]), match[2]);
          }
          continue;
        }

        // 6. COMPLETED_STEP
        if (trimmedLine.includes('COMPLETED_STEP:')) {
          const match = trimmedLine.match(/COMPLETED_STEP:(\d+):(.+)/);
          if (match) {
            callbacks.onStepCompleted(parseInt(match[1]), match[2]);
          }
          continue;
        }

        // 7. ERROR_STEP
        if (trimmedLine.includes('ERROR_STEP:')) {
          const match = trimmedLine.match(/ERROR_STEP:(\d+):(.+)/);
          if (match) {
            callbacks.onStepError(parseInt(match[1]), match[2]);
          }
          continue;
        }

        // 8. CONFIRM 确认弹窗
        if (trimmedLine.includes('[CONFIRM]:')) {
          const match = trimmedLine.match(/\[CONFIRM\]:([^:]+):(.+)/);
          if (match && callbacks.onConfirm) {
            callbacks.onConfirm(match[1], match[2]);
          }
          continue;
        }

        // 9. 流式文本
        if (trimmedLine.startsWith('data: ')) {
          const content = line.replace('data: ', '');  // 使用原始行，不 trim
          // 尝试解析 JSON，如果是有效的 JSON 数组或对象则跳过
          try {
            const parsed = JSON.parse(content.trim());
            if (Array.isArray(parsed) || (typeof parsed === 'object' && parsed !== null)) {
              if (Array.isArray(parsed) && parsed.length > 0) {
                callbacks.onPlan(parsed);
              }
              continue;
            }
          } catch {
            // 不是有效的 JSON，作为普通文本处理
          }
          // 处理 [NEWLINE] 标记，转换为真正的换行符
          const processedContent = content.replace(/\[NEWLINE\]/g, '\n');
          accumulatedContent += processedContent;
          callbacks.onContent(accumulatedContent);
        }
      }
    }
  } catch (error) {
    callbacks.onError(error instanceof Error ? error : new Error(String(error)));
  }
}

// 获取历史对话记录
export async function getHistory(threadId: string): Promise<{ messages: Message[]; progressData: ProgressData }> {
  const response = await fetch(`${API_BASE_URL}/history/${threadId}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`获取历史记录失败: ${response.status}`);
  }

  const data: HistoryResponse = await response.json();
  const messages: Message[] = [];

  // 当前消息的进度数据
  let currentProgress: ProgressDataForMessage = {
    intent: null,
    planner: null,
    plan: [],
    worker: [],
  };
  let workerStepsMap: Map<string, { index: number; status: 'running' | 'completed' | 'error'; message: string }[]> = new Map();

  // 重置当前进度
  const resetProgress = () => {
    currentProgress = {
      intent: null,
      planner: null,
      plan: [],
      worker: [],
    };
    workerStepsMap = new Map();
  };

  // 将当前进度数据应用到 worker
  const finalizeWorkerSteps = () => {
    currentProgress.worker.forEach(w => {
      const steps = workerStepsMap.get(w.name) || [];
      w.steps = steps;
    });
  };

  for (const item of data.history) {
    const content = item.content;

    // 用户消息 - 重置进度，开始新的对话轮次
    if (item.type === 'human') {
      resetProgress();
      messages.push({
        role: 'user',
        content: item.content,
      });
      continue;
    }

    // AI 消息
    if (item.type === 'ai') {
      // RUNNING_NODE
      if (content.includes('RUNNING_NODE:')) {
        const match = content.match(/RUNNING_NODE:([^:]+):(.+)/);
        if (match) {
          const nodeName = match[1];
          const message = match[2];

          if (nodeName === 'intent') {
            currentProgress.intent = { name: nodeName, status: 'running', message, steps: [] };
          } else if (nodeName === 'planner') {
            currentProgress.planner = { name: nodeName, status: 'running', message, steps: [] };
          } else {
            currentProgress.worker.push({ name: nodeName, status: 'running', message, steps: [] });
            workerStepsMap.set(nodeName, []);
          }
        }
        continue;
      }

      // COMPLETED_NODE
      if (content.includes('COMPLETED_NODE:')) {
        const match = content.match(/COMPLETED_NODE:([^:]+):(.+)/);
        console.log('[DEBUG] COMPLETED_NODE 匹配:', match);
        if (match) {
          const nodeName = match[1];
          const message = match[2];
          console.log('[DEBUG] nodeName:', nodeName, 'intent:', currentProgress.intent, 'planner:', currentProgress.planner);

          if (nodeName === 'intent' && currentProgress.intent) {
            currentProgress.intent = { ...currentProgress.intent, status: 'completed', message };
          } else if (nodeName === 'planner' && currentProgress.planner) {
            currentProgress.planner = { ...currentProgress.planner, status: 'completed', message };
          } else {
            const worker = currentProgress.worker.find(w => w.name === nodeName);
            if (worker) {
              worker.status = 'completed';
              worker.message = message;
            }
          }
        }
        continue;
      }

      // [PLAN]
      if (content.startsWith('[PLAN]:')) {
        try {
          const planData = JSON.parse(content.replace('[PLAN]:', ''));
          currentProgress.plan = planData;
        } catch (e) {
          console.error('解析计划失败', e);
        }
        continue;
      }

      // RUNNING_STEP
      if (content.includes('RUNNING_STEP:')) {
        const match = content.match(/RUNNING_STEP:(\d+):(.+)/);
        if (match) {
          const stepIndex = parseInt(match[1]);
          const message = match[2];
          const lastWorker = currentProgress.worker[currentProgress.worker.length - 1];
          if (lastWorker) {
            const steps = workerStepsMap.get(lastWorker.name) || [];
            steps.push({ index: stepIndex, status: 'running', message });
            workerStepsMap.set(lastWorker.name, steps);
          }
        }
        continue;
      }

      // COMPLETED_STEP
      if (content.includes('COMPLETED_STEP:')) {
        const match = content.match(/COMPLETED_STEP:(\d+):(.+)/);
        if (match) {
          const stepIndex = parseInt(match[1]);
          const message = match[2];
          const lastWorker = currentProgress.worker[currentProgress.worker.length - 1];
          if (lastWorker) {
            const steps = workerStepsMap.get(lastWorker.name) || [];
            const existingIndex = steps.findIndex(s => s.index === stepIndex);
            if (existingIndex !== -1) {
              steps[existingIndex] = { index: stepIndex, status: 'completed', message };
            } else {
              steps.push({ index: stepIndex, status: 'completed', message });
            }
            workerStepsMap.set(lastWorker.name, steps);
          }
        }
        continue;
      }

      // ERROR_STEP
      if (content.includes('ERROR_STEP:')) {
        const match = content.match(/ERROR_STEP:(\d+):(.+)/);
        if (match) {
          const stepIndex = parseInt(match[1]);
          const message = match[2];
          const lastWorker = currentProgress.worker[currentProgress.worker.length - 1];
          if (lastWorker) {
            const steps = workerStepsMap.get(lastWorker.name) || [];
            const existingIndex = steps.findIndex(s => s.index === stepIndex);
            if (existingIndex !== -1) {
              steps[existingIndex] = { index: stepIndex, status: 'error', message };
            } else {
              steps.push({ index: stepIndex, status: 'error', message });
            }
            workerStepsMap.set(lastWorker.name, steps);
          }
        }
        continue;
      }

      // 实际 AI 回复内容
      finalizeWorkerSteps();
      // 历史消息都已结束，将所有节点状态设为 completed
      const finalProgress = {
        intent: currentProgress.intent ? { ...currentProgress.intent, status: 'completed' as const } : null,
        planner: currentProgress.planner ? { ...currentProgress.planner, status: 'completed' as const } : null,
        plan: currentProgress.plan,
        worker: currentProgress.worker.map(w => ({ ...w, status: 'completed' as const, steps: workerStepsMap.get(w.name) || [] })),
      };
      messages.push({
        role: 'assistant',
        content: item.content,
        progressData: finalProgress,
      });
      // 重置进度，准备下一轮
      resetProgress();
    }
  }

  // 返回空的 progressData（实时进度由 App 组件管理）
  return { messages, progressData: { totalNodes: 0, intent: null, planner: null, plan: [], worker: [] } };
}

// 停止/中断对话
export async function stopChat(threadId: string): Promise<{ status: string; thread_id: string }> {
  const response = await fetch(`${API_BASE_URL}/stop/${threadId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`停止请求失败: ${response.status}`);
  }

  return response.json();
}

// 知乎登录确认
export async function confirmZhihuLogin(): Promise<{ status: string }> {
  const response = await fetch(`${API_BASE_URL}/zhihu/confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`确认失败: ${response.status}`);
  }

  return response.json();
}