import { expect } from 'chai';
import { createSerializer } from './SerializerFactory';
import { SerializerSpecification } from './SerializerSpecification';

describe('SerializerFactory', () => {
    it('should produce a serializer with serialize and deserialize functions', () => {
        const serializerSpecs = new SerializerSpecification([]);
        const serializer = createSerializer(serializerSpecs);

        expect(serializer).has.keys(['serialize', 'deserialize']);
    });

    it('should serialize simple objects properly', () => {
        const serializerSpecs = new SerializerSpecification([
            {
                id: 'number',
                type: 'book',
                attributes: ['name', 'author'],
                relationships: [],
            },
        ]);
        const serializer = createSerializer(serializerSpecs);
        const result = serializer.serialize({
            id: 1,
            type: 'book',
            name: 'le book',
            author: 'le author',
        });

        expect(result).to.be.deep.equal({
            data: {
                id: '1',
                type: 'book',
                attributes: {
                    name: 'le book',
                    author: 'le author',
                },
            },
        });
    });

    it('should serialize complex objects properly', () => {
        const serializerSpecs = new SerializerSpecification([
            {
                id: 'number',
                type: 'person',
                attributes: ['name', 'age'],
                relationships: [],
            },
            {
                id: 'number',
                type: 'publisher',
                attributes: ['name'],
                relationships: ['owner'],
            },
            {
                id: 'number',
                type: 'book',
                attributes: ['title', 'pageCount'],
                relationships: ['author', 'publisher'],
            },
        ]);
        const serializer = createSerializer(serializerSpecs);
        const result = serializer.serialize([
            {
                id: 1,
                type: 'book',
                title: 'le book 1',
                pageCount: 4,
                author: {
                    id: 1,
                    type: 'person',
                    name: 'Andy',
                    age: 32,
                },
                publisher: {
                    id: 1,
                    type: 'publisher',
                    name: 'Publisheee',
                    owner: {
                        id: 1,
                        type: 'person',
                        name: 'Andy',
                        age: 32,
                    },
                },
            },
            {
                id: 2,
                type: 'book',
                title: 'le book 2',
                pageCount: 7,
                author: {
                    id: 1,
                    type: 'person',
                    name: 'Andy',
                    age: 32,
                },
                publisher: {
                    id: 1,
                    type: 'publisher',
                    name: 'Publisheee',
                    owner: {
                        id: 1,
                        type: 'person',
                        name: 'Andy',
                        age: 32,
                    },
                },
            },
        ]);

        expect(result).to.be.deep.equal({
            data: [
                {
                    id: '1',
                    type: 'book',
                    attributes: {
                        title: 'le book 1',
                        pageCount: 4,
                    },
                    relationships: {
                        author: {
                            data: {
                                id: '1',
                                type: 'person',
                            },
                        },
                        publisher: {
                            data: {
                                id: '1',
                                type: 'publisher',
                            },
                        },
                    },
                },
                {
                    id: '2',
                    type: 'book',
                    attributes: {
                        title: 'le book 2',
                        pageCount: 7,
                    },
                    relationships: {
                        author: {
                            data: {
                                id: '1',
                                type: 'person',
                            },
                        },
                        publisher: {
                            data: {
                                id: '1',
                                type: 'publisher',
                            },
                        },
                    },
                },
            ],
            included: [
                {
                    id: '1',
                    type: 'person',
                    attributes: {
                        name: 'Andy',
                        age: 32,
                    },
                },
                {
                    id: '1',
                    type: 'publisher',
                    attributes: {
                        name: 'Publisheee',
                    },
                    relationships: {
                        owner: {
                            data: {
                                id: '1',
                                type: 'person',
                            },
                        },
                    },
                },
            ],
        });
    });
});
