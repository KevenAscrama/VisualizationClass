//TreeMap object.
var TM = {};

(function() {
var $ = function(d) { return document.getElementById(d); };

$.empty = function() {};

$.lambda = function(value) { 
  return (typeof value == 'function') ? value : function(){
    return value;
  };
};

$.extend = function(original, extended){
    for (var key in (extended || {})) original[key] = extended[key];
    return original;
};

$.splat = function(obj){
    var type = $.type(obj);
    return (type) ? ((type != 'array') ? [obj] : obj) : [];
};

$.type = function(elem) {
  return $.type.s.call(elem).match(/^\[object\s(.*)\]$/)[1].toLowerCase();
};
$.type.s = Object.prototype.toString;

$.each = function(iterable, fn){
  var type = $.type(iterable);
  if(type == 'object') {
    for (var key in iterable) fn(iterable[key], key);
  } else {
    for(var i=0; i < iterable.length; i++) fn(iterable[i], i);
  }
};

$.merge = function(){
    var mix = {};
    for (var i = 0, l = arguments.length; i < l; i++){
        var object = arguments[i];
        if ($.type(object) != 'object') continue;
        for (var key in object){
            var op = object[key], mp = mix[key];
            mix[key] = (mp && $.type(op) == 'object' && $.type(mp) == 'object') ? $.merge(mp, op) : $.unlink(op);
        }
    }
    return mix;
};

$.unlink = function(object){
    var unlinked;
    switch ($.type(object)){
        case 'object':
            unlinked = {};
            for (var p in object) unlinked[p] = $.unlink(object[p]);
        break;
        case 'array':
            unlinked = [];
            for (var i = 0, l = object.length; i < l; i++) unlinked[i] = $.unlink(object[i]);
        break;
        default: return object;
    }
    return unlinked;
};

$.rgbToHex = function(srcArray, array){
    if (srcArray.length < 3) return null;
    if (srcArray.length == 4 && srcArray[3] == 0 && !array) return 'transparent';
    var hex = [];
    for (var i = 0; i < 3; i++){
        var bit = (srcArray[i] - 0).toString(16);
        hex.push((bit.length == 1) ? '0' + bit : bit);
    }
    return (array) ? hex : '#' + hex.join('');
};

$.hexToRgb = function(hex) {
  if(hex.length != 7) {
    hex = hex.match(/^#?(\w{1,2})(\w{1,2})(\w{1,2})$/);
    hex.shift();
    if (hex.length != 3) return null;
    var rgb = [];
    for(var i=0; i<3; i++) {
      var value = hex[i];
      if (value.length == 1) value += value;
      rgb.push(parseInt(value, 16));
    }
    return rgb;
  } else {
    hex = parseInt(hex.slice(1), 16);
    return [
      hex >> 16,
      hex >> 8 & 0xff,
      hex & 0xff
    ];
  }
}

$.destroy = function(elem) {
   $.clean(elem);
   if(elem.parentNode) elem.parentNode.removeChild(elem);
   if(elem.clearAttributes) elem.clearAttributes(); 
};

$.clean = function(elem) {
  for(var ch = elem.childNodes, i=0; i < ch.length; i++) {
      $.destroy(ch[i]);
  }  
};

$.addEvent = function(obj, type, fn) {
    if (obj.addEventListener) 
        obj.addEventListener(type, fn, false);
    else 
        obj.attachEvent('on' + type, fn);
};

$.hasClass = function(obj, klass) {
    return (' ' + obj.className + ' ').indexOf(' ' + klass + ' ') > -1;
};

$.addClass = function(obj, klass) {
    if(!$.hasClass(obj, klass)) obj.className = (obj.className + " " + klass);
};

$.removeClass = function(obj, klass) {
  obj.className = obj.className.replace(new RegExp('(^|\\s)' + klass + '(?:\\s|$)'), '$1');
};

$.getPos = function(elem) {
  if(elem.getBoundingClientRect) {
    var bound = elem.getBoundingClientRect(), html = elem.ownerDocument.documentElement;
    return {
      x: bound.left + html.scrollLeft - html.clientLeft,
      y: bound.top +  html.scrollTop  - html.clientTop
    };
  }
  
  var offset = getOffsets(elem);
  var scroll = getScrolls(elem);
  
  return {x: offset.x - scroll.x, y: offset.y - scroll.y};
  
  function getOffsets(elem) {
    var position = { x: 0, y: 0 };
    while (elem && !isBody(elem)){
      position.x += elem.offsetLeft;
      position.y += elem.offsetTop;
      elem = elem.offsetParent;
    }
    return position;
  }
  
  function getScrolls(elem){
    var position = {x: 0, y: 0};
    while (elem && !isBody(elem)){
      position.x += elem.scrollLeft;
      position.y += elem.scrollTop;
      elem = elem.parentNode;
    }
    return position;
  }

  function isBody(element){
    return (/^(?:body|html)$/i).test(element.tagName);
  }
};

var Class = function(properties){
  properties = properties || {};
  var klass = function(){
      for (var key in this){
          if (typeof this[key] != 'function') this[key] = $.unlink(this[key]);
      }
      this.constructor = klass;
      if (Class.prototyping) return this;
      var instance = (this.initialize) ? this.initialize.apply(this, arguments) : this;
      return instance;
  };
  
  for (var mutator in Class.Mutators){
      if (!properties[mutator]) continue;
      properties = Class.Mutators[mutator](properties, properties[mutator]);
      delete properties[mutator];
  }
  
  $.extend(klass, this);
  klass.constructor = Class;
  klass.prototype = properties;
  return klass;
};

Class.Mutators = {

    Implements: function(self, klasses){
        $.each($.splat(klasses), function(klass){
            Class.prototying = klass;
            var instance = (typeof klass == 'function')? new klass : klass;
            for(var prop in instance) {
              if(!(prop in self)) {
                self[prop] = instance[prop];
              }
            }
            delete Class.prototyping;
        });
        return self;
    }

};

$.extend(Class, {

    inherit: function(object, properties){
        var caller = arguments.callee.caller;
        for (var key in properties){
            var override = properties[key];
            var previous = object[key];
            var type = $.type(override);
            if (previous && type == 'function'){
                if (override != previous){
                    if (caller){
                        override.__parent = previous;
                        object[key] = override;
                    } else {
                        Class.override(object, key, override);
                    }
                }
            } else if(type == 'object'){
                object[key] = $.merge(previous, override);
            } else {
                object[key] = override;
            }
        }

        if (caller) object.parent = function(){
            return arguments.callee.caller.__parent.apply(this, arguments);
        };

        return object;
    },

    override: function(object, name, method){
        var parent = Class.prototyping;
        if (parent && object[name] != parent[name]) parent = null;
        var override = function(){
            var previous = this.parent;
            this.parent = parent ? parent[name] : object[name];
            var value = method.apply(this, arguments);
            this.parent = previous;
            return value;
        };
        object[name] = override;
    }

});


Class.prototype.implement = function(){
    var proto = this.prototype;
    $.each(Array.prototype.slice.call(arguments || []), function(properties){
        Class.inherit(proto, properties);
    });
    return this;
};

var Event = {
  getPos: function(e, win) {
    // get mouse position
    win = win  || window;
    e = e || win.event;
    var doc = win.document;
    doc = doc.html || doc.body;
    var page = {
        x: e.pageX || e.clientX + doc.scrollLeft,
        y: e.pageY || e.clientY + doc.scrollTop
    };
    return page;
  }
};
TM.Util = {
    prune: function(tree, maxLevel) {
        this.each(tree, function(elem, i) {
            if(i == maxLevel && elem.children) {
                delete elem.children;
                elem.children = [];
            }
        });
    },
    getParent: function(tree, id) {
        if(tree.id == id) return false;
        var ch = tree.children;
        if(ch && ch.length > 0) {
            for(var i=0; i<ch.length; i++) {
                if(ch[i].id == id) 
                    return tree;
                else {
                    var ans = this.getParent(ch[i], id);
                    if(ans) return ans;
                }
            }
        }
        return false;       
    },
    getSubtree: function(tree, id) {
        if(tree.id == id) return tree;
        for(var i=0, ch=tree.children; i<ch.length; i++) {
            var t = this.getSubtree(ch[i], id);
            if(t != null) return t;
        }
        return null;
    },
    getLeaves: function (node, maxLevel) {
        var leaves = [], levelsToShow = maxLevel || Number.MAX_VALUE;
        this.each(node, function(elem, i) {
            if(i < levelsToShow && 
            (!elem.children || elem.children.length == 0 )) {
                leaves.push({
                    'node':elem,
                    'level':levelsToShow - i
                });
            }
        });
        return leaves;
    },
    eachLevel: function(tree, initLevel, toLevel, action) {
        if(initLevel <= toLevel) {
            action(tree, initLevel);
            for(var i=0, ch = tree.children; i<ch.length; i++) {
                this.eachLevel(ch[i], initLevel +1, toLevel, action);   
            }
        }
    },
    each: function(tree, action) {
        this.eachLevel(tree, 0, Number.MAX_VALUE, action);
    },
    loadSubtrees: function(tree, controller) {
        var maxLevel = controller.request && controller.levelsToShow;
        var leaves = this.getLeaves(tree, maxLevel),
        len = leaves.length,
        selectedNode = {};
        if(len == 0) controller.onComplete();
        for(var i=0, counter=0; i<len; i++) {
            var leaf = leaves[i], id = leaf.node.id;
            selectedNode[id] = leaf.node;
            controller.request(id, leaf.level, {
                onComplete: function(nodeId, tree) {
                    var ch = tree.children;
                    selectedNode[nodeId].children = ch;
                    if(++counter == len) {
                        controller.onComplete();
                    }
                }
            });
        }
    }
};
var Options = function() {
  var args = Array.prototype.slice.call(arguments);
  for(var i=0, l=args.length, ans={}; i<l; i++) {
    var opt = Options[args[i]];
    if(opt.$extend) {
      $.extend(ans, opt);
    } else {
      ans[args[i]] = opt;  
    }
  }
  return ans;
};
Options.Controller = {
  $extend: true,
  
  onBeforeCompute: $.empty,
  onAfterCompute:  $.empty,
  onCreateLabel:   $.empty,
  onPlaceLabel:    $.empty,
  onComplete:      $.empty,
  onBeforePlotLine:$.empty,
  onAfterPlotLine: $.empty,
  onBeforePlotNode:$.empty,
  onAfterPlotNode: $.empty,
  onCreateElement: $.empty,
  onDestroyElement:$.empty,
  request:         false
};
Options.Tips = {
  $extend: false,
  
  enable: false, // TODO(nico) change allow for enable
  attachToDOM: true,
  attachToCanvas: false,
  offsetX: 20,
  offsetY: 20,
  onShow: $.empty
};

var Extras = {
  initializeExtras: function() {
    var tips = this.config.Tips;
    if(tips) {
      this.tips = new Tips(this);
    }
  }   
};

var Tips = new Class({
  initialize: function(viz) {
    this.viz = viz;
    this.controller = this.config = viz.config;
    // add tooltip
    if(this.config.Tips.enable && document.body) {
        var tip = document.getElementById('_tooltip') || document.createElement('div');
        tip.id = '_tooltip';
        tip.className = 'tip';
        var style = tip.style;
        style.position = 'absolute';
        style.display = 'none';
        style.zIndex = 13000;
        document.body.appendChild(tip);
        this.tip = tip;
        this.node = false;
    }
  },
  
  attach: function(node, elem) {
    if(this.config.Tips.enable) {
      var that = this, cont = this.controller;
      $.addEvent(elem, 'mouseover', function(e){
        cont.Tips.onShow(that.tip, node, elem);
      });
      $.addEvent(elem, 'mouseout', function(e){
          that.tip.style.display = 'none';
      });
      // Add mousemove event handler
      $.addEvent(elem, 'mousemove', function(e, win){
        var pos = Event.getPos(e, win);
        that.setTooltipPosition(pos);
      });
    }
  },

  onClick: $.empty,
  onRightClick: $.empty,
  
  onMousemove: function(node, opt) {
    if(!node) {
      this.tip.style.display = 'none';
      this.node = false;
      return;
    }
    if(!this.node || this.node.id != node.id) {
      this.node = node;
      this.config.Tips.onShow(this.tip, node);
    }
    this.setTooltipPosition(opt.position);
  },
  
  setTooltipPosition: function(pos) {
    var tip = this.tip, style = tip.style, cont = this.config;
    style.display = '';
    // get window dimensions
    win = {
      'height': document.body.clientHeight,
      'width': document.body.clientWidth
    };
    // get tooltip dimensions
    var obj = {
      'width': tip.offsetWidth,
      'height': tip.offsetHeight  
    };
    // set tooltip position
    var x = cont.Tips.offsetX, y = cont.Tips.offsetY;
    style.top = ((pos.y + y + obj.height > win.height)?  
        (pos.y - obj.height - y) : pos.y + y) + 'px';
    style.left = ((pos.x + obj.width + x > win.width)? 
        (pos.x - obj.width - x) : pos.x + x) + 'px';
  }  
});

TM.Base = $.extend({
  layout: {
    orientation: "h",
    vertical: function() { 
      return this.orientation == "v"; 
    },
    horizontal: function() { 
      return this.orientation == "h"; 
    },
    change: function() { 
      this.orientation = this.vertical()? "h" : "v"; 
    }
  },
  
  config: {
    orientation: "h",
    titleHeight: 13,
    rootId: 'infovis',
    offset:4,
    levelsToShow: 3,
    addLeftClickHandler: false,
    addRightClickHandler: false,
    selectPathOnHover: false,
    
    Tips: Options.Tips,
    
    Color: {
      enable: false,
      minValue: -100,
      maxValue: 100,
      minColorValue: [255, 0, 50],
      maxColorValue: [0, 255, 50]
    }     
  },
  

  initialize: function(controller) {
    this.tree = null;
    this.shownTree = null;
    this.controller = this.config = $.merge(Options.Controller,
                    this.config,
                    controller);
    this.rootId = this.config.rootId;
    this.layout.orientation = this.config.orientation;
    // add tips
    this.initializeExtras();
    // purge
    var that = this;
    var fn = function() {
        that.empty();
        if(window.CollectGarbage) window.CollectGarbage();
        delete fn;
    };
    if(window.addEventListener) {
        window.addEventListener('unload', fn, false);
    } else {
        window.attachEvent('onunload', fn);
    }
  },
    each: function(f) {  
    (function rec(elem) {
        if(!elem) return;
        var ch = elem.childNodes, len = ch.length;
        if(len > 0) {
            f.apply(this, [elem, len === 1, ch[0], ch[1]]);
        }
        if (len > 1) {
          for(var chi = ch[1].childNodes, i=0; i<chi.length; i++) {
              rec(chi[i]);
          }
        }  
      })($(this.rootId).firstChild);
    },

  toStyle: function(obj) {
    var ans = "";
    for(var s in obj) ans += s + ":" + obj[s] + ";";
    return ans;
  },

  leaf: function(tree) {
    return tree.children == 0;
  },

  createBox: function(json, coord, html) {
    var box;
    if(!this.leaf(json)) {
      box = this.headBox(json, coord) + this.bodyBox(html, coord);
    } else {
      box = this.leafBox(json, coord);
    }
    return this.contentBox(json, coord, box);
  },
  
  plot: function(json) {
    var coord = json.coord, html = "";
    
    if(this.leaf(json)) 
      return this.createBox(json, coord, null);
    
    for(var i=0, ch=json.children; i<ch.length; i++) {
      var chi = ch[i], chcoord = chi.coord;
      // skip tiny nodes
      if(chcoord.width * chcoord.height > 1) {
        html+= this.plot(chi);  
      }
    } 
    return this.createBox(json, coord, html);
  },


  headBox: function(json, coord) {
    var config = this.config, offst = config.offset;
    var c = {
      'height': config.titleHeight + "px",
      'width': (coord.width - offst) + "px",
      'left':  offst / 2 + "px"
    };
    return "<div class=\"head\" style=\"" + this.toStyle(c) + "\">"
         + json.name + "</div>";
  },

  bodyBox: function(html, coord) {
    var config = this.config,
    th = config.titleHeight,
    offst = config.offset;
    var c = {
      'width': (coord.width - offst) + "px",
      'height':(coord.height - offst - th) + "px",
      'top':   (th + offst / 2) +  "px",
      'left':  (offst / 2) + "px"
    };
    return "<div class=\"body\" style=\""
      + this.toStyle(c) +"\">" + html + "</div>";
  },


  contentBox: function(json, coord, html) {
    var c = {};
    for(var i in coord) c[i] = coord[i] + "px";
    return "<div class=\"content\" style=\"" + this.toStyle(c) 
       + "\" id=\"" + json.id + "\">" + html + "</div>";
  },
  leafBox: function(json, coord) {
    var config = this.config;
    var backgroundColor = config.Color.enable && this.setColor(json), 
    offst = config.offset,
    width = coord.width - offst,
    height = coord.height - offst;
    var c = {
      'top':   (offst / 2)  + "px",
      'height':height + "px",
      'width': width + "px",
      'left': (offst / 2) + "px"
    };
    if(backgroundColor) c['background-color'] = backgroundColor;
    return "<div class=\"leaf\" style=\"" + this.toStyle(c) + "\">" 
        + json.name + "</div>";
  },
  setColor: function(json) {
    var c = this.config.Color,
    maxcv = c.maxColorValue,
    mincv = c.minColorValue,
    maxv = c.maxValue,
    minv = c.minValue,
    diff = maxv - minv,
    x = (json.data.$color - 0);
    // linear interpolation
    var comp = function(i, x) { 
      return Math.round((((maxcv[i] - mincv[i]) / diff) * (x - minv) + mincv[i])); 
    };
    
    return $.rgbToHex([ comp(0, x), comp(1, x), comp(2, x) ]);
  },
  enter: function(elem) {
    this.view(elem.parentNode.id);
  },
    onLeftClick: function(elem) {
        this.enter(elem);
    },
  out: function() {
    var parent = TM.Util.getParent(this.tree, this.shownTree.id);
    if(parent) {
      if(this.controller.request)
        TM.Util.prune(parent, this.config.levelsToShow);
      this.view(parent.id);
    }
  },
    onRightClick: function() {
        this.out();
    },
  view: function(id) {
    var config = this.config, that = this;
    var post = {
      onComplete: function() {
        that.loadTree(id);
        $(config.rootId).focus();
      }
    };

    if (this.controller.request) {
      var TUtil = TM.Util;
      TUtil.loadSubtrees(TUtil.getSubtree(this.tree, id),
               $.merge(this.controller, post));
    } else {
      post.onComplete();
    }
  },
  resetPath: function(tree) {
    var root = this.rootId, previous = this.resetPath.previous;
    this.resetPath.previous = tree || false;
    function getParent(c) { 
        var p = c.parentNode;
        return p && (p.id != root) && p;
     };
     function toggleInPath(elem, remove) {
        if(elem) {
            var container = $(elem.id);
            if(container) {
                var parent = getParent(container);
                while(parent) {
                    elem = parent.childNodes[0];
                    if($.hasClass(elem, 'in-path')) {
                        if(remove == undefined || !!remove) $.removeClass(elem, 'in-path');
                    } else {
                        if(!remove) $.addClass(elem, 'in-path');
                    }
                    parent = getParent(parent);
                }
            }
        }
     };
     toggleInPath(previous, true);
     toggleInPath(tree, false);                
  },
    initializeElements: function() {
      var cont = this.controller, that = this;
      var ff = $.lambda(false);
      this.each(function(content, isLeaf, elem1, elem2) {
          var tree = TM.Util.getSubtree(that.tree, content.id);
          cont.onCreateElement(content, tree, isLeaf, elem1, elem2);

          // eliminate context menu when right clicking
          if(cont.addRightClickHandler) elem1.oncontextmenu = ff;

          // add click handlers
          if(cont.addLeftClickHandler || cont.addRightClickHandler) {
            $.addEvent(elem1, 'mouseup', function(e) {
                var rightClick = (e.which == 3 || e.button == 2);
                if (rightClick) {
                    if(cont.addRightClickHandler) that.onRightClick();
                }                     
                else {
                    if(cont.addLeftClickHandler) that.onLeftClick(elem1);
                } 
                    
                // prevent default
                if (e.preventDefault) 
                    e.preventDefault();
                else 
                    e.returnValue = false;
            });
          }
          
          // add path selection on hovering nodes
          if(cont.selectPathOnHover) {
            $.addEvent(elem1, 'mouseover', function(e){
                if(cont.selectPathOnHover) {
                    if (isLeaf) {
                        $.addClass(elem1, 'over-leaf');
                        // $.addClass(content, 'over-content');
                    }
                    else {
                        $.addClass(elem1, 'over-head');
                        $.addClass(content, 'over-content');
                    }
                    if (content.id) 
                        that.resetPath(tree);
                }
            });
            
            $.addEvent(elem1, 'mouseout', function(e){
                if(cont.selectPathOnHover) {
                    if (isLeaf) {
                        $.removeClass(elem1, 'over-leaf');
                    }
                    else {
                        $.removeClass(elem1, 'over-head');
                        $.removeClass(content, 'over-content');
                    }
                    that.resetPath();
                }
            });
          }
          
          // attach tips
         that.tips.attach(tree, elem1);
      });
    },
    destroyElements: function() {
      if(this.controller.onDestroyElement != $.empty) {
          var cont = this.controller, that = this;
          this.each(function(content, isLeaf, elem1, elem2) {
              cont.onDestroyElement(content, TM.Util.getSubtree(that.tree, content.id), isLeaf, elem1, elem2);
          });
      }  
    },
    empty: function() {
        this.destroyElements();
        $.clean($(this.rootId));
    },
  loadTree: function(id) {
    this.empty();
    this.loadJSON(TM.Util.getSubtree(this.tree, id));
  }
  
}, Extras);
TM.SliceAndDice = new Class({
  Implements: TM.Base,
  loadJSON: function (json) {
    this.controller.onBeforeCompute(json);
    var container = $(this.rootId),
    config = this.config,
    width = container.offsetWidth,
    height = container.offsetHeight;
    
    var p = {
      'coord': {
        'top': 0,
        'left': 0,
        'width':  width,
        'height': height + config.titleHeight + config.offset
      }
    };
    
    if(this.tree == null) this.tree = json;
    this.shownTree = json;
    this.compute(p, json, this.layout.orientation);
    container.innerHTML = this.plot(json);
        this.initializeElements();
    this.controller.onAfterCompute(json);
  },
  compute: function(par, json, orientation) {
    var config = this.config, 
    coord = par.coord,
    offst = config.offset,
    width  = coord.width - offst,
    height = coord.height - offst - config.titleHeight,
    pdata = par.data,
    fact = (pdata && ("$.area" in pdata))? json.data.$area / pdata.$area : 1;
    var otherSize, size, dim, pos, pos2;
    
    var horizontal = (orientation == "h");
    if(horizontal) {
      orientation = 'v';    
      otherSize = height;
      size = Math.round(width * fact);
      dim = 'height';
      pos = 'top';
      pos2 = 'left';
    } else {
      orientation = 'h';    
      otherSize = Math.round(height * fact);
      size = width;
      dim = 'width';
      pos = 'left';
      pos2 = 'top';
    }
    json.coord = {
      'width':size,
      'height':otherSize,
      'top':0,
      'left':0
    };
    var offsetSize = 0, tm = this;
    $.each(json.children, function(elem){
      tm.compute(json, elem, orientation);
      elem.coord[pos] = offsetSize;
      elem.coord[pos2] = 0;
      offsetSize += Math.floor(elem.coord[dim]);
    });
  }
});
TM.Area = {
  loadJSON: function (json) {
    this.controller.onBeforeCompute(json);
    var container = $(this.rootId),
    width = container.offsetWidth,
    height = container.offsetHeight,
    offst = this.config.offset,
    offwdth = width - offst,
    offhght = height - offst - this.config.titleHeight;

    json.coord =  {
      'height': height,
      'width': width,
      'top': 0,
      'left': 0
    };
    var coord = $.merge(json.coord, {
      'width': offwdth,
      'height': offhght
    });

    this.compute(json, coord);
    container.innerHTML = this.plot(json);
    if(this.tree == null) this.tree = json;
    this.shownTree = json;
    this.initializeElements();
    this.controller.onAfterCompute(json);
  },
  computeDim: function(tail, initElem, w, coord, comp) {
    if(tail.length + initElem.length == 1) {
      var l = (tail.length == 1)? tail : initElem;
      this.layoutLast(l, w, coord);
      return;
    }
    if(tail.length >= 2 && initElem.length == 0) {
      initElem = [tail[0]];
      tail = tail.slice(1);
    }
    if(tail.length == 0) {
      if(initElem.length > 0) this.layoutRow(initElem, w, coord);
      return;
    }
    var c = tail[0];
    if(comp(initElem, w) >= comp([c].concat(initElem), w)) {
      this.computeDim(tail.slice(1), initElem.concat([c]), w, coord, comp);
    } else {
      var newCoords = this.layoutRow(initElem, w, coord);
      this.computeDim(tail, [], newCoords.dim, newCoords, comp);
    }
  },
  worstAspectRatio: function(ch, w) {
    if(!ch || ch.length == 0) return Number.MAX_VALUE;
    var areaSum = 0, maxArea = 0, minArea = Number.MAX_VALUE;
    for(var i=0; i<ch.length; i++) {
      var area = ch[i]._area;
      areaSum += area; 
      minArea = (minArea < area)? minArea : area;
      maxArea = (maxArea > area)? maxArea : area; 
    }
    var sqw = w * w, sqAreaSum = areaSum * areaSum;
    return Math.max(sqw * maxArea / sqAreaSum,
            sqAreaSum / (sqw * minArea));
  },
  avgAspectRatio: function(ch, w) {
    if(!ch || ch.length == 0) return Number.MAX_VALUE;
    var arSum = 0;
    for(var i=0; i<ch.length; i++) {
      var area = ch[i]._area;
      var h = area / w;
      arSum += (w > h)? w / h : h / w;
    }
    return arSum / ch.length;
  },
  layoutLast: function(ch, w, coord) {
    ch[0].coord = coord;
  }
  
};
TM.Squarified = new Class({
  Implements: [TM.Base, TM.Area],
  compute: function(json, coord) {
    if (!(coord.width >= coord.height && this.layout.horizontal())) 
      this.layout.change();
    var ch = json.children, config = this.config;
    if(ch.length > 0) {
      this.processChildrenLayout(json, ch, coord);
      for(var i=0; i<ch.length; i++) {
        var chcoord = ch[i].coord,
        offst = config.offset,
        height = chcoord.height - (config.titleHeight + offst),
        width = chcoord.width - offst;
        coord = {
          'width':width,
          'height':height,
          'top':0,
          'left':0
        };
        this.compute(ch[i], coord);
      }
    }
  },
  processChildrenLayout: function(par, ch, coord) {
    // compute children real areas
    var parentArea = coord.width * coord.height;
    var i, totalChArea=0, chArea = [];
    for(i=0; i < ch.length; i++) {
      chArea[i] = parseFloat(ch[i].data.$area);
      totalChArea += chArea[i];
    }
    for(i=0; i<chArea.length; i++) {
      ch[i]._area = parentArea * chArea[i] / totalChArea;
    }
    var minimumSideValue = (this.layout.horizontal())? coord.height : coord.width;
    ch.sort(function(a, b) { return (a._area <= b._area) - (a._area >= b._area); });
    var initElem = [ch[0]];
    var tail = ch.slice(1);
    this.squarify(tail, initElem, minimumSideValue, coord);
  },
  squarify: function(tail, initElem, w, coord) {
    this.computeDim(tail, initElem, w, coord, this.worstAspectRatio);
  },
  
  layoutRow: function(ch, w, coord) {
    if(this.layout.horizontal()) {
      return this.layoutV(ch, w, coord);
    } else {
      return this.layoutH(ch, w, coord);
    }
  },
  
  layoutV: function(ch, w, coord) {
    var totalArea = 0, rnd = Math.round; 
    $.each(ch, function(elem) { totalArea += elem._area; });
    var width = rnd(totalArea / w), top =  0; 
    for(var i=0; i<ch.length; i++) {
      var h = rnd(ch[i]._area / width);
      ch[i].coord = {
        'height': h,
        'width': width,
        'top': coord.top + top,
        'left': coord.left
      };
      top += h;
    }
    var ans = {
      'height': coord.height,
      'width': coord.width - width,
      'top': coord.top,
      'left': coord.left + width
    };
    // take minimum side value.
    ans.dim = Math.min(ans.width, ans.height);
    if(ans.dim != ans.height) this.layout.change();
    return ans;
  },
  
  layoutH: function(ch, w, coord) {
    var totalArea = 0, rnd = Math.round; 
    $.each(ch, function(elem) { totalArea += elem._area; });
    var height = rnd(totalArea / w),
    top = coord.top, 
    left = 0;
    
    for(var i=0; i<ch.length; i++) {
      ch[i].coord = {
        'height': height,
        'width': rnd(ch[i]._area / height),
        'top': top,
        'left': coord.left + left
      };
      left += ch[i].coord.width;
    }
    var ans = {
      'height': coord.height - height,
      'width': coord.width,
      'top': coord.top + height,
      'left': coord.left
    };
    ans.dim = Math.min(ans.width, ans.height);
    if(ans.dim != ans.width) this.layout.change();
    return ans;
  }
});
TM.Strip = new Class({
  Implements: [TM.Base, TM.Area],
  compute: function(json, coord) {
    var ch = json.children, config = this.config;
    if(ch.length > 0) {
      this.processChildrenLayout(json, ch, coord);
      for(var i=0; i<ch.length; i++) {
        var chcoord = ch[i].coord,
        offst = config.offset,
        height = chcoord.height - (config.titleHeight + offst),
        width = chcoord.width - offst;
        coord = {
          'width':width,
          'height':height,
          'top':0,
          'left':0
        };
        this.compute(ch[i], coord);
      }
    }
  },
  processChildrenLayout: function(par, ch, coord) {
    // compute children real areas
    var area = coord.width * coord.height;
    var dataValue = parseFloat(par.data.$area);
    $.each(ch, function(elem) {
      elem._area = area * parseFloat(elem.data.$area) / dataValue;
    });
    var side = (this.layout.horizontal())? coord.width : coord.height;
    var initElem = [ch[0]];
    var tail = ch.slice(1);
    this.stripify(tail, initElem, side, coord);
  },
  stripify: function(tail, initElem, w, coord) {
    this.computeDim(tail, initElem, w, coord, this.avgAspectRatio);
  },
  layoutRow: function(ch, w, coord) {
    if(this.layout.horizontal()) {
      return this.layoutH(ch, w, coord);
    } else {
      return this.layoutV(ch, w, coord);
    }
  },
  
  layoutV: function(ch, w, coord) {
  // TODO(nico): handle node dimensions properly
    var totalArea = 0, rnd = function(x) { return x; }; // Math.round;
    $.each(ch, function(elem) { totalArea += elem._area; });
    var width = rnd(totalArea / w), top =  0; 
    for(var i=0; i<ch.length; i++) {
      var h = rnd(ch[i]._area / width);
      ch[i].coord = {
        'height': h,
        'width': width,
        'top': coord.top + (w - h - top),
        'left': coord.left
      };
      top += h;
    }

    var ans = {
      'height': coord.height,
      'width': coord.width - width,
      'top': coord.top,
      'left': coord.left + width,
      'dim': w
    };
    return ans;
  },
  
  layoutH: function(ch, w, coord) {
    var totalArea = 0, rnd = function(x) { return x; }; // Math.round;
    $.each(ch, function(elem) { totalArea += elem._area; });
    var height = rnd(totalArea / w),
    top = coord.height - height, 
    left = 0;
    
    for(var i=0; i<ch.length; i++) {
      ch[i].coord = {
        'height': height,
        'width': rnd(ch[i]._area / height),
        'top': top,
        'left': coord.left + left
      };
      left += ch[i].coord.width;
    }
    var ans = {
      'height': coord.height - height,
      'width': coord.width,
      'top': coord.top,
      'left': coord.left,
      'dim': w
    };
    return ans;
  }
});

})();    