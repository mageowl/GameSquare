// VEIWPORT
const mainScene = new GameSquare.Scene()
const veiwport = new GameSquare.Viewport("", 500, 500, mainScene)

// IMAGES


// OBJECTS
let playerSquare = new GameSquare.Rectangle({
    pos: {x:10,y:10},
    size: {width:10,height:10},
    color: "red"
})
mainScene.add(playerSquare)

// LOGIC
playerSquare.on("keypress_ArrowRight", (p) => {
    p.x += 5
})
playerSquare.on("keypress_ArrowLeft", (p) => {
    p.x -= 5
})
playerSquare.on("keypress_ArrowUp", (p) => {
    p.y -= 5
})
playerSquare.on("keypress_ArrowDown", (p) => {
    p.y += 5
})