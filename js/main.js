import { 
    loadAllEffects, 
    playOneEffectByGroupName, 
    playEffect,
} from './effects.mjs';
import { lazy } from './lazy.mjs';
import { randOne } from './randOne.mjs';



// const width = 340;
const width = 340;
const height = 600;

const devicePixelRatio = 2;


// 默认水果物理参数
const defaultFruitOptions = {
    restitution: 0.75, // 弹性
    friction: 1, // 摩擦力
    density: 0.01, // 密度
};

// 创建墙壁
const wallOptions = {
    isStatic: true,
    restitution: 0.7, // 弹性
    friction: 0.03 // 摩擦力
};

// 墙壁厚度
const wallThickness = 100;
const wallThicknessHalf = wallThickness / 2;

// 底部高度
const bottomHeight = 60;

// 墙壁高度
const wallHeight = height - bottomHeight;


const state = {
    score: 0,
    fruits: [],
    currentFruit: 0,
    nextPos: { 
        x: width / 2, 
        y: 50 
    },
    vx:0, // 最后鼠标横向速度
    lastCreated: Date.now()
};

const fruitConfigs = [
    { sprite: [0, 0] },
    { sprite: [100, 0] },
    { sprite: [200, 0] },
    { sprite: [300, 0] },
    { sprite: [0, 100] },
    { sprite: [100, 100] },
    { sprite: [200, 100] },
    { sprite: [300, 100] },
    { sprite: [0, 200] },
    { sprite: [100, 200] },
];


const maxFruitType = fruitConfigs.length - 1;

const startFruitTypes = [
    0,0,
    2,1,
    0,1,

];

const randFruitTypes = [
    0,0,0,0,
    1,1,1,
    2,2,
    3,
]

let fruitNum = 0;

for( let i = 0; i < fruitConfigs.length; i++){
    const fruitConfig = fruitConfigs[i];
    const size = Math.ceil(Math.sqrt(784 * Math.pow(1.56,i+1),2));
    // const size = Math.ceil(Math.pow(21000 * Math.pow(2,i+1),1/3));

    // console.log(i,size1,size);
    fruitConfig.size = size;
    fruitConfig.score = i;
}

const fruitMixEffectNames = [
    '轻气泡1',
    '轻气泡2',
    '轻气泡3',
    '轻气泡4',
    '轻气泡5',
    '轻气泡6',
    '轻气泡7',
    '卡通气泡弹出1',
    '卡通气泡弹出2',
    '卡通气泡弹出3',
];


const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = width * devicePixelRatio;
canvas.height = height * devicePixelRatio;

ctx.scale(devicePixelRatio, devicePixelRatio);

canvas.style.width = `${width}px`;

// Matter.js 初始化
const engine = Matter.Engine.create({
    enableSleeping: true,
});
const world = engine.world;
world.gravity.y = 1;

let gameStatus = 'running';

// 地面
const groundRectangle = Matter.Bodies.rectangle(
    width / 2, height + wallThicknessHalf - bottomHeight, 
    width + wallThickness * 2, wallThickness, 
    wallOptions
);

// 顶面
const topRectangle = Matter.Bodies.rectangle(
    width / 2, -wallThicknessHalf - 100,
    width, wallThickness,
    wallOptions
);

Matter.World.add(world, [
    topRectangle,
    groundRectangle,
    Matter.Bodies.rectangle(       -wallThicknessHalf, 0, wallThickness, wallHeight * 3, wallOptions),
    Matter.Bodies.rectangle(width + wallThicknessHalf, 0, wallThickness, wallHeight * 3, wallOptions)
]);




const sprite = new Image();
sprite.src = 'fruit-sprites.png';



const randCurrentFruit = (maxNum = 4) => {
    if(startFruitTypes.length > fruitNum){
        state.currentFruit = startFruitTypes[fruitNum];
        return;
    }
    state.currentFruit = randOne(randFruitTypes);
};


function createFruit({x, y, vx = 0, vy = 0, angle = 0, type}) {
    if(gameStatus === 'over') return;

    const config = fruitConfigs[type];
    const body = Matter.Bodies.circle(x, y, config.size/2, defaultFruitOptions);

    // 根据 vx vy 设置速度 velocity
    Matter.Body.setVelocity(body, { x: vx, y: vy });
    Matter.Body.setAngle(body, angle);

    const fruit = {
        body,
        type,
        hitNum: 0,
    };
    
    Matter.World.add(world, body);
    state.fruits.push(fruit);

    fruitNum++;


    // 碰撞结束
    const onSleepStart = () => {
        confirmGameOverLazy();

        Matter.Events.off(body, 'sleepStart', onSleepStart);
    }
    Matter.Events.on(body, 'sleepStart', onSleepStart);

    return fruit;
}


