import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const ESC = String.fromCharCode(27);

/** Collects everything written to the console methods the logger uses. */
function captureConsole() {
    const methods = ['log', 'info', 'warn', 'error', 'debug', 'trace'];
    const calls = [];
    const original = {};

    for (const method of methods) {
        original[method] = console[method];
        console[method] = (...args) => calls.push({ method, args });
    }

    return {
        calls,
        get lines() {
            return calls.map((call) => call.args.join(' '));
        },
        restore() {
            for (const method of methods) {
                console[method] = original[method];
            }
        },
    };
}

/**
 * Runs fn inside a throwaway cwd, since the logger writes to a relative path.
 * Handles async fns too, so cleanup waits for the work to finish.
 */
function inTempDir(fn) {
    const cwd = process.cwd();
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'logger-js-test-'));
    const cleanup = () => {
        process.chdir(cwd);
        fs.rmSync(dir, { recursive: true, force: true });
    };

    process.chdir(dir);

    let result;
    try {
        result = fn(dir);
    } catch (error) {
        cleanup();
        throw error;
    }

    if (result && typeof result.then === 'function') {
        return result.then(
            (value) => {
                cleanup();
                return value;
            },
            (error) => {
                cleanup();
                throw error;
            }
        );
    }

    cleanup();
    return result;
}

const localDate = () => {
    const pad = (num) => String(num).padStart(2, '0');
    const date = new Date();
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

const ansiPattern = () => new RegExp(ESC + '\\[[0-9;]*m', 'g');

const stripAnsi = (msg) => msg.replace(ansiPattern(), '');

const hasAnsi = (msg) => ansiPattern().test(msg);

const TIMESTAMP = /^\[\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\]$/;

export {
    ESC,
    captureConsole,
    inTempDir,
    localDate,
    stripAnsi,
    hasAnsi,
    TIMESTAMP,
};
