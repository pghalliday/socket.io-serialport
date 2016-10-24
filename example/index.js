'use strict';

const Server = require('socket.io');
const SerialPort = require('../');
const path = require('path');

const device = process.argv[2];
const baudrate = process.argv[3];
const captureFile = path.resolve(__dirname, 'capture.log');

const io = new Server(8080);

const serialPort = new SerialPort({
  io: io,
  route: '/serialport',
  device: device,
  retryPeriod: 1000,
  captureFile: captureFile,
  options: {
    baudrate: parseInt(baudrate)
  }
});

serialPort.on('log', log => {
  console.log(`${log.level}: ${log.message}`);
});

io.on('connection', socket => {
  console.log('connection');
  socket.emit('greeting', 'hello');
  socket.on('disconnect', error => {
    console.log(`disconnect: ${error}`);
  });
  socket.on('openPort', () => {
    console.log('openPort');
    serialPort.open()
    .then(() => {
      console.log('opened');
    });
  });
  socket.on('closePort', () => {
    console.log('closePort');
    serialPort.close()
    .then(() => {
      console.log('closed');
    });
  });
});
