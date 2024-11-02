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

        headings.forEach((heading) => {
          if (nowScrollTop > lastScrollTop) {
            // Add title to visibleHeadings if it's topOffset is less than scrollOffset.
            +heading.getBoundingClientRect().top <= +scrollOffset &&
              visibleHeadings.push(heading);
          } else {
            // Remove title from visibleHeadings if it's topOffset is more than scrollOffset.
            visibleHeadings.length &&
              visibleHeadings.forEach((vHeading) => {
                if (+vHeading.getBoundingClientRect().top > +scrollOffset) {
                  const index = visibleHeadings.indexOf(vHeading);

                  index > -1 && visibleHeadings.splice(index, 1);
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
          const itemHash = decodeURIComponent(item.hash.replace("#", ""));

          // Check visible title if it exists, then add class to table of contents item that matches
          // with visible title and remove class from others.
          activeHeading && itemHash === activeHeading.id
            ? item.parentElement.classList.add("active")
            : item.parentElement.classList.remove("active");
        });
      });
    };

    const schemaHandler = (headings, schema) => {
      if (schema !== true) return;

      const schemaScriptTag = document.createElement("script");
      const schemajson = {
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: document.title,
        description: document.querySelector('meta[name="description"]').content,
        mainEntity: {
          "@type": "ItemList",
          name: "Table of Contents",
          itemListElement: [],
        },
      };

      schemaScriptTag.type = "application/ld+json";
      schemaScriptTag.id = "table-of-contents-schema";

      // Create schema listItem.
      headings.forEach((heading, index) => {
        schemajson.mainEntity.itemListElement.push({
          "@type": "ListItem",
          position: index + 1,
          item: {
            "@type": "WebPageElement",
            name: heading.textContent,
            url: `${window.location.origin}${window.location.pathname}#${heading.id}`,
          },
        });
      });

      schemaScriptTag.innerHTML = JSON.stringify(schemajson);

      // Append schema script tag to head of the web page.
      document.head.appendChild(schemaScriptTag);
    };

    const tocHandler = (options) => {
      let {
        headings,
        excludeHref,
        scroll,
        scrollOffset,
        smoothScroll,
        schema,
      } = options;
      let tocList = "";
      let curLevel = +headings[0].outerHTML.match(/<h([\d]).*>/)[1];

      // Generate unique IDs for headings. Spaces are replaced with underscores. if the ID already
      // exists, a suffix like "_01", "_02", etc. add to headings IDs to get a nuique ID.
      headings.forEach((heading) => {
        const generateUniqueId = () => {
          let text = heading.textContent || "?";
          let baseId = heading.id || text.replace(/\s+/g, "_");
          let count = 1;
          let suffix = "";

          while (document.getElementById(baseId + suffix) !== null) {
            suffix = `_${count < 10 ? "0" + count : count}`;
            count++;
          }

          return baseId + suffix;
        };

        heading.setAttribute("id", generateUniqueId());
      });

      // Build table of contents.
      headings.forEach((heading) => {
        const level = +heading.outerHTML.match(/<h([\d]).*>/)[1];

        if (level > curLevel) {
          // If the heading is at a deeper level than where we are, we open a new nested list.
          tocList += new Array(level - curLevel + 1).join(
            `<ul data-level="${level}">`
          );
        }

        if (level < curLevel) {
          // If the heading is at a shallower level than where we are, we close the list that we opened.
          tocList += new Array(curLevel - level + 1).join("</ul>");
        }

        curLevel = +level;

        // Create table of contents item.
        tocList += `<li><a href="#${heading.id}">${heading.textContent}</a></li>`;
      });

      // Append table of contents to the selector.
      root.innerHTML = tocList;

      root.querySelectorAll("ul").forEach((list) => {
        // Remove duplicate lists that created when we create table of contents. these lists have no
        // item, so we remove them.
        if (+list.parentElement.dataset.level === +list.dataset.level) {
          list.parentElement.innerHTML = list.innerHTML;
        }

        // Append created list to its previous element.
        if (list.previousElementSibling) {
          list.previousElementSibling.appendChild(list);
        }

        list.removeAttribute("data-level");
      });

      // Handle smoothScrolling and changing url when click on table of contents item.
      root.querySelectorAll("li a").forEach((item) => {
        item.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();

          let itemHash = decodeURIComponent(item.hash.replace("#", ""));
          let behavior = smoothScroll === true ? "smooth" : "auto";
          let delay = smoothScroll === true ? 800 : 0;

          document
            .getElementById(itemHash) // Get target heading with table of contents item attribute.
            .scrollIntoView({ behavior }); // Set scrollIntoView behavior according to smoothScroll option.

          excludeHref !== true &&
            setTimeout(() => {
              // Update location hash if excludeHref option is false.
              window.location.hash = item.hash;
            }, delay); // Set delay for update locaion hash if smoothScroll option is true.
        });
      });

      schemaHandler(headings, schema);
      scrollHandler(headings, scroll, scrollOffset);
    };

    let { content, headings } = options || {};

    // Set default value for options.
    let article = document.querySelector(`${content}`) || document.body;
    let heading = article.querySelectorAll(`${headings || "h1,h2,h3"}`);

    // Stop building table of contents, if no heading were found.
    if (!heading.length) {
      console.log(
        "Unfortunately, we couldn't find any heading, so we stopped building the toc."
      );

      delete e.toc;

      return;
    }

    tocHandler({ ...options, headings: heading });

    delete e.toc;
  };

  // Build table of contents with Data Attributes.
  (function () {
    const tocEle = document.querySelector("[data-toc]");

    if (!tocEle) return;

    let options = null;

    try {
      // Convert tocEle dataset to an object if dataset exist.
      options = JSON.parse(tocEle.dataset.toc.replace(/(\w+):/g, '"$1":'));
    } catch (err) {}

    delete tocEle.dataset.toc;

    window.addEventListener("DOMContentLoaded", () => tocEle.toc(options));
  })();
})(HTMLElement.prototype);
