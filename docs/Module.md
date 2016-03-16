#Module

A modV Module is a file with a specific structure to create a visual effect.

Modules are structured like so:

```
var moduleName = function() {
	this.info = {
		name: 'moduleName',
		author: '2xAA',
		version: 0.1,
		meyda: [],
		controls: []
	};

	this.init = function(canvas) {
		
	};

	this.draw = function(canvas, ctx, audio, vid, meyda) {
		
	};
};

```

##Module Objects

###this.info
Contains the information about the module.

```
this.info = {
	name: 'moduleName', 	// String: must match the variable you use for the module
	author: '2xAA', 		// String: the module author's name
	version: 0.1, 			// Number: the version number
	meyda: [], 				// String Array: the Meyda features the module requires (see Meyda docs for available features)
	controls: [] 			// modV Control Object Array: defining the module's control exports
};
```

###this.init
Function called on module registration.

```
this.init = function(canvas) {
	canvas; // HTMLCanvasElement: the main canvas output by modV
};
```
###this.draw
Function called within modV's draw loop (attempts 60fps)

```
this.draw = function(canvas, ctx, audio, video, meyda) {
	canvas; // HTMLCanvasElement: the main canvas output by modV
	ctx;	// CanvasRenderingContext2D: the 2D rendering context for the drawing surface of modV's main canvas
	audio; 	// !!! soon to be depreciated in favour of Meyda
	video; 	// HTMLVideoElement: the webcam input that modV requests
	meyda; 	// Object: contains requested Meyda features from all modV Modules
};
```

## Proposed modV v1.0 Module2D spec (rev 3)

```
var myModule = new modV.Module2D({
	info: {
		name: 'Default Module',
		author: '2xAA',
		version: 0.1,
		meyda: [],
		controls: [],
		previewWithOutput: false // Show Gallery preview with current output mixed or not
	},
	init: function(vars) {
 		// Set up local variables here
		this.hue = 0;
		this.amount = 0; // not required as the first modV.Control initiated this variable already
    
		// Small local function
		this.whatever = function() {
			return 'Whatever yo';
		};
	},
	draw: function(vars) {
		// Draw loop
		if(this.hue > 360) this.hue = 0;
		this.hue++;
		
		this.customFunction();
	}
});

// Larger local function
myModule.customFunction = function() {
	alert(this.whatever());
};

// Add on another Control
myModule.add(new modV.Control({
	type: 'palette',
	variable: 'colour', // initiates local variable (this.colour) because of "type: 'palette'"
	colours: [
		[122,121,120],
		[135,203,172],
		[144,255,220],
		[141,228,255],
		[138,196,255]
	],
	timePeriod: 500
}));

modV.register(myModule);

```

Changes:

* Module definitions now use Constructors
* Control definitions now use Contructors

Pros:

* Neater
* More strict
* Greater flexibility
* More familiar usibility (like Three.JS or most Node libs)

Cons:

* More Syntax
  
Reference: [http://jsfiddle.net/buxq312o/12/](http://jsfiddle.net/buxq312o/12/)

## Proposed modV v1.0 ModuleShader spec (rev 0)
*in progress*

```
var myModuleShader = new modV.ModuleShader({
	info: {
		name: 'Default Shader',
		author: '2xAA',
		version: 0.1,
		meyda: [], // returned variables passed to the shader individually as uniforms
		controls: [], // variabled passed to the shader individually as uniforms
		previewWithOutput: true, // Show Gallery preview with current output mixed or not
		uniforms: {} // Three.JS uniforms
	},
	shaderFile: "/Default Shader/shader.html" // path to HTML file within modules directory with shader script tags
});

modV.register(myModuleShader);

```

* Think about how the main modV Canvas texture will be passed to shaders
* Do ModuleShaders need a draw/update loop?
* Would it be wise to have more than one shader type?
  * Shaders for 2D and 3D
  * 2D shaders taking in the main canvas and writing back (2D shaders called ModuleShader)
  * 3D shaders being attachable to 3D Modules (3D shaders called 3DShader)

## Proposed modV v1.0 Module3D spec (rev 0)

```
// TODO

```