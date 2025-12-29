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

    window.__refreshBookTableSwiper = function () {
        try {
            if (!book_table) return;
            book_table.update();
            book_table.updateSlides();
            book_table.updateSize();
            if (book_table.pagination && typeof book_table.pagination.render === "function") {
                book_table.pagination.render();
                book_table.pagination.update();
            }
            if (book_table.navigation && typeof book_table.navigation.update === "function") {
                book_table.navigation.update();
            }
        } catch (e) {
            // ignore
        }
    };

    if (window.__bookTableSwiperRefreshPending) {
        window.__refreshBookTableSwiper();
        window.__bookTableSwiperRefreshPending = false;
    }


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

    window.__refreshTeamSwiper = function () {
        try {
            if (!team_slider) return;
            team_slider.update();
            team_slider.updateSlides();
            team_slider.updateSize();
            if (team_slider.pagination && typeof team_slider.pagination.render === "function") {
                team_slider.pagination.render();
                team_slider.pagination.update();
            }
            if (team_slider.navigation && typeof team_slider.navigation.update === "function") {
                team_slider.navigation.update();
            }
        } catch (e) {
            // ignore
        }
    };

    if (window.__teamSwiperRefreshPending) {
        window.__refreshTeamSwiper();
        window.__teamSwiperRefreshPending = false;
    }


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

    var $scrollTopBtn = jQuery(".scrolltop");
    if ($scrollTopBtn.length) {
        $scrollTopBtn.off("click.__scrolltop").on("click.__scrolltop", function (e) {
            e.preventDefault();
            window.scrollTo({ top: 0, left: 0, behavior: "auto" });
        });
    }

    var $navLinks = jQuery(".foody-nav-menu a, .banner-btn a, .food-nav-menu a");
    $navLinks.off("click.__anchorJump").on("click.__anchorJump", function (e) {
        var href = jQuery(this).attr("href");
        if (!href || href.charAt(0) !== "#") return;

        var $target = jQuery(href);
        if (!$target.length) return;

        e.preventDefault();

        var navHeight = jQuery(".site-header").outerHeight() || 0;
        var top = $target.offset().top - navHeight;
        window.scrollTo({ top: top, left: 0, behavior: "auto" });

        if (window.history && typeof window.history.pushState === "function") {
            window.history.pushState(null, "", href);
        } else {
            window.location.hash = href;
        }
    });

    function __extractDriveFileId(url) {
        if (!url || typeof url !== "string") return null;

        var match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
        if (match && match[1]) return match[1];

        match = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
        if (match && match[1]) return match[1];

        match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
        if (match && match[1]) return match[1];

        return null;
    }

    function __normalizeBlogImageUrl(url) {
        var driveId = __extractDriveFileId(url);
        if (driveId) {
            return "https://drive.google.com/uc?export=view&id=" + driveId;
        }
        return url;
    }

    function __escapeHtml(input) {
        return String(input || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/\"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function __openBlogModal(post) {
        var title = post && post.title ? String(post.title) : "";
        var date = post && post.date ? String(post.date) : "";
        var image = post && post.image ? String(post.image) : "";
        var description = post && post.description ? String(post.description) : (post && post.excerpt ? String(post.excerpt) : "");

        var $title = jQuery("#blogModalTitle");
        var $date = jQuery("#blogModalDate");
        var $img = jQuery("#blogModalImage");
        var $desc = jQuery("#blogModalDescription");

        if ($title.length) $title.text(title);
        if ($date.length) $date.text(date);

        var finalImg = image ? __normalizeBlogImageUrl(image) : "";
        if ($img.length) {
            if (finalImg) {
                $img.attr("src", finalImg);
                $img.css("display", "block");
            } else {
                $img.attr("src", "");
                $img.css("display", "none");
            }
        }

        if ($desc.length) {
            $desc.html(__escapeHtml(description));
        }

        var modalEl = document.getElementById("blogDetailsModal");
        if (!modalEl) return;

        if (window.bootstrap && window.bootstrap.Modal) {
            if (typeof window.bootstrap.Modal.getOrCreateInstance === "function") {
                var instance = window.bootstrap.Modal.getOrCreateInstance(modalEl);
                instance.show();
            } else {
                var instanceLegacy = new window.bootstrap.Modal(modalEl);
                instanceLegacy.show();
            }
            return;
        }

        if (window.jQuery && jQuery.fn && typeof jQuery.fn.modal === "function") {
            jQuery(modalEl).modal("show");
        }
    }

    function __renderBlogCards(posts) {
        var $container = jQuery("#blog-cards");
        if (!$container.length) return;

        $container.empty();
        if (!posts || !posts.length) return;

        for (var i = 0; i < posts.length; i++) {
            var post = posts[i] || {};
            var imgUrl = __normalizeBlogImageUrl(post.image);

            var $col = jQuery("<div />", { class: "col-lg-4" });
            var $box = jQuery("<div />", { class: "blog-box" });
            var $img = jQuery("<div />", { class: "blog-img back-img" });
            if (imgUrl) {
                $img.css("background-image", "url(" + imgUrl + ")");
            }
            var $text = jQuery("<div />", { class: "blog-text" });

            if (post.date) {
                $text.append(jQuery("<p />", { class: "blog-date", text: post.date }));
            }
            $text.append(jQuery("<a />", { href: post.url || "#", class: "h4-title", text: post.title || "" }));
            if (post.excerpt) {
                $text.append(jQuery("<p />", { text: post.excerpt }));
            }

            var $readMore = jQuery("<a />", { href: "#", class: "sec-btn", text: post.cta || "Read More" });
            (function (p) {
                $readMore.on("click.__blogReadMore", function (e) {
                    e.preventDefault();
                    __openBlogModal(p);
                });
            })(post);
            $text.append($readMore);

            $box.append($img);
            $box.append($text);
            $col.append($box);
            $container.append($col);
        }
    }

    window.__renderBlogCards = __renderBlogCards;
    window.blogPosts = window.blogPosts || [
        {
            date: "September.15.2025",
            title: "Energy Drink which you can make at home.",
            excerpt: "Blend a small banana with a cup of coconut water, a teaspoon of honey, chia seeds, and a squeeze of lemon or lime. Add ice if you like it chilled, then enjoy immediately for a quick, healthy energy boost.",
            description: "Blend a small banana with a cup of coconut water, a teaspoon of honey, chia seeds, and a squeeze of lemon or lime. Add ice if you like it chilled, then enjoy immediately for a quick, healthy energy boost.",
            image: "assets/images/blog/blog1.jpg",
            url: "#",
            cta: "Read More",
        },
        {
            date: "October.10.2025",
            title: "Fresh Veggie and rice combo for dinner.",
            excerpt: "Cook rice until fluffy, then sauté fresh veggies like bell peppers, carrots, and broccoli with garlic and spices. Mix the veggies into the rice, season with salt, pepper, and a splash of soy sauce or lemon juice, and serve hot for a quick, healthy dinner.",
            description: "Cook rice until fluffy, then sauté fresh veggies like bell peppers, carrots, and broccoli with garlic and spices. Mix the veggies into the rice, season with salt, pepper, and a splash of soy sauce or lemon juice, and serve hot for a quick, healthy dinner.",
            image: "assets/images/blog/blog2.jpg",
            url: "#",
            cta: "Read More",
        },
        {
            date: "November.25.2025",
            title: "Chicken burger with double nuggets",
            excerpt: "For a delicious chicken burger with double nuggets, grill or pan-fry a chicken patty until fully cooked. Toast a burger bun and layer it with lettuce, tomato, and your favorite sauce. Place the cooked chicken patty on the bun, then add two crispy chicken nuggets on top for extra crunch and flavor. Close the bun and serve hot with fries or a side salad for a satisfying meal.",
            description: "For a delicious chicken burger with double nuggets, grill or pan-fry a chicken patty until fully cooked. Toast a burger bun and layer it with lettuce, tomato, and your favorite sauce. Place the cooked chicken patty on the bun, then add two crispy chicken nuggets on top for extra crunch and flavor. Close the bun and serve hot with fries or a side salad for a satisfying meal.",
            image: "assets/images/blog/blog3.jpg",
            url: "#",
            cta: "Read More",
        },
    ];

    __renderBlogCards(window.blogPosts);
});

jQuery(window).on('load', function () {
    $('body').removeClass('body-fixed');

    function setupMenuFilterActiveBar() {
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