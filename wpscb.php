<?php
/**
 * Plugin Name: WP Social Chat Button
 * Plugin URI:  https://example.com/wp-social-chat-button
 * Description: مدیریت راه‌های ارتباطی شبکه‌های اجتماعی (WhatsApp, Telegram, Signal و ...) با دکمه شناور در فرانت و پنل مدرن در ادمین.
 * Version:     0.1.1
 * Author:      hassantafreshi
 * Author URI:  https://example.com
 * License:     GPLv2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: wp-social-chat-button
 * Domain Path: /languages
 */

if ( ! defined( 'ABSPATH' ) ) { exit; }

define( 'WPSCB_VERSION', '0.1.1' );
define( 'WPSCB_PLUGIN_FILE', __FILE__ );
define( 'WPSCB_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'WPSCB_PLUGIN_URL', plugin_dir_url( __FILE__ ) );
define( 'WPSCB_OPTION_CONTACTS', 'wpscb_contacts' );
define( 'WPSCB_OPTION_SETTINGS', 'wpscb_settings' );

// Autoload core classes.
require_once WPSCB_PLUGIN_DIR . 'includes/class-wpscb.php';

// Initialize core singleton.
WPSCB::instance();

function wpscb_activate() {
	if ( get_option( WPSCB_OPTION_SETTINGS ) === false ) {
		update_option( WPSCB_OPTION_SETTINGS, array( 'enabled' => 1, 'position' => 'right' ) );
	}
	if ( get_option( WPSCB_OPTION_CONTACTS ) === false ) {
		update_option( WPSCB_OPTION_CONTACTS, array() );
	}
}
register_activation_hook( __FILE__, 'wpscb_activate' );

function wpscb_deactivate() {
	// No cleanup on deactivate; options retained.
}
register_deactivation_hook( __FILE__, 'wpscb_deactivate' );

