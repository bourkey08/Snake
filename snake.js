//Define global settings, these can be changed to vary the difficulty of the game
var growthfactor = 10;
var targetframerate = 20;

//Define global variables for tracking the status of the game board
var timer = 0;//Timer is used to work out fps
var frame = 0;//Frame counter, allows us to only preform some actions every n frames(eg calculating fps)
var fps = 0;//Current frame rate

//Define game board variables
var blocks = new Uint32Array(8192);//Will contain a list of snake blocks, first 16 bits is x last 16 bits is y
var head=0;//Position of the snake head in the array of blocks
var length = 5;//Length of the snake(any blocks out of this range are assumed to be unused)
var direction=0;//Direction the snake is headed in 0-3, up, right, down, left
var Food = 0;//Position of the food the snake needs to try to retreive
var GameLost = true;
var remaininggrowth = 0;//This allows us to grow smoothly when we eat food, rather than having multiple blocks suddenly spawn

//This is the main game loop, this is called 60 times per second and processes game updates
function gametick(){     
    //We need to define a variable that allows us to track how long executing this function took to allow us to set the correct delay for recalling
    const starttime = performance.now();
    
    if (!GameLost){
        frame += 1;

        //Preform game logic
        //Move the snake 1 block in the direction it is traveling
        let headcords = unpackxy(blocks[head]);
        let newpos = [];

        switch (direction){

            case 0://Up
                newpos = [headcords[0], headcords[1] - 1];
                break;

            case 1://Right
                newpos = [headcords[0] + 1, headcords[1]];
                break;

            case 2://Down
                newpos = [headcords[0], headcords[1] + 1];
                break;

            case 3://Left
                newpos = [headcords[0] - 1, headcords[1]];
                break;
        }

        const packednewpos = packxy(newpos[0], newpos[1]);

        //First, check if newpos is out of bounds
        if (newpos[0] < 0 || newpos[0] >= 120 || newpos[1] < 0 || newpos[1] >= 117){
            GameOver();
            return 0;

        } else if(CheckForCollision(packednewpos)) {//Else check if we have hit our tail
            GameOver();
            return 0;

        } else if (packednewpos == Food){//Check if we have hit food
            //Generate a new value for food
            Food = packxy(10 + Math.round(Math.random() * 100), 10 + Math.round(Math.random() * 100));
            
            //Ensure the new value for food is not within the snake, if it is keep generating new values until one is not(as there are more positions on the board than the max snake length this will never be an infinite loop)
            while (CheckForCollision(Food)){
                Food = packxy(10 + Math.round(Math.random() * 100), 10 + Math.round(Math.random() * 100));
            }
            
            //Increment remaininggrowth by growth factor
            remaininggrowth += growthfactor;        
        }

        //If remaining growth is > 0, grow the snake by 1 as long as the snakes length is under 8192, otherwise just clear remaining growth
        if (remaininggrowth > 0){
            if (length >= 8192){
                remaininggrowth = 0;

            } else {
                remaininggrowth -= 1;
                length += 1;
            }
        }
        
        //Update the value of head
        head += 1;
        
        if (head >= 8192){
            head = 0;
        }   
        
        //Add the new entry to blocks and update the head position
        blocks[head] = packednewpos;        
        
        //Once every 15 frames(4 times per second) recalculate the fps
        if (frame % 15 == 0){
            fps = Math.round(1000 / (performance.now() - timer));
        }

        //Draw the updated frame
        //Clear the canvas prior to updating
        ctx.clearRect(0, 0, 500, 500);

        //And now update the canvas
        //First lets update the text at the top
        ctx.fillStyle = "#000000";
        ctx.font = "12px Arial";
        ctx.fillText('FPS: ' + fps, 20, 10);
        ctx.fillText('Length: ' + length, 410, 10);

        //Draw the game boards border
        ctx.moveTo(10, 20);
        ctx.lineTo(490, 20);
        ctx.lineTo(490, 490);
        ctx.lineTo(10, 490);
        ctx.lineTo(10, 20);
        ctx.stroke();
        
        //Now draw the snake        
        for (let i=head - length; i<=head; i++){
            let cords = [];

            //Wrap array around
            if (i<0){
                cords = unpackxy(blocks[i + 8192]);
            } else {
                cords = unpackxy(blocks[i]);
            }

            //console.log(cords)
            ctx.fillRect((cords[0]*4) + 10, (cords[1]*4) + 20, 4, 4);
        }
        
        //And finally draw the food
        const fcords = unpackxy(Food);
        
        ctx.fillStyle = "#ff0000";
        ctx.fillRect((fcords[0]*4) + 10, (fcords[1]*4) + 20, 4, 4);
        
        //If this is the 60th frame, reset frame counter
        if (frame == 60){
            frame=0;
        }

        timer = performance.now();    
    
        //Set this function to be recalled when its time to draw the next frame, the delay is 1000/desired frame rate - execution time of this function
        window.requestAnimationFrame(function(){
            window.setTimeout(gametick, 1000/targetframerate - (performance.now() - starttime));
        });
    }
}

