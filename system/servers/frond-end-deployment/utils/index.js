
const _ = require('lodash');

/**
 * convert obj to array
 */
function objToArr(obj, filter, limit = 30) {
  let hasFilter = _.isFunction(filter);
  let result = [];
  let taked = 0;
  for (const key in obj) {
    if(taked == limit) return;
    let item = Object.assign({}, obj[key]);
    hasFilter ? item = filter({...item}) || item : null;
    result.push(item);
    taked++;
  }
  return result.reverse();
}

function findAll(obj, findParams, filter) {
  let hasFilter = _.isFunction(filter);
  let res = {};
  for (const key in obj) {
    const item = obj[key];
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

module.exports = {
  objToArr,
  findAll
}