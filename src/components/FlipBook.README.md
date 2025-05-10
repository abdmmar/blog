# FlipBook.astro - A Pure CSS Page-Flip Astro Component

Create interactive flipbooks with a realistic page-turning effect in your Astro projects using primarily CSS for the animation. This component leverages the "checkbox hack" technique for a lightweight, JavaScript-free (for animation) experience.

## Features

* **Pure CSS Flip Animation:** Core page-turning effect is driven by CSS transitions and 3D transforms, triggered by hidden checkboxes.
* **Astro Component:** Designed for reusability within Astro projects.
* **Highly Customizable Content:** Uses Astro's named slots to allow any HTML or other Astro components for cover and page content.
* **Dynamic Number of Pages:** Supports a variable number of pages configured via props.
* **Customizable Dimensions:** Book width and height can be easily set.
* **Unique Instance IDs:** Automatically generates unique IDs to allow multiple flipbooks on the same page.
* **Basic Responsiveness:** CSS variables and structure allow for some responsive adjustments.

## Installation

1.  Copy the `FlipBook.astro` file into your Astro project's components directory (e.g., `src/components/FlipBook.astro`).
2.  No external dependencies are required for the core component functionality.

## Usage Example

Create a page in your `src/pages/` directory, for example, `my-interactive-book.astro`:

```astro
---
// src/pages/my-interactive-book.astro
import FlipBook from '../components/FlipBook.astro'; // Adjust path as needed

// Define the pages for your book
const bookPages = [
  { id: 'p1', frontContentSlot: 'page1-front-content', backContentSlot: 'page1-back-content' },
  { id: 'p2', frontContentSlot: 'page2-front-content', backContentSlot: 'page2-back-content' },
  // Add more pages as needed
];
---

<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My Awesome FlipBook</title>
  <style is:global>
    body { margin: 20px; font-family: Arial, sans-serif; background-color: #f4f4f4; display: flex; flex-direction: column; align-items: center;}
    .content-wrapper { padding: 20px; box-sizing: border-box; text-align: center; overflow-y: auto; height: 100%;}
    .cover-style { background-color: #3A5FCD; color: white; display:flex; flex-direction:column; justify-content:center; align-items:center; height:100%; text-align:center;}
    .page-style { background-color: #fff; border: 1px solid #eee; }
    .page-image { max-width: 90%; max-height: 70%; object-fit: contain; margin-top:10px;}
  </style>
</head>
<body>
  <h1>Discover Our FlipBook!</h1>

  <FlipBook
    pages={bookPages}
    coverContentSlot="main-cover"
    bookWidth="320px"
    bookHeight="480px"
  >
    <div slot="main-cover" class="cover-style content-wrapper">
      <h2>The Astro FlipBook Guide</h2>
      <p>An Interactive Journey</p>
    </div>

    <div slot="page1-front-content" class="page-style content-wrapper">
      <h3>Page 1: Front</h3>
      <p>Welcome to the first page!</p>
      <img src="[https://via.placeholder.com/280x200/FFEBCD/000000?text=Image+Here](https://via.placeholder.com/280x200/FFEBCD/000000?text=Image+Here)" alt="Placeholder" class="page-image"/>
    </div>
    <div slot="page1-back-content" class="page-style content-wrapper">
      <h3>Page 1: Back</h3>
      <p>This is the back of the first page.</p>
    </div>

    <div slot="page2-front-content" class="page-style content-wrapper">
      <h3>Page 2: Front</h3>
      <p>Content for the second page can include text, images, or even other components.</p>
    </div>
    <div slot="page2-back-content" class="page-style content-wrapper">
      <h3>Page 2: Back</h3>
      <p>Explore further!</p>
      <img src="[https://via.placeholder.com/280x200/ADD8E6/000000?text=Another+Visual](https://via.placeholder.com/280x200/ADD8E6/000000?text=Another+Visual)" alt="Placeholder" class="page-image"/>
    </div>

    <div slot="backCoverContent" class="cover-style content-wrapper" style="background-color: #444;">
      <h4>The End</h4>
    </div>
  </FlipBook>

  <p style="margin-top: 30px; text-align:center;">Interact with the book above by clicking the cover and page edges.</p>
</body>
</html>

API Reference
Props
The FlipBook.astro component accepts the following props:

Prop	Type	Required	Default	Description
pages	Array<Page>	Yes	-	An array of page objects. See Page object structure below.
coverContentSlot	string	Yes	-	The name of the slot to be used for the front cover's content.
bookWidth	string	No	'298px'	The CSS width of the book (e.g., '300px', '50vw').
bookHeight	string	No	'420px'	The CSS height of the book (e.g., '450px', '70vh').
idPrefix	string	No	'flipbook-instance-' + random_string	An optional prefix for internal IDs. Helps ensure absolute uniqueness if placing flipbooks in iframes etc.
class	string	No	-	Standard HTML class attribute for the outermost container of the flipbook.
...rest	HTMLAttributes<'div'>	No	-	Any other standard HTML attributes will be applied to the outermost container.


Page Object Structure
Each object in the pages array must have the following structure:

Property	Type	Description
id	string	A unique identifier for this page sheet (e.g., 'p1', 'intro').
frontContentSlot	string	The name of the slot for the content of the page's front side.
backContentSlot	string	The name of the slot for the content of the page's back side.


Slots
Slot Name	Description
[coverContentSlot]	Content for the front cover. The name is specified by the coverContentSlot prop.
[frontContentSlot]	Content for the front of a page. Names are specified in the pages array.
[backContentSlot]	Content for the back of a page. Names are specified in the pages array.
backCoverContent	Optional. Content for the static back cover of the book.
