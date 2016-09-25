# City Tour

Visit a computer generated city, different each time. Sit back and enjoy the ride!

<img src="city_tour.gif" width="400" />

Made using [three.js](http://threejs.org) and WebGL.


## How It Works

First, blueprints of the world are generated:

* A terrain map
* A road network that follows the terrain
* Empty building lots along roads
* Buildings in the lots

The results are different each time due to random variation, but follow rules that can be configured.

Next, this abstract definition is turned into a 3D model that can be rendered with WebGL, with the help of [three.js](http://threejs.org).

Finally, a rendering loop begins which moves a three.js camera around the scene. This camera has logic to follow the terrain and road network, etc.
