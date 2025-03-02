import { 
    loadAllEffects, 
    playOneEffectByGroupName, 
    playEffect,
	stopAllEffects,
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
    friction: 0.6, // 摩擦力
    density: 0.01, // 密度
};

// 创建墙壁
const wallOptions = {
    isStatic: true,
    restitution: 0.7, // 弹性
    friction: 0 // 摩擦力
};

// 墙壁厚度
const wallThickness = 100;
const wallThicknessHalf = wallThickness / 2;

// 底部高度
const bottomHeight = 60;

// 墙壁高度
const wallHeight = height - bottomHeight;




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

const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
svg.setAttribute('width', 640);
svg.setAttribute('height', 480);
let x = 4;
let y = 4;
// document.body.appendChild(svg);
const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
svg.appendChild(g);

const hsl2rgb = (h,s,l) => {
	h = h / 360;
	s = s / 100;
	l = l / 100;
	let r,g,b;
	if(s === 0){
		r = g = b = l;
	}else{
		const hue2rgb = (p, q, t) => {
			if(t < 0) t += 1;
			if(t > 1) t -= 1;
			if(t < 1/6) return p + (q - p) * 6 * t;
			if(t < 1/2) return q;
			if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
			return p;
		}
		const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
		const p = 2 * l - q;
		r = hue2rgb(p, q, h + 1/3);
		g = hue2rgb(p, q, h);
		b = hue2rgb(p, q, h - 1/3);
	}
	return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}
