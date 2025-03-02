export const lazy = (fn, time) => {
    let last = 0;
    return () => {
        const now = +new Date();
        if(now - last > time){
            last = now;
            fn();
        }
    }
}
