export interface FieldSettings {
    value: any;
    required: boolean;
    display: boolean;
    priority: number;
    field: any;
}

export interface ValidationFunctions {
    [key: string]: (value: any) => boolean;
}

export interface settings {
    services : [{plugins: [], routes: []}]
}