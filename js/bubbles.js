/*
 * Bubbles Demo
 * jQuery Plugin
 */

 ;(function() {

   if( typeof jQuery !== 'function' ) {
     return false;
   }

   ;(function($) {

      /*
       *  Define plugin
       */
      $.fn.bubbles = function bubbles( options ) {

        //globals
        var $wrapper          = 'body',
            $scene            = null,
            $collection       = [],
            $bubbleSizeLimit  = 64,
            $bubblingSpeed    = 100,
            $bubblingHoop     = 1,
            $w                = $(window).width(),
            $h                = $(window).height();

        //settings
        var s = $.extend({
            id:               '',
            bubbles:          100,        // number of bubbles to display
            initPositionX:    50,         // bubbles starting point - percentage x
            initPositionY:    50,         // bubbles starting point - percentage y
            minSpeed:         200,        // minimum bubble speed (miliseconds),
            maxSpeed:         10,         // maximum bubble speed (miliseconds),
            minSize:          32,         // min bubble size (px),
            maxSize:          64,         // max bubble size (px),
            delay:            10,         // deley between showing bubbles (miliseconds)
            direction:        'random',   // static mode for direction of movement (random/up)
            bounce:           true,
            afterCreate:      null,
            beforeRemove:     null,
            afterRemove:      null,
        }, options );


        s = filterOptions( s );

        initScene();
        initBubbles();


        function filterOptions( opts ) {

            // max bubble size is 64px
            if( opts.maxSize > $bubbleSizeLimit ) {
                opts.maxSize = $bubbleSizeLimit;
            }

            //merge
            opts.initPosition = [opts.initPositionX, opts.initPositionY];

        return opts;
        }


        function initScene() {

            var sceneResized;

            buildScene();

            // make scene responsive
            $(window).on('resize', function(r) {

                sceneResized = false;

                // update scene size with cute delay
                setTimeout(
                  function() {
                      if( ! sceneResized ) {
                        $w = $(window).width();
                        $h = $(window).height();
                        buildScene();
                        sceneResized = true;
                      }
                  },
                  300
                );

            });
        }


        function buildScene() {

            if( ! $scene ) {

              $scene = $('<div/>', {
                        id:     s.id,
                        style:  'position: relative; overflow: hidden;',
                      });

              $( $wrapper ).html( $scene );
            }

            $scene.css({width: $w + 'px', height: $h + 'px'});
        }


        function initBubbles() {

            var bubble = createBubble();

                for(var i=0; i<s.bubbles; i++) {

                  var _bubble = bubble.clone(true, true),
                      _wrap = $('<div/>', {class: 'wrap'}),
                      size = getBubbleSize(s.minSize, s.maxSize),
                      initPos = findPosition( s.initPosition ),
                      col = getColors();

                  _bubble.attr('data-bubble_id', i);

                  _bubble.css(
                      {
                        width:  size + 'px',
                        height: size + 'px',
                        'border-radius': ( size / 2 ) + 'px',
                        background: 'rgba('+col.r+', '+col.g+', '+col.b+', .9)',
                      });

                  _wrap.css({
                      top:    initPos.y + 'px',
                      left:   initPos.x + 'px',
                      width:  size + 'px',
                      height: size + 'px',
                      position: 'absolute'
                    }).append( _bubble );

                  //add to collection
                  $collection.push( _wrap );

                  if( typeof s.afterCreate === 'function' ) {
                    s.afterCreate( _wrap );
                  }

                }

                var ix = 0;

                ;(function _bubbling() {

                    var _bubble = $collection[ix];

                    $scene.append( _bubble );
                    animateBubble( _bubble );

                    ix++;

                    // create bubble with delay
                    if( ix < s.bubbles ) {
                      setTimeout( _bubbling, s.delay );
                    }

                })();
        }


        function findPosition( position ) {

            var newPosition = {};

            newPosition.x = position[0] === 'random' ? Math.floor( Math.random() * $w + 1 ) : Math.floor( $w * ( position[0] / 100 ) );
            newPosition.y = position[1] === 'random' ? Math.floor( Math.random() * $h + 1 ) : Math.floor( $h * ( position[1] / 100 ) );

        return newPosition;
        }


        function animateBubble( bubbleWrap ) {

            var x             = 0,
                y             = 0,
                bubbleSpeed   = getBubbleSpeed(s.minSpeed, s.maxSpeed),
                dir           = getBubbleDirection( s.direction ), // TODO add geometric
                bounce        = 'initial',
                hold          = null,
                kick          = 1;


            var animate = setInterval(
              function() {

                  if( ! bubbleWrap ) {
                    clearInterval( animate );
                  }

                  if( ! hold ) {

                    if( s.bounce && ! isInViewport( bubbleWrap ) ) {

                        //toggle
                        bounce = bounce == 'initial' ? 'reversed' : 'initial';

                        hold = true; // stop flying

                        _bubbleBounce( bubbleWrap.find('.bubble'), bubbleSpeed );

                        if( dir.agnle !== 0 && dir.angle !== 180 ) {

                            var edge = findBubbleEdge( bubbleWrap );

                            switch( edge ) {
                                case 'top':
                                case 'bottom':
                                      _angle = 360 - (180 + dir.angle);
                                  break;
                                case 'left':
                                case 'right':
                                      _angle = 360 - dir.angle;
                                  break;
                            }

                            dir = getBubbleDirection( s.direction, _angle );
                          }

                          kick = 5;

                    }else {
                      kick = 1;
                    }


                    if( bounce == 'initial' ) {

                      x += dir.x * $bubblingHoop;
                      y += dir.y * $bubblingHoop;

                    } else {

                      x -= dir.x * $bubblingHoop;
                      y -= dir.y * $bubblingHoop;
                    }

                    bubbleWrap.css({
                      transform: 'translate(' + x + 'px, '+ y + 'px)'
                    });
                  }
              },
              bubbleSpeed
            );


            function _bubbleBounce( bubble, bubbleSpeed ) {

                var bouncingTime  = bubbleSpeed * 3,
                    limit         = 0.85,
                    edge          = findBubbleEdge( bubble );

                bubble.css('borderSpacing', 1); // start as quasi value

                bubble.animate(
                  { borderSpacing: limit }, // stop
                  { step: _squize,
                    duration: bouncingTime,
                    complete: function() {
                      _unsquize( $(this) );
                      hold = false; // continue bubble flying (reversed)
                    }
                  },
                  bouncingTime
                );

                function _squize(now, el) {

                  var bubble = $(this),
                      bounce = null;

                      switch( edge ) {

                          case 'top':

                            bounce = - ( bubble.height() * ( 1 - limit ) );
                            bubble.css('transform', 'scaleY('+now+') translateY(' + bounce + 'px )');

                            break;

                          case 'bottom':

                            bounce = bubble.height() * ( 1 - limit );
                            bubble.css('transform', 'scaleY('+now+') translateY(' + bounce + 'px )');

                            break;

                          case 'left':

                            bounce = - ( bubble.width() * ( 1 - limit ) );
                            bubble.css('transform', 'scaleX('+now+') translateX(' + bounce + 'px )');

                            break;

                          case 'right':

                            bounce = bubble.width() * ( 1 - limit );
                            bubble.css('transform', 'scaleX('+now+') translateX(' + bounce + 'px )');

                            break;

                      }
                }

                function _unsquize(bubble) {

                  bubble.css('borderSpacing', 0); // start from 1

                  bubble.animate(
                      { borderSpacing: (1-limit) },
                      { step: function(now, el) {

                        var hop = limit + now;

                        switch( edge ) {

                            case 'top':

                              bubble.css('transform', 'scaleY('+hop+')');

                              break;

                            case 'bottom':

                              bubble.css('transform', 'scaleY('+hop+')');

                              break;

                            case 'left':

                              bubble.css('transform', 'scaleX('+hop+')');

                              break;

                            case 'right':

                              bubble.css('transform', 'scaleX('+hop+')');

                              break;

                        }
                      },
                      duration: bouncingTime * 2,
                    },
                  bouncingTime * 2
                  );
                }

            }

        }


        function isInViewport( bubble ) {

            var rect = bubble[0].getBoundingClientRect();

            return (
                rect.top >= 0 &&
                rect.left >= 0 &&
                rect.bottom <= $h &&
                rect.right <= $w
            );
        }


        function findBubbleEdge( bubble ) {

            var edge = null,
                rect = bubble[0].getBoundingClientRect();

            if( rect.top <= 0 ) { edge = 'top'; }
            if( rect.bottom >= $h ) { edge = 'bottom'; }
            if( rect.left <= 0 ) { edge = 'left'; }
            if( rect.right >= $w ) { edge = 'right'; }

        return edge;
        }


        function getColors() {

            var r = Math.floor( Math.random() * 255 + 1 ),
                g = Math.floor( Math.random() * 255 + 1 ),
                b = Math.floor( Math.random() * 255 + 1 );

        return {r: r, g: g, b: b};
        }


        function getBubbleSpeed(min, max) {

        return Math.floor( Math.random() * (max - min) + min );
        }


        function getBubbleDirection( mode, angle ) {

            var alpha=0;

                angle = typeof angle !== 'undefined' ? angle : null;

            if( ! angle ) {

              switch( mode ) {
                case 'random':  angle = Math.floor( Math.random() * 360 + 1 ); break;
                case 'up':      angle = 270; break;
                default: 0;
              }
            }


            alpha = angle * Math.PI / 180;

        return {x: Math.cos(alpha), y: Math.sin(alpha), angle: angle};
        }


        function createBubble() {

            var bubble = $('<div/>', {
                  class: 'bubble',
                  style: 'position: absolute; cursor: pointer',
                  click: function(c) {
                    c.preventDefault();
                    removeBubble( $(this) );
                  }
                });

        return bubble;
        }


        function removeBubble( bubble ) {

            var toRemove = {
              id: bubble.data('bubble_id'),
              delay: 1
            };

            if( typeof s.beforeRemove === 'function' ) {
              toRemove = s.beforeRemove( bubble, toRemove );
            }

            setTimeout(
              function() {
                bubble.parent().remove();
                $collection.splice(toRemove.id, 1);
              },
              toRemove.delay);
        }


        function getBubbleSize(min, max) {

        return Math.floor( Math.random() * (max - min) + min );
        }


      }


   })(jQuery);

 })();
