<?php
if ( ! defined( 'ABSPATH' ) ) { exit; }

class WPSCB_Frontend {
    private $core;

    public function __construct( $core ) {
        $this->core = $core;
        add_action( 'wp_enqueue_scripts', array( $this, 'wpscb_enqueue_front_assets' ) );
        add_action( 'wp_footer', array( $this, 'wpscb_render_frontend_widget' ) );

        // Disable canonical redirect for preview mode
        if ( isset( $_GET['wpscb_preview'] ) && $_GET['wpscb_preview'] === '1' ) {
            remove_action( 'template_redirect', 'redirect_canonical' );
        }
    }

    public function wpscb_enqueue_front_assets() {
        $settings = $this->core->wpscb_get_settings();

        // Check for preview mode
        $is_preview = isset( $_GET['wpscb_preview'] ) && $_GET['wpscb_preview'] === '1';

        // Skip enabled check in preview mode
        if ( empty( $settings['enabled'] ) && ! $is_preview ) { return; }

        wp_enqueue_style( 'wpscb-front', WPSCB_PLUGIN_URL . 'assets/css/front.css', array(), WPSCB_VERSION );
        wp_enqueue_script( 'wpscb-front', WPSCB_PLUGIN_URL . 'assets/js/front.js', array(), WPSCB_VERSION, true );
        // Localize frontend settings & contacts with availability
        $contacts = $this->core->wpscb_get_contacts();
        foreach ( $contacts as &$c ) {
            if ( ! empty( $c['photo'] ) ) {
                $src = wp_get_attachment_image_src( absint( $c['photo'] ), 'thumbnail' );
                if ( $src ) { $c['photo_url'] = $src[0]; }
            }
        }
        unset($c);

        $advanced = $this->core->wpscb_get_advanced_settings();
        // Add button_image_url if exists
        if ( ! empty( $advanced['button_image'] ) ) {
            $img_src = wp_get_attachment_image_src( absint( $advanced['button_image'] ), 'thumbnail' );
            if ( $img_src ) {
                $advanced['button_image_url'] = $img_src[0];
            }
        }

        wp_localize_script( 'wpscb-front', 'WPSCB_FRONT', array(
            'contacts' => $contacts,
            'settings' => $settings,
            'advanced' => $advanced,
            'isPreview' => $is_preview,
            'timezone' => array(
                'offset' => get_option( 'gmt_offset', 0 ), // WordPress timezone offset in hours
                'string' => wp_timezone_string(), // WordPress timezone string
            ),
            'i18n' => array(
                'chat' => esc_html__( 'Chat', 'wp-social-chat-button' ),
                'poweredBy' => esc_html__( 'Developed by WP Chat Button', 'wp-social-chat-button' ),
                'sponsoredBy' => esc_html__( 'Sponsored by whitestudio.team', 'wp-social-chat-button' ),
            ),
        ) );
    }

    public function wpscb_render_frontend_widget() {
        $settings = $this->core->wpscb_get_settings();

        // Check for preview mode
        $is_preview = isset( $_GET['wpscb_preview'] ) && $_GET['wpscb_preview'] === '1';

        // Skip enabled and contacts check in preview mode
        if ( empty( $settings['enabled'] ) && ! $is_preview ) { return; }
        $contacts = $this->core->wpscb_get_contacts();
        if ( empty( $contacts ) && ! $is_preview ) { return; }

        $position_class = $settings['position'] === 'left' ? 'wpscb-left' : 'wpscb-right';

        echo '<div id="wpscb-widget-root" class="' . esc_attr( $position_class ) . '"></div>';
    }
}
