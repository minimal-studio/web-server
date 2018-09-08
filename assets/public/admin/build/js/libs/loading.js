(function setBrowserPolyfill() {
  if (!Object.assign) {
    Object.defineProperty(Object, "assign", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function(target, firstSource) {
        "use strict";
        if (target === undefined || target === null)
          throw new TypeError("Cannot convert first argument to object");
        var to = Object(target);
        for (var i = 1; i < arguments.length; i++) {
          var nextSource = arguments[i];
          if (nextSource === undefined || nextSource === null)
            continue;
          var keysArray = Object.keys(Object(nextSource));
          for (var nextIndex = 0, len = keysArray.length; nextIndex < len; nextIndex++) {
            var nextKey = keysArray[nextIndex];
            var desc = Object.getOwnPropertyDescriptor(nextSource, nextKey);
            if (desc !== undefined && desc.enumerable)
              to[nextKey] = nextSource[nextKey];
            }
          }
        return to;
      }
    });
  }
  if (!Array.from) {
    Array.from = (function() {
      var toStr = Object.prototype.toString;
      var isCallable = function(fn) {
        return typeof fn === 'function' || toStr.call(fn) === '[object Function]';
      };
      var toInteger = function(value) {
        var number = Number(value);
        if (isNaN(number)) {
          return 0;
        }
        if (number === 0 || !isFinite(number)) {
          return number;
        }
        return (number > 0
          ? 1
          : -1) * Math.floor(Math.abs(number));
      };
      var maxSafeInteger = Math.pow(2, 53) - 1;
      var toLength = function(value) {
        var len = toInteger(value);
        return Math.min(Math.max(len, 0), maxSafeInteger);
      };
      return function from(arrayLike/*, mapFn, thisArg */) {
        var C = this;
        var items = Object(arrayLike);
        if (arrayLike == null) {
          throw new TypeError("Array.from requires an array-like object - not null or undefined");
        }
        var mapFn = arguments.length > 1
          ? arguments[1]
          : void undefined;
        var T;
        if (typeof mapFn !== 'undefined') {
          if (!isCallable(mapFn)) {
            throw new TypeError('Array.from: when provided, the second argument must be a function');
          }
          if (arguments.length > 2) {
            T = arguments[2];
          }
        }
        var len = toLength(items.length);
        var A = isCallable(C)
          ? Object(new C(len))
          : new Array(len);
        var k = 0;
        var kValue;
        while (k < len) {
          kValue = items[k];
          if (mapFn) {
            A[k] = typeof T === 'undefined'
              ? mapFn(kValue, k)
              : mapFn.call(T, kValue, k);
          } else {
            A[k] = kValue;
          }
          k += 1;
        }
        A.length = len;
        return A;
      };
    }());
  }
})();
;(function() {
  var SCRIPT_CND_URL = window.SCRIPT_CND_URL || '';
  // var SCRIPT_CND_URL = window.SCRIPT_CND_URL || '//cdn-ccs.mookee.cn';
  window.LoadScript = function(srcouce, callback, cdn) {
    var cdn = typeof cdn == 'undefined' ? true: cdn;
    var script = document.createElement('script');
    script.type = 'text/javascript';
    document.body.appendChild(script);
    script.src = (cdn ? SCRIPT_CND_URL : '') + srcouce;
    script.onload = function(e) {
      if(typeof callback === 'function') callback(e);
    };
  }
  window.LoadLink = function(srcouce) {
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    document.body.appendChild(link);
    link.href = SCRIPT_CND_URL + srcouce;
  }

  window.SetLoadingDOM = function() {
    var _this = {};

    var processContainer = document.querySelector('#process');
    var processBg = document.querySelector('#processBg');
    var processText = document.querySelector('#processText');

    if(!processContainer) {
      processContainer = document.createElement('div');
      processBg = document.createElement('div');
      processText = document.createElement('div');
      processContainer.id = 'process';
      processBg.id = 'processBg';
      processText.id = 'processText';
      processContainer.setAttribute('fill', '');
      processContainer.appendChild(processText);
      processContainer.appendChild(processBg);
      document.body.appendChild(processContainer);
    }

    var _process = 0;
    var isLoad = false;

    _this.done = function() {
      _process = 100;
      isLoad = true;
      setTimeout(function() {
        if(window.G_O_EventEmitter) window.G_O_EventEmitter.emit('LOADED_DOM');
        processContainer.classList.add('loaded');
        setTimeout(function() {
          document.body.removeChild(processContainer);
        }, 500)
      }, 500);
      setProcessRandom(_process);
    }

    function setProcessRandom(nextProcess) {
      var processDelay = 50 + Math.floor(Math.random() * 50);
      if (nextProcess < 95 && !isLoad) {
        nextProcess += Math.floor(Math.random() * 5);
        processText.innerHTML = nextProcess + '%';
        processBg.setAttribute('style', 'width:'+nextProcess + '%;');
        setTimeout(function() {
          setProcessRandom(nextProcess);
        }, processDelay);
      } else if(nextProcess == 100) {
        processText.innerHTML = 100 + '%';
        processBg.setAttribute('style', 'width:100%;');
      }
    }
    setProcessRandom(_process);

    return _this;
  }
})();
