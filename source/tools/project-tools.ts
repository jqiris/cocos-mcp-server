import { ToolDefinition, ToolResponse, ToolExecutor, ProjectInfo } from '../types';

export class ProjectTools implements ToolExecutor {
    getTools(): ToolDefinition[] {
        return [
            {
                name: 'project_manage',
                description: '项目管理：运行项目预览、构建项目、获取项目信息和设置',
                inputSchema: {
                    type: 'object',
                    properties: {
                        action: {
                            type: 'string',
                            enum: ['run', 'build', 'get_info', 'get_settings'],
                            description: '操作类型'
                        },
                        platform: {
                            type: 'string',
                            description: '目标平台（run/build 时使用）'
                        },
                        debug: {
                            type: 'boolean',
                            description: '调试模式（build 时使用）',
                            default: true
                        },
                        category: {
                            type: 'string',
                            description: '设置分类（get_settings 时使用）',
                            enum: ['general', 'physics', 'render', 'assets'],
                            default: 'general'
                        }
                    },
                    required: ['action']
                }
            },
            {
                name: 'project_build_system',
                description: '项目构建系统：控制构建面板、检查构建状态、管理预览服务器',
                inputSchema: {
                    type: 'object',
                    properties: {
                        action: {
                            type: 'string',
                            enum: ['open_build_panel', 'get_build_settings', 'check_builder_status', 'start_preview_server', 'stop_preview_server'],
                            description: '操作类型'
                        },
                        port: {
                            type: 'number',
                            description: '预览服务器端口（start_preview_server 时使用）',
                            default: 7456
                        }
                    },
                    required: ['action']
                }
            }
        ];
    }

    async execute(toolName: string, args: any): Promise<ToolResponse> {
        switch (toolName) {
            case 'project_manage':
                return await this.handleProjectManage(args.action, args);
            case 'project_build_system':
                return await this.handleProjectBuildSystem(args.action, args);
            default:
                throw new Error(`Unknown tool: ${toolName}`);
        }
    }

    private async handleProjectManage(action: string, args: any): Promise<ToolResponse> {
        switch (action) {
            case 'run': return await this.runProject(args.platform);
            case 'build': return await this.buildProject(args);
            case 'get_info': return await this.getProjectInfo();
            case 'get_settings': return await this.getProjectSettings(args.category);
            default: return { success: false, error: `Unknown action: ${action}` };
        }
    }

    private async handleProjectBuildSystem(action: string, args: any): Promise<ToolResponse> {
        switch (action) {
            case 'open_build_panel': return await this.openBuildPanel();
            case 'get_build_settings': return await this.getBuildSettings();
            case 'check_builder_status': return await this.checkBuilderStatus();
            case 'start_preview_server': return await this.startPreviewServer(args.port);
            case 'stop_preview_server': return await this.stopPreviewServer();
            default: return { success: false, error: `Unknown action: ${action}` };
        }
    }

    private async runProject(platform: string = 'browser'): Promise<ToolResponse> {
        return new Promise((resolve) => {
            Editor.Message.request('builder', 'open').then(() => {
                resolve({
                    success: true,
                    message: `Build panel opened for ${platform}. Preview functionality requires manual setup.`
                });
            }).catch((err: Error) => {
                resolve({ success: false, error: err.message });
            });
        });
    }

    private async buildProject(args: any): Promise<ToolResponse> {
        return new Promise((resolve) => {
            Editor.Message.request('builder', 'open').then(() => {
                resolve({
                    success: true,
                    message: `Build panel opened for ${args.platform}. Please configure and start build manually.`,
                    data: {
                        platform: args.platform,
                        instruction: "Use the build panel to configure and start the build process"
                    }
                });
            }).catch((err: Error) => {
                resolve({ success: false, error: err.message });
            });
        });
    }

    private async getProjectInfo(): Promise<ToolResponse> {
        return new Promise((resolve) => {
            const info: ProjectInfo = {
                name: Editor.Project.name,
                path: Editor.Project.path,
                uuid: Editor.Project.uuid,
                version: (Editor.Project as any).version || '1.0.0',
                cocosVersion: (Editor as any).versions?.cocos || 'Unknown'
            };

            Editor.Message.request('project', 'query-config', 'project').then((additionalInfo: any) => {
                if (additionalInfo) {
                    Object.assign(info, { config: additionalInfo });
                }
                resolve({ success: true, data: info });
            }).catch(() => {
                resolve({ success: true, data: info });
            });
        });
    }

    private async getProjectSettings(category: string = 'general'): Promise<ToolResponse> {
        return new Promise((resolve) => {
            const configMap: Record<string, string> = {
                general: 'project',
                physics: 'physics',
                render: 'render',
                assets: 'asset-db'
            };

            const configName = configMap[category] || 'project';

            Editor.Message.request('project', 'query-config', configName).then((settings: any) => {
                resolve({
                    success: true,
                    data: {
                        category: category,
                        config: settings,
                        message: `${category} settings retrieved successfully`
                    }
                });
            }).catch((err: Error) => {
                resolve({ success: false, error: err.message });
            });
        });
    }

    private async getBuildSettings(): Promise<ToolResponse> {
        return new Promise((resolve) => {
            Editor.Message.request('builder', 'query-worker-ready').then((ready: boolean) => {
                resolve({
                    success: true,
                    data: {
                        builderReady: ready,
                        message: 'Build settings are limited in MCP plugin environment',
                        availableActions: [
                            'Open build panel with open_build_panel',
                            'Check builder status with check_builder_status',
                            'Start preview server with start_preview_server',
                            'Stop preview server with stop_preview_server'
                        ]
                    }
                });
            }).catch((err: Error) => {
                resolve({ success: false, error: err.message });
            });
        });
    }

    private async openBuildPanel(): Promise<ToolResponse> {
        return new Promise((resolve) => {
            Editor.Message.request('builder', 'open').then(() => {
                resolve({
                    success: true,
                    message: 'Build panel opened successfully'
                });
            }).catch((err: Error) => {
                resolve({ success: false, error: err.message });
            });
        });
    }

    private async checkBuilderStatus(): Promise<ToolResponse> {
        return new Promise((resolve) => {
            Editor.Message.request('builder', 'query-worker-ready').then((ready: boolean) => {
                resolve({
                    success: true,
                    data: {
                        ready: ready,
                        status: ready ? 'Builder worker is ready' : 'Builder worker is not ready',
                        message: 'Builder status checked successfully'
                    }
                });
            }).catch((err: Error) => {
                resolve({ success: false, error: err.message });
            });
        });
    }

    private async startPreviewServer(port: number = 7456): Promise<ToolResponse> {
        return new Promise((resolve) => {
            resolve({
                success: false,
                error: 'Preview server control is not supported through MCP API',
                instruction: 'Please start the preview server manually using the editor menu: Project > Preview, or use the preview panel in the editor'
            });
        });
    }

    private async stopPreviewServer(): Promise<ToolResponse> {
        return new Promise((resolve) => {
            resolve({
                success: false,
                error: 'Preview server control is not supported through MCP API',
                instruction: 'Please stop the preview server manually using the preview panel in the editor'
            });
        });
    }
}