//Maps x,y to 32bit int
function unpackxy(val){
    return [val >> 16, (val % 0xffff) - (val >> 16)];
}

//Maps 32bit int to x, y
function packxy(x,y){
    return (x << 16) + y;
}

//Check for collision, iterates over the current snake and checks if the new position of the head will hit the snake
function CheckForCollision(newpos){
    for (let i=head - length; i<=head; i++){
        let cords = 0;

        //Wrap array around
        if (i<0){
            cords = blocks[i + 8192];
        } else {
            cords = blocks[i];
        }
        
        if (newpos == cords){
            return true;
        }
    }
    
    //Default to returning false
    return false;
}

//Called when the user presses space to start a new game
function StartGame(){
    //Initilize food to a random starting value and set the snake to its default position
    Food = packxy(10 + Math.round(Math.random() * 100), 10 + Math.round(Math.random() * 100));
    
    //Reset the snake to its default state
    head=4;
    length = 1;
    direction=1;
    remaininggrowth = 9;
    
    //Reset all blocks to 0
    for (let i=0; i<8192; i++){
        blocks[i] = 0;
    }
    
    //Add the default snake blocks in
    blocks[0] = packxy(50, 50);
    blocks[1] = packxy(50, 51);
    blocks[2] = packxy(50, 52);
    blocks[3] = packxy(50, 53);
    blocks[4] = packxy(50, 54);
    
    //Only call game tick if the value of Gamelost is true, this is to prevent multiple game loops running in parallel
    if (GameLost){
        //Set the game back to not lost/in progress
        GameLost = false;

        //Call gametick to start the game loop
        gametick();
    }
}

//Called when the game is ended, displays the users final score and gives them the option to play again
function GameOver(){
    ctx.clearRect(0, 0, 500, 500);
    ctx.fillStyle = "#000000";
    
    ctx.font = "30px Arial";
    ctx.fillText('Game Over', 160, 220);
    if (length > 1000){
        ctx.fillText('Score: ' + length, 140, 250);
        
    } else if (length > 100){
        ctx.fillText('Score: ' + length, 160, 250);
        
    } else {
        ctx.fillText('Score: ' + length, 180, 250);
    }
    
    ctx.font = "16px Arial";
    ctx.fillText('Press space to try again',150, 270);
    
    //Set global variable to indicate the game has been lost
    GameLost = true;
    
    //Draw the game boards border
    ctx.moveTo(10, 20);
    ctx.lineTo(490, 20);
    ctx.lineTo(490, 490);
    ctx.lineTo(10, 490);
    ctx.lineTo(10, 20);
    ctx.stroke(); 
}

//Display the pre game welcome screen
function DrawWelcome(){
    ctx.font = "30px Arial";
    ctx.fillText('Press space to begin', 100, 240);
    
    ctx.font = "16px Arial";
    ctx.fillText('Use the arrow keys to change direction', 100, 270);            
}

//Called when application/page is first launched
function main(){
    //Define a function that will be called whenever a key is pressed, this will allow us to change the direction of the snake when the user persses one of the arrow keys
    document.onkeydown = function(e){
        switch (e.keyCode){
            case 32://Space
                StartGame();
                break;
                
            case 38://Up
                if (direction != 2){ 
                    direction = 0;
                }
                break;
            
            case 39://Right
                if (direction != 3){ 
                    direction=1;
                }
                break;
                
            case 40://Down
                if (direction != 0){ 
                    direction=2;
                }
                break;
                
            case 37://Left
                if (direction != 1){ 
                    direction=3;
                }
                break;
                
            default:
                break;
        }
    }
    
    //Draw the initial welcome screen
    DrawWelcome();
}