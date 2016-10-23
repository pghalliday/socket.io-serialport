# socket.io-serialport

Expose a serial port over a socket.io instance. Particular thanks go to the [serialport](https://github.com/EmergingTechnologyAdvisors/node-serialport), [socket.io-stream](https://github.com/nkzawa/socket.io-stream) and [hterm](https://chromium.googlesource.com/apps/libapps/+/HEAD/hterm) projects.

## Usage

```
npm install --save socket.io
npm install --save socket.io-serialport
```

Then to connect to a serial port and open it

```javascript
const Server = require('socket.io');
const SerialPort = require('socket.io-serialport');

const io = new Server(8080);

const serialport = new SerialPort({
  io: io,
  path: '/port/ttyS0',
  device: '/dev/ttyS0',
  baudrate: 115200,
  retryPeriod: 1000,
  captureFile: '/var/log/serialport/ttyS0'
});

serialport.open()
.then(() => {
  console.log('port opened');

  // And when done (shutting down, etc)
  serialport.close()
  .then(() => {
    console.log('port closed');
  });
});
```

Then connect `socket.io` clients to the following endpoint

```javascript
var io = require('socket.io-client');

var ttyS0 = io('http://localhost:8080/port/ttyS0');
```

with the `socket.io` instance you can just use `data` events

```javascript
// listen for data from the serial port
ttyS0.on('data', function(data) {
  console.log(data);
});

// Send some data to the serial port
ttyS0.emit('data', 'pwd\n');
```

Or connect `socket.io-stream` clients to use streams

```javascript
// Create a duplex stream
var ttyS0Stream = ss.createStream();

// listen for data from the serial port
ttyS0Stream.on('data', function(data) {
  console.log(data);
});

// Notify the server with a `stream` event to setup
// a duplex stream at the other end which will
// pipe to and from the serial port
ss(ttyS0).emit('stream', ttyS0Stream);

// Send some data to the serial port
ttyS0Stream.write('pwd\n');
```

or both :)

### Handling serial port disconnects, etc

Events will be emitted when the state of the remote serial port changes. You can use these events to notify a user, etc.

Also on initial connection of the socket an event should be received giving the current status of the port.

```
ttyS0.on('status', function(status) {
  console.log(status);
});
```

where `status` will be one of

- `{status: 'open'}` - the port is open
- `{status: 'closing'}` - the port is closing after calling `#close`
- `{status: 'closed'}` - the port is closed after calling `#close`
- `{status: 'disconnected', error: error}` - the port disconnected and should be reopened after the `retryPeriod`
- `{status: 'opening', error: error}` - the port is opening, the `error` field will be set if it is reopening after an error
