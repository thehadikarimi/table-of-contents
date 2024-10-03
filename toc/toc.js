/*!
 * Table of Contents JS Plugin - toc.js
 *
 * developed by Hadi Karimi - https://github.com/karimi-82hadi/table-of-contents
 *
 * A minimal, flexible JS plugin that will creates a table of contents based on the headings of the web page.
 */

(function (e) {
  "use strict";

  e.toc = function (options) {
    const root = this;

    const scrollHandler = (headings, scroll, scrollOffset) => {
      if (scroll !== true) return;

      // Set default value for scrollOffset if it doesn't exist or it is non-numeric.
      if (+scrollOffset !== 0 && (!scrollOffset || isNaN(scrollOffset)))
        scrollOffset = 150;

      let lastScrollTop = 0;
      let visibleHeadings = [];

      window.addEventListener("scroll", () => {
        let nowScrollTop = window.scrollY;

        headings.forEach((item) => {
          if (nowScrollTop > lastScrollTop) {
            // Add title to visibleHeadings if it's topOffset is less than scrollOffset.
            +item.getBoundingClientRect().top <= +scrollOffset &&
              visibleHeadings.push(item);
          } else {
            // Remove title from visibleHeadings if it's topOffset is more than scrollOffset.
            visibleHeadings.length &&
              visibleHeadings.forEach((vHeading) => {
                if (+vHeading.getBoundingClientRect().top > +scrollOffset) {
                  const index = visibleHeadings.indexOf(vHeading);

                  if (index > -1) {
                    visibleHeadings.splice(index, 1);
                  }
                }
              });
          }

          // Remove duplicate visible title.
          if (visibleHeadings.length) {
            visibleHeadings = [...new Set(visibleHeadings)];
          }
        });

        lastScrollTop = nowScrollTop;

        // Find the last visible title.
        const activeHeading = headings[visibleHeadings.length - 1];

        root.querySelectorAll("li a").forEach((item) => {
          const itemHref = item.dataset.href || decodeURIComponent(item.href);

          // Check visible title if it exists, then add class to list item that matches with
          // visible title and remove class from others.
          activeHeading && itemHref.endsWith(activeHeading.id)
            ? item.parentElement.classList.add("active")
            : item.parentElement.classList.remove("active");
        });
      });
    };

    const tocHandler = (options) => {
      let { headings, excludeHref, scroll, scrollOffset, smoothScroll } =
        options;
      let tocList = "";
      let curLevel = +headings[0].outerHTML.match(/<h([\d]).*>/)[1];
      let listTag = root.tagName;

      // convert type of these options to boolean.
      excludeHref = !!excludeHref;
      scroll = !!scroll;
      smoothScroll = !!smoothScroll;

      // Generate unique IDs for headings. Spaces are replaced with underscores. if the ID already
      // exists, a suffix like "_01", "_02", etc. add to headings IDs to get a nuique ID.
      headings.forEach((item) => {
        const generateUniqueId = () => {
          let text = item.textContent || "?";
          let baseId = item.id ? item.id : text.replace(/\s+/g, "_");
          let count = 1;
          let suffix = "";

          while (document.getElementById(baseId + suffix) !== null) {
            suffix = `_${count < 10 ? "0" + count : count}`;
            count++;
          }

          return baseId + suffix;
        };

        item.setAttribute("id", generateUniqueId());
      });

      // Build table of contents.
      headings.forEach((item) => {
        const level = +item.outerHTML.match(/<h([\d]).*>/)[1];
        const hrefHandler = () => {
          return excludeHref !== true
            ? `href="#${item.id}"`
            : `href="#" data-href="${item.id}"`;
        };

        if (level > curLevel) {
          // If the heading is at a deeper level than where we are, we open a new nested list.
          tocList += new Array(level - curLevel + 1).join(
            `<${listTag} data-level="${level}">`
          );
        }

        if (level < curLevel) {
          // If the heading is at a shallower level than where we are, we close the list that we opened.
          tocList += new Array(curLevel - level + 1).join(`</${listTag}>`);
        }

        curLevel = +level;

        // Create the list item.
        tocList += `<li><a ${hrefHandler()}>${item.textContent}</a></li>`;
      });

      // Append table of contents to the selector.
      root.innerHTML = tocList;

      root.querySelectorAll(`${listTag}`).forEach((list) => {
        // Remove duplicate lists that created when we create table of contents. these lists have no
        // list item, so we remove them.
        if (+list.parentElement.dataset.level === +list.dataset.level) {
          list.parentElement.innerHTML = list.innerHTML;
        }

        // Append created list to its previous element.
        if (list.previousElementSibling) {
          list.previousElementSibling.appendChild(list);
        }

        list.removeAttribute("data-level");
      });

      scrollHandler(headings, scroll, scrollOffset);

      // Handle smoothScrolling and changing url when click on list item.
      root.querySelectorAll("li a").forEach((item) => {
        item.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();

          let target =
            excludeHref === true
              ? item.dataset.href
              : decodeURIComponent(item.hash.replace("#", ""));
          let behavior = smoothScroll === true ? "smooth" : "auto";
          let delay = smoothScroll === true ? 800 : 0;

          document
            .getElementById(target) // Get target heading with table of contents item attribute.
            .scrollIntoView({ behavior }); // Set scrollIntoView behavior according to smoothScroll option.

          excludeHref !== true &&
            setTimeout(() => {
              // Update location hash if excludeHref option is false.
              window.location.hash = item.hash;
            }, delay); // Set delay for update locaion hash if smoothScroll option is true.
        });
      });
    };

    let { content, headings } = options ? options : {};

    // Set default value for options when they don't exist.
    if (!content) content = "body";
    if (!headings) headings = "h1,h2,h3";

    // Set content default value if it's undefined or null.
    let article = document.querySelector(`${content}`) || document.body;
    let heading = article.querySelectorAll(`${headings}`);

    // Stop building table of contents, if no heading were found.
    if (!heading.length) {
      console.log(
        "Unfortunately, we couldn't find any heading, so we stopped building the toc."
      );
      return delete e.toc;
    }

    tocHandler({ ...options, headings: heading });

    delete e.toc;
  };

  // Data Attributes.
  (function () {
    const tocEle = document.querySelector("[data-toc]");

    if (!tocEle) return;

    const {
      toc: content,
      tocHeadings: headings,
      tocExcludehref: excludeHref,
      tocScroll: scroll,
      tocScrolloffset: scrollOffset,
      tocSmoothscroll: smoothScroll,
    } = tocEle.dataset;

    // Delete selector datasets after store them. It doesn't affect the main datasets that you've defined.
    for (let i in tocEle.dataset) {
      delete tocEle.dataset[i];
    }

    window.onload = () => {
      tocEle.toc({
        content,
        headings,
        excludeHref,
        scroll,
        scrollOffset,
        smoothScroll,
      });
    };
  })();
})(HTMLElement.prototype);
