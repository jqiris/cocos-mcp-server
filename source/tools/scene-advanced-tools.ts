import { ToolDefinition, ToolResponse, ToolExecutor } from '../types';

export class SceneAdvancedTools implements ToolExecutor {
    getTools(): ToolDefinition[] {
        return [
            {
                name: 'node_clipboard',
                description: 'Copy, paste, or cut nodes in the scene. Copy stores nodes for later paste. Paste creates duplicates at a target parent. Cut copies and marks nodes for move.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        action: {
                            type: 'string',
                            enum: ['copy', 'paste', 'cut'],
                            description: 'Clipboard action: copy (store nodes), paste (duplicate at target), cut (copy + mark for move)'
                        },
                        uuids: {
                            oneOf: [
                                { type: 'string' },
                                { type: 'array', items: { type: 'string' } }
                            ],
                            description: 'Node UUID or array of UUIDs (for "copy" and "cut" actions; also for "paste" to specify which nodes)'
                        },
                        target: {
                            type: 'string',
                            description: 'Target parent node UUID (for "paste" action)'
                        },
                        keepWorldTransform: {
                            type: 'boolean',
                            description: 'Keep world transform coordinates (for "paste" action)',
                            default: false
                        }
                    },
                    required: ['action']
                }
            },
            {
                name: 'scene_execution_control',
                description: 'Execute component methods, scene scripts, or restore prefab instances. Use for invoking runtime methods on components, running scene scripts, or reverting prefab changes.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        action: {
                            type: 'string',
                            enum: ['execute_component_method', 'execute_scene_script', 'restore_prefab'],
                            description: 'Execution action: execute_component_method, execute_scene_script, restore_prefab'
                        },
                        uuid: {
                            type: 'string',
                            description: 'Component UUID (for "execute_component_method" action)'
                        },
                        name: {
                            type: 'string',
                            description: 'Method name (for "execute_component_method" action) or plugin name (for "execute_scene_script" action)'
                        },
                        method: {
                            type: 'string',
                            description: 'Method name (for "execute_scene_script" action)'
                        },
                        args: {
                            type: 'array',
                            description: 'Method arguments (for "execute_component_method" and "execute_scene_script" actions)',
                            default: []
                        },
                        nodeUuid: {
                            type: 'string',
                            description: 'Node UUID (for "restore_prefab" action)'
                        },
                        assetUuid: {
                            type: 'string',
                            description: 'Prefab asset UUID (for "restore_prefab" action)'
                        }
                    },
                    required: ['action']
                }
            },
            {
                name: 'scene_state_management',
                description: 'Manage scene state: create/abort snapshots, begin/end/cancel undo recording, or soft reload the scene. Use for state preservation and undo support.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        action: {
                            type: 'string',
                            enum: ['create_snapshot', 'abort_snapshot', 'begin_undo_recording', 'end_undo_recording', 'cancel_undo_recording', 'soft_reload'],
                            description: 'State management action'
                        },
                        nodeUuid: {
                            type: 'string',
                            description: 'Node UUID to record (for "begin_undo_recording" action)'
                        },
                        undoId: {
                            type: 'string',
                            description: 'Undo recording ID from begin_undo_recording (for "end_undo_recording" and "cancel_undo_recording" actions)'
                        }
                    },
                    required: ['action']
                }
            },
            {
                name: 'scene_query_system',
                description: 'Query scene state and metadata. Check if scene is ready or dirty, list registered classes, query available components, check component scripts, or find nodes using a specific asset.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        action: {
                            type: 'string',
                            enum: ['query_ready', 'query_dirty', 'query_classes', 'query_components', 'query_component_has_script', 'query_nodes_by_asset'],
                            description: 'Query action to perform'
                        },
                        extends: {
                            type: 'string',
                            description: 'Filter classes that extend this base class (for "query_classes" action)'
                        },
                        className: {
                            type: 'string',
                            description: 'Script class name to check (for "query_component_has_script" action)'
                        },
                        assetUuid: {
                            type: 'string',
                            description: 'Asset UUID to search for (for "query_nodes_by_asset" action)'
                        }
                    },
                    required: ['action']
                }
            },
            {
                name: 'node_property_management',
                description: 'Reset node properties, transforms, or entire components to their default values.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        action: {
                            type: 'string',
                            enum: ['reset_property', 'reset_transform', 'reset_component'],
                            description: 'Reset action: reset_property (specific property), reset_transform (position/rotation/scale), reset_component (entire component)'
                        },
                        uuid: {
                            type: 'string',
                            description: 'Node or component UUID'
                        },
                        path: {
                            type: 'string',
                            description: 'Property path to reset (for "reset_property" action, e.g., position, rotation, scale)'
                        }
                    },
                    required: ['action', 'uuid']
                }
            },
            {
                name: 'node_array_management',
                description: 'Manage array properties on nodes: move array elements by offset or remove elements at specific indices.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        action: {
                            type: 'string',
                            enum: ['move_element', 'remove_element'],
                            description: 'Array management action: move_element (shift position) or remove_element (delete at index)'
                        },
                        uuid: {
                            type: 'string',
                            description: 'Node UUID'
                        },
                        path: {
                            type: 'string',
                            description: 'Array property path (e.g., __comps__)'
                        },
                        target: {
                            type: 'number',
                            description: 'Target item original index (for "move_element" action)'
                        },
                        offset: {
                            type: 'number',
                            description: 'Offset amount, positive or negative (for "move_element" action)'
                        },
                        index: {
                            type: 'number',
                            description: 'Target item index to remove (for "remove_element" action)'
                        }
                    },
                    required: ['action', 'uuid', 'path']
                }
            }
        ];
    }

    async execute(toolName: string, args: any): Promise<ToolResponse> {
        switch (toolName) {
            case 'node_clipboard':
                return await this.handleNodeClipboard(args.action, args);
            case 'scene_execution_control':
                return await this.handleSceneExecutionControl(args.action, args);
            case 'scene_state_management':
                return await this.handleSceneStateManagement(args.action, args);
            case 'scene_query_system':
                return await this.handleSceneQuerySystem(args.action, args);
            case 'node_property_management':
                return await this.handleNodePropertyManagement(args.action, args);
            case 'node_array_management':
                return await this.handleNodeArrayManagement(args.action, args);
            default:
                throw new Error(`Unknown tool: ${toolName}`);
        }
    }

    private async handleNodeClipboard(action: string, args: any): Promise<ToolResponse> {
        switch (action) {
            case 'copy': return await this.copyNode(args.uuids);
            case 'paste': return await this.pasteNode(args.target, args.uuids, args.keepWorldTransform);
            case 'cut': return await this.cutNode(args.uuids);
            default: return { success: false, error: `Unknown node_clipboard action: ${action}` };
        }
    }

    private async handleSceneExecutionControl(action: string, args: any): Promise<ToolResponse> {
        switch (action) {
            case 'execute_component_method': return await this.executeComponentMethod(args.uuid, args.name, args.args);
            case 'execute_scene_script': return await this.executeSceneScript(args.name, args.method, args.args);
            case 'restore_prefab': return await this.restorePrefab(args.nodeUuid, args.assetUuid);
            default: return { success: false, error: `Unknown scene_execution_control action: ${action}` };
        }
    }

    private async handleSceneStateManagement(action: string, args: any): Promise<ToolResponse> {
        switch (action) {
            case 'create_snapshot': return await this.sceneSnapshot();
            case 'abort_snapshot': return await this.sceneSnapshotAbort();
            case 'begin_undo_recording': return await this.beginUndoRecording(args.nodeUuid);
            case 'end_undo_recording': return await this.endUndoRecording(args.undoId);
            case 'cancel_undo_recording': return await this.cancelUndoRecording(args.undoId);
            case 'soft_reload': return await this.softReloadScene();
            default: return { success: false, error: `Unknown scene_state_management action: ${action}` };
        }
    }

    private async handleSceneQuerySystem(action: string, args: any): Promise<ToolResponse> {
        switch (action) {
            case 'query_ready': return await this.querySceneReady();
            case 'query_dirty': return await this.querySceneDirty();
            case 'query_classes': return await this.querySceneClasses(args.extends);
            case 'query_components': return await this.querySceneComponents();
            case 'query_component_has_script': return await this.queryComponentHasScript(args.className);
            case 'query_nodes_by_asset': return await this.queryNodesByAssetUuid(args.assetUuid);
            default: return { success: false, error: `Unknown scene_query_system action: ${action}` };
        }
    }

    private async handleNodePropertyManagement(action: string, args: any): Promise<ToolResponse> {
        switch (action) {
            case 'reset_property': return await this.resetNodeProperty(args.uuid, args.path);
            case 'reset_transform': return await this.resetNodeTransform(args.uuid);
            case 'reset_component': return await this.resetComponent(args.uuid);
            default: return { success: false, error: `Unknown node_property_management action: ${action}` };
        }
    }

    private async handleNodeArrayManagement(action: string, args: any): Promise<ToolResponse> {
        switch (action) {
            case 'move_element': return await this.moveArrayElement(args.uuid, args.path, args.target, args.offset);
            case 'remove_element': return await this.removeArrayElement(args.uuid, args.path, args.index);
            default: return { success: false, error: `Unknown node_array_management action: ${action}` };
        }
    }

    private async resetNodeProperty(uuid: string, path: string): Promise<ToolResponse> {
        return new Promise((resolve) => {
            // Cocos Creator 3.8.x: 'reset-property' may not exist or have different params
            // Use 'set-property' with default values for known properties
            const defaults: Record<string, any> = {
                'position': { x: 0, y: 0, z: 0 },
                'rotation': { x: 0, y: 0, z: 0 },
                'scale': { x: 1, y: 1, z: 1 },
                'active': true,
                'name': 'Node',
                'layer': 33554432
            };

            if (defaults[path] !== undefined) {
                Editor.Message.request('scene', 'set-property', {
                    uuid,
                    path,
                    dump: { value: defaults[path] }
                }).then(() => {
                    resolve({
                        success: true,
                        message: `Property '${path}' reset to default value`
                    });
                }).catch((err: Error) => {
                    resolve({ success: false, error: err.message });
                });
            } else {
                // For unknown properties, try 'reset-property' as original fallback
                Editor.Message.request('scene', 'reset-property', {
                    uuid,
                    path,
                    dump: { value: null }
                }).then(() => {
                    resolve({
                        success: true,
                        message: `Property '${path}' reset to default value`
                    });
                }).catch((err: Error) => {
                    resolve({ success: false, error: `Cannot reset property '${path}': ${err.message}. Known resettable properties: ${Object.keys(defaults).join(', ')}` });
                });
            }
        });
    }

    private async moveArrayElement(uuid: string, path: string, target: number, offset: number): Promise<ToolResponse> {
        return new Promise((resolve) => {
            Editor.Message.request('scene', 'move-array-element', {
                uuid,
                path,
                target,
                offset
            }).then(() => {
                resolve({
                    success: true,
                    message: `Array element at index ${target} moved by ${offset}`
                });
            }).catch((err: Error) => {
                resolve({ success: false, error: err.message });
            });
        });
    }

    private async removeArrayElement(uuid: string, path: string, index: number): Promise<ToolResponse> {
        return new Promise((resolve) => {
            Editor.Message.request('scene', 'remove-array-element', {
                uuid,
                path,
                index
            }).then(() => {
                resolve({
                    success: true,
                    message: `Array element at index ${index} removed`
                });
            }).catch((err: Error) => {
                resolve({ success: false, error: err.message });
            });
        });
    }

    private async copyNode(uuids: string | string[]): Promise<ToolResponse> {
        return new Promise((resolve) => {
            Editor.Message.request('scene', 'copy-node', uuids).then((result: string | string[]) => {
                resolve({
                    success: true,
                    data: {
                        copiedUuids: result,
                        message: 'Node(s) copied successfully'
                    }
                });
            }).catch((err: Error) => {
                resolve({ success: false, error: err.message });
            });
        });
    }

    private async pasteNode(target: string, uuids: string | string[], keepWorldTransform: boolean = false): Promise<ToolResponse> {
        return new Promise((resolve) => {
            Editor.Message.request('scene', 'paste-node', {
                target,
                uuids,
                keepWorldTransform
            }).then((result: string | string[]) => {
                resolve({
                    success: true,
                    data: {
                        newUuids: result,
                        message: 'Node(s) pasted successfully'
                    }
                });
            }).catch((err: Error) => {
                resolve({ success: false, error: err.message });
            });
        });
    }

    private async cutNode(uuids: string | string[]): Promise<ToolResponse> {
        return new Promise((resolve) => {
            Editor.Message.request('scene', 'cut-node', uuids).then((result: any) => {
                resolve({
                    success: true,
                    data: {
                        cutUuids: result,
                        message: 'Node(s) cut successfully'
                    }
                });
            }).catch((err: Error) => {
                resolve({ success: false, error: err.message });
            });
        });
    }

    private async resetNodeTransform(uuid: string): Promise<ToolResponse> {
        return new Promise((resolve) => {
            Editor.Message.request('scene', 'reset-node', { uuid }).then(() => {
                resolve({
                    success: true,
                    message: 'Node transform reset to default'
                });
            }).catch((err: Error) => {
                resolve({ success: false, error: err.message });
            });
        });
    }

    private async resetComponent(uuid: string): Promise<ToolResponse> {
        return new Promise((resolve) => {
            Editor.Message.request('scene', 'reset-component', { uuid }).then(() => {
                resolve({
                    success: true,
                    message: 'Component reset to default values'
                });
            }).catch((err: Error) => {
                resolve({ success: false, error: err.message });
            });
        });
    }

    private async restorePrefab(nodeUuid: string, assetUuid: string): Promise<ToolResponse> {
        return new Promise((resolve) => {
            (Editor.Message.request as any)('scene', 'restore-prefab', nodeUuid, assetUuid).then(() => {
                resolve({
                    success: true,
                    message: 'Prefab restored successfully'
                });
            }).catch((err: Error) => {
                resolve({ success: false, error: err.message });
            });
        });
    }

    private async executeComponentMethod(uuid: string, name: string, args: any[] = []): Promise<ToolResponse> {
        return new Promise((resolve) => {
            Editor.Message.request('scene', 'execute-component-method', {
                uuid,
                name,
                args
            }).then((result: any) => {
                resolve({
                    success: true,
                    data: {
                        result: result,
                        message: `Method '${name}' executed successfully`
                    }
                });
            }).catch((err: Error) => {
                resolve({ success: false, error: err.message });
            });
        });
    }

    private async executeSceneScript(name: string, method: string, args: any[] = []): Promise<ToolResponse> {
        return new Promise((resolve) => {
            Editor.Message.request('scene', 'execute-scene-script', {
                name,
                method,
                args
            }).then((result: any) => {
                resolve({
                    success: true,
                    data: result
                });
            }).catch((err: Error) => {
                resolve({ success: false, error: err.message });
            });
        });
    }

    private async sceneSnapshot(): Promise<ToolResponse> {
        return new Promise((resolve) => {
            Editor.Message.request('scene', 'snapshot').then(() => {
                resolve({
                    success: true,
                    message: 'Scene snapshot created'
                });
            }).catch((err: Error) => {
                resolve({ success: false, error: err.message });
            });
        });
    }

    private async sceneSnapshotAbort(): Promise<ToolResponse> {
        return new Promise((resolve) => {
            Editor.Message.request('scene', 'snapshot-abort').then(() => {
                resolve({
                    success: true,
                    message: 'Scene snapshot aborted'
                });
            }).catch((err: Error) => {
                resolve({ success: false, error: err.message });
            });
        });
    }

    private async beginUndoRecording(nodeUuid: string): Promise<ToolResponse> {
        return new Promise((resolve) => {
            Editor.Message.request('scene', 'begin-recording', nodeUuid).then((undoId: string) => {
                resolve({
                    success: true,
                    data: {
                        undoId: undoId,
                        message: 'Undo recording started'
                    }
                });
            }).catch((err: Error) => {
                resolve({ success: false, error: err.message });
            });
        });
    }

    private async endUndoRecording(undoId: string): Promise<ToolResponse> {
        return new Promise((resolve) => {
            Editor.Message.request('scene', 'end-recording', undoId).then(() => {
                resolve({
                    success: true,
                    message: 'Undo recording ended'
                });
            }).catch((err: Error) => {
                resolve({ success: false, error: err.message });
            });
        });
    }

    private async cancelUndoRecording(undoId: string): Promise<ToolResponse> {
        return new Promise((resolve) => {
            Editor.Message.request('scene', 'cancel-recording', undoId).then(() => {
                resolve({
                    success: true,
                    message: 'Undo recording cancelled'
                });
            }).catch((err: Error) => {
                resolve({ success: false, error: err.message });
            });
        });
    }

    private async softReloadScene(): Promise<ToolResponse> {
        return new Promise((resolve) => {
            Editor.Message.request('scene', 'soft-reload').then(() => {
                resolve({
                    success: true,
                    message: 'Scene soft reloaded successfully'
                });
            }).catch((err: Error) => {
                resolve({ success: false, error: err.message });
            });
        });
    }

    private async querySceneReady(): Promise<ToolResponse> {
        return new Promise((resolve) => {
            Editor.Message.request('scene', 'query-is-ready').then((ready: boolean) => {
                resolve({
                    success: true,
                    data: {
                        ready: ready,
                        message: ready ? 'Scene is ready' : 'Scene is not ready'
                    }
                });
            }).catch((err: Error) => {
                resolve({ success: false, error: err.message });
            });
        });
    }

    private async querySceneDirty(): Promise<ToolResponse> {
        return new Promise((resolve) => {
            Editor.Message.request('scene', 'query-dirty').then((dirty: boolean) => {
                resolve({
                    success: true,
                    data: {
                        dirty: dirty,
                        message: dirty ? 'Scene has unsaved changes' : 'Scene is clean'
                    }
                });
            }).catch((err: Error) => {
                resolve({ success: false, error: err.message });
            });
        });
    }

    private async querySceneClasses(extendsClass?: string): Promise<ToolResponse> {
        return new Promise((resolve) => {
            const options: any = {};
            if (extendsClass) {
                options.extends = extendsClass;
            }

            Editor.Message.request('scene', 'query-classes', options).then((classes: any[]) => {
                resolve({
                    success: true,
                    data: {
                        classes: classes,
                        count: classes.length,
                        extendsFilter: extendsClass
                    }
                });
            }).catch((err: Error) => {
                resolve({ success: false, error: err.message });
            });
        });
    }

    private async querySceneComponents(): Promise<ToolResponse> {
        return new Promise((resolve) => {
            Editor.Message.request('scene', 'query-components').then((components: any[]) => {
                resolve({
                    success: true,
                    data: {
                        components: components,
                        count: components.length
                    }
                });
            }).catch((err: Error) => {
                resolve({ success: false, error: err.message });
            });
        });
    }

    private async queryComponentHasScript(className: string): Promise<ToolResponse> {
        return new Promise((resolve) => {
            Editor.Message.request('scene', 'query-component-has-script', className).then((hasScript: boolean) => {
                resolve({
                    success: true,
                    data: {
                        className: className,
                        hasScript: hasScript,
                        message: hasScript ? `Component '${className}' has script` : `Component '${className}' does not have script`
                    }
                });
            }).catch((err: Error) => {
                resolve({ success: false, error: err.message });
            });
        });
    }

    private async queryNodesByAssetUuid(assetUuid: string): Promise<ToolResponse> {
        return new Promise((resolve) => {
            Editor.Message.request('scene', 'query-nodes-by-asset-uuid', assetUuid).then((nodeUuids: string[]) => {
                resolve({
                    success: true,
                    data: {
                        assetUuid: assetUuid,
                        nodeUuids: nodeUuids,
                        count: nodeUuids.length,
                        message: `Found ${nodeUuids.length} nodes using asset`
                    }
                });
            }).catch((err: Error) => {
                resolve({ success: false, error: err.message });
            });
        });
    }
}