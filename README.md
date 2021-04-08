# logger :rocket:
### Simple JS logger
Supports Browser, NodeJS and TypeScript
_________________________________________________________________

### Features
* print fully arrays and objects
* accept multiple arguments
* trace and error have stack
* have timestamp
* include TypeScript definitions
* file names for NodeJS have timestamp

_________________________________________________________________

### Installing
$ npm install @7dev-works/logger
_________________________________________________________________


### Example

> logger.ts
```typescript
import { Logger, ILogOptions } from '@7dev-works/logger';
// OR 
const { Logger } = require('@7dev-works/logger'); // no options interface available


/** ILogOptions
 * @prop {boolean} useColor? optional -  Should use colors.
 * @prop {string} fileName? optional - The name of the file.
 * @prop {boolean} logInFile? optional - Should write in file on the disc.
 * @prop {string} logLevel? optional - Will output debug logs if values is 'debug'.
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

_________________________________________________________________

 :warning:  For the browser make sure that all log levels (verbose, info, warnings and errors) are activated.
_________________________________________________________________


> somewhere in you project...
```typescript
import logger from './logger.ts'; // your logger instance

const obj = {
    key: 'value1',
    inner: { test: 1 },
    arr: [1, []]
};

logger.info('info', obj, 'message');
logger.warn('warn', obj, 'message');
logger.success('success', obj, 'message');
logger.trace('trace', obj, 'message');
logger.error('error', obj, 'message');
logger.debug('debug', obj, 'message');

// output 
[2021-04-02 19:52:54] INFO: info {"key":"value1","inner":{"test":1},"arr":[1,[]]} message
[2021-04-02 19:52:54] WARN: warn {"key":"value1","inner":{"test":1},"arr":[1,[]]} message
[2021-04-02 19:52:54] SUCCESS: success {"key":"value1","inner":{"test":1},"arr":[1,[]]} message
[2021-04-02 19:52:54] TRACE:: trace {"key":"value1","inner":{"test":1},"arr":[1,[]]} message
    at Object.<anonymous> ...
[2021-04-02 19:52:54] ERROR: error {"key":"value1","inner":{"test":1},"arr":[1,[]]} message
    at Object.<anonymous> ...
[2021-04-02 19:52:54] DEBUG: debug {"key":"value1","inner":{"test":1},"arr":[1,[]]} message

```
_________________________________________________________________
