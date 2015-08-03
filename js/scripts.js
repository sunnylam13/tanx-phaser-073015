////////////////////////////////////////////
// 		VARIABLES
////////////////////////////////////////////
	// create an empty object... which is the start of the application
	// you don't have to start it empty though... it is cleaner however
	// the word app is too generic...
	// you might use the initials of the website you're designing

	var tanx1 = {};

	// then below there you can add things
	
	// create a new game instance
	// where the last parameter is the name
	tanx1.game = new Phaser.Game(640,480,Phaser.CANVAS,'game');

	tanx1.PhaserGame = function (game) {
		this.tank = null;
		this.turret = null;
		this.flame = null;
		this.bullet = null;

		this.background = null;
		this.targets = null;

		this.power = 300;
		this.powerText = null;

		this.cursors = null;
		this.fireButton = null;
	}

	/* 
	* the functions or methods were added to the prototype of the PhaserGame
	* this allows you to use name spacing without issues unlike the simple Phaser exercise
	* 
	*/


	tanx1.PhaserGame.prototype = {

		init: function () {
			// Because this game uses pixel art we're going to use a rounded canvas renderer
			// This will stop Phaser from rendering graphics at sub-pixel locations, keeping them nice and crisp
			this.game.renderer.renderSession.roundPixels = true;

			// set the game world to be 992 pixels wide
			// enable physics
			// setting a gravity value of 200
			this.game.world.setBounds(0,0,992,480);
			this.physics.startSystem(Phaser.Physics.ARCADE);
			this.physics.arcade.gravity.y = 200;
		},

		preload: function () {
			
			// we need this because the assets are on Amazon s3
			// remove the next 2 lines if running locally
			// this.load.baseURL = "http://files.phaser.io.s3.amazonaws.com/codingtips/issue001/";
			// this.load.crossOrigin = 'anonymous';

			this.load.image('tank','assets/tank.png');
			this.load.image('turret', 'assets/turret.png');
			this.load.image('bullet', 'assets/bullet.png');
			this.load.image('background', 'assets/background.png');
			this.load.image('flame', 'assets/flame.png');
			this.load.image('target', 'assets/target.png');

			//  Note: Graphics from Amiga Tanx Copyright 1991 Gary Roberts
		},

		create: function () {

			/* 
			* Monday, August 3, 2015 12:58 PM:  difference is that the targets are now positioned so they lay on the new landscape
			* 
			*/
			
			// simple yet pretty background
			this.background = this.add.sprite(0,0,'background');

			// ----------------------------------------
			// TARGETS  ------------------
			// ----------------------------------------
				// something to shoot at :)
				/* 
				* declare the targets group
				* grant them physics
				*/

				// We also create a Group of targets to shoot. This is a standard Phaser Group with Arcade Physics enabled on it.
				this.targets = this.add.group(this.game.world,'targets',false,true,Phaser.Physics.ARCADE);

				// create each of the targets in the group
				// give it position
				this.targets.create(300,390,'target');
				this.targets.create(500,390,'target');
				this.targets.create(700,390,'target');
				this.targets.create(900,390,'target');

				// stop gravity from pulling them away
				// However because of this we need to stop gravity from pulling the targets away
				// NOTE:  `setAll` lets you quickly set the same property across all members of the Group. In this case we tell it to disable gravity.
				this.targets.setAll('body.allowGravity',false);
			// ----------------------------------------
			// END TARGETS  ------------------
			// ----------------------------------------
			
			// ----------------------------------------
			// BULLETS  ------------------
			// ----------------------------------------
				// a single bullet that the tank will fire
				this.bullet = this.add.sprite(0,0,'bullet');
				this.bullet.exists = false;
				this.physics.arcade.enable(this.bullet);
			// ----------------------------------------
			// END BULLETS  ------------------
			// ----------------------------------------

			// ----------------------------------------
			// LANDSCAPE  ------------------
			// ----------------------------------------
				/* 
				* the land is a bitmap data the size of the game world...
				* we draw the land.png to it and then add it to the world
				* This PNG has the landscape drawn on a transparent background
				* Internally this creates a new Sprite object, sets the BitmapData to be its texture and adds it to the Game World at 0, 0 (because we didn't specify any other location).
				*/
				this.land = this.add.bitmapData(992,480);
				this.land.draw('land'); // hand it a name
				this.land.update(); // have to update it when it's destroyed
				this.land.addToWorld(); // add it to the game world
			// ----------------------------------------
			// END LANDSCAPE  ------------------
			// ----------------------------------------

			// ----------------------------------------
			// TANK  ------------------
			// ----------------------------------------
				/* 
				* We need to assemble the tank. 
				* It's split into two images: the base of the tank, and the turret. 
				* The turret is positioned against the base so it looks correct when rotating. 
				* The area highlighted in red is where they are "joined"
				* 
				*/

				// the body of the tank
				this.tank = this.add.sprite(24,383,'tank');

				// the turret which we rotate (offset 30x14 from the tank)
				this.turret = this.add.sprite(this.tank.x + 30, this.tank.y + 14, 'turret');
			// ----------------------------------------
			// END TANK  ------------------
			// ----------------------------------------

			// ----------------------------------------
			// TURRET FLAME  ------------------
			// ----------------------------------------
				// when we shoot this little flame sprite, it will appear briefly at the end of the turret
				this.flame = this.add.sprite(0,0,'flame');
				this.flame.anchor.set(0.5);
				this.flame.visible = false;
			// ----------------------------------------
			// END TURRET FLAME  ------------------
			// ----------------------------------------

			// ----------------------------------------
			// POWER OF SHOT  ------------------
			// ----------------------------------------
				// used to display the power of the shot
				this.power = 300;
				this.powerText = this.add.text(8,8,'Power: 300', { font: "18px Arial", fill: "#ffffff" });
				this.powerText.setShadow(1,1,'rgba(0,0,0,0.8', 1);
				this.powerText.fixedToCamera = true;
			// ----------------------------------------
			// END POWER OF SHOT  ------------------
			// ----------------------------------------

			// ----------------------------------------
			// CONTROLS  ------------------
			// ----------------------------------------
				/* 
				* some basic controls
				* 
				*/

				this.cursors = this.input.keyboard.createCursorKeys();

				this.fireButton = this.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
				this.fireButton.onDown.add(this.fire, this);

			// ----------------------------------------
			// END CONTROLS  ------------------
			// ----------------------------------------

		},

		fire: function () {
			/* 
			* called by fireButton.onDown
			* @method fire
			* 
			*/

			if (this.bullet.exists) {
				return;
			}

			// re-position the bullet where the turret is
			// take the turrets current position x, y and apply it to the bullet
			// starts by setting the bullet back to the turret coordinates (in case it has already been fired)
			this.bullet.reset(this.turret.x, this.turret.y);

			/* 
			* display the 'flame' sprite when they shoot. 
			* This is a burst of fire that emits from the end of the turrets gun then fades away
			* We know the coordinates of the left of the turret, but what about the end?
			* There are several ways to solve...
			* one way is to use Point.rotate
				* This allows you to calculate where the Point would be if it was rotated and moved from its origin. 
				* In the code we set the rotation to match the turret, and the distance 34 pixels works for these assets
				* The end result is that the flame effect appears at the end of the gun, regardless of its angle of rotation.
			*/
			// now work out where the END of the turret is
			var p = new Phaser.Point(this.turret.x, this.turret.y);
			p.rotate(p.x, p.y, this.turret.rotation, false, 34);

			// and position the flame sprite there
			// we apply the point rotated coordinates to the flame sprite `this.flame`
			// we make it visible
			this.flame.x = p.x;
			this.flame.y = p.y;
			this.flame.alpha = 1;
			this.flame.visible = true;

			// boom
			this.add.tween(this.flame).to( {alpha: 0},100,"Linear",true );

			// so we can see what's going on when the bullet leaves the screen
			// At the same time we tell the Camera to track the bullet as it flies
			this.camera.follow(this.bullet);

			// our launch trajectory is based on the angle of the turret and the power
			// will calculate the velocity need for these two factors and inject them into the velocity of the bullet
			this.physics.arcade.velocityFromRotation(this.turret.rotation, this.power, this.bullet.body.velocity);
		},

		hitTarget: function (bullet, target) {
			/* 
			* called by physics.arcade.overlap if the bullet and a target overlap
			*
			* @method hitTarget
			* @param {Phaser.Sprite} bullet - A reference to the bullet (same as this.bullet)
			* @param {Phaser.Sprite} target - The target the bullet hit
			* 
			*/


			target.kill();
			this.removeBullet();
		},

		removeBullet: function () {
			/* 
			* removes the bullet
			* stops the camera following
			* tweens the camera back to the tank
			* have to put in its own method as it's called from several places
			*
			* In the `update` method we check if the bullet exists (i.e. is in flight), and if so we perform an overlap check between it and the targets. 
				* If they overlap the target is killed and the bullet removed
				* see:  @method hitTarget
			* stop the Camera tracking the bullet so that the tween works. 
				* The tween pauses for 1 second then tweens the Camera back to look at the tank again ready for the next shot. 
				* WARNING:  If you don't stop the Camera following the tween...  it will seem to fail, because Camera tracking takes priority over positioning of it
			*/

			this.bullet.kill();
			this.camera.follow();
			this.add.tween(this.camera).to( {x: 0}, 1000, "Quint", true, 1000 );
		},

		bulletVsLand: function () {
			/* 
			* called by update() if the bullet is in flight
			* @method bulletVsLand
			* 
			* starts with a simple bounds check
			* 
			*/

			// simple bounds check
			if (this.bullet.x < 0 || this.bullet.x > this.game.world.width || this.bullet.y > this.game.height) {
				this.removeBullet();
				return;
			}

			// Because we're going to be doing a pixel color look-up on the BitmapData we have to floor the bullet coordinates
			var x = Math.floor(this.bullet.x);
			var y = Math.floor(this.bullet.y);
			// Once done we can use the BitmapData.getPixel method to get a Color object for the given pixel. 
			// This is done every frame as the bullet flies through the air, we sample the pixel color beneath it.
			var rgba = this.land.getPixel(x,y);

			if (rgba.a > 0) {

				/* 
				* Our PNG is a landscape drawn on a transparent background, so all we need to do is check that we're over a pixel that has an alpha value greater than zero. 
					* If this is the case we blow a chunk out of the land.
					* done by setting the destination-out blend mode
					* If you draw on a canvas with this blend mode you can effectively "remove" parts of it. In this case we'e drawing a 16px sized circle where the bullet landed. Combine this with the blend mode and you punch a small hole into the land.
				* Options
					* vary the circle size 
					* draw an entirely different shape
				* 
				*/
				
				this.land.blendDestinationOut();
				this.land.circle(x,y,16,'rgba(0,0,0,255');

				// The final few lines reset the blend mode and call BitmapData.update which tells it to rescan the pixel data and render the new scene.
				this.land.blendReset();
				// Finally the bullet is removed, its job done.
				this.land.update();

				// you can also combine the 4 lines with piping
				// this.land.blendDestinationOut().circle(x, y, 16, 'rgba(0, 0, 0, 255').blendReset().update();
				
				this.removeBullet();
			}
		},

		update: function () {
			/* 
			* Core update loop
			* handles collision checks and player input
			* @method update
			* 
			*/

			// if the bullet is in flight we don't let them control anything
			if (this.bullet.exists) {
				if (this.bullet.y > 420) {
					// simple check to see if it's fallen too low
					this.removeBullet();
				}
				else {
					// ----------------------------------------
					// BULLET VS TARGETS  ------------------
					// ----------------------------------------
						// bullet vs the Targets
						this.physics.arcade.overlap(this.bullet, this.targets, this.hitTarget,null,this);
					// ----------------------------------------
					// END BULLET VS TARGETS  ------------------
					// ----------------------------------------
				
					// ----------------------------------------
					// BULLET VS LAND  ------------------
					// ----------------------------------------
						/* 
						* now we need to check if the bullet hits the land
						* we assign the impact effects to a method of its own
						*/

						this.bulletVsLand();

					// ----------------------------------------
					// END BULLET VS LAND  ------------------
					// ----------------------------------------	
				}
			}
			else {
				// ----------------------------------------
				// POWER CHANGE  ------------------
				// ----------------------------------------
					// allow them to set the power between 100 and 600
					if (this.cursors.left.isDown && this.power > 100) {
						this.power -= 2;
					}
					else if (this.cursors.right.isDown && this.power < 600) {
						this.power += 2;
					}
				// ----------------------------------------
				// END POWER CHANGE  ------------------
				// ----------------------------------------
				
				// ----------------------------------------
				// ANGLE CHANGE  ------------------
				// ----------------------------------------
					/* 
					* This is done with a check to ensure it is kept within limits and then we change the Sprite.angle property of the turret. 
						* `this.turret.angle`
					* The default anchor of the turret means this rotation works correctly with no further settings.
					* 
					*/

					// allow them to set the angle, between -90 (straight up) and 0 (facing to the right)
					if (this.cursors.up.isDown && this.turret.angle > -90) {
						this.turret.angle--;
					}
					else if (this.cursors.down.isDown && this.turret.angle < 0) {
						this.turret.angle++;
					}
				// ----------------------------------------
				// END ANGLE CHANGE  ------------------
				// ----------------------------------------
				
				// update the text
				this.powerText.text = 'Power: ' + this.power;
				
			}
		}

	}

	// here we add the entire game object to the game state
	tanx1.game.state.add('Game',tanx1.PhaserGame,true);

