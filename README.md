## Logger :rocket:
##### Simple JS logger
Supports Browser, NodeJS and TypeScript

> $ npm install @7util/logger

###  Features :loudspeaker:

* print fully arrays and objects
* accept multiple arguments
* trace and error have stack
* debug level mode
* have timestamp
* include TypeScript definitions
* logs in timestamped files on the disc (NodeJS)

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
[2021-04-08 13:11:40] TRACE:: trace {"key":"value1","inner":{"secret":"value2"},"arr":[1,[]]} msg
    at Object...
    at Module...
[2021-04-08 13:11:40] ERROR: {"key":"value1","inner":{"secret":"value2"},"arr":[1,[]]} Error: msg
    at Object...
    at Module...
[2021-04-08 13:11:40] DEBUG: debug {"key":"value1","inner":{"secret":"value2"},"arr":[1,[]]} msg
[2021-04-08 13:11:40] SUCCESS: success {"key":"value1","inner":{"secret":"value2"},"arr":[1,[]]} msg

```


## Happy coding!  <:beer:/>
