'use strict';

const Server = require('socket.io');
const SerialPort = require('../');

const device = process.argv[2];
const baudrate = process.argv[3];
const captureFile = process.argv[4];

const io = new Server(8080);

serialPort = new SerialPort({
  io: io,
  path: 'serialport',
  device: device,
  baudrate: baudrate,
  retryPeriod: 1000,
  captureFile: captureFile
});

serialPort.on('log', log => {
  console.log(`${log.level}: ${log.message}`);
});

io.on('openPort', () => {
  serialPort.open()
  .then(() => {
    console.log('opened');
  });
});

io.on('closePort', () => {
  serialPort.close()
  .then(() => {
    console.log('closed');
  });
});
