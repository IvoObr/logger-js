## Logger :rocket:

##### Simple JS logger

Supports Browser, NodeJS and TypeScript

> $ npm install @7util/logger

### Features :loudspeaker:

- print fully arrays and objects - any depth, cycles included
- accept multiple arguments
- trace and error have stack
- debug level mode
- have timestamp
- include TypeScript definitions
- logs in timestamped files on the disc (NodeJS)
- structured JSON output mode, one object per line
- never throws on what you log, and never blocks on writing it

### Example

> logger.ts

```typescript
import { Logger, ILogOptions } from '@7util/logger';
// OR
const { Logger } = require('@7util/logger'); // no options interface available

/** ILogOptions
 * @prop {boolean} useColor? optional -  Should use colors.
 * @prop {string} fileName? optional - The name of the file.
 * @prop {boolean} logInFile? optional - Should write in file on the disc.
 * @prop {string} logLevel? optional - Will output debug logs if value is "debug".
 * @prop {LogOutput} output? optional - Line format, "text" (default) or "json".
 * @prop {LogOutput} fileOutput? optional - Overrides output for the file only.
 */

const options: ILogOptions = {
    useColor: true,
    logInFile: true,
    fileName: 'rest-server.log',
    logLevel: process.env.LOG_LEVEL,
    output: 'text',
    fileOutput: 'json',
};

const logger: Logger = new Logger(options); // or simply ...new Logger()

export default logger;
```

### JSON output :package:

Text lines read well in a terminal and badly in a log store. `output: 'json'`
emits one JSON object per line instead, so files can be ingested and queried
without a grok pattern per message shape.

```typescript
new Logger({ output: 'json' }); // JSON everywhere
new Logger({ output: 'text', fileOutput: 'json' }); // pretty console, JSON file
```

`output` is `'text'` by default and sets both sinks. `fileOutput` overrides it
for the file only, and defaults to whatever `output` is. Any other value falls
back to the default, the way the other options behave.

```typescript
logger.info('user signed in', { id: 7, name: 'ivo' });

/* one line, wrapped here for reading */
{
    "time": "2026-09-17T12:48:03.123Z",
    "level": "info",
    "msg": "user signed in",
    "args": [{ "id": 7, "name": "ivo" }]
}
```

| field   | notes                                                                                              |
| ------- | -------------------------------------------------------------------------------------------------- |
| `time`  | ISO 8601, UTC. The text header keeps its local `[2026-09-17 12:48:03]` form.                       |
| `level` | lowercase name: `info`, `warn`, `error`, `trace`, `debug`, `success`.                              |
| `msg`   | the leading string arguments, joined with a space. Absent when the first argument is not a string. |
| `args`  | the remaining arguments, in order. Omitted when there are none.                                    |
| `err`   | the first `Error` argument, as `{type, message, stack}`. It is not repeated in `args`.             |
| `stack` | `trace` only - the caller's frames, as one string.                                                 |

So `logger.info('hi')` has a `msg` and no `args`, and
`logger.info('user', obj, 'saved')` has `msg: "user"` and
`args: [obj, "saved"]` - the message stays a stable string you can group by,
and the values stay typed.

JSON lines are never coloured, whatever `useColor` says.

#### What JSON cannot carry

`JSON.stringify` has no representation for several things you can legally log,
so each one gets a stand-in rather than silently becoming `null`:

| value                                | becomes                                |
| ------------------------------------ | -------------------------------------- |
| `undefined`                          | `"[undefined]"`                        |
| `bigint`                             | `"9007199254740993n"`                  |
| `symbol`                             | `"Symbol(x)"`                          |
| function                             | `"[Function: name]"`                   |
| `Date`                               | ISO string, or `"Invalid Date"`        |
| `RegExp`                             | `"/re/g"`                              |
| `Map`                                | `{"__type":"Map","entries":[["k",1]]}` |
| `Set`                                | `{"__type":"Set","values":[1]}`        |
| `Error`                              | `{"type","message","stack"}`           |
| `NaN`, `Infinity`                    | `"NaN"`, `"Infinity"`                  |
| a cycle                              | `"[Circular]"`                         |
| a getter that throws                 | `"[Throws]"`                           |
| a value that cannot be walked at all | `"[Unserializable]"`                   |

Three of these are lossy on purpose:

- `-0` becomes `0`. JSON has no negative zero. Text mode still prints `-0`.
- a class instance becomes a plain object of its own enumerable keys, and the
  class name is dropped - text mode prints `User {"name":"ivo"}`, JSON mode
  `{"name":"ivo"}`. A query language has nowhere to put the name.
- `undefined` becomes the string `"[undefined]"`, so it is no longer
  distinguishable from a caller who logged that literal string.

If a record cannot be serialized at all, the line falls back to the text
format. The entry is never dropped and nothing ever throws.

:construction: _When using the logger in the browser make sure that all log levels (verbose, info, warnings and errors) are activated._

In the browser, `fs` is never loaded and colors are off by default; `logInFile` is
ignored. Bundlers pick this up from the `browser` field in `package.json`.

File writes are buffered and flushed on the next tick, and whatever is still
buffered is written synchronously when the process exits. Call `logger.flush()`
to force it yourself.

> somewhere in your project...

```typescript
import logger from './logger.ts'; // your logger instance

const obj = {
    key: 'value1',
    inner: { secret: 'value2' },
    arr: [1, []]
};

logger.info('info', obj, 'msg');
logger.warn('warn', obj, 'msg');
logger.trace('trace', obj, 'msg');
logger.error(obj, new Error('msg'));
logger.debug('debug', obj, 'msg');
logger.success('success', obj, 'msg');

/* output */
[2021-04-08 13:11:40] INFO: info {"key":"value1","inner":{"secret":"value2"},"arr":[1,[]]} msg
[2021-04-08 13:11:40] WARN: warn {"key":"value1","inner":{"secret":"value2"},"arr":[1,[]]} msg
[2021-04-08 13:11:40] TRACE: trace {"key":"value1","inner":{"secret":"value2"},"arr":[1,[]]} msg
    at Object...
    at Module...
[2021-04-08 13:11:40] ERROR: {"key":"value1","inner":{"secret":"value2"},"arr":[1,[]]} Error: msg
    at Object...
    at Module...
[2021-04-08 13:11:40] DEBUG: debug {"key":"value1","inner":{"secret":"value2"},"arr":[1,[]]} msg
[2021-04-08 13:11:40] SUCCESS: success {"key":"value1","inner":{"secret":"value2"},"arr":[1,[]]} msg

```

## Happy coding! <:beer:/>
