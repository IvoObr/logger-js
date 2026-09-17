import { describe, it } from 'vitest';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import { Logger } from '../index.ts';
import { captureConsole, inTempDir, hasAnsi } from './helpers.js';

/** Logs once with the given options and returns the raw console lines. */
function lines(options, method, ...msg) {
    const capture = captureConsole();
    try {
        new Logger({ logInFile: false, useColor: false, ...options })[method](
            ...msg
        );
        return capture.calls.map((call) => call.args[0]);
    } finally {
        capture.restore();
    }
}

/** The single console line a call produced. */
const one = (options, method, ...msg) => lines(options, method, ...msg)[0];

/** The parsed JSON record a call printed to the console. */
const record = (method, ...msg) =>
    JSON.parse(one({ output: 'json' }, method, ...msg));

/** The JSON record for a single info() argument. */
const valueOf = (arg) => record('info', arg).args[0];

/** Logs in a throwaway cwd and returns the console lines and file contents. */
function toFile(options, write) {
    return inTempDir((dir) => {
        const capture = captureConsole();
        try {
            const logger = new Logger({ useColor: false, ...options });
            write(logger);
            logger.flush();
        } finally {
            capture.restore();
        }

        const files = fs.readdirSync(dir);

        return {
            console: capture.calls.map((call) => call.args[0]),
            contents: fs.readFileSync(path.join(dir, files[0]), 'utf8'),
        };
    });
}

describe('output option', () => {
    it('keeps the text line when no output is asked for', () => {
        assert.match(one({}, 'info', 'hello'), /^\[[\d-]{10} [\d:]{8}\] INFO: hello$/);
    });

    it('keeps the text line for an explicit text output', () => {
        assert.equal(
            one({ output: 'text' }, 'info', 'hello'),
            one({}, 'info', 'hello')
        );
    });

    it('falls back to text for an unknown output value', () => {
        assert.match(one({ output: 'xml' }, 'info', 'hello'), /INFO: hello$/);
    });

    it('prints one parseable JSON object per line', () => {
        const line = one({ output: 'json' }, 'info', 'hello');

        assert.equal(line.indexOf('\n'), -1);
        assert.doesNotThrow(() => JSON.parse(line));
    });

    it('never colours a JSON line', () => {
        assert.ok(!hasAnsi(one({ output: 'json', useColor: true }, 'info', 'x')));
    });

    it('writes JSON to both sinks when output is json', () => {
        const { console: printed, contents } = toFile(
            { output: 'json' },
            (logger) => logger.info('both')
        );

        assert.equal(JSON.parse(printed[0]).msg, 'both');
        assert.equal(JSON.parse(contents.trim()).msg, 'both');
    });

    it('gives a text console and a JSON file for fileOutput alone', () => {
        const { console: printed, contents } = toFile(
            { fileOutput: 'json' },
            (logger) => logger.info('split')
        );

        assert.match(printed[0], /INFO: split$/);
        assert.equal(JSON.parse(contents.trim()).msg, 'split');
    });

    it('keeps the file text when only the console is json', () => {
        const { console: printed, contents } = toFile(
            { output: 'json', fileOutput: 'text' },
            (logger) => logger.info('split')
        );

        assert.equal(JSON.parse(printed[0]).msg, 'split');
        assert.match(contents, /INFO: split\n$/);
    });

    it('strips colour from a text file line while the console keeps it', () => {
        const { console: printed, contents } = toFile(
            { useColor: true, output: 'text' },
            (logger) => logger.info('coloured')
        );

        assert.ok(hasAnsi(printed[0]));
        assert.ok(!hasAnsi(contents));
    });
});

