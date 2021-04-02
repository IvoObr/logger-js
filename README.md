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

> logger.js
```javascript
import { Logger } from '@7dev-works/logger';
// OR 
const { Logger } = require('@7dev-works/logger');

/**
 * @param {boolean} doFileLog? optional - Should write in file on the disc.
 * @param {string} fileName? optional - The name of the file.
 * @return {Logger} instance of the Logger class.
 */

const logger = new Logger(true, 'logger.log'); // or simply ...new Logger()

export default logger;
```

> somewhere in you project...
```javascript
import logger from './logger.js'; // your logger instance

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

// output 
[2021-04-02 19:52:54] INFO: info {"key":"value1","inner":{"test":1},"arr":[1,[]]} message
[2021-04-02 19:52:54] WARN: warn {"key":"value1","inner":{"test":1},"arr":[1,[]]} message
[2021-04-02 19:52:54] SUCCESS: success {"key":"value1","inner":{"test":1},"arr":[1,[]]} message
[2021-04-02 19:52:54] TRACE:: trace {"key":"value1","inner":{"test":1},"arr":[1,[]]} message
    at Object.<anonymous> ...
[2021-04-02 19:52:54] ERROR:: error {"key":"value1","inner":{"test":1},"arr":[1,[]]} message
    at Object.<anonymous> ...
```
_________________________________________________________________
