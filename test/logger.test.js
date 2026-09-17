import { describe, it } from 'vitest';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { Logger } from '../index.ts';
import {
    captureConsole,
    inTempDir,
    localDate,
    stripAnsi,
    hasAnsi,
    TIMESTAMP,
} from './helpers.js';

const ROOT = path.resolve(fileURLToPath(import.meta.url), '../..');
const REPORT = '__child_report';

/** Logs once with the given options and returns the captured console calls. */
function log(method, options, ...msg) {
    const capture = captureConsole();
    try {
        new Logger({ logInFile: false, useColor: false, ...options })[method](
            ...msg
        );
        return capture.calls;
    } finally {
        capture.restore();
    }
}

const line = (method, ...msg) => log(method, {}, ...msg)[0].args[0];

/** Logs in a throwaway cwd and returns [dir, contents of the single log file]. */
function logToFile(options, write) {
    return inTempDir((dir) => {
        const capture = captureConsole();
        let logger;
        try {
            logger = new Logger({ useColor: false, ...options });
            write(logger);
            logger.flush();
        } finally {
            capture.restore();
        }

        const files = fs.readdirSync(dir);
        const contents =
            files.length === 1
                ? fs.readFileSync(path.join(dir, files[0]), 'utf8')
                : '';

        return { dir, files, contents };
    });
}

/**
 * Runs a snippet in a child process and returns whatever it passed to report().
 * The result travels through a file rather than stdout, which keeps the logger's
 * own console output out of the way without depending on /dev/stdout.
 */
function inChild(body, env) {
    return inTempDir((dir) => {
        execFileSync(
            process.execPath,
            [
                '-e',
                `
            const { Logger } = require(${JSON.stringify(ROOT)});
            const report = (text) => require('fs').writeFileSync('${REPORT}', text);
            const logFile = () => require('fs').readdirSync('.').filter((f) => f.endsWith('.log'))[0];
            ${body}
        `,
            ],
            {
                cwd: dir,
                env: { ...process.env, ...env },
                stdio: ['ignore', 'ignore', 'pipe'],
            }
        );

        const report = path.join(dir, REPORT);

        return fs.existsSync(report) ? fs.readFileSync(report, 'utf8') : '';
    });
}

describe('console routing', () => {
    const cases = [
        ['info', 'info'],
        ['warn', 'warn'],
        ['error', 'error'],
        ['success', 'log'],
        ['trace', 'log'],
    ];

    for (const [level, consoleMethod] of cases) {
        it(`${level}() writes to console.${consoleMethod}`, () => {
            const calls = log(level, {}, 'hello');

            assert.equal(calls.length, 1);
            assert.equal(calls[0].method, consoleMethod);
        });
    }

    it('debug() writes to console.debug when the debug level is on', () => {
        const calls = log('debug', { logLevel: 'debug' }, 'hello');

        assert.equal(calls.length, 1);
        assert.equal(calls[0].method, 'debug');
    });

    it('emits exactly one console call per log', () => {
        for (const level of ['info', 'warn', 'error', 'success', 'trace']) {
            assert.equal(
                log(level, {}, 'x').length,
                1,
                `${level} did not log once`
            );
        }
    });
});

