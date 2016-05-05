var $start = $("#start"),
    $dotQtyInput = $("#dotQuantity"),
    $engineInput = $("#engine"),
    $propertiesInput = $("#properties"),
    $instructions = $("#instructions"),
    $field = $("#field"),
    $window = $(window),
    $inputs = $("select"),
    inProgress = false,
    tests = {},
    duration, radius, centerX, centerY, dots, rawDots, currentTest,  startingCSS;

/**
 * The goal of this test is to compare how various animation engines perform under pressure, taking relatively common
 * animation tasks and running a lot of them at once to see raw performance. The goal is NOT to figure out the most
 * efficient way to move dots in a starfield pattern.
 *
 * The same code drives everything except the actual tweens themselves. Every test in the "tests"
 * object has 4 properties:
 *
 * 		- milliseconds [boolean] - true if the duration should be defined in milliseconds
 *
 * 		- wrapDot [function] - when each dot <img> is created, it is passed to the wrapDot() method
 * 							   and whatever is returned gets stored in the array of dots to tween. This
 * 							   is useful to improve performance of things like jQuery because
 * 							   instead of passing the dom element to the tween() method (which would require
 * 							   jQuery to then query the dom and wrap the element in an engine-specific object
 * 							   before calling animate() on it), a native object can be used. Basically it lets you
 * 							   cache the dot's wrapper for better performance.
 *
 * 		- tween [function] - This is the core of the whole test. tween() is called for each dot, and the dot is
 * 							 passed as a parameter. The tween() function should set the dot's cssText to the
 * 							 startingCSS value (which just places the dot in the middle of the screen and sets its
 * 							 width/height to 1px) and then after a random delay between 0 and the duration of the tween,
 * 							 it should tween the dot at a random angle, altering either the left/top values or transform
 * 							 translate() values accordingly, and adjust the size to 32px wide/tall using either 
 * 							 width/height or transform:scale(). Then, after the tween is done, it should call the tween()
 * 							 method again for that dot. So the same dot will just continuously tween outward from the
 * 							 center at random angles and at random delay values.
 *
 * 		- stop [function] - This function is called when the user stops the test. The dot is passed as a parameter.
 * 							The function should immediately stop/kill the tween(s) of that dot (or all dots - that's fine too).
 *
 *  - nativeSize [Boolean] - true if the beginning width/height of the image should be its native size
 *                          (typically necessary for transforms, but not when we're animating width/height).
 *
 * I don't claim to be an expert at the various other animation engines out there, so if there are optimizations
 * that could be made to make them run better, please let me know. I tried to keep things as fair as possible.
 **/

//jQuery normal (top/left/width/height)
tests.jquery_normal = {
  milliseconds:true,
  wrapDot:function(dot) {
    return jQuery(dot); //wrap the dot in a jQuery object in order to perform better (that way, we don't need to query the dom each time we tween - we can just call animate() directly on the jQuery object)
  },
  tween:function(dot) {
    var angle = Math.random() * Math.PI * 2;
    dot[0].style.cssText = startingCSS;
    dot.delay(Math.random() * duration).animate({left:Math.cos(angle) * radius + centerX,
                                                 top:Math.sin(angle) * radius + centerY,
                                                 width:32,
                                                 height:32}, duration, "cubicIn", function() { tests.jquery_normal.tween(dot) });
  },
  stop:function(dot) {
    dot.stop(true);
  },
  nativeSize:false
};

//GSAP normal (top/left/width/height)
tests.gsap_normal = {
  milliseconds:false,
  wrapDot:function(dot) {
    return dot; //no wrapping necessary
  },
  tween:function(dot) {
    var angle = Math.random() * Math.PI * 2;
    dot.style.cssText = startingCSS;
    TweenLite.to(dot, duration, {css:{left:Math.cos(angle) * radius + centerX,
                                      top:Math.sin(angle) * radius + centerY,
                                      width:32,
                                      height:32},
                                 delay:Math.random() * duration,
                                 ease:Cubic.easeIn,
                                 overwrite:"none",
                                 onComplete:tests.gsap_normal.tween,
                                 onCompleteParams:[dot]});
  },
  stop:function(dot) {
    TweenLite.killTweensOf(dot);
  },
  nativeSize:false
};

//GSAP transforms (translate()/scale())
tests.gsap_transforms = {
  milliseconds:false,
  wrapDot:function(dot) {
    return dot; //no wrapping necessary
  },
  tween:function(dot) {
    var angle = Math.random() * Math.PI * 2;
    TweenLite.set(dot, {css:{x:0, y:0, scale:0.06}, overwrite:"none"});
    TweenLite.to(dot, duration, {css:{x:(Math.cos(angle) * radius),
                                      y:(Math.sin(angle) * radius),
                                      scaleX:2,
                                      scaleY:2},
                                 delay:Math.random() * duration,
                                 ease:Cubic.easeIn,
                                 overwrite:"none",
                                 onComplete:tests.gsap_transforms.tween,
                                 onCompleteParams:[dot]});
  },
  stop:function(dot) {
    TweenLite.killTweensOf(dot);
  },
  nativeSize:true
};

