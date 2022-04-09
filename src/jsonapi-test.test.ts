import { expect } from 'chai';
import { sayHello } from './jsonapi-test';

describe('hello', () => {
    it('should return "hello"', () => {
        expect(sayHello()).to.equal('hello');
    });
});
