# logger :rocket:
### Simple JS logger
Supports Browser, NodeJS and TypeScript
_________________________________________________________________

### Features
#### All methods:
* print fully arrays and objects
* accept multiple arguments
* trace and error have stack
* have timestamp
* includes TypeScript definitions


_________________________________________________________________

### Installing
$ npm install @7dev-works/logger
_________________________________________________________________


### Example

> logger.js
```javascript
import Logger from '@7dev-works/logger';

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
    arr: [1,2,3, []]
};

logger.info('info message', obj);
logger.warn('warn message', obj, arr);
logger.success('success message', obj);
logger.trace('trace message', obj);
logger.error('error message', obj);

// output 
[2021-03-23 16:21:05] INFO: info message { key: 'value1', arr: [ 1, 2, 3, [] ] }
[2021-03-23 16:21:05] WARN: warn message { key: 'value1', arr: [ 1, 2, 3, [] ] }
[2021-03-23 16:21:05] SUCCESS: success message { key: 'value1', arr: [ 1, 2, 3, [] ] }
[2021-03-23 16:21:05] TRACE:: trace message { key: 'value1', arr: [ 1, 2, 3, [] ] } 
    at Object.<anonymous> ...
[2021-03-23 16:21:05] ERROR:: error message { key: 'value1', arr: [ 1, 2, 3, [] ] }
    at Object.<anonymous> ....
```
_________________________________________________________________
