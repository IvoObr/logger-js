## Logger :rocket:
##### Simple JS logger
Supports Browser, NodeJS and TypeScript

> $ npm install @7util/logger

###  Features :loudspeaker:

* print fully arrays and objects - any depth, cycles included
* accept multiple arguments
* trace and error have stack
* debug level mode
* have timestamp
* include TypeScript definitions
* logs in timestamped files on the disc (NodeJS)
* never throws on what you log, and never blocks on writing it
* structured JSON output, per sink, for log stores that query fields

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
 * @prop {LogOutput} fileOutput? optional - Overrides output for the file, defaults to output.
 */

const options: ILogOptions = {
    useColor: true,
    logInFile: true,
    fileName: 'rest-server.log',
    logLevel: process.env.LOG_LEVEL
};

const logger: Logger = new Logger(options);// or simply ...new Logger()

export default logger;
```

:construction: *When using the logger in the browser make sure that all log levels (verbose, info, warnings and errors) are activated.*

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


### JSON output :package:

A human-formatted line is close to useless in a log store: pulling `id` out of it
needs a pattern per message shape. `output: 'json'` writes one JSON object per
line instead, ready to ingest and query.

```typescript
const logger = new Logger({ output: 'text', fileOutput: 'json' });
// pretty console, JSON file - the common setup

logger.info('user signed in', { id: 7, name: 'ivo' });

/* the file gets */
{"time":"2026-09-17T12:48:03.123Z","level":"info","msg":"user signed in","args":[{"id":7,"name":"ivo"}]}
```

`output` sets the format for both sinks and defaults to `'text'`, the format this
logger has always written. `fileOutput` overrides it for the file alone and
defaults to `output`, so `{ output: 'json' }` gives JSON everywhere. Anything
other than `'text'` or `'json'` falls back to the default. JSON lines are never
coloured.

#### The record

| field   | notes |
|---------|-------|
| `time`  | ISO 8601 instant. The text header keeps its local `[2026-09-17 12:48:03]` form. |
| `level` | lowercase level name: `info`, `warn`, `error`, `trace`, `debug`, `success`. |
| `msg`   | the leading string arguments, joined with a space. Absent when the first argument is not a string. |
| `args`  | the remaining arguments, in order, as JSON values. Omitted when there are none. |
| `err`   | the first `Error` argument, as `{type, message, stack}`. That Error is not repeated in `args`. |
| `stack` | `trace` only - the captured frames, as in the text line. |

#### Values JSON has no word for

Everything is rendered, at any depth, without throwing:

| input | output |
|-------|--------|
| `undefined` | `"[undefined]"` |
| `bigint` | `"9007199254740993n"` |
| `symbol` | `"Symbol(x)"` |
| function | `"[Function: name]"`, or `"[Function: anonymous]"` |
| `Error` | `{"type":"...","message":"...","stack":"..."}` |
| `Date` | ISO string, or `"Invalid Date"` |
| `RegExp` | `"/ab+c/gi"` |
| `Map` | `{"__type":"Map","entries":[[key, value]]}` |
| `Set` | `{"__type":"Set","values":[...]}` |
| cycle | `"[Circular]"` |
| getter that throws | `"[Throws]"` |

Three of these are lossy, on purpose:

* `-0` becomes `0` - JSON has no negative zero.
* a class instance becomes a plain object of its own enumerable keys; the class
  name is display, and it is dropped. The text line still shows `ClassName {...}`.
* `undefined` becomes the string `"[undefined]"`, and so cannot be told apart
  from that literal string.

A record that still cannot be serialized is written as the text line rather than
thrown or dropped.

## Happy coding!  <:beer:/>
