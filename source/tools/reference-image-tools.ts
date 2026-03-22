import { ToolDefinition, ToolResponse, ToolExecutor } from '../types';

export class ReferenceImageTools implements ToolExecutor {
    getTools(): ToolDefinition[] {
        return [
            {
                name: 'reference_image_management',
                description: 'Reference image management: add, remove, switch, clear reference images',
                inputSchema: {
                    type: 'object',
                    properties: {
                        action: {
                            type: 'string',
                            enum: ['add', 'remove', 'switch', 'clear_all'],
                            description: 'Operation type'
                        },
                        paths: {
                            type: 'array',
                            items: { type: 'string' },
                            description: 'Array of reference image absolute paths (for add)'
                        },
                        path: {
                            type: 'string',
                            description: 'Reference image absolute path (for switch)'
                        },
                        sceneUUID: {
                            type: 'string',
                            description: 'Specific scene UUID, optional (for switch)'
                        }
                    },
                    required: ['action']
                }
            },
            {
                name: 'reference_image_query',
                description: 'Reference image query: get configuration, current image data, list available images',
                inputSchema: {
                    type: 'object',
                    properties: {
                        action: {
                            type: 'string',
                            enum: ['get_config', 'get_current', 'list'],
                            description: 'Operation type'
                        }
                    },
                    required: ['action']
                }
            },
            {
                name: 'reference_image_transform',
                description: 'Reference image transform: set position, scale, opacity',
                inputSchema: {
                    type: 'object',
                    properties: {
                        action: {
                            type: 'string',
                            enum: ['set_position', 'set_scale', 'set_opacity'],
                            description: 'Operation type'
                        },
                        x: {
                            type: 'number',
                            description: 'X position or X scale'
                        },
                        y: {
                            type: 'number',
                            description: 'Y position or Y scale'
                        },
                        opacity: {
                            type: 'number',
                            description: 'Opacity (0.0 to 1.0)',
                            minimum: 0,
                            maximum: 1
                        }
                    },
                    required: ['action']
                }
            },
            {
                name: 'reference_image_display',
                description: 'Reference image display: refresh display, set image data',
                inputSchema: {
                    type: 'object',
                    properties: {
                        action: {
                            type: 'string',
                            enum: ['refresh', 'set_data'],
                            description: 'Operation type'
                        },
                        key: {
                            type: 'string',
                            description: 'Property key (for set_data)',
                            enum: ['path', 'x', 'y', 'sx', 'sy', 'opacity']
                        },
                        value: {
                            description: 'Property value (for set_data): path (string), x/y/sx/sy (number), opacity (number 0-1)'
                        }
                    },
                    required: ['action']
                }
            }
        ];
    }

    async execute(toolName: string, args: any): Promise<ToolResponse> {
        switch (toolName) {
            case 'reference_image_management':
                return await this.handleReferenceImageManagement(args);
            case 'reference_image_query':
                return await this.handleReferenceImageQuery(args);
            case 'reference_image_transform':
                return await this.handleReferenceImageTransform(args);
            case 'reference_image_display':
                return await this.handleReferenceImageDisplay(args);
            default:
                throw new Error(`Unknown tool: ${toolName}`);
        }
    }

    private async handleReferenceImageManagement(args: any): Promise<ToolResponse> {
        switch (args.action) {
            case 'add':
                return await this.addReferenceImage(args.paths);
            case 'remove':
                return await this.removeReferenceImage(args.paths);
            case 'switch':
                return await this.switchReferenceImage(args.path, args.sceneUUID);
            case 'clear_all':
                return await this.clearAllReferenceImages();
            default:
                throw new Error(`Unknown action: ${args.action}`);
        }
    }

    private async handleReferenceImageQuery(args: any): Promise<ToolResponse> {
        switch (args.action) {
            case 'get_config':
                return await this.queryReferenceImageConfig();
            case 'get_current':
                return await this.queryCurrentReferenceImage();
            case 'list':
                return await this.listReferenceImages();
            default:
                throw new Error(`Unknown action: ${args.action}`);
        }
    }

    private async handleReferenceImageTransform(args: any): Promise<ToolResponse> {
        switch (args.action) {
            case 'set_position':
                return await this.setReferenceImagePosition(args.x, args.y);
            case 'set_scale':
                return await this.setReferenceImageScale(args.x, args.y);
            case 'set_opacity':
                return await this.setReferenceImageOpacity(args.opacity);
            default:
                throw new Error(`Unknown action: ${args.action}`);
        }
    }

    private async handleReferenceImageDisplay(args: any): Promise<ToolResponse> {
        switch (args.action) {
            case 'refresh':
                return await this.refreshReferenceImage();
            case 'set_data':
                return await this.setReferenceImageData(args.key, args.value);
            default:
                throw new Error(`Unknown action: ${args.action}`);
        }
    }

    private async addReferenceImage(paths: string[]): Promise<ToolResponse> {
        return new Promise((resolve) => {
            Editor.Message.request('reference-image', 'add-image', paths).then(() => {
                resolve({
                    success: true,
                    data: {
                        addedPaths: paths,
                        count: paths.length,
                        message: `Added ${paths.length} reference image(s)`
                    }
                });
            }).catch((err: Error) => {
                resolve({ success: false, error: err.message });
            });
        });
    }

