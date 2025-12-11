// Multi-language support system
// Load all language files
const AVAILABLE_LANGUAGES = ['en', 'fa', 'ar', 'de'];
const DEFAULT_LANGUAGE = 'en';
let currentTranslations = null;

// Get language from URL parameter or default
function getLanguageFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const lang = urlParams.get('lang');
    return AVAILABLE_LANGUAGES.includes(lang) ? lang : DEFAULT_LANGUAGE;
}

// Change language function
function changeLanguage(lang) {
    if (!AVAILABLE_LANGUAGES.includes(lang)) {
        console.error('Language not supported:', lang);
        return;
    }

    // Update URL without reload
    const url = new URL(window.location);
    url.searchParams.set('lang', lang);
    window.history.pushState({}, '', url);

    // Apply translations
    applyTranslations(lang);

    // Update active button
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
}

// Apply translations to the page
function applyTranslations(lang) {
    // Get translations object
    let translations;
    switch(lang) {
        case 'en':
            translations = translations_en;
            break;
        case 'fa':
            translations = translations_fa;
            break;
        case 'ar':
            translations = translations_ar;
            break;
        case 'de':
            translations = translations_de;
            break;
        default:
            translations = translations_en;
    }

    currentTranslations = translations;

    // Update HTML lang and dir attributes
    const html = document.getElementById('html');
    html.setAttribute('lang', translations.lang);
    html.setAttribute('dir', translations.dir);

    // Update meta tags
    document.getElementById('meta-description').setAttribute('content', translations.meta.description);
    document.getElementById('meta-keywords').setAttribute('content', translations.meta.keywords);
    document.getElementById('page-title').textContent = translations.meta.title;

    // Update Bootstrap CSS for RTL
    const bootstrapCSS = document.getElementById('bootstrap-css');
    if (translations.dir === 'rtl') {
        bootstrapCSS.href = 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.rtl.min.css';
    } else {
        bootstrapCSS.href = 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css';
    }

    // Update all elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        const translation = getNestedTranslation(translations, key);
        if (translation) {
            // Preserve icon elements if they exist
            const icons = element.querySelectorAll('i');
            const iconHTML = Array.from(icons).map(icon => icon.outerHTML).join('');

            if (icons.length > 0 && element.children.length > 0) {
                // Element has icons as children - skip to avoid breaking them
                // console.log('Preserving icons in element:', element);
            } else if (iconHTML) {
                // Icons exist but might be text content - preserve and update
                element.innerHTML = iconHTML + translation;
            } else {
                // No icons, safe to update
                element.innerHTML = translation;
            }
        }
    });

    // Update customization features list
    updateCustomizationFeatures(translations);

    // Show/hide Persian-only platforms
    updatePersianOnlyPlatforms(translations.lang);
}

// Show/hide Persian-only platforms based on language
function updatePersianOnlyPlatforms(lang) {
    const persianOnlyItems = document.querySelectorAll('.platform-fa-only');
    persianOnlyItems.forEach(item => {
        if (lang === 'fa') {
            item.style.display = '';
        } else {
            item.style.display = 'none';
        }
    });
}

// Get nested translation using dot notation
function getNestedTranslation(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
}

// Update customization features list
function updateCustomizationFeatures(translations) {
    const featuresList = document.getElementById('customization-features');
    if (featuresList && translations.customization.features) {
        featuresList.innerHTML = '';
        translations.customization.features.forEach(feature => {
            const li = document.createElement('li');
            li.innerHTML = `<i class="fas fa-check-circle"></i>${feature}`;
            featuresList.appendChild(li);
        });
    }
}

// Ensure Font Awesome CSS is loaded
function ensureFontAwesomeLoaded() {
    return new Promise((resolve) => {
        const faLink = document.querySelector('link[href*="font-awesome"]');
        if (!faLink) {
            console.warn('Font Awesome link not found!');
            resolve();
            return;
        }
        if (faLink.sheet) {
            // console.log('Font Awesome already loaded');
            resolve();
        } else {
            faLink.addEventListener('load', () => {
                // console.log('Font Awesome loaded successfully');
                resolve();
            });
            faLink.addEventListener('error', () => {
                // console.error('Font Awesome failed to load');
                resolve();
            });
        }
        setTimeout(resolve, 3000);
    });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    ensureFontAwesomeLoaded().then(() => {
        const lang = getLanguageFromURL();
        // console.log('Initializing language:', lang);
        applyTranslations(lang);

        // Set active language button
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.textContent.toLowerCase().includes(lang) ||
                (lang === 'fa' && btn.textContent.includes('فا')) ||
                (lang === 'ar' && btn.textContent.includes('عربي'))) {
                btn.classList.add('active');
            }
        });

        // Verify Font Awesome is loaded
        setTimeout(() => {
            const icons = document.querySelectorAll('i.fas, i.fab, i.far');
            // console.log('Font Awesome icons found:', icons.length);
            if (icons.length > 0) {
                const sampleIcon = icons[0];
                const computedStyle = window.getComputedStyle(sampleIcon);
                // console.log('Font Awesome font-family:', computedStyle.fontFamily);
            }
        }, 1000);
    });
});