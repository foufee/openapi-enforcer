/**
 *  @license
 *    Copyright 2018 Brigham Young University
 *
 *    Licensed under the Apache License, Version 2.0 (the "License");
 *    you may not use this file except in compliance with the License.
 *    You may obtain a copy of the License at
 *
 *        http://www.apache.org/licenses/LICENSE-2.0
 *
 *    Unless required by applicable law or agreed to in writing, software
 *    distributed under the License is distributed on an "AS IS" BASIS,
 *    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *    See the License for the specific language governing permissions and
 *    limitations under the License.
 **/
'use strict';
const smart         = require('./util').smart;
const rx            = require('./rx');

const zeros = '00000000';

/**
 * Convert value into a binary octet string.
 * @param {boolean, number, string, Buffer} value
 * @returns {{ error: Error|null, value: string }}
 */
exports.binary = function(value) {
    const type = typeof value;

    if (type === 'boolean') {
        return format(null, '0000000' + (value ? '1' : '0'));

    } else if (type === 'number' && !isNaN(value)) {
        return format(null, decToBin(value));

    } else if (type === 'string' || value instanceof Buffer) {
        const buffer = Buffer.from(value);
        let binary = '';
        for (let i = 0; i < buffer.length; i++) {
            const byte = buffer[i].toString(2);
            binary += zeros.substr(byte.length) + byte;
        }
        return format(null, binary);

    } else {
        return format(Error('Cannot convert to binary. The value must be a boolean, number, string, or buffer. Received: ' + smart(value)));
    }
};

/**
 * Convert a value to a boolean.
 * @param {*} value
 * @returns {{ error: Error|null, value: boolean }}
 */
exports.boolean = function(value) {
    return format(null, !!value);
};

/**
 * Convert to base64 encoded string.
 * @param {boolean, number, string, buffer} value
 * @returns {{ error: Error|null, value: string }}
 */
exports.byte = function(value) {
    const type = typeof value;

    if (type === 'boolean') {
        return format(null, value ? 'AQ==' : 'AA==');

    } else if (type === 'number' && !isNaN(value)) {
        const binary = decToBin(value);
        const bytes = [];
        for (let i = 0; i < binary.length; i += 8) bytes.push(parseInt(binary.substr(i, 8), 2));
        return format(null, Buffer.from(bytes).toString('base64'));

    } else if (type === 'string') {
        return format(null, Buffer.from(value, 'utf8').toString('base64'));

    } else if (value instanceof Buffer) {
        return format(null, value.toString('base64'));

    } else {
        return format(Error('Cannot convert to byte. The value must be a boolean, number, string, or buffer. Received: ' + smart(value)));
    }
};

/**
 * Take a number, date value, or a date string and convert to date format.
 * @param {Date, string, number} value
 * @returns {{ error: Error|null, value: string }}
 */
exports.date = function(value) {
    const data = exports.dateTime(value);
    if (data.error) return format(data.error);
    return format(null, data.value.substr(0, 10));
};

/**
 * Take a number, date value, or a date string and convert to ISO date format.
 * @param {Date, string, number} value
 * @returns {{ error: Error|null, value: string }}
 */
exports.dateTime = function(value) {
    const type = typeof value;
    const isString = type === 'string';

    if (isString && rx.dateTime.test(value)) {
        return format(null, new Date(value).toISOString());

    } else if (isString && rx.date.test(value)) {
        return format(null, new Date(value + 'T00:00:00.000Z').toISOString());

    } else if (value instanceof Date) {
        return format(null, value.toISOString());

    } else if (type === 'number') {
        return format(null, new Date(value).toISOString());

    } else {
        return format(Error('Cannot convert to date. The value must be a Date, a number, or a date string. Received: ' + smart(value)));
    }
};
exports['date-time'] = exports.dateTime;

/**
 * Convert a value to an integer.
 * @param {*} value
 * @returns {{ error: Error|null, value: number }}
 */
exports.integer = function(value) {
    const result = +value;
    return isNaN(result)
        ? format(Error('Cannot convert to integer. The value must be numeric. Received: ' + smart(value)))
        : format(null, Math.round(result));
};

/**
 * Convert a value to a number.
 * @param {string, number, boolean} value
 * @returns {{ error: Error|null, value: number }}
 */
exports.number = function(value) {
    const result = +value;
    return isNaN(result)
        ? format(Error('Cannot convert to number. The value must be numeric. Received: ' + smart(value)))
        : format(null, result);
};

/**
 * Convert a value to a string.
 * @param {string, number, boolean, object, date} value
 * @returns {{ error: Error|null, value: string }}
 */
exports.string = function(value) {
    switch (typeof value) {
        case 'boolean':
        case 'number':
        case 'string':
            return format(null, String(value));
        case 'object':
            if (value instanceof Date) return format(null, value.toISOString());
            return format(null, JSON.stringify(value));
    }
    return format(Error('Cannot convert to string. The value must be a string, a number, or a boolean, and Object, or a Date. Received: ' + smart(value)));
};

function decToBin(dec) {
    const binary = (dec >>> 0).toString(2);
    const mod = binary.length % 8;
    return mod === 0 ? binary : zeros.substr(mod) + binary;
}

function format(err, value) {
    return {
        error: err ? err.message : null,
        value: err ? null : value
    };
}