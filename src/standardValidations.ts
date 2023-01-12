export function timer(): Promise<void> {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve();
        }, 3000);
    });
}



type ValidatorFn = {
    [key: string]: (value: any) => boolean | Promise<boolean>;
};

export const builtInValidators: ValidatorFn = {
    isNumber: (value: any) => !isNaN(value),
    isEmail: (value: any) => /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(value),
    isUrl: (value: any) => /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/.test(value),
    validServiceName: (value: any) => { return value !== 'invalid' },
    isNameUnique: async (value: string): Promise<boolean> => { await timer(); return value != 'duplicate';}
};


export function isPromise(value: any): value is Promise<any> {
    return value !== null && typeof value === 'object' && typeof value.then === 'function';
}


const result = timer();
if (isPromise(result)) {
    result.then(console.log);
}
