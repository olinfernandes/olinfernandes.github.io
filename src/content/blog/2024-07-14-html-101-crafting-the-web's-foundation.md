---
title: HTML 101 Crafting the Web's Foundation
description: HTML stands for Hypertext Markup Language and is the backbone of web development
pubDate: 2024-07-14T09:11:23.379Z
updateDate: 2024-07-14T09:11:23.379Z
preview: ./images/blog-placeholder-3.jpg
heroImage: ./images/blog-placeholder-3.jpg
draft: false
tags:
  - html
categories:
  - web
type: content
---

HTML stands for Hypertext Markup Language and is the backbone of web development [^1]. It is used to construct the structure and content of web pages. In this post, we'll go over the basics of HTML to help you get started with web programming.

## _What is HTML?_
The markup language HTML consists of items denoted by tags (<>). These tags specify the meaning of the material that wraps around headings, paragraphs, pictures, and links.

## _Basic HTML Structure_

A basic HTML document consists of:

- `<html>`: The root element
- `<head>`: Contains metadata (title, charset, etc.)
- `<body>`: The content of the web page

## _Essential HTML Elements_

| Type       | Syntax                 |
| :--------- | :--------------------- |
| Headings   | `<h1-6>`               |
| Paragraphs | `<p>`                  |
| Images     | `<img>`                |
| Links      | `<a>`                  |
| Lists      | `<ul>`, `<ol>`, `<li>` |

---

## _Example: Basic HTML Page_

```bash
├── website
│   ├── image.jpeg
│   ├── index.html
```

Here's an example of a simple HTML page with common tags:
```html
<!DOCTYPE html>
<html>
<head>
	<title>My First HTML Page</title>
</head>
<body>
	<h1>Welcome to My Page</h1>
	<p>This is a paragraph of text.</p>
	<img src="image.jpeg" alt="An image on my page">
	<a href="https://www.google.com/">Visit Google</a>
  <br>
	<ul>
		<li>Item 1</li>
		<li>Item 2</li>
		<li>Item 3</li>
	</ul>
</body>
</html>
```

_Preview Output:_

![preview_output](<./images/Screenshot 2024-07-14 at 15.55.11.png>)

Congrats!! You now know basic HTML! 👏🏽

---

## _Conclusion_

By going through the fundamentals of HTML, this tutorial offers a strong base upon which to grow. You now understand the fundamentals of using necessary tags and organizing an HTML page. Ahead of time, check out our upcoming post where we'll discuss decorating your web pages with CSS.

---

#### _References_

[^1]: https://medium.com/@rayarlaxman/web-development-basic-concepts-72738f91a711
