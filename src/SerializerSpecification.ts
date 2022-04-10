export interface SerializerType {
    id: string;
    type: string;
    attributes: string[];
    relationships: string[];
}

export class SerializerSpecification {
    types: SerializerType[];

    constructor(types: SerializerType[]) {
        this.types = types;
    }
}
