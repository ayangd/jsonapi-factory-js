import {
    SerializerSpecification,
    SerializerType,
} from './SerializerSpecification';
import _ from 'lodash';

export interface SerializableObject {
    id: string | number;
    type: string;
    [key: string]: any;
}

export interface GenericObject {
    [key: string]: any;
}

export interface ResourceObject {
    id: string;
    type: string;
    attributes?: { [key: string]: any };
    relationships?: { [key: string]: RelationshipObject };
}

export interface JSONObject {
    data: ResourceObject | ResourceObject[];
    included?: ResourceObject[];
}

export interface RelationshipResourceObject {
    id: string;
    type: string;
}

export interface RelationshipObject {
    data: RelationshipResourceObject;
}

export function createSerializer(specs: SerializerSpecification) {
    const serializeTypeMap: { [key: string]: SerializerType } = {};
    for (let type of specs.types) {
        serializeTypeMap[type.type] = type;
    }

    function isSerializableObject(obj: GenericObject): boolean {
        return _.has(obj, 'id') && _.has(obj, 'type');
    }

    function singleSerialize(
        input: GenericObject
    ): [ResourceObject, GenericObject[]] {
        if (!isSerializableObject(input)) {
            throw new Error('Object is not serializable');
        }
        const checkedInput = input as SerializableObject;

        const type = serializeTypeMap[checkedInput.type];
        if (type === undefined) {
            throw new Error('Type is unknown');
        }

        const fields = _.without(_.keys(checkedInput), 'id', 'type');
        const expectedFields = _.concat(type.attributes, type.relationships);
        if (!_.isEqual(fields, expectedFields)) {
            throw new Error('Detected field difference');
        }

        const result: ResourceObject = {
            id: checkedInput.id.toString(),
            type: checkedInput.type,
        };
        const resultRelationshipObjects: GenericObject[] = [];
        if (type.attributes.length !== 0) {
            result.attributes = _.fromPairs(
                type.attributes.map((attribute) => [
                    attribute,
                    checkedInput[attribute],
                ])
            );
        }
        if (type.relationships.length !== 0) {
            result.relationships = _.fromPairs(
                type.relationships.map((relationship) => {
                    const data = {
                        data: {
                            id: checkedInput[relationship].id.toString(),
                            type: checkedInput[relationship].type,
                        },
                    };
                    resultRelationshipObjects.push(checkedInput[relationship]);
                    return [relationship, data];
                })
            );
        }
        return [result, resultRelationshipObjects];
    }

    function collectSerializables(
        input: GenericObject | GenericObject[]
    ): JSONObject {
        const arrayedInput = _.isArray(input) ? input : [input];
        const resultData = arrayedInput.map(singleSerialize);

        const processQueue = _.flatMap(resultData.map((r) => r[1]));
        const processed: { [key: string]: ResourceObject } = {};

        while (processQueue.length > 0) {
            const current = processQueue.shift()!;
            if (_.has(processed, `${current.type}[${current.id}]`)) {
                continue;
            }

            const [serialized, relationships] = singleSerialize(current);
            processed[`${current.type}[${current.id}]`] = serialized;
            for (let relationship of relationships) {
                processQueue.push(relationship);
            }
        }

        let result: JSONObject = {
            data: _.isArray(input)
                ? resultData.map((r) => r[0])
                : resultData[0]![0],
        };
        if (!_.isEmpty(processed)) {
            result.included = _.values(processed);
        }

        return result;
    }

    return {
        serialize(input: GenericObject | GenericObject[]): JSONObject {
            return collectSerializables(input);
        },

        deserialize(output: object) {},
    };
}
