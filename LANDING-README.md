# Social Chat Buttons - Multi-Language Landing Page

## Overview
This is a professional, multi-language HTML landing page for the Social Chat Buttons WordPress plugin. The page showcases all plugin features with support for 4 languages.

## Supported Languages
- **English (en)** - Default
- **Persian/Farsi (fa)** - RTL support
- **Arabic (ar)** - RTL support
- **German (de)**

## File Structure
```
├── landing-page.html          # Main HTML page
└── lang/                      # Language files directory
    ├── en.js                  # English translations
    ├── fa.js                  # Persian translations
    ├── ar.js                  # Arabic translations
    ├── de.js                  # German translations
    └── translator.js          # Translation engine
```

## Features
✅ **Multi-language support** - 4 languages (English, Persian, Arabic, German)
✅ **Automatic RTL** - Automatically switches to RTL for Persian and Arabic
✅ **URL parameter support** - Language selection via `?lang=en` parameter
✅ **Language switcher** - Fixed position language selector buttons
✅ **Dynamic Bootstrap CSS** - Automatically loads RTL or LTR Bootstrap
✅ **Clean separation** - All translations in separate language files
✅ **Easy to extend** - Add new languages by creating new JS file

## Usage

### Basic Usage
Upload all files to your server maintaining the directory structure:
```
your-domain.com/
├── landing-page.html
└── lang/
    ├── en.js
    ├── fa.js
    ├── ar.js
    ├── de.js
    └── translator.js
```

### URL Parameters
- Default (English): `https://your-domain.com/landing-page.html`
- Persian: `https://your-domain.com/landing-page.html?lang=fa`
- Arabic: `https://your-domain.com/landing-page.html?lang=ar`
- German: `https://your-domain.com/landing-page.html?lang=de`

### Language Switcher
Users can also click the language buttons in the top-right corner to switch languages dynamically without page reload.

## Adding New Languages

### Step 1: Create Language File
Create a new file in the `lang/` directory (e.g., `lang/es.js` for Spanish):

```javascript
const translations_es = {
    lang: 'es',
    dir: 'ltr', // or 'rtl' for RTL languages
    meta: {
        description: 'Your meta description in Spanish',
        keywords: 'keywords, in, spanish',
        title: 'Page title in Spanish'
    },
    hero: {
        freeBadge: '100% GRATIS - Sin Costos Ocultos',
        title: 'Social Chat Buttons',
        subtitle: 'Plugin profesional...',
        // ... rest of translations
    },
    // ... all other sections
};
```

### Step 2: Update HTML
Add the language file and button to `landing-page.html`:

```html
<!-- In the scripts section -->
<script src="lang/es.js"></script>

<!-- In the language switcher -->
<button class="lang-btn" onclick="changeLanguage('es')">ES</button>
```

### Step 3: Update Translator
Add the new language to the translator in `lang/translator.js`:

```javascript
const AVAILABLE_LANGUAGES = ['en', 'fa', 'ar', 'de', 'es']; // Add 'es'

// In applyTranslations function, add case:
case 'es':
    translations = translations_es;
    break;
```

## Technical Details

### RTL Support
Languages with `dir: 'rtl'` automatically:
- Load Bootstrap RTL CSS
- Set `dir="rtl"` on HTML element
- Use Vazirmatn font (Persian/Arabic optimized)

### LTR Languages
Languages with `dir: 'ltr'` automatically:
- Load standard Bootstrap CSS
- Set `dir="ltr"` on HTML element
- Use Inter font (Latin optimized)

### Translation Keys
All translatable text uses `data-i18n` attributes with dot notation:
- `data-i18n="hero.freeBadge"` → translations.hero.freeBadge
- `data-i18n="features.multiPlatform.title"` → translations.features.multiPlatform.title

### Dynamic Content
Some content is generated dynamically:
- Customization features list (`#customization-features`)
- Platform names (all with `data-i18n` attributes)

## Browser Compatibility
- Chrome 70+
- Firefox 65+
- Safari 12+
- Edge 79+
- All modern mobile browsers

## Dependencies
- Bootstrap 5.3.2 (loaded from CDN)
- Font Awesome 6.5.1 (loaded from CDN)
- Google Fonts: Inter & Vazirmatn (loaded from CDN)

## License
This landing page is part of the Social Chat Buttons plugin.
License: GPLv2 or later

## Credits
Designed and developed by WhiteStudio.team
