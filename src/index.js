'use strict';

const mkdirp = require('mkdirp');
const fs = require('fs');
const path = require('path');
const RealSerialPort = require('serialport');
const ss = require('socket.io-stream');
const EventEmitter = require('events');

promiseCallback = function(resolve, reject) {
  return function(error, value) {
    if (error) {
      reject(error);
    } else {
      resolve(value);
    }
  };
};

class SerialPort extends EventEmitter {
  constructor(options) {
    this._retryPeriod = options.retryPeriod;
    this.status = {
      status: 'closed'
    };
    this._nsp = io.of(options.path);
    this._serialPort = new RealSerialPort(options.device, {
      baudrate: options.baudrate,
      autoOpen: false
    });
    this._serialPort.on('open', () => {
      this._log('info', 'opened serial port');
      this.status = {
        status: 'open'
      };
      this._nsp.emit('portOpen');
    });
    this._serialPort.on('error', error => {
      this._log('error', `error on serial port: ${error}`);
      this.status = {
        status: 'disconnected',
        error: error
      };
      this._nsp.emit('portDisconnected', error);
      this._retry();
    });
    this._serialPort.on('disconnect', error => {
      this._log('error', `disconnected serial port: ${error}`);
      this.status = {
        status: 'disconnected',
        error: error
      };
      this._nsp.emit('portDisconnected', error);
    });
    this._serialPort.on('close', () => {
      this._log('info', 'closed serial port');
      const wasClosing = this.status.status === 'closing';
      if (wasClosing) {
        this.status = {
          status: 'closed'
        };
        this._nsp.emit('portClosed');
      } else {
        this._retry();
      }
    });
    this._nsp.on('connection', socket => {
      this._log('info', 'socket.io connection');
      socket.emit('portStatus', this.status);
      ss(socket).on('stream', stream => {
        this._log('info', 'stream');
        this._serialPort.pipe(stream).pipe(_serialPort);
      });
      socket.on('data', data -> {
        this.serialport.write(data);
      });
      this.serialport.on('data', data => {
        socket.emit('data', data);
      })
      socket.on('disconnect', () => {
        this._log('info', 'socket.io disconnect');
      });
    });
    mkdirp.sync(path.dirname(path.resolve(options.captureFile)));
    const writeFileStream = fs.createWriteStream(
      options.captureFile,
      {flags: 'a'}
    );
    this._serialPort.pipe(writeFileStream);
  }

  open() {
    this._log('info', 'opening');
    this.status = {
      status: 'opening',
      error: this.status.error
    }
    this._nsp.emit('portOpening', this.status.error);
    return new Promise((resolve, reject) => {
      this._serialPort.open(promiseCallback(resolve, reject));
    })
    .catch(error => {
      this._log('error', `error opening serial port: ${error}`);
      this._retry();
    });
  }

  close() {
    this._log('info', 'closing');
    this.status = {
      status: 'closing'
    }
    if (this._retryTimeout === undefined) {
      cancelTimeout(this._retryTimeout);
      delete this._retryTimeout;
    }
    this._nsp.emit('portClosing');
    return new Promise((resolve, reject) => {
      this._serialPort.close(promiseCallback(resolve, reject));
    });
  }

  _retry() {
    this._log('info', `retrying in ${this._retryPeriod} milliseconds`);
    this._retryTimeout = setTimeout(() => {
      delete this._retryTimeout;
      this.open();
    }, this._retryPeriod);
  }

  _log(level, message) {
    this.emit('log', {
      level: level,
      message: message
    });
  }
}

module.exports = SerialPort;
