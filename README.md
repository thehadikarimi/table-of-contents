# Table of Contents

A minimal, flexible JavaScript plugin that will creates a table of contents based on the headings of the web page. Useful when you need a table of contents in your site that you want to be easy and flexible to use.

## Usage

This plugin can be used either via HTML5 data attributes or via JavaScript code. See below for the available options.

### Via data attributes

Example without options:

```html
<ul data-toc></ul>
```

Example with options:

```html
<ul data-toc='{ content: "div.content", headings: "h2,h3,h4", schema: true }'></ul>
```

### Via JavaScript code

Example without options:

```html
<ul id="toc-list"></ul>
...
<script>
    window.addEventListener("DOMContentLoaded", () => {
        document.querySelector("#toc-list").toc();
    });
</script>
```

Example with options:

```html
<ul id="toc-list"></ul>
...
<script>
    window.addEventListener("DOMContentLoaded", () => {
        document.querySelector("#toc-list").toc({ content: "div.content", headings: "h2,h3,h4", schema: true });
    });
</script>
```

**Note:**

If this plugin couldn't find any heading in the web page, it stopped building the table of contents.

## Options

### content

Is a string selector where the plugin will look for headings. Defaults to **"body"**.

### headings

Is a string with a comma-separated list of selectors to be used as headings, ordered by their relative hierarchy level. Defaults to **"h1,h2,h3"**.

### excludeHref

This prevent changing url after click on the created table of contents item. Defaults to **false**.

### scroll

When scrolling the **"active"** class is set to the table of contents item, which is currently in focus. Defaults to **false**.

### scrollOffset

This work when `scroll` option is true. It define the offset to trigger the next heading in pixels. Defaults to **150**.

### smoothScroll

Enable or disable smooth scrolling after click on the created table of contents item. Defaults to **false**.

### schema

Add schema for the created table of contents on the web page, which is useful for SEO. Defaults to **false**.
