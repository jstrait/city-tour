# City Tour

Visit a procedurally generated city, different each time. Sit back and enjoy the ride!

<https://www.joelstrait.com/citytour/>

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

Once this is all created, you can move around the city using touch gestures (mobile) or the mouse (desktop). Navigation works similar to Google/Apple Maps. You can also click the "Take a Tour" button to go on an automatic flight/drive through the city.

## Building / Running Locally

* If first time building, run `yarn install`
* Run `yarn build-dev`, which will build the app in the `dist/` folder
* Open `dist/index.html` in your browser (make sure running a local server such as MAMP)
* To automatically rebuild when source files change, run `yarn build-dev --watch` instead

## Building for Production

* Run `yarn build-prod`
* `dist/` folder will contain the files that should be deployed to production

## Running Tests

* `yarn test`
