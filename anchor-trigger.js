var AnchorTrigger = function(anchors, callback, options){
  var self = this;

  // set default constructor parameters
  options = options || {}

  // set instance attributes
  self.innerSizeFor = {}
  self.fraction = options.fraction !== undefined ? options.fraction : .5;
  self.anchorsQuery = options.query || 'a';
  self.flow = ['top','left'].filter(function(item){return options.flow==item}).lengths || 'top'
  var bindToElement = self.bindToElement = options.bind || window;
  var delay = options.delay || 50;

  self.anchorNames = anchors || []
  self.callback = callback || function(anchor){console.log('No callback given. Current anchor: '+anchor)}
  self.query = self.anchorNames
      .map(function(item){
        return self.anchorsQuery+'[name="'+item+'"]'})
      .join(', ')

  //////////////////////////////////
  
  self.elements = Array.prototype.slice.call( document.querySelectorAll(self.query) );
  self.calculateElementPositions.bind(self)();


  // set default local scope variables

  self.scrollBehavior = self.scrollBehavior.bind(self)
  self.resizeBehavior = self.resizeBehavior.bind(self)
  var throttledScrollBehavior = self.throttle(self.scrollBehavior,delay,{trailling: false});
  var throttledResizeBehavior = self.throttle(self.resizeBehavior,delay,{trailling: false});
  bindToElement.addEventListener('scroll',throttledScrollBehavior);
  bindToElement.addEventListener('resize',throttledResizeBehavior);

  self.resizeBehavior();
  self.scrollBehavior();

}

AnchorTrigger.prototype = {
  now: Date.now || function() {return new Date().getTime();},
  // Throttle function from Underscore JS: 
  // https://github.com/jashkenas/underscore/blob/v1.9.0/underscore.js#L785
  throttle: function(func, wait, options) {
    var self = this
    var timeout, context, args, result;
    var previous = 0;
    if (!options) options = {};

    var later = function() {
      previous = options.leading === false ? 0 : self.now();
      timeout = null;
      result = func.apply(context, args);
      if (!timeout) context = args = null;
    };

    var throttled = function() {
      var now = self.now();
      if (!previous && options.leading === false) previous = now;
      var remaining = wait - (now - previous);
      context = this;
      args = arguments;
      if (remaining <= 0 || remaining > wait) {
        if (timeout) {
          clearTimeout(timeout);
          timeout = null;
        }
        previous = now;
        result = func.apply(context, args);
        if (!timeout) context = args = null;
      } else if (!timeout && options.trailing !== false) {
        timeout = setTimeout(later, remaining);
      }
      return result;
    };

    throttled.cancel = function() {
      clearTimeout(timeout);
      previous = 0;
      timeout = context = args = null;
    };

    return throttled;
  },
  resizeBehavior: function(){
    var self = this;
    self.innerSizeFor.top  = self.bindWidth = self.bindToElement.innerWidth;
    self.innerSizeFor.left = self.bindHeight = self.bindToElement.innerHeight;
  },
  scrollBehavior: function(){
    self = this;
    self.scrollPosition = {
      top: document.body.scrollTop,
      left: document.body.scrollLeft,
    };


    var offset = self.innerSizeFor[self.flow] * self.fraction;
    var nav = self.elementPositions
      .filter(function(element){return element.cumlativePosition[self.flow] - offset <= self.scrollPosition[self.flow]})
      .slice(-1)[0]
    self.callback.call(self,nav)
    // =console.log(elements)
  },
  cumulativeOffset: function(element) {
    var top = 0, left = 0;
    do {
        top += element.offsetTop  || 0;
        left += element.offsetLeft || 0;
        element = element.offsetParent;
    } while(element);

    return {
        top: top,
        left: left
    };
  },
  calculateElementPositions: function(){
    var self = this;

    self.elementPositions = self.elements.map(function(DOMelement){
      return {name: DOMelement.name, element: DOMelement, cumlativePosition: self.cumulativeOffset(DOMelement), scrollPosition: self.scrollPosition }
    })
  },
}

