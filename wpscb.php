<?php
/**
 * Plugin Name: Social Chat Buttons
 * Plugin URI:  https://whitestudio.team/plugins/social-chat-buttons/
 * Description: Add a beautiful floating chat widget to connect with visitors through WhatsApp, Telegram, Instagram, and 15+ social networks. Features smart scheduling, custom styling, and mobile optimization.
 * Version:     1.0.2
 * Author:      whitestudio
 * Author URI:  https://whitestudio.team/plugins/social-chat-buttons/
 * License:     GPLv2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: social-chat-buttons
 * Domain Path: /languages
 */

if ( ! defined( 'ABSPATH' ) ) { exit; }

define( 'WPSCB_VERSION', '0.1.9' );
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