//Zepto normal (top/left/width/height)
tests.zepto_normal = {
  milliseconds:true,
  wrapDot:function(dot) {
    return Zepto(dot); //wrap the dot in a jQuery object in order to perform better (that way, we don't need to query the dom each time we tween - we can just call animate() directly on the jQuery object)
  },
  tween:function(dot) {
    var angle = Math.random() * Math.PI * 2;
    dot[0].style.cssText = startingCSS;
    //Zepto's delay feature performs TERRIBLY under pressure, so we use a setTimeout() instead to improve performance.
    setTimeout(function() {
      if (!dot.isKilled) { //Zepto doesn't have a feature that allows us to kill tweens, so we simply set our own "isKilled" property to true when the tween is supposed to be killed and then stop the recursion thereafter which gives us a somewhat similar effect.
        dot.animate({left:Math.cos(angle) * radius + centerX,
                     top:Math.sin(angle) * radius + centerY,
                     width:32,
                     height:32}, duration, "cubic-bezier(0.550, 0.055, 0.675, 0.190)", function() { tests.zepto_normal.tween(dot) });
      }
    }, duration * Math.random());
  },
  stop:function(dot) {
    dot.isKilled = true;
  },
  nativeSize:false
};

//Zepto transforms (translate()/scale())
tests.zepto_transforms = {
  milliseconds:true,
  wrapDot:function(dot) {
    return Zepto(dot); //wrap the dot in a jQuery object in order to perform better (that way, we don't need to query the dom each time we tween - we can just call animate() directly on the jQuery object)
  },
  tween:function(dot) {
    //I couldn't just set the css() reliably with Zepto (it failed), so I was forced to use a zero-duration animate() call. It's fair, though, because we actually do a zero-duration tween for TweenLite too.
    dot.animate({translateX:"0px", translateY:"0px", rotateY:"0rad", rotateX:"0rad", scale:"0.06,0.06"},0);
    //Zepto's delay feature performs TERRIBLY under pressure, so we use a setTimeout() instead to improve performance.
    setTimeout(function() {
      if (!dot.isKilled) { //Zepto doesn't have a feature that allows us to kill tweens, so we simply set our own "isKilled" property to true when the tween is supposed to be killed and then stop the recursion thereafter which gives us a somewhat similar effect.
        var angle = Math.random() * Math.PI * 2;
        dot.animate({translateX:(Math.cos(angle) * radius) + "px",
                     translateY:(Math.sin(angle) * radius) + "px",
                     scale:"2,2",
                     delay:duration * Math.random()}, duration, "cubic-bezier(0.550, 0.055, 0.675, 0.190)", function() { tests.zepto_transforms.tween(dot); });
      }
    }, duration * Math.random());
  },
  stop:function(dot) {
    dot.isKilled = true;
  },
  nativeSize:true
};


function toggleTest() {
  var i, size;
  inProgress = !inProgress;
  if (inProgress) {
    $inputs.prop("disabled", true);
    $field.css({pointerEvents:"none"}); //improve performance - ignore pointer events during animation
    $start.html(" STOP ");
    $start.css({background:"#C00"});
    TweenLite.to($instructions, 0.7, {autoAlpha:0, overwrite:"all"});
    currentTest = tests[$engineInput.val() + "_" + $propertiesInput.val()];
    size = (currentTest.nativeSize ? "16px" : "1px");
    centerX = $field.width() / 2;
    centerY = $field.height() / 2;
    startingCSS = "position:absolute; left:" + centerX + "px; top:" + centerY + "px; width:" + size + "; height:" + size + ";";
    radius = Math.sqrt(centerX * centerX + centerY * centerY);
    duration = currentTest.milliseconds ? 750 : 0.75;
    //we wait a millisecond before creating the dots and starting to animate them so that the UI renders first (making the "start" button say "stop"), otherwise users could be confused when there's a long pause when you choose Zepto and transforms due to the fact that it can take a while for the browser to put all the dots on their own layers.
    setTimeout(function() {
      createDots();
      i = dots.length;
      while (--i > -1) {
        currentTest.tween(dots[i]);
      }
    }, 1);
    
  } else {
    $start.html(" START ");
    $start.css({backgroundColor:"#9af600", background: "linear-gradient(to bottom, #9af600 0%,#71B200 100%"});
    TweenLite.to($instructions, 0.7, {autoAlpha:1, delay:0.2});
    $inputs.prop("disabled", false);
    calibrateInputs();
    $field.css({pointerEvents:"auto"});
    //stop the tweens and remove the dots.
    i = dots.length;
    while (--i > -1) {
      currentTest.stop(dots[i]);
      $field[0].removeChild(rawDots[i]); //removes dot(s)
    }
    dots = null;
    rawDots = null;
  }
}

function createDots() {
  var i = parseInt($dotQtyInput.val()),
      dot;
  dots = [];
  rawDots = [];
  while (--i > -1) {
    dot = document.createElement("img");
    dot.src = "https://s3-us-west-2.amazonaws.com/s.cdpn.io/16327/dot.png";
    dot.width = 1;
    dot.height = 1;
    dot.id = "dot" + i;
    dot.style.cssText = startingCSS;
    $field[0].appendChild(dot);
    rawDots.push(dot);
    dots.push(currentTest.wrapDot(dot));
  }
}

function calibrateInputs(e) {
  if ($engineInput.val() === "jquery") { //jQuery cannot animate transforms without a 3rd party plugin, so disable that option
    $propertiesInput[0].selectedIndex = 0;
    $propertiesInput.prop("disabled", true);
  } else {
    $propertiesInput.prop("disabled", false);
  }
}

$start.click(toggleTest);
$inputs.change(calibrateInputs);

jQuery.easing.cubicIn = $.easing.cubicIn = function(p, n, firstNum, diff) { //we need to add the standard CubicIn ease to jQuery
  return firstNum + p * p * p * diff;
}
jQuery.fx.interval = 16; //ensures that jQuery refreshes at roughly 60fps like GSAP and the others to be more even/fair.
$propertiesInput.prop("disabled", true);