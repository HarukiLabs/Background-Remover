/**
 * CommandHistory - Command Pattern for Undo/Redo
 * Stores operations, NOT canvas snapshots
 */

import { EditorState, EffectNode, Layer } from './EditorState';

export type CommandType =
    | 'SET_EFFECT'
    | 'ADD_EFFECT'
    | 'REMOVE_EFFECT'
    | 'TOGGLE_EFFECT'
    | 'SET_LAYER'
    | 'ADD_LAYER'
    | 'REMOVE_LAYER'
    | 'TOGGLE_LAYER'
    | 'SET_BACKGROUND'
    | 'SET_TRANSFORM';

export interface Command {
    type: CommandType;
    timestamp: number;
    payload: {
        targetId: string;
        prevValue: any;
        newValue: any;
    };
}

export class CommandHistory {
    private commands: Command[] = [];
    private currentIndex: number = -1;
    private maxHistory: number = 50;

    public execute(command: Command, applyFn: (cmd: Command) => void): void {
        // Remove any commands after current index (redo branch is lost)
        if (this.currentIndex < this.commands.length - 1) {
            this.commands = this.commands.slice(0, this.currentIndex + 1);
        }

        // Add new command
        this.commands.push(command);
        this.currentIndex++;

        // Trim history if too long
        if (this.commands.length > this.maxHistory) {
            this.commands.shift();
            this.currentIndex--;
        }

        // Apply the command
        applyFn(command);
    }

    public undo(applyFn: (cmd: Command, reverse: boolean) => void): boolean {
        if (!this.canUndo()) return false;

        const command = this.commands[this.currentIndex];
        applyFn(command, true); // reverse = true
        this.currentIndex--;
        return true;
    }

    public redo(applyFn: (cmd: Command, reverse: boolean) => void): boolean {
        if (!this.canRedo()) return false;

        this.currentIndex++;
        const command = this.commands[this.currentIndex];
        applyFn(command, false); // reverse = false
        return true;
    }

    public canUndo(): boolean {
        return this.currentIndex >= 0;
    }

    public canRedo(): boolean {
        return this.currentIndex < this.commands.length - 1;
    }

    public clear(): void {
        this.commands = [];
        this.currentIndex = -1;
    }

    public getHistory(): Command[] {
        return [...this.commands];
    }
}

// Helper to create commands
export const createCommand = (
    type: CommandType,
    targetId: string,
    prevValue: any,
    newValue: any
): Command => ({
    type,
    timestamp: Date.now(),
    payload: { targetId, prevValue, newValue }
});

// Apply command to state (forward or reverse)
export const applyCommand = (
    state: EditorState,
    command: Command,
    reverse: boolean = false
): EditorState => {
    const value = reverse ? command.payload.prevValue : command.payload.newValue;
    const { targetId } = command.payload;

    switch (command.type) {
        case 'SET_EFFECT': {
            return {
                ...state,
                effects: state.effects.map(e =>
                    e.id === targetId ? { ...e, params: value } : e
                )
            };
        }
        case 'ADD_EFFECT': {
            if (reverse) {
                return { ...state, effects: state.effects.filter(e => e.id !== targetId) };
            }
            return { ...state, effects: [...state.effects, value as EffectNode] };
        }
        case 'REMOVE_EFFECT': {
            if (reverse) {
                return { ...state, effects: [...state.effects, value as EffectNode] };
            }
            return { ...state, effects: state.effects.filter(e => e.id !== targetId) };
        }
        case 'TOGGLE_EFFECT': {
            return {
                ...state,
                effects: state.effects.map(e =>
                    e.id === targetId ? { ...e, enabled: value } : e
                )
            };
        }
        case 'SET_LAYER': {
            return {
                ...state,
                layers: state.layers.map(l =>
                    l.id === targetId ? { ...l, params: value } : l
                )
            };
        }
        case 'TOGGLE_LAYER': {
            return {
                ...state,
                layers: state.layers.map(l =>
                    l.id === targetId ? { ...l, visible: value } : l
                )
            };
        }
        case 'SET_TRANSFORM': {
            return {
                ...state,
                layers: state.layers.map(l =>
                    l.id === targetId ? { ...l, transform: value } : l
                )
            };
        }
        default:
            return state;
    }
};
