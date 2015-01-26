// This application is a modification of:
// meteor create --example leaderboard

// Set up a collection to contain player information. On the server,
// it is backed by a MongoDB collection named "players".
// boats = new Mongo.Collection("boat-collection");
// fishList = new Mongo.Collection("fish-collection");
players = new Mongo.Collection("player-collection");

GameStateCollection = new Mongo.Collection("GameState");

FishID =0; 
if (Meteor.isClient) {

  // Meteor.subscribe('GameState');

  // Meteor.subscribe('player-collection');


Ocean = (function() {

  var width = 100;
  var height = 100;
  var interval = 1000 / (15 /* fps */);
  var frame = 1;

  var FishSprite=[[0,0,0,0,0, //(yes, this is what you think it is)
                   1,0,1,1,0,
                   1,1,1,1,1,
                   1,0,1,1,0,
                   0,0,0,0,0],

                  [0,0,1,1,1,
                   0,0,1,1,1,
                   0,1,1,1,1,
                   1,1,1,0,0,
                   0,1,0,0,0]];

  var BoatSprite=[[0,0,0,0,0,0,0,
                   1,1,1,1,0,0,0,
                   2,1,1,1,1,1,0,
                   1,1,1,1,1,1,1,
                   3,1,1,1,1,1,0,
                   1,1,1,1,0,0,0,
                   0,0,0,0,0,0,0],

                  [0,0,0,0,1,1,1,
                   0,0,1,1,1,1,1,
                   0,1,1,1,1,1,1,
                   1,1,1,1,1,1,0,
                   2,1,1,1,1,1,0,
                   0,1,1,1,1,0,0,
                   0,0,3,1,0,0,0]];

var NetSprite=[[0,0,0,0,1,0,1,0,2,
                0,0,0,1,0,1,0,1,0,
                0,0,1,0,1,0,1,0,1,
                0,1,0,1,0,1,0,1,0,
                1,0,1,0,1,0,1,0,1,
                0,1,0,1,0,1,0,1,0,//0
                0,0,1,0,1,0,1,0,1,
                0,0,0,1,0,1,0,1,0,
                0,0,0,0,1,0,1,0,3],

               [0,0,2,0,0,0,0,0,0,
                0,1,0,1,0,0,0,0,0,//1
                1,0,1,0,1,0,0,0,0,
                0,1,0,1,0,1,0,0,0,
                1,0,1,0,1,0,1,0,0,
                0,1,0,1,0,1,0,1,0,
                1,0,1,0,1,0,1,0,3,
                0,1,0,1,0,1,0,1,0,
                0,0,1,0,1,0,1,0,0]];//sprites



 window.addEventListener("keydown", function(e) {
    switch(e.keyCode) {
      case 37:
        Meteor.call('LEFTd'); break;
      case 38:
        Meteor.call('UPd'); break;
      case 39:
        Meteor.call('RIGHTd'); break;
      case 40:
        Meteor.call('DOWNd'); break;
    }
  });
  window.addEventListener("keyup", function(e) {
    switch(e.keyCode) {
      case 37:
        Meteor.call('LEFTu'); break;
      case 38:
        Meteor.call('UPu'); break;
      case 39:
        Meteor.call('RIGHTu'); break;
      case 40:
        Meteor.call('DOWNu'); break;
    }
  });



function fish(x, y, color){
         this.x = x;
         this.y = y;
         this.dx = -1;//smarter later
         this.dy = 1;
         this.segment =  Math.round((Math.random() * 100))%8;
         this.color = color;
      } 
function boat(x, y, color, player){
         this.x = x;
         this.y = y;
         
         this.moving = false;
        
         this.player = player;
         this.color = color;

         this.segment = (player ==1)? 0 : 4;
         this.ropePos = [this.x-(1*player),this.y,this.segment];
         this.ropePos2= [this.x-(2*player),this.y,this.segment]; //(and segment)
         this.netPos  = [this.x-(3*player),this.y,this.segment];
      } 


function Ocean() {
    // this.Fishes    = init(population); // spawn new fish
    //this.boats      = [new boat(10,10,5714700,1),new boat(90,90, 7702428,-1)];
    this.canvas    =  document.getElementById("canvas");
    this.scale     = 5//canvas.getAttribute('width') / width;
    this.context   = canvas.getContext('2d');
    this.imageData = this.context.createImageData(width * this.scale, height * this.scale);
    this.then      = +Date.now();
    this.paused    = false;
  }


  Ocean.prototype = {
    play: function() {
      this.paused = false;
      this.step();
    },

    pause: function() {
      this.paused = true;
    },

    step: function() {
      // Rerun the step() function every animation frame
      if (this.paused) return;
      requestAnimFrame(this.step.bind(this));

      var now = +Date.now();
      var delta = now - this.then;
      if (delta > interval) {
        this.then = now;
        this.drawFrame();
        frame++;
      }
    },

    drawFish: function(fish) {
       var x = fish.x;
       var y = fish.y;
       var color = fish.color;
       var R = (color & 0xff0000) >>> 16;
       var G = (color & 0x00ff00) >>> 8;
       var B = (color & 0x0000ff) >>> 0;

       var segment = (8-fish.segment);
       var sprite = FishSprite[segment%2];
       var sps  = 4;

       var xpos = function (x,y) 
        {
        if(segment ==2)
          return(sps-y);
        else if (segment==6)
          return(y);
        else if(segment>6 || segment<2)
         return(x);
        else
          return(sps-x);
       }
       var ypos = function (y,x)
        {
        if(segment ==2)
          return(sps-x);
        else if(segment==6)
          return(x);
        else if(segment<4)
         return(y);
        else
          return(sps-y);
       }

       for (var sx = 0; sx < 5; sx++) {
            for (var sy = 0; sy < 5; sy++) {
              if(sprite[(xpos(sx,sy))+(5*ypos(sy,sx))])  
              {
              var i = (((y * this.scale + (sy-1)) * width * this.scale) + (x * this.scale + (sx-1))) * 4;
              this.imageData.data[i]   = R%255;
              this.imageData.data[i+1] = G%255;
              this.imageData.data[i+2] = B%255;
              this.imageData.data[i+3] = 255;
              }      
            }
          }

    },

   drawBoat: function(boat) {
       var x = boat.x;
       var y = boat.y;
       var color = boat.color;
        var R = (color & 0xff0000) >>> 16;
        var G = (color & 0x00ff00) >>> 8;
        var B = (color & 0x0000ff) >>> 0;
       var segment = (8-boat.segment);
       var sprite = BoatSprite[segment%2];
       var sps  = 6;

       var spritevalue = 0;
       var ropePoints=  [[ [0,0],[0,0] ],[ [0,0],[0,0] ]];
                      
       var xpos = function (x,y) {
        if(segment ==2)
          return(sps-y);
        else if (segment==6)
          return(y);
        else if(segment>6 || segment<2)
         return(x);
        else
          return(sps-x);
       }
       var ypos = function (y,x) {
        if(segment ==2)
          return(sps-x);
        else if(segment==6)
          return(x);
        else if(segment<4)
         return(y);
        else
          return(sps-y);
       }

       for (var sx = 0; sx < 7; sx++) {
            for (var sy = 0; sy < 7; sy++) {
              spritevalue =sprite[(xpos(sx,sy))+(7*ypos(sy,sx))];
              if(spritevalue && (y+sy>=0))  
              {
              var i = (((y * this.scale + (sy-1)) * width * this.scale) + (x * this.scale + (sx-1)))*4;
              this.imageData.data[i]   = R%255;
              this.imageData.data[i+1] = G%255;
              this.imageData.data[i+2] = B%255;
              this.imageData.data[i+3] = 255;

               if(spritevalue>1) 
                ropePoints[0][(spritevalue==2)?0:1]= [((y * this.scale + (sy-1))) ,(x * this.scale + (sx-1))];
               
              }      
            }
          }
      
      
        segment = (8-boat.netPos[2]); //draw net
        sprite = NetSprite[segment%2];
        sps  = 8;
        x = boat.netPos[0];
        y = boat.netPos[1];

       for (var sx = 0; sx < 9; sx++) {
            for (var sy = 0; sy < 9; sy++) {
             spritevalue =sprite[(xpos(sx,sy))+(9*ypos(sy,sx))] ;
              if(spritevalue)  
              {
              var i = (((y * this.scale + (sy-2)) * width * this.scale) + (x * this.scale + (sx-2))) * 4;
              this.imageData.data[i]   = 255;
              this.imageData.data[i+1] = 200;
              this.imageData.data[i+2] = 200;
              this.imageData.data[i+3] = 255;

              if(spritevalue>1)  
                ropePoints[1][(spritevalue==2)?0:1]= [((y * this.scale + (sy-2))) ,(x * this.scale + (sx-2))];
               
              }      
            }
          }



        for(var rope = 0; rope < 2; rope++){
          var ropeStart = ropePoints[0][rope];
          var ropeEnd   = ropePoints[1][rope];
          var slope = (ropeEnd[1]- ropeStart[1]) / (ropeEnd[0]- ropeStart[0]);
             
     for (var x = ropeStart[0]; x != ropeEnd[0]; x+= (ropeEnd[0]>ropeStart[0])? 1 :-1  ) {
        y = Math.round(((x-ropeStart[0])*slope) + ropeStart[1]);
       
        var i = ((x *width*this.scale)+ y)*4;
        this.imageData.data[i]   = 255;
        this.imageData.data[i+1] = 255;
        this.imageData.data[i+2] = 225;
        this.imageData.data[i+3] = 50;

        }
      var slope = (ropeEnd[0]- ropeStart[0]) / (ropeEnd[1]- ropeStart[1]);
       for (var y = ropeStart[1]; y != ropeEnd[1]; y+= (ropeEnd[1]>ropeStart[1])? 1 :-1  ) {
        x = Math.round(((y-ropeStart[1])*slope) + ropeStart[0]);
       
        var i = ((x *width*this.scale)+ y)*4;
        this.imageData.data[i]   = 255;
        this.imageData.data[i+1] = 255;
        this.imageData.data[i+2] = 225;
        this.imageData.data[i+3] = 50;

        }
      }

    },

    drawFrame: function() {
      Meteor.call('step');

      this.context.fillRect(0,0,500,500);
      offset =79+ Math.round( (Math.sin(frame/3) *2)  + (Math.random()*2)) ; 
      this.context.fillStyle = '#0310'+offset.toString(16);
      this.context.fill();

     this.imageData = this.context.getImageData(0, 0, 500, 500);
      
      
       FishArray = GameStateCollection.find().fetch()[0].content;

      for(var i=0; i<FishArray.length; i++)
       this.drawFish(FishArray[i]);
        
  
      
      // document.getElementById('score').innerHTML = 'Catch Rate:   WASD: ' +this.boats[0].rate.toFixed(0)+'    ArrowKeys: ' +this.boats[1].rate.toFixed(0)+'     -    Population: '+this.Fishes.length ;
     
      this.context.putImageData(this.imageData, 0, 0);
       

  
    }
  };

  var requestAnimFrame =
        window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        function(callback) {
          window.setTimeout(callback, 2000);
        };

  return Ocean;
})();




}

