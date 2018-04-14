
var HelloWorldLayer = cc.Layer.extend({
    sprite:null,
    ctor:function () {
        //////////////////////////////
        // 1. super init first
        this._super();

        /////////////////////////////
        // // 2. add a menu item with "X" image, which is clicked to quit the program
        // //    you may modify it.
        // // ask the window size
        // var size = cc.winSize;
        //
        // /////////////////////////////
        // // 3. add your codes below...
        // // add a label shows "Hello World"
        // // create and initialize a label
        // var helloLabel = new cc.LabelTTF("Hello World", "Arial", 38);
        // // position the label on the center of the screen
        // helloLabel.x = size.width / 2;
        // helloLabel.y = size.height / 2 + 200;
        // // add the label as a child to this layer
        // this.addChild(helloLabel, 5);
        //
        // // add "HelloWorld" splash screen"
        // this.sprite = new cc.Sprite(res.HelloWorld_png);
        // this.sprite.attr({
        //     x: size.width / 2,
        //     y: size.height / 2
        // });
        // this.addChild(this.sprite, 0);

        return true;
    }
});


k_Acceleration = 2;
READY = 1;
START = 2;
OVER = 3;

PIPE_Z = 98;
GROUND_Z = 99;
BIRD_Z = 100;
GAMEOVER_Z = 101;

var FreeFall = cc.ActionInterval.extend( {
    timeElasped:0,
    m_positionDeltaY:null,
    m_startPosition:null,
    m_targetPosition:null,

    ctor:function() {
        cc.ActionInterval.prototype.ctor.call(this);
        this.yOffsetElasped = 0;
        this.timeElasped = 0;
        this.m_positionDeltaY = 0;
        this.m_startPosition = cc.p(0, 0);
        this.m_targetPosition = cc.p(0, 0);
    },

    initWithDuration:function (duration) {
        if (cc.ActionInterval.prototype.initWithDuration.call(this, duration)) {
            return true;
        }
        return false;
    },

    initWithOffset:function(deltaPosition) {
        //自由落体运动计算公式
        var dropTime = Math.sqrt(2.0*Math.abs(deltaPosition)/k_Acceleration) * 0.1;
        //cc.log("dropTime=" + dropTime);
        if (this.initWithDuration(dropTime))
        {
            this.m_positionDeltaY = deltaPosition;
            return true;
        }
        //cc.log("dropTime =" + dropTime + "; deltaPosition=" + deltaPosition);
        return false;
    },

    isDone:function() {
        if (this.m_targetPosition.y >= this._target.getPositionY()) {
            return true;
        }
        return false;
    },


    //Node的runAction函数会调用ActionManager的addAction函数，在ActionManager的addAction函数中会调用Action的startWithTarget，然后在Action类的startWithTarget函数中设置_target的值。
    startWithTarget:function(target) {
        //cc.log("startWithTarget target=" + target);
        cc.ActionInterval.prototype.startWithTarget.call(this, target);
        this.m_startPosition = target.getPosition();
        this.m_targetPosition = cc.p(this.m_startPosition.x, this.m_startPosition.y  - this.m_positionDeltaY);
    },

    update:function(dt) {
        this.timeElasped += dt;
        //cc.log("isdone=" + this.timeElasped);

        if (this._target && !(this.m_targetPosition.y >= this._target.getPositionY())) {
            var yMoveOffset = 0.5 * k_Acceleration * this.timeElasped * this.timeElasped * 0.3;
            if (cc.ENABLE_STACKABLE_ACTIONS) {
                var newPos =  cc.p(this.m_startPosition.x, this.m_startPosition.y - yMoveOffset);
                if (this.m_targetPosition.y > newPos.y) {
                    newPos.y = this.m_targetPosition.y;
                    this._target.stopAction(this);
                }

                this._target.setPosition(newPos);

            } else {
                this._target.setPosition(cc.p(this.m_startPosition.x, this.m_startPosition.y + this.m_positionDeltaY * dt));
            }
        }
    }

});

FreeFall.create = function(deltaPosition) {
    var ff = new FreeFall();
    ff.initWithOffset(deltaPosition);
    return ff;
};



