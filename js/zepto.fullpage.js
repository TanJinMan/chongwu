/*!
 * zepto.fullpage.js v0.5.0 (https://github.com/yanhaijing/zepto.fullpage)
 * API https://github.com/yanhaijing/zepto.fullpage/blob/master/doc/api.md
 * Copyright 2014 yanhaijing. All Rights Reserved
 * Licensed under MIT (https://github.com/yanhaijing/zepto.fullpage/blob/master/LICENSE)
 */
(function($, window, undefined) {
    if (typeof $ === 'undefined') {
        throw new Error('zepto.fullpage\'s script requires Zepto');
    }
    var fullpage = null;
    var d = {
        page: '.section',
        //每屏的选择符，默认是.page
        start: 0,
        // 从第几屏开始，默认是第一屏
        duration: 500,
        //每屏动画切换的时间，这段时间内，不能重复切换，默认是500ms，这里只是js限制，css动画时间需要更改css文件
        loop: false,
        //是否开启循环滚动，默认false
        drag: false,
        //是否开启拖动功能，默认关闭
        dir: 'v',
        //切换屏幕的方向，默认垂直方向(v|h)。v表示垂直方向,portrait 竖屏 landscape 横屏
        der: 0.1,
        //当滑动距离大于一个值时，才会引起滑动现象，滑动距离=der*屏幕高度|宽度，默认值为0.1
        change: function(data) {},
        beforeChange: function(data) {},
        afterChange: function(data) {},
        /*
         * beforeChange事件的事件对象e包含两个属性next和cur，分别表示当前屏和将要切换的下一屏。
         * change/afterChange的事件对象e包含两个属性prev和cur，表示前一屏和当前屏
         * （和beforeChange的区别就是此时切换已经发生了，且不可逆转）。
         */
        orientationchange: function(orientation) {}
        //orientationchange 当屏幕发生旋转时的回调
    };

    function touchmove(e) {
        e.preventDefault();
    }
    
    function fix(cur, pagesLength, loop) {
        if (cur < 0) {
            return !!loop ? pagesLength - 1 : 0;
        }

        if (cur >= pagesLength) {
            return !!loop ? 0 : pagesLength - 1;
        }


        return cur;
    }

    function move($ele, dir, dist) {
        var xPx = '0px', yPx = '0px';
        if(dir === 'v') yPx = dist + 'px';
        else xPx = dist + 'px';
        $ele.css({
            '-webkit-transform' : 'translate3d(' + xPx + ', ' + yPx + ', 0px);',
            'transform' : 'translate3d(' + xPx + ', ' + yPx + ', 0px);'
        });
    }

    function Fullpage($this, option) {
        var o = $.extend(true, {}, d, option);
        this.$this = $this;
        this.curIndex = -1;
        this.o = o;

        this.startY = 0;
        this.movingFlag = false;

        this.$this.addClass('fullPage-wp');
        this.$parent = this.$this.parent();
        this.$pages = this.$this.find(o.page).addClass('fullPage-page fullPage-dir-' + o.dir);
        this.pagesLength = this.$pages.length;
        this.update();
        this.initEvent();
        this.start();
    }

    $.extend(Fullpage.prototype, {
    	//此方法会重新计算和渲染每屏的高度，当你发现如果每屏的高度有问题时，手动调用下此方法就可以了
        update: function() {
            if (this.o.dir === 'h') {
                this.width = this.$parent.width();
                this.$pages.width(this.width);
                this.$this.width(this.width * this.pagesLength);
            }

            this.height = this.$parent.height();
            this.$pages.height(this.height);

            this.moveTo(this.curIndex < 0 ? this.o.start : this.curIndex);
        },
        initEvent: function() {
            var that = this;
            var $this = this.$this;

            $this.on('touchstart', function(e) {
                if (!that.status) {return 1;}
                //e.preventDefault();
                if (that.movingFlag) {
                    return 0;
                }

                that.startX = e.targetTouches[0].pageX;
                that.startY = e.targetTouches[0].pageY;
            });
            $this.on('touchend', function(e) {
                if (!that.status) {return 1;}
                //e.preventDefault();
                if (that.movingFlag) {
                    return 0;
                }

                var sub = that.o.dir === 'v' ? (e.changedTouches[0].pageY - that.startY) / that.height : (e.changedTouches[0].pageX - that.startX) / that.width;
                var der = (sub > that.o.der || sub < -that.o.der) ? sub > 0 ? -1 : 1 : 0;

                that.moveTo(that.curIndex + der, true);
            });
            if (that.o.drag) {
                $this.on('touchmove', function(e) {
                    if (!that.status) {return 1;}
                    //e.preventDefault();
                    if (that.movingFlag) {
                        that.startX = e.targetTouches[0].pageX;
                        that.startY = e.targetTouches[0].pageY;
                        return 0;
                    }

                    var y = e.changedTouches[0].pageY - that.startY;
                    if( (that.curIndex == 0 && y > 0) || (that.curIndex === that.pagesLength - 1 && y < 0) ) y /= 2;
                    var x = e.changedTouches[0].pageX - that.startX;
                    if( (that.curIndex == 0 && x > 0) || (that.curIndex === that.pagesLength - 1 && x < 0) ) x /= 2;
                    var dist = (that.o.dir === 'v' ? (-that.curIndex * that.height + y) : (-that.curIndex * that.width + x));
                    $this.removeClass('anim');
                    move($this, that.o.dir, dist);
                });
            }

            // 翻转屏幕提示
            // ==============================             
            window.addEventListener('orientationchange', function() {
                if (window.orientation === 180 || window.orientation === 0) {
                    that.o.orientationchange('portrait');
                }
                if (window.orientation === 90 || window.orientation === -90) {
                    that.o.orientationchange('landscape');
                }
            }, false);

            window.addEventListener('resize', function() {
                that.update();
            }, false);
        },
		//监控页面触摸，页面的touchmove事件会被阻止掉，默认开启
        holdTouch: function() {
            $(document).on('touchmove', touchmove);
        },
        //释放页面触摸
        unholdTouch: function() {
            $(document).off('touchmove', touchmove);
        },
        //开启切换功能，和stop配合使用。每次调用start时都会调用holdTouch 丰富页面功能，
        //比如到了某页需要点击某个元素后才能到下一页的时候 这个就派上用场了
        start: function() {
            this.status = 1;
            this.holdTouch();
        },
        //关闭切换功能，和start配合使用。每次调用stop时都会调用unholdTouch
        stop: function() {
            this.status = 0;
            this.unholdTouch();
        },
        /*
         *  切换到指定屏，如果指定的屏数大于屏总数或小于0，都会做修正处理 
			该方法接收两个参数： 
			next {Number} 必须 要切换到的屏的索引 
			anim {Bollean} 可省略 是否有动画 默认为没有动画效果
         */
        moveTo: function(next, anim) {
            var that = this;
            var $this = this.$this;
            var cur = this.curIndex;

            next = fix(next, this.pagesLength, this.o.loop);

            if (anim) {
                $this.addClass('anim');
            } else {
                $this.removeClass('anim');
            }

            if (next !== cur) {
                var flag = this.o.beforeChange({
                    next: next,
                    cur: cur
                });

                // beforeChange 显示返回false 可阻止滚屏的发生
                if (flag === false) {
                    return 1;
                }
            }

            this.movingFlag = true;
            this.curIndex = next;
            move($this, this.o.dir, -next * (this.o.dir === 'v' ? this.height : this.width));

            if (next !== cur) {
                this.o.change({
                    prev: cur,
                    cur: next
                });
            }

            window.setTimeout(function() {
                that.movingFlag = false;
                if (next !== cur) {
                    that.o.afterChange({
                        prev: cur,
                        cur: next
                    });
                    that.$pages.removeClass('cur').eq(next).addClass('cur');
                }
            }, that.o.duration);

            return 0;
        },
        //向前一屏
        movePrev: function(anim) {
            this.moveTo(this.curIndex - 1, anim);
        },
        //向后一屏
        moveNext: function(anim) {
            this.moveTo(this.curIndex + 1, anim);
        },
        //获取当前位于第几屏的方法（第一屏的索引为0） return {Number} 当前位于第几屏
        getCurIndex: function () {
            return this.curIndex;
        }
    });

    $.fn.fullpage = function(option) {
        if (!fullpage) {
            fullpage = new Fullpage($(this), option);
        }
        return this;
    };
    $.fn.fullpage.version = '0.5.0';
    //暴露方法
    $.each(['update', 'moveTo', 'moveNext', 'movePrev', 'start', 'stop', 'getCurIndex', 'holdTouch', 'unholdTouch'], function(key, val) {
        $.fn.fullpage[val] = function() {
            if (!fullpage) {
                return 0;
            }
            return fullpage[val].apply(fullpage, arguments);
        };
    });
}(Zepto, window));