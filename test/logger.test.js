import { describe, it } from 'vitest';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { Logger } from '../index.ts';
import {
    ESC,
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

describe('json output', () => {
    /** Logs once in JSON mode and returns the parsed console record. */
    function jsonLine(method, options, ...msg) {
        const calls = log(method, { output: 'json', ...options }, ...msg);

        assert.equal(calls.length, 1, `${method} did not log once`);

        return JSON.parse(calls[0].args[0]);
    }

    const arg = (value) => jsonLine('info', {}, 'x', value).args[0];

    it('defaults to the text format', () => {
        assert.match(
            line('info', 'hello'),
            /^\[[\d-]{10} [\d:]{8}\] INFO: hello$/
        );
    });

    it('writes one parseable object per line', () => {
        const calls = log('info', { output: 'json' }, 'one');

        assert.doesNotThrow(() => JSON.parse(calls[0].args[0]));
        assert.equal(calls[0].args[0].split('\n').length, 1);
    });

    it('stamps an ISO 8601 time', () => {
        const { time } = jsonLine('info', {}, 'x');

        assert.match(time, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
        assert.ok(!Number.isNaN(Date.parse(time)));
    });

    it('names the level in lowercase', () => {
        for (const level of ['info', 'warn', 'error', 'success', 'trace']) {
            assert.equal(jsonLine(level, {}, 'x').level, level);
        }

        assert.equal(
            jsonLine('debug', { logLevel: 'debug' }, 'x').level,
            'debug'
        );
    });

    it('is never coloured, whatever useColor says', () => {
        const calls = log('info', { output: 'json', useColor: true }, 'x');

        assert.ok(!hasAnsi(calls[0].args[0]));
    });

    it('carries a lone message and no args', () => {
        const record = jsonLine('info', {}, 'hi');

        assert.equal(record.msg, 'hi');
        assert.ok(!('args' in record));
    });

    it('joins the leading strings into msg', () => {
        assert.equal(jsonLine('info', {}, 'a', 'b', 'c').msg, 'a b c');
    });

    it('splits msg from the rest, in order', () => {
        const record = jsonLine('info', {}, 'user', { a: 1 }, 'saved');

        assert.equal(record.msg, 'user');
        assert.deepEqual(record.args, [{ a: 1 }, 'saved']);
    });

    it('omits msg when the first argument is not a string', () => {
        const record = jsonLine('info', {}, { a: 1 }, 'trailing');

        assert.ok(!('msg' in record));
        assert.deepEqual(record.args, [{ a: 1 }, 'trailing']);
    });

    it('omits msg and args for a bare call', () => {
        const record = jsonLine('info', {});

        assert.deepEqual(Object.keys(record), ['time', 'level']);
    });

    it('lifts the first Error out of args', () => {
        const record = jsonLine('error', {}, new Error('boom'));

        assert.equal(record.err.type, 'Error');
        assert.equal(record.err.message, 'boom');
        assert.match(record.err.stack, /\n\s+at /);
        assert.ok(!('args' in record));
    });

    it('keeps the message beside the Error it describes', () => {
        const record = jsonLine(
            'error',
            {},
            'save failed',
            { id: 7 },
            new Error('boom')
        );

        assert.equal(record.msg, 'save failed');
        assert.equal(record.err.message, 'boom');
        assert.deepEqual(record.args, [{ id: 7 }]);
    });

    it('names a subclassed Error by its own name', () => {
        class HttpError extends Error {
            constructor() {
                super('teapot');
                this.name = 'HttpError';
            }
        }

        assert.equal(
            jsonLine('error', {}, new HttpError()).err.type,
            'HttpError'
        );
    });

    it('leaves a second Error in args', () => {
        const record = jsonLine(
            'error',
            {},
            new Error('first'),
            new Error('second')
        );

        assert.equal(record.err.message, 'first');
        assert.equal(record.args.length, 1);
        assert.equal(record.args[0].message, 'second');
    });

    it('attaches the caller stack to a trace and nothing else', () => {
        assert.match(jsonLine('trace', {}, 'x').stack, /^\s*at /);
        assert.ok(!('stack' in jsonLine('info', {}, 'x')));
    });

    it('keeps the trace stack on one line as an escaped string', () => {
        const calls = log('trace', { output: 'json' }, 'x');

        assert.equal(calls[0].args[0].split('\n').length, 1);
        assert.match(JSON.parse(calls[0].args[0]).stack, /\n\s+at /);
    });

    it('represents the values JSON cannot carry', () => {
        class Point {
            constructor() {
                this.x = 1;
            }
        }

        assert.equal(arg(undefined), '[undefined]');
        assert.equal(arg(9007199254740993n), '9007199254740993n');
        assert.equal(arg(Symbol('x')), 'Symbol(x)');
        assert.equal(
            arg(function named() {}),
            '[Function: named]'
        );
        assert.equal(
            arg(() => {}),
            '[Function: anonymous]'
        );
        assert.equal(arg(new Date(0)), '1970-01-01T00:00:00.000Z');
        assert.equal(arg(new Date('nope')), 'Invalid Date');
        assert.equal(arg(/re/g), '/re/g');
        assert.deepEqual(arg(new Map([['k', 1]])), {
            __type: 'Map',
            entries: [['k', 1]],
        });
        assert.deepEqual(arg(new Set([1, 2])), {
            __type: 'Set',
            values: [1, 2],
        });
        assert.deepEqual(arg(new Point()), { x: 1 });
        assert.equal(arg(NaN), 'NaN');
        assert.equal(arg(Infinity), 'Infinity');
        assert.equal(arg(-Infinity), '-Infinity');
    });

    it('drops the class name a text line would print', () => {
        class User {
            constructor() {
                this.name = 'ivo';
            }
        }

        assert.match(line('info', new User()), /User \{"name":"ivo"\}$/);
        assert.deepEqual(arg(new User()), { name: 'ivo' });
    });

    it('flattens -0 to 0, which JSON has no sign for', () => {
        assert.ok(Object.is(arg(-0), 0));
        assert.match(line('info', -0), /INFO: -0$/);
    });

    it('keeps nulls, booleans and numbers typed', () => {
        const record = jsonLine('info', {}, 'x', null, true, 1.5, 'tail');

        assert.deepEqual(record.args, [null, true, 1.5, 'tail']);
    });

    it('walks nested values at full depth', () => {
        assert.deepEqual(arg({ a: { b: { c: [1, { d: new Date(0) }] } } }), {
            a: { b: { c: [1, { d: '1970-01-01T00:00:00.000Z' }] } },
        });
    });

    it('marks a cycle instead of throwing', () => {
        const circular = { a: 1 };
        circular.self = circular;

        assert.deepEqual(arg(circular), { a: 1, self: '[Circular]' });
    });

    it('marks a cycle through an array', () => {
        const arr = [1];
        arr.push(arr);

        assert.deepEqual(arg(arr), [1, '[Circular]']);
    });

    it('repeats a shared object rather than calling it circular', () => {
        const shared = { n: 1 };

        assert.deepEqual(arg({ a: shared, b: shared }), {
            a: { n: 1 },
            b: { n: 1 },
        });
    });

    it('marks a getter that throws', () => {
        const hostile = {
            get boom() {
                throw new Error('nope');
            },
            ok: 1,
        };

        assert.deepEqual(arg(hostile), { boom: '[Throws]', ok: 1 });
    });

    it('marks a value that cannot be walked at all', () => {
        const proxy = new Proxy(
            {},
            {
                ownKeys() {
                    throw new Error('nope');
                },
            }
        );

        assert.doesNotThrow(() => log('info', { output: 'json' }, 'x', proxy));
        assert.equal(arg(proxy), '[Unserializable]');
    });

    it('falls back to the text line when the record cannot be serialized', () => {
        const stringify = JSON.stringify;
        JSON.stringify = () => {
            throw new Error('no JSON for you');
        };
        let output;
        try {
            output = log('info', { output: 'json' }, 'fallback')[0].args[0];
        } finally {
            JSON.stringify = stringify;
        }

        assert.match(output, /^\[[\d-]{10} [\d:]{8}\] INFO: fallback$/);
    });

    it('still gates debug', () => {
        assert.equal(log('debug', { output: 'json' }, 'hidden').length, 0);
        assert.equal(
            log('debug', { output: 'json', logLevel: 'debug' }, 'shown').length,
            1
        );
    });

    it('writes JSON lines to the file', () => {
        const { contents } = logToFile({ output: 'json' }, (logger) => {
            logger.info('one');
            logger.warn('two', { a: 1 });
        });
        const lines = contents.trim().split('\n');

        assert.equal(lines.length, 2);
        assert.equal(JSON.parse(lines[0]).msg, 'one');
        assert.deepEqual(JSON.parse(lines[1]).args, [{ a: 1 }]);
    });

    it('gives a text console and a JSON file with fileOutput alone', () => {
        let printed;
        const { contents } = logToFile({ fileOutput: 'json' }, (logger) => {
            const capture = captureConsole();
            try {
                logger.info('split', { id: 7 });
            } finally {
                capture.restore();
            }
            printed = capture.calls[0].args[0];
        });

        assert.match(
            printed,
            /^\[[\d-]{10} [\d:]{8}\] INFO: split \{"id":7\}$/
        );
        assert.equal(JSON.parse(contents.trim()).msg, 'split');
    });

    it('lets output set the file format too', () => {
        const { contents } = logToFile({ output: 'json' }, (logger) =>
            logger.info('both')
        );

        assert.equal(JSON.parse(contents.trim()).msg, 'both');
    });

    it('keeps a JSON console beside a text file', () => {
        let printed;
        const { contents } = logToFile(
            { output: 'json', fileOutput: 'text' },
            (logger) => {
                const capture = captureConsole();
                try {
                    logger.info('reversed');
                } finally {
                    capture.restore();
                }
                printed = capture.calls[0].args[0];
            }
        );

        assert.equal(JSON.parse(printed).msg, 'reversed');
        assert.match(contents, /INFO: reversed\n$/);
    });

    it('leaves escape codes in a JSON payload alone', () => {
        // JSON.stringify escapes ESC as \u001b, so the file's ANSI strip never
        // sees a raw escape and cannot eat a payload that contains one.
        const painted = `${ESC}[31mred${ESC}[0m`;
        const { contents } = logToFile(
            { output: 'json', useColor: true },
            (logger) => logger.info('x', { painted })
        );
        const record = JSON.parse(contents.trim());

        assert.ok(!hasAnsi(contents), 'the raw escape reached the file');
        assert.equal(record.args[0].painted, painted);
    });

    it('batches many JSON lines into one file in order', () => {
        const { contents } = logToFile({ output: 'json' }, (logger) => {
            for (let i = 0; i < 200; i++) {
                logger.info('line', i);
            }
        });
        const lines = contents.trim().split('\n');

        assert.equal(lines.length, 200);
        assert.deepEqual(JSON.parse(lines[0]).args, [0]);
        assert.deepEqual(JSON.parse(lines[199]).args, [199]);
    });

    it('flushes JSON lines when the process exits', () => {
        const output = inChild(`
            new Logger({ output: 'json' }).info('on exit', { id: 1 });
            const fs = require('fs');
            process.on('exit', () => report(fs.readFileSync(logFile(), 'utf8')));
        `);
        const record = JSON.parse(output.trim());

        assert.equal(record.msg, 'on exit');
        assert.deepEqual(record.args, [{ id: 1 }]);
    });

    it('ignores an output mode it does not know', () => {
        assert.match(line('info', 'x'), /INFO: x$/);
        assert.match(
            log('info', { output: 'yaml' }, 'x')[0].args[0],
            /INFO: x$/
        );
        assert.match(
            log('info', { output: 'json', fileOutput: 'yaml' }, 'x')[0].args[0],
            /^\{"time"/
        );
    });

    it('reports a write failure as JSON too', () => {
        inTempDir((dir) => {
            fs.writeFileSync(path.join(dir, 'blocked'), '');
            const capture = captureConsole();
            try {
                const logger = new Logger({
                    fileName: 'blocked/app.log',
                    output: 'json',
                });
                logger.info('x');
                logger.flush();
            } finally {
                capture.restore();
            }

            const errors = capture.calls.filter(
                (call) => call.method === 'error'
            );

            assert.equal(errors.length, 1);
            assert.match(
                JSON.parse(errors[0].args[0]).msg,
                /^logger cannot write to /
            );
        });
    });

    it('inherits the file format from output', () => {
        const { contents } = logToFile(
            { output: 'json', fileOutput: undefined },
            (logger) => logger.info('inherited')
        );

        assert.equal(JSON.parse(contents.trim()).msg, 'inherited');
    });
});