const drawFruit = (fruit, opacity = 1) => {
    const { 
        body, 
        type,
    } = fruit;

    const { 
        position,
        angle,
    } = body;

    const fruitConfig = fruitConfigs[type];
    const size = fruitConfig.size;

    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.fillStyle = `hsl(${180 - type * 20}, 100%, 40%)`;
    ctx.beginPath();
    ctx.arc(position.x, position.y, size / 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.translate(position.x, position.y);
    ctx.rotate(angle);
    ctx.fillStyle = '#FFF';
    ctx.fillText(
        type, 
        0,
        0
    );

    ctx.restore();
};

const creatediff = 500; // 创建时间间隔 ms
const getCanCreate = () => {
    const now = +new Date();
    const diff = now - state.lastCreated;
    return diff > creatediff;
};


// middle
ctx.textAlign = 'center';
// 文字绘制中线
ctx.textBaseline = 'middle';
ctx.font = '20px Arial';


function update() {

    requestAnimationFrame(update);

    const now = +new Date();

    Matter.Engine.update(engine);
    ctx.clearRect(0, 0, width, height);
    
    ctx.fillStyle = '#000';
    

    // 分数
    ctx.fillText(state.score, 20, 30);

    // 状态
    ctx.fillText(gameStatus, width/2, 30);
    
    // 切换水果 按钮
    // ctx.fillStyle = '#fff';
    // ctx.fillRect(width-60, 0, 60, 60);
    // ctx.fillStyle = '#000';
    ctx.fillText('切换', width-30, 30);


    // 绘制底部
    ctx.fillStyle = '#9D9';
    ctx.fillRect(0, wallHeight, width, bottomHeight);
  
    
    if(gameStatus === 'running'){

        // 绘制水果
        state.fruits.forEach(fruit=>drawFruit(fruit,1));
    

        // 绘制当前水果
        const canCreate = getCanCreate();

        if (canCreate) {
            // 根据最后一次生成时间 计算透明度
            const opacity = Math.min(1, (now - (state.lastCreated + creatediff)) / 100);
            drawFruit({
                body: {
                    position: {
                        x: state.nextPos.x,
                        y: state.nextPos.y
                    },
                    angle: 0,
                },
                type: state.currentFruit
            },opacity);
        }

    }
    else if(gameStatus === 'over'){

        // 中间总分
        ctx.fillText('游戏结束', width/2, height/2 - 20);
        ctx.fillText('总分:' + state.score, width/2, height/2 + 20);


        // 绘制水果
        state.fruits.forEach(fruit=>drawFruit(fruit,1));
    
    }
    // 如果有元素高度低于 墙壁高度 那么删除
    state.fruits = state.fruits.filter(fruit => {
        const { position } = fruit.body;
        const removed = position.y < wallHeight * -3;
        if(removed){
            // 从世界删除
            console.log('从世界删除', fruit);
            Matter.World.remove(world, fruit.body);
        }
        return !removed;
    })
}


// 碰撞开始
Matter.Events.on(engine, 'collisionStart', (e) => {
    // console.log('collisionStart', event);
    e.pairs.forEach((pair) => {
        const bodyA = pair.bodyA;
        const bodyB = pair.bodyB;

        const bodys = [ bodyA, bodyB ];
        // 如果是水果和地面碰撞
        if (
            bodys.includes(groundRectangle)
        ) {
            // playOneEffectByGroupName('bottom');

            const fruitBody = bodys.find(body => body !== groundRectangle);
            const fruit = state.fruits.find(f => f.body === fruitBody);

            fruit.hitNum++;

            // 根据body速度 计算音量
            const v = Math.pow( Math.min( 1, Math.max(0.1, (
                Math.abs(fruitBody.velocity.x) + 
                Math.abs(fruitBody.velocity.y)
            ) / 20)) ,1.2);

            // console.log('落地 v',v);
            playEffect('气泡落地',0,v);
            return;
        }
        
        const fruitA = state.fruits.find(f => f.body === bodyA);
        const fruitB = state.fruits.find(f => f.body === bodyB);


        // 如果是水果和水果碰撞
        if( fruitA && fruitB ){

            fruitA.hitNum++;
            fruitB.hitNum++;

            // 根据两个水果的速度计算新水果的速度
            const vx = (bodyA.velocity.x + bodyB.velocity.x) / 1;
            const vy = (bodyA.velocity.y + bodyB.velocity.y) / 2;

            // playOneEffectByGroupName('break');

            // 根据速度计算音量
            const v = Math.min( 1, Math.max(0.1, (
                Math.abs(vx) +
                Math.abs(vy)
            ) / 20));
            
            const meetV = Math.max(0, v - 0.5);

            if(meetV){
                playOneEffectByGroupName('气泡碰撞',0,meetV);
            }



            if(fruitA && fruitA.type >= maxFruitType) return;
            if(fruitB && fruitB.type >= maxFruitType) return;

            if(bodyA.collisionFilter.group === -1) return;
            if(bodyB.collisionFilter.group === -1) return;
            
            if (fruitA && fruitB && fruitA.type === fruitB.type) {
                state.score += fruitConfigs[fruitA.type].score;






                // 让两个 body 忽略重力 忽略碰撞 但是响应约束
         
                
                bodyA.collisionFilter.group = -1;
                bodyB.collisionFilter.group = -1;

             
                // 创建约束
                const constraint = Matter.Constraint.create({
                    bodyA: bodyA,
                    bodyB: bodyB,
                    stiffness: 0.01, // 约束的弹性系数
                    length: 0, // 约束的长度
                });

                // 添加约束
                Matter.World.add(world, constraint);


                setTimeout(() => {

                    // 从世界删除
                    Matter.World.remove(world, [bodyA, bodyB, constraint]);
                    state.fruits = state.fruits.filter(f => f !== fruitA && f !== fruitB);
                    

                    // 在碰撞位置创建新的更大水果
                    if (fruitA.type < fruitConfigs.length - 1) {


                        const x = (bodyA.position.x + bodyB.position.x) / 2;
                        const y = (bodyA.position.y + bodyB.position.y) / 2;

                        const vx = (bodyA.velocity.x + bodyB.velocity.x) / 2;
                        const vy = (bodyA.velocity.y + bodyB.velocity.y) / 2;

                        const angle = (bodyA.angle + bodyB.angle) / 2;
                        console.log('碰撞v',v);

                
                        playEffect(fruitMixEffectNames[fruitA.type],0,v);
                        createFruit({
                            x,
                            y, 
                            vx,
                            vy,
                            angle,
                            type: fruitA.type + 1
                        });
                    }
                },500);

            }
        }
    });
});

const isFruitOver = () => {
    for(let fruit of state.fruits){

        if(fruit.hitNum > 0){
            // 如果速度小于 1
            if(
                Math.abs(fruit.body.velocity.x) < 0.2 && 
                Math.abs(fruit.body.velocity.y) < 0.2
            ){
                // 如果高度小于 60 结束
                const fruitTopLimit = 60 + fruitConfigs[fruit.type].size / 2;
                if(fruit.body.position.y < fruitTopLimit){
                    return true;
                }
            }
        }
    }
    return false;
};
const confirmGameOver = () => {

    console.log('confirmGameOver');

    if(gameStatus === 'over') {
        // 重新开始
    }

    if(isFruitOver()){
        gameStatus = 'over';
        // alert('game over');
        playEffect('卡通气泡弹出3');
        // 从上到下合并全部水果

         
        const step = () => {
            const fruitsSorted = state.fruits.sort((a,b)=>a.body.position.y - b.body.position.y);

            if(fruitsSorted.length < 2){
                // 删除所有水果
                state.fruits = [];
                return;
            }

            const fruitA = fruitsSorted[0];
            const fruitB = fruitsSorted[1];

            // 让两个 body 忽略重力 忽略碰撞 但是响应约束
            fruitA.body.collisionFilter.group = -1;
            fruitB.body.collisionFilter.group = -1;



            // 创建约束
            const constraint = Matter.Constraint.create({
                bodyA: fruitA.body,
                bodyB: fruitB.body,
                stiffness: 0.01, // 约束的弹性系数
                length: 0, // 约束的长度
            });

            // 添加约束
            Matter.World.add(world, constraint);

            clearTimeout(state.timer);
            state.timer = setTimeout(() => {
                // 从世界删除
                Matter.World.remove(world, [fruitA.body, fruitB.body, constraint]);
                state.fruits = state.fruits.filter(f => f !== fruitA && f !== fruitB);
                step();
            },100);

        };

        step();

    }
};

const confirmGameOverLazy = lazy(confirmGameOver, 1000);

document.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const fruitConfig = fruitConfigs[state.currentFruit];
    const { size } = fruitConfig;
    const sizeHalf = size / 2;
    const x = Math.min(Math.max( e.clientX - rect.left, sizeHalf ), width  - sizeHalf);
    const y = Math.min(Math.max( e.clientY - rect.top , sizeHalf ), height - sizeHalf);

    // 根据之前的 x 获取当前 x 加速度
    const vxSpeed = (x - state.nextPos.x) / 10;
    state.nextPos.x = x;
    state.vx = state.vx * 0.5 + vxSpeed;

    // 根据之前的 y 获取当前 y 加速度
    // const vySpeed = (y - state.nextPos.y) / 10;
    // state.nextPos.y = y;
    // state.vy = state.vy * 0.5 + vySpeed;
});

const createFrultAndSaveLast = () => {
    if(gameStatus === 'over') return;

    const canCreate = getCanCreate();
    // if (!canCreate) return;

    createFruit({
        x: state.nextPos.x,
        y: state.nextPos.y,
        vx: state.vx,
        type: state.currentFruit
    });
    randCurrentFruit();
    state.lastCreated = +new Date();


    // playOneEffectByGroupName('depart');
};

document.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if(x > canvas.width-100 && y < 100) {
        randCurrentFruit();
        return;
    }
    
    createFrultAndSaveLast();
});

// 按下空格也可以
document.addEventListener('keyup', (e) => {
    if (e.key === ' ') {
        createFrultAndSaveLast();
    }
    else if(e.key === 'r'){
        randCurrentFruit();
    }
});

// setInterval(createFrultAndSaveLast,20);
loadAllEffects();
sprite.onload = update;