// VEIWPORT
const mainScene = new GameSquare.Scene()
const veiwport = new GameSquare.ViewPort("", 500, 500, mainScene)

// IMAGES
GameSquare.Image.preload("smiley.png", "emojiHappy")
GameSquare.Image.preload("suprized.jpg", "emojiSuprized")

// OBJECTS
var happyFace = new GameSquare.Image({pos: {x: 10, y: 10}, imgName: "emojiSuprized"})
//happyFace.scaleTo(0.5)
mainScene.add(happyFace)