const rgb2hex = (r,g,b) => {
	return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
}
const hsl2hex = (h,s,l) => {
	const [r,g,b] = hsl2rgb(h,s,l);
	return rgb2hex(r,g,b);
}
for( let i = 0; i < fruitConfigs.length; i++){
    const fruitConfig = fruitConfigs[i];
    const size = Math.ceil(Math.sqrt(784 * Math.pow(1.56,i+1),2));
    // const size = Math.ceil(Math.pow(21000 * Math.pow(2,i+1),1/3));

    // console.log(i,size1,size);
    fruitConfig.size = size;
    fruitConfig.score = i;

	const arc = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
	const r = size / 2;
	arc.setAttribute('cx', x + r);
	arc.setAttribute('cy', y + r);

	x += size + 4;
	if(x > 640){
		x = 0;
		y += size + 4;
	}
	arc.setAttribute('r', r);
	arc.setAttribute('size', size);
	arc.setAttribute('stroke', hsl2hex((180 - i * 20)%360, 100, 40));
	arc.setAttribute('fill', 'none');
	arc.setAttribute('stroke-width', 2);
	g.appendChild(arc);

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





export class Game {
    constructor() {
		
		
		const canvas = document.getElementById('gameCanvas');
		const ctx = canvas.getContext('2d');


		canvas.width = width * devicePixelRatio;
		canvas.height = height * devicePixelRatio;

		ctx.scale(devicePixelRatio, devicePixelRatio);



		// middle
		ctx.textAlign = 'center';
		// 文字绘制中线
		ctx.textBaseline = 'middle';
		ctx.font = '20px Arial';



		
		// canvas.style.width = `${width}px`;

		// Matter.js 初始化
		const engine = Matter.Engine.create({
			enableSleeping: true,
		});
		const world = engine.world;
		world.gravity.y = 1;


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


		this.canvas = canvas;
		this.ctx = ctx;
		this.engine = engine;
		this.world = world;
		this.sprite = sprite;


		loadAllEffects();
		sprite.onload = ()=>{
			this.gameStatus = 'running';
			this.lisener();
			this.update();
		};


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
					if(!fruitBody) return;

					const fruit = this.fruits.find(f => f.body === fruitBody);
					
					if(fruit) {
						fruit.hitNum++;
					}
		
					// 根据body速度 计算音量
					const v = Math.pow( Math.min( 1, Math.max(0.1, (
						Math.abs(fruitBody.velocity.x) + 
						Math.abs(fruitBody.velocity.y)
					) / 40)) ,1.2);
		
					// console.log('落地 v',v);
					playEffect('气泡落地',0,v);
					return;
				}
				
				const fruitA = this.fruits.find(f => f.body === bodyA);
				const fruitB = this.fruits.find(f => f.body === bodyB);
		
		
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
						this.score += fruitConfigs[fruitA.type].score;
		
		
		
		
		
		
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
							this.fruits = this.fruits.filter(f => f !== fruitA && f !== fruitB);
							
		
							// 在碰撞位置创建新的更大水果
							if (fruitA.type < fruitConfigs.length - 1) {
		
		
								const x = (bodyA.position.x + bodyB.position.x) / 2;
								const y = (bodyA.position.y + bodyB.position.y) / 2;
		
								const vx = (bodyA.velocity.x + bodyB.velocity.x) / 2;
								const vy = (bodyA.velocity.y + bodyB.velocity.y) / 2;
		
								const angle = (bodyA.angle + bodyB.angle) / 2;
								console.log('碰撞v',v);
		
						
								playEffect(fruitMixEffectNames[fruitA.type],0,v);
								this.createFruit({
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
		

		
    }

	gameStatus = 'loading';
    score = 0;
    fruits = [];
    currentFruit = 0;

    x = width / 2;
    y = 50;

	lastX = width / 2;
	lastY = 50;

    vx = 0;
	vy = 0;
    lastCreated = 0;
	fruitNum = 0;

	// 界面缩放比例
	scale = 1;

	start(){
		this.gameStatus = 'running';
		this.score = 0;
		this.fruits = [];
		this.currentFruit = 0;
		this.nextPos = { 
			x: width / 2, 
			y: 50 
		};
		this.vx = 0;
		this.vy = 0;
		this.lastCreated = +new Date();

		
		// 删除 world bodies 里所有的 label "Circle Body"
		Matter.Composite.allBodies(this.world).forEach(body => {
			if(body.label === 'Circle Body'){
				Matter.World.remove(this.world, body);
			}
		});
	}


	randCurrentFruit() {
		if(startFruitTypes.length > this.fruitNum){
			this.currentFruit = startFruitTypes[this.fruitNum];
			return;
		}
		this.currentFruit = randOne(randFruitTypes);
	}

	createFruit({x, y, vx = 0, vy = 0, angle = 0, type}) {
		if(this.gameStatus === 'over') return;
	
		const fruitConfig = fruitConfigs[type];
		const body = Matter.Bodies.circle(x, y, fruitConfig.size/2, defaultFruitOptions);
	
		// 根据 vx vy 设置速度 velocity
		Matter.Body.setVelocity(body, { x: vx, y: vy });
		Matter.Body.setAngle(body, angle);
	
		const fruit = {
			body,
			type,
			hitNum: 0,
		};
		
		Matter.World.add(this.world, body);
		this.fruits.push(fruit);
	
		this.fruitNum++;
	
	
		// 碰撞结束
		const onSleepStart = () => {
			this.confirmGameOverLazy();
	
			Matter.Events.off(body, 'sleepStart', onSleepStart);
		}
		Matter.Events.on(body, 'sleepStart', onSleepStart);
	
		return fruit;
	}

	drawFruit(fruit, opacity = 1) {
		const {
			ctx,
		} = this;

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
	}

	drawFruits(){
		this.fruits.forEach(fruit=>this.drawFruit(fruit));
	}
	creatediff = 500;
	getCanCreate(){
		const now = +new Date();
		const diff = now - this.lastCreated;
		return diff > this.creatediff;
	}

	caleV(){

		// 根据之前的 x 获取当前 x 加速度
		const vxSpeed = (this.lastX - this.x) / 10;
		this.vx = this.vx * 0.5 + vxSpeed;
	
		// 根据之前的 y 获取当前 y 加速度
		const vySpeed = (this.lastY - this.y) / 10;
		this.vy = this.vy * 0.5 + vySpeed;

		this.lastX = this.x;
		this.lastY = this.y;
	}


	update(){
		requestAnimationFrame(()=>this.update());
		this.caleV();

		const {
			ctx,
			world,
			creatediff,
		} = this;

		const now = +new Date();
	
		Matter.Engine.update(this.engine);
		ctx.clearRect(0, 0, width, height);
		
		ctx.fillStyle = '#000';
		
	
		// 分数
		ctx.fillText(this.score, 20, 30);
	
		// 状态
		ctx.fillText(this.gameStatus, width/2, 30);
		
		// 切换水果 按钮
		// ctx.fillStyle = '#fff';
		// ctx.fillRect(width-60, 0, 60, 60);
		// ctx.fillStyle = '#000';
		ctx.fillText('切换', width-30, 30);
	
	
		// 绘制底部
		ctx.fillStyle = '#9D9';
		ctx.fillRect(0, wallHeight, width, bottomHeight);
	  
		
		if(this.gameStatus === 'running'){
	
			// 绘制水果
			this.drawFruits();
		
	
			// 绘制当前水果
			const canCreate = this.getCanCreate();
	
			if (canCreate) {
				// 根据最后一次生成时间 计算透明度
				const opacity = Math.min(1, (now - (this.lastCreated + creatediff)) / 100);
				this.drawFruit({
					body: {
						position: {
							x: this.x,
							y: this.y
						},
						angle: 0,
					},
					type: this.currentFruit
				},opacity);
			}
	
		}
		else if(this.gameStatus === 'over'){
	
			// 中间总分
			ctx.fillText('游戏结束', width/2, height/2 - 20);
			ctx.fillText('总分:' + this.score, width/2, height/2 + 20);
	
	
			// 绘制水果
			this.drawFruits();
		
		}
		// 如果有元素高度低于 墙壁高度 那么删除
		this.fruits = this.fruits.filter(fruit => {
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

	isFruitOver(){
		for(let fruit of this.fruits){
	
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
	}

	confirmGameOver(){
		console.log('confirmGameOver');
	
		if(this.gameStatus === 'over') {
			// 重新开始
			return;
		}
	
		if(this.isFruitOver()){
			this.gameStatus = 'over';
			// alert('game over');
			playEffect('卡通气泡弹出3');
			// 从上到下合并全部水果
	
			 

			const step = () => {
				const fruitsSorted = this.fruits.sort((a,b)=>a.body.position.y - b.body.position.y);
	
				if(fruitsSorted.length < 2){
					// 删除所有水果
					this.fruits = [];
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
				Matter.World.add(this.world, constraint);
	
				this.timer = setTimeout(() => {
					// 从世界删除
					Matter.World.remove(this.world, [fruitA.body, fruitB.body, constraint]);

					const v = Math.min( 1, Math.max(0.1, (
						Math.abs(fruitA.body.velocity.x) +
						Math.abs(fruitA.body.velocity.y)
					) / 20));
					const type = Math.floor( (fruitA.type + fruitB.type) / 2);
					playEffect(fruitMixEffectNames[type],0,v);
					this.fruits = this.fruits.filter(f => f !== fruitA && f !== fruitB);
					step();
				},100);
	
			};
	
			step();
	
		}
	}

	confirmGameOverLazy = lazy(this.confirmGameOver.bind(this), 1000);

	move(x,y){

		const fruitConfig = fruitConfigs[this.currentFruit];
		const { size } = fruitConfig;
		const sizeHalf = size / 2;
		x = Math.min(Math.max( x , sizeHalf ), width  - sizeHalf);
		y = Math.min(Math.max( y , sizeHalf ), height - sizeHalf);

		this.x = x;
		// this.y = y;
	}
	onMouseMove(e){
		e.preventDefault();

		const rect = this.canvas.getBoundingClientRect();
		const x = (e.clientX - rect.left) * this.scale;
		const y = (e.clientY - rect.top)  * this.scale;

		this.move(x,y);
	}

	onTouchMove(e){
		e.preventDefault();

		const touch = e.changedTouches[0];
		const rect = this.canvas.getBoundingClientRect();
		const x = (touch.clientX - rect.left) * this.scale;
		const y = (touch.clientY - rect.top)  * this.scale;

		this.move(x,y);
	}

	atack(x,y){

		this.x = x;
		
		if(this.gameStatus === 'over') {
			this.start();
			return;
		}

		if(x > width-100 && y < 100) {
			this.randCurrentFruit();
			return;
		}
		
		this.createFrultAndSaveLast();
	}

	onClick(e){
		e.preventDefault();

		const rect = this.canvas.getBoundingClientRect();
		const x = (e.clientX - rect.left) * this.scale;
		const y = (e.clientY - rect.top)  * this.scale;

		this.atack(x,y);
		
	}

	onTouchEnd(e){
		e.preventDefault();

		const touch = e.changedTouches[0];
		const rect = this.canvas.getBoundingClientRect();
		const x = (touch.clientX - rect.left) * this.scale;
		const y = (touch.clientY - rect.top)  * this.scale;

		this.atack(x,y);
	}
	onKeyup(e){
		e.preventDefault();

		if (e.key === ' ') {
			return this.createFrultAndSaveLast();
		}
		else if(e.key === 'r'){
			return this.randCurrentFruit();
		}
		else if(/^\d+$/.test(e.key)){
			const num = parseInt(e.key);
			if(num >= 0 && num <= maxFruitType){
				this.currentFruit = num;
			}
		}

		this.createFrultAndSaveLast();

	}
	lisener(){
		document.addEventListener('mousemove', this.onMouseMove.bind(this));
		document.addEventListener('touchmove', this.onTouchMove.bind(this));

		document.addEventListener('click', this.onClick.bind(this));
		document.addEventListener('touchend', this.onTouchEnd.bind(this));

		document.addEventListener('keydown', this.onKeyup.bind(this));

		window.addEventListener('resize', this.resize.bind(this));

		// touch once reload effects
		document.addEventListener('touchmove', this.reloadEffects.bind(this), { once: true });
		this.resize();
	}

	createFrultAndSaveLast(){

		if(this.gameStatus === 'over') return;

		const canCreate = this.getCanCreate();
		if (!canCreate) return;
	
		this.createFruit({
			x: this.x,
			y: this.y,
			vx: -this.vx,
			type: this.currentFruit
		});
		this.randCurrentFruit();
		this.lastCreated = +new Date();
	
	
		// playOneEffectByGroupName('depart');
	}

	resize(){
		const { canvas } = this;
		const rect = canvas.getBoundingClientRect();
		const scale = width / rect.width;
		this.scale = scale;
	}

	// 重载效果音
	reloadEffects(e){
		e.preventDefault();
		stopAllEffects();
	}
};