// On server startup, create some players if the database is empty.
if (Meteor.isServer) {

	GameStateCollection.remove({})
  // Allow clients to subscribe to Players
  // Meteor.publish('listOfFish', function() {
  //   return Ocean.Fishes;
  // })
  //   Meteor.publish('boatList', function() {
  //   return Ocean.boats;//Players.find()
  // })
  //   Meteor.publish('player-collection', function() {
  //   return Ocean.boats;//Players.find()
  // })
  // Meteor.publish('GameState', function() {
  //   return GameStateCollection.find({});
  // })


  // Constant properties 
  Ocean = (function() {

  var width = 100;
  var height = 100;

  var population = 10;
  var capacity = 150;
  var growthFactor = .2;
  var interval = 1000 / (1 /* fps */);
  var region = [6,13];
  var frame = 1;
                     //   [-7,-6,-5,-4,-3,-2,-1,0,1,2,3,4, 5, 6, 7] 
  var SegmentWrapLogicLUT=[ 1, 1, 1, 9,-1,-1,-1,0,1,1,1,9,-1,-1,-1]; //this is a look up table for whether to rotate left or right


  var keyW = false
    , keyA = false
    , keyS = false
    , keyD = false

    , keyUp = false  
    , keyLeft = false
    , keyDown = false
    , keyRight = false;

   function decodeSegment(segment){ //convert direction to x and y 
            var delta = [0,0];

            segment = (segment+8)%8;
              switch(segment) {
                  case 0:
                      delta = [1,0];
                      break;
                  case 1:
                      delta = [1,1];
                      break;
                  case 2:
                      delta = [0,1];
                      break;
                  case 3:
                      delta = [-1,1];
                      break;
                  case 4:
                      delta = [-1,0];
                      break;
                  case 5:
                      delta = [-1,-1];
                      break;
                  case 6:
                      delta = [0,-1];
                      break;
                  case 7:
                      delta = [1,-1];
                      break;
                  case 8:
                      delta = [1,0];
                      break;
                  default:
                       console.log("weird segment");
                       break;
              }

            return(delta);
      }

  function encodeSegment(up, down, left, right){
         var delta = [0,0];
     var segment = -1;

    if(left && right)
        delta[0] =  0;
    else if(left)
        delta[0] = -1;
    else if(right)
        delta[0] =  1;
   
    if(up && down)
        delta[1] =  0;
    else if (up)
        delta[1] = -1;
    else if (down)
        delta[1] =  1;

    if (delta[0] == 1 && delta[1]  == 0)
        segment = 0;
    else if(delta[0] == 1 && delta[1] == 1)
        segment = 1;
    else if(delta[0] == 0 && delta[1] == 1)
        segment = 2;
    else if(delta[0] == -1 && delta[1] == 1)
        segment = 3;
    else if(delta[0] == -1 && delta[1] == 0)
        segment = 4;
    else if(delta[0] == -1 && delta[1] == -1)
        segment = 5;
    else if(delta[0] == 0 && delta[1] == -1)
        segment = 6;
    else if(delta[0] == 1 && delta[1] == -1)
        segment = 7;
    else if(delta[0] == 0 && delta[1] == 0)
        segment = -1;
    else 
         console.log("weirdencode");

    return(segment);
    }

function portableFish(fish){
         this.x = fish.x;
         this.y = fish.y;
         this.segment = fish.segment;
         this.color = fish.color;
      } 

function fish(x, y, color){
         this.x = x;
         this.y = y;
         this.dx = -1;//smarter later
         this.dy = 1;
         this.segment =  Math.round((Math.random() * 100))%8;
         this.color = color;
         this.closestFish = this; 
       //  this.pogo = new portableFish(this);
          // console.log(this.color);
      } 

      fish.prototype = {

        getClosestWall: function(){

        var wallpoint = [0,0];
        var workingvector = [0,0];
       
        if( this.x > (width/2) ) //on right side
          workingvector[0] = width-this.x;
        else
          workingvector[0] = -this.x; //on the left side

        if( this.y > (height/2) ) //on bottom side
          workingvector[1] = height-this.y;
        else
          workingvector[1] = -this.y;

        if( Math.abs(workingvector[0]) < Math.abs(workingvector[1])) //closer to a vertical wall
        {
          wallpoint[0] = (workingvector[0]>0) ? width : 0;
          wallpoint[1] = this.y;
        }
        else //closer to a horizontal wall
        {
         wallpoint[1] = (workingvector[1]>0) ? height : 0;
         wallpoint[0] = this.x;
        }

        return(wallpoint);
        },


        getDistance: function(point){
        return(Math.sqrt(Math.pow((this.x - point[0]),2)+Math.pow((this.y- point[1]),2)));
        },

        swim: function(listOfFish, boats) {

          var distance = [0,0];
          var tempFish;
          var tempdistance;
          var closestThing = this; 
          var closestPoint; 
          var closestDistance = 999999; 
          var AngleOfAttack = 0; //180=away, 0 = towards, 90= perpendicularly


          var desiredSegment;
          var alone =false;

          var workingvector = [0,0];
          var sumvector =[0,0];
          var unitvector = [0,0]; 

          for(var i=0; i<listOfFish.length; i++){

            tempFish = listOfFish[i];

            if (tempFish === this)// || (this.getDistance([tempFish.x,tempFish.y]))>30 ) //skip myself
              continue;

            tempdistance = Math.round(this.getDistance([tempFish.x,tempFish.y]));

            if( tempdistance < closestDistance) //TODO delay sqrt for perfomance
              {
               
                if(tempdistance == 0 )
                  {
                    tempFish.x=tempFish.x+(Math.random()>.5 ? -1 : 1); //massage overlaps
                    tempFish.y=tempFish.y+(Math.random()>.5 ? -1 : 1);  //listOfFish.splice(i, 1);
                  }
                else
                  {
                    closestThing = listOfFish[i];
                    closestDistance = tempdistance;
                  }
              }
            workingvector = [0,0];
              if(tempdistance<region[1]){
            workingvector[0] = (this.x == tempFish.x) ?  0 :  Math.pow((this.x-tempFish.x)/10,-1) ;
            workingvector[1] = (this.y == tempFish.y) ?  0 :  Math.pow((this.y-tempFish.y)/10,-1) ;
              }
            switch (true) {
                case (tempdistance < region[0]):
                    sumvector[0] += workingvector[0]; //180 - away //friend too close on wv[0]=(-2), so we want to go left (-2)
                    sumvector[1] += workingvector[1];
                    break;
                case (tempdistance < region[1]): 
                    tempdirection = decodeSegment(tempFish.segment);
                    sumvector[0] += tempdirection[0] * Math.pow(tempdistance/2,-1); //friend is going right(1,0) so we are too
                    sumvector[1] += tempdirection[1] * Math.pow(tempdistance/2,-1);
                    break;
                case (tempdistance > (region[1]-1) )://do nothing
                    break;
                default:
                    alert("none");
                    break;
            }
            if(!isFinite(sumvector[0]) || !isFinite(sumvector[1]))
             alert(sumvector);

          }

          this.closestFish = closestThing;
          
          if(closestThing===this)
            alone =true;

          closestPoint = [closestThing.x,closestThing.y];

          wallpoint = this.getClosestWall();

           if(this.getDistance(wallpoint)<closestDistance)
            closestPoint = wallpoint;
          
           if(this.getDistance(wallpoint)<30)
             {
            sumvector[0] += (this.x == wallpoint[0]) ?  0 :  Math.pow((this.x-wallpoint[0])/10,-1)*4; 
            sumvector[1] += (this.y == wallpoint[1]) ?  0 :  Math.pow((this.y-wallpoint[1])/10,-1)*4;

            if(!isFinite(sumvector[0]) || !isFinite(sumvector[1]))
             alert(sumvector);
            }

          for(var i =0; i < boats.length;i++)
          {
             if(this.getDistance([boats[i].netPos[0],boats[i].netPos[1]])<3)
              boats[i].netted(listOfFish, this);
              

              if(this.getDistance([boats[i].x,boats[i].y])<30)
              {
              var noise = boats[i].moving ? 8 : 3;
               noise = noise* Math.pow(this.getDistance([boats[i].x,boats[i].y])/8,-1);
               // console.log(noise);
              sumvector[0] += (this.x == boats[i].x) ?  0 :  Math.pow((this.x-boats[i].x)/10,-1)* noise; 
              sumvector[1] += (this.y == boats[i].y) ?  0 :  Math.pow((this.y-boats[i].y)/10,-1)* noise;
              }
          }

         
           

          if(alone) //NEEDS EXTRA WORK
            AngleOfAttack = closestPoint === wallpoint ? 180: Math.floor(Math.random() * 360) ; //for solitary fish :(
          
         
          if(this.getDistance(wallpoint)<7)
            {
              theta = Math.atan2(wallpoint[1]-this.y, wallpoint[0]-this.x);
              AngleOfAttack = 180;
            }
            else
          theta = Math.atan2(sumvector[1], sumvector[0]);    

          degrees = ((theta * (180/Math.PI)) + 360 + AngleOfAttack - (45/2) )%360; //pad, flip, offset, and convert
          desiredSegment = Math.round(degrees/45)%8 ; 
      
          if(closestPoint === wallpoint && closestDistance<5)
            this.segment = desiredSegment;
          else
          {
              d = (this.segment-desiredSegment)+7; //   [-7,-6,-5,-4,-3,-2,-1,0,1,2,3,4, 5, 6, 7] (start-end)
                                                  //    [ 1, 1, 1, 9,-1,-1,-1,0,1,1,1,9,-1,-1,-1]  don't spend too much time trying to understand this
              d = SegmentWrapLogicLUT[d]*-1;
                if(d==-9)//special edge case 
                  d=(Math.random()>.5 ? -1 : 1);
              this.segment+=d;
          }

         
          this.segment = (this.segment+8)%8;
          
          var delta = decodeSegment(this.segment);

          this.dx = delta[0];
          this.dy = delta[1];

          this.x += this.dx;
          this.y += this.dy;

          if(this.x>=width-2)
            this.x = width-2;
          if(this.x<=2)
            this.x = 2;
          if(this.y>=height-2)
            this.y = height-2;
          if(this.y<=2)
            this.y = 2;

          },

        spawn: function(listOfFish){

          var R = Math.round((((this.color & 0xff0000)+(this.closestFish.color & 0xff0000)+(Math.random()*0xff0000<<0))/3)) & 0xff0000;
          var G = Math.round((((this.color & 0x00ff00)+(this.closestFish.color & 0x00ff00)+(Math.random()*0x00ff00<<0))/3)) & 0x00ff00;
          var B = Math.round((((this.color & 0x0000ff)+(this.closestFish.color & 0x0000ff)+(Math.random()*0x0000ff<<0))/3)) & 0x0000ff;

          var color = R+G+B;//((this.color + this.closestFish.color) /2);
          var singleFish = new fish(this.x+(Math.random()>.5 ? -1 : 1),this.y+(Math.random()>.5 ? -1 : 1),color);
          listOfFish.push(singleFish);
        }

      };

function boat(x, y, color, player){
         this.x = x;
         this.y = y;
         
         this.moving = false;
        
         this.player = player;
         this.color = color;

         this.segment = (player ==1)? 0 : 4;
         this.ropePos = [this.x-(1*player),this.y,this.segment];
         this.ropePos2= [this.x-(2*player),this.y,this.segment]; //(and segment)
         this.netPos  = [this.x-(3*player),this.y,this.segment];

         this.haul =0;
         this.rate =0;
         this.ledger = [];

          // console.log(this.color);
      } 

      boat.prototype = {

        netted: function(listOfFish,fish){
          listOfFish.splice(listOfFish.indexOf(fish),1);
          this.haul++;
          this.rate++;
          this.ledger.unshift(frame);
          },
         calculateRate: function(){
          for(var i=0; i<this.ledger.length; i++){
            if (this.ledger[i] < (frame - (60000/interval)))
            this.ledger.splice(i,1);
          }

          this.rate = this.ledger.length;
          },
        toot: function(){
          var desiredSegment = 0;
          var delta = [0,0];

          

        // if(this.player == 1)
          desiredSegment = encodeSegment(keyW, keyS, keyA, keyD);
        // else
        //   desiredSegment = encodeSegment(keyUp, keyDown, keyLeft, keyRight);

      console.log(desiredSegment);

           if(desiredSegment == -1)
            { delta = [0,0];
              this.moving = false;}
          else
          {
              this.moving = true;
              TempStorage = [this.x,this.y,this.segment];
              
              d = (this.segment-desiredSegment)+7; //   [-7,-6,-5,-4,-3,-2,-1,0,1,2,3,4, 5, 6, 7] (start-end)
                                                  //    [ 1, 1, 1, 9,-1,-1,-1,0,1,1,1,9,-1,-1,-1]
              d = SegmentWrapLogicLUT[d]*-1;
                if(d==-9)
                  d=(Math.random()>.5 ? -1 : 1);
            this.segment+=d;

            this.segment = (this.segment+8)%8;
            delta = decodeSegment(this.segment);
          }

          this.x += delta[0];
          this.y += delta[1];

        if(this.x>=width-1)
            this.x = width-1;
          if(this.x<=0)
            this.x = 0;
          if(this.y>=height-1)
            this.y = height-1;
          if(this.y<=0)
            this.y = 0;
          
          if(this.moving && ((TempStorage[0]!=this.x) || (TempStorage[1]!=this.y))){
          this.netPos   = this.ropePos2.slice(0);  //shift net and rope
          this.ropePos2 = this.ropePos.slice(0);
          this.ropePos  = TempStorage;
          }
        }

      };


  function generatePortableFishList(listOfFish) {

    var PortableFishList = [];

    for(var i=0; i<listOfFish.length; i++){
      var tempogo = new portableFish(listOfFish[i]);
        PortableFishList.push(tempogo);
      }

    return PortableFishList;
   }

  function init(number) {
    var listOfFish = [];
    var x = 50;
    var y = 50;

    for (var i = 0; i < number; i++) { //spawn n fish and add them to list
      x = Math.floor(Math.random()*(width-60))+30;
      y = Math.floor(Math.random()*(height-60))+30;
      //check if spot is full please
      
      var singleFish = new fish(x,y, (Math.random()*0xFFFFFF<<0));
     
      listOfFish.push(singleFish);
      }

 

      FishID = GameStateCollection.insert(
       {
        name: "FishDocument",
        content: generatePortableFishList(listOfFish)
       });

  
    return listOfFish;
    }

  function Ocean() {
    this.Fishes    = init(population); // spawn new fish
    this.boats     = [new boat(10,10,5714700,1),new boat(90,90, 7702428,-1)];
    this.scale     = 5//canvas.getAttribute('width') / width;
    this.then      = +Date.now();
    this.paused    = false;
    this.GrowthAccumulator = 0;
    // console.log("oceanstarted");
    // this.drawFrame();
   
  }


  Ocean.prototype = {
    // play: function() {
    //   this.paused = false;
    //   this.step();

    // },

    // pause: function() {
    //   this.paused = true;
    // },

    // step: function() {
    //   // Rerun the step() function every animation frame
    //   // if (this.paused) return;
    //   // requestAnimFrame(this.step.bind(this));
      

    //   var now = +Date.now();
    //   var delta = now - this.then;
    //   if (delta > interval) {
    //     this.then = now;
    //     this.drawFrame();
    //     console.log(frame);
    //     frame++;
    //           console.log(now);

    //   }
    //   console.log(now);
    // },



    Growth: function(listOfFish) {
      population = listOfFish.length;
      var r = growthFactor; //rate of growth
      var x = population/capacity;
      
      population += Math.floor((r*x*(1-x)));
      this.GrowthAccumulator += (r*x*(1-x)) - Math.floor((r*x*(1-x)));

      while(listOfFish.length < population)
          listOfFish[  Math.floor(Math.random()*listOfFish.length)  ].spawn(listOfFish);
      if(this.GrowthAccumulator>=1)
        {
        listOfFish[  Math.floor(Math.random()*listOfFish.length)  ].spawn(listOfFish);
        this.GrowthAccumulator =0;
        }
       
        region = [Math.round(9-(population/30)),13];

        // console.log(listOfFish.length , this.GrowthAccumulator.toPrecision(3), (r*x*(1-x)).toPrecision(3));
        return(listOfFish);
    },

    drawFrame: function() {

      var tempFish;

      for(var i=0; i<this.Fishes.length; i++){
        tempFish = this.Fishes[i];
        tempFish.swim(this.Fishes,this.boats);
      }

      this.Growth(this.Fishes);

      for(var i =1; i<this.boats.length; i++){
        this.boats[i].toot();
        this.boats[i].calculateRate();
         //console.log(this.boats[i].x,this.boats[i].y)
      }

   console.log(keyA);
   
       GameStateCollection.update(
        {name: "FishDocument"},
        // {_id: FishID},
        {$set: {content: generatePortableFishList(this.Fishes)}});//this.Fishes} });

     // GameStateCollection.insert(
     //   {
     //    name: "FishDocument",
     //    content: generatePortableFishList(listOfFish)
     //   });
    // GameStateCollection.update(
    //     {name: "FishDocument"},
    //     // {_id: FishID},
    //     {$set: {content: generatePortableFishList(this.Fishes)}});//this.Fishes} });


    }
  };


  return Ocean;
})();

 ServerOcean = new Ocean();

  // Meteor.call('METHODNAME') points here
  Meteor.methods({

    'step': function(){
      ServerOcean.drawFrame();
    },

      //keydown events
    'LEFTd': function(){
      keyA = true;
       console.log(keyA);
    },
    'RIGHTd': function(){
      keyD = true;
    },
    'UPd': function(){
     keyW = true;
    },
    'DOWNd': function(){
     keyS = true;
    },
    //keyup events
    'LEFTu': function(){
     keyA= false;
    },
    'RIGHTu': function(){
     keyD= false;
    },
    'UPu': function(){
     keyW = false;
    },
    'DOWNu': function(){
     keyS = false;
    }


    // keydown events
    // 'LEFTd': function(){
    //   Players.update({id: Meteor.userId()}, {$set: {LEFT: 1}})
    // },
    // 'RIGHTd': function(){
    //   Players.update({id: Meteor.userId()}, {$set: {RIGHT: 1}})
    // },
    // 'UPd': function(){
    //   Players.update({id: Meteor.userId()}, {$set: {UP: 1}})
    // },
    // 'DOWNd': function(){
    //   Players.update({id: Meteor.userId()}, {$set: {DOWN: 1}})
    // },
    // //keyup events
    // 'LEFTu': function(){
    //   Players.update({id: Meteor.userId()}, {$set: {LEFT: 0}})
    // },
    // 'RIGHTu': function(){
    //   Players.update({id: Meteor.userId()}, {$set: {RIGHT: 0}})
    // },
    // 'UPu': function(){
    //   Players.update({id: Meteor.userId()}, {$set: {UP: 0}})
    // },
    // 'DOWNu': function(){
    //   Players.update({id: Meteor.userId()}, {$set: {DOWN: 0}})
    // }

  })

  // Do this upon a player loggin in for the first time
  // Accounts.onLogin(function(options) {
  //  // if(Players.findOne({id : options.user._id}) === undefined) {
  //  //  // // Add a new player for the new user.
  //  //  // Players.insert({
  //  //  //   id: options.user._id,
  //  //  //   xdir: 0,
  //  //  //   ydir: 0,
  //  //  //   xpos: Math.floor(Math.random()*400),
  //  //  //   ypos: Math.floor(Math.random()*400)
  //  //  // })
  //  // }
  // })

  // GAME LOOP
  // Meteor.setInterval(function() {
  //   var players = Players.find().fetch()
  //   if (players.length > 0){
  //     players.forEach(function(i) {
  //       var speed = 1
  //       // Keep the position within the canvas
  //       var x = (i.xpos < 0) ? 400 : (i.xpos + speed*i.xdir)%400
  //       var y = i.ypos < 0 ? 400 : (i.ypos + speed*i.ydir)%400
  //       Players.update({id: i.id}, {$set: {xpos: x, ypos: y}})
  //     })
  //   }
  // }, 10)
}
