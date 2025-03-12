class Snake {
    constructor(selector, options, prefix) {
        this.defaults = {
            adaptiveHeight: false,
            autoplay: false,
            autoplaySpeed: 1000,
            arrows: true,
            asNavFor: null,
            prevArrow: '<button type="button">Previous</button>',
            nextArrow: '<button type="button">Next</button>',
            centerMode: false,
            centerPadding:'0px',
            dots: true,
            draggable: true,
            fade: false,
            focusOnSelect: false,
            infinite: true,
            initialSlide: 0,
            mobileFirst: false,
            pauseOnHover: true,
            responsive: null,
            slidesToShow: 1,
            slidesToScroll: 1,
            speed: 500,
            swipe: true,
            init: function () {},
            beforeChange: function () {},
            afterChange: function () {},
        }
        this.options = {...this.defaults, ...options};
        this.currentOpts = {...this.options}
        this.wrapper = this.div();
        this.elem = selector;
        this.prefix =  prefix || 'snake';
        this.clsSlider = this.prefix + '-slider';
        this.clsInitialized = this.prefix + '-initialized';
        this.clsSlide = this.prefix + '-slide';
        this.clsTrack = this.prefix + '-track';
        this.clsList = this.prefix + '-list';
        this.clsArr = this.prefix + '-arrow';
        this.clsPrev = this.prefix + '-prev';
        this.clsNext = this.prefix + '-next';
        this.clsCloned = this.prefix + '-cloned';
        this.clsCurrent = this.prefix + '-current';
        this.clsDisabled = this.prefix + '-disabled';
        this.clsDots = this.prefix + '-dots';
        this.selDot = '.' + this.prefix + '-dots li';
        this.clsActive = this.prefix + '-active';
        this.untouched = true;
        this.track = {};
        this.list = {};
        this.slides = [];
        this.responsiveRules = null;
        this.lastRule = null;
        this.dotStarts = [];
        this.currentIndex = this.currentOpts.initialSlide;
        this.slideWidth = 0;
        this.trfRegExp = /([-0-9.]+(?=px))/;
        this.posThreshold = 30;
        this.posInit = 0;
        this.posX1 = 0;
        this.posX2 = 0;
        this.posY1 = 0;
        this.posY2 = 0;
        this.posFinal = 0;
        this.isSwipe = false;
        this.isScroll = false;
        this.isAnimating = false;
        this.timeout = 0;
        this.interval = 0;
        this.swipeActionBound = this.swipeAction.bind(this);
        this.swipeEndBound = this.swipeEnd.bind(this);
        this.beforeChange = this.options.beforeChange || function () {};
        this.afterChange = this.options.afterChange || function () {};
        this.sliders = [];
        this.next = false;

        if (typeof selector === 'string') {
            this.elem = this.queryAll(selector);
            for (let i  = 0; i < this.elem.length; i++) {
                new Snake(this.elem[i], options, this.prefix);
            }
        }

        this.init();
    }

    init() {
        const self = this;

        if (!self.elem || !self.elem.children) {
            return;
        }

        if (!Snake.sliders) {
            Snake.sliders = [];
        }
        Snake.sliders.push(self);

        self.orderResponsiveOptions();
        self.buildLayout();
        self.applySettings(true);
        self.watchEvents();
        self.getSyncSliders();
    }

    getSyncSliders() {
        const self = this;
        let opts = self.currentOpts;

        if (!opts.asNavFor) {
            return;
        }
        let navigated = self.queryAll(opts.asNavFor);
        if (!navigated) {
            return;
        }
        setTimeout(function () {
            for (let i = 0; i < navigated.length; i++) {
                for (let j = 0; j < Snake.sliders.length; j++) {
                    if (navigated[i] === Snake.sliders[j].getElem()) {
                        let slider = Snake.sliders[j];
                        self.sliders.push(slider);
                    }
                }
            }
        }, 400);
    }

    sync(ind) {
        for (let i = 0; i < this.sliders.length; i++) {
            this.sliders[i].goTo(ind, this.currentOpts.speed, true);
        }
    }

    onArrowsClick(e) {
        const self = this;

        self.untouched = false;
        if (e.target.closest('.' + self.clsPrev)) {
            let prev = self.getPrev();
            self.next = false;
            self.prev = true;
            self.goTo(prev, self.currentOpts.speed, false);
            self.updateDots(false);
            self.updateArrows(prev);
            return;
        }
        if (e.target.closest('.' + self.clsNext)) {
            self.next = true;
            self.prev = false;
            let next = self.getNext();
            self.goTo(next, self.currentOpts.speed, false);
            self.updateDots(true);
            self.updateArrows(next);
        }
    }

    updateArrows(ind) {
        const self = this;

        if (self.currentOpts.infinite || !self.currentOpts.arrows) {
            return;
        }
        if (ind <= 0) {
            self.prevArr.classList.add(self.clsDisabled);
        } else {
            self.prevArr.classList.remove(self.clsDisabled);
        }
        if (ind >= self.slides.length - self.currentOpts.slidesToShow) {
            self.nextArr.classList.add(self.clsDisabled);
        } else {
            self.nextArr.classList.remove(self.clsDisabled);
        }
    }

    getNext() {
        const self = this;

        let next = self.currentIndex + self.currentOpts.slidesToScroll;
        if (!self.currentOpts.infinite) {
            if (next > (self.slides.length - 1)) {
                next = self.slides.length - 1;
            } else {
                let children = self.track.children;
                let last = parseFloat(children[children.length - 1].dataset.index);
                if (next > last) {
                    next = last;
                }
            }
        }
        return next;
    }

    getPrev() {
        const self = this;
        let prev = self.currentIndex - self.currentOpts.slidesToScroll;

        if (!self.currentOpts.infinite) {
            if (prev < 0) {
                prev = 0;
            }
        }
        return prev;
    }

    autoplay() {
        const self = this;
        let opts = self.currentOpts;
        self.untouched = false;

        self.interval = setInterval(function () {
            let next = self.getNext();
            self.next = true;
            self.prev = false;
            self.goTo(next, opts.speed);
            self.updateDots(true);
            self.updateArrows(next);

        }, opts.autoplaySpeed);
    }

    updateDots(next) {
        const self = this;
        let opts = self.currentOpts;
        if (!opts.dots) {
            return
        }
        let dotsCont = self.elem.querySelector('.' + self.clsDots);
        let active = dotsCont.querySelector('.' + self.clsActive);
        let dots = dotsCont.querySelectorAll('li');
        let ind = self.indOfElem(dotsCont.querySelectorAll('li'), active);
        active.classList.remove(self.clsActive);
        if(self.currentOpts.infinite) {
            if (next) {
                ind+=1;
                if (ind >= dots.length) {
                    ind = 0;
                }
            } else {
                ind-=1;
                if (ind < 0) {
                    ind = dots.length - 1;
                }
            }
        } else {
            if (next) {
                ind+=1;
                if (ind >= dots.length) {
                    ind = dots.length - 1;
                }
            } else {
                ind-=1;
                if (ind <= 0) {
                    ind = 0;
                }
            }
        }
        let sel = 'li:nth-child(' + (ind + 1) + ')';
        dotsCont.querySelector(sel).classList.add(self.clsActive);
    }

    play() {
        this.autoplay(this.currentIndex);
    }

    pause() {
        clearInterval(this.interval);
    }

    goTo(slide, speed, follow) {
        const self = this;

        if (self.isAnimating) {
            return;
        }
        self.isAnimating = true;

        let opts = self.currentOpts;
        let max = self.slides.length;
        let min = self.currentOpts.slidesToShow;
        let last = self.slides.length - min;

        if (!(speed === 0)) {
            speed = opts.speed;
        }

        if (opts.infinite) {
            if (self.currentIndex >= max && self.next) {
                self.goToNext();
                return;
            } else if (self.currentIndex <= min && self.prev) {
                self.goToPrev(0, follow);
                return;
            }
            self.beforeChange(self, self.currentIndex, slide);
            if (!follow) {
                self.sync(slide);
            }
            setTimeout(function () {
                self.afterChange(self, slide);
                self.isAnimating = false;
            }, speed);
            self.currentIndex = slide;
            self.transform(slide + opts.slidesToShow, speed);
            self.markActiveSlides(slide + opts.slidesToShow);
            return;
        }
        self.beforeChange(self, self.currentIndex, slide);

        if (!follow) {
            self.sync(slide);
        }

        self.currentIndex = slide;

        if (slide > last) {
            slide = last;
        } else {
            if (slide < 0) {
                slide = 0;
            }
        }
        self.afterChange(self, self.currentIndex);
        self.transform(slide, opts.speed);
        self.markActiveSlides(slide);
        self.updateArrows(slide);
    }

    markActiveSlides(slide) {
        const self = this;
        let slides = self.track.children;

        for (let i = 0; i < slides.length; i++) {
            slides[i].classList.remove(self.clsActive);
            slides[i].classList.remove(self.clsCurrent);
        }
        if (slides[slide]) {
            slides[slide].classList.add(self.clsCurrent);
        }
        for (let i = slide; i < slide + self.currentOpts.slidesToShow; i++) {
            if (slides[slide]) {
                slides[i].classList.add(self.clsActive);
            }
        }
        if (self.currentOpts.adaptiveHeight) {
            self.checkHeight();
        }
    }

    checkHeight() {
        const self = this;
        let sel = '.' + self.clsSlide + '.' + self.clsActive;
        let activeSlides = self.elem.querySelectorAll(sel);

        if (!activeSlides[0]) {
            return;
        }

        let height = activeSlides[0].clientHeight;

        for (let i = 1; i < activeSlides.length; i++) {
            height = Math.max(height, activeSlides[i].clientHeight);
        }

        self.elem.style.height = height + 'px';
    }

    goToNext(shift, follow) {
        const self = this;
        let opts = self.currentOpts;
        let slides = self.track.children;
        let dataCloned = slides[self.currentIndex+opts.slidesToShow].dataset.cloned;
        let dataClone = slides[self.currentIndex+opts.slidesToShow].dataset.clone;
        let current = parseFloat(dataCloned || dataClone);
        let max = self.slides.length + opts.slidesToShow;
        let newCurrent = undefined;

        for (let i = opts.slidesToShow; i <= max; i++) {
            if (parseFloat(slides[i].dataset.index) === current)  {
                newCurrent = slides[i].dataset.index;
                break;
            }
        }

        self.currentIndex = parseFloat(newCurrent);
        let tr = self.slideWidth*(self.currentIndex + opts.slidesToShow);
        if (shift) {
            tr = tr + shift;
        }
        self.track.style.transition = 'none';
        self.track.style.transform = 'translateX(' + (-tr) + 'px)';

        let next = self.getNext();
        self.beforeChange(self, self.currentIndex, next);
        if (!follow) {
            self.sync(next);
        }
        self.currentIndex = next;

        setTimeout(function () {
            self.track.style.transition = '';
            self.afterChange(self, self.currentIndex);
            self.track.style.transition = 'transform ' + opts.speed + 'ms';
            tr = (self.currentIndex + opts.slidesToShow )*self.slideWidth;
            self.track.style.transform = 'translateX(-' + tr + 'px)';
        }, 12 );

        setTimeout(function () {
            self.isAnimating = false;
        }, opts.speed);

        self.markActiveSlides(self.currentIndex + opts.slidesToShow);
    }

    goToPrev(shift, follow) {
        const self = this;
        let opts = self.currentOpts;
        let slides = self.track.children;

        for (let i = opts.slidesToShow*2; i < slides.length; i++) {
            if (parseFloat(slides[i].dataset.cloned) === self.currentIndex) {
                self.currentIndex = parseFloat(slides[i].dataset.index);
                break;
            }
        }

        let tr = self.slideWidth*(self.currentIndex + opts.slidesToShow);
        if (shift) {
            tr = tr + shift;
        }
        self.track.style.transition = '';
        self.track.style.transform = 'translateX(' + (-tr) + 'px)';

        let next = self.currentIndex + opts.slidesToShow - opts.slidesToScroll;
        if (!follow) {
            self.sync(next);
        }
        self.beforeChange(self, self.currentIndex, next);
        self.markActiveSlides(self.currentIndex + opts.slidesToShow);

        setTimeout(function () {
            self.transform(next, opts.speed);
            self.currentIndex = self.getPrev();
            self.afterChange(self, self.currentIndex);
        }, 10);

        setTimeout(function () {
            self.isAnimating = false;
        }, opts.speed);

        self.markActiveSlides(next);
    }

    transform(ind, speed) {
        const self = this;

        if (speed) {
            self.track.style.transition = 'transform ' + speed + 'ms';
            clearTimeout(self.timeout);
            self.timeout = setTimeout(function () {
                self.isAnimating = false;
            }, speed);
        } else {
            clearTimeout(self.timeout);
            self.track.style.transition = 'none';
        }
        let tr = -ind*self.slideWidth;
        self.track.style.transform = 'translateX(' + tr + 'px)';
    }

    orderResponsiveOptions() {
        const self = this;
        let resp = self.options.responsive;

        if (!resp) {
            return;
        }
        let responsiveOpts = [];
        self.responsiveRules = [];
        let compare = (a, b) => {
            if (a.breakpoint < b.breakpoint) {
                return self.options.mobileFirst ? -1 : 1;
            }
            if (a.breakpoint > b.breakpoint) {
                return self.options.mobileFirst ? 1 : -1;
            }
            return 0;
        };

        for (let i = 0; i < resp.length; i++) {
            if (!(resp[i].breakpoint && resp[i].settings)) {
                resp.splice(i, 1);
            }
            for (let key in resp[i].settings) {
                if (!responsiveOpts.includes(key)) {
                    responsiveOpts.push(key);
                }
            }
        }
        resp = resp.sort(compare);
        self.responsiveRules.push({
            rule: self.options.mobileFirst ? function (ww) {
                return ww < resp[0].breakpoint;
            } : function (ww) {
                return ww > resp[0].breakpoint;
            }
        });
        self.responsiveRules[0].settings = {};
        for (let k = 0; k < responsiveOpts.length; k++) {
            let opt = responsiveOpts[k];
            self.responsiveRules[0].settings[opt] = self.options[opt];
        }

        for (let j = 0; j < resp.length; j++) {
            let func = function (ww) {
                return false;
            }
            if (self.options.mobileFirst) {
                if (j + 1 === resp.length) {
                    func = function(ww) {
                        return resp[j].breakpoint < ww;
                    }
                } else {
                    func = function (ww) {
                        return resp[j].breakpoint < ww && ww < resp[j + 1].breakpoint;
                    }
                }
            } else {
                if (j + 1 === resp.length) {
                    func = function(ww) {
                        return resp[j].breakpoint > ww;
                    }
                } else {
                    func = function (ww) {
                        return resp[j].breakpoint > ww && ww > resp[j + 1].breakpoint;
                    }
                }
            }
            self.responsiveRules.push({rule: func});
            self.responsiveRules[j + 1].settings = {};
            for (let l = 0; l < responsiveOpts.length; l++) {
                let opt = responsiveOpts[l];
                if (resp[j].settings[opt] !== undefined) {
                    self.responsiveRules[j + 1].settings[opt] = resp[j].settings[opt];
                } else {
                    self.responsiveRules[j + 1].settings[opt] = self.options[opt];
                }
            }
        }
    }

    checkDots() {
        const self = this;
        let opts = self.currentOpts;
        let len = self.slides.length;

        if (self.elem.querySelector('.' + self.clsDots)) {
            self.elem.querySelector('.' + self.clsDots).remove();
        }
        if (!self.currentOpts.dots) {
            return;
        }
        let num = (len - opts.slidesToScroll)/opts.slidesToScroll;
        let rounded = Math.ceil(num);
        if (rounded < 2) {
            self.currentOpts.dots = false;
            return;
        }
        let dots = document.createElement('ul');
        dots.classList.add(this.clsDots);

        self.elem.appendChild(dots);

        if (opts.dots) {
            for (let i = 0; i < len; i+=opts.slidesToShow) {
                let dot = document.createElement('li');
                let btn = document.createElement('button');
                dot.appendChild(btn);
                dots.appendChild(dot);
                self.dotStarts.push(i);
            }

            for (let i = 0; i < self.dotStarts.length; i++) {
                let ind = self.currentIndex;
                if (ind >= self.dotStarts[i] && ind < self.dotStarts[i + 1]) {
                    let sel = '.' + self.clsDots + ' li:nth-child(' + 2 + ')';
                    let activeDot = self.elem.querySelector(sel);
                    activeDot.classList.add(self.clsActive);
                    return;
                }
            }
            self.dotStarts.push(Infinity);
        }
    }

    watchEvents() {
        const self = this;

        window.addEventListener("resize", self.debounce(function() {
            self.applySettings(false);
        }));
        self.elem.addEventListener('click', function(e) {
            self.onArrowsClick(e);
            self.onDotsClick(e);
        });
        if (self.currentOpts.swipe) {
            self.list.addEventListener('touchstart', self.swipeStart.bind(self));
            self.list.addEventListener('mousedown', self.swipeStart.bind(self));
        }
        if (self.currentOpts.autoplay && self.currentOpts.pauseOnHover) {
            self.list.addEventListener('mouseenter', self.pause.bind(self));
            self.list.addEventListener('mouseleave', self.play.bind(self));
        }
        document.addEventListener('mousemove', function() {
            this.isSwipe = true;
        });
        self.track.addEventListener('touchstart', function(event) {
            if (event.pointerType === "touch") {
                self.swipeStart.bind(self);
            }
        });
        if (self.currentOpts.focusOnSelect) {
            self.track.addEventListener('click', function(e) {
                setTimeout(function() {
                    self.selectSlide(e);
                },10)
            })
        }
    }

    selectSlide(e) {
        const self = this;
        let opts = self.currentOpts;
        let visible = opts.slidesToShow;
        let next = e.target.closest('.' + self.clsSlide);

        if (self.isSwipe) {
            return;
        }
        if (!next) {
            return;
        }

        next = parseFloat(next.dataset.index);
        let max = self.slides.length + visible;
        self.isAnimating = false;

        if (opts.infinite) {
            if (next > self.currentIndex) {
                if (self.currentIndex > max) {
                    let diff = next - self.currentIndex;
                    let slide = self.currentIndex + visible;
                    let dataCloned = self.track.children[slide].dataset.cloned;
                    let dataClone = self.track.children[slide].dataset.clone;
                    let ind = parseFloat(dataCloned || dataClone);

                    self.transform(ind + visible, 0);
                    self.currentIndex = ind;
                    self.markActiveSlides(ind + visible);
                    self.markActiveSlides(ind + diff + visible);

                    setTimeout(function () {
                        self.transform(ind + diff + visible, opts.speed);
                        self.currentIndex = ind + diff;
                        self.isAnimating = false;
                    }, 10);
                    return;
                }
            }
            self.updateArrows(self.currentIndex);
            self.updateDots(self.currentIndex);
            self.goTo(next, self.currentOpts.speed);
        }
    }

    onDotsClick(e) {
        const self = this;

        if (self.isAnimating) {
            return;
        }

        if (self.currentIndex === self.currentOpts.slidesToShow) {
            self.currentIndex = 0;
        }

        let dot = e.target.closest('.' + self.clsDots + ' li');
        if (!dot) {
            return;
        }

        let dots = self.elem.querySelectorAll(self.selDot);
        let sel = `.${self.clsDots} .${self.clsActive}`;
        let currentDot = self.elem.querySelector(sel);

        currentDot.classList.remove(self.clsActive);
        dot.classList.add(self.clsActive);
        self.goTo(self.dotStarts[self.indOfElem(dots, dot)]);
    }

    buildLayout() {
        const self = this;
        let children = self.elem.children;

        self.elem.classList.add(self.clsSlider);
        self.slides = [...children];
        self.track = self.div(self.clsTrack);
        self.list = self.div(self.clsList);

        for (let i = 0; i < self.slides.length; i++) {
            self.slides[i].classList.add(self.clsSlide);
            self.slides[i].dataset.index = i;
            self.track.appendChild(self.slides[i]);
        }

        self.list.appendChild(self.track);
        self.elem.appendChild(self.list);
        self.elem.classList.add(self.clsInitialized);
        self.slides[self.currentIndex].classList.add(self.clsCurrent);
    }

    applySettings(initially) {

        const self = this;

        this.currentOpts = {...this.options};
        let opts = this.currentOpts;
        let bpChange = false;

        if (self.responsiveRules) {
            let bpSettings = self.getResponsiveOptions();
            for (let key in bpSettings) {
                opts[key] = bpSettings[key];
            }
        }
        let bp = self.getBreakpoint();
        if (bp !== self.lastRule) {
            bpChange = true;
            self.lastRule = bp;
        }

        self.setSingleSlideOpts();
        if (opts.slidesToScroll > opts.slidesToShow) {
            opts.slidesToScroll = opts.slidesToShow;
        }
        if (opts.slidesToShow >= self.slides.length) {
            self.setWidths();
            return
        }
        self.checkArrows();

        if (opts.infinite) {
            self.removeClonedSlides();
            self.addClonedSlides();
        }
        self.setWidths();

        let shift = 0;
        if (initially) {
            shift = opts.initialSlide;
            self.track.style.transform = 'translateX(0px)';
        } else if (self.untouched) {
            shift =  opts.initialSlide;
        } else {
            if (opts.infinite) {
                shift = self.currentIndex;
            }
            self.pause();
        }
        self.isAnimating = false;
        self.goTo(shift, 0);
        self.checkDots();
        self.updateDots(0);

        if (opts.autoplay) {
            if (initially || bpChange) {
                self.autoplay(shift );
            }
        }

        if (opts.adaptiveHeight) {
            self.elem.style.transition = opts.speed + 'ms';
        }

        if (self.currentOpts.centerMode) {
            let margin = self.elem.clientWidth/2 - self.slideWidth/2;
            self.track.style.marginLeft = margin + 'px';
        } else {
            self.track.style.marginLeft = '0';
        }
    }

    getResponsiveOptions() {
        let rules = this.responsiveRules;

        for (let i = 0; i < rules.length; i++) {
            if (rules[i].rule(window.innerWidth)) {
                return rules[i].settings;
            }
        }
    }

    getBreakpoint() {
        let  rules = this.responsiveRules;
        if (!rules) {
            return;
        }

        for (let i = 0; i < rules.length; i++) {
            if (rules[i].rule(window.innerWidth)) {
                return i;
            }
        }
    }

    setSingleSlideOpts() {
        const self = this;
        let opts = self.currentOpts;
        if (self.slides.length < opts.slidesToShow) {
            opts.arrows = false;
            opts.infinite = false;
            opts.draggable = false;
            opts.swipe = false;
            opts.dots = false;
            opts.autoplay = false;
            opts.adaptiveHeight = false;
        }
    }

    setWidths() {
        const self = this
        let opts = self.currentOpts;
        let visible = opts.slidesToShow;
        let sliderW = self.list.clientWidth;
        let slideW = sliderW / visible;
        let slides = self.track.children;
        self.slideWidth = slideW;
        self.track.style.width = slides.length * slideW + 'px';
        for (let i = 0; i < slides.length; i++) {
            slides[i].style.width = slideW + 'px';
        }
        if (opts.centerMode && opts.centerPadding) {
            let padding = parseFloat(opts.centerPadding);
            let slideW = sliderW / visible - padding*2/ visible;
            self.slideWidth = slideW;
            sliderW = slideW * (slides.length - 1)*slideW;
            self.track.style.width = sliderW + 'px';
            for (let i = 0; i < slides.length; i++) {
                slides[i].style.width = slideW + 'px';
            }
        }
    }

    removeClonedSlides() {
        let cloned = this.elem.querySelectorAll('.' + this.clsCloned);
        for (let i = 0; i < cloned.length; i++) {
            cloned[i].remove();
        }
    }

    addClonedSlides() {
        const self = this;
        //5678 |0123 4567 8|012 3456
        let opts = self.currentOpts;
        let slides = self.slides;
        let slidesToShow = opts.slidesToShow;
        let k = slidesToShow;
        for (let i = slides.length - 1; i > slides.length - 1 - slidesToShow; i--) {
            k++;
            let cloneToPrepend = slides[i].cloneNode(true);
            cloneToPrepend.dataset.cloned = i.toString();
            cloneToPrepend.dataset.index = (k - i).toString();
            cloneToPrepend.classList.add(self.clsCloned);
            self.track.prepend(cloneToPrepend);
        }

        for (let j = 0; j < 2; j++) {
            for (let i = 0; i < self.slides.length; i++) {
                let cloneToAppend = slides[i].cloneNode(true);
                cloneToAppend.dataset.cloned = i;
                slides[i].dataset.clone = i;
                cloneToAppend.classList.add(self.clsCloned);
                self.track.appendChild(cloneToAppend);
            }
        }

        let j = -slidesToShow - 1;
        for (let i = 0; i < self.track.children.length; i++) {
            j++
            self.track.children[i].dataset.index = j;
        }
    }

    swipeStart(e)  {
        const self = this;
        self.isSwipe = true;
        if(self.isAnimating) {
            return;
        }

        let opts = self.currentOpts;
        let style = self.track.style.transform;
        self.trans =  self.tr = +style.match(self.trfRegExp)[0];

        let evt = self.getEvent(e);
        self.posInit = self.posX1 = evt.clientX;
        self.posY1 = evt.clientY;
        self.track.style.transition = '';

        if (opts.swipe) {
            self.list.addEventListener('touchmove', self.swipeActionBound);
            self.list.addEventListener('touchend', self.swipeEndBound);
        }
        if (opts.draggable) {
            document.addEventListener('mousemove', self.swipeActionBound);
            document.addEventListener('mouseup', self.swipeEndBound);
        }
    }

    swipeAction(e) {
        const self = this;

        let evt = self.getEvent(e);
        let style = self.track.style.transform;
        let transform = +style.match(self.trfRegExp)[0];

        self.posX2 = self.posX1 - evt.clientX;
        self.posX1 = evt.clientX;

        self.posY2 = self.posY1 - evt.clientY;
        self.posY1 = evt.clientY;

        if (!self.isSwipe && !self.isScroll) {
            let posY = Math.abs(self.posY2);
            if (posY > 7 || self.posX2 === 0) {
                self.isScroll = true;
                self.allowSwipe = false;
            } else if (posY < 7) {
                self.isSwipe = true;
            }
        }
        self.track.style.transition = ''
        self.track.style.transform = `translateX(${transform - self.posX2}px)`;
    }

    swipeEnd() {
        const self = this;
        let opts = self.currentOpts;
        let visible = opts.slidesToShow;
        let max = self.slides.length + visible;
        let min = visible;

        self.isAnimating = true;

        if (opts.swipe) {
            self.list.removeEventListener('touchmove', self.swipeActionBound);
            self.list.removeEventListener('touchend', self.swipeEndBound);
        }
        if (opts.draggable) {
            document.removeEventListener('mouseup', self.swipeEndBound);
            document.removeEventListener('mousemove', self.swipeActionBound);
        }

        self.posFinal = self.posInit - self.posX1;
        self.isScroll = false;
        self.isSwipe = false;

        if (self.posInit === self.posX1) {
            return;
        }

        self.isAnimating = true;

        setTimeout(function () {
            self.isAnimating = false;
        }, opts.speed + 11);

        if (Math.abs(self.posFinal) > self.posThreshold) {
            if (opts.infinite) {
                if (self.posInit < self.posX1) {
                    let current = self.currentIndex;
                    if (self.currentIndex <= min) {
                        self.goToPrev(self.posFinal);
                        return;
                    } else  {
                        let slide = self.getPrev();
                        self.beforeChange(self, current, slide);
                        self.transform(slide + visible, opts.speed);
                        self.currentIndex = slide;
                        self.updateArrows(self.currentIndex);
                        self.updateDots(self.currentIndex);
                        self.markActiveSlides(slide + visible);
                    }
                } else if (self.posInit > self.posX1) {
                    if (self.currentIndex >= max) {
                        self.goToNext(self.posFinal);
                        self.updateArrows(self.currentIndex);
                        self.updateDots(self.currentIndex);
                        return;
                    } else {
                        let slide = self.getNext();
                        self.beforeChange(self, self.currentIndex, slide);
                        self.transform(slide + visible, opts.speed);
                        self.currentIndex = slide;
                        self.markActiveSlides(slide + visible);
                    }
                }
                self.afterChange(self, self.currentIndex);
                self.updateArrows(self.currentIndex);
                self.updateDots(self.currentIndex);
            } else {
                let slide = 0;
                if (self.posInit < self.posX1) {
                    slide = self.getPrev();
                    self.beforeChange(self, self.currentIndex, slide);
                    self.currentIndex = slide;
                    if (slide < 0) {
                        slide = 0;
                    }
                } else {
                    slide = self.getNext();
                    self.beforeChange(self, self.currentIndex, slide);
                    self.currentIndex = slide;
                    let last = self.slides.length - visible;
                    if (slide > last) {
                        slide = last;
                    }
                }
                self.transform(slide, opts.speed);
                self.afterChange(self, self.currentIndex);
                self.updateArrows(self.currentIndex);
                self.markActiveSlides(slide);
            }
        } else {
            self.transform(self.currentIndex, opts.speed);
        }
    }

    checkArrows() {
        const self = this;

        let prev = self.getArrow(self.currentOpts.prevArrow);
        let next = self.getArrow(self.currentOpts.nextArrow);
        prev.classList.add(self.clsArr,  self.clsPrev);
        next.classList.add(self.clsArr,  self.clsNext);

        if (!self.currentOpts.arrows) {
            self.removeArrows();
            return;
        }
        self.removeArrows();

        if (prev) {
            self.elem.prepend(prev);
            self.prevArr = prev;
        }
        if (next) {
            self.elem.append(next);
            self.nextArr = next;
        }
    }

    removeArrows() {
        const self = this;
        let prev = self.elem.querySelector('.' + self.clsPrev);
        let next = self.elem.querySelector('.' + self.clsNext);
        if (prev) {
            prev.remove();
        }
        if (next) {
            next.remove();
        }
    }

    getArrow(arrow) {
        if (this.isHTML(arrow)) {
            return this.elemFromString(arrow);
        } else if (this.isElement(arrow)) {
            return arrow;
        }
    }

    getEvent(e) {
        return (e.type.search('touch') !== -1) ? e.touches[0] : e;
    }

    indOfElem(collection, element) {
        return Array.from(collection).indexOf(element);
    }

    div(cls) {
        let div = document.createElement('div');
        if (cls) {
            div.classList.add(cls);
        }
        return div;
    }

    elemFromString(string) {
        this.wrapper.innerHTML = string;
        return this.wrapper.firstChild;
    }

    isHTML(string) {
        return /<\/?[a-z][\s\S]*>/i.test(string);
    }

    isElement(obj) {
        try {
            return obj instanceof HTMLElement;
        } catch(e) {
            return (typeof obj === "object") &&
                (obj.nodeType === 1) && (typeof obj.style === "object") &&
                (typeof obj.ownerDocument === "object");
        }
    }

    debounce(func) {
        let timer;
        return function(event) {
            if (timer) clearTimeout(timer);
            timer = setTimeout(func,300,event);
        };
    }

    getElem() {
        return this.elem;
    }

    queryAll(selector) {
        return document.querySelectorAll(selector);
    }
}