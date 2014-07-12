###LINK: https://bitbucket.org/particle4devs-team/famodev 

Master (dev) branch
Stable (releases) branch
> git push origin HEAD:releases
 
Work with releases branch
> git fetch && git checkout releases
> git pull origin master
> resolve conflict
> git commit & push


#ReactiveSurface

##Basic

*1) Trong file main.js, tao 1 surface:

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

*2)Dinh nghia 1 Session ben ngoai define():

	Session.set(key, value);
Sau do, thay doi content trong Surface({...}):

	content: function(){
		return Session.get(key)
	}
	
*3) Tao hieu ung cho surface:

Them StateModifier va Transform vao define():

	var StateModifier = require("famous/modifiers/StateModifier");
	var Transform = require("famous/core/Transform");
	
Va thay doi code ben duoi var surface = new Surface({...}) :

	var stateModifier = new StateModifier();
	stateModifier.setTransform(
		Transform.translate(x, y, z),
		{ duration: time, curve: EasingCurve }
	);
	
	manContext._add(stateModifier).add(surface);
	
*4) Use ReactiveSurface in define():

Them ReactiveSurface vao define():

	var ReactiveSurface = require("famodev/ReactiveSurface");
	
Thay doi var surface = new Surface({...}) thanh var reactiveSurface = new ReactiveSurface({...})

Giu nguyen noi dung ben trong.

Sau do, chuyen stateModifier.setTransform(...) vao trong reactiveSurface.on(event, function(value){...}):

	reactiveSurface.on(event, function(value){
		stateModifier.setTransform(...);
	});
	
value la value trong Session.

#Scrollview2

*1) Lay nguyen vi du Scrollview trong example cua famo.us:

	define(function(require, exports, module) {
		var Engine     = require("famous/core/Engine");
		var Surface    = require("famous/core/Surface");
		var Scrollview = require("famous/views/Scrollview");
	
		var mainContext = Engine.createContext();
	
		var scrollview = new Scrollview();
		var surfaces = [];
	
		scrollview.sequenceFrom(surfaces);
	
		for (var i = 0, temp; i < 40; i++) {
			temp = new Surface({
				 content: "Surface: " + (i + 1),
				 size: [undefined, 200],
				 properties: {
					 backgroundColor: "hsl(" + (i * 360 / 40) + ", 100%, 50%)",
					 lineHeight: "200px",
					 textAlign: "center"
				 }
			});
	
			temp.pipe(scrollview);
			surfaces.push(temp);
		}
	
		mainContext.add(scrollview);
	});
	
Sau do thay

	var Scrollview = require("famous/views/Scrollview");
	
thanh

	var Scrollview = require("famodev/Scrollview2");
	
*2) Bat su kien con cuon chuot o Top

Them code vao ngay tren mainContext.add(scrollview); :

	scrollview.on("onTop", function(data){
		console.log(data);
		// noi dung function
	});
	
*3)	Bat su kien con cuon chuot o Bottom

Them code vao ngay tren mainContext.add(scrollview); :

	scrollview.on("onBottom", function(data){
		console.log(data);
		//noi dung function
	});
	
*4) Bat su kien con cuon chuot luc len va luc xuong

	scrollview.on("moveScroll", function(event){
		if(this.getDirection() == Scrollview.UP)
			console.log("UP");
		if(this.getDirection() == Scrollview.DOWN)
			console.log("DOWN");
	});