describe('json record', () => {
    it('stamps the time as an ISO instant', () => {
        assert.match(
            record('info', 'x').time,
            /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
        );
    });

    it('names the level in lower case', () => {
        for (const level of ['info', 'warn', 'error', 'trace', 'success']) {
            assert.equal(record(level, 'x').level, level);
        }
    });

    it('names the debug level in lower case too', () => {
        const line = one({ output: 'json', logLevel: 'debug' }, 'debug', 'x');

        assert.equal(JSON.parse(line).level, 'debug');
    });

    it('carries a lone string as msg with no args', () => {
        const entry = record('info', 'hi');

        assert.equal(entry.msg, 'hi');
        assert.ok(!('args' in entry));
    });

    it('carries no msg and no args when nothing was logged', () => {
        const entry = record('info');

        assert.ok(!('msg' in entry));
        assert.ok(!('args' in entry));
    });

    it('joins the leading strings into msg and keeps the rest as args', () => {
        const entry = record('info', 'user', { id: 7 }, 'saved');

        assert.equal(entry.msg, 'user');
        assert.deepEqual(entry.args, [{ id: 7 }, 'saved']);
    });

    it('joins two leading strings with a single space', () => {
        const entry = record('info', 'user', 'signed in', { id: 7 });

        assert.equal(entry.msg, 'user signed in');
        assert.deepEqual(entry.args, [{ id: 7 }]);
    });

    it('omits msg when the first argument is not a string', () => {
        const entry = record('info', { id: 7 }, 'saved');

        assert.ok(!('msg' in entry));
        assert.deepEqual(entry.args, [{ id: 7 }, 'saved']);
    });

    it('describes an Error as err and drops it from args', () => {
        const entry = record('error', new Error('boom'));

        assert.equal(entry.err.type, 'Error');
        assert.equal(entry.err.message, 'boom');
        assert.match(entry.err.stack, /at /);
        assert.ok(!('args' in entry));
    });

    it('keeps the message beside an Error', () => {
        const entry = record('error', 'failed', new Error('boom'), { id: 7 });

        assert.equal(entry.msg, 'failed');
        assert.equal(entry.err.message, 'boom');
        assert.deepEqual(entry.args, [{ id: 7 }]);
    });

    it('takes only the first Error out of args', () => {
        const entry = record('error', new Error('first'), new Error('second'));

        assert.equal(entry.err.message, 'first');
        assert.equal(entry.args.length, 1);
        assert.equal(entry.args[0].message, 'second');
    });

    it('names a subclassed Error by its own type', () => {
        class HttpError extends Error {}
        const entry = record('error', new HttpError('nope'));

        assert.equal(entry.err.type, 'Error');
        assert.equal(entry.err.message, 'nope');
    });

    it('carries the captured frames as stack for trace', () => {
        const entry = record('trace', 'x');

        assert.equal(typeof entry.stack, 'string');
        assert.match(entry.stack, /^\s*at /);
    });

    it('omits stack for every other level', () => {
        assert.ok(!('stack' in record('info', 'x')));
        assert.ok(!('stack' in record('error', 'x')));
    });
});

