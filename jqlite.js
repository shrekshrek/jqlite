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
    var tempDiv = document.createElement('div');

    function isObject(value) {
        return typeof value === "object";
    }

    function isFunction(value) {
        return typeof value === "function";
    }

    function isString(value) {
        return typeof value === "string";
    }

    function isNumber(value) {
        return typeof value === "number";
    }

    function isBoolean(value) {
        return typeof value === "boolean";
    }

    function isArray(value) {
        return Array.isArray(value);
    }

    function isDate(value) {
        return value instanceof Date;
    }

    function isRegExp(value) {
        return value instanceof RegExp;
    }

    function isElement(value) {
        return value && value.nodeType === 1;
    }

    function ready(callback) {
        document.addEventListener('DOMContentLoaded', callback, false);
    }


// $:
    function $(selector, context) {
        var elems;
        if (!selector) {
            return new $Obj();
        } else if ($.is$(selector)) {
            return selector;
        } else if (isString(selector)) {
            selector = selector.trim();
            if (selector[0] === '<') {
                tempDiv.innerHTML = selector;
                elems = tempDiv.children;
            } else {
                elems = $.query(context || document, selector);
            }
        } else if (isArray(selector) || selector instanceof NodeList || selector instanceof HTMLCollection) {
            elems = selector;
        } else if (isObject(selector)) {
            elems = [selector];
        } else if (isFunction(selector)) {
            return ready(selector);
        }
        return new $Obj(elems);
    }

    function $Obj(elems) {
        var i, len = elems ? elems.length : 0;
        for (i = 0; i < len; i++) this[i] = elems[i];
        this.length = len;
    }


// static methods:
    Object.assign($, {
        is$: function (object) {
            return object instanceof $Obj;
        },

        query: function (element, selector) {
            return element.querySelectorAll(selector);
        },

        extend: function (target) {
            return Object.assign.apply(null, arguments);
        },

        isObject: isObject,
        isFunction: isFunction,
        isString: isString,
        isNumber: isNumber,
        isBoolean: isBoolean,
        isArray: isArray,
        isDate: isDate,
        isRegExp: isRegExp,
        isElement: isElement,

        contains: function (parent, node) {
            return parent !== node && parent.contains(node);
        },

        each: function (elems, callback, context) {
            // elems.forEach(callback);//for效率比forEach高，所以代替之
            for (var i = 0; i < elems.length; i++) {
                callback.call(context || elems, elems[i], i);
            }
        },

        getJSON: function (url, success) {
            $.ajax({type: 'GET', url: url, success: success});
        },

        ajax: function (obj) {
            var request = new XMLHttpRequest();
            request.open(obj.type, obj.url, true);
            request.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');

            request.onload = function () {
                if (this.status >= 200 && this.status < 400) {
                    var data = JSON.parse(this.response);
                    if (obj.success) obj.success(data);
                }
            };

            request.onerror = function () {
                if (obj.error) obj.error();
            };

            request.send(obj.data);
        }

    });


