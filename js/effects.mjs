import { randOne } from "./randOne.mjs";

const EffectGroups = {
    // bottom: [
    //     '落地1',
    //     '落地2',
    //     '落地3',
    //     '落地4',
    //     '落地5',
    //     '落地6',
    //     // '落地7',
    //     '落地8',
    //     '落地9',
    //     '落地10',
    //     '落地11',
    //     '落地12',
    //     '落地13',
    //     '落地14',
    //     '落地15',
    //     '落地16',
    //     '落地17',
    // ],
    depart: [
        '滑动点击',
        '卡通出发',
        '扭头',
        '嗖',
    ],
    break: [
        '气泡1',
        '气泡2',
        '气泡3',
        '气泡破裂1',
        '气泡破裂2',
        '气泡破裂3',
        '气泡破裂4',
    ],

    breakMax: [
        '卡通气泡弹出1',
        '卡通气泡弹出2',
        '卡通气泡弹出3',
        '很多气泡冒出',
    ],
    bo: [
        '轻气泡1',
        '轻气泡2',
        '轻气泡3',
        '轻气泡4',
        '轻气泡5',
        '轻气泡6',
        '轻气泡7',
    ],

    '气泡碰撞': [
        '气泡碰撞1',
        '气泡碰撞2',
        '气泡碰撞3',
        '气泡碰撞5',
        '气泡碰撞6',
    ]
}



const allEffectNames = [
    // '稳重落地1',
    '气泡落地',
];
for(const key in EffectGroups){
    allEffectNames.push(...EffectGroups[key]);
}

const EffectsBuffers = {};

const loadEffectBuffer = async name=>{
    const url = `effects/${name}.wav`;
    const res = await fetch(url);
    const buffer = await res.arrayBuffer();
    const audioCtx = new AudioContext();
    const audioBuffer = await audioCtx.decodeAudioData(buffer);
    EffectsBuffers[name] = audioBuffer;
    return audioBuffer;
}

export const loadAllEffects = ()=>{
    return Promise.all(allEffectNames.map(loadEffectBuffer));
}

let audioCtx = new AudioContext();

export const playEffect = (name, time = 0, volume = 1)=>{
    const buffer = EffectsBuffers[name];
    if(!buffer) return;
    const source = audioCtx.createBufferSource();
    source.buffer = buffer;

    const gainNode = audioCtx.createGain();
    gainNode.gain.value = volume;
    source.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    source.start(time);

}

export const playOneEffectByGroupName = (groupName, time = 0 , volume = 1)=>{
    const group = EffectGroups[groupName];
    if(!group) return console.log(`没有找到名为${groupName}的效果组`);
    const effectName = randOne(group);
    playEffect(effectName, time, volume);
}


export const stopAllEffects = ()=>{
    audioCtx.close();
    audioCtx = new AudioContext();
}