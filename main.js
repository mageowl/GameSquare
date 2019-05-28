
const GameSquare = {
    ViewPort: class {
        constructor(canvasID, width, height, scene) {
            this._canvas = document.getElementById(canvasID) || document.body.appendChild(document.createElement("canvas"))
            this._ctx = this._canvas.getContext("2d")
            this.skycolor = "white"
            GameSquare._$ctx = this._ctx
            if (!document.getElementById(canvasID)) {
                this._canvas.width = width
                this._canvas.height = height
            }
            this._currentScene = scene
            this._currentScene.view = this
            let onload = () => {this._currentScene.update()}
            onload.bind(this)
            window.onload = onload
        }
    },

    Vector2: class {
        constructor(x = 0, y = 0) {
            this.x = x
            this.y = y
        }

        static add(v1, v2) {
            return new GameSquare.Vector2(v1.x + v2.x, v1.y + v2.y)
        }

        static subtract(v1, v2) {
            return new GameSquare.Vector2(v1.x - v2.x, v1.y - v2.y)
        }

        static multiply(v1, v2) {
            return new GameSquare.Vector2(v1.x * v2.x, v1.y * v2.y)
        }

        static fromObject(obj) {
            return new GameSquare.Vector2(obj.x, obj.y)
        }
    },

    EventManeger: class {
        constructor(object) {
            this.ontick = new Function().bind(object)
            this.ondestroy = () => {}
        }
    },

    Object2D: class {
        constructor(config) {
            this.position = config.pos instanceof GameSquare.Vector2 ? config.pos : GameSquare.Vector2.fromObject(config.pos)
            this._parent = config.parent || null
            this._children = []
            this._eventManeger = new GameSquare.EventManeger(this)
            this._updateCalcPos()
            this._componenetLoadConfig = {
                thisObj: this,
                addedComponenets: [],
                updateEvents: []
            }
        }

        set parent(obj) {
            obj.add(this)
        }

        get parent() {
            return this._parent
        }

        get children() {
            return this._children
        }

        set ontick(f) {
            this._eventManeger.ontick = f.bind(this, this)
        }

        set ondestroy(f) {
            this._eventManeger.ondestroy = f
        }

        add(obj) {
            this._children.push(obj)
            if (obj._parent) {
                obj._parent._children.splice(obj._parent._children.indexOf(obj), 1)
            }
            obj._parent = this
        }

        destroy() {
            this._eventManeger.ondestroy()
            this._parent._children.concat(this._children)
            this._parent._children.splice(this._parent._children.indexOf(this), 1)
        }

        update() {
            this._updateCalcPos()
            this._eventManeger.ontick()
            this._componenetLoadConfig.updateEvents.forEach((event) => {
                event(this)
            })
            this._children.forEach(child => {
                child.update()
            })
        }

        _updateCalcPos() {
            if (this._parent) {
                this._calcPos = new GameSquare.Vector2(this.position.x + (this._parent._calcPos ? this._parent._calcPos.x : 0), this.position.y + (this._parent._calcPos ? this._parent._calcPos.y : 0))
            }
        }    
    },

    Componenet: class {
        constructor(name, obj) {
            this._name = name
            this._loadObj = obj
        }

        static import(componenet, loaderObj) {
            if (loaderObj.addedComponenets.includes(componenet._name)) {
                if (componenet._loadObj.properties) {
                    componenet._loadObj.properties.forEach((p) => {
                        loaderObj.thisObj[p.name] = p.value
                    })
                }
                if (componenet._loadObj.ontick) {
                    loaderObj.updateEvents.push(componenet._loadObj.ontick)
                }
                loaderObj.addedComponenets.push(componenet._name)
            }
        }
    }
}

GameSquare.Scene = class extends GameSquare.Object2D {
    constructor() {
        super({pos: {x: 0, y: 0}})
        delete this.parent
        delete this._parent
        delete this.destroy
        delete this._eventManeger
        delete this.position
        this.view = null
    }

    update() {
        GameSquare._$ctx.clearRect(0, 0, GameSquare._$ctx.canvas.width, GameSquare._$ctx.canvas.height)
        GameSquare._$ctx.fillStyle = this.view.skycolor
        GameSquare._$ctx.fillRect(0, 0, GameSquare._$ctx.canvas.width, GameSquare._$ctx.canvas.height)
        GameSquare._$ctx.fillStyle = "black"
        this._children.forEach(child => {
            child.update()
        })
        requestAnimationFrame(this.update.bind(this))
    }

    kill() {
        this.update = null
    }
}

