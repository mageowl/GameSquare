// VEIWPORT
const mainScene = new GameSquare.Scene()
const veiwport = new GameSquare.Viewport("", 500, 500, mainScene)

// IMAGES


// OBJECTS
let playerSquare = new GameSquare.Rectangle({
    pos: {x:10,y:10},
    size: {width:50,height:50},
    color: "red"
})
mainScene.add(playerSquare)

// LOGIC
playerSquare.on("keypress_ArrowRight", (p) => {
    p.x += 10
})