    private async removeReferenceImage(paths?: string[]): Promise<ToolResponse> {
        return new Promise((resolve) => {
            Editor.Message.request('reference-image', 'remove-image', paths).then(() => {
                const message = paths && paths.length > 0 ? 
                    `Removed ${paths.length} reference image(s)` : 
                    'Removed current reference image';
                resolve({
                    success: true,
                    message: message
                });
            }).catch((err: Error) => {
                resolve({ success: false, error: err.message });
            });
        });
    }

    private async switchReferenceImage(path: string, sceneUUID?: string): Promise<ToolResponse> {
        return new Promise((resolve) => {
            const args = sceneUUID ? [path, sceneUUID] : [path];
            Editor.Message.request('reference-image', 'switch-image', ...args).then(() => {
                resolve({
                    success: true,
                    data: {
                        path: path,
                        sceneUUID: sceneUUID,
                        message: `Switched to reference image: ${path}`
                    }
                });
            }).catch((err: Error) => {
                resolve({ success: false, error: err.message });
            });
        });
    }

    private async setReferenceImageData(key: string, value: any): Promise<ToolResponse> {
        return new Promise((resolve) => {
            Editor.Message.request('reference-image', 'set-image-data', key, value).then(() => {
                resolve({
                    success: true,
                    data: {
                        key: key,
                        value: value,
                        message: `Reference image ${key} set to ${value}`
                    }
                });
            }).catch((err: Error) => {
                resolve({ success: false, error: err.message });
            });
        });
    }

    private async queryReferenceImageConfig(): Promise<ToolResponse> {
        return new Promise((resolve) => {
            Editor.Message.request('reference-image', 'query-config').then((config: any) => {
                resolve({
                    success: true,
                    data: config
                });
            }).catch((err: Error) => {
                resolve({ success: false, error: err.message });
            });
        });
    }

    private async queryCurrentReferenceImage(): Promise<ToolResponse> {
        return new Promise((resolve) => {
            Editor.Message.request('reference-image', 'query-current').then((current: any) => {
                resolve({
                    success: true,
                    data: current
                });
            }).catch((err: Error) => {
                resolve({ success: false, error: err.message });
            });
        });
    }

    private async refreshReferenceImage(): Promise<ToolResponse> {
        return new Promise((resolve) => {
            Editor.Message.request('reference-image', 'refresh').then(() => {
                resolve({
                    success: true,
                    message: 'Reference image refreshed'
                });
            }).catch((err: Error) => {
                resolve({ success: false, error: err.message });
            });
        });
    }

    private async setReferenceImagePosition(x: number, y: number): Promise<ToolResponse> {
        return new Promise(async (resolve) => {
            try {
                await Editor.Message.request('reference-image', 'set-image-data', 'x', x);
                await Editor.Message.request('reference-image', 'set-image-data', 'y', y);
                
                resolve({
                    success: true,
                    data: {
                        x: x,
                        y: y,
                        message: `Reference image position set to (${x}, ${y})`
                    }
                });
            } catch (err: any) {
                resolve({ success: false, error: err.message });
            }
        });
    }

    private async setReferenceImageScale(sx: number, sy: number): Promise<ToolResponse> {
        return new Promise(async (resolve) => {
            try {
                await Editor.Message.request('reference-image', 'set-image-data', 'sx', sx);
                await Editor.Message.request('reference-image', 'set-image-data', 'sy', sy);
                
                resolve({
                    success: true,
                    data: {
                        sx: sx,
                        sy: sy,
                        message: `Reference image scale set to (${sx}, ${sy})`
                    }
                });
            } catch (err: any) {
                resolve({ success: false, error: err.message });
            }
        });
    }

    private async setReferenceImageOpacity(opacity: number): Promise<ToolResponse> {
        return new Promise((resolve) => {
            Editor.Message.request('reference-image', 'set-image-data', 'opacity', opacity).then(() => {
                resolve({
                    success: true,
                    data: {
                        opacity: opacity,
                        message: `Reference image opacity set to ${opacity}`
                    }
                });
            }).catch((err: Error) => {
                resolve({ success: false, error: err.message });
            });
        });
    }

    private async listReferenceImages(): Promise<ToolResponse> {
        return new Promise(async (resolve) => {
            try {
                const config = await Editor.Message.request('reference-image', 'query-config');
                const current = await Editor.Message.request('reference-image', 'query-current');
                
                resolve({
                    success: true,
                    data: {
                        config: config,
                        current: current,
                        message: 'Reference image information retrieved'
                    }
                });
            } catch (err: any) {
                resolve({ success: false, error: err.message });
            }
        });
    }

    private async clearAllReferenceImages(): Promise<ToolResponse> {
        return new Promise(async (resolve) => {
            try {
                // Remove all reference images by calling remove-image without paths
                await Editor.Message.request('reference-image', 'remove-image');
                
                resolve({
                    success: true,
                    message: 'All reference images cleared'
                });
            } catch (err: any) {
                resolve({ success: false, error: err.message });
            }
        });
    }
}