// GAMESQUARE: V1.1 BETA! BY -OWL-

const GameSquare = {
    Viewport: class {
        constructor(canvasID, width, height, scene, create=false) {
            if (create == false) {
                this._canvas = document.getElementById(canvasID) || document.body.appendChild(document.createElement("canvas"))
            } else {
                this._canvas = document.getElementById(canvasID).appendChild(document.createElement("canvas"))
            }
            this._ctx = this._canvas.getContext("2d")
            this.skycolor = "white"
            GameSquare._$ctx = this._ctx
            if (!document.getElementById(canvasID) && (width && height)) {
                this._canvas.width = width
                this._canvas.height = height
            }
            this._currentScene = scene
            this._currentScene.view = this
            let onload = () => {this._currentScene.update()}
            window.onload = onload.bind(this)
        }

        setCurrentScene(scene) {
            this._currentScene.running = false
            this._currentScene = scene
            this._currentScene.view = this
            scene.running = true
            this._currentScene.update()
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

    Object2D: class {
        constructor(config) {
            this.position = config.pos instanceof GameSquare.Vector2 ? config.pos : GameSquare.Vector2.fromObject(config.pos)
            this._parent = null
            if (config.parent) {
                this.parent = config.parent
            }
            this._children = []
            this._updateCalcPos()
            this.componentLoadConfig = {
                thisObj: this,
                addedComponents: [],
                componentData: {
                    updateEvents: []
                }
            }

            this._firstTick = true

            this._eventSystem._o = this
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

        on(event, callback) {
            if (this._eventSystem._callbacks[event]) {
                this._eventSystem._callbacks[event].push(callback)
            } else {
                this._eventSystem._callbacks[event] = []
                this._eventSystem._callbacks[event].push(callback)
            }
        }

        trigger(event) {
            this._eventSystem._t(event)
        }

        _eventSystem = {
            _callbacks: {
                //event: [functions...]
            },
            _t(e) {
                if (!this._callbacks[e]) return
                this._callbacks[e].forEach(event => {
                    event(this._o)
                });
            },
        }

        add(obj) {
            this._children.push(obj)
            if (obj._parent) {
                obj._parent._children.splice(obj._parent._children.indexOf(obj), 1)
            }
            obj._parent = this
        }

        destroy() {
            this._eventSystem._t("destroy")
            this._parent._children.concat(this._children)
            this._parent._children.splice(this._parent._children.indexOf(this), 1)
        }

        update() {
            if (this._parent._firstTick) {
                this._eventSystem._t("init")
            }
            this._updateCalcPos()
            this._eventSystem._t("tick")
            for (const eventName in this._eventSystem._callbacks) {
                if (this._eventSystem._callbacks.hasOwnProperty(eventName)) {
                    if (eventName.split("_")[0] == "keypress" && GameSquare._keysPressed[eventName.split("_")[1]]) {
                        this._eventSystem._t(eventName)
                    }
                }
            }
            this.componentLoadConfig.componentData.updateEvents.forEach((event) => {
                event(this)
            })
            this._children.forEach(child => {
                child.update()
            })
            if (this._parent._firstTick) {
                this._firstTick = false
            }
        }

        _updateCalcPos() {
            if (this._parent) {
                this._calcPos = new GameSquare.Vector2(this.position.x + (this._parent._calcPos ? this._parent._calcPos.x : 0), this.position.y + (this._parent._calcPos ? this._parent._calcPos.y : 0))
            }
        }    
    },

    Component: class {
        constructor(name, obj) {
            this._name = name
            this._loadObj = obj
        }

        static import(component, obj2D) {
            let loaderObj = obj2D.componentLoadConfig
            if (!loaderObj.addedComponents.includes(component._name)) {
                if (component._loadObj.properties) {
                    component._loadObj.properties.forEach((p) => {
                        loaderObj.thisObj[p.name] = p.value
                    })
                }

                if (component._loadObj.methods) {
                    for (const method in component._loadObj.methods) {
                        if (component._loadObj.methods.hasOwnProperty(method)) {
                            const m = component._loadObj.methods[method];
                            loaderObj.thisObj[m.name] = m.bind(loaderObj.thisObj)
                        }
                    }
                }

                if (component._loadObj.ontick) {
                    loaderObj.componentData.updateEvents.push(component._loadObj.ontick)
                }
                loaderObj.addedComponents.push(component._name)
            }
        }
    },
    _keysPressed: {}
}

GameSquare.Scene = class extends GameSquare.Object2D {
    constructor() {
        super({pos: {x: 0, y: 0}})
        delete this.parent
        delete this._parent
        delete this.destroy
        delete this._eventManeger
        delete this.position
        this._onsceneload = () => {}
        this.view = null
        this._running = true
    }

    set onsceneload(v) {
        this._onsceneload = v
    }

    set running(s) {
        if (s) {
            this._onsceneload()
            this._running = true
        } else {
            this._running = false
        }
    }

    get running() {
        return this._running
    }

    update() {
        if (!this.running) return
        GameSquare._$ctx.clearRect(0, 0, GameSquare._$ctx.canvas.width, GameSquare._$ctx.canvas.height)
        GameSquare._$ctx.fillStyle = this.view.skycolor
        GameSquare._$ctx.fillRect(0, 0, GameSquare._$ctx.canvas.width, GameSquare._$ctx.canvas.height)
        GameSquare._$ctx.fillStyle = "black"
        this.componentLoadConfig.componentData.updateEvents.forEach((event) => {
            event(this)
        })
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

    get x() {
        return this.position.x
    }

    get y() {
        return this.position.y
    }

    set x(v) {
        this.position.x = v
    }

    set y(v) {
        this.position.y = v
    }

    _render() {
        this._updateCalcPos()
        GameSquare._$ctx.fillStyle = this.color
        GameSquare._$ctx.fillRect(this._calcPos.x, this._calcPos.y, this.width, this.height)
        GameSquare._$ctx.fillStyle = "black"
    }

    update() {
        if (this._parent._firstTick) {
            this._eventSystem._t("init")
        }
        this._eventSystem._t("tick")
        for (const eventName in this._eventSystem._callbacks) {
            if (this._eventSystem._callbacks.hasOwnProperty(eventName)) {
                if (eventName.split("_")[0] == "keypress" && GameSquare._keysPressed[eventName.split("_")[1]]) {
                    this._eventSystem._t(eventName)
                }
            }
        }
        this._render()

        this.componentLoadConfig.componentData.updateEvents.forEach((event) => {
            event(this)
        })

        this._children.forEach(child => {
            child.update()
        })
        if (this._parent._firstTick) {
            this._firstTick = false
        }
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
        let onimageload = () => {
            self._size = new GameSquare.Vector2(image.width, image.height)
            this._eventSystem._t("load")
        }
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

    set onimageload(e) {
        this._eventManeger._onimageload = e
    }

    static preload(imageSrc, imageName) {
        let image = document.createElement("img")
        image.src = imageSrc
        GameSquare._preloadedFiles[imageName] = image
    }

    _render() {
        this._updateCalcPos()
        GameSquare._$ctx.drawImage(GameSquare._preloadedFiles[this.image], this._calcPos.x, this._calcPos.y, this._size.x, this._size.y)
    }

    update() {
        if (this._parent._firstTick) {
            this._eventSystem._t("init")
        }
        this._eventSystem._t("tick")
        for (const eventName in this._eventSystem._callbacks) {
            if (this._eventSystem._callbacks.hasOwnProperty(eventName)) {
                if (eventName.split("_")[0] == "keypress" && GameSquare._keysPressed[eventName.split("_")[1]]) {
                    this._eventSystem._t(eventName)
                }
            }
        }
        this._render()
        this._children.forEach(child => {
            child.update()
        })

        this._children.forEach(child => {
            child.update()
        })
        if (this._parent._firstTick) {
            this._eventSystem._t("init")
        }
    }

    scaleTo(s = 1) {
        this._size.x = GameSquare._preloadedFiles[this.image].width * s
        this._size.y = GameSquare._preloadedFiles[this.image].height * s
    }
}

GameSquare.Text = class extends GameSquare.Object2D {
    constructor(config) {
        super(config)
        this._text = config.text
        this._color = config.color || "black"
        this._font = config.font || "30px Verdana"
        this._align = config.center || "center"
        this._lineHeight = config.lineHeight || 40
    }

    get text() {
        return this._text
    }

    set text(v) {
        this._text = v
    }

    update() {
        if (this._firstTick) {
            this._eventSystem._t("init")
            this._firstTick = false
        }
        this._eventSystem._t("tick")
        for (const eventName in this._eventSystem._callbacks) {
            if (this._eventSystem._callbacks.hasOwnProperty(eventName)) {
                if (eventName.split("_")[0] == "keypress" && GameSquare._keysPressed[eventName.split("_")[1]]) {
                    this._eventSystem._t(eventName)
                }
            }
        }
        this._render()
        this._children.forEach(child => {
            child.update()
        })

        this._children.forEach(child => {
            child.update()
        })
    }

    _render() {
        this._updateCalcPos()
        GameSquare._$ctx.fillStyle = this._color
        GameSquare._$ctx.font = this._font
        GameSquare._$ctx.textAlign = this._align
        let lines = String(this._text).split(":n")
        let yPos = this._calcPos.y
        lines.forEach(line => {
            GameSquare._$ctx.fillText(line, this._calcPos.x, yPos)
            yPos += this._lineHeight
        })
        GameSquare._$ctx.fillStyle = "black"
    }

    _updateCalcPos() {
        if (this._parent) {
            this._calcPos = new GameSquare.Vector2(this.position.x + (this._parent._calcPos ? this._parent._calcPos.x : 0), this.position.y + (this._parent._calcPos ? this._parent._calcPos.y : 0))
        }
    }
}

window.addEventListener("keydown", (e) => {
    GameSquare._keysPressed[e.key] = true
})
window.addEventListener("keyup", (e) => {
    GameSquare._keysPressed[e.key] = false
})