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
    Obj = Object,
    hasOwnProperty = Obj.prototype.hasOwnProperty,
    assign = Obj.assign,
    keys = Obj.keys,
    UNDEFINED = undefined, _false = false,
    _true = true,
    NULL = null,
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
    jqlEventListenersMapName = '__jql__EventListenersMap',
    jqlDataMapName = '__jql__DataMap';


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
    return isObject(obj) && !isWindow(obj) && Obj.getPrototypeOf(obj) === Obj.prototype
  }

  function isFunction(obj) {
    return typeof obj === "function"
  }

  function isString(obj) {
    return typeof obj === "string"
  }

  function iifString(obj) {
    return isString(obj) ? obj : ''
  }

  function isNumberT(obj) {
    return typeof obj === "number"
  }

  function isNumber(obj) {
    return isNumberT(obj) && isFinite(obj)
  }

  function iifNumber(obj) {
    return isNumber(obj) || 0
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
    var nodes;
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
        nodes = innerHTMLToTemp(selector, name).children;
      } else {
        nodes = query(context || doc, selector)
      }
    } else if (isArray(selector) || isNodeList(selector) || isHTMLCollection(selector)) {
      nodes = selector
    } else if (isObject(selector)) {
      nodes = [selector]
    } else if (isFunction(selector)) {
      return ready(selector)
    }
    return new $Obj(nodes)
  };


  function $ObjMerge(_this, nodes) {
    var count = 0;
    for (var i = 0, len = nodes ? nodes.length : 0, elem; i < len; i++) {
      elem = nodes[i];
      if (isArray(elem) || isNodeList(elem) || isHTMLCollection(elem) || is$(elem)) {
        $ObjMerge(_this, elem);
      } else if (elem && indexOf.call(_this, elem) === -1) {
        count++;
        _this[i] = nodes[i];
      }
    }
    _this.length += count;
  }

  function $Obj(nodes) {
    this.length = 0;
    $ObjMerge(this, nodes)
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
        if (callback.call(context || arr[i], i, arr[i], arr) === _false) {
          break
        }
      }
    }
    return arr
  }

  function eachIn(obj, callback, context) {
    if (isObject(obj)) {
      for (var key in obj) {
        if (hasOwnProperty.call(obj, key) && callback.call(context || obj[key], key, obj[key], obj) === _false) {
          break
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
        xml = NULL;
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

  function initCap(words) {
    return words[0].toUpperCase() + words.slice(1);
  }

  function invertCap(words) {
    return words ? words[0].toLowerCase() + words.slice(1) : words;
  }

  var aCharCode = 97;
  var zCharCode = 122;
  var ACharCode = 65;
  var ZCharCode = 90;

  function invertCase(words) {
    if (!words) {
      return words
    }
    var a = [];
    for (var i = 0, l = words.length, ch, code; i < l; i++) {
      ch = words[0];
      code = ch.charCodeAt(0);
      a[i] = code >= aCharCode && code <= zCharCode ? ch.toUpperCase() :
        code >= ACharCode && code <= ZCharCode ? ch.toLowerCase() : ch;
    }
    return a.join('')
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
    iifString: iifString,
    isNumber: isNumber,
    iifNumber: iifNumber,
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
    eachIn: eachIn,
    initCap: initCap,
    invertCap: invertCap,
    invertCase: invertCase,
    aCharCode: aCharCode,
    zCharCode: zCharCode,
    ACharCode: ACharCode,
    ZCharCode: ZCharCode,
  });

//-------------------------------------------------------------------------------------------------------------ajax:
  function formatParams(data) {
    if (isObject(data)) {
      var arr = [], v;
      for (var name in data) {
        if (hasOwnProperty.call(data, name) && (v = data[name]) != NULL) {
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
          sid = NULL;
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
          _callback.apply(NULL, arr)
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
            sid = NULL;
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

  function getRemoveKeys(isNull, key) {
    return isNull ? isArray(key) ? key : isObject(key) ? keys(key) : [key] : UNDEFINED;
  }

  function removeValueEach(keys, removeFn) {
    for (var i = 0, l = keys && keys.length; i < l; i++) {
      removeFn(keys[i])
    }
  }

  function getData(el) {
    if (!el) {
      return NULL
    }
    var data = el[jqlDataMapName];
    if (!data) {
      data = el[jqlDataMapName] = {};
      eachIn(el.dataset, function (key, value) {
        data[key] = value;
      })
    }
    return data
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


  function getOuterSize(node, dimension, includeMargins, dimensionProperty) {
    dimensionProperty = dimensionProperty || initCap(dimensionProperty);
    var margin = dimensionProperty === 'Width' ? ['marginLeft', 'marginRight'] : ['marginTop', 'marginBottom'];
    if (isElement(node)) {
      var size = node['offset' + dimensionProperty];
      if (includeMargins) {
        var styles = getComputedStyle(node);
        return size + (parseInt(styles[margin[0]]) || 0) + (parseInt(styles[margin[1]]) || 0);
      }
      return size;
    } else {
      return getInnerSize(node, dimension)
    }
  }

  function innerSize($this, name, value) {
    return value === UNDEFINED ? getInnerSize($this[0], name) : $this.css(name, value)
  }

  function outerSize($this, name, valueOrIncludeMargins) {
    return valueOrIncludeMargins === UNDEFINED || isBoolean(valueOrIncludeMargins) ? getOuterSize(this[0], name, valueOrIncludeMargins) : this.css(name, valueOrIncludeMargins)
  }

  var cssNormalTransform = $.cssNormalTransform = {
    letterSpacing: "0",
    fontWeight: "400"
  }, toDataSetKey = $.toDataSetKey = function (name) {
    if (iifString(name)) {
      if (name.indexOf('-') > -1) {
        var key = name.split('-');
        for (var l = key.length, i = 1, k; i < l; i++) {
          if ((k = key[i])) {
            key[i] = initCap(k)
          }
        }
        return key.join('')
      }
      return name
    } else {
      return ''
    }
  }, toStyleNameList = $.toStyleNameList = function (name) {
    name = toDataSetKey(name.replace(/^-/, ''));
    if (!name) {
      return
    }
    name = initCap(name);
    var webkitName = 'webkit' + name;
    var mozName = 'moz' + name;
    var msName = 'ms' + name;
    return [invertCap(name), webkitName, mozName, msName]
  }, catchCurrentStyle = {
    getPropertyValue: function getPropertyValue() {
      return '';
    }
  }, getComputedStyle = $.getComputedStyle = function (element) {
    if (!element) {
      return catchCurrentStyle
    }
    try {
      return (element.ownerDocument.defaultView || window).getComputedStyle(element)
    } catch (e) {
      return element.style || catchCurrentStyle
    }
  }, getStyleValue = $.getStyleValue = function (element, nameList) {
    if (!element) {
      return UNDEFINED
    }
    var currentStyle = getComputedStyle(element), value;
    if (!isArray(nameList)) {
      return isString(value = currentStyle[nameList]) ? value : UNDEFINED;
    }
    for (var i = 0, l = nameList.length; i < l; i++) {
      if (isString(value = currentStyle[nameList[i]])) {
        return value;
      }
    }
  }, setStyleValue = $.setStyleValue = function (elements, nameList, value) {
    if (likeArray(elements)) {
      elements = [elements];
    }
    var element = elements[0];
    if (!element) {
      return
    }
    if (!isArray(nameList)) {
      nameList = [nameList];
    }
    value = iifString(isFunction(value) ? value() : (isNumber(value) ? (value + 'px') : value)).trim();
    var isAddTogether = false, unit;
    if (value && (!value.indexOf('+=') || !value.indexOf('-='))) {
      unit = value.match(/([^\d.\s]*)$/)[0] || 'px';
      value = parseFloat(value.replace('=', ''));
      isAddTogether = true
    }
    var currentStyle = getComputedStyle(element);
    var validName;
    for (var ni = 0, nl = nameList.length, name; ni < nl; ni++) {
      if (isString(currentStyle[name = nameList[ni]])) {
        validName = name;
        break;
      }
    }
    if (validName) {
      for (var i = 0, l = elements.length; i < l; i++) {
        if ((element = elements[i])) {
          if (isAddTogether) {
            value = (parseFloat(getStyleValue(element, validName)) || 0) + value + unit;
          }
          element.style && element.style.setProperty(validName, value);
        }
      }
    }
  };

  function getInnerSize(node, dimension, dimensionProperty) {
    if (!node) {
      return 0;
    }
    dimensionProperty = dimensionProperty || initCap(dimensionProperty);
    var client = "client" + dimensionProperty;
    if (isDocument(node)) {
      var html = node.documentElement;
      var body = node.body;
      var scroll = "scroll" + dimensionProperty, offset = "offset" + dimensionProperty;
      var htmlSize = html ? Math.max(html[scroll], html[offset], html[client]) : 0;
      var bodySize = body ? Math.max(body[scroll], body[offset], body[client]) : 0;
      return Math.max(bodySize, htmlSize);
    }
    return isWindow(node) ? node['inner' + dimensionProperty] : isElement(node) ? node[client] : 0;
  }

  assign($Obj.prototype, $.fn = {
    ready: ready,
    byNodes: function (nodes) {
      return new $Obj(nodes)
    },
    get: function (idx) {
      return idx === UNDEFINED ? this : this[idx]
    },

    eq: function (idx) {
      return $(idx === -1 ? slice.call(this, idx) : this[idx])
    },

    first: function () {
      return this.length ? this.eq(0) : NULL
    },

    last: function () {
      return this.length ? this.eq(this.length - 1) : NULL
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
        var $find = new $Obj();
        this.each(function (i, el) {
          $find.add($(selector, el))
        });
        return $find
      }
    },

    add: function (selector, context) {
      var nodes = $(selector, context), _this = this, el;
      for (var i = 0, l = nodes.length; i < l; i++) {
        if ((el = nodes[i]) && indexOf.call(_this, el) === -1) {
          _this[_this.length++] = el
        }
      }
      return _this
    },

    each: function (callback) {
      return eachI(this, callback);
    },

    empty: function () {
      return this.each(function (i, el) {
        if (isElement(el)) {
          $(this.children()).remove().empty();
          el.innerHTML = '';
        }
      })
    },

    parent: function () {
      var nodes = new $Obj();
      this.each(function (i, el) {
        nodes.add(el.parentNode)
      });
      return nodes
    },

    children: function () {
      var nodes = new $Obj();
      this.each(function (i, el) {
        nodes.add(el.children)
      });
      return nodes
    },

    clone: function () {
      var nodes = new $Obj();
      this.each(function (i, el) {
        nodes.add(el.cloneNode(_true))
      });
      return nodes
    },
    detach: function (selector) {
      return (selector ? this.filter(selector) : this).each(function (i, el) {
        var par = el && el.parentNode;
        if (par && par.removeChild) {
          par.removeChild(el)
        }
      })
    },
    remove: function (selector) {
      return (selector ? this.filter(selector) : this).each(function (i, el) {
        $(el).offAll().detach();
        if (el && el[jqlDataMapName]) {
          tryDelete(el, jqlDataMapName);
        }
      });
    },

    html: function (html) {
      return arguments.length ?
        this.each(function (i, el) {
          el.innerHTML = html
        }) : ((html = this[0]) ? html.innerHTML : NULL)
    },

    text: function (text) {
      return arguments.length ?
        this.each(function (i, el) {
          el.textContent = text
        }) : ((text = this[0]) ? text.textContent : NULL)
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
      var _this = this;
      if (arguments.length > 1) {
        _this.each(function (i, el) {
          var data = getData(el);
          if (!data) {
            return
          }
          data[key] = value
        })
      } else if (isObject(key)) {
        setValue(_this, 'data', key);
      } else {
        var data = getData(_this[0]);
        if (data && key !== UNDEFINED) {
          return key in data ? data[key] : (value = value.dataset) && ((value = value[key]) !== UNDEFINED) ? data[key] = value : UNDEFINED;
        }
        return data
      }
      return _this
    },
    removeData: function (key) {
      key = getRemoveKeys(arguments.length, key);
      return this.each(function (i, el) {
        if (el && (el = el[jqlDataMapName])) {
          removeValueEach(key || keys(el), function (key) {
            tryDelete(el, key);
          })
        }
      });
    },
    dataset: function (key, value) {
      var _this = this;
      if (arguments.length > 1) {
        _this.each(function (i, el) {
          if (el && (el = el.dataset)) {
            el[key] = value
          }
        })
      } else if (isObject(key)) {
        setValue(_this, 'dataset', key);
      } else {
        value = _this[0];
        var dataset = value && value.dataset;
        if (dataset && key !== UNDEFINED) {
          return dataset[key];
        }
        return dataset
      }
      return _this
    },
    removeDataset: function (key) {
      key = getRemoveKeys(arguments.length, key);
      return this.each(function (i, el) {
        if (el && (el = el.dataset)) {
          removeValueEach(key || keys(el), function (key) {
            try {
              delete el[key]
            } catch (e) {
            }
          })
        }
      });
    },
    attr: function (key, value) {
      var _this = this;
      if (arguments.length > 1) {
        _this.each(function (i, el) {
          if (el && el.setAttribute) {
            el.setAttribute(key, value)
          }
        })
      } else if (isObject(key)) {
        setValue(_this, 'attr', key);
      } else {
        return (value = _this[0]) && value.getAttribute ? value.getAttribute(key) : UNDEFINED
      }
      return _this
    },
    removeAttr(key) {
      key = getRemoveKeys(arguments.length, key);
      return this.each(function (i, el) {
        if (el && el.removeAttribute) {
          removeValueEach(key || el.attributes, function (key) {
            el.removeAttribute(key)
          })
        }
      });
    },
    prop: function (key, value) {
      var _this = this;
      if (arguments.length > 1) {
        _this.each(function (i, el) {
          el[key] = value
        })
      } else if (isObject(key)) {
        setValue(_this, 'prop', key)
      } else {
        return (value = this[0]) ? value[key] : UNDEFINED
      }
      return _this
    },
    removeProp(key) {
      key = getRemoveKeys(arguments.length, key);
      return this.each(function (i, el) {
        if (el && key) {
          removeValueEach(key, function (key) {
            tryDelete(el, key);
          })
        }
      });
    },
    css: function (name, value) {
      var $this = this;
      if (isObject(name)) {
        for (var key in name) {
          if (hasOwnProperty.call(name, key)) {
            value = name[key];
            $this.css(key, value);
          }
        }
        return $this
      }
      if (!name) {
        return
      }
      if (name === 'scrollTop' || name === 'scrollLeft') {
        return $this[name](value)
      }
      var nameList = toStyleNameList(name);
      if (!nameList) {
        return
      }
      if (value != null) {
        var isNumberSet = /^(width|height|top|left|right|bottom|margin|padding|border)/.text(name);
        var isColor = !isNumberSet && /(backgound|color)$/.test(name);
        var elements = $this.filter(isElement);
        if (elements.length) {
          setStyleValue(elements, nameList, isNumber(value) ? isNumberSet ? value + 'px' : isColor ? value.toString(16) : value : value);
        }
        return $this;
      }
      var element = $this[0];
      if (isElement(element)) {
        value = getStyleValue(element, nameList);
        if (value === "normal" && name in cssNormalTransform) {
          value = cssNormalTransform[name];
        }
        return value
      }
    },
    offset: function () {
      var rect, win,
        elem = this[0];
      if (!isElement(elem)) {
        return {top: 0, left: 0}
      }
      if (!elem.getClientRects().length) {
        return {top: 0, left: 0};
      }
      // Get document-relative position by adding viewport scroll to viewport-relative gBCR
      rect = elem.getBoundingClientRect();
      win = elem.ownerDocument.defaultView;
      return {
        top: rect.top + win.pageYOffset,
        left: rect.left + win.pageXOffset
      };
    },
    position: function () {
      var $this = this;
      var elem = $this[0];
      if (!isElement(elem)) {
        return
      }
      var offsetParent, offset, doc,
        parentOffset = {top: 0, left: 0};
      if (getStyleValue(elem, "position") === "fixed") {
        offset = elem.getBoundingClientRect();
      } else {
        offset = $this.offset();
        doc = elem.ownerDocument;
        offsetParent = elem.offsetParent || doc.documentElement;
        while (offsetParent &&
        (offsetParent === doc.body || offsetParent === doc.documentElement) &&
        getStyleValue(offsetParent, "position") === "static") {
          offsetParent = offsetParent.parentNode;
        }
        if (offsetParent && offsetParent !== elem && offsetParent.nodeType === 1) {
          parentOffset = domFromNode(offsetParent).offset();
          parentOffset.top += jQuery.css(offsetParent, "borderTopWidth", true);
          parentOffset.left += jQuery.css(offsetParent, "borderLeftWidth", true);
        }
      }
      return {
        top: offset.top - parentOffset.top - jQuery.css(elem, "marginTop", true),
        left: offset.left - parentOffset.left - jQuery.css(elem, "marginLeft", true)
      };
    },
    width: function (value) {
      return innerSize(this, 'width', value);
    },
    height: function (value) {
      return innerSize(this, 'height', value)
    },
    outerWidth: function (valueOrIncludeMargins) {
      return outerSize(this, 'width', valueOrIncludeMargins);
    },
    outerHeight: function (valueOrIncludeMargins) {
      return outerSize(this, 'height', valueOrIncludeMargins);
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
      var $context = $(context), isHtml = isString(context);
      return this.each(function (i, el) {
        if (isHtml && i > 0) {
          $context = $context.clone()
        }
        $context.each(function (j, el2) {
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