describe('json values', () => {
    it('keeps JSON-native values as they are', () => {
        assert.deepEqual(record('info', 1, true, null).args, [1, true, null]);
    });

    it('keeps a nested structure at any depth', () => {
        assert.deepEqual(valueOf({ a: [{ b: { c: [1] } }] }), {
            a: [{ b: { c: [1] } }],
        });
    });

    it('renders undefined as a marker', () => {
        assert.equal(valueOf(undefined), '[undefined]');
    });

    it('renders a bigint as a decimal string with an n', () => {
        assert.equal(valueOf(9007199254740993n), '9007199254740993n');
    });

    it('renders a symbol by its description', () => {
        assert.equal(valueOf(Symbol('x')), 'Symbol(x)');
    });

    it('renders a named function by its name', () => {
        assert.equal(
            valueOf(function handler() {}),
            '[Function: handler]'
        );
    });

    it('renders an anonymous function as anonymous', () => {
        assert.equal(valueOf([() => 1][0]), '[Function: anonymous]');
    });

    it('renders a nested Error as type, message and stack', () => {
        const value = valueOf({ cause: new TypeError('bad') });

        assert.equal(value.cause.type, 'TypeError');
        assert.equal(value.cause.message, 'bad');
        assert.match(value.cause.stack, /TypeError: bad/);
    });

    it('renders a Date as an ISO string', () => {
        assert.equal(
            valueOf(new Date(Date.UTC(2026, 8, 17, 12, 48, 3, 123))),
            '2026-09-17T12:48:03.123Z'
        );
    });

    it('renders an invalid Date as Invalid Date', () => {
        assert.equal(valueOf(new Date(NaN)), 'Invalid Date');
    });

    it('renders a RegExp as its source form', () => {
        assert.equal(valueOf(/ab+c/gi), '/ab+c/gi');
    });

    it('renders a Map as typed entries', () => {
        assert.deepEqual(valueOf(new Map([['a', 1]])), {
            __type: 'Map',
            entries: [['a', 1]],
        });
    });

    it('renders an empty Map with no entries', () => {
        assert.deepEqual(valueOf(new Map()), { __type: 'Map', entries: [] });
    });

    it('renders a Set as typed values', () => {
        assert.deepEqual(valueOf(new Set([1, 'two'])), {
            __type: 'Set',
            values: [1, 'two'],
        });
    });

    it('renders an empty Set with no values', () => {
        assert.deepEqual(valueOf(new Set()), { __type: 'Set', values: [] });
    });

    it('renders a class instance as a plain object without its name', () => {
        class Point {
            constructor() {
                this.x = 1;
                this.y = 2;
            }
        }

        assert.deepEqual(valueOf(new Point()), { x: 1, y: 2 });
    });

    it('renders minus zero as zero', () => {
        assert.match(one({ output: 'json' }, 'info', -0), /"args":\[0\]/);
    });

    it('marks a cycle instead of recursing', () => {
        const node = { name: 'root' };
        node.self = node;

        assert.deepEqual(valueOf(node), { name: 'root', self: '[Circular]' });
    });

    it('marks a cycle through an array', () => {
        const arr = [1];
        arr.push(arr);

        assert.deepEqual(valueOf(arr), [1, '[Circular]']);
    });

    it('repeats a value that is shared rather than cyclic', () => {
        const shared = { id: 1 };

        assert.deepEqual(valueOf({ a: shared, b: shared }), {
            a: { id: 1 },
            b: { id: 1 },
        });
    });

    it('marks a getter that throws instead of failing the line', () => {
        const value = {
            ok: 1,
            get boom() {
                throw new Error('nope');
            },
        };

        assert.deepEqual(valueOf(value), { ok: 1, boom: '[Throws]' });
    });

    it('never throws on what it is given', () => {
        assert.doesNotThrow(() =>
            one({ output: 'json' }, 'info', Symbol('s'), 1n, undefined, new Map())
        );
    });
});

describe('json fallback', () => {
    const unserializable = () =>
        new Proxy(
            {},
            {
                ownKeys() {
                    throw new Error('no keys');
                },
            }
        );

    it('prints the text line when the record cannot be rendered', () => {
        const printed = lines({ output: 'json' }, 'info', unserializable());

        assert.equal(printed.length, 1);
        assert.match(printed[0], /^\[[\d-]{10} [\d:]{8}\] INFO: /);
    });

    it('writes the text line to the file too', () => {
        const { contents } = toFile({ fileOutput: 'json' }, (logger) =>
            logger.info('kept', unserializable())
        );

        assert.match(contents, /INFO: kept /);
        assert.match(contents, /\n$/);
    });
});

describe('json sinks', () => {
    it('drops gated debug output before rendering', () => {
        assert.equal(lines({ output: 'json' }, 'debug', 'hidden').length, 0);
    });

    it('batches every line into the file, one JSON object per line', () => {
        const { contents } = toFile({ output: 'json' }, (logger) => {
            logger.info('one');
            logger.warn('two');
            logger.error('three');
        });

        const parsed = contents
            .split('\n')
            .filter(Boolean)
            .map((line) => JSON.parse(line));

        assert.deepEqual(
            parsed.map((entry) => entry.msg),
            ['one', 'two', 'three']
        );
        assert.deepEqual(
            parsed.map((entry) => entry.level),
            ['info', 'warn', 'error']
        );
    });

    it('writes a trace stack into the file as one line', () => {
        const { contents } = toFile({ output: 'json' }, (logger) =>
            logger.trace('traced')
        );

        assert.equal(contents.split('\n').filter(Boolean).length, 1);
        assert.match(JSON.parse(contents).stack, /^\s*at /);
    });

    it('leaves the logged arguments untouched', () => {
        const args = ['msg', new Error('boom'), { id: 1 }];

        lines({ output: 'json' }, 'error', ...args);

        assert.equal(args.length, 3);
        assert.equal(args[0], 'msg');
    });
});
