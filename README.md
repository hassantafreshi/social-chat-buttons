# 🚀 Social Chat Buttons

[![WordPress Plugin Version](https://img.shields.io/wordpress/plugin/v/social-chat-buttons?style=flat-square)](https://wordpress.org/plugins/social-chat-buttons/)
[![WordPress Plugin: Tested WP Version](https://img.shields.io/wordpress/plugin/tested/social-chat-buttons?style=flat-square)](https://wordpress.org/plugins/social-chat-buttons/)
[![WordPress Plugin Downloads](https://img.shields.io/wordpress/plugin/dt/social-chat-buttons?style=flat-square)](https://wordpress.org/plugins/social-chat-buttons/)
[![License: GPL v2](https://img.shields.io/badge/License-GPL%20v2-blue.svg?style=flat-square)](https://www.gnu.org/licenses/gpl-2.0)

A **professional, feature-rich, and completely FREE** WordPress plugin that adds a beautiful floating social media chat widget to your website. Connect with your visitors instantly through multiple communication platforms with advanced customization options and smart availability scheduling.

## 🌟 **Why Choose Social Chat Buttons?**

- ✅ **100% Free** - 100% Free, no hidden costs
- ✅ **Professional Design** - Modern UI with smooth animations
- ✅ **15+ Social Networks** - Comprehensive platform support
- ✅ **Smart Scheduling** - Advanced availability management
- ✅ **Mobile Optimized** - Perfect responsive design
- ✅ **Developer Friendly** - Clean code following WordPress standards
- ✅ **Translation Ready** - Full internationalization support
- ✅ **Security First** - Enterprise-level security implementation

## 🎯 **Key Features**

### 💬 **Multi-Platform Support**
Connect your visitors through their preferred communication channels:

| **Messaging Apps** | **Social Media** | **Professional**
|-------------------|------------------|------------------|
| WhatsApp Business | Instagram Direct | LinkedIn Messages |
| WhatsApp Personal | Facebook Messenger |  - |
| Telegram | Twitter/X DM | Discord |
| Signal | TikTok | Viber | - |

### 🎨 **Advanced Customization**

**Button Appearance**
- **3 Display Modes**: Icon only, Text only, or Custom image
- **Color Themes**: Unlimited color combinations with live preview
- **Size Control**: Adjustable button and icon sizes (40-80px)
- **Position**: Left or right side placement
- **Gradient Headers**: Beautiful gradient backgrounds for chat popup

**Smart Features**
- **Auto Dark Mode**: Automatically switches to dark theme from 8 PM to 7 AM
- **Responsive Scaling**: Adapts perfectly to all screen sizes
- **Mobile Control**: Option to show/hide on mobile devices
- **Custom Messages**: Personalized welcome messages for each contact

### ⏰ **Intelligent Availability System**

**Advanced Scheduling**
- **Per-Contact Scheduling**: Set different hours for each team member
- **Multiple Time Slots**: Support for lunch breaks and split schedules
- **Day-Specific Hours**: Different schedules for each day of the week
- **Real-Time Status**: Automatic online/offline status based on current time
- **Timezone Aware**: Respects your WordPress timezone settings

**Example Schedule Configuration:**
```
Monday-Friday: 9:00 AM - 12:00 PM, 2:00 PM - 6:00 PM
Saturday: 10:00 AM - 4:00 PM
Sunday: Closed
```

### 🖼️ **Media & Branding**

**Avatar Support**
- **WordPress Media Library Integration**: Choose from existing images or upload new ones
- **Automatic Thumbnails**: Optimized image sizes for fast loading
- **Fallback Icons**: Network-specific SVG icons when no photo is set
- **Brand Consistency**: Maintain professional appearance across all contacts

### 🔧 **Admin Experience**

**Intuitive Management**
- **Drag & Drop Interface**: Reorder contacts easily
- **Live Preview**: See changes instantly as you configure
- **Auto-Save**: Settings saved automatically as you type
- **Bulk Operations**: Manage multiple contacts efficiently
- **Search & Filter**: Find contacts quickly in large lists

**Modern UI Components**
- **Responsive Modal Windows**: Clean, mobile-friendly dialogs
- **Toggle Switches**: iOS-style switches for boolean options
- **Color Pickers**: Advanced color selection with opacity support
- **Range Sliders**: Intuitive size and spacing controls

## 📱 **Frontend Experience**

### **Floating Chat Button**
- **Attention-Grabbing**: Subtle animations and hover effects
- **Non-Intrusive**: Carefully positioned to not interfere with content
- **Accessibility**: Full keyboard navigation and screen reader support
- **Performance**: Lightweight with minimal impact on page speed

### **Chat Popup Window**
- **Clean Design**: Minimalist interface focusing on communication
- **Contact Cards**: Professional display of each contact method
- **Status Indicators**: Clear online/offline status for each contact
- **Direct Links**: One-click connection to preferred platform

### **User Flow Example**
1. **Visitor sees floating button** → Clicks to open chat options
2. **Popup displays available contacts** → Shows only currently available team members
3. **Visitor selects preferred platform** → Automatically opens with pre-filled message
4. **Conversation starts** → Seamless transition to chosen communication app

## 🛠️ **Technical Specifications**

### **Requirements**
- **WordPress**: 5.0 or higher (tested up to 6.8)
- **PHP**: 7.4 or higher (PHP 8.2 compatible)
- **MySQL**: 5.6 or higher
- **Browser Support**: All modern browsers (Chrome 70+, Firefox 65+, Safari 12+, Edge 79+)

### **Performance**
- **Lightweight**: Less than 50KB total plugin size
- **Optimized**: Minified CSS and JavaScript
- **Caching Friendly**: Compatible with all major caching plugins
- **CDN Ready**: Supports content delivery networks
- **Database Efficient**: Minimal database queries and optimized storage

### **Security Features**
- **Nonce Protection**: All AJAX requests secured with WordPress nonces
- **Capability Checks**: Proper permission verification for all admin actions
- **Data Sanitization**: All user inputs sanitized and validated
- **XSS Prevention**: Output escaped using WordPress best practices
- **SQL Injection Prevention**: Prepared statements for all database queries

## 🚀 **Installation Guide**

### **Method 1: WordPress Admin (Recommended)**

1. **Navigate to Plugins**
   - Log into your WordPress admin dashboard
   - Go to `Plugins` → `Add New`

2. **Search and Install**
   - Search for "Social Chat Buttons"
   - Click `Install Now` → `Activate`

3. **Initial Setup**
   - Go to `Social Chat Buttons` in your admin menu
   - Click `Panel` to add your first contact
   - Configure appearance in `Settings`

### **Method 2: Manual Upload**

1. **Download Plugin**
   ```bash
   wget https://downloads.wordpress.org/plugin/social-chat-buttons.zip
   ```

2. **Upload and Extract**
   - Upload zip file via `Plugins` → `Add New` → `Upload Plugin`
   - Or extract to `/wp-content/plugins/social-chat-buttons/`

3. **Activate**
   - Go to `Plugins` → `Installed Plugins`
   - Find "Social Chat Buttons" and click `Activate`

### **Method 3: Developer Installation**

```bash
# Clone the repository
git clone https://github.com/hassantafreshi/social-chat-button.git

# Navigate to plugins directory
cd /path/to/wordpress/wp-content/plugins/

# Create symbolic link (for development)
ln -s /path/to/social-chat-button social-chat-buttons
```

## 📖 **Detailed Setup Guide**

### **Step 1: Adding Your First Contact**

1. **Access the Panel**
   - Navigate to `Social Chat Buttons` → `Panel`
   - Click the blue `Add Contact` button

2. **Configure Contact Details**
   ```
   Network: WhatsApp Business
   Phone Number: +1234567890
   Name: Customer Support
   Message: "Hi! How can we help you today?"
   ```

3. **Set Availability (Optional)**
   - Click on availability section
   - Set business hours for each day
   - Add multiple time slots if needed

4. **Add Photo (Optional)**
   - Click `Choose/Upload` next to photo field
   - Select from media library or upload new image
   - Recommended size: 100x100px (will be automatically resized)

### **Step 2: Customizing Appearance**

1. **Button Configuration**
   ```
   Display Mode: Icon + Text
   Button Text: "Chat with us"
   Button Size: 60px
   Icon Size: 28px
   Position: Bottom Right
   ```

2. **Color Scheme**
   ```
   Button Color: #25D366 (WhatsApp Green)
   Text Color: #FFFFFF (White)
   Popup Background: #F8F9FA (Light Gray)
   Header Gradient: #6610F2 → #D63384
   ```

3. **Advanced Options**
   ```
   ✅ Auto Dark Mode (8 PM - 7 AM)
   ✅ Responsive Scaling
   ❌ Hide on Mobile
   ❌ Hide Copyright
   ```

### **Step 3: Testing Your Setup**

1. **Live Preview**
   - Use the live preview in admin panel
   - Test different settings in real-time
   - Verify appearance matches your brand

2. **Frontend Testing**
   - Visit your website in new browser tab
   - Test chat button functionality
   - Verify links open correctly in messaging apps
   - Test on mobile devices

3. **Availability Testing**
   - Set temporary availability schedule
   - Verify contacts show/hide based on current time
   - Test timezone accuracy

## 🎨 **Customization Examples**

### **Corporate/Professional Style**
```css
/* Button Colors */
Primary: #2C3E50 (Dark Blue-Gray)
Secondary: #FFFFFF (White)
Accent: #3498DB (Blue)

/* Settings */
Mode: Text Only
Text: "Contact Support"
Size: 56px
Position: Bottom Right
```

### **E-commerce/Friendly Style**
```css
/* Button Colors */
Primary: #E74C3C (Red)
Secondary: #FFFFFF (White)
Accent: #F39C12 (Orange)

/* Settings */
Mode: Icon + Text
Text: "Need Help? Chat Now!"
Size: 64px
Position: Bottom Left
```

### **Minimalist Style**
```css
/* Button Colors */
Primary: #34495E (Charcoal)
Secondary: #FFFFFF (White)
Accent: #95A5A6 (Gray)

/* Settings */
Mode: Icon Only
Size: 48px
Position: Bottom Right
Auto Dark Mode: Enabled
```

## 🔧 **Advanced Configuration**

### **Hooks and Filters**

**Customize Available Networks**
```php
add_filter( 'wpscb_supported_networks', function( $networks ) {
    // Add custom network
    $networks['custom'] = array(
        'label' => 'Custom Platform',
        'input_type' => 'username',
        'url_pattern' => 'https://custom.com/chat/{value}'
    );
    return $networks;
});
```

**Modify Default Settings**
```php
add_filter( 'wpscb_default_settings', function( $defaults ) {
    $defaults['button_color'] = '#YOUR_BRAND_COLOR';
    $defaults['position'] = 'left';
    return $defaults;
});
```

**Custom Availability Logic**
```php
add_filter( 'wpscb_is_contact_available', function( $available, $contact ) {
    // Custom availability logic
    if ( $contact['network'] === 'emergency_support' ) {
        return true; // Always available
    }
    return $available;
}, 10, 2 );
```

### **CSS Customization**

**Target Plugin Elements**
```css
/* Floating Button */
.wpscb-widget-fab {
    /* Your custom styles */
}

/* Popup Window */
.wpscb-popup {
    /* Your custom styles */
}

/* Contact Items */
.wpscb-contact-item {
    /* Your custom styles */
}
```

**Responsive Adjustments**
```css
/* Mobile Optimization */
@media (max-width: 768px) {
    .wpscb-widget-fab {
        bottom: 20px !important;
        right: 20px !important;
    }
}
```

### **JavaScript Integration**

**Custom Events**
```javascript
// Listen for widget events
document.addEventListener('wpscb_widget_opened', function(e) {
    console.log('Chat widget opened');
    // Your custom logic
});

document.addEventListener('wpscb_contact_clicked', function(e) {
    console.log('Contact clicked:', e.detail.network);
    // Analytics tracking, custom redirects, etc.
});
```

**Programmatic Control**
```javascript
// Open/close widget programmatically
window.wpscb_toggle_widget();
window.wpscb_open_widget();
window.wpscb_close_widget();
```

## 🐛 **Troubleshooting**

### **Common Issues and Solutions**

**Widget Not Appearing**
```bash
# Check if widget is enabled
Admin → Social Chat Buttons → Settings → Enable Widget ✅

# Verify contacts are added
Admin → Social Chat Buttons → Panel → At least one contact

# Check availability schedules
Ensure current time falls within availability hours

# Clear caching
If using caching plugins, clear cache after changes
```

**Links Not Working**
```bash
# Verify contact details
Double-check phone numbers (include country code: +1234567890)
Verify usernames (without @ symbol for most platforms)

# Test URL format
Most platforms: username only
WhatsApp: full phone number with country code
Email: full email address
```

**Styling Issues**
```bash
# Check theme conflicts
Try switching to default WordPress theme temporarily
Inspect CSS conflicts using browser developer tools

# Plugin conflicts
Deactivate other plugins to identify conflicts
Check for JavaScript errors in browser console
```

**Performance Issues**
```bash
# Optimize images
Use properly sized avatar images (recommended: 100x100px)
Compress images before uploading

# Caching configuration
Ensure caching plugins are configured correctly
Test with caching disabled temporarily
```

### **Debug Mode**

Enable WordPress debug mode for detailed error reporting:

```php
// Add to wp-config.php
define( 'WP_DEBUG', true );
define( 'WP_DEBUG_LOG', true );
define( 'WP_DEBUG_DISPLAY', false );
```

Check debug logs at `/wp-content/debug.log`

## 🤝 **Contributing**

We welcome contributions from the community! Here's how you can help:

### **Bug Reports**
1. **Check existing issues** on GitHub
2. **Provide detailed information**:
   - WordPress version
   - Plugin version
   - Browser and version
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots (if applicable)

### **Feature Requests**
1. **Search existing requests** to avoid duplicates
2. **Describe the use case** in detail
3. **Explain the benefits** for other users
4. **Suggest implementation** if you have ideas

### **Code Contributions**
```bash
# Fork the repository
git fork https://github.com/hassantafreshi/social-chat-button

# Create feature branch
git checkout -b feature/your-feature-name

# Make changes following WordPress coding standards
# Add tests if applicable
# Update documentation

# Submit pull request with detailed description
```

### **Translation Contributions**
Help make the plugin available in more languages:

1. **Download POT file** from `/languages/social-chat-buttons.pot`
2. **Translate using Poedit** or similar tool
3. **Submit PO/MO files** via GitHub or WordPress.org

## 📞 **Support**

### **Free Community Support**
- **WordPress Forums**: [Official Plugin Support](https://wordpress.org/support/plugin/social-chat-buttons/)
- **GitHub Issues**: [Technical Issues & Feature Requests](https://github.com/hassantafreshi/social-chat-button/issues)
- **Documentation**: This README and inline help text

### **Response Times**
- **Critical Issues**: Within 24 hours
- **General Questions**: Within 72 hours
- **Feature Requests**: Within 1 week

### **Before Requesting Support**
1. **Check FAQ section** above
2. **Search existing forum posts** and GitHub issues
3. **Try basic troubleshooting**:
   - Update to latest plugin version
   - Test with default WordPress theme
   - Deactivate other plugins temporarily
   - Clear any caching

### **When Requesting Support**
Please provide:
- WordPress version
- Plugin version
- Active theme
- List of active plugins
- Description of the issue
- Steps to reproduce
- Screenshots (if applicable)

## 📜 **License & Legal**

### **License**
This plugin is released under the **GNU General Public License v2 (or later)**. You are free to use, modify, and distribute this plugin according to the terms of the GPL license.

### **Third-Party Resources**
- **SVG Icons**: Custom-designed icons for each social network
- **Color Picker**: WordPress native color picker component
- **Media Library**: WordPress core media functionality

### **Privacy Policy**
This plugin does **NOT**:
- Collect any personal data
- Store user interactions
- Send data to external servers
- Use tracking cookies
- Connect to third-party APIs

All contact information is stored locally in your WordPress database and is never transmitted elsewhere.

### **Trademark Notice**
All social media platform names and logos are trademarks of their respective owners. This plugin is not affiliated with, endorsed by, or sponsored by any of these platforms.

## 🏆 **Credits & Acknowledgments**

### **Development Team**
- **Lead Developer**: Hassan Tafreshi
- **UI/UX Design**: Community feedback integration
- **Security Review**: WordPress security best practices
- **Testing**: Cross-platform compatibility testing

### **Community Contributors**
- **Translators**: Multi-language support contributors
- **Beta Testers**: Early adopters providing valuable feedback
- **Feature Suggestions**: Community-driven feature development
- **Bug Reports**: Users helping improve stability

### **Inspiration**
Special thanks to the WordPress community for continuous inspiration and the open-source philosophy that makes projects like this possible.

---

## 🚀 **Ready to Get Started?**

1. **Install the plugin** from WordPress.org or GitHub
2. **Add your contacts** through the admin panel
3. **Customize the appearance** to match your brand
4. **Test the functionality** on your live site
5. **Enjoy increased customer engagement!**

**Need help?** Check our [support forums](https://wordpress.org/support/plugin/social-chat-buttons/) or [GitHub issues](https://github.com/hassantafreshi/social-chat-button/issues).

**Love the plugin?** Please consider [leaving a 5-star review](https://wordpress.org/plugins/social-chat-buttons/#reviews) to help others discover it!

---

*Made with ❤️ for the WordPress community*