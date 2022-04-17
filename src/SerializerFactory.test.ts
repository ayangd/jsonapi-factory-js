import { expect } from 'chai';
import { createSerializer } from './SerializerFactory';
import { SerializerSpecification } from './SerializerSpecification';

describe('SerializerFactory', () => {
    it('should produce a serializer with serialize and deserialize functions', () => {
        const serializer = createSerializer({ types: [] });

        expect(serializer).has.keys(['serialize', 'deserialize']);
    });

    it('should serialize simple objects properly', () => {
        const serializer = createSerializer({
            types: [
                {
                    id: 'number',
                    type: 'book',
                    attributes: ['name', 'author'],
                    relationships: [],
                },
            ],
        });
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
                attributes: { name: 'le book', author: 'le author' },
            },
        });
    });

    it('should serialize complex objects with duplicate references properly', () => {
        const serializer = createSerializer({
            types: [
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
            ],
        });
        const result = serializer.serialize([
            {
                id: 1,
                type: 'book',
                title: 'le book 1',
                pageCount: 4,
                author: { id: 1, type: 'person', name: 'Andy', age: 32 },
                publisher: {
                    id: 1,
                    type: 'publisher',
                    name: 'Publisheee',
                    owner: { id: 1, type: 'person', name: 'Andy', age: 32 },
                },
            },
            {
                id: 2,
                type: 'book',
                title: 'le book 2',
                pageCount: 7,
                author: { id: 1, type: 'person', name: 'Andy', age: 32 },
                publisher: {
                    id: 1,
                    type: 'publisher',
                    name: 'Publisheee',
                    owner: { id: 1, type: 'person', name: 'Andy', age: 32 },
                },
            },
        ]);

        expect(result).to.be.deep.equal({
            data: [
                {
                    id: '1',
                    type: 'book',
                    attributes: { title: 'le book 1', pageCount: 4 },
                    relationships: {
                        author: { data: { id: '1', type: 'person' } },
                        publisher: { data: { id: '1', type: 'publisher' } },
                    },
                },
                {
                    id: '2',
                    type: 'book',
                    attributes: { title: 'le book 2', pageCount: 7 },
                    relationships: {
                        author: { data: { id: '1', type: 'person' } },
                        publisher: { data: { id: '1', type: 'publisher' } },
                    },
                },
            ],
            included: [
                {
                    id: '1',
                    type: 'person',
                    attributes: { name: 'Andy', age: 32 },
                },
                {
                    id: '1',
                    type: 'publisher',
                    attributes: { name: 'Publisheee' },
                    relationships: {
                        owner: { data: { id: '1', type: 'person' } },
                    },
                },
            ],
        });
    });

    it('should serialize empty data properly', () => {
        const serializer = createSerializer({ types: [] });
        const result = serializer.serialize(null);

        expect(result).to.be.deep.equal({
            data: null,
        });
    });

    it('should serialize empty array properly', () => {
        const serializer = createSerializer({ types: [] });
        const result = serializer.serialize([]);

        expect(result).to.be.deep.equal({
            data: [],
        });
    });

    it('should serialize array relationships properly', () => {
        const serializer = createSerializer({
            types: [
                {
                    id: 'number',
                    type: 'book',
                    attributes: ['title'],
                    relationships: ['references'],
                },
            ],
        });
        const result = serializer.serialize({
            id: 3,
            type: 'book',
            title: 'Le book 3',
            references: [
                {
                    id: 1,
                    type: 'book',
                    title: 'Le book 1',
                    references: [],
                },
                {
                    id: 2,
                    type: 'book',
                    title: 'Le book 2',
                    references: [],
                },
            ],
        });

        expect(result).to.be.deep.equal({
            data: {
                id: '3',
                type: 'book',
                attributes: { title: 'Le book 3' },
                relationships: {
                    references: {
                        data: [
                            { id: '1', type: 'book' },
                            { id: '2', type: 'book' },
                        ],
                    },
                },
            },
            included: [
                {
                    id: '1',
                    type: 'book',
                    attributes: { title: 'Le book 1' },
                    relationships: {
                        references: { data: [] },
                    },
                },
                {
                    id: '2',
                    type: 'book',
                    attributes: { title: 'Le book 2' },
                    relationships: {
                        references: { data: [] },
                    },
                },
            ],
        });
    });

    it('should serialize cyclic relationship properly', () => {
        interface Book {
            id: number;
            type: 'book';
            title: string;
            references: Book[];
        }
        const serializer = createSerializer({
            types: [
                {
                    id: 'number',
                    type: 'book',
                    attributes: ['title'],
                    relationships: ['references'],
                },
            ],
        });
        const book1: Book = {
            id: 1,
            type: 'book',
            title: 'Le book 1',
            references: [],
        };
        const book2: Book = {
            id: 2,
            type: 'book',
            title: 'Le book 2',
            references: [book1],
        };
        book1.references.push(book2);
        const result = serializer.serialize(book1);

        expect(result).to.be.deep.equal({
            data: {
                id: '1',
                type: 'book',
                attributes: { title: 'Le book 1' },
                relationships: {
                    references: { data: [{ id: '2', type: 'book' }] },
                },
            },
            included: [
                {
                    id: '2',
                    type: 'book',
                    attributes: { title: 'Le book 2' },
                    relationships: {
                        references: { data: [{ id: '1', type: 'book' }] },
                    },
                },
                {
                    id: '1',
                    type: 'book',
                    attributes: { title: 'Le book 1' },
                    relationships: {
                        references: { data: [{ id: '2', type: 'book' }] },
                    },
                },
            ],
        });
    });
});