describe('header', () => {
    it('starts with a timestamp followed by the level', () => {
        assert.match(
            line('info', 'hello'),
            /^\[[\d-]{10} [\d:]{8}\] INFO: hello$/
        );
    });

    it('stamps the local date and time', () => {
        assert.ok(line('info', 'x').startsWith(`[${localDate()} `));
    });

    it('pads the timestamp to a fixed width', () => {
        assert.match(
            line('info', 'x').split(' ').slice(0, 2).join(' '),
            TIMESTAMP
        );
    });

    it('names each level in the header', () => {
        for (const [level, label] of Object.entries({
            info: 'INFO',
            warn: 'WARN',
            error: 'ERROR',
            success: 'SUCCESS',
            trace: 'TRACE',
        })) {
            assert.match(line(level, 'x'), new RegExp(`\\] ${label}: x`));
        }
    });

    it('separates the level from the message with a single colon', () => {
        for (const level of ['info', 'warn', 'error', 'success', 'trace']) {
            assert.ok(
                !/::/.test(line(level, 'x')),
                `${level} doubled the colon`
            );
        }
    });

    it('colors the header by default in node', () => {
        assert.ok(
            hasAnsi(log('info', { useColor: undefined }, 'x')[0].args[0])
        );
    });

    it('omits color when useColor is false', () => {
        assert.ok(!hasAnsi(line('info', 'x')));
    });

    it('uses a distinct color per level', () => {
        const prefix = (level) =>
            log(
                level,
                { useColor: true, logLevel: 'debug' },
                'x'
            )[0].args[0].replace(/\[[\d-]{10}.*/s, '');
        const names = ['info', 'warn', 'error', 'success', 'debug'];

        assert.equal(new Set(names.map(prefix)).size, names.length);
    });
});

describe('formatting', () => {
    it('keeps multiple arguments in order', () => {
        assert.match(line('info', 'a', 'b', 'c'), /INFO: a b c$/);
    });

    it('prints strings bare and primitives verbatim', () => {
        assert.match(
            line('info', 'n:', 1, true, null, undefined),
            /INFO: n: 1 true null undefined$/
        );
    });

    it('serializes plain objects as JSON', () => {
        assert.match(
            line('info', { key: 'value', inner: { n: 1 } }),
            /INFO: \{"key":"value","inner":\{"n":1\}\}$/
        );
    });

    it('prints arrays at full depth', () => {
        assert.match(
            line('info', [[[[['deep']]]]]),
            /INFO: \[\[\[\[\["deep"\]\]\]\]\]$/
        );
    });

    it('prints deeply nested objects at full depth', () => {
        assert.match(
            line('info', { a: { b: { c: { d: { e: 1 } } } } }),
            /\{"a":\{"b":\{"c":\{"d":\{"e":1\}\}\}\}\}$/
        );
    });

    it('names the class of a non-plain object', () => {
        class User {
            constructor() {
                this.name = 'ivo';
            }
        }

        assert.match(line('info', new User()), /INFO: User \{"name":"ivo"\}$/);
    });

    it('serializes Maps and Sets', () => {
        assert.match(
            line('info', new Map([['a', 1]])),
            /INFO: Map\(1\) \{"a":1\}$/
        );
        assert.match(line('info', new Set([1, 2])), /INFO: Set\(2\) \[1,2\]$/);
    });

    it('serializes a BigInt instead of throwing', () => {
        assert.match(line('info', { id: 1n }), /INFO: \{"id":1n\}$/);
    });

    it('marks circular references instead of throwing', () => {
        const circular = { a: 1 };
        circular.self = circular;

        assert.match(
            line('info', circular),
            /INFO: \{"a":1,"self":"\[Circular\]"\}$/
        );
    });

    it('handles a cycle through an array', () => {
        const arr = [1];
        arr.push(arr);

        assert.match(line('info', arr), /INFO: \[1,"\[Circular\]"\]$/);
    });

    it('prints the same object twice without calling it circular', () => {
        const shared = { n: 1 };

        assert.match(
            line('info', { a: shared, b: shared }),
            /\{"a":\{"n":1\},"b":\{"n":1\}\}$/
        );
    });

    it('survives a getter that throws', () => {
        const hostile = {
            get boom() {
                throw new Error('nope');
            },
            ok: 1,
        };

        assert.match(line('info', hostile), /"boom":"\[Throws\]","ok":1/);
    });

    it('keeps an Error stack readable at the top level', () => {
        const output = line('error', new Error('boom'));

        assert.match(output, /ERROR: Error: boom\n\s+at /);
    });

    it('serializes symbols, functions and dates', () => {
        assert.match(
            line('info', {
                s: Symbol('x'),
                f: function named() {},
                d: new Date(0),
            }),
            /\{"s":Symbol\(x\),"f":\[Function: named\],"d":"1970-01-01T00:00:00\.000Z"\}$/
        );
    });

    it('never throws on an exotic value', () => {
        const proxy = new Proxy(
            {},
            {
                ownKeys() {
                    throw new Error('nope');
                },
            }
        );

        assert.doesNotThrow(() => log('info', {}, proxy));
        assert.match(line('info', proxy), /INFO: \[Unserializable\]$/);
    });
});

describe('trace', () => {
    it('appends the caller stack', () => {
        const output = line('trace', 'tracing');

        assert.match(output, /^\[[\d-]{10} [\d:]{8}\] TRACE: tracing\n\s+at /);
    });

    it('starts the stack at the caller, not inside the logger', () => {
        const frames = line('trace', 'x').split('\n').slice(1);

        assert.ok(frames.length > 0);
        assert.ok(
            !/index\.js/.test(frames[0]),
            `stack leaked a logger frame: ${frames[0]}`
        );
    });

    it('still traces when captureStackTrace is missing', () => {
        const captureStackTrace = Error.captureStackTrace;
        delete Error.captureStackTrace;
        try {
            const output = line('trace', 'x');

            assert.match(output, /TRACE: x/);
            assert.match(output, /\n\s+at /);
        } finally {
            Error.captureStackTrace = captureStackTrace;
        }
    });
});

describe('log level', () => {
    it('drops debug output by default', () => {
        assert.equal(log('debug', {}, 'hidden').length, 0);
    });

    it('drops debug output for any level other than "debug"', () => {
        assert.equal(log('debug', { logLevel: 'prod' }, 'hidden').length, 0);
        assert.equal(log('debug', { logLevel: 'verbose' }, 'hidden').length, 0);
    });

    it('still emits the other levels at the default level', () => {
        for (const level of ['info', 'warn', 'error', 'success', 'trace']) {
            assert.equal(
                log(level, {}, 'x').length,
                1,
                `${level} was suppressed`
            );
        }
    });
});

describe('file output', () => {
    it('names the file after the local date', () => {
        const { files } = logToFile({}, (logger) => logger.info('to file'));

        assert.deepEqual(files, [`${localDate()}-logger.log`]);
    });

    it('writes the same line it printed', () => {
        const { contents } = logToFile({}, (logger) => logger.info('to file'));

        assert.match(contents, /^\[[\d-]{10} [\d:]{8}\] INFO: to file\n$/);
    });

    it('honours a custom fileName', () => {
        const { files } = logToFile({ fileName: 'rest-server.log' }, (logger) =>
            logger.info('x')
        );

        assert.deepEqual(files, [`${localDate()}-rest-server.log`]);
    });

    it('date-stamps the file, not the directory, when fileName has a path', () => {
        inTempDir((dir) => {
            const capture = captureConsole();
            try {
                const logger = new Logger({
                    fileName: 'logs/app.log',
                    useColor: false,
                });
                logger.info('x');
                logger.flush();
            } finally {
                capture.restore();
            }

            assert.deepEqual(fs.readdirSync(dir), ['logs']);
            assert.deepEqual(fs.readdirSync(path.join(dir, 'logs')), [
                `${localDate()}-app.log`,
            ]);
        });
    });

    it('creates a missing directory', () => {
        inTempDir((dir) => {
            const capture = captureConsole();
            try {
                const logger = new Logger({
                    fileName: 'deep/nested/app.log',
                    useColor: false,
                });
                logger.info('x');
                logger.flush();
            } finally {
                capture.restore();
            }

            assert.match(
                fs.readFileSync(
                    path.join(dir, 'deep/nested', `${localDate()}-app.log`),
                    'utf8'
                ),
                /INFO: x\n$/
            );
        });
    });

    it('appends rather than truncating', () => {
        const { contents } = logToFile({}, (logger) => {
            logger.info('first');
            logger.warn('second');
        });
        const lines = contents.trim().split('\n');

        assert.equal(lines.length, 2);
        assert.match(lines[0], /INFO: first$/);
        assert.match(lines[1], /WARN: second$/);
    });

    it('strips color codes from the file', () => {
        const { contents } = logToFile({ useColor: true }, (logger) =>
            logger.info('colored')
        );

        assert.ok(!hasAnsi(contents), 'file still contains escape codes');
        assert.equal(stripAnsi(contents), contents);
    });

    it('writes traces to the file too', () => {
        const { contents } = logToFile({}, (logger) => logger.trace('traced'));

        assert.match(contents, /TRACE: traced\n\s+at /);
    });

    it('writes nothing when logInFile is false', () => {
        const { files } = logToFile({ logInFile: false }, (logger) =>
            logger.info('x')
        );

        assert.deepEqual(files, []);
    });

    it('flushes on its own without an explicit flush', async () => {
        await inTempDir(async (dir) => {
            const capture = captureConsole();
            try {
                new Logger({ useColor: false }).info('deferred');
            } finally {
                capture.restore();
            }

            assert.deepEqual(
                fs.readdirSync(dir),
                [],
                'the write should be batched, not immediate'
            );

            const file = path.join(dir, `${localDate()}-logger.log`);

            // Polls for content, not for the file: opening the append descriptor
            // creates it before the write itself lands.
            let contents = '';
            for (let waited = 0; waited < 2000 && !contents; waited += 20) {
                contents = fs.existsSync(file)
                    ? fs.readFileSync(file, 'utf8')
                    : '';

                if (!contents) {
                    await new Promise((resolve) => setTimeout(resolve, 20));
                }
            }

            assert.match(contents, /INFO: deferred\n$/);
        });
    });

    it('batches many lines into one file in order', () => {
        const { contents } = logToFile({}, (logger) => {
            for (let i = 0; i < 200; i++) {
                logger.info(`line ${i}`);
            }
        });
        const lines = contents.trim().split('\n');

        assert.equal(lines.length, 200);
        assert.match(lines[0], /INFO: line 0$/);
        assert.match(lines[199], /INFO: line 199$/);
    });

    it('flushes buffered lines when the process exits', () => {
        const output = inChild(`
            new Logger({ useColor: false }).info('on exit');
            const fs = require('fs');
            process.on('exit', () => {
                const file = logFile();
                report(file + '|' + fs.readFileSync(file, 'utf8'));
            });
        `);

        assert.match(output, /INFO: on exit\n$/);
        assert.ok(output.startsWith(`${localDate()}-logger.log|`), output);
    });

    it('reports a write failure once, not once per line', () => {
        inTempDir((dir) => {
            fs.writeFileSync(path.join(dir, 'blocked'), '');
            const capture = captureConsole();
            try {
                const logger = new Logger({
                    fileName: 'blocked/app.log',
                    useColor: false,
                });
                for (let i = 0; i < 3; i++) {
                    logger.info(`x${i}`);
                    logger.flush();
                }
            } finally {
                capture.restore();
            }

            const errors = capture.calls.filter(
                (call) => call.method === 'error'
            );

            assert.equal(
                errors.length,
                1,
                `expected one error, got ${errors.length}`
            );
            assert.match(errors[0].args[0], /logger cannot write to/);
        });
    });
});

describe('environment', () => {
    it('detects node and writes files', () => {
        const { files } = logToFile({}, (logger) => logger.info('x'));

        assert.equal(files.length, 1);
    });

    it('writes no file and no color when there is no node runtime', () => {
        inTempDir((dir) => {
            const capture = captureConsole();
            const realProcess = global.process;
            let output;
            try {
                delete global.process;
                new Logger().info('in a browser');
                output = capture.calls[0].args[0];
            } finally {
                global.process = realProcess;
                capture.restore();
            }

            assert.deepEqual(fs.readdirSync(dir), []);
            assert.ok(
                !hasAnsi(output),
                'escape codes are noise in a browser console'
            );
            assert.match(output, /INFO: in a browser$/);
        });
    });

    it('does not import fs or path at module load', () => {
        const source = fs.readFileSync(path.join(ROOT, 'index.js'), 'utf8');
        const topLevel = source.slice(0, source.indexOf('class Logger'));

        assert.ok(
            !/^const .*require\(["'](fs|path)["']\)/m.test(topLevel),
            'fs/path required at module scope'
        );
    });

    it('maps fs and path away for browser bundlers', () => {
        const pkg = JSON.parse(
            fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8')
        );

        assert.deepEqual(pkg.browser, { fs: false, path: false });
    });
});

describe('options', () => {
    it('constructs without options', () => {
        inTempDir(() => {
            const capture = captureConsole();
            try {
                assert.doesNotThrow(() => new Logger().info('x'));
            } finally {
                capture.restore();
            }
        });
    });

    it('ignores options of the wrong type', () => {
        const calls = log(
            'info',
            { useColor: 'yes', logInFile: 'no', fileName: 42 },
            'x'
        );

        assert.equal(calls.length, 1);
        assert.ok(
            hasAnsi(calls[0].args[0]),
            'a non-boolean useColor should not disable color'
        );
    });

    it('falls back to logger.log for a blank fileName', () => {
        const { files } = logToFile({ fileName: '   ' }, (logger) =>
            logger.info('x')
        );

        assert.deepEqual(files, [`${localDate()}-logger.log`]);
    });

    it('accepts a logLevel read from the environment', () => {
        const output = inChild(
            `
            const fs = require('fs');
            const logger = new Logger({ logLevel: process.env.LOG_LEVEL, useColor: false });
            logger.debug('from env');
            logger.flush();
            report(fs.readFileSync(logFile(), 'utf8'));
        `,
            { LOG_LEVEL: 'debug' }
        );

        assert.match(output, /DEBUG: from env/);
    });
});