GameSquare.Rectangle = class extends GameSquare.Object2D {
    constructor(config) {
        super(config)
        this._size = config.size instanceof GameSquare.Vector2 ? config.size : new GameSquare.Vector2(config.size.width, config.size.height)
        this.color = config.color || "black"
        this._updateCalcPos()
    }

    get width() {
        return this._size.x
    }

    get height() {
        return this._size.y
    }

    set width(v) {
        this._size.x = v
    }

    set height(v) {
        this._size.y = v
    }

    _updateCalcPos() {
        if (this._parent) {
            this._calcPos = new GameSquare.Vector2(this.position.x + (this._parent._calcPos ? this._parent._calcPos.x : 0), this.position.y + (this._parent._calcPos ? this._parent._calcPos.y : 0))
        }
    }

    _render() {
        this._updateCalcPos()
        GameSquare._$ctx.fillStyle = this.color
        GameSquare._$ctx.fillRect(this._calcPos.x, this._calcPos.y, this.width, this.height)
        GameSquare._$ctx.fillStyle = "black"
    }

    update() {
        this._eventManeger.ontick()
        this._render()

        this._children.forEach(child => {
            child.update()
        })
    }

    static collisionSide(shapeA, shapeB) {
        // get the vectors to check against
        var vX = (shapeA.position.x + (shapeA.width / 2)) - (shapeB.position.x + (shapeB.width / 2)),
            vY = (shapeA.position.y + (shapeA.height / 2)) - (shapeB.position.y + (shapeB.height / 2)),
            // add the half widths and half heights of the objects
            hWidths = (shapeA.width / 2) + (shapeB.width / 2),
            hHeights = (shapeA.height / 2) + (shapeB.height / 2),
            colDir = null
        
        // if the x and y vector are less than the half width or half height, they we must be inside the object, causing a collision
        if (Math.abs(vX) < hWidths && Math.abs(vY) < hHeights) { 
            // figures out on which side we are colliding (top, bottom, left, or right)         
            var oX = hWidths - Math.abs(vX),
                oY = hHeights - Math.abs(vY)
            if (oX >= oY) {
                if (vY > 0) {
                    colDir = "top"
                } else {
                    colDir = "bottom"
                }
            } else {
                if (vX > 0) {
                    colDir = "left"
                } else {
                    colDir = "right"
                }
            }
        }
        return colDir
    }
}

GameSquare._preloadedFiles = {}

GameSquare.Image = class extends GameSquare.Object2D {
    constructor(config) {
        super(config)
        this.image = config.imgName
        let image = GameSquare._preloadedFiles[this.image]
        let self = this
        let onimageload = () => {self._size = new GameSquare.Vector2(image.width, image.height)}
        image.onload = onimageload
        this._updateCalcPos()
    }

    get width() {
        return this._size.x
    }

    get height() {
        return this._size.y
    }

    set width(v) {
        this._size.x = v
    }

    set height(v) {
        this._size.y = v
    }

    static preload(imageSrc, imageName) {
        let image = document.createElement("img")
        image.src = imageSrc
        GameSquare._preloadedFiles[imageName] = image
    }

    _updateCalcPos() {
        if (this._parent) {
            this._calcPos = new GameSquare.Vector2(this.position.x + (this._parent._calcPos ? this._parent._calcPos.x : 0), this.position.y + (this._parent._calcPos ? this._parent._calcPos.y : 0))
        }
    }

    _render() {
        this._updateCalcPos()
        GameSquare._$ctx.drawImage(GameSquare._preloadedFiles[this.image], this._calcPos.x, this._calcPos.y, this._size.x, this._size.y)
    }

    update() {
        this._eventManeger.ontick()
        this._render()

        this._children.forEach(child => {
            child.update()
        })
    }

    scaleTo(s = 1) {
        this._size.x = GameSquare._preloadedFiles[this.image].width * s
        this._size.y = GameSquare._preloadedFiles[this.image].height * s
    }
}