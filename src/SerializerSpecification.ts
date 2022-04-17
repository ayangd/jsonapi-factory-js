export interface SerializerType {
    id: string;
    type: string;
    attributes: string[];
    relationships: string[];
}

export interface SerializerSpecification {
    types: SerializerType[];
}
