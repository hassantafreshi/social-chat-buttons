<?php
if ( ! defined( 'ABSPATH' ) ) { exit; }

class WPSCB {
    private static $instance = null;

    public static function instance() {
        if ( self::$instance === null ) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function __construct() {
        // Load text domain for WordPress < 6.7 compatibility
        add_action( 'plugins_loaded', array( $this, 'wpscb_load_textdomain' ) );

        // Initialize modules.
        if ( is_admin() ) {
            require_once WPSCB_PLUGIN_DIR . 'includes/class-wpscb-admin.php';
            new WPSCB_Admin( $this );
        }

        require_once WPSCB_PLUGIN_DIR . 'includes/class-wpscb-frontend.php';
        new WPSCB_Frontend( $this );

        require_once WPSCB_PLUGIN_DIR . 'includes/class-wpscb-ajax.php';
        new WPSCB_Ajax( $this );
    }

    /**
     * Load plugin textdomain for WordPress < 6.7 compatibility.
     * WordPress 6.7+ automatically loads from /languages/ directory.
     */
    public function wpscb_load_textdomain() {
        // Only load if WordPress version is less than 6.7
        global $wp_version;
        if ( version_compare( $wp_version, '6.7', '<' ) ) {
            load_plugin_textdomain( 'wp-social-chat-button', false, dirname( plugin_basename( WPSCB_PLUGIN_FILE ) ) . '/languages' );
        }
    }

    // Data helpers
    public function wpscb_get_supported_networks() {
        $urlPattern = '/^https?:\/\/[^\s]+$/i';
        $networks = array(
            // Core asked list
            'whatsapp'      => array( 'label' => esc_html__( 'WhatsApp', 'wp-social-chat-button' ),               'type' => 'phone',    'pattern' => '/^[0-9+\- ]{6,20}$/' ),
            'messenger'     => array( 'label' => esc_html__( 'Facebook Messenger', 'wp-social-chat-button' ),     'type' => 'username', 'pattern' => '/^[A-Za-z0-9.]{5,50}$/' ),
            'telegram'      => array( 'label' => esc_html__( 'Telegram', 'wp-social-chat-button' ),               'type' => 'username', 'pattern' => '/^[A-Za-z0-9_]{5,32}$/' ),
            'instagram_dm'  => array( 'label' => esc_html__( 'Instagram Direct', 'wp-social-chat-button' ),       'type' => 'id',       'pattern' => '/^[0-9]{5,20}$/' ),
            'viber'         => array( 'label' => esc_html__( 'Viber', 'wp-social-chat-button' ),                  'type' => 'phone',    'pattern' => '/^[0-9+\- ]{6,20}$/' ),
            'line'          => array( 'label' => esc_html__( 'LINE', 'wp-social-chat-button' ),                   'type' => 'username', 'pattern' => '/^@?[A-Za-z0-9_\-.]{2,50}$/' ),
            'wechat'        => array( 'label' => esc_html__( 'WeChat', 'wp-social-chat-button' ),                 'type' => 'url',      'pattern' => $urlPattern ), // expect QR/official URL
            'twitter_dm'    => array( 'label' => esc_html__( 'Twitter (X) DM', 'wp-social-chat-button' ),         'type' => 'id',       'pattern' => '/^[0-9]{1,20}$/' ),
            'discord'       => array( 'label' => esc_html__( 'Discord', 'wp-social-chat-button' ),                'type' => 'code',     'pattern' => '/^([A-Za-z0-9]{4,10}|https?:\/\/discord\.gg\/[^\s]+)$/i' ),
            'signal'        => array( 'label' => esc_html__( 'Signal', 'wp-social-chat-button' ),                 'type' => 'phone',    'pattern' => '/^[0-9+\- ]{6,20}$/' ),
            'skype'         => array( 'label' => esc_html__( 'Skype', 'wp-social-chat-button' ),                  'type' => 'code',     'pattern' => '/^[A-Za-z0-9]{6,32}$/' ),
            'snapchat'      => array( 'label' => esc_html__( 'Snapchat', 'wp-social-chat-button' ),               'type' => 'username', 'pattern' => '/^[A-Za-z0-9_.-]{3,39}$/' ),
            'kakaotalk'     => array( 'label' => esc_html__( 'KakaoTalk', 'wp-social-chat-button' ),              'type' => 'code',     'pattern' => '/^[A-Za-z0-9]{6,50}$/' ),
            'linkedin_msg'  => array( 'label' => esc_html__( 'LinkedIn Messaging', 'wp-social-chat-button' ),     'type' => 'url',      'pattern' => $urlPattern ),
            'threads'       => array( 'label' => esc_html__( 'Threads (Meta)', 'wp-social-chat-button' ),         'type' => 'username', 'pattern' => '/^@?[A-Za-z0-9_.]{1,30}$/' ),
            'pinterest_msg' => array( 'label' => esc_html__( 'Pinterest Messages', 'wp-social-chat-button' ),     'type' => 'username', 'pattern' => '/^[A-Za-z0-9_]{3,30}$/' ),
            'reddit_chat'   => array( 'label' => esc_html__( 'Reddit Chat', 'wp-social-chat-button' ),            'type' => 'username', 'pattern' => '/^[A-Za-z0-9_\-]{3,20}$/' ),
            'youtube_chat'  => array( 'label' => esc_html__( 'YouTube Chat', 'wp-social-chat-button' ),           'type' => 'url',      'pattern' => $urlPattern ),
            'slack'         => array( 'label' => esc_html__( 'Slack Invite', 'wp-social-chat-button' ),           'type' => 'url',      'pattern' => $urlPattern ),
            'teams'         => array( 'label' => esc_html__( 'Microsoft Teams', 'wp-social-chat-button' ),        'type' => 'email',    'pattern' => '/^[^\s@]+@[^\s@]+\.[^\s@]+$/' ),
            'VK'            => array( 'label' => esc_html__( 'VK Messenger', 'wp-social-chat-button' ),           'type' => 'username', 'pattern' => '/^[A-Za-z0-9_.]{5,50}$/' ),
        );

        // If site language is Persian (fa*), add local networks Eitaa and Soroush.
        // Per request, labels are provided as plain strings (no esc_html__()).
        $locale = get_locale();
        if ( strpos( $locale, 'fa' ) === 0 ) {
            $networks['eitaa'] = array(
                'label'   => 'ایتا',
                'type'    => 'username',
                'pattern' => '/^[A-Za-z0-9_@.\-]{3,64}$/',
            );
            $networks['soroush'] = array(
                'label'   => 'سروش',
                'type'    => 'username',
                'pattern' => '/^[A-Za-z0-9_@.\-]{3,64}$/',
            );
        }

        /**
         * Filter the supported networks list.
         *
         * @param array $networks
         */
        return apply_filters( 'wpscb_supported_networks', $networks );
    }

    /**
     * Return inline SVG markup for a network icon.
     * Supports 'eitaa' and 'soroush'.
     *
     * @param string $network
     * @param int    $size
     * @return string SVG markup or empty string
     */
    public function wpscb_networkIconSvg( $network, $size = 24 ) {
        $s = absint( $size ) ?: 24;
        switch ( $network ) {
            case 'eitaa':
                return '<svg xmlns="http://www.w3.org/2000/svg" width="' . esc_attr( $s ) . '" height="' . esc_attr( $s ) . '" viewBox="0 0 24 24" fill="none" role="img" aria-label="Eitaa">'
                    . '<rect width="24" height="24" rx="3" fill="#E37600"/>'
                    . '<path d="M6.1 21.5c-.8-.3-1.5-1-1.9-1.8-.2-.7-.2-1.5-.1-6.8.1-5.7.1-5.4.3-6.3.1-.5.5-1.3.8-1.7 1-1.5 2.5-2.4 4.3-2.8.4-.1.9-.1 5.7-.1 5.9 0 5.7 0 6.7.3 1.7.5 3.1 1.5 4.1 2.9.3.9.3 1 .3 3.4v2.1l-.4.3c-.5.4-1.2 1-2.2 2-1.1 1.2-2.3 2.3-2.8 2.7-1.2 1-2.4 1.6-3.5 1.8-.6.1-1.6.1-2.2-.1-.5-.1-.5-.2-.7.4-.2.5-.3 1-.3 1.5v.4l-.1 0c-1.1-.2-2.3-1.2-2.7-2.4-.1-.5-.2-.9-.2-1.2v-.3l-.3-.3c-.6-.6-1-1.2-1.1-2-.2-1.1.3-2.4 1.4-3.5 1.2-1.2 3-2.2 4.7-2.5.6-.1 1.7-.2 2.3-.1 1.1.2 2 .7 2.5 1.5.2.3.2.3.2.5 0 .2-.1.4-.2.5-.4.6-1.7 1.3-3.2 1.6-2.5.6-4.1-.1-3.8-1.7 0-.2.1-.3.1-.3 0 0-.3.1-.5.3-.5.3-.9.9-1 1.5-.1.1-.1.4 0 .6 0 .3.1.4.2.7.1.2.3.4.4.5l.2.2-.1.1c-.2.3-.6.8-.6 1.1-.2.5-.2.8-.1 1.7.1.4.4 1 .7 1.4.2.3.8.7.8.7 0 0 .1-.1.1-.1 0-.2.2-.9.3-1.3.4-1 1.3-1.9 2.7-2.6.2-.1.9-.4 1.5-.7 1.3-.6 2-.9 2.4-1.2 1.1-.8 1.8-2 2-3.4.1-.5.1-1.5 0-2.1-.3-2.3-2.1-3.9-4.6-4.1-2.8-.3-6.3 1.8-8.5 5.1-1.1 1.6-1.8 3.4-2.1 5.1-.1.7-.2 2 0 2.6.2 1.6.8 2.9 1.8 3.9.6.7 1.2 1.1 1.8 1.2 2.3 1.1 4.8 1.1 7 .1.9-.4 1.9-1.1 2.9-2.1.9-1 1.6-1.8 3.4-4.2.9-1.3 1.8-2.2 2.1-2.5l.1-.1v2.9c0 2.8 0 2.9-.1 3.4-.6 2.5-2.4 4.4-4.9 4.9l-.4.1h-5.5c-4.5.1-5.6 0-5.9-.1z" fill="#FFF"/>'
                    . '</svg>';
            case 'soroush':
                return '<svg xmlns="http://www.w3.org/2000/svg" width="' . esc_attr( $s ) . '" height="' . esc_attr( $s ) . '" viewBox="0 0 24 24" fill="none" role="img" aria-label="Soroush">'
                    . '<rect width="24" height="24" rx="3" fill="#0099CC"/>'
                    . '<path d="M5.97 23.94c-.41-.07-.82-.23-1.33-.46-.9-.52-1.58-1.45-1.8-2.47-.09-.4-.1-.9-.08-4.02.02-3.33.01-3.22.16-3.77.08-.27.3-.75.46-.99.5-.75 1.12-1.33 1.8-1.68.22-.1.52-.15 3.38-.15 3.49 0 3.37 0 3.94.18 1.05.24 1.97.82 2.41 1.67.18.52.19.6.21 1.98l.01 1.24-.22.15c-.31.21-.72.59-1.29 1.2-.66.7-1.32 1.35-1.66 1.62-.73.59-1.4.92-2.08 1.04-.35.06-.94.04-1.28-.05-.31-.08-.29-.09-.41.26-.11.23-.18.49-.18.86l-.02.23-.08-.02c-.68-.13-1.35-.72-1.61-1.39-.06-.18-.14-.41-.14-.68l-.01-.19-.17-.16c-.36-.33-.59-.73-.67-1.15-.12-.67.19-1.42.86-2.1.71-.72 1.75-1.28 2.77-1.5.37-.08 1.02-.1 1.34-.04.64.11 1.15.43 1.48.91.1.15.11.17.1.31 0 .11-.05.21-.1.28-.26.36-1.03.75-1.86.94-1.47.33-2.4-.08-2.25-.98.01-.09.02-.17.02-.17-.02-.02-.16.06-.32.17-.27.19-.5.55-.59.9-.02.09-.03.23-.02.36.01.18.03.25.11.41.05.1.15.25.23.33l.13.14-.05.07c-.09.13-.21.34-.38.68-.11.28-.11.46-.06 1.01.06.26.23.61.41.82.13.16.44.43.49.43.01 0 .02-.03.02-.06 0-.13.1-.54.18-.74.24-.59.75-1.09 1.57-1.53.14-.07.53-.26.88-.42.76-.35 1.17-.57 1.4-.73.66-.46 1.06-1.15 1.19-2.02.05-.32.05-.91 0-1.23-.21-1.36-1.22-2.29-2.69-2.44-1.63-.17-3.71 1.09-4.99 2.86-.62.94-1.04 1.99-1.22 3.04-.07.41-.09 1.16-.05 1.53.11.95.46 1.72 1.06 2.32.23.22.48.4.64.52 1.32.63 2.78.64 4.07.04.56-.26 1.1-.67 1.69-1.26.57-.57.95-1.05 2.01-2.49.58-.79 1.04-1.32 1.27-1.45l.08-.05-.01 1.72c-.01 1.67-.01 1.73-.07 1.99-.33 1.49-1.42 2.59-2.9 2.93l-.26.06-3.22.01c-2.64 0-3.26-.01-3.46-.03z" fill="#FFF"/>'
                    . '</svg>';
            default:
                return '';
        }
    }

    /**
     * Get network icon HTML (inline SVG wrapped for predictable sizing).
     *
     * @param string $network
     * @param int    $size
     * @return string HTML markup (may be empty)
     */
    public function wpscb_getNetworkIcon( $network, $size = 24 ) {
        $svg = $this->wpscb_networkIconSvg( $network, $size );
        if ( ! $svg ) {
            return '';
        }
        return '<span class="wpscb-network-icon" aria-hidden="true" style="width:' . esc_attr( $size ) . 'px;height:' . esc_attr( $size ) . 'px;display:inline-block;line-height:0;">' . $svg . '</span>';
    }

    public function wpscb_get_contacts() {
        $contacts = get_option( WPSCB_OPTION_CONTACTS, array() );
        $contacts = is_array( $contacts ) ? $contacts : array();
        /**
         * Filter the contacts before use.
         *
         * @param array $contacts
         */
        return apply_filters( 'wpscb_contacts', $contacts );
    }

    public function wpscb_set_contacts( $contacts ) {
        if ( ! is_array( $contacts ) ) { $contacts = array(); }
        $contacts = array_values( $contacts );
        /**
         * Filter contacts before saving.
         *
         * @param array $contacts
         */
        $contacts = apply_filters( 'wpscb_set_contacts', $contacts );
        update_option( WPSCB_OPTION_CONTACTS, $contacts );
    }

    public function wpscb_get_settings() {
        $defaults = array( 'enabled' => 1, 'position' => 'right' );
        $settings = get_option( WPSCB_OPTION_SETTINGS, array() );
        $settings = wp_parse_args( is_array( $settings ) ? $settings : array(), $defaults );
        /**
         * Filter settings after load/merge defaults.
         *
         * @param array $settings
         */
        return apply_filters( 'wpscb_settings', $settings );
    }

    public function wpscb_set_settings( $settings ) {
        if ( ! is_array( $settings ) ) { $settings = array(); }
        $settings = wp_parse_args( $settings, array( 'enabled' => 1, 'position' => 'right' ) );
        if ( ! in_array( $settings['position'], array( 'right', 'left' ), true ) ) {
            $settings['position'] = 'right';
        }
        $settings['enabled'] = ! empty( $settings['enabled'] ) ? 1 : 0;
        /**
         * Filter settings before saving.
         *
         * @param array $settings
         */
        $settings = apply_filters( 'wpscb_set_settings', $settings );
        update_option( WPSCB_OPTION_SETTINGS, $settings );
        return $settings;
    }

    public function wpscb_get_advanced_settings() {
        $defaults = array(
            // Button
            'button_mode'            => 'icon',          // 'icon', 'text', 'image'
            'button_text'            => esc_html__( 'Chat', 'wp-social-chat-button' ),
            'button_image'           => 0,               // attachment ID
            'button_size'            => 56,              // px
            'button_icon_size'       => 24,              // px for icon/text size
            'button_color'           => '#6610f2',       // primary purple
            'button_text_color'      => '#ffffff',
            // Popup
            'popup_width'            => 340,             // px
            'popup_title'            => esc_html__( 'Chat', 'wp-social-chat-button' ), // popup header title
            'popup_bg_color'         => '#ffffff',
            'popup_header_color'     => '#6610f2',       // gradient start
            'popup_header_color_end' => '#d63384',       // gradient end
            'popup_text_color'       => '#212529',
            'popup_label_color'      => '#6c757d',
            'contact_bg_color'       => '#f8f9fa',       // contact item background
            'contact_hover_color'    => '#e2e8f0',       // contact item hover
            // Advanced
            'auto_dark_mode'         => 0,               // 0=off, 1=auto dark mode (8 PM - 7 AM)
            'hide_mobile'            => 0,               // 0=show on mobile, 1=hide
            'hide_copyright'         => 0,               // 0=show, 1=hide (premium)
            'responsive_scale'       => 1,               // 0=fixed, 1=responsive
        );
        $adv = get_option( 'wpscb_advanced_settings', array() );
        $adv = wp_parse_args( is_array( $adv ) ? $adv : array(), $defaults );
        return apply_filters( 'wpscb_advanced_settings', $adv );
    }

    public function wpscb_set_advanced_settings( $adv ) {
        if ( ! is_array( $adv ) ) { $adv = array(); }
        $defaults = $this->wpscb_get_advanced_settings();
        $adv = wp_parse_args( $adv, $defaults );
        // sanitize
        $adv['button_mode']            = in_array( $adv['button_mode'], array( 'icon', 'text', 'image' ), true ) ? $adv['button_mode'] : 'icon';
        $adv['button_text']            = sanitize_text_field( $adv['button_text'] );
        $adv['button_image']           = absint( $adv['button_image'] );
        $adv['button_size']            = max( 40, min( 80, absint( $adv['button_size'] ) ) );
        $adv['button_icon_size']       = max( 16, min( 48, absint( $adv['button_icon_size'] ) ) );
        $adv['button_color']           = sanitize_hex_color( $adv['button_color'] );
        $adv['button_text_color']      = sanitize_hex_color( $adv['button_text_color'] );
        $adv['popup_width']            = max( 280, min( 480, absint( $adv['popup_width'] ) ) );
        $adv['popup_title']            = sanitize_text_field( $adv['popup_title'] );
        $adv['popup_bg_color']         = sanitize_hex_color( $adv['popup_bg_color'] );
        $adv['popup_header_color']     = sanitize_hex_color( $adv['popup_header_color'] );
        $adv['popup_header_color_end'] = sanitize_hex_color( $adv['popup_header_color_end'] );
        $adv['popup_text_color']       = sanitize_hex_color( $adv['popup_text_color'] );
        $adv['popup_label_color']      = sanitize_hex_color( $adv['popup_label_color'] );
        $adv['contact_bg_color']       = sanitize_hex_color( $adv['contact_bg_color'] );
        $adv['contact_hover_color']    = sanitize_hex_color( $adv['contact_hover_color'] );
        $adv['auto_dark_mode']         = ! empty( $adv['auto_dark_mode'] ) ? 1 : 0;
        $adv['hide_mobile']            = ! empty( $adv['hide_mobile'] ) ? 1 : 0;
        $adv['hide_copyright']         = ! empty( $adv['hide_copyright'] ) ? 1 : 0;
        $adv['responsive_scale']       = ! empty( $adv['responsive_scale'] ) ? 1 : 0;

        $adv = apply_filters( 'wpscb_set_advanced_settings', $adv );
        update_option( 'wpscb_advanced_settings', $adv );
        return $adv;
    }

    public function wpscb_build_network_url( $network, $value ) {
        switch ( $network ) {
            case 'whatsapp':
                $digits = preg_replace( '/[^0-9]/', '', $value );
                $url = 'https://wa.me/' . rawurlencode( $digits );
                break;
            case 'messenger':
                $url = 'https://m.me/' . rawurlencode( $value );
                break;
            case 'telegram':
                $url = 'https://t.me/' . rawurlencode( ltrim( $value, '@' ) );
                break;
            case 'instagram_dm':
                $digits = preg_replace( '/[^0-9]/', '', $value );
                $url = 'https://www.instagram.com/direct/t/' . rawurlencode( $digits ) . '/';
                break;
            case 'signal':
                $digits = preg_replace( '/[^0-9+]/', '', $value );
                $url = 'https://signal.me/#p/' . rawurlencode( $digits );
                break;
            case 'viber':
                $digits = preg_replace( '/[^0-9+]/', '', $value );
                $url = 'viber://chat?number=' . rawurlencode( $digits );
                break;
            case 'line':
                $u = ltrim( $value, '@' );
                $url = 'https://line.me/R/ti/p/@' . rawurlencode( $u );
                break;
            case 'wechat':
                $url = preg_match( '/^https?:\/\//i', $value ) ? $value : '#';
                break;
            case 'twitter_dm':
                $id = preg_replace( '/[^0-9]/', '', $value );
                $url = 'https://twitter.com/messages/compose?recipient_id=' . rawurlencode( $id );
                break;
            case 'discord':
                $url = preg_match( '/^https?:\/\//i', $value ) ? $value : ( 'https://discord.gg/' . rawurlencode( $value ) );
                break;
            case 'skype':
                $url = 'https://join.skype.com/invite/' . rawurlencode( $value );
                break;
            case 'snapchat':
                $url = 'https://www.snapchat.com/add/' . rawurlencode( $value );
                break;
            case 'kakaotalk':
                $url = 'https://open.kakao.com/o/' . rawurlencode( $value );
                break;
            case 'linkedin_msg':
                $url = preg_match( '/^https?:\/\//i', $value ) ? $value : 'https://www.linkedin.com/messaging/thread/NEW/';
                break;
            case 'threads':
                $url = 'https://www.threads.net/' . ( strpos( $value, '@' ) === 0 ? '' : '@' ) . rawurlencode( $value );
                break;
            case 'pinterest_msg':
                $url = 'https://pinterest.com/send/' . rawurlencode( $value ) . '/';
                break;
            case 'reddit_chat':
                $url = 'https://www.reddit.com/message/compose/?to=' . rawurlencode( $value );
                break;
            case 'youtube_chat':
                $url = preg_match( '/^https?:\/\//i', $value ) ? $value : '#';
                break;
            case 'slack':
                $url = preg_match( '/^https?:\/\//i', $value ) ? $value : '#';
                break;
            case 'teams':
                $url = 'https://teams.microsoft.com/l/chat/0/0?users=' . rawurlencode( $value );
                break;
            case 'VK':
                $url = 'https://vk.com/im?sel=' . rawurlencode( $value );
                break;
            case 'eitaa':
                $url = 'https://eitaa.com/joinchat/' . rawurlencode( ltrim( $value, '@' ) );
                break;
            case 'soroush':
                $url = 'https://soroush.app/contact/' . rawurlencode( ltrim( $value, '@' ) );
                break;
            default:
                $url = '#';
                break;
        }
        /**
         * Filter the final URL for a given network/value.
         *
         * @param string $url
         * @param string $network
         * @param string $value
         */
        return apply_filters( 'wpscb_network_url', $url, $network, $value );
    }

    public static function wpscb_verify_request() {
        if ( ! current_user_can( 'manage_options' ) ) {
            wp_send_json_error( array( 'message' => esc_html__( 'Insufficient permissions.', 'wp-social-chat-button' ) ), 403 );
        }
        $nonce = isset( $_POST['nonce'] ) ? sanitize_text_field( wp_unslash( $_POST['nonce'] ) ) : '';
        if ( ! wp_verify_nonce( $nonce, 'wpscb_nonce' ) ) {
            wp_send_json_error( array( 'message' => esc_html__( 'Invalid nonce.', 'wp-social-chat-button' ) ), 400 );
        }
    }
}
