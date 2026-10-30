/**
 * 游戏状态枚举
 */
export const GameState = {
    MENU: 'menu',           // 主菜单
    COMPONENT_SELECTION: 'component_selection', // 组件选择
    LOADING: 'loading',     // 加载中
    PLAYING: 'playing',     // 游戏中
    PAUSED: 'paused',       // 暂停
    GAME_OVER: 'game_over', // 游戏结束
    SETTINGS: 'settings'    // 设置
};

/**
 * 游戏状态管理器
 */
export class GameStateManager {
    constructor() {
        this.currentState = GameState.MENU;
        this.previousState = null;
        this.stateChangeCallbacks = new Map();
    }

    /**
     * 切换游戏状态
     */
    changeState(newState) {
        if (this.currentState === newState) {
            return;
        }

        this.previousState = this.currentState;
        this.currentState = newState;

        console.log(`Game state changed: ${this.previousState} -> ${this.currentState}`);

        // 触发状态改变回调
        this.triggerStateChangeCallbacks(newState, this.previousState);
    }

    /**
     * 获取当前状态
     */
    getCurrentState() {
        return this.currentState;
    }

    /**
     * 获取上一个状态
     */
    getPreviousState() {
        return this.previousState;
    }

    /**
     * 注册状态改变回调
     */
    onStateChange(state, callback) {
        if (!this.stateChangeCallbacks.has(state)) {
            this.stateChangeCallbacks.set(state, []);
        }
        this.stateChangeCallbacks.get(state).push(callback);
    }

    /**
     * 移除状态改变回调
     */
    offStateChange(state, callback) {
        if (this.stateChangeCallbacks.has(state)) {
            const callbacks = this.stateChangeCallbacks.get(state);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }

    /**
     * 触发状态改变回调
     */
    triggerStateChangeCallbacks(newState, oldState) {
        if (this.stateChangeCallbacks.has(newState)) {
            this.stateChangeCallbacks.get(newState).forEach(callback => {
                callback(newState, oldState);
            });
        }
    }

    /**
     * 检查是否处于指定状态
     */
    isState(state) {
        return this.currentState === state;
    }

    /**
     * 返回上一个状态
     */
    goBack() {
        if (this.previousState) {
            this.changeState(this.previousState);
        }
    }
}


