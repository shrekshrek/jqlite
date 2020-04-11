/*!
 * forked from GIT: https://github.com/shrekshrek/jqlite
 **/

(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
      (global.$ = factory());
}(this, (function () {
  'use strict';

  var lArray = Array,
    tempArray = [],
    slice = tempArray.slice,
    indexOf = tempArray.indexOf,
    doc = document,
    hasOwnProperty = Object.prototype.hasOwnProperty,
    assign = Object.assign,
    UNDEFINED = undefined, _false = false,
    _true = true,
    _null = null,
    fragmentRE = /^\s*<(\w+|!)[^>]*>/,
    tempTable = 'table',
    tempTableRow = 'tr',
    containers = {
      'tr': 'tbody',
      'tbody': tempTable,
      'thead': tempTable,
      'tfoot': tempTable,
      'td': tempTableRow,
      'th': tempTableRow,
      '*': 'div'
    },
    head = doc.querySelector('head'),
    jqlEventListenersMapName = '__jql_EventListenersMap';


  var cssNumber = {
    'column-count': 1,
    'columns': 1,
    'font-weight': 1,
    'line-height': 1,
    'opacity': 1,
    'z-index': 1,
    'zoom': 1
  };

  /* function createElement(tagName) {
     return doc.createElement(tagName)
   }*/

  function hyphenize(str) {
    return str.replace(/([A-Z])/g, "-$1").toLowerCase()
  }

  function checkValue(name, value) {
    return (isNumber(value) && !cssNumber[hyphenize(name)]) ? value + "px" : value
  }


  function isSameHandler(handler, event, isOff) {
    var e = event.e, fn = event.fn, ns = event.ns, sel = event.sel;
    return handler
      && (!e || handler.e === e)
      && (!ns || (isOff ? handler.ns === ns : handler.ns.indexOf(ns) === 0))
      && (!fn || handler.fn === fn)
      && (!sel || handler.sel === sel)
  }


  function parse(evt) {
    var e, ns;
    if (evt) {
      if (isString(evt)) {
        var index = evt.indexOf('.');
        if (index !== -1) {
          e = evt.slice(0, index).trim();
          ns = evt.slice(index).trim() + '.';
        } else {
          e = evt.trim();
          ns = ''
        }
      } else if (isObject(evt)) {
        return assign({}, evt)
      }
    }

    return {e: e, ns: ns}
  }

  function isWindow(obj) {
    return obj instanceof Window
  }

  function isCurrentWindow(obj) {
    return obj === window
  }

  function isObjectT(obj) {
    return typeof obj === "object";
  }

  function isObject(obj) {
    return !!obj && isObjectT(obj)
  }

  function isPlainObject(obj) {
    return isObject(obj) && !isWindow(obj) && Object.getPrototypeOf(obj) === Object.prototype
  }

  function isFunction(obj) {
    return typeof obj === "function"
  }

  function isString(obj) {
    return typeof obj === "string"
  }

  function isNumberT(obj) {
    return typeof obj === "number"
  }

  function isNumber(obj) {
    return isNumberT(obj) && isFinite(obj)
  }

  function isBoolean(obj) {
    return typeof obj === "boolean"
  }

  function isArray(obj) {
    return lArray.isArray(obj)
  }

  function isDate(obj) {
    return obj instanceof Date
  }

  function isRegExp(obj) {
    return obj instanceof RegExp
  }

  function isElement(obj) {
    return obj instanceof Element
  }

  function isDocument(obj) {
    return obj instanceof Document
  }

  function isNode(obj) {
    return obj instanceof Node
  }

  function isEleWinDoc(obj) {
    return isElement(obj) || isWindow(obj) || isDocument(obj)
  }

  function likeArray(obj) {
    if (isArray(obj) || isString(obj)) {
      return _true
    }
    if (!isObject(obj)) {
      return _false
    }
    var length = obj.length;
    return length === 0 || isNumber(length) && length > 0 && (length - 1) in obj
  }

  function isNodeList(elem) {
    return elem instanceof NodeList
  }

  function isHTMLCollection(elem) {
    return elem instanceof HTMLCollection
  }

  function isEmptyObject(obj, checkHasOwn) {
    if (isObject(obj)) {
      for (var name in obj) {
        if (!checkHasOwn || (hasOwnProperty.call(obj, name))) {
          return _false;
        }
      }
    }
    return _true;
  }

  function isEmpty(obj) {
    return !obj || isObject(obj) && isEmptyObject(obj, _true);
  }

//-------------------------------------------------------------------------------------------------------------$:

  /**
   * @param selector
   * @param context
   * @return {$Obj|void|*}
   */
  var $ = window.$ = function (selector, context) {
    var elems;
    if (!selector) {
      return new $Obj()
    } else if (is$(selector)) {
      return selector
    } else if (isString(selector)) {
      selector = selector.trim();
      if (selector[0] === '<') {
        var name = fragmentRE.test(selector) && RegExp.$1;
        if (!(name in containers)) {
          name = '*';
        }
        elems = innerHTMLToTemp(selector, name).children;
      } else {
        elems = query(context || doc, selector)
      }
    } else if (isArray(selector) || isNodeList(selector) || isHTMLCollection(selector)) {
      elems = selector
    } else if (isObject(selector)) {
      elems = [selector]
    } else if (isFunction(selector)) {
      return ready(selector)
    }
    return new $Obj(elems)
  };


  function $ObjMerge(_this, elems) {
    var count = 0;
    for (var i = 0, len = elems ? elems.length : 0, elem; i < len; i++) {
      elem = elems[i];
      if (isArray(elem) || isNodeList(elem) || isHTMLCollection(elem) || is$(elem)) {
        $ObjMerge(_this, elem);
      } else if (indexOf.call(_this, elems) === -1) {
        count++;
        _this[i] = elems[i];
      }
    }
    _this.length += count;
  }

  function $Obj(elems) {
    this.length = 0;
    $ObjMerge(this, elems)
  }

  function extend(target, source, deep) {
    if (!source || (!isObject(source) && !isFunction(source))) {
      return;
    }
    for (var key in source) {
      if (hasOwnProperty.call(source, key)) {
        if (deep && (isPlainObject(source[key]) || isArray(source[key]))) {
          if (isPlainObject(source[key]) && !isPlainObject(target[key]))
            target[key] = {};
          if (isArray(source[key]) && !isArray(target[key]))
            target[key] = [];
          extend(target[key], source[key], deep)
        } else if (source[key] !== UNDEFINED) target[key] = source[key]
      }
    }
  }

//-------------------------------------------------------------------------------------------------------------static methods:
  function is$(object) {
    return object instanceof $Obj
  }

  function query(element, selector) {
    return element.querySelectorAll(selector)
  }

  function contains(parent, node) {
    return parent !== node && parent.contains(node)
  }

  function each(obj, callback, context) {
    return likeArray(obj) ? eachI(obj, callback, context) : eachIn(obj, callback, context)
  }

  function eachI(arr, callback, context) {
    if (arr) {
      for (var i = 0, l = arr.length; i < l; i++) {
        if (callback.call(context || arr[i], i, arr[i]) === _false) {
          break
        }
      }
    }
    return arr
  }

  function eachIn(obj, callback, context) {
    if (isObject(obj)) {
      for (var key in obj) {
        if (hasOwnProperty.call(obj, key) && callback.call(context || obj[key], key, obj[key]) === _false) {
          return obj
        }
      }
    }
    return obj;
  }

  function parseXML(data, type) {
    var xml;
    if (data && isString(data)) {
      try {
        xml = (new DOMParser()).parseFromString(data, type || "application/xml");
      } catch (e) {
        console.error(e);
      }
      if (!xml || xml.getElementsByTagName("parsererror").length) {
        xml = _null;
        console.error("Invalid XML: ", data)
      }
    }
    return xml;
  }

  function parseHTML(html, context, keepScripts) {
    if (!isString(html)) {
      return [];
    }
    if (isBoolean(context)) {
      keepScripts = context;
      context = _false
    }
    html = innerHTMLToTemp(html, context);
    if (!keepScripts) {
      var scripts = html.getElementsByTagName('script');
      for (var i = 0, l = scripts.length; i < l; i++) {
        var script = scripts[i];
        script.parentNode.removeChild(script);
      }
    }
    return slice.call(html.childNodes)
  }

  function ready(callback) {
    if (doc.attachEvent ? doc.readyState === "complete" : doc.readyState !== "loading") callback();
    else doc.addEventListener('DOMContentLoaded', callback, _false)
  }

  function newDocument() {
    return doc.implementation.createHTMLDocument('')
  }

  function newXMLDocument(nURI, qName, doctype) {
    return doc.implementation.createDocument(nURI, qName, doctype)
  }

  function createTempElement(tagName, document) {
    return (document || newDocument()).createElement(tagName);
  }

  function innerHTMLToTemp(html, tagName, document) {
    if (isObject(tagName)) {
      document = tagName;
      tagName = '';
    }
    var temp = (document || newDocument()).createElement(tagName || 'div');
    temp.innerHTML = html;
    return temp;
  }

  function createDocFragment(children) {
    var f = doc.createDocumentFragment();
    if (children) {
      f = $(f).append(children)[0]
    }
    return f
  }

  /**
   * @alias $
   */
  assign($, {
    is$: is$,
    query: query,
    extend: function (target) {
      var deep, args = slice.call(arguments, 1);
      if (isBoolean(target)) {
        deep = target;
        target = args.shift()
      }
      if (target && (isObject(target) || isFunction(target))) {
        for (var i = 0, l = args.length; i < l; i++) {
          extend(target, args[i], deep)
        }
      }
      return target
    },
    isObjectT: isObjectT,
    isObject: isObject,
    isPlainObject: isPlainObject,
    isEmptyObject: isEmptyObject,
    isEmpty: isEmpty,
    isFunction: isFunction,
    isString: isString,
    isNumber: isNumber,
    isBoolean: isBoolean,
    isArray: isArray,
    isDate: isDate,
    isRegExp: isRegExp,
    isWindow: isWindow,
    isCurrentWindow: isCurrentWindow,
    isElement: isElement,
    isNode: isNode,
    isEleWinDoc: isEleWinDoc,
    isNodeList: isNodeList,
    isHTMLCollection: isHTMLCollection,
    parseHTML: parseHTML,
    parseXML: parseXML,
    newDocument: newDocument,
    createTempElement: createTempElement,
    innerHTMLToTemp: innerHTMLToTemp,
    newXMLDocument: newXMLDocument,
    createDocFragment: createDocFragment,
    contains: contains,
    each: each,
    eachI: eachI,
    eachIn: eachIn
  });

//-------------------------------------------------------------------------------------------------------------ajax:
  function formatParams(data) {
    if (isObject(data)) {
      var arr = [], v;
      for (var name in data) {
        if (hasOwnProperty.call(data, name) && (v = data[name]) != _null) {
          arr.push(encodeURIComponent(name) + '=' + encodeURIComponent(v))
        }
      }
      return arr.join('&')
    } else {
      return data;
    }
  }

  function parseArguments(url, data, success, dataType, type) {
    if (isObject(url)) {
      return url;
    }
    if (isFunction(data)) {
      type = dataType;
      dataType = success;
      success = data;
      data = UNDEFINED;
    }
    if (!isFunction(success)) {
      type = dataType;
      dataType = success;
      success = UNDEFINED;
    }
    return {
      url: url,
      data: data,
      type: type,
      success: success,
      dataType: dataType
    }
  }

  function runScript(props, attrs) {
    var script = doc.createElement('script');
    assign(script, props);
    if (isObject(attrs)) {
      for (var a in attrs) {
        if (hasOwnProperty.call(attrs, a)) {
          script.setAttribute(a, attrs[a]);
        }
      }
    }
    head.appendChild(script);
    head.removeChild(script);
    return script;
  }

  function tryDelete(obj, name) {
    try {
      obj[name] = UNDEFINED;
      return delete obj[name];
    } catch (e) {
    }
  }

  function cacheQS(canCache) {
    return canCache ? '' : '&_=' + Date.now();
  }

  function addSearchToUrl(url, search) {
    var w = '?', y = '&', k = '';
    url = String(url).replace(/#[\s\S]*/, k);
    return url + (url.indexOf(w) === -1 ? w : url[url.length - 1] === y ? k : y) + search.replace(/^[?&]+/, k)
  }

  function noop() {

  }

  function ajaxJSONP(options) {
    var jsonp = options.jsonp || 'callback', jsonpCallback = options.jsonpCallback || 'jsonpCallback_' + Date.now(),
      success = options.success, error = options.onerror, complete = options.complete;
    success = isFunction(success) ? success : UNDEFINED;
    error = isFunction(error) ? error : UNDEFINED;
    complete = isFunction(complete) ? complete : UNDEFINED;
    var data = options.data || {};
    data[jsonp] = jsonpCallback;
    var sid, responseData, timeout = options.timeout;
    window[jsonpCallback] = function (data) {
      responseData = data;
    };
    var ret, RET = ret = {
      abort: function () {
        if (on) {
          on({type: 'abort', isLocaleAbort: _true})
        }
      }
    }, on = function (e) {
      if (sid) {
        clearTimeout(sid);
      }
      if (ret) {
        ret.abort = noop;
      }
      var script = e.currentTarget;
      var result, successCall = success, errorCall = error, _responseData = responseData, _complete = complete, type = e.type;
      ret = responseData = sid = complete = success = error = on = UNDEFINED;
      if (type !== 'timeout' || !e.isLocaleAbort) {
        if (script) {
          script = script.onerror = script.onload = script.onabort = success;
        }
        tryDelete(window, jsonpCallback);
        jsonpCallback = success;
      }


      if (type === 'load' && !(_responseData === UNDEFINED && (type = 'parseError'))) {
        result = _responseData;
        if (successCall) {
          successCall(result, type);
        }
      } else if (errorCall) {
        errorCall(result, type);
      }
      if (_complete) {
        _complete(result, type)
      }
    };

    if (timeout > 0) {
      sid = setTimeout(function () {
        if (sid) {
          sid = _null;
          if (on) {
            on({type: 'timeout'})
          }
        }
      }, timeout)
    }
    var url = options.url;
    runScript({
      src: addSearchToUrl(url, formatParams(data)
        + cacheQS(options.cache !== _false)),
      onload: on,
      onerror: on,
      onabort: on,
    },/*{nonce:''}*/);
    return RET
  }

  function arrCallbackBind(arrCallback, index) {
    return function (img) {
      var _arrCallback = arrCallback, _index = index;
      arrCallback = index = UNDEFINED;
      if (_arrCallback) {
        _arrCallback(_index, img)
      }
    }
  }

  function loadImage(url, callback) {
    callback = isFunction(callback) ? callback : _false;
    if (isArray(url)) {
      var l = url.length, ret = [];
      if (!l) {
        if (callback) {
          callback()
        }
        return ret;
      }
      var arr = [], notError = _true, arrCallback = callback && function (i, img) {
        arr[i] = img;
        notError = notError && img !== UNDEFINED;
        if (--l <= 0) {
          var _callback = callback;
          arrCallback = callback = UNDEFINED;
          arr[arr.length] = notError;
          _callback.apply(_null, arr)
        }
      };
      for (var i = 0; i < l; i++) {
        ret[i] = loadImage(url[i], arrCallback && arrCallbackBind(arrCallback, i));
      }
      return ret;
    }
    var img = new Image();
    if (callback) {
      img.onload = img.onerror = img.onabort = function (e) {
        var img = this, _callback = callback;
        img.onload = img.onerror = img.onabort = callback = UNDEFINED;
        if (e.type === 'load') {
          _callback(img)
        } else {
          _callback()
        }
      };
    }
    img.src = url;
    return img;
  }

  function ajax(options, aData, aSuccess, aDataType, aType) {
    options = parseArguments(options, aData, aSuccess, aDataType, aType);
    var error = options.onerror,
      complete = options.complete;
    error = isFunction(error) ? error : UNDEFINED;
    complete = isFunction(complete) ? complete : UNDEFINED;
    if (!isString(options.url)) {
      if (error || complete) {
        setTimeout(function () {
          var _error, _complete = complete, result = UNDEFINED, type = 'error:InvalidURL';
          error = complete = UNDEFINED;
          if (_error) {
            _error(result, type);
          }
          if (_complete) {
            _complete(result, type)
          }
        })
      }
      return {abort: noop}
    }
    var dataType = options.dataType ? options.dataType.toLowerCase() : 'text';
    if (dataType === 'jsonp') {
      return ajaxJSONP(options);
    }/* else if (dataType === 'image') {
      return loadImage(options);
    }*/
    var search = formatParams(options.data || {}), body = options.body;
    if (!body) {
      body = search;
      search = '';
    }
    var request = new XMLHttpRequest(), type = options.type ? options.type.toUpperCase() : 'GET',
      isAsync = dataType !== 'script' && options.async !== _false, k;
    request.open(
      type,
      addSearchToUrl(options.url, search, cacheQS(options.cache !== _false)),
      isAsync,
      options.username,
      options.password
    );

    // Apply custom fields if provided
    var xhrFields = options.xhrFields;
    if (isObject(xhrFields)) {
      for (k in xhrFields) {
        request[k] = xhrFields[k];
      }
    }
    // Override mime type if needed
    var mimeType = options.mimeType;
    if (mimeType && request.overrideMimeType) {
      request.overrideMimeType(mimeType);
    }
    var contentType = options.contentType;
    var headers = {'Content-Type': contentType || (type === 'POST' && 'application/x-www-form-urlencoded; charset=UTF-8') || ''};
    assign(headers, options.headers);
    if (!options.crossDomain && !headers["X-Requested-With"]) {
      headers["X-Requested-With"] = "XMLHttpRequest";
    }
    for (k in headers) {
      request.setRequestHeader(k, headers[k]);
    }

    var loadstart = options.loadstart,
      progress = options.progress,
      loadend = options.loadend,
      success = options.success,
      localeStart, localeEnd, localeProgress, localeProgressId, progressTimeout, progressCount = 0;
    success = isFunction(success) ? success : UNDEFINED;
    loadstart = isFunction(loadstart) ? loadstart : UNDEFINED;
    progress = isFunction(progress) ? progress : UNDEFINED;
    loadend = isFunction(loadend) ? loadend : UNDEFINED;

    var ret, sid, timeout = options.timeout, RET = ret = {
      abort: function () {
        if (on) {
          on({type: 'abort', isLocaleAbort: _true})
        }
      }
    }, on = function (e) {
      var type = e.type, _request = request, _dataType = dataType,
        _success = success, _error = error, _complete = complete, _localeEnd = localeEnd;

      if (sid) {
        clearTimeout(sid);
      }
      if (localeProgressId) {
        clearTimeout(localeProgressId)
      }
      if (ret) {
        ret.abort = noop;
      }
      ret = dataType = sid = localeProgress = progressCount = progressTimeout = localeProgressId = success = error = complete = loadstart = progress = localeEnd = request = on = UNDEFINED;
      if (_request) {
        _request.onload = _request.onerror = _request.onabort =
          _request.onloadstart = _request.onprogress =
            _request.ontimeout = _request.onreadystatechange = UNDEFINED;
        var status = _request.status, responseType = _request.responseType;
        if ((e.isLocalAbort || e.isLocaleTimeout) && _request.abort) {
          _request.abort()
        }
        var script = 'script', load = 'load', result;
        type = type === load ? status >= 200 && status < 400 ? type : 'error' : type;
        if (_localeEnd) {
          _localeEnd(_request, type);
        }
        if (!_success && !_error && !_complete && _dataType !== script) {
          return;
        }
        if (type === load) {
          if (responseType === 'arraybuffer' || responseType === 'blob') {
            result = _request.response;
          } else if (_dataType === 'xml') {
            result = _request.responseXML;
          } else {
            result = _request.responseText;
            switch (_dataType) {
              case 'json':
                result = JSON.parse(result);
                break;
              case script:
                runScript({text: result},/*{nonce:''}*/);
            }
          }
          if (_success) {
            _success(result, type, _request)
          }
        } else if (_error) {
          _error(result, type, _request)
        }
        if (_complete) {
          _complete(result, type, _request)
        }
      }
    };

    if (loadstart) {
      if (request.onloadstart !== UNDEFINED) {
        request.onloadstart = loadstart
      } else {
        localeStart = function () {
          if (request && loadstart) {
            loadstart({currentTarget: request, target: request, type: 'loadstart', isLocaleLoadstart: _true})
          }
        }
      }
    }
    if (progress) {
      if (request.onprogress !== UNDEFINED) {
        request.onprogress = progress
      } else {
        progressTimeout = Math.min(Math.max((timeout | 0) / 100, 100), 100);
        localeProgress = function () {
          if (localeProgress && progress && request && ++progressCount < 99) {
            localeProgressId = setTimeout(localeProgress, progressTimeout);
            progress({currentTarget: request, progress: progressCount, target: request, type: 'progress', isLocaleProgress: _true})
          }
        }
      }
    }

    request.onload = request.onerror = on;
    if (request.onabort !== UNDEFINED) {
      request.onabort = on;
    } else {
      request.onreadystatechange = function () {
        if (on && request && request.readyState === 4) {
          setTimeout(function () {
            if (on) {
              on({type: 'abort'});
            }
          });
        }
      }
    }

    if (loadend) {
      if (request.onloadend !== UNDEFINED) {
        request.onloadend = function (event) {
          var _loadend = loadend;
          event.currentTarget.onloadend = UNDEFINED;
          _loadend(event)
        }
      } else {
        localeEnd = function (request, type) {
          setTimeout(function () {
            var _loadend = loadend, target = request, originalType = type;
            loadend = request = type = UNDEFINED;
            _loadend({type: 'loadend', currentTarget: target, target: target, originalType: originalType, isLocaleLoadend: _true})
          })
        }
      }
    }

    if (timeout > 0) {
      request.timeout = timeout;
      if (request.ontimeout !== UNDEFINED) {
        request.ontimeout = on
      } else if (isAsync) {
        sid = setTimeout(function () {
          if (sid) {
            sid = _null;
            if (on) {
              on({type: 'timeout', isLocaleTimeout: _true})
            }
          }
        }, timeout)
      }
    }
    if (localeStart) {
      localeStart();
    }
    if (localeProgress) {
      localeProgressId = setTimeout(localeProgress, progressTimeout)
    }
    request.send(body);
    return RET
  }

  /**
   * @alias $
   */
  assign($, {
    get: function (url, data, success, dataType) {
      return ajax(url, data, success, dataType)
    },

    post: function (url, data, success, dataType) {
      return ajax(url, data, success, dataType, 'POST')
    },

    getJSON: function (url, data, success) {
      var options = parseArguments();
      options.dataType = 'json';
      return ajax(url, data, success, 'json')
    },
    loadImage: loadImage,
    tryDelete: tryDelete,
    runScript: runScript,
    ajax: ajax,
    replace: function (newAjax) {
      if (isFunction(newAjax)) {
        ajax = newAjax;
      }
    }
  });


//-------------------------------------------------------------------------------------------------------------private methods:

  function setValue(obj, method, data) {
    for (var k in data) {
      if (hasOwnProperty.call(data, k)) {
        obj[method](k, data[k])
      }
    }
  }

  function handleEventReturn(result, evt) {
    if (result === _false) {
      if (evt.cancelable) {
        evt.preventDefault();
      }
      evt.returnValue = _false;
      evt.stopPropagation();
      evt.stopImmediatePropagation();
    }
    return result
  }

  function matchesTargetSelector(current, target, selector) {
    var isMatches = !selector;
    while (!isMatches && isElement(target) && target !== current) {
      if (target.matches(selector)) {
        isMatches = _true;
      }
      target = target.parentNode;
    }
    return isMatches;
  }

  function matchesSelector(element, selector) {
    if (!selector) {
      return _true
    }
    if (isFunction(selector)) {
      return selector(element)
    }
    if (isElement(element) && (isString(selector) ? selector.trim() : selector)) {
      return element.matches(selector)
    }
    return _false
  }

  assign($Obj.prototype, $.fn = {
    ready: ready,

    get: function (idx) {
      return idx === UNDEFINED ? this : this[idx]
    },

    eq: function (idx) {
      return $(idx === -1 ? slice.call(this, idx) : this[idx])
    },

    first: function () {
      return this.length ? this.eq(0) : _null
    },

    last: function () {
      return this.length ? this.eq(this.length - 1) : _null
    },
    filter: function (selector) {
      var $o = new $Obj();
      for (var i = 0, l = this.length, el; i < l; i++) {
        if ((el = this[i]) && matchesSelector(el, selector)) {
          $o[$o.length++] = el;
        }
      }
      return $o
    },
    find: function (selector) {
      if (!selector) {
        return this
      } else {
        var elems = new $Obj();
        this.each(function (i, el) {
          elems.add($(selector, el))
        });
        return elems
      }
    },

    add: function (selector, context) {
      var elems = $(selector, context), _this = this, el;
      for (var i = 0, l = elems.length; i < l; i++) {
        if (indexOf.call(_this, el = elems[i]) === -1) {
          _this[_this.length++] = el
        }
      }
      return _this
    },

    each: function (callback) {
      each(this, callback);
      return this
    },

    empty: function () {
      return this.each(function (i, el) {
        el.innerHTML = ''
      })
    },

    parent: function () {
      var elems = new $Obj();
      this.each(function (i, el) {
        elems.add(el.parentNode)
      });
      return elems
    },

    children: function () {
      var elems = new $Obj();
      this.each(function (i, el) {
        elems.add(el.children)
      });
      return elems
    },

    clone: function () {
      var elems = new $Obj();
      this.each(function (i, el) {
        elems.add(el.cloneNode(_true))
      });
      return elems
    },
    detach: function (selector) {
      return (selector ? this.filter(selector) : this).each(function (i, el) {
        var par = el.parentNode;
        if (par && par.removeChild) {
          par.removeChild(el)
        }
      })
    },
    remove: function (selector) {
      return (selector ? this.filter(selector) : this).offAll().detach();
    },

    html: function (html) {
      return arguments.length ?
        this.each(function (i, el) {
          el.innerHTML = html
        }) : ((html = this[0]) ? html.innerHTML : _null)
    },

    text: function (text) {
      return arguments.length ?
        this.each(function (i, el) {
          el.textContent = text
        }) : ((text = this[0]) ? text.textContent : _null)
    },

    val: function (value) {
      if (value === UNDEFINED) {
        var node = this[0];
        if (node.nodeName === 'select') {
          return node.options[node.selectedIndex].value;
        } else {
          return (node.value || node.getAttribute('value'))
        }
      } else {
        this.each(function (i, el) {
          if (el.nodeName === 'select') {
            for (var j = 0, len2 = el.options.length; j < len2; j++) {
              if (el.options[j].value === value) {
                el.options[j].selected = _true;
                break
              }
            }
          } else if (el.value !== UNDEFINED) {
            el.value = value
          } else {
            el.setAttribute('value', value)
          }
        })
      }
      return this
    },

    data: function (key, value) {
      if (value !== UNDEFINED) {
        this.each(function (i, el) {
          el.dataset[key] = value
        })
      } else if (isObject(key)) {
        setValue(this, 'data', key);
      } else if ((value = this[0])) {
        return value.dataset[key]
      }
      return this
    },

    attr: function (key, value) {
      if (value !== UNDEFINED) {
        this.each(function (i, el) {
          el.setAttribute(key, value)
        })
      } else if (isObject(key)) {
        setValue(this, 'attr', key);
      } else if ((value = this[0])) {
        return value.getAttribute(key)
      }
      return this
    },

    prop: function (key, value) {
      if (value !== UNDEFINED) {
        this.each(function (i, el) {
          el[key] = value
        })
      } else if (isObject(key)) {
        setValue(this, 'prop', key)
      } else if ((value = this[0])) {
        return value[key]
      }
      return this
    },

    css: function (key, value) {
      if (value !== UNDEFINED) {
        value = isFunction(value) ? value() : checkValue(key, value);
        this.each(function (i, el) {
          el.style[key] = value
        })
      } else if (isObject(key)) {
        setValue(this, 'css', key)
      } else if ((value = this[0])) {
        return value.style[key] || window.getComputedStyle(value)[key]
      }
      return this
    },

    width: function (outer) {
      if (!this.length) {
        return _null;
      }
      var node = this[0];
      if (isWindow(node)) {
        return node.innerWidth
      } else if (outer) {
        var style = window.getComputedStyle(node);
        return parseInt(style.marginLeft) + parseInt(style.marginRight) + node.offsetWidth
      } else {
        return node.offsetWidth
      }
    },

    height: function (outer) {
      if (!this.length) {
        return _null;
      }
      var node = this[0];
      if (isWindow(node)) {
        return node.innerHeight
      } else if (outer) {
        var style = window.getComputedStyle(node);
        return (outer ? parseInt(style.marginTop) + parseInt(style.marginBottom) : 0) + node.offsetHeight
      } else {
        return node.offsetHeight
      }
    },

    show: function () {
      this.css('display', 'block')
    },

    hide: function () {
      this.css('display', 'none')
    },

    toggle: function () {
      return this.each(function (i, el) {
        var $el = $(el);
        $el.css("display") === "none" ? el.show() : el.hide()
      })
    },

    index: function (element) {
      return element ? indexOf.call(this, $(element)[0]) : indexOf.call(this.parent().children(), this[0])
    },

    hasClass: function (className) {
      var has = _false;
      this.each(function (i, el) {
        if (el.classList.contains(className)) has = _true
      });
      return has
    },

    addClass: function (className) {
      return this.each(function (i, el) {
        el.classList.add(className)
      })
    },

    removeClass: function (className) {
      return this.each(function (i, el) {
        el.classList.remove(className)
      })
    },

    toggleClass: function (className) {
      return this.each(function (i, el) {
        el.classList.toggle(className)
      })
    },

    append: function (context) {
      var elems = $(context);
      return this.each(function (i, el) {
        if (i > 0) elems = elems.clone();
        elems.each(function (j, el2) {
          el.appendChild(el2)
        })
      })
    },

    appendTo: function (context) {
      $(context).append(this);
      return this
    },

    prepend: function (context) {
      var elems = $(context);
      return this.each(function (i, el) {
        if (i > 0) elems = elems.clone();
        elems.each(function (j, el2) {
          el.insertBefore(el2, el.firstChild)
        })
      })
    },

    prependTo: function (context) {
      $(context).prepend(this);
      return this
    },

    before: function (context) {
      var elems = $(context);
      return this.each(function (i, el) {
        if (i > 0) elems = elems.clone();
        elems.each(function (j, el2) {
          el.parentNode.insertBefore(el2, el.parentNode.firstChild)
        })
      })
    },

    insertBefore: function (context) {
      $(context).before(this);
      return this
    },

    after: function (context) {
      var elems = $(context);
      return this.each(function (i, el) {
        if (i > 0) elems = elems.clone();
        elems.each(function (j, el2) {
          el.parentNode.insertBefore(el2, el.nextSibling)
        })
      })
    },

    insertAfter: function (context) {
      $(context).after(this);
      return this
    },

    replaceWith: function (context) {
      return this.before(context).remove()
    },
    on: function (event, selector, listener, options) {
      var _this = this;
      if (!_this.length) {
        return _this
      }
      event = parse(event);
      var _sel, _fn, _e = event.e;
      if (_e) {
        if (isFunction(selector)) {
          _sel = '';
          if (!isFunction(listener)) {
            _fn = selector;
            options = listener;
          }
        } else {
          _sel = isString(selector) ? selector.trim() : '';
          _fn = listener;
        }
      }
      if (!isFunction(_fn)) {
        return _this;
      }
      var eventOption = _false, once;
      if (isObject(options)) {
        once = !!options.once;
        eventOption = {capture: _false, passive: options.passive}
      } else {
        once = options === _true;
      }
      event.fn = _fn;
      event.sel = _sel;
      event.once = once;
      return _this.each(function (i, el) {
        if (isEleWinDoc(el)) {
          var handlersMap = el[jqlEventListenersMapName] || (el[jqlEventListenersMapName] = {}), isAdd;
          var handlers = handlersMap[_e] || (isAdd = _true) && (handlersMap[_e] = []);
          handlers.push(event);
          if (isAdd) {
            addEventListener(el, _e, eventProxy, eventOption)
          }
        }
      })
    },

    off: function (event, selector, listener) {
      var _this = this;
      if (!_this.length) {
        return _this
      }
      var _sel, _fn;
      if (isFunction(selector)) {
        _fn = selector;
      } else {
        _sel = selector;
        _fn = listener
      }
      var targetHandler = parse(event), type = targetHandler.e, ns = targetHandler.ns, nonSelector = !selector,
        isFn = isFunction(_fn), isRemoveEvent = type && nonSelector && isFn;
      if (!type && !ns && nonSelector && !isFn) {
        return _this
      }
      if (type === '') {
        return _this.offAll(ns, _sel, listener);
      }
      targetHandler.fn = _fn;
      targetHandler.sel = _sel;
      return _this.each(function (i, el) {
        if (isEleWinDoc(el)) {
          removeEventEach(el, type, targetHandler);
          if (isRemoveEvent) {
            removeEventListener(el, type, _fn);
          }
        }
      });
    },
    offAll: function (namespace, selector, listener) {
      if (isFunction(namespace)) {
        listener = namespace;
        namespace = '';
      } else if (isFunction(selector)) {
        listener = selector;
        selector = '';
      }
      namespace = isString(namespace) ? namespace : '';
      return this.each(function (i, el) {
        if (isEleWinDoc(el)) {
          var handlersMap = el[jqlEventListenersMapName];
          if (isObject(handlersMap)) {
            for (var type in handlersMap) {
              if (handlersMap.hasOwnProperty(type)) {
                $(el).off(type + namespace, selector, listener);
              }
            }
          }
        }
      })
    },
    trigger: function (event, data) {
      var _this = this;
      if (!_this.length) {
        return _this
      }
      event = parse(event);
      var type = event.e, ns = event.ns;
      return _this.each(function (i, el) {
        if (isEleWinDoc(el)) {
          var event = doc.createEvent('HTMLEvents');
          event.data = data;
          event.namespace = ns;
          event.initEvent(type, _true, _true);
          el.dispatchEvent(event)
        }
      })
    }
  });


  function removeEventListener(el, type, listener) {
    el.removeEventListener(type, listener)
  }

  function addEventListener(el, type, listener, options) {
    el.addEventListener(type, listener, options)
  }

  function eventProxy(event) {
    var currentTarget = event.currentTarget, target = event.target;
    var handlersMap = currentTarget[jqlEventListenersMapName];
    var type = event.type, ns = event.namespace || '';
    var targetHandler = {e: type, ns: ns};
    var handlers = handlersMap[type];
    eachI(handlers.concat(), function (i, currentHandler) {
      if (isSameHandler(currentHandler, targetHandler) && matchesTargetSelector(currentTarget, target, currentHandler.sel)) {
        if (currentHandler.once) {
          removeEventOne(handlers, handlersMap, currentHandler, targetHandler, currentTarget, type)
        }
        return handleEventReturn(currentHandler.fn.call(currentTarget, event), event);
      }
    });
    deleteHandlersMap(currentTarget, handlersMap)
  }

  function removeEventOne(handlers, handlersMap, currentHandler, targetHandler, currentElement, type) {
    handlers.splice(handlers.indexOf(currentHandler), 1);
    if (!handlers.length) {
      tryDelete(handlersMap, type);
      removeEventListener(currentElement, type, eventProxy);
    }
  }

  function deleteHandlersMap(element, handlersMap) {
    if (isEmptyObject(handlersMap, _true)) {
      tryDelete(element, jqlEventListenersMapName)
    }
  }

  function removeEventEach(currentElement, type, targetHandler) {
    var handlersMap = currentElement[jqlEventListenersMapName];
    if (handlersMap) {
      var handlers = handlersMap[type];
      if (handlers) {
        handlers.concat().forEach(function (currentHandler) {
          if (isSameHandler(currentHandler, targetHandler, _true)) {
            removeEventOne(handlers, handlersMap, currentHandler, targetHandler, currentElement, type)
          }
        })
      }
      deleteHandlersMap(handlersMap)
    }
  }

  return $
})));
