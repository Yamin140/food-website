$(document).ready(function ($) {
    "use strict";


    var book_table = new Swiper(".book-table-img-slider", {
        slidesPerView: 1,
        spaceBetween: 20,
        loop: true,
        autoplay: {
            delay: 3000,
            disableOnInteraction: false,
        },
        speed: 2000,
        effect: "coverflow",
        coverflowEffect: {
            rotate: 3,
            stretch: 2,
            depth: 100,
            modifier: 5,
            slideShadows: false,
        },
        loopAdditionSlides: true,
        navigation: {
            nextEl: ".swiper-button-next",
            prevEl: ".swiper-button-prev",
        },
        pagination: {
            el: ".swiper-pagination",
            clickable: true,
        },
    });

    var team_slider = new Swiper(".team-slider", {
        slidesPerView: 3,
        spaceBetween: 30,
        loop: true,
        autoplay: {
            delay: 3000,
            disableOnInteraction: false,
        },
        speed: 2000,

        navigation: {
            nextEl: ".swiper-button-next",
            prevEl: ".swiper-button-prev",
        },
        pagination: {
            el: ".swiper-pagination",
            clickable: true,
        },
        breakpoints: {
            0: {
                slidesPerView: 1.2,
            },
            768: {
                slidesPerView: 2,
            },
            992: {
                slidesPerView: 3,
            },
            1200: {
                slidesPerView: 3,
            },
        },
    });

    jQuery(".filters").on("click", function () {
        jQuery("#menu-dish").removeClass("bydefault_show");
    });

    function initMenuFiltering() {
        if (!window.jQuery || !jQuery.fn || typeof jQuery.fn.mixItUp !== "function") return;
        var $container = jQuery("#menu-dish");
        if (!$container.length) return;

        try {
            $container.mixItUp("destroy");
        } catch (e) {
            // ignore
        }

        $container.mixItUp({
            selectors: {
                target: ".dish-box-wp",
                filter: ".filter",
            },
            layout: {
                display: "block",
            },
            animation: {
                effects: "fade",
                easing: "ease-in-out",
            },
            load: {
                filter: ".all",
            },
        });
    }

    window.__initMenuFiltering = initMenuFiltering;

    if (window.__menuInitPending) {
        initMenuFiltering();
        window.__menuInitPending = false;
    } else {
        initMenuFiltering();
    }

    jQuery(".menu-toggle").click(function () {
        jQuery(".main-navigation").toggleClass("toggled");
    });

    jQuery(".header-menu ul li a").click(function () {
        jQuery(".main-navigation").removeClass("toggled");
    });

    gsap.registerPlugin(ScrollTrigger);

    var elementFirst = document.querySelector('.site-header');
    ScrollTrigger.create({
        trigger: "body",
        start: "30px top",
        end: "bottom bottom",

        onEnter: () => myFunction(),
        onLeaveBack: () => myFunction(),
    });

    function myFunction() {
        elementFirst.classList.toggle('sticky_head');
    }

    var scene = $(".js-parallax-scene").get(0);
    var parallaxInstance = new Parallax(scene);
});

jQuery(window).on('load', function () {
    $('body').removeClass('body-fixed');

    function setupMenuFilterActiveBar() {
        // activating tab of filter (works with dynamic filters)
        let targets = document.querySelectorAll(".filter");
        if (!targets || !targets.length) return;

        let activeTab = 0;
        let old = 0;
        let animation;

        for (let i = 0; i < targets.length; i++) {
            if (targets[i].dataset && targets[i].dataset.menuBarBound === "1") continue;
            targets[i].dataset.menuBarBound = "1";
            targets[i].index = i;
            targets[i].addEventListener("click", moveBar);
        }

        // initial position on first === All
        if (window.gsap) {
            gsap.set(".filter-active", {
                x: targets[0].offsetLeft,
                width: targets[0].offsetWidth
            });
        }

        function moveBar() {
            if (this.index != activeTab) {
                if (animation && animation.isActive()) {
                    animation.progress(1);
                }
                animation = gsap.timeline({
                    defaults: {
                        duration: 0.4
                    }
                });
                old = activeTab;
                activeTab = this.index;
                animation.to(".filter-active", {
                    x: targets[activeTab].offsetLeft,
                    width: targets[activeTab].offsetWidth
                });

                animation.to(targets[old], {
                    color: "#0d0d25",
                    ease: "none"
                }, 0);
                animation.to(targets[activeTab], {
                    color: "#fff",
                    ease: "none"
                }, 0);

            }
        }
    }

    window.__setupMenuFilterActiveBar = setupMenuFilterActiveBar;
    setupMenuFilterActiveBar();

    if (window.__menuBarInitPending) {
        setupMenuFilterActiveBar();
        window.__menuBarInitPending = false;
    }
});