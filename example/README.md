# Example

Example implementation utilising ChromeOS hterm browser terminal

## Usage

Start the example server specifying the serial device and baudrate to use (will listen on port 8080)

```
node index.js <device> <baudrate>
```

Open the `index.html` file in a browser and open up the javascript console. Status messages will be printed to the console. To open/close the serial port on the server, call the following functions in the browser javascript console

```
openPort();
closePort();
```

When the port is open, data received from the serial port will be printed in the hterm console and keys pressed in the hterm console will be sent to the serial port
