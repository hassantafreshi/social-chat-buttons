<?php
if ( ! defined( 'ABSPATH' ) ) { exit; }

class WPSCB_Frontend {
    private $core;

    public function __construct( $core ) {
        $this->core = $core;
        add_action( 'wp_enqueue_scripts', array( $this, 'wpscb_enqueue_front_assets' ) );
        add_action( 'wp_footer', array( $this, 'wpscb_render_frontend_widget' ) );
        add_action( 'wp_footer', array( $this, 'efb_output_schema_free' ) );


    }

    public function wpscb_enqueue_front_assets() {
        $settings = $this->core->wpscb_get_settings();
        $is_preview =false; // Set to true if in preview mode
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
            $poweredBy = $this->core->wpscb_copyright_notice('public');
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
                /* translators: Text displayed on the frontend widget to initiate a chat */
                'chat' => esc_html__( 'Chat', 'social-chat-buttons' ),
                'poweredBy' =>  $poweredBy,
            ),
        ) );
    }

    public function wpscb_render_frontend_widget() {
        $settings = $this->core->wpscb_get_settings();

        // Skip enabled and contacts check in preview mode
        if ( empty( $settings['enabled'] )  ) { return; }
        $contacts = $this->core->wpscb_get_contacts();
        if ( empty( $contacts )  ) { return; }

        $position_class = $settings['position'] === 'left' ? 'wpscb-left' : 'wpscb-right';

        echo '<div id="wpscb-widget-root" class="' . esc_attr( $position_class ) . '"></div>';
    }

    public function efb_output_schema_free() {
		$page_url = home_url( add_query_arg( [], sanitize_text_field( wp_unslash( $_SERVER['REQUEST_URI'] ?? '/' ) ) ) );
		$locale = get_locale();
		$lang   = str_replace('_', '-', $locale);
		$ws_url = 'https://whitestudio.team';
		$wp_url = 'https://wordpress.org/plugins/social-chat-buttons/';
		$schema = [
			'@context' => 'https://schema.org',
			'@type'    => 'WebPage',
			'@id'      => $page_url . '#webpage',
			'url'      => $page_url,
			'mentions' => [
				'@type' => 'SoftwareApplication',
				'@id'   => $wp_url . '#software',
				'name'  => esc_html__( 'Social Chat Buttons', 'social-chat-buttons' ),
				/* translators: %s: plugin name */
				'alternateName' => sprintf( esc_html__( '%s – Free WhatsApp & Social Chat Widget for WordPress', 'social-chat-buttons' ), esc_html__( 'Social Chat Buttons', 'social-chat-buttons' ) ),
				/* translators: %s: plugin name */
				'description' => sprintf( esc_html__( '%s lets you add WhatsApp, Telegram, and social chat buttons to your WordPress site so visitors can start a conversation with one click. Lightweight, mobile-friendly, and completely free.', 'social-chat-buttons' ), esc_html__( 'Social Chat Buttons', 'social-chat-buttons' ) ),
				'applicationCategory' => ['BusinessApplication', 'WebApplication', 'CommunicationApplication'],
				'operatingSystem'     => 'WordPress',
				'softwareVersion'     => defined('WPSCB_PLUGIN_VERSION') ? WPSCB_PLUGIN_VERSION : '1.0.2',
				'url'   => $wp_url,
				'downloadUrl' => $wp_url,
				'isAccessibleForFree' => true,
				'offers' => [
					'@type' => 'Offer',
					'price' => '0',
					'priceCurrency' => 'USD',
				],
				'keywords' => [
					esc_html__( 'WordPress WhatsApp chat plugin', 'social-chat-buttons' ),
					esc_html__( 'social chat widget', 'social-chat-buttons' ),
					esc_html__( 'free WordPress chat button', 'social-chat-buttons' ),
					esc_html__( 'WhatsApp button WordPress', 'social-chat-buttons' ),
					esc_html__( 'Telegram chat plugin', 'social-chat-buttons' ),
					esc_html__( 'live chat widget', 'social-chat-buttons' ),
				],
				'publisher' => [
					'@type' => 'Organization',
					'@id'   => $ws_url . '/#organization',
					'name'  => 'White Studio Team',
					'url'   => $ws_url
				],
				'inLanguage' => $lang
			]
		];

		echo '<script type="application/ld+json">' . wp_json_encode( $schema, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE ) . '</script>' . "\n";
	}
}
