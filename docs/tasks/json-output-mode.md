# Structured JSON output mode

## Why

Every line the logger writes today is human-formatted:

```
[2026-09-17 12:48] INFO: user signed in {"id":7,"name":"ivo"}
```

That reads well in a terminal and is close to useless in a log store. Getting
`id` out of that file in VictoriaLogs or Kibana needs a grok/regex pattern per
message shape, and the shapes are whatever the caller passed. The data is
already structured when it reaches `Helper.stringify` — we throw the structure
away on the way out.

Add an output mode that emits one JSON object per line instead, so files can be
ingested and queried directly. Console output stays human-readable by default.

## Scope

In:

- A new `output` option: `'text'` (current behaviour, default) or `'json'`.
- JSON rendering of a log record.
- Applying the mode independently to console and file.
- Docs + tests.

Out (separate tasks):

- Child loggers / bindings.
- Redaction.
- Per-key serializers (`err`, `req`, `res`).
- `mixin`, base fields (`pid`, `hostname`, `name`).
- Anything that adds a dependency.

## Design

### Option

```ts
export type LogOutput = 'text' | 'json';

export interface ILogOptions {
    // ...existing
    /** Line format. Defaults to 'text'. */
    output?: LogOutput;
    /** Overrides `output` for the file sink only. Defaults to `output`. */
    fileOutput?: LogOutput;
}
```

Two knobs because the common setup is pretty console + JSON file:

```ts
new Logger({ output: 'text', fileOutput: 'json' });
```

`output` alone covers the simple cases (all text, all JSON).

### Record shape

```json
{
    "time": "2026-09-17T12:48:03.123Z",
    "level": "info",
    "msg": "user signed in",
    "args": [{ "id": 7, "name": "ivo" }]
}
```

Fields:

| field   | notes                                                                                                                                       |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `time`  | ISO 8601 with offset — `[2026-09-17 12:48]` local-with-no-offset is ambiguous once the file leaves the machine. Keep the text header as is. |
| `level` | lowercase level name (`info`, `warn`, `error`, `trace`, `debug`, `success`), not the `INFO` label.                                          |
| `msg`   | leading string arguments joined with `' '`. Absent when the first argument is not a string.                                                 |
| `args`  | remaining arguments, in order, as JSON values. Omitted when empty.                                                                          |
| `err`   | first `Error` argument as `{type, message, stack}`. That Error is not repeated in `args`.                                                   |
| `stack` | only for `trace` — the captured frames, as today.                                                                                           |

Splitting `msg` from `args` is what makes the line queryable: `msg` stays a
stable string you can group by, values stay typed.

### Serialization

`Helper.stringify` produces a _display_ string, not JSON: `undefined`,
`[Function: f]`, `Map(2) {...}`, `123n`, `Symbol(x)`, `ClassName {...}` are all
valid output today and none of them are valid JSON. JSON mode needs a sibling
that produces a JSON-safe _value_, keeping the same guarantees: no depth limit,
cycles become `"[Circular]"`, never throws, getters that throw become
`"[Throws]"`.

Add `Helper.jsonValue(value, seen)` alongside `stringify`, mapping the cases
`JSON.stringify` cannot represent:

| input          | output                                                    |
| -------------- | --------------------------------------------------------- |
| `undefined`    | `"[undefined]"`                                           |
| `bigint`       | decimal string, e.g. `"9007199254740993n"`                |
| `symbol`       | `value.toString()`                                        |
| `function`     | `"[Function: name]"`                                      |
| `Error`        | `{type, message, stack}`                                  |
| `Date`         | ISO string, `"Invalid Date"` when NaN                     |
| `RegExp`       | `String(value)`                                           |
| `Map`          | `{"__type":"Map","entries":[[k,v],...]}`                  |
| `Set`          | `{"__type":"Set","values":[...]}`                         |
| cycle          | `"[Circular]"`                                            |
| class instance | plain object of own enumerable keys (drop the class name) |
| `-0`           | `0` (JSON has no `-0`; note it in the docs)               |

Then `JSON.stringify(record)` on the assembled record. Wrap the whole render in
try/catch and fall back to the text line — the logger's promise is that it never
throws on what you log.

### Wiring

`emit()` currently builds one string and uses it for both sinks. Split it:

1. Build a record once: `{time, level, msg, args, err?, stack?}`.
2. `renderText(record)` — the existing header + joined body + stack.
3. `renderJson(record)` — `JSON.stringify`.
4. `console[level.method](...)` gets the `output` rendering,
   `writeToFile(...)` gets the `fileOutput` one.

Both renderings only get built when their sink is actually active, and the
gating check stays first so nothing is built for a suppressed level.

Colours and the ANSI strip in `writeToFile` apply to text only — JSON lines are
never coloured, so `Helper.ANSI` does not need to run over them.

## Acceptance

- `new Logger()` output is byte-identical to today's. No behaviour change
  without opting in.
- `{ output: 'json' }` writes one valid JSON object per line to console and
  file; every line round-trips through `JSON.parse`.
- `{ fileOutput: 'json' }` alone gives a text console and a JSON file.
- `logger.info('hi')` → `msg: "hi"`, no `args`.
- `logger.info('user', obj, 'saved')` → `msg: "user"`, `args: [obj, "saved"]`.
- `logger.error(new Error('boom'))` → `err.type`, `err.message`, `err.stack`
  set, no duplicate Error in `args`.
- `logger.trace('x')` → `stack` is a string of `at ...` frames.
- Cyclic object → `"[Circular]"`, no throw.
- Object with a throwing getter → `"[Throws]"`, no throw.
- `Map`, `Set`, `BigInt`, `Symbol`, function, `undefined`, `Date`, `RegExp`,
  class instance each have a documented, parseable representation.
- A record that cannot be serialized falls back to the text line rather than
  throwing or dropping the entry.
- Debug gating, file batching, date rollover and the exit flush all behave the
  same in JSON mode.
- README documents `output` / `fileOutput`, the record shape and the lossy
  cases (`-0`, class names, `undefined`).
- `index.d.ts` exports `LogOutput` and the new options.

## Notes

`success` has no counterpart in any log ingester's level vocabulary. Emit it as
`level: "success"` for now and leave the mapping question to the levels task —
that is where a real level ordering gets decided.