var Helloworld = cc.Layer.extend({
    gameMode:null,
    bgSprite:null,
    groundSprite:null,
    flyBird:null,
    PipeSpriteList:[],

    passTime: 0,
    winSize: 0,
    screenRect:null,
    readyLayer:null,
    score: 0,
    scoreLabel:null,

    ctor:function () {

        cc.log("helloworld init");

        this._super();

        this.PipeSpriteList = [];

        this.winSize = cc.winSize;

        cc.spriteFrameCache.addSpriteFrames(res.flappy_packer,res.flappy_packer_png);
      //  cc.SpriteFrameCache.getInstance().addSpriteFrames(res.flappy_packer);

        this.bgSprite = cc.Sprite.create(res.bg);
        this.bgSprite.setPosition(this.winSize.width / 2, this.winSize.height / 2);
        this.addChild(this.bgSprite, 0);
        cc.log("helloworld init");
        this.initGround();

        this.initReady();

        this.screenRect = cc.rect(0, 0, this.winSize.width, this.winSize.height);


        this.gameMode = READY;
        this.score = 0;

        this.scheduleUpdate();

        this.touchEnabled = true;


        if (this.gameMode == OVER) {
            return;
        }

        if (this.gameMode == READY) {
            this.gameMode = START;
            this.readyLayer.setVisible(false);
            this.initBird();;
        }

        var listener1 = cc.EventListener.create({
            event: cc.EventListener.TOUCH_ONE_BY_ONE,
            swallowTouches: true,
            onTouchBegan: this.onTouchesBegan,
            onTouchMoved: this.onTouchesMoved,
            onTouchEnded: this.onTouchesEnded,
        });

        cc.eventManager.addListener(listener1, this);


        return true;
    },





    update:function(dt) {
        if (this.gameMode != START) {
            return;
        }
        for(var i = 0; i < this.PipeSpriteList.length; ++ i) {
            var pipe = this.PipeSpriteList[i];
            pipe.setPositionX(pipe.getPositionX() - 3);
            if (pipe.getPositionX() < -pipe.getContentSize().width / 2) {
                this.PipeSpriteList.splice(i, 1);
                //cc.log("delete pipe i=" + i);
            }
        }

        this.passTime += 1;
        if(this.passTime >= this.winSize.width / 6) {
            this.addPipe();
            this.passTime = 0;
        }


        this.checkCollision();
    }
});


Helloworld.prototype.onTouchesBegan= function (touches, event) {
    return true
};

Helloworld.prototype.onTouchesMoved=function (touches, event) {

};

Helloworld.prototype.onTouchesEnded=function (touches, event) {
    var target = event.getCurrentTarget()
    if (target.gameMode == OVER) {
        return;
    }

    if (target.gameMode == READY) {
        target.gameMode = START;
        target.readyLayer.setVisible(false);
        target.initBird();
    }

    target.runBirdAction();
};

Helloworld.prototype.initGround = function() {
    cc.log("initGround");
    this.groundSprite = new cc.Sprite(cc.spriteFrameCache.getSpriteFrame(res.ground));
    cc.log("initGround");
    var halfGroundW = this.groundSprite.width;//getContentSize().width;
    var halfGroundH = this.groundSprite.height;
    this.groundSprite.setAnchorPoint(0.5, 0.5);
    this.groundSprite.setPosition(halfGroundW / 2, halfGroundH / 2);
    this.addChild(this.groundSprite, GROUND_Z);

    var action1 = cc.MoveTo.create(0.5, cc.p(halfGroundW / 2 - 120, this.groundSprite.getPositionY()));
    var action2 = cc.MoveTo.create(0, cc.p(halfGroundW / 2, this.groundSprite.getPositionY()));
    var action = cc.Sequence.create(action1, action2);
    this.groundSprite.runAction(cc.RepeatForever.create(action));
};

Helloworld.prototype.initBird = function() {
    //cc.log("initBird");
    var animation = cc.animationCache.getAnimation("FlyBirdAnimation")

    if(!animation) {
        var animFrames = [];
        var str = "";
        var birdFrameCount = 4;
        for (var i = 1; i < birdFrameCount; ++ i) {
            str = "bird" + i + ".png";
            var frame = cc.spriteFrameCache.getSpriteFrame(str);
            animFrames.push(frame);
        }

        var animation = cc.Animation.create(animFrames, 0.05);
        cc.animationCache.addAnimation(animation, "FlyBirdAnimation");
    }

    this.flyBird = new cc.Sprite(res.fly_bird);
    this.flyBird.setAnchorPoint(cc.p(0.5, 0.5));
    this.flyBird.setPosition(this.winSize.width / 2, this.winSize.height / 2);
    this.addChild(this.flyBird, BIRD_Z);
    var actionFrame = cc.Animate.create(animation);
    var flyAction = cc.RepeatForever.create(actionFrame);
    this.flyBird.runAction(cc.RepeatForever.create(flyAction));
};

