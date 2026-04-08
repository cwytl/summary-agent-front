// 执行进度组件 - 分阶段展示：intent → plan → worker

import { useState } from 'react';

export interface ProgressStep {
  index: number;
  status: 'running' | 'completed' | 'error';
  message: string;
}

export interface ProgressNode {
  name: string;
  status: 'pending' | 'running' | 'completed';
  message: string;
  steps: ProgressStep[];
}

export interface ProgressData {
  totalNodes: number;  // 动态记录总节点数
  intent: ProgressNode | null;
  planner: ProgressNode | null;
  plan: string[];
  worker: ProgressNode[];
}

interface ProgressPanelProps {
  data: ProgressData;
  isLive?: boolean;  // 是否为实时模式，历史消息时不显示"运行中"
  onExpand?: () => void;  // 展开时的回调
}

// 渲染单个节点（不显示节点名称）
function NodeItem({ node }: { node: ProgressNode }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      gap: '8px',
    }}>
      <span style={{ fontSize: '14px', marginTop: '1px' }}>
        {node.status === 'completed' ? (
          <span style={{ color: '#22c55e' }}>●</span>
        ) : node.status === 'running' ? (
          <span style={{ color: '#3b82f6' }}>○</span>
        ) : (
          <span style={{ color: '#94a3b8' }}>○</span>
        )}
      </span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
          {node.message}
        </div>

        {/* 步骤列表 */}
        {node.steps.length > 0 && (
          <div style={{
            marginTop: '8px',
            paddingLeft: '12px',
            borderLeft: '2px solid #e2e8f0',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
          }}>
            {node.steps.map((step) => (
              <div key={step.index} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12px',
              }}>
                <span style={{
                  color: step.status === 'completed' ? '#22c55e' : step.status === 'error' ? '#ef4444' : '#3b82f6',
                }}>
                  ○
                </span>
                <span style={{ color: '#334155' }}>
                  {step.message}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function ProgressPanel({ data, isLive = true, onExpand }: ProgressPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const { totalNodes, intent, planner, plan, worker } = data;

  // 判断是否有内容
  const hasContent = totalNodes > 0 || intent || planner || plan.length > 0 || worker.length > 0;
  if (!hasContent) return null;

  // 计算完成状态
  const completedCount =
    (intent?.status === 'completed' ? 1 : 0) +
    (planner?.status === 'completed' ? 1 : 0) +
    (worker.some(n => n.status === 'completed') ? 1 : 0);

  const hasRunning = intent?.status === 'running' || planner?.status === 'running' || worker.some(n => n.status === 'running');

  // 处理展开/折叠
  const handleToggle = () => {
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);
    if (newExpanded && onExpand) {
      // 延迟执行滚动，等待面板渲染完成
      setTimeout(onExpand, 50);
    }
  };

  // 只有实时模式下才显示"运行中"
  const showRunning = isLive && hasRunning;

  return (
    <div style={{
      marginTop: '8px',
      border: '1px solid #e2e8f0',
      borderRadius: '10px',
      overflow: 'hidden',
      background: '#fafafa',
    }}>
      {/* 折叠/展开按钮 */}
      <div
        onClick={handleToggle}
        style={{
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          background: isExpanded ? '#f1f5f9' : '#fafafa',
          transition: 'background 0.2s',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            fontSize: '12px',
            transition: 'transform 0.2s',
            display: 'inline-block',
            transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
          }}>
            ▶
          </span>
          <span style={{ fontSize: '13px', color: '#64748b' }}>思考过程</span>
          <span style={{
            fontSize: '12px',
            color: completedCount === totalNodes && totalNodes > 0 ? '#22c55e' : '#64748b',
            background: completedCount === totalNodes && totalNodes > 0 ? '#dcfce7' : '#f1f5f9',
            padding: '2px 8px',
            borderRadius: '10px',
          }}>
            {completedCount}/{totalNodes}
          </span>
        </div>
        {showRunning && (
          <span style={{
            fontSize: '12px',
            color: '#3b82f6',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}>
            <span style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: '#3b82f6',
              animation: 'pulse 1.5s infinite',
            }} />
            运行中
          </span>
        )}
      </div>

      {/* 展开内容 */}
      {isExpanded && (
        <div style={{
          padding: '12px 14px',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}>
          {/* Intent 阶段 */}
          {intent && (
            <div>
              <div style={{
                fontSize: '11px',
                color: '#94a3b8',
                marginBottom: '6px',
                fontWeight: 500,
                letterSpacing: '0.5px',
              }}>
                🎯 意图识别
              </div>
              <NodeItem node={intent} />
            </div>
          )}

          {/* Planner 阶段 */}
          {planner && (
            <div>
              <div style={{
                fontSize: '11px',
                color: '#94a3b8',
                marginBottom: '6px',
                fontWeight: 500,
                letterSpacing: '0.5px',
              }}>
                📐 任务规划
              </div>
              <NodeItem node={planner} />
            </div>
          )}

          {/* Plan 阶段 - 直接展示计划内容 */}
          {plan.length > 0 && (
            <div style={{
              paddingLeft: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}>
              {plan.map((item, idx) => {
                const match = item.match(/\[([^\]]+)\]:\s*(.+)/);
                const desc = match ? match[2] : item;
                return (
                  <div key={idx} style={{
                    fontSize: '12px',
                    color: '#64748b',
                    display: 'flex',
                    gap: '6px',
                  }}>
                    <span style={{ color: '#94a3b8' }}>{idx + 1}.</span>
                    <span style={{ color: '#334155' }}>{desc}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Worker 阶段 */}
          {worker.length > 0 && (
            <div>
              <div style={{
                fontSize: '11px',
                color: '#94a3b8',
                marginBottom: '6px',
                fontWeight: 500,
                letterSpacing: '0.5px',
              }}>
                ⚡ 执行任务
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {worker.map((node, idx) => (
                  <NodeItem key={idx} node={node} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}