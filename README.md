# City Tour

Visit a procedurally generated city, different each time. Sit back and enjoy the ride!

<http://www.joelstrait.com/citytour/>

<img src="city_tour.gif" width="400" />

Made using [three.js](http://threejs.org) and WebGL.


## How It Works

First, blueprints of the world are generated:

* A terrain map
* A road network that follows the terrain
* Empty building lots along roads
* Buildings in the lots

The results are different each time due to random variation, but follow configurable rules.

Next, this abstract definition is turned into a 3D model that can be rendered with WebGL, with the help of [three.js](http://threejs.org).

Finally, a rendering loop begins which moves a three.js camera around the scene.


## Local Development

* `city_tour.html` requires `city_tour.js`, which is a minified and concatenated build of the source files. It's not included in this repo. You'll need to generate it locally by running `./build.rb`.
  * First, install UglifyJS from NPM: `npm install uglify-js`
  * Next install the `rb-fsevent` Ruby gem: `gem install rb-fsevent`
  * To generate `city_tour.js` once, run `./build.rb` or `ruby build.rb`
  * To automatically rebuild `city_tour.js` when a file in `src/` changes, run `./build.rb watch` or `ruby build.rb watch`
* Open `city_tour.html` in your browser and you should be good to go!
* To run the tests, open `spec/SpecRunner.html` in your browser