Helloworld.prototype.initReady = function() {
    this.readyLayer = new cc.Layer();

    var logo = new cc.Sprite(cc.spriteFrameCache.getSpriteFrame(res.logo));
    logo.setAnchorPoint(cc.p(0.5, 0.5));
    logo.setPosition(this.winSize.width / 2, this.winSize.height - logo.getContentSize().height - 50);
    this.readyLayer.addChild(logo);

    var getReady = new cc.Sprite(cc.spriteFrameCache.getSpriteFrame(res.getReady));
    getReady.setAnchorPoint(cc.p(0.5, 0.5));
    getReady.setPosition(this.winSize.width / 2, this.winSize.height / 2 + getReady.getContentSize().height);
    this.readyLayer.addChild(getReady);

    var click = new cc.Sprite(cc.spriteFrameCache.getSpriteFrame(res.click));
    click.setAnchorPoint(cc.p(0.5, 0.5));
    click.setPosition(this.winSize.width / 2, getReady.getPositionY() - getReady.getContentSize().height / 2 - click.getContentSize().height / 2);
    this.readyLayer.addChild(click);

    this.addChild(this.readyLayer);
};

Helloworld.prototype.runBirdAction = function () {
    var riseHeight = 50;
    var birdX = this.flyBird.getPositionX();
    var birdY = this.flyBird.getPositionY();

    var bottomY = this.groundSprite.getContentSize().height - this.flyBird.getContentSize().height / 2;



    var actionFrame = cc.Animate.create(cc.animationCache.getAnimation("FlyBirdAnimation"));
    var flyAction = cc.RepeatForever.create(actionFrame);

//上升动画
    var riseMoveAction = cc.MoveTo.create(0.2, cc.p(birdX, birdY + riseHeight));
    var riseRotateAction = cc.RotateTo.create(0, -30);
    var riseAction = cc.Spawn.create(riseMoveAction, riseRotateAction);

//下落动画
//模拟自由落体运动
    var fallMoveAction = FreeFall.create(birdY - bottomY);
    var fallRotateAction =cc.RotateTo.create(0, 30);
    var fallAction = cc.Spawn.create(fallMoveAction, fallRotateAction);

    this.flyBird.stopAllActions();
    this.flyBird.runAction(flyAction);
    this.flyBird.runAction(cc.Spawn.create(
        cc.Sequence.create(riseAction, fallAction) )
    );
};


Helloworld.prototype.addPipe = function () {
    cc.log("addPipe");
    var ccSpriteDown = new cc.Sprite(cc.spriteFrameCache.getSpriteFrame(res.holdback1));

    var pipeHeight = ccSpriteDown.getContentSize().height;
    var pipeWidth = ccSpriteDown.getContentSize().width;
    var groundHeight = this.groundSprite.getContentSize().height;

    //小鸟飞行区间高度
    var acrossHeight = 300;
    var downPipeHeight = 100 + getRandom(400);
    // cc.log("downPipeHeight=" + downPipeHeight);
    var upPipeHeight = this.winSize.height - downPipeHeight - acrossHeight - groundHeight;

    var PipeX = this.winSize.width + pipeWidth / 2;

    ccSpriteDown.setZOrder(1);
    ccSpriteDown.setAnchorPoint(cc.p(0.5, 0.5));
    ccSpriteDown.setPosition(cc.p(PipeX + pipeWidth / 2, groundHeight + pipeHeight / 2 - (pipeHeight - downPipeHeight)));

    var ccSpriteUp = new cc.Sprite(cc.spriteFrameCache.getSpriteFrame(res.holdback2));
    ccSpriteUp.setZOrder(1);
    ccSpriteUp.setAnchorPoint(cc.p(0.5, 0.5));
    ccSpriteUp.setPosition(cc.p(PipeX + pipeWidth / 2, this.winSize.height + (pipeHeight- upPipeHeight) - pipeHeight / 2));

    this.addChild(ccSpriteDown, PIPE_Z);
    this.addChild(ccSpriteUp, PIPE_Z);

    this.PipeSpriteList.push(ccSpriteDown);
    this.PipeSpriteList.push(ccSpriteUp);

    this.score += 1;
};

Helloworld.prototype.getRect = function(a) {
    var pos = a.getPosition();
    var content = a.getContentSize();
    return cc.rect(pos.x - content.width / 2, pos.y - content.height / 2, content.width, content.height);
};

Helloworld.prototype.collide = function (a, b) {
    var aRect = this.getRect(a);
    var bRect = this.getRect(b);
    return cc.rectIntersectsRect(aRect, bRect);
};

Helloworld.prototype.showGameOver = function () {

   // var userDefault = cc.UserDefault
    var oldScore = 10//userDefault.getIntegerForKey("score");
    var maxScore = 0;
    if(this.score > oldScore) {
        maxScore = this.score;
      //  userDefault.setIntegerForKey("score", maxScore);
    }else {
        maxScore = oldScore;
    }

    var gameOverLayer = cc.Layer.create();
    cc.log("gameover=" + res.gameover);
    var gameOver = new cc.Sprite(cc.spriteFrameCache.getSpriteFrame(res.gameover));
    gameOver.setAnchorPoint(cc.p(0.5, 0.5));
    gameOver.setPosition(this.winSize.width / 2, this.winSize.height - gameOver.getContentSize().height / 2 - 150);
    gameOverLayer.addChild(gameOver);

    var scorePanel = new cc.Sprite(cc.spriteFrameCache.getSpriteFrame(res.scorePanel));
    scorePanel.setAnchorPoint(cc.p(0.5, 0.5));
    scorePanel.setPosition(gameOver.getPositionX(), gameOver.getPositionY() - gameOver.getContentSize().height / 2 - scorePanel.getContentSize().height / 2 - 60);
    gameOverLayer.addChild(scorePanel);

    if(this.score > oldScore) {
        var gold = new cc.Sprite(cc.spriteFrameCache.getSpriteFrame(res.gold));
        gold.setAnchorPoint(cc.p(0.5, 0.5));
        gold.setPosition(68 + gold.getContentSize().width / 2, 72 + gold.getContentSize().height / 2);
        scorePanel.addChild(gold);
    }else {
        var gray = new cc.Sprite(cc.spriteFrameCache.getSpriteFrame(res.gray));
        gray.setAnchorPoint(cc.p(0.5, 0.5));
        gray.setPosition(68 + gray.getContentSize().width / 2, 72 + gray.getContentSize().height / 2);
        scorePanel.addChild(gray);
    }

    var newScoreLabel = cc.LabelAtlas.create(this.score, res.number, 22, 28, '0');
    newScoreLabel.setAnchorPoint(cc.p(0.5, 0.5));
    newScoreLabel.setScale(1.2);
    newScoreLabel.setPosition(scorePanel.getContentSize().width - newScoreLabel.getContentSize().width - 90, newScoreLabel.getContentSize().height / 2 + 180);
    scorePanel.addChild(newScoreLabel);

    var maxScoreLabel = cc.LabelAtlas.create(maxScore, res.number, 22, 28, '0');
    maxScoreLabel.setAnchorPoint(cc.p(0.5, 0.5));
    maxScoreLabel.setScale(1.2);
    maxScoreLabel.setPosition(newScoreLabel.getPositionX(), maxScoreLabel.getContentSize().height / 2 + 75);
    scorePanel.addChild(maxScoreLabel);

    var start = cc.Sprite.createWithSpriteFrameName(res.start);
    var startMenuItem = cc.MenuItemSprite.create(start, null, null, this.restartGame, this);
    var startMenu = cc.Menu.create(startMenuItem);

    startMenu.setAnchorPoint(cc.p(0.5, 0.5));
    startMenu.setPosition(this.winSize.width / 2 , scorePanel.getPositionY() - scorePanel.getContentSize().height / 2 - start.getContentSize().height / 2 - 60);
    gameOverLayer.addChild(startMenu);

    this.addChild(gameOverLayer, GAMEOVER_Z);
};

Helloworld.prototype.restartGame = function() {
    var scene = cc.Scene.create();
    scene.addChild(Helloworld.create());
    cc.Director.getInstance().replaceScene(cc.TransitionFade.create(1.2, scene));
};

Helloworld.prototype.birdFallAction = function () {
    this.gameMode = OVER;
    this.flyBird.stopAllActions();
    this.groundSprite.stopAllActions();
    var birdX = this.flyBird.getPositionX();
    var birdY = this.flyBird.getPositionY();

    var bottomY = this.groundSprite.getContentSize().height + this.flyBird.getContentSize().width / 2;
    var fallMoveAction = FreeFall.create(birdY - bottomY);
    var fallRotateAction =cc.RotateTo.create(0, 90);
    var fallAction = cc.Spawn.create(fallMoveAction, fallRotateAction);

    this.flyBird.runAction(cc.Sequence.create(cc.DelayTime.create(0.1),
        fallAction)
    );

    this.runAction(cc.Sequence.create(cc.DelayTime.create(1.0),
        cc.CallFunc.create(this.showGameOver, this))
    );
}

Helloworld.prototype.checkCollision = function () {
    if (this.collide(this.flyBird, this.groundSprite)) {
        //cc.log("hit floor");
        this.birdFallAction();
        return;
    }

    for (var i = 0; i < this.PipeSpriteList.length; i++) {
        var pipe = this.PipeSpriteList[i];
        if (this.collide(this.flyBird, pipe)) {
            cc.log("hit pipe i=" + i);
            this.birdFallAction();
            break;
        }
    }
}



var HelloWorldScene = cc.Scene.extend({
    onEnter:function () {
        this._super();
        var layer = new Helloworld();
        this.addChild(layer);
    }
});

function getRandom(maxSize) {
    return Math.floor(Math.random() * maxSize) % maxSize;
}