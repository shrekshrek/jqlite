# jqlite

Jquery类似的库有不少，要么文件太大了，要么功能不合意，最后根据自己需要做的精简版，只考虑移动端的使用环境。  


# API

$(selector|node|function) 默认方法  

静态方法：  
类型判断方法  
$.isObject()  
$.isFunction()  
$.isString()  
$.isNumber()  
$.isBoolean()  
$.isArray()  
$.isDate()  
$.isRegExp()  
$.isElement()  

$.contains(parent, node)  
$.each(elems, callback, context)  

ajax请求方法  
$.getJSON({url:'', success:function});  

$.ajax({url:'', type:'POST|GET', data:{}|'', success:function, error:function});  

实例方法：  
node节点查找方法
$obj.get(index)  
$obj.eq(index)  
$obj.first()  
$obj.last()  
$obj.find(selector)  
$obj.add(selector, context)  
$obj.parent()  
$obj.children()  

$obj.each(callback)  

节点内容操作方法  
$obj.empty()  
$obj.html(value| )  
$obj.text(value| )  
$obj.val(value| )  
$obj.data(key, value)  
$obj.attr(key, value)  
$obj.prop(key, value)  
$obj.css(key, value)  

$obj.width(outer)  
$obj.height(outer)  

$obj.show()  
$obj.hide()  
$obj.toggle()  

$obj.index(index| )  

节点class操作方法  
$obj.hasClass(className)  
$obj.addClass(className)  
$obj.removeClass(className)  
$obj.toggleClass(className)  

节点操作方法  
$obj.clone()  
$obj.remove()  
$obj.append(context)  
$obj.appendTo(context)  
$obj.prepend(context)  
$obj.prependTo(context)  
$obj.before(context)  
$obj.insertBefore(context)  
$obj.after(context)  
$obj.insertAfter(context)  
$obj.replaceWith(context)  

事件方法  
$obj.on(eventName, listener)  
$obj.off(eventName, listener)  
$obj.trigger(eventName, data)  



参考自Jquery，zepto，jqlite。  
https://github.com/jquery/jquery  
https://github.com/madrobby/zepto  
https://github.com/kiltjs/jqlite  
