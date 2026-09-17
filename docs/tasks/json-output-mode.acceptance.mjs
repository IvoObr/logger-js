#!/usr/bin/env node
/**
 * The acceptance list of `json-output-mode.md`, as a program.
 *
 *   node docs/tasks/json-output-mode.acceptance.mjs
 *   node docs/tasks/json-output-mode.acceptance.mjs --repo <path> --base <ref>
 *
 * It grades the BUILT `index.js` — what a consumer of this package actually
 * gets — against the task file's `## Acceptance` section, one check per
 * criterion, and exits non-zero if any of them fails.
 *
 * It exists to be written BEFORE the second implementation of this task, so
 * that two implementations are graded by one instrument rather than by two
 * readings of the same prose. That is also why it checks the criteria and not
 * the choices: the record's field names come from the task file, but nothing
 * here requires a particular encoding for a Map, because the task file asks
 * only that each exotic value have "a documented, parseable representation".
 * A grader that demanded one implementation's encoding would decide the
 * comparison by construction.
 *
 * Two criteria are NOT graded, and are reported as such rather than silently
 * dropped: date rollover in JSON mode (it needs a clock this cannot move), and
 * "documented" in the exotic-values row (a human reads the README; this only
 * checks the values parse). A green run here is evidence, not a verdict.
 */
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import {
    mkdtempSync,
    readdirSync,
    readFileSync,
    rmSync,
    writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const args = process.argv.slice(2);
const flag = (name) => {
    const at = args.indexOf(`--${name}`);
    return at === -1 ? undefined : args[at + 1];
};
const REPO = resolve(flag('repo') ?? process.cwd());
/** The commit "today's output" means, for the byte-identical criterion. */
const BASE = flag('base') ?? 'unclebob-gate-test';
const INDEX = join(REPO, 'index.js');

const require = createRequire(INDEX);
const { Logger } = require(INDEX);

const results = [];
const check = (name, fn) => {
    try {
        results.push({ name, ok: true, note: fn() ?? '' });
    } catch (error) {
        results.push({
            name,
            ok: false,
            note: error?.message ?? String(error),
        });
    }
};
const ungraded = (name, why) =>
    results.push({ name, ok: undefined, note: why });

function assert(condition, message) {
    if (!condition) throw new Error(message);
}

/** Everything the logger wrote to the console during `fn`. */
function captured(fn) {
    const methods = ['log', 'info', 'warn', 'error', 'debug', 'trace'];
    const original = {};
    const lines = [];
    for (const m of methods) {
        original[m] = console[m];
        console[m] = (...a) => lines.push(a.join(' '));
    }
    try {
        fn();
    } finally {
        for (const m of methods) console[m] = original[m];
    }
    return lines;
}

/** One console line, parsed as JSON, or a failure naming what was there. */
function record(options, write) {
    const lines = captured(() =>
        write(new Logger({ logInFile: false, ...options }))
    );
    assert(lines.length === 1, `expected one line, got ${lines.length}`);
    try {
        return JSON.parse(lines[0]);
    } catch {
        throw new Error(`line is not JSON: ${lines[0].slice(0, 120)}`);
    }
}

/** Run `fn` in a throwaway cwd, since the logger writes to a relative path. */
function inTempDir(fn) {
    const cwd = process.cwd();
    const dir = mkdtempSync(join(tmpdir(), 'json-acceptance-'));
    process.chdir(dir);
    try {
        return fn(dir);
    } finally {
        process.chdir(cwd);
        rmSync(dir, { recursive: true, force: true });
    }
}

/**
 * Log in a child process, in a throwaway cwd, and read back both halves: what
 * went to the console and what reached the file once that process exited.
 *
 * A child, because writes to the file are batched and flushed as the process
 * leaves. Reading the file synchronously in this process races the timer, and
 * would fail a correct implementation — which is the one kind of bug a grader
 * must not have.
 */
function logInChild(optionsLiteral, calls) {
    return inTempDir((dir) => {
        // The child collects its own console lines and prints them back as JSON,
        // rather than this reading its streams: `warn` and `error` go to stderr,
        // which `execFileSync` hands straight to the parent's — so reading stdout
        // would both miss those lines and leak them into this program's output.
        const script =
            `const { Logger } = require(${JSON.stringify(INDEX)});\n` +
            `const said = [];\n` +
            `for (const m of ['log','info','warn','error','debug','trace']) console[m] = (...a) => said.push(a.join(' '));\n` +
            `const l = new Logger(${optionsLiteral});\n` +
            calls.map((call) => `${call};`).join('\n') +
            `\nprocess.stdout.write(JSON.stringify(said));`;
        const said = execFileSync(process.execPath, ['-e', script], {
            cwd: dir,
            encoding: 'utf8',
        });
        const name = readdirSync(dir).find((n) => n.endsWith('.log'));
        assert(name, 'no .log file was written');
        return {
            stdout: JSON.parse(said),
            file: readFileSync(join(dir, name), 'utf8')
                .trim()
                .split('\n')
                .filter(Boolean),
        };
    });
}

const TIMESTAMP = /\[\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\]/g;

// ─────────────────────────────────────────────────────────────────────────────

// "`new Logger()` output is byte-identical to today's. No behaviour change
// without opting in." Graded against the base commit's own build rather than
// against a remembered format, with only the clock normalised away.
check('default output is byte-identical to the base build', () => {
    const calls =
        `l.info('user signed in', { id: 7, name: 'ivo' });\n` +
        `l.warn('careful', [1, 2], 'and', null);\n` +
        `l.error(new Error('boom'));`;
    const say = (path) =>
        `const { Logger } = require(${JSON.stringify(path)});\n` +
        `const out = [];\n` +
        `for (const m of ['log','info','warn','error','debug','trace']) console[m] = (...a) => out.push(a.join(' '));\n` +
        `const l = new Logger({ logInFile: false, useColor: false });\n` +
        `${calls}\n` +
        `process.stdout.write(JSON.stringify(out));`;
    const run = (path) =>
        JSON.parse(
            execFileSync(process.execPath, ['-e', say(path)], {
                encoding: 'utf8',
            })
        );

    const baseline = inTempDir((dir) => {
        const path = join(dir, 'base-index.js');
        writeFileSync(
            path,
            execFileSync('git', ['show', `${BASE}:index.js`], { cwd: REPO })
        );
        return run(path);
    });
    const now = run(INDEX);

    assert(
        now.length === baseline.length,
        `line count ${now.length} vs ${baseline.length}`
    );
    for (let at = 0; at < baseline.length; at++) {
        // First line only: an Error's stack names the file it was thrown in, and
        // the two runs are two different temporary files by construction.
        const was = baseline[at].replace(TIMESTAMP, '[TS]').split('\n')[0];
        const is = now[at].replace(TIMESTAMP, '[TS]').split('\n')[0];
        assert(
            was === is,
            `line ${at + 1} differs:\n      base: ${was}\n      now:  ${is}`
        );
    }
    return `${baseline.length} lines identical to ${BASE}`;
});

// "`{ output: 'json' }` writes one valid JSON object per line to console and
// file; every line round-trips through `JSON.parse`."
check("output:'json' writes valid JSON to the console", () => {
    const lines = captured(() => {
        const l = new Logger({ logInFile: false, output: 'json' });
        l.info('one');
        l.warn('two', { a: 1 });
    });
    assert(
        lines.length === 2,
        `expected two console lines, got ${lines.length}`
    );
    for (const line of lines) JSON.parse(line);
    return '2 console line(s) parse';
});

check("output:'json' writes valid JSON to the file", () => {
    const { file } = logInChild(`{ output: 'json' }`, [
        `l.info('one')`,
        `l.warn('two', { a: 1 })`,
    ]);
    assert(file.length === 2, `expected two file lines, got ${file.length}`);
    for (const line of file) JSON.parse(line);
    return '2 file line(s) parse';
});

// "`{ fileOutput: 'json' }` alone gives a text console and a JSON file."
check("fileOutput:'json' alone gives a text console and a JSON file", () => {
    const { stdout, file } = logInChild(
        `{ output: 'text', fileOutput: 'json', useColor: false }`,
        [`l.info('split', { id: 7 })`]
    );
    assert(
        stdout.length === 1,
        `expected one console line, got ${stdout.length}`
    );
    assert(
        /^\[\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\]/.test(stdout[0]),
        `console line is not the text format: ${stdout[0].slice(0, 80)}`
    );
    let consoleIsJson = true;
    try {
        JSON.parse(stdout[0]);
    } catch {
        consoleIsJson = false;
    }
    assert(!consoleIsJson, 'the console line is JSON; it should be text');

    assert(file.length === 1, `expected one file line, got ${file.length}`);
    assert(
        JSON.parse(file[0]).msg === 'split',
        `file record: ${file[0].slice(0, 80)}`
    );
    return 'text console, JSON file';
});

// "`logger.info('hi')` → `msg: \"hi\"`, no `args`."
check("info('hi') gives msg and no args", () => {
    const r = record({ output: 'json' }, (l) => l.info('hi'));
    assert(r.msg === 'hi', `msg is ${JSON.stringify(r.msg)}`);
    assert(r.args === undefined, `args present: ${JSON.stringify(r.args)}`);
    assert(
        typeof r.time === 'string' && !Number.isNaN(Date.parse(r.time)),
        `time: ${r.time}`
    );
    assert(
        r.level === 'info',
        `level is ${JSON.stringify(r.level)}, expected the lowercase name`
    );
});

// "`logger.info('user', obj, 'saved')` → `msg: \"user\"`, `args: [obj, \"saved\"]`."
check("info('user', obj, 'saved') splits msg from args, in order", () => {
    const r = record({ output: 'json' }, (l) =>
        l.info('user', { a: 1 }, 'saved')
    );
    assert(r.msg === 'user', `msg is ${JSON.stringify(r.msg)}`);
    assert(
        Array.isArray(r.args) && r.args.length === 2,
        `args: ${JSON.stringify(r.args)}`
    );
    assert(
        r.args[0] && r.args[0].a === 1,
        `first arg: ${JSON.stringify(r.args[0])}`
    );
    assert(r.args[1] === 'saved', `second arg: ${JSON.stringify(r.args[1])}`);
});

// "`logger.error(new Error('boom'))` → `err.type`, `err.message`, `err.stack`
// set, no duplicate Error in `args`."
check('error(new Error) fills err and does not repeat it in args', () => {
    const r = record({ output: 'json' }, (l) => l.error(new Error('boom')));
    assert(r.err, 'no err field');
    assert(r.err.type === 'Error', `err.type is ${JSON.stringify(r.err.type)}`);
    assert(
        r.err.message === 'boom',
        `err.message is ${JSON.stringify(r.err.message)}`
    );
    assert(
        typeof r.err.stack === 'string' && r.err.stack.includes('at '),
        'err.stack has no frames'
    );
    assert(
        !JSON.stringify(r.args ?? []).includes('boom'),
        `the Error is repeated in args: ${JSON.stringify(r.args)}`
    );
});

// "`logger.trace('x')` → `stack` is a string of `at ...` frames."
check("trace('x') carries a stack of frames", () => {
    const r = record({ output: 'json' }, (l) => l.trace('x'));
    assert(typeof r.stack === 'string', `stack is ${typeof r.stack}`);
    assert(
        r.stack.includes('at '),
        `stack has no frames: ${String(r.stack).slice(0, 80)}`
    );
});

// "Cyclic object → `\"[Circular]\"`, no throw."
check('a cycle becomes [Circular] and does not throw', () => {
    const cyclic = { name: 'a' };
    cyclic.self = cyclic;
    const r = record({ output: 'json' }, (l) => l.info('c', cyclic));
    assert(
        JSON.stringify(r).includes('[Circular]'),
        `no [Circular]: ${JSON.stringify(r.args)}`
    );
});

// "Object with a throwing getter → `\"[Throws]\"`, no throw."
check('a throwing getter becomes [Throws] and does not throw', () => {
    const hostile = {
        get bad() {
            throw new Error('nope');
        },
    };
    const r = record({ output: 'json' }, (l) => l.info('t', hostile));
    assert(
        JSON.stringify(r).includes('[Throws]'),
        `no [Throws]: ${JSON.stringify(r.args)}`
    );
});

// "`Map`, `Set`, `BigInt`, `Symbol`, function, `undefined`, `Date`, `RegExp`,
// class instance each have a documented, parseable representation."
//
// Parseable and present is what a program can check: the line round-trips, and
// no value silently vanished or collapsed to null. Which representation each
// one gets is the implementation's to choose.
check('exotic values each survive as a parseable value', () => {
    class Point {
        constructor() {
            this.x = 1;
        }
    }
    const values = [
        ['Map', new Map([['k', 1]])],
        ['Set', new Set([1])],
        ['BigInt', 10n],
        ['Symbol', Symbol('s')],
        ['function', function named() {}],
        ['undefined', undefined],
        ['Date', new Date('2020-01-02T03:04:05Z')],
        ['RegExp', /re/g],
        ['class instance', new Point()],
    ];
    const r = record({ output: 'json' }, (l) =>
        l.info('x', ...values.map(([, v]) => v))
    );
    assert(Array.isArray(r.args), `args is ${JSON.stringify(r.args)}`);
    assert(
        r.args.length === values.length,
        `${r.args.length} of ${values.length} args survived`
    );
    for (let at = 0; at < values.length; at++) {
        assert(
            r.args[at] !== null && r.args[at] !== undefined,
            `${values[at][0]} became ${r.args[at]}`
        );
    }
    return values.map(([name]) => name).join(', ');
});

// "A record that cannot be serialized falls back to the text line rather than
// throwing or dropping the entry." Graded as the promise the task file makes
// about it: the entry is not dropped, and nothing throws.
check('a hostile value still logs a line and does not throw', () => {
    const hostile = new Proxy(
        {},
        {
            ownKeys() {
                throw new Error('no keys for you');
            },
            get() {
                throw new Error('no values either');
            },
        }
    );
    const lines = captured(() =>
        new Logger({ logInFile: false, output: 'json' }).info('h', hostile)
    );
    assert(lines.length === 1, `expected one line, got ${lines.length}`);
    assert(lines[0].length > 0, 'the line is empty');
    try {
        JSON.parse(lines[0]);
        return 'serialized as JSON';
    } catch {
        return 'fell back to the text line';
    }
});

// "Debug gating ... behave the same in JSON mode."
check('debug gating still applies in JSON mode', () => {
    const quiet = captured(() =>
        new Logger({
            logInFile: false,
            output: 'json',
            logLevel: 'prod',
        }).debug('hidden')
    );
    assert(quiet.length === 0, `debug was not gated: ${quiet.length} line(s)`);
    const loud = captured(() =>
        new Logger({
            logInFile: false,
            output: 'json',
            logLevel: 'debug',
        }).debug('shown')
    );
    assert(
        loud.length === 1,
        `debug was gated when it should not be: ${loud.length} line(s)`
    );
});

// "... the exit flush all behave the same in JSON mode."
check('the exit flush writes JSON lines from a real process exit', () => {
    const { file } = logInChild(`{ output: 'json' }`, [
        `l.info('before exit', { id: 1 })`,
    ]);
    assert(file.length === 1, `expected one flushed line, got ${file.length}`);
    assert(
        JSON.parse(file[0]).msg === 'before exit',
        `record: ${file[0].slice(0, 80)}`
    );
    return 'flushed and parsed';
});

// "`index.d.ts` exports `LogOutput` and the new options."
check('index.d.ts exports LogOutput and both options', () => {
    const dts = readFileSync(join(REPO, 'index.d.ts'), 'utf8');
    assert(
        /export\s+(declare\s+)?type\s+LogOutput/.test(dts),
        'no exported LogOutput type'
    );
    assert(
        /\boutput\?:/.test(dts),
        'no optional `output` on the options interface'
    );
    assert(
        /\bfileOutput\?:/.test(dts),
        'no optional `fileOutput` on the options interface'
    );
});

// "README documents `output` / `fileOutput`, the record shape and the lossy
// cases (`-0`, class names, `undefined`)."
check(
    'README documents the options, the record shape and the lossy cases',
    () => {
        const readme = readFileSync(join(REPO, 'README.md'), 'utf8');
        const missing = [
            'output',
            'fileOutput',
            'msg',
            '-0',
            'undefined',
        ].filter((term) => !readme.includes(term));
        assert(
            missing.length === 0,
            `README never mentions: ${missing.join(', ')}`
        );
    }
);

ungraded('date rollover in JSON mode', 'needs a movable clock; run it by hand');
ungraded(
    'file batching in JSON mode',
    'timing-dependent; the exit flush above is its observable half'
);

// ─────────────────────────────────────────────────────────────────────────────

const width = Math.max(...results.map((r) => r.name.length));
for (const { name, ok, note } of results) {
    console.log(
        `${ok === undefined ? '–   ' : ok ? 'ok  ' : 'FAIL'}  ${name.padEnd(width)}  ${note}`
    );
}

const passed = results.filter((r) => r.ok === true).length;
const failed = results.filter((r) => r.ok === false).length;
const skipped = results.filter((r) => r.ok === undefined).length;

console.log(
    `\n${passed} passed, ${failed} failed, ${skipped} not graded — ${REPO} against ${BASE}`
);

// A grader that examined nothing is a broken grader, not a green run — the same
// rule the gates this experiment measures hold themselves to.
if (!passed) {
    console.error('Nothing was graded.');
    process.exit(2);
}
process.exit(failed ? 1 : 0);
