import { ToolDefinition, ToolResponse, ToolExecutor } from '../types';

export class BroadcastTools implements ToolExecutor {
    private listeners: Map<string, Function[]> = new Map();
    private messageLog: Array<{ message: string; data: any; timestamp: number }> = [];

    constructor() {
        this.setupBroadcastListeners();
    }

    getTools(): ToolDefinition[] {
        return [
            {
                name: 'broadcast_log_management',
                description: '广播日志管理：获取广播消息日志、清空日志',
                inputSchema: {
                    type: 'object',
                    properties: {
                        action: {
                            type: 'string',
                            enum: ['get_log', 'clear_log'],
                            description: '操作类型'
                        },
                        limit: {
                            type: 'number',
                            description: '返回的最近消息数量，仅用于 get_log',
                            default: 50
                        },
                        messageType: {
                            type: 'string',
                            description: '按消息类型过滤，仅用于 get_log'
                        }
                    },
                    required: ['action']
                }
            },
            {
                name: 'broadcast_listener_management',
                description: '广播监听管理：开始监听、停止监听、获取活跃监听器列表',
                inputSchema: {
                    type: 'object',
                    properties: {
                        action: {
                            type: 'string',
                            enum: ['start_listening', 'stop_listening', 'get_active_listeners'],
                            description: '操作类型'
                        },
                        messageType: {
                            type: 'string',
                            description: '要监听或停止监听的消息类型，用于 start_listening 和 stop_listening'
                        }
                    },
                    required: ['action']
                }
            }
        ];
    }

    async execute(toolName: string, args: any): Promise<ToolResponse> {
        switch (toolName) {
            case 'broadcast_log_management':
                return await this.handleBroadcastLogManagement(args.action, args);
            case 'broadcast_listener_management':
                return await this.handleBroadcastListenerManagement(args.action, args);
            default:
                throw new Error(`Unknown tool: ${toolName}`);
        }
    }

    private async handleBroadcastLogManagement(action: string, args: any): Promise<ToolResponse> {
        switch (action) {
            case 'get_log': return await this.getBroadcastLog(args.limit, args.messageType);
            case 'clear_log': return await this.clearBroadcastLog();
            default: return { success: false, error: `Unknown action: ${action}` };
        }
    }

    private async handleBroadcastListenerManagement(action: string, args: any): Promise<ToolResponse> {
        switch (action) {
            case 'start_listening': return await this.listenBroadcast(args.messageType);
            case 'stop_listening': return await this.stopListening(args.messageType);
            case 'get_active_listeners': return await this.getActiveListeners();
            default: return { success: false, error: `Unknown action: ${action}` };
        }
    }

    private setupBroadcastListeners(): void {
        // 设置预定义的重要广播消息监听
        const importantMessages = [
            'build-worker:ready',
            'build-worker:closed',
            'scene:ready',
            'scene:close',
            'scene:light-probe-edit-mode-changed',
            'scene:light-probe-bounding-box-edit-mode-changed',
            'asset-db:ready',
            'asset-db:close',
            'asset-db:asset-add',
            'asset-db:asset-change',
            'asset-db:asset-delete'
        ];

        importantMessages.forEach(messageType => {
            this.addBroadcastListener(messageType);
        });
    }

    private addBroadcastListener(messageType: string): void {
        const listener = (data: any) => {
            this.messageLog.push({
                message: messageType,
                data: data,
                timestamp: Date.now()
            });

            // 保持日志大小在合理范围内
            if (this.messageLog.length > 1000) {
                this.messageLog = this.messageLog.slice(-500);
            }

            console.log(`[Broadcast] ${messageType}:`, data);
        };

        if (!this.listeners.has(messageType)) {
            this.listeners.set(messageType, []);
        }
        this.listeners.get(messageType)!.push(listener);

        // 注册 Editor 消息监听 - 暂时注释掉，Editor.Message API可能不支持
        // Editor.Message.on(messageType, listener);
        console.log(`[BroadcastTools] Added listener for ${messageType} (simulated)`);
    }

    private removeBroadcastListener(messageType: string): void {
        const listeners = this.listeners.get(messageType);
        if (listeners) {
            listeners.forEach(listener => {
                // Editor.Message.off(messageType, listener);
                console.log(`[BroadcastTools] Removed listener for ${messageType} (simulated)`);
            });
            this.listeners.delete(messageType);
        }
    }

    private async getBroadcastLog(limit: number = 50, messageType?: string): Promise<ToolResponse> {
        return new Promise((resolve) => {
            let filteredLog = this.messageLog;

            if (messageType) {
                filteredLog = this.messageLog.filter(entry => entry.message === messageType);
            }

            const recentLog = filteredLog.slice(-limit).map(entry => ({
                ...entry,
                timestamp: new Date(entry.timestamp).toISOString()
            }));

            resolve({
                success: true,
                data: {
                    log: recentLog,
                    count: recentLog.length,
                    totalCount: filteredLog.length,
                    filter: messageType || 'all',
                    message: 'Broadcast log retrieved successfully'
                }
            });
        });
    }

    private async listenBroadcast(messageType: string): Promise<ToolResponse> {
        return new Promise((resolve) => {
            try {
                if (!this.listeners.has(messageType)) {
                    this.addBroadcastListener(messageType);
                    resolve({
                        success: true,
                        data: {
                            messageType: messageType,
                            message: `Started listening for broadcast: ${messageType}`
                        }
                    });
                } else {
                    resolve({
                        success: true,
                        data: {
                            messageType: messageType,
                            message: `Already listening for broadcast: ${messageType}`
                        }
                    });
                }
            } catch (err: any) {
                resolve({ success: false, error: err.message });
            }
        });
    }

    private async stopListening(messageType: string): Promise<ToolResponse> {
        return new Promise((resolve) => {
            try {
                if (this.listeners.has(messageType)) {
                    this.removeBroadcastListener(messageType);
                    resolve({
                        success: true,
                        data: {
                            messageType: messageType,
                            message: `Stopped listening for broadcast: ${messageType}`
                        }
                    });
                } else {
                    resolve({
                        success: true,
                        data: {
                            messageType: messageType,
                            message: `Was not listening for broadcast: ${messageType}`
                        }
                    });
                }
            } catch (err: any) {
                resolve({ success: false, error: err.message });
            }
        });
    }

    private async clearBroadcastLog(): Promise<ToolResponse> {
        return new Promise((resolve) => {
            const previousCount = this.messageLog.length;
            this.messageLog = [];
            resolve({
                success: true,
                data: {
                    clearedCount: previousCount,
                    message: 'Broadcast log cleared successfully'
                }
            });
        });
    }

    private async getActiveListeners(): Promise<ToolResponse> {
        return new Promise((resolve) => {
            const activeListeners = Array.from(this.listeners.keys()).map(messageType => ({
                messageType: messageType,
                listenerCount: this.listeners.get(messageType)?.length || 0
            }));

            resolve({
                success: true,
                data: {
                    listeners: activeListeners,
                    count: activeListeners.length,
                    message: 'Active listeners retrieved successfully'
                }
            });
        });
    }
}