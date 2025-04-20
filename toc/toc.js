/*!
 * Table of Contents JS Plugin - toc.js
 *
 * developed by Hadi Karimi - https://github.com/thehadikarimi/table-of-contents
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
      if (+scrollOffset !== 0 && (!scrollOffset || isNaN(scrollOffset))) {
        scrollOffset = 150;
      }

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
          if (activeHeading && itemHash === activeHeading.id) {
            item.parentElement.classList.add("active");
          } else {
            item.parentElement.classList.remove("active");
          }
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
        headingSelectors,
        excludeHref,
        scroll,
        scrollOffset,
        smoothScroll,
        schema,
      } = options;

      // Generate unique IDs for headings
      headings.forEach((heading) => {
        const generateUniqueId = () => {
          let text = heading.textContent || "?";
          let baseId = heading.id || text.trim().replace(/\s+/g, "_");
          let count = 1;
          let suffix = "";

          while (document.getElementById(baseId + suffix)) {
            suffix = `_${count < 10 ? "0" + count : count}`;
            count++;
          }

          return baseId + suffix;
        };

        heading.setAttribute("id", generateUniqueId());
      });

      // Stack for managing nesting
      const stack = [root];
      const listTag = root.tagName.toLowerCase();

      let currentLevel = 0;

      headings.forEach((heading) => {
        const level = headingSelectors.findIndex((sel) => heading.matches(sel));

        if (level === -1) return;

        // If heading is deeper, create a nested list
        if (level > currentLevel) {
          const lastItem = stack[0].lastElementChild;

          if (lastItem) {
            const newList = document.createElement(listTag);
            lastItem.appendChild(newList);
            stack.unshift(newList);
          }
        } else if (level < currentLevel) {
          stack.splice(0, Math.min(currentLevel - level, stack.length - 1));
        }

        const liEle = document.createElement("li");
        const aEle = document.createElement("a");

        aEle.textContent = heading.textContent;
        aEle.href = `#${heading.id}`;

        liEle.appendChild(aEle);
        stack[0].appendChild(liEle);

        currentLevel = level;
      });

      // Smooth scrolling and optional hash updating
      root.querySelectorAll("li a").forEach((item) => {
        item.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();

          const itemHash = decodeURIComponent(item.hash.replace("#", ""));
          const behavior = smoothScroll === true ? "smooth" : "auto";
          const delay = smoothScroll === true ? 800 : 0;

          document.getElementById(itemHash)?.scrollIntoView({ behavior });

          if (excludeHref !== true) {
            setTimeout(() => {
              window.location.hash = item.hash;
            }, delay);
          }
        });
      });

      schemaHandler(headings, schema);
      scrollHandler(headings, scroll, scrollOffset);
    };

    let { content, headings } = options || {};

    // Set default value for options.
    let article = document.querySelector(`${content}`) || document.body;
    let heading = article.querySelectorAll(`${headings || "h1,h2,h3"}`);
    let headingSelectors = (headings || "h1,h2,h3")
      .split(",")
      .map((h) => h.trim());

    // Stop building table of contents, if no heading were found.
    if (!heading.length) {
      console.error("Unfortunately, we couldn't find any heading.");

      delete e.toc;

      return;
    }

    tocHandler({ ...options, headings: heading, headingSelectors });

    delete e.toc;
  };

  // Build table of contents with Data Attributes.
  (function () {
    const tocEle = document.querySelector("[data-toc]");

    if (!tocEle) return;

    let options = null;
    let optKeys = [
      "content",
      "headings",
      "excludeHref",
      "scroll",
      "scrollOffset",
      "smoothScroll",
      "schema",
    ];

    try {
      let dataToc = tocEle.dataset.toc;
      // Convert tocEle dataset to an object.
      optKeys.forEach((key) => (dataToc = dataToc.replace(key, `"${key}"`)));
      options = JSON.parse(dataToc);
    } catch (err) {}

    window.addEventListener("DOMContentLoaded", () => tocEle.toc(options));
  })();
})(Element.prototype);
