# Twitter/X Image Archiver

A Chrome extension for archiving all images from a Twitter/X account into a single ZIP file.

## Overview

Twitter/X doesn't provide an easy way to download or archive images in bulk. This extension automatically scrolls through a profile's media page, collects all image URLs, and bundles them into a single ZIP file—saving you from manually downloading hundreds of images.

## Features

✅ **Automatic scrolling** through a Twitter/X profile's Media tab  
✅ **Bulk image collection** from any accessible profile  
✅ **Single ZIP download** with all images included  
✅ **Original quality** images (forces highest resolution)  
✅ **Local processing** — no servers, everything runs in your browser  
✅ **Customizable limits** for image count and scroll duration  

## Limitations

❌ Does not download videos or GIFs  
❌ Cannot bypass private, locked, or restricted accounts  
❌ Only works on tweets you have access to  
❌ Very large accounts may require manual limits to avoid crashes  

## How It Works

1. **Content script** auto-scrolls the `/media` page
2. **Image URLs** are collected from the DOM as they load
3. **Images are fetched** in an offscreen document
4. **ZIP creation** happens using JSZip
5. **Download** triggered via Chrome's download API

Built with Manifest V3, service workers, and offscreen documents for reliable ZIP creation.

## Installation

### Manual Installation

1. Clone or download this repository
2. Open `chrome://extensions` in Chrome
3. Enable **Developer mode** (toggle in top right)
4. Click **Load unpacked**
5. Select the project folder
6. The extension is now installed

## Usage

1. Navigate to any Twitter/X profile
2. Click on the **Media** tab (`/media`)
3. Click the **"Find + ZIP"** button in the extension UI
4. Wait while it scrolls and collects images
5. Save the generated ZIP file when prompted

### Adjustable Settings

- **Max number of images** to collect
- **Scroll duration** before stopping
- Custom download folder (via browser settings)

## Notes & Considerations

- **Memory usage**: Very large profiles (1000+ images) can be memory-intensive
- **ZIP size limits**: ZIP creation is capped to prevent crashes
- **Scrolling speed**: Depends on your network and Twitter/X's loading behavior
- **Download prompts**: Chrome may ask permission for multiple downloads (this is normal)

## Why This Exists

This extension was built to provide a simple, privacy-respecting way to archive image-heavy Twitter/X accounts without:

- Manually saving hundreds of images
- Using unreliable third-party websites
- Uploading your data to external servers

Everything runs locally in your browser.



## Credits

- **ZIP creation** powered by [JSZip](https://stuk.github.io/jszip/)
- Built with vanilla JavaScript and Chrome Extension APIs


---

**Questions or issues?** Feel free to open an issue or submit a pull request.