// private methods:
    Object.assign($Obj.prototype, {
        ready: ready,

        get: function (idx) {
            return idx === undefined ? this : this[idx];
        },

        eq: function (idx) {
            return $(idx === -1 ? slice.call(this, idx) : slice.call(this, idx, idx + 1));
        },

        first: function () {
            return this.length ? this.eq(0) : null;
        },

        last: function () {
            return this.length ? this.eq(this.length - 1) : null;
        },

        find: function (selector) {
            if (!selector) {
                return this;
            } else {
                var elems = new $Obj();
                this.each(function (el) {
                    elems.add($(selector, el));
                });
                return elems;
            }
        },

        add: function (selector, context) {
            var elems = $(selector, context);
            for (var i = 0; i < elems.length; i++) {
                this[this.length++] = elems[i];
            }
            return this;
        },

        each: function (callback) {
            $.each(this, callback);
            return this;
        },

        empty: function () {
            return this.each(function (el) {
                el.innerHTML = '';
            });
        },

        parent: function () {
            var elems = new $Obj();
            this.each(function (el) {
                elems.add(el.parentNode);
            });
            return elems;
        },

        children: function () {
            var elems = new $Obj();
            this.each(function (el) {
                elems.add(el.children);
            });
            return elems;
        },

        clone: function () {
            var elems = new $Obj();
            this.each(function (el) {
                elems.add(el.cloneNode(true));
            });
            return elems;
        },

        remove: function () {
            return this.each(function (el) {
                if (el.parentNode != null) el.parentNode.removeChild(el);
            });
        },

        html: function (html) {
            return 0 in arguments ?
                this.each(function (el) {
                    el.innerHTML = html;
                }) : (0 in this ? this[0].innerHTML : null)
        },

        text: function (text) {
            return 0 in arguments ?
                this.each(function (el) {
                    el.textContent = text;
                }) : (0 in this ? this.textContent : null)
        },

        val: function (value) {
            if (value === undefined) {
                if (this[0].nodeName === 'select') return this[0].options[this[0].selectedIndex].value;
                else return (this[0].value || this[0].getAttribute('value'));
            } else {
                this.each(function (el) {
                    if (el.nodeName === 'select') {
                        for (var j = 0, len2 = el.options.length; j < len2; j++) {
                            if (el.options[j].value === value) {
                                el.options[j].selected = true;
                                break;
                            }
                        }
                    } else if (el.value !== undefined) {
                        el.value = value;
                    } else {
                        el.setAttribute('value', value);
                    }
                });
            }
            return this;
        },

        data: function (key, value) {
            if (value !== undefined) {
                this.each(function (el) {
                    el.dataset[key] = value;
                });
            } else if (key instanceof Object) {
                for (var k in key) {
                    this.data(k, key[k]);
                }
            } else if (this[0]) {
                return this[0].dataset[key];
            }
            return this;
        },

        attr: function (key, value) {
            if (value !== undefined) {
                this.each(function (el) {
                    el.setAttribute(key, value);
                });
            } else if (key instanceof Object) {
                for (var k in key) {
                    this.attr(k, key[k]);
                }
            } else if (this[0]) {
                return this[0].getAttribute(key);
            }
            return this;
        },

        prop: function (key, value) {
            if (value !== undefined) {
                this.each(function (el) {
                    el[key] = value;
                });
            } else if (key instanceof Object) {
                for (var k in key) {
                    this.prop(k, key[k]);
                }
            } else if (this[0]) {
                return this[0][key];
            }
            return this;
        },

        css: function (key, value) {
            if (value !== undefined) {
                value = (value instanceof Function) ? value() : (value instanceof Number ? (value + 'px') : value);
                if (typeof value === 'string' && /^\+=|\-=/.test(value)) {
                    value = (value.charAt(0) === '-') ? -parseFloat(value.substr(2)) : parseFloat(value.substr(2));

                    this.each(function (el) {
                        el.style[key] = parseFloat(el.style[key]) + value + 'px';
                    });
                } else {
                    this.each(function (el) {
                        el.style[key] = value;
                    });
                }
            } else if (key instanceof Object) {
                for (var k in key) {
                    this.css(k, key[k]);
                }
            } else if (this[0]) {
                return this[0].style[key] || window.getComputedStyle(this[0])[key];
            }
            return this;
        },

        show: function () {
            this.css('display', 'block');
        },

        hide: function () {
            this.css('display', 'none');
        },

        toggle: function () {
            return this.each(function (el) {
                var $el = $(el);
                $el.css("display") == "none" ? el.show() : el.hide();
            })
        },

        index: function (element) {
            return element ? indexOf.call(this, $(element)[0]) : indexOf.call(this.parent().children(), this[0]);
        },

        hasClass: function (className) {
            var has = false;
            this.each(function (el) {
                if (el.classList.contains(className)) has = true;
            });
            return has;
        },

        addClass: function (className) {
            return this.each(function (el) {
                el.classList.add(className);
            });
        },

        removeClass: function (className) {
            return this.each(function (el) {
                el.classList.remove(className);
            });
        },

        toggleClass: function (className) {
            return this.each(function (el) {
                el.classList.toggle(className);
            });
        },

        append: function (context) {
            var elems = $(context);
            return this.each(function (el) {
                elems = elems.clone();
                elems.each(function (el2) {
                    el.appendChild(el2);
                });
            });
        },

        appendTo: function (context) {
            $(context).append(this);
            return this;
        },

        prepend: function (context) {
            var elems = $(context);
            return this.each(function (el) {
                elems = elems.clone();
                elems.each(function (el2) {
                    el.insertBefore(el2, el.firstChild);
                });
            });
        },

        prependTo: function (context) {
            $(context).prepend(this);
            return this;
        },

        before: function (context) {
            var elems = $(context);
            return this.each(function (el) {
                elems = elems.clone();
                elems.each(function (el2) {
                    el.parentNode.insertBefore(el2, el.parentNode.firstChild);
                });
            });
        },

        insertBefore: function (context) {
            $(context).before(this);
            return this;
        },

        after: function (context) {
            var elems = $(context);
            return this.each(function (el) {
                elems = elems.clone();
                elems.each(function (el2) {
                    el.parentNode.insertBefore(el2, el.nextSibling);
                });
            });
        },

        insertAfter: function (context) {
            $(context).after(this);
            return this;
        },

        replaceWith: function (context) {
            return this.before(context).remove();
        },

        on: function (eventName, listener) {
            return this.each(function (el) {
                el.addEventListener(eventName, listener);
            });
        },

        off: function (eventName, listener) {
            return this.each(function (el) {
                el.removeEventListener(eventName, listener);
            });
        },

        trigger: function (eventName, data) {
            return this.each(function (el) {
                var event = document.createEvent('HTMLEvents');
                event.data = data;
                event.initEvent(eventName, true, true);
                el.dispatchEvent(event);
            });
        }


    });

    $Obj.prototype.$ = $Obj.prototype.find;

    return $;

})));
