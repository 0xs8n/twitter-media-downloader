Twitter / X Image Archiver (Chrome Extension)

This is a small Chrome extension I built to archive all images from a Twitter/X account into a single ZIP file.

Twitter/X doesn’t provide an easy way to download or archive images in bulk. This extension auto-scrolls a profile’s media page, collects all image URLs, and bundles them into one ZIP so you can save everything at once.

What it does

Automatically scrolls through a Twitter/X profile’s Media tab

Collects all image uploads (no videos)

Downloads everything as one ZIP file

Forces original image quality where available

Works entirely locally in your browser (no servers)

What it doesn’t do

❌ Download videos or GIFs

❌ Bypass private, locked, or restricted accounts

❌ Work on tweets you don’t have access to

❌ Guarantee unlimited downloads (very large accounts may need limits)

How it works (high level)

Content script auto-scrolls the /media page

Image URLs are collected from the DOM

Images are fetched in an offscreen document

Everything is zipped using JSZip

A single .zip file is downloaded via Chrome

This is built using Manifest V3, service workers, and an offscreen document to keep ZIP creation reliable.

Installation (manual)

Clone or download this repository

Go to chrome://extensions

Enable Developer mode

Click Load unpacked

Select the project folder

That’s it. The UI will appear when you visit a Twitter/X profile.

How to use

Open a Twitter/X profile

Go to the Media tab (/media)

Click “Find + ZIP”

Wait while it scrolls and collects images

Save the generated ZIP file

You can adjust:

Max number of images

How long it scrolls before stopping

Limits & notes

Very large profiles can be memory heavy

ZIP creation is capped to avoid crashes

Scrolling speed depends on network + X’s loading behavior

Chrome may prompt you to allow multiple downloads (normal)

Why I built this

I wanted a simple way to archive image-only Twitter/X accounts without:

clicking hundreds of images

using sketchy websites

or uploading data to third-party servers

So I made my own.

Disclaimer

This project is for personal and archival use.
Respect copyright, privacy, and Twitter/X’s terms of service.

Credits

ZIP creation powered by JSZip

Built with plain JavaScript and Chrome Extension APIs