////////////////////////////////////////////
// 		END VARIABLES
////////////////////////////////////////////


////////////////////////////////////////////
// 		FUNCTIONS
////////////////////////////////////////////
	// don't forget to call the function in EXECUTION CODE area before running

	// NOTE:  in terms of organization, Ryan prefers to put all other functions and variables above the object.init() method however in reality it doesn't matter


////////////////////////////////////////////
// 		END FUNCTIONS
////////////////////////////////////////////


////////////////////////////////////////////
// 		EVENTS
////////////////////////////////////////////
	// for storing various event listeners
	// this method will be used to listen for the open and close events and trigger those methods
	// Ryan C often uses this though Drew doesn't always
	tanx1.events = function () {
		//
	}
////////////////////////////////////////////
// 		END EVENTS
////////////////////////////////////////////



////////////////////////////////////////////
// 		INIT
////////////////////////////////////////////
	// method to initialize our application
	// all our code will be put inside here
	// you should not be defining things in here
	tanx1.init = function () {
		this.events();
	}
////////////////////////////////////////////
// 		END INIT
////////////////////////////////////////////

////////////////////////////////////////////
// 		EXECUTION CODE
////////////////////////////////////////////
	jQuery(document).ready(function($) {
		tanx1.init();
	});  //end doc.onready function
////////////////////////////////////////////
// 		END EXECUTION CODE
////////////////////////////////////////////