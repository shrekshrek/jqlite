/*!
 * GIT: https://github.com/shrekshrek/jqlite
 **/

(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
        typeof define === 'function' && define.amd ? define(factory) :
            (global.$ = factory());
}(this, (function () {
    'use strict';

    var tempArray = [], slice = tempArray.slice, indexOf = tempArray.indexOf;

    var fragmentRE = /^\s*<(\w+|!)[^>]*>/;

    var tempTable = document.createElement('table');
    var tempTableRow = document.createElement('tr');
    var containers = {
        'tr': document.createElement('tbody'),
        'tbody': tempTable,
        'thead': tempTable,
        'tfoot': tempTable,
        'td': tempTableRow,
        'th': tempTableRow,
        '*': document.createElement('div')
    };
    var container, name;

    var head = document.querySelector('head');
    var _jqlid = 1, handlers = {};

    var cssNumber = {
        'column-count': 1,
        'columns': 1,
        'font-weight': 1,
        'line-height': 1,
        'opacity': 1,
        'z-index': 1,
        'zoom': 1
    };

    function hyphenize(str) {
        return str.replace(/([A-Z])/g, "-$1").toLowerCase()
    }

    function checkValue(name, value) {
        return (isNumber(value) && !cssNumber[hyphenize(name)]) ? value + "px" : value
    }

    function getId(element) {
        return element._jqlid || (element._jqlid = _jqlid++)
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
                && (!event.ns || event.ns === handler.ns)
                && (!fn || getId(handler.fn) === getId(fn))
                && (!selector || handler.sel === selector)
        })
    }

    function parse(evt) {
        var parts = ('' + evt).split('.');
        return {e: parts[0], ns: parts.slice(1).sort().join(' ')}
    }

    function isWindow(obj) {
        return obj != null && obj === obj.window
    }

    function isObject(obj) {
        return typeof obj === "object"
    }

    function isPlainObject(obj) {
        return isObject(obj) && !isWindow(obj) && Object.getPrototypeOf(obj) == Object.prototype
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
        return Array.isArray(obj)
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
        return isArray(obj) || (obj.length !== undefined && isNumber(obj.length))
    }

    function ready(callback) {
        if (document.attachEvent ? document.readyState === "complete" : document.readyState !== "loading") callback();
        else document.addEventListener('DOMContentLoaded', callback, false)
    }


//-------------------------------------------------------------------------------------------------------------$:
    function $(selector, context) {
        var elems;
        if (!selector) {
            return new $Obj()
        } else if ($.is$(selector)) {
            return selector
        } else if (isString(selector)) {
            selector = selector.trim();
            if (selector[0] === '<') {
                name = fragmentRE.test(selector) && RegExp.$1
                if (!(name in containers)) name = '*'

                container = containers[name];
                container.innerHTML = '' + selector;
                elems = container.children;
            } else {
                elems = $.query(context || document, selector)
            }
        } else if (isArray(selector) || selector instanceof NodeList || selector instanceof HTMLCollection) {
            elems = selector
        } else if (isObject(selector)) {
            elems = [selector]
        } else if (isFunction(selector)) {
            return ready(selector)
        }
        return new $Obj(elems)
    }

    function $Obj(elems) {
        var i, len = elems ? elems.length : 0;
        for (i = 0; i < len; i++) this[i] = elems[i]
        this.length = len
    }

    function extend(target, source, deep) {
        for (var key in source) {
            if (deep && (isPlainObject(source[key]) || isArray(source[key]))) {
                if (isPlainObject(source[key]) && !isPlainObject(target[key]))
                    target[key] = {};
                if (isArray(source[key]) && !isArray(target[key]))
                    target[key] = [];
                extend(target[key], source[key], deep)
            } else if (source[key] !== undefined) target[key] = source[key]
        }
    }

//-------------------------------------------------------------------------------------------------------------static methods:
    Object.assign($, {
        is$: function (object) {
            return object instanceof $Obj
        },

        query: function (element, selector) {
            return element.querySelectorAll(selector)
        },

        extend: function (target) {
            var deep, args = slice.call(arguments, 1);
            if (typeof target == 'boolean') {
                deep = target;
                target = args.shift()
            }
            args.forEach(function (arg) {
                extend(target, arg, deep)
            });
            return target
        },

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

        contains: function (parent, node) {
            return parent !== node && parent.contains(node)
        },

        each: function (elems, callback, context) {
            if (likeArray(elems)) {
                for (var i = 0, l = elems.length; i < l; i++)
                    if (callback.call(context || elems[i], i, elems[i]) === false) return elems
            } else {
                for (var key in elems)
                    if (callback.call(context || elems[key], key, elems[key]) === false) return elems
            }
        }

    });


//-------------------------------------------------------------------------------------------------------------ajax:
    function formatParams(data) {
        if (isObject(data)) {
            var arr = [];
            for (var name in data) {
                arr.push(encodeURIComponent(name) + '=' + encodeURIComponent(data[name]))
            }
            return arr.join('&')
        } else {
            return data;
        }
    }

    function parseArguments(url, data, success, dataType) {
        if ($.isFunction(data)) dataType = success, success = data, data = undefined;
        if (!$.isFunction(success)) dataType = success, success = undefined;
        return {
            url: url,
            data: data,
            success: success,
            dataType: dataType
        }
    }

    Object.assign($, {
        get: function (/* url, data, success, dataType */) {
            return $.ajax(parseArguments.apply(null, arguments))
        },

        post: function (/* url, data, success, dataType */) {
            var options = parseArguments.apply(null, arguments);
            options.type = 'POST';
            return $.ajax(options)
        },

        getJSON: function (/* url, data, success */) {
            var options = parseArguments.apply(null, arguments);
            options.dataType = 'json';
            return $.ajax(options)
        },

        ajaxJSONP: function (options) {
            options.jsonp = options.jsonp || 'callback';
            options.jsonpCallback = options.jsonpCallback || 'jsonpCallback_' + Date.now();
            options.type = 'GET';

            options.data[options.jsonp] = options.jsonpCallback;
            var data = formatParams(options.data);
            var script = document.createElement('script');
            var responseData;
            head.appendChild(script);

            window[options.jsonpCallback] = function (data) {
                head.removeChild(script);
                window[options.jsonpCallback] = null;
                responseData = data
            };

            script.onload = function () {
                if (responseData == undefined) throw 'ajax response data is wrong!';
                if (options.success) options.success(responseData)
            };

            script.onerror = function () {
                if (options.error) options.error()
            };

            script.src = (options.url + '&' + data).replace(/[&?]{1,2}/, '?')
        },

        ajax: function (options) {
            if (options === undefined) return;

            options.data = options.data || {};

            if (options.dataType == 'jsonp') return $.ajaxJSONP(options);

            options.type = options.type ? options.type.toUpperCase() : 'GET';

            var request = new XMLHttpRequest();
            request.open(options.type, options.url, true);
            if (options.type == 'POST') request.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');

            request.onload = function () {
                if (this.status >= 200 && this.status < 400) {
                    var result;
                    if (this.responseType == 'arraybuffer' || this.responseType == 'blob')
                        result = this.response;
                    else {
                        result = this.responseText;

                        switch (options.dataType) {
                            case 'json':
                                result = JSON.parse(result);
                                break;
                            case 'xml':
                                result = this.responseXML;
                                break;
                            case 'script':
                                (1, eval)(result);
                                break;
                        }
                    }
                    if (options.success) options.success(result)
                }
            };

            request.onerror = function () {
                if (options.error) options.error()
            };

            request.send(formatParams(options.data))

            return request
        }
    });


//-------------------------------------------------------------------------------------------------------------private methods:
    Object.assign($Obj.prototype, {
        ready: ready,

        get: function (idx) {
            return idx === undefined ? this : this[idx]
        },

        eq: function (idx) {
            return $(idx === -1 ? slice.call(this, idx) : slice.call(this, idx, idx + 1))
        },

        first: function () {
            return this.length ? this.eq(0) : null
        },

        last: function () {
            return this.length ? this.eq(this.length - 1) : null
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
            $.each(this, callback);
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
                elems.add(el.cloneNode(true))
            });
            return elems
        },

        remove: function () {
            return this.each(function (i, el) {
                if (el.parentNode != null) el.parentNode.removeChild(el)
            })
        },

        html: function (html) {
            return 0 in arguments ?
                this.each(function (i, el) {
                    el.innerHTML = html
                }) : (0 in this ? this[0].innerHTML : null)
        },

        text: function (text) {
            return 0 in arguments ?
                this.each(function (i, el) {
                    el.textContent = text
                }) : (0 in this ? this.textContent : null)
        },

        val: function (value) {
            if (value === undefined) {
                if (this[0].nodeName === 'select') return this[0].options[this[0].selectedIndex].value
                else return (this[0].value || this[0].getAttribute('value'))
            } else {
                this.each(function (i, el) {
                    if (el.nodeName === 'select') {
                        for (var j = 0, len2 = el.options.length; j < len2; j++) {
                            if (el.options[j].value === value) {
                                el.options[j].selected = true
                                break
                            }
                        }
                    } else if (el.value !== undefined) {
                        el.value = value
                    } else {
                        el.setAttribute('value', value)
                    }
                })
            }
            return this
        },

        data: function (key, value) {
            if (value !== undefined) {
                this.each(function (i, el) {
                    el.dataset[key] = value
                })
            } else if (key instanceof Object) {
                for (var k in key) {
                    this.data(k, key[k])
                }
            } else if (this[0]) {
                return this[0].dataset[key]
            }
            return this
        },

        attr: function (key, value) {
            if (value !== undefined) {
                this.each(function (i, el) {
                    el.setAttribute(key, value)
                })
            } else if (key instanceof Object) {
                for (var k in key) {
                    this.attr(k, key[k])
                }
            } else if (this[0]) {
                return this[0].getAttribute(key)
            }
            return this
        },

        prop: function (key, value) {
            if (value !== undefined) {
                this.each(function (i, el) {
                    el[key] = value
                })
            } else if (key instanceof Object) {
                for (var k in key) {
                    this.prop(k, key[k])
                }
            } else if (this[0]) {
                return this[0][key]
            }
            return this
        },

        css: function (key, value) {
            if (value !== undefined) {
                value = isFunction(value) ? value() : checkValue(key, value);
                this.each(function (i, el) {
                    el.style[key] = value
                })
            } else if (isObject(key)) {
                for (var k in key) {
                    this.css(k, key[k])
                }
            } else if (this[0]) {
                return this[0].style[key] || window.getComputedStyle(this[0])[key]
            }
            return this
        },

        width: function (outer) {
            if (!this.length) return null;
            if (isWindow(this[0])) {
                return this[0].innerWidth
            } else if (outer) {
                var style = window.getComputedStyle(this[0]);
                return parseInt(style.marginLeft) + parseInt(style.marginRight) + this[0].offsetWidth
            } else {
                return this[0].offsetWidth
            }
        },

        height: function (outer) {
            if (!this.length) return null;
            if (isWindow(this[0])) {
                return this[0].innerHeight
            } else if (outer) {
                var style = window.getComputedStyle(this[0]);
                return (outer ? parseInt(style.marginTop) + parseInt(style.marginBottom) : 0) + this[0].offsetHeight
            } else {
                return this[0].offsetHeight
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
                $el.css("display") == "none" ? el.show() : el.hide()
            })
        },

        index: function (element) {
            return element ? indexOf.call(this, $(element)[0]) : indexOf.call(this.parent().children(), this[0])
        },

        hasClass: function (className) {
            var has = false;
            this.each(function (i, el) {
                if (el.classList.contains(className)) has = true
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

        on: function (event, selector, listener) {
            var _proxy, _sel, _fn, _self = this;
            if (listener === undefined) {
                _sel = '';
                _fn = selector;
                _proxy = function (evt) {
                    var result = _fn.call(evt.target, evt);
                    if (result === false) evt.preventDefault(), evt.stopPropagation()
                }
            } else {
                _sel = selector;
                _fn = listener;
                _proxy = function (evt) {
                    if (indexOf.call(_self.find(_sel), evt.target) !== -1) {
                        var result = _fn.call(evt.target, evt);
                        if (result === false) evt.preventDefault(), evt.stopPropagation()
                    }
                }
            }
            return this.each(function (i, el) {
                var _handler = setHandler(el, event, _fn, _sel);
                _handler.proxy = _proxy;
                el.addEventListener(_handler.e, _handler.proxy)
            })
        },

        off: function (event, selector, listener) {
            var _sel = '', _fn;
            if (listener === undefined) {
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
                var event = document.createEvent('HTMLEvents');
                event.data = data;
                event.initEvent(eventName, true, true);
                el.dispatchEvent(event)
            })
        }

    });

    $Obj.prototype.$ = $Obj.prototype.find;

    return $

})));
