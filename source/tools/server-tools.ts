import { ToolDefinition, ToolResponse, ToolExecutor } from '../types';

export class ServerTools implements ToolExecutor {
    getTools(): ToolDefinition[] {
        return [
            {
                name: 'server_information',
                description: '服务器信息：查询IP地址列表、排序IP列表、端口、基本状态',
                inputSchema: {
                    type: 'object',
                    properties: {
                        action: {
                            type: 'string',
                            enum: ['get_ip_list', 'get_sorted_ip_list', 'get_port', 'get_status'],
                            description: '操作类型'
                        }
                    },
                    required: ['action']
                }
            },
            {
                name: 'server_connectivity',
                description: '服务器连接与网络：检查连接状态、获取网络接口',
                inputSchema: {
                    type: 'object',
                    properties: {
                        action: {
                            type: 'string',
                            enum: ['check_connectivity', 'get_network_interfaces'],
                            description: '操作类型'
                        },
                        timeout: {
                            type: 'number',
                            description: '连接超时时间（毫秒），仅用于 check_connectivity',
                            default: 5000
                        }
                    },
                    required: ['action']
                }
            }
        ];
    }

    async execute(toolName: string, args: any): Promise<ToolResponse> {
        switch (toolName) {
            case 'server_information':
                return await this.handleServerInformation(args.action, args);
            case 'server_connectivity':
                return await this.handleServerConnectivity(args.action, args);
            default:
                throw new Error(`Unknown tool: ${toolName}`);
        }
    }

    private async handleServerInformation(action: string, args: any): Promise<ToolResponse> {
        switch (action) {
            case 'get_ip_list': return await this.queryServerIPList();
            case 'get_sorted_ip_list': return await this.querySortedServerIPList();
            case 'get_port': return await this.queryServerPort();
            case 'get_status': return await this.getServerStatus();
            default: return { success: false, error: `Unknown action: ${action}` };
        }
    }

    private async handleServerConnectivity(action: string, args: any): Promise<ToolResponse> {
        switch (action) {
            case 'check_connectivity': return await this.checkServerConnectivity(args.timeout);
            case 'get_network_interfaces': return await this.getNetworkInterfaces();
            default: return { success: false, error: `Unknown action: ${action}` };
        }
    }

    private async queryServerIPList(): Promise<ToolResponse> {
        return new Promise((resolve) => {
            Editor.Message.request('server', 'query-ip-list').then((ipList: string[]) => {
                resolve({
                    success: true,
                    data: {
                        ipList: ipList,
                        count: ipList.length,
                        message: 'IP list retrieved successfully'
                    }
                });
            }).catch((err: Error) => {
                resolve({ success: false, error: err.message });
            });
        });
    }

    private async querySortedServerIPList(): Promise<ToolResponse> {
        return new Promise((resolve) => {
            Editor.Message.request('server', 'query-sort-ip-list').then((sortedIPList: string[]) => {
                resolve({
                    success: true,
                    data: {
                        sortedIPList: sortedIPList,
                        count: sortedIPList.length,
                        message: 'Sorted IP list retrieved successfully'
                    }
                });
            }).catch((err: Error) => {
                resolve({ success: false, error: err.message });
            });
        });
    }

    private async queryServerPort(): Promise<ToolResponse> {
        return new Promise((resolve) => {
            Editor.Message.request('server', 'query-port').then((port: number) => {
                resolve({
                    success: true,
                    data: {
                        port: port,
                        message: `Editor server is running on port ${port}`
                    }
                });
            }).catch((err: Error) => {
                resolve({ success: false, error: err.message });
            });
        });
    }

    private async getServerStatus(): Promise<ToolResponse> {
        return new Promise(async (resolve) => {
            try {
                // Gather comprehensive server information
                const [ipListResult, portResult] = await Promise.allSettled([
                    this.queryServerIPList(),
                    this.queryServerPort()
                ]);

                const status: any = {
                    timestamp: new Date().toISOString(),
                    serverRunning: true
                };

                if (ipListResult.status === 'fulfilled' && ipListResult.value.success) {
                    status.availableIPs = ipListResult.value.data.ipList;
                    status.ipCount = ipListResult.value.data.count;
                } else {
                    status.availableIPs = [];
                    status.ipCount = 0;
                    status.ipError = ipListResult.status === 'rejected' ? ipListResult.reason : ipListResult.value.error;
                }

                if (portResult.status === 'fulfilled' && portResult.value.success) {
                    status.port = portResult.value.data.port;
                } else {
                    status.port = null;
                    status.portError = portResult.status === 'rejected' ? portResult.reason : portResult.value.error;
                }

                // Add additional server info
                status.mcpServerPort = 3000; // Our MCP server port
                status.editorVersion = (Editor as any).versions?.cocos || 'Unknown';
                status.platform = process.platform;
                status.nodeVersion = process.version;

                resolve({
                    success: true,
                    data: status
                });

            } catch (err: any) {
                resolve({
                    success: false,
                    error: `Failed to get server status: ${err.message}`
                });
            }
        });
    }

    private async checkServerConnectivity(timeout: number = 5000): Promise<ToolResponse> {
        return new Promise(async (resolve) => {
            const startTime = Date.now();
            
            try {
                // Test basic Editor API connectivity
                const testPromise = Editor.Message.request('server', 'query-port');
                const timeoutPromise = new Promise((_, reject) => {
                    setTimeout(() => reject(new Error('Connection timeout')), timeout);
                });

                await Promise.race([testPromise, timeoutPromise]);
                
                const responseTime = Date.now() - startTime;
                
                resolve({
                    success: true,
                    data: {
                        connected: true,
                        responseTime: responseTime,
                        timeout: timeout,
                        message: `Server connectivity confirmed in ${responseTime}ms`
                    }
                });

            } catch (err: any) {
                const responseTime = Date.now() - startTime;
                
                resolve({
                    success: false,
                    data: {
                        connected: false,
                        responseTime: responseTime,
                        timeout: timeout,
                        error: err.message
                    }
                });
            }
        });
    }

    private async getNetworkInterfaces(): Promise<ToolResponse> {
        return new Promise(async (resolve) => {
            try {
                // Get network interfaces using Node.js os module
                const os = require('os');
                const interfaces = os.networkInterfaces();
                
                const networkInfo = Object.entries(interfaces).map(([name, addresses]: [string, any]) => ({
                    name: name,
                    addresses: addresses.map((addr: any) => ({
                        address: addr.address,
                        family: addr.family,
                        internal: addr.internal,
                        cidr: addr.cidr
                    }))
                }));

                // Also try to get server IPs for comparison
                const serverIPResult = await this.queryServerIPList();
                
                resolve({
                    success: true,
                    data: {
                        networkInterfaces: networkInfo,
                        serverAvailableIPs: serverIPResult.success ? serverIPResult.data.ipList : [],
                        message: 'Network interfaces retrieved successfully'
                    }
                });

            } catch (err: any) {
                resolve({
                    success: false,
                    error: `Failed to get network interfaces: ${err.message}`
                });
            }
        });
    }
}