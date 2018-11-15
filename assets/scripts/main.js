var width = window.innerWidth;
var height = window.innerHeight;
//创建游戏实例
var game = new Phaser.Game(width, height, Phaser.AUTO, 'content');
var timeText;
var scoreText;
var score = 0;
var timesAfter;
var timesBefore;
// 定义场景
var states = {
    //加载场景
    preload: function () {
        this.preload = function () {
            // 设置背景为黑色
            game.stage.backgroundColor = '#000000';
            // 加载游戏资源
            game.load.image('score', 'assets/images/score1.png');
            game.load.image('arrow', 'assets/images/arrow1.png');
            game.load.image('ball', 'assets/images/ball1.png');
            game.load.image('keeper', 'assets/images/keeper1.png');
            game.load.image('goal', 'assets/images/goal1.png');
            game.load.image('bg', 'assets/images/bg3.jpg');
            game.load.audio('bgMusic', 'assets/music/backMusic.mp3');
            game.load.audio('football', 'assets/music/football1.mp3');
            game.load.audio('happy', 'assets/music/happy.mp3');
            game.load.audio('overtime', 'assets/music/overtime.mp3');
            // 添加进度文字
            var progressText = game.add.text(game.world.centerX, game.world.centerY, '0%', {
                fontSize: '60px',
                fill: '#ffffff'
            });
            progressText.anchor.setTo(0.5, 0.5);
            // 监听加载完一个文件的事件
            game.load.onFileComplete.add(function (progress) {
                progressText.text = progress + '%';
            });
            // 监听加载完毕事件
            game.load.onLoadComplete.add(onLoad);
            // 最小展示时间，示例为3秒
            var deadLine = false;
            setTimeout(function () {
                deadLine = true;
            }, 1000);
            // 加载完毕回调方法
            function onLoad() {
                if (deadLine) {
                    // 已到达最小展示时间，可以进入下一个场景
                    game.state.start('created');
                } else {
                    // 还没有到最小展示时间，1秒后重试
                    setTimeout(onLoad, 1000);
                }
            }
        }
    },
    // 开始场景
    created: function () {
        this.create = function () {
            var bg = game.add.sprite(0, 0, 'bg');
            bg.width = game.world.width;
            bg.height = game.world.height;
            // 添加提示
            var remind = game.add.text(game.world.centerX, game.world.centerY, '点击任意位置开始', {
                fontSize: '20px',
                fill: '#aa6767'
            });
            remind.anchor.setTo(0.5, 0.5);
            // 添加点击事件
            game.input.onTap.add(function () {
                game.state.start('play');
            });
        }
    },
    //游戏场景
    play: function () {
        var arrow;
        var keeper;
        var ball;
        var goal;
        var platforms;
        var nextFire = 0;
        var fireRate = 100;
        var tween;
        var bgMusic;
        var footballMusic;
        var happyMusic;
        var overtime;
        this.create = function () {
            var bg = game.add.sprite(0, 0, 'bg');
            bg.width = game.world.width;
            bg.height = game.world.height;
            // 添加背景音乐
            bgMusic = game.add.audio('bgMusic');
            bgMusic.play();
            // 缓存其他音乐
            footballMusic = game.add.audio('football');
            happyMusic = game.add.audio('happy');
            overtime = game.add.audio('overtime');
            //60秒后游戏结束
            game.time.events.add(Phaser.Timer.SECOND * 60, function () {
                happyMusic.play();
                game.state.start('gameOver');
            }, this);

            //得分
            scoreText = game.add.text(16, 16, 'score: 0', {
                fontSize: '32px',
                fill: '#000'
            });
            //计时
            timeText = game.add.text(width - 120, 22, 'Time: ', {
                fontSize: '20px',
                fill: '#000'
            })
            //开启物理引擎
            game.physics.startSystem(Phaser.Physics.ARCADE);

            goal = game.add.sprite((width / 2 - 160), height / 5, 'goal');
            keeper = game.add.sprite(0, (height / 5 + 45), 'keeper');
            ball = game.add.sprite((width / 2 - 25), (height - 70), 'ball');
            arrow = game.add.sprite((width / 2 - 20), (height - 100), 'arrow');



            tween = game.add.tween(keeper).to({
                x: width - 80
            }, 2000, Phaser.Easing.Quadratic.InOut, true, 0, 1000, true);
            // getRandomIntInclusive(1,3)




            //建一个合并、回收、检测碰撞的容器
            platforms = game.add.group();
            //设置放进容器里的元素都可以继承容器的属性
            platforms.enableBody = true;
            platforms.physicsBodyType = Phaser.Physics.ARCADE;

            platforms.createMultiple(1, 'ball');


            platforms.setAll('checkWorldBounds', true);
            platforms.setAll('outOfBoundsKill', true);

            game.physics.enable([arrow, ball, goal, keeper], Phaser.Physics.ARCADE);
            goal.body.immovable = true; //固定不动

            arrow.anchor.set(0.5);
            arrow.body.allowRotation = true;

            bullet = platforms.getFirstDead();

        }
        this.update = function () {
            arrow.rotation = game.physics.arcade.angleToPointer(arrow);
            timesAfter = game.time.time;
            if (game.input.activePointer.isDown) {
                fire()
            }
            if (timesAfter - 2000> timesBefore) {
                tween.resume()
            }

            //collide 元素碰撞时会产生一个物理碰撞的效果 overlap不会产生碰撞的效果
            game.physics.arcade.collide(platforms, goal, collisionHandler);
            game.physics.arcade.overlap(platforms, keeper, function (player, veg) {
                bullet.reset(arrow.x - 8, arrow.y - 8);
                bullet.body.bounce.y = 2;
                bullet.body.bounce.x = 2;
                bullet.body.gravity.y = -100;

                overtime.play();
              
                veg.kill();
              
            });
            getScore();
        }

        function getScore() {
            var item, t = game.time.events.duration.toString();
            if (t.length === 5) {
                item = t.substr(0, 2)
            } else if (t.length === 4) {
                item = t.substr(0, 1)
            } else {
                item = 0;
            }
            timeText.text = "Time: " + item;
        }

        function collisionHandler(player, veg) {
            footballMusic.play();
            inGoal();
            setTimeout(function () {
                veg.kill();
            }, 200)
            score += 10;
            scoreText.text = 'Score: ' + score;
            if (score === 30 || score === 50 || score === 80) {
                happyMusic.play();
            }
        }

        function fire() {
            tween.pause()
            if (game.time.now > nextFire && platforms.countDead() > 0) {
                timesBefore = game.time.time;
                nextFire = game.time.now + fireRate;
               
                bullet.reset(arrow.x - 8, arrow.y - 8);
                //设置弹跳、重力
                bullet.body.bounce.y = 1;
                bullet.body.bounce.x = 1;
                bullet.body.gravity.y = -100;
                game.physics.arcade.moveToPointer(bullet, 300);

               
                if (arrow.angle < 0 && arrow.angle >= -60) {
               
                    keeper.body.velocity.x = 5; //给设一个向右的速度
                    game.add.tween(keeper).to({
                        x: width - 120
                    }, 300, "Linear", true); //右移动的动画
                    setTimeout(function () {
                        keeper.body.velocity.x = 0;
                    }, 300)
                } else if (arrow.angle < -60 && arrow.angle > -90) {
                   
                    keeper.body.velocity.x = 5;
                    game.add.tween(keeper).to({
                        x: width / 2 + 30
                    }, 300, "Linear", true);

                } else if (arrow.angle <= -90 && arrow.angle > -105) {
                  
                    keeper.body.velocity.x = -5;
                    game.add.tween(keeper).to({
                        x: width / 4 + 42
                    }, 300, "Linear", true);

                } else if (arrow.angle <= -105 && arrow.angle >= -180) {
        
                    keeper.body.velocity.x = -5;
                    game.add.tween(keeper).to({
                        x: 0
                    }, 300, "Linear", true);
                } else {
                   
                    game.add.tween(keeper).to({
                        x: width / 2 - 42
                    }, 300, "Linear", true);
                }
                setTimeout(function () {
                    keeper.body.velocity.x = 0;
                }, 300);
            }

        }

        function inGoal() {
            var grade = game.add.image(width / 2, (height - 120), 'score');
            grade.alpha = 0;

            // 添加过渡效果 得分
            var showTween = game.add.tween(grade).to({
                alpha: 1,
                y: grade.y - 20
            }, 300, Phaser.Easing.Linear.None, true, 0, 0, false);
            showTween.onComplete.add(function () {
                var hideTween = game.add.tween(grade).to({
                    alpha: 0,
                    y: grade.y - 20
                }, 300, Phaser.Easing.Linear.None, true, 200, 0, false);
                hideTween.onComplete.add(function () {
                    grade.kill();
                });
            });
        }

        //得到一个两数之间的随机整数，包括两个数在内
        function getRandomIntInclusive(min, max) {
            min = Math.ceil(min);
            max = Math.floor(max);
            return Math.floor(Math.random() * (max - min + 1)) + min;
        }
    },
    gameOver: function () {

        this.create = function () {
            var bg = game.add.image(0, 0, 'bg');
            bg.width = game.world.width;
            bg.height = game.world.height;
            // 添加文本
            var title = game.add.text(game.world.centerX, game.world.height * 0.25, '游戏结束', {
                fontSize: '40px',
                fontWeight: 'bold',
                fill: '#aa6767'
            });
            title.anchor.setTo(0.5, 0.5);
            var scoreStr = '你的得分是：' + score + '分';
            var scoreText = game.add.text(game.world.centerX, game.world.height * 0.4, scoreStr, {
                fontSize: '30px',
                fontWeight: 'bold',
                fill: '#aa6767'
            });
            scoreText.anchor.setTo(0.5, 0.5);
            score = 0;
            var remind = game.add.text(game.world.centerX, game.world.height * 0.6, '点击任意位置再玩一次', {
                fontSize: '20px',
                fontWeight: 'bold',
                fill: '#aa6767'
            });
            remind.anchor.setTo(0.5, 0.5);
            // 添加点击事件
            game.input.onTap.add(function () {
                game.state.start('play');
            });
        }
    }
}

// 添加场景到游戏示例中
Object.keys(states).map(function (key) {
    game.state.add(key, states[key]);
});

// 启动游戏
game.state.start('preload');