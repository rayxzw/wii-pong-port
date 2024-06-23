# wii-pong-port
A variant of Pong where players control their in-game paddle by physically tilting their device. Requires a device which has an accelerometer.

This code has only been tested on the Brave browser on an iPhone 15. Physics are frame-dependent, so if the game is too hard, go into low power mode. Enjoy.

## Write-up
In my ECE 5 class, our group made a Pong game using an Arduino, only the in-game paddles were controlled by tilting physical paddles. That project used an Arduino, a TFT LCD screen, 2 accelerometers, lots of wires, some solder, 3D printed paddles, and some code.

It occurred to me that most phones have accelerometers, so I wondered if I could use them to implement this Pong variant. This port of our group's project is what resulted.

A lot of game logic translated easily from C++ to JS. In addition, not having to optimize rendering due to hardware limitations made drawing things easier.

The main difficulties I faced were the collision algorithm and learning to use the DeviceMotionEvent API.

I didn't use the original collision algorithm because it only worked for rectangle to rectange collision (the ball in the original version was a square) and I wanted to make the ball in this version a circle. This required a more complex collision detection and resolution algorithm, which I implemented after some experimentation with the Separating Axis Theorem.

The browser's API for reading device accelerometer data was confusing to me only because it differed from the way the orginal project read accelerometer data. In the original project, we polled accelerometer data in the main loop of the program at an interval we set ourselves. In this port, we only get accelerometer data when the browser fires an event; we can't control (or at least I don't know how/thought it was too much trouble) how often we poll accelerometer data. So the "drawing" code and the "poll & update game state" code are effectively running in 2 different loops simultaneously while also accessing the same game state. I'm not sure how it works, but it works.

## Further Ideas
- Allow paddle to translate in 2D and rotate
- Network multiplayer
- Make device into Wii Remote-like control
