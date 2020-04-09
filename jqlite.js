/*!
 * GIT: https://github.com/shrekshrek/jqlite
 **/

(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
      (global.$ = factory());
}(this, (function () {
  'use strict';

  var lArray = Array, tempArray = [], slice = tempArray.slice, indexOf = tempArray.indexOf, doc = document,
    hasOwnProperty = Object.prototype.hasOwnProperty, assign = Object.assign,
    UNDEFINED = undefined, _false=false,_true=true,_null=null;

  var fragmentRE = /^\s*<(\w+|!)[^>]*>/;

  var tempTable = 'table';
  var tempTableRow = 'tr';
  var containers = {
    'tr': 'tbody',
    'tbody': tempTable,
    'thead': tempTable,
    'tfoot': tempTable,
    'td': tempTableRow,
    'th': tempTableRow,
    '*': 'div'
  };
  var container, name;

  var head = doc.querySelector('head');
  var _jqlId = 1, handlers = {};

  function get_jqlId() {
    if (_jqlId < Number.MAX_SAFE_INTEGER) {
      return _jqlId++ || _jqlId++
    } else {
      return _jqlId = 1 - _jqlId;
    }
  }

  var cssNumber = {
    'column-count': 1,
    'columns': 1,
    'font-weight': 1,
    'line-height': 1,
    'opacity': 1,
    'z-index': 1,
    'zoom': 1
  };

  function createElement(tagName) {
    return doc.createElement(tagName)
  }

  function hyphenize(str) {
    return str.replace(/([A-Z])/g, "-$1").toLowerCase()
  }

  function checkValue(name, value) {
    return (isNumber(value) && !cssNumber[hyphenize(name)]) ? value + "px" : value
  }

  function getId(element) {
    return element._jqlId || (element._jqlId = get_jqlId())
  }

  function setHandler(element, event, fn, selector) {
    var _id = getId(element);
    var _handlers = handlers[_id] || (handlers[_id] = []);
    var _handler = parse(event);
    _handler.sel = selector;
    _handler.fn = fn;
    _handler.id = _handlers.length;
    _handlers.push(_handler);
    return _handler
  }

  function getHandler(element, event, fn, selector) {
    event = parse(event);
    return (handlers[getId(element)] || []).filter(function (handler) {
      return handler
        && (!event.e || handler.e === event.e)
        && (!event.ns || handler.ns.indexOf(event.ns) === 0)
        && (!fn || getId(handler.fn) === getId(fn))
        && (!selector || handler.sel === selector)
    })
  }

  function parse(evt) {
    var e, ns;
    if (evt && isString(evt)) {
      var index = evt.indexOf('.');
      if (index !== -1) {
        e = evt.slice(0, index).trim();
        ns = evt.slice(index).trim() + '.';
      } else {
        e = evt.trim();
        ns = ''
      }
      var parts = ('' + evt).split('.');
    }

    return {e: e, ns: ns}
  }

  function isWindow(obj) {
    return obj != _null && obj === obj.window
  }

  function isObjectT(obj) {
    return typeof obj === "object";
  }

  function isObject(obj) {
    return obj != _null && isObjectT(obj)
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

  function isNumber(obj) {
    return typeof obj === "number"
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
    return obj && obj.nodeType === 1
  }

  function likeArray(obj) {
    return isArray(obj) || (obj.length !== UNDEFINED && isNumber(obj.length))
  }

  function isNodeList(elem) {
    return elem instanceof NodeList
  }

  function isHTMLCollection(elem) {
    return elem instanceof HTMLCollection
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
        name = fragmentRE.test(selector) && RegExp.$1;
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

  function each(elems, callback, context) {
    if (likeArray(elems)) {
      for (var i = 0, l = elems.length; i < l; i++)
        if (callback.call(context || elems[i], i, elems[i]) === _false) return elems
    } else {
      for (var key in elems) {
        if (hasOwnProperty.call(elems, key) && callback.call(context || elems[key], key, elems[key]) === _false) {
          return elems
        }
      }

    }
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
    isFunction: isFunction,
    isString: isString,
    isNumber: isNumber,
    isBoolean: isBoolean,
    isArray: isArray,
    isDate: isDate,
    isRegExp: isRegExp,
    isElement: isElement,
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
    each: each

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

  function parseArguments(url, data, success, dataType) {
    if (isFunction(data)) {
      dataType = success;
      success = data;
      data = UNDEFINED;
    }
    if (!isFunction(success)) {
      dataType = success;
      success = UNDEFINED;
    }
    return {
      url: url,
      data: data,
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
    var ret, on = function (e) {
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
    return ret = {
      abort: function () {
        if (on) {
          on({type: 'abort', isLocaleAbort: _true})
        }
      }
    }
  }


  function ajax(options) {
    if (!isObject(options) || !isString(options.url)) {
      return
    }
    if (options.dataType === 'jsonp') {
      return ajaxJSONP(options);
    }
    var search = formatParams(options.data || {}), body = options.body;
    if (!body) {
      body = search;
      search = '';
    }
    var request = new XMLHttpRequest(), type = options.type ? options.type.toUpperCase() : 'GET',
      dataType = options.dataType ? options.dataType.toLowerCase() : 'text',
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

    var success = options.success, error = options.onerror, complete = options.complete;
    success = isFunction(success) ? success : UNDEFINED;
    error = isFunction(error) ? error : UNDEFINED;
    complete = isFunction(complete) ? complete : UNDEFINED;

    var ret, sid, timeout = options.timeout, on = function (e) {
      if (sid) {
        clearTimeout(sid);
      }
      if (ret) {
        ret.abort = noop;
      }
      var type = e.type, _request = request, _dataType = dataType,
        _success = success, _error = error, _complete = complete;
      ret = dataType = sid = success = error = complete = request = on = UNDEFINED;
      if (_request) {
        _request.onload = _request.onerror = _request.onabort = _request.ontimeout = _request.onreadystatechange = UNDEFINED;
        var status = _request.status, responseType = _request.responseType;
        if ((e.isLocalAbort || e.isLocaleTimeout) && _request.abort) {
          _request.abort()
        }
        var result;
        if (type === 'load' && !((status < 200 || status >= 400) && (type === 'error'))) {
          if (responseType === 'arraybuffer' || responseType === 'blob') {
            result = _request.response;
          } else {
            result = _request.responseText;
            switch (_dataType) {
              case 'json':
                result = JSON.parse(result);
                break;
              case 'xml':
                result = _request.responseXML;
                break;
              case 'script':
                runScript({text: result},/*{nonce:''}*/);
                break;
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

    request.onload = request.onerror = on;

    if (request.onabort !== UNDEFINED) {
      request.onabort = on;
    } else {
      request.onreadystatechange = function () {
        // Check readyState before timeout as it changes
        if (on && request && request.readyState === 4) {
          // Allow onerror to be called first,
          // but that will not handle a native abort
          // Also, save errorCallback to a variable
          // as xhr.onerror cannot be accessed
          setTimeout(function () {
            if (on) {
              on({type: 'abort'});
            }
          });
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

    request.onerror = function () {
      if (options.error) options.error()
    };

    request.send(body);
    return ret = {
      abort: function () {
        if (on) {
          on({type: 'abort', isLocaleAbort: _true})
        }
      }
    }
  }

  /**
   * @alias $
   */
  assign($, {
    get: function (/* url, data, success, dataType */) {
      return ajax(parseArguments.apply(_null, arguments))
    },

    post: function (/* url, data, success, dataType */) {
      var options = parseArguments.apply(_null, arguments);
      options.type = 'POST';
      return ajax(options)
    },

    getJSON: function (/* url, data, success */) {
      var options = parseArguments.apply(_null, arguments);
      options.dataType = 'json';
      return ajax(options)
    },
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
      evt.stopPropagation();
    }
  }

  assign($Obj.prototype, $.fn = {
    ready: ready,

    get: function (idx) {
      return idx === UNDEFINED ? this : this[idx]
    },

    eq: function (idx) {
      return $(idx === -1 ? slice.call(this, idx) : slice.call(this, idx, idx + 1))
    },

    first: function () {
      return this.length ? this.eq(0) : _null
    },

    last: function () {
      return this.length ? this.eq(this.length - 1) : _null
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
      var elems = $(selector, context);
      for (var i = 0; i < elems.length; i++) {
        this[this.length++] = elems[i]
      }
      return this
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

    remove: function () {
      return this.each(function (i, el) {
        if (el.parentNode != _null) el.parentNode.removeChild(el)
      })
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

    on: function (event, selector, listener,options) {
      var _proxy, _sel, _fn;
      if (listener === UNDEFINED) {
        _sel = '';
        _fn = selector;
        _proxy = function (evt) {
          var result = _fn.call(evt.currentTarget, evt);
          handleEventReturn(result, evt)
        }
      } else {
        _sel = selector;
        _fn = listener;
        _proxy = function (evt) {
          var _this = evt.currentTarget, target = evt.target, isMatches;
          while (target && target !== _this) {
            if (target.matches(_sel)) {
              isMatches = _true;
              break;
            }
            target = target.parentNode;
          }
          if (isMatches) {
            var result = _fn.call(_this, evt);
            handleEventReturn(result, evt);
          }
        }
      }
      return this.each(function (i, el) {
        var _handler = setHandler(el, event, _fn, _sel);
        if (!_handler.e) {
          return !!(_proxy = _null)
        }
        _handler.proxy = _proxy;
        el.addEventListener(_handler.e, _handler.proxy,options)
      })
    },

    off: function (event, selector, listener) {
      var _sel = '', _fn;
      if (listener === UNDEFINED) {
        _fn = selector
      } else {
        _sel = selector;
        _fn = listener
      }
      return this.each(function (i, el) {
        var _id = getId(el);
        getHandler(el, event, _fn, _sel).forEach(function (_handler) {
          delete handlers[_id][_handler.id];
          el.removeEventListener(_handler.e, _handler.proxy)
        })
      })
    },

    trigger: function (eventName, data) {
      return this.each(function (i, el) {
        var event = doc.createEvent('HTMLEvents');
        event.data = data;
        event.initEvent(eventName, _true, _true);
        el.dispatchEvent(event)
      })
    }

  });


  return $

})));
