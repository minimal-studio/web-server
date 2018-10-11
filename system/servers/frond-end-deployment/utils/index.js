
const _ = require('lodash');

const { maxAssetCount } = require('../config');

/**
 * convert obj to array
 */
const objToArr = (obj, filter, limit = maxAssetCount) => {
  let hasFilter = _.isFunction(filter);
  let result = [];
  let taked = 0;
  for (const key in obj) {
    if(limit !== 0 && taked == limit) break;
    let item = Object.assign({}, obj[key]);
    hasFilter ? item = filter({...item}) || item : null;
    result.push(item);
    taked++;
  }
  return result.reverse();
}

const findAll = (obj, findParams, filter) => {
  let hasFilter = _.isFunction(filter);
  let res = {};
  for (const key in obj) {
    let item = obj[key];
    for (const targetKey in findParams) {
      const targetVal = findParams[targetKey];
      if(typeof targetVal == 'function') {
        if(targetVal(item)) {
          hasFilter ? item = filter(item) || item : null;
          res[key] = item;
        }
      } else if(item[targetKey] == targetVal) {
        res[key] = item;
      }
    }
  }
  return res;
}

const entityMerge = (reqBody, entity) => {
  let res = {...entity};
  for (const entityKey in entity) {
    if (reqBody.hasOwnProperty(entityKey)) {
      res[entityKey] = reqBody[entityKey];
    }
  }
  return res;
}

module.exports = {
  objToArr,
  findAll,
  entityMerge
}