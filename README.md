LINK: https://bitbucket.org/particle4devs-team/famodev

Master (dev) branch

Stable (releases) branch
git push origin HEAD:releases

#ReactiveSurface
*1) Trong file main.js, tao 1 surface:<br/>

define(function(require, exports, module){
	var Engine = require("famous/core/Engine");
	var Surface = require("famous/core/Surface");
	
	var mainContext = Engine.createContext();
	
	var surface = new Surface({
		size:[width, height],
		content: "Hello World",
		properties: {
			textAlign: "center",
			lineHeight: "",
			backgroundColor: "",
			color: ""
		}
	});
	
	mainContext.add(surface);
	
});

