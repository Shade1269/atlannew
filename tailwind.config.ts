import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./index.html",
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	// كلاسات responsive حرجة للهيدر والقائمة — تضمن ظهور واجهة الديسكتوب على الشاشات الكبيرة في الإنتاج
	safelist: [
		"hidden", "block", "flex", "inline", "inline-flex",
		"lg:flex", "lg:block", "lg:hidden", "lg:inline-flex", "lg:py-5", "lg:px-6",
		"md:flex", "md:block", "md:hidden", "md:inline", "md:inline-flex", "md:px-6", "md:gap-2", "md:w-12", "md:h-12", "md:text-2xl",
		"sm:block", "sm:flex", "sm:block",
		"xl:flex", "xl:block",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			// Enhanced Typography System
			fontFamily: {
				'arabic': ['Noto Sans Arabic', 'Arial', 'sans-serif'],
				'noto': ['Noto Sans Arabic', 'Arial', 'sans-serif'], // backward compatibility
				'display': ['Noto Sans Arabic', 'Inter', 'system-ui', 'sans-serif'],
				'body': ['Noto Sans Arabic', 'Inter', 'system-ui', 'sans-serif'],
			},
			fontSize: {
				'xs': ['0.75rem', { lineHeight: '1rem' }],
				'sm': ['0.875rem', { lineHeight: '1.25rem' }], 
				'base': ['1rem', { lineHeight: '1.5rem' }],
				'lg': ['1.125rem', { lineHeight: '1.75rem' }],
				'xl': ['1.25rem', { lineHeight: '1.75rem' }],
				'2xl': ['1.5rem', { lineHeight: '2rem' }],
				'3xl': ['1.875rem', { lineHeight: '2.25rem' }],
				'4xl': ['2.25rem', { lineHeight: '2.5rem' }],
				'5xl': ['3rem', { lineHeight: '1' }],
				'6xl': ['3.75rem', { lineHeight: '1' }],
				'7xl': ['4.5rem', { lineHeight: '1' }],
				'8xl': ['6rem', { lineHeight: '1' }],
				'9xl': ['8rem', { lineHeight: '1' }],
			},
			spacing: {
				'0.5': '0.125rem',
				'1.5': '0.375rem',
				'2.5': '0.625rem',
				'3.5': '0.875rem',
				'4.5': '1.125rem',
				'5.5': '1.375rem',
				'6.5': '1.625rem',
				'7.5': '1.875rem',
				'8.5': '2.125rem',
				'9.5': '2.375rem',
				'10.5': '2.625rem',
				'11': '2.75rem',
				'13': '3.25rem',
				'15': '3.75rem',
				'17': '4.25rem',
				'18': '4.5rem',
				'19': '4.75rem',
				'21': '5.25rem',
				'22': '5.5rem',
				'23': '5.75rem',
				'25': '6.25rem',
				'26': '6.5rem',
				'27': '6.75rem',
				'28': '7rem',
				'29': '7.25rem',
				'30': '7.5rem',
				'32': '8rem',
				'36': '9rem',
				'40': '10rem',
				'44': '11rem',
				'48': '12rem',
				'52': '13rem',
				'56': '14rem',
				'60': '15rem',
				'64': '16rem',
				'72': '18rem',
				'80': '20rem',
				'96': '24rem',
			},
                        colors: {
                                bg: 'hsl(var(--bg) / <alpha-value>)',
                                fg: 'hsl(var(--fg) / <alpha-value>)',
                                border: 'hsl(var(--border) / <alpha-value>)',
                                input: 'hsl(var(--muted) / <alpha-value>)',
                                ring: 'hsl(var(--primary) / <alpha-value>)',
                                background: 'hsl(var(--background) / <alpha-value>)',
                                foreground: 'hsl(var(--foreground) / <alpha-value>)',
                                primary: {
                                        DEFAULT: 'hsl(var(--primary) / <alpha-value>)',
                                        foreground: 'hsl(var(--primary-fg) / <alpha-value>)',
                                        fg: 'hsl(var(--primary-fg) / <alpha-value>)',
                                        glow: 'hsl(var(--primary) / <alpha-value>)',
                                        dark: 'color-mix(in srgb, var(--primary) 85%, #000 15%)'
                                },
				'primary-fg': 'hsl(var(--primary-fg) / <alpha-value>)',
				'primary-foreground': 'hsl(var(--primary-fg) / <alpha-value>)',
                                secondary: {
                                        DEFAULT: 'hsl(var(--secondary) / <alpha-value>)',
                                        foreground: 'hsl(var(--secondary-fg) / <alpha-value>)'
                                },
				'secondary-fg': 'hsl(var(--secondary-fg) / <alpha-value>)',
                                destructive: {
                                        DEFAULT: 'hsl(var(--danger) / <alpha-value>)',
                                        foreground: 'hsl(var(--destructive-foreground) / <alpha-value>)'
                                },
                                muted: {
                                        DEFAULT: 'hsl(var(--muted) / <alpha-value>)',
                                        foreground: 'hsl(var(--muted-foreground) / <alpha-value>)'
                                },
				'muted-foreground': 'hsl(var(--muted-foreground) / <alpha-value>)',
				success: {
					DEFAULT: 'hsl(var(--success) / <alpha-value>)'
				},
				warning: {
					DEFAULT: 'hsl(var(--warning) / <alpha-value>)'
				},
				danger: {
					DEFAULT: 'hsl(var(--danger) / <alpha-value>)'
				},
				info: {
					DEFAULT: 'hsl(var(--info) / <alpha-value>)'
				},
                                accent: {
                                        DEFAULT: 'hsl(var(--accent) / <alpha-value>)',
                                        glow: 'color-mix(in srgb, var(--accent) 65%, #fff 35%)',
                                        foreground: 'hsl(var(--accent-fg) / <alpha-value>)'
                                },
                                popover: {
                                        DEFAULT: 'hsl(var(--popover) / <alpha-value>)',
                                        foreground: 'hsl(var(--popover-foreground) / <alpha-value>)'
                                },
                                card: {
                                        DEFAULT: 'hsl(var(--card) / <alpha-value>)',
                                        foreground: 'hsl(var(--card-foreground) / <alpha-value>)'
                                },
                                luxury: {
                                        DEFAULT: 'hsl(var(--luxury) / <alpha-value>)',
                                        foreground: 'hsl(var(--luxury-foreground) / <alpha-value>)'
                                },
                                premium: {
                                        DEFAULT: 'hsl(var(--premium) / <alpha-value>)',
                                        foreground: 'hsl(var(--premium-foreground) / <alpha-value>)'
                                },
                                persian: {
                                        DEFAULT: 'hsl(var(--persian) / <alpha-value>)',
                                        foreground: 'hsl(var(--persian-foreground) / <alpha-value>)'
                                },
                                turquoise: {
                                        DEFAULT: 'hsl(var(--turquoise) / <alpha-value>)',
                                        foreground: 'hsl(var(--turquoise-foreground) / <alpha-value>)'
                                },
                                bronze: {
                                        DEFAULT: 'hsl(var(--bronze) / <alpha-value>)',
                                        foreground: 'hsl(var(--bronze-foreground) / <alpha-value>)'
                                },
                                olive: {
                                        DEFAULT: 'hsl(var(--olive) / <alpha-value>)',
                                        foreground: 'hsl(var(--olive-foreground) / <alpha-value>)'
                                },
                                coral: {
                                        DEFAULT: 'hsl(var(--coral) / <alpha-value>)',
                                        foreground: 'hsl(var(--coral-foreground) / <alpha-value>)'
                                },
                                pearl: {
                                        DEFAULT: 'hsl(var(--pearl) / <alpha-value>)',
                                        foreground: 'hsl(var(--pearl-foreground) / <alpha-value>)'
                                },
                                jasmine: {
                                        DEFAULT: 'hsl(var(--jasmine) / <alpha-value>)',
                                        foreground: 'hsl(var(--jasmine-foreground) / <alpha-value>)'
                                },
                                chat: {
                                        bg: 'hsl(var(--chat-bg) / <alpha-value>)',
                                        sent: 'hsl(var(--chat-sent) / <alpha-value>)',
                                        received: 'hsl(var(--chat-received) / <alpha-value>)',
                                },
                                status: {
                                        online: 'hsl(var(--status-online) / <alpha-value>)',
                                        offline: 'hsl(var(--status-offline) / <alpha-value>)',
                                },
				// Anaqati Theme Colors
				anaqati: {
					burgundy: '#5A2647',
					'burgundy-hover': '#743366',
					'burgundy-active': '#401132',
					pink: '#F4C2C2',
					'pink-light': '#FBECEC',
					'pink-hover': '#EDB3B3',
					gold: '#C89B3C',
					'gold-light': '#D4AF4F',
					cream: '#FDF8F6',
					'cream-warm': '#FFF3EF',
					text: '#2F2B2C',
					'text-secondary': '#7B6E70',
					border: '#E6D8D3',
					'product-bg': '#F4ECE8',
					success: '#2E7D32',
					danger: '#D64545',
					warning: '#D4A574',
					info: '#A7B3E8',
					accent: '#C89B3C',
				}
			},
			backgroundImage: {
				// Primary gradients using CSS variables for theme support
				'gradient-primary': 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary) / 0.8) 100%)',
				'gradient-secondary': 'linear-gradient(135deg, hsl(var(--secondary)) 0%, hsl(var(--secondary) / 0.8) 100%)',
				'gradient-accent': 'linear-gradient(135deg, hsl(var(--accent)) 0%, hsl(var(--accent) / 0.8) 100%)',
				
				// Semantic gradients
				'gradient-hero': 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--accent)) 50%, hsl(var(--luxury)) 100%)',
				'gradient-luxury': 'linear-gradient(135deg, hsl(var(--luxury)) 0%, hsl(var(--premium)) 100%)',
				'gradient-premium': 'linear-gradient(135deg, hsl(var(--premium)) 0%, hsl(var(--premium) / 0.7) 100%)',
				'gradient-persian': 'linear-gradient(135deg, hsl(var(--persian)) 0%, hsl(var(--turquoise)) 100%)',
				'gradient-commerce': 'linear-gradient(135deg, hsl(var(--turquoise)) 0%, hsl(var(--turquoise) / 0.7) 100%)',
				
				// Status gradients
				'gradient-success': 'linear-gradient(135deg, hsl(var(--success)) 0%, hsl(var(--success) / 0.7) 100%)',
				'gradient-warning': 'linear-gradient(135deg, hsl(var(--warning)) 0%, hsl(var(--warning) / 0.7) 100%)',
				'gradient-danger': 'linear-gradient(135deg, hsl(var(--danger)) 0%, hsl(var(--danger) / 0.7) 100%)',
				'gradient-info': 'linear-gradient(135deg, hsl(var(--info)) 0%, hsl(var(--info) / 0.7) 100%)',
				
				// Glass & subtle effects
				'gradient-glass': 'linear-gradient(135deg, hsl(var(--card) / 0.1) 0%, hsl(var(--card) / 0.05) 100%)',
				'gradient-glass-light': 'linear-gradient(to bottom, hsl(var(--background) / 0) 0%, hsl(var(--background) / 0.6) 100%)',
				'gradient-muted': 'linear-gradient(135deg, hsl(var(--muted)) 0%, hsl(var(--muted) / 0.5) 100%)',
				
				// Special effects
				'gradient-shimmer': 'linear-gradient(90deg, transparent 0%, hsl(var(--primary) / 0.1) 50%, transparent 100%)',
				'gradient-fade': 'linear-gradient(to bottom, hsl(var(--background)) 0%, transparent 100%)',
				'gradient-radial': 'radial-gradient(circle at center, hsl(var(--primary) / 0.2) 0%, transparent 70%)',
			},
			boxShadow: {
				'card': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
				'soft': '0 2px 8px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.1)',
				'glow': '0 0 20px rgba(59, 130, 246, 0.3), 0 0 40px rgba(59, 130, 246, 0.1)',
				'luxury': '0 8px 32px rgba(212, 175, 55, 0.3), 0 0 20px rgba(212, 175, 55, 0.2)',
				'glass': '0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
				'elegant': '0 4px 20px rgba(0, 0, 0, 0.15), 0 2px 8px rgba(0, 0, 0, 0.1)',
				'persian': '0 8px 32px rgba(5, 150, 105, 0.3), 0 0 20px rgba(5, 150, 105, 0.2)',
				'heritage': '0 8px 32px rgba(205, 127, 50, 0.3), 0 0 20px rgba(205, 127, 50, 0.2)',
				'premium': '0 8px 32px rgba(139, 92, 246, 0.3), 0 0 20px rgba(139, 92, 246, 0.2)',
				'ocean': '0 8px 32px rgba(6, 182, 212, 0.3), 0 0 20px rgba(6, 182, 212, 0.2)',
				'sunset': '0 8px 32px rgba(255, 127, 80, 0.3), 0 0 20px rgba(255, 127, 80, 0.2)',
				'forest': '0 8px 32px rgba(5, 150, 105, 0.3), 0 0 20px rgba(5, 150, 105, 0.2)',
				'purple': '0 8px 32px rgba(139, 92, 246, 0.3), 0 0 20px rgba(139, 92, 246, 0.2)',
				'gold': '0 8px 32px rgba(212, 175, 55, 0.3), 0 0 20px rgba(212, 175, 55, 0.2)',
				// Anaqati Theme Shadows
				'anaqati': '0 4px 24px rgba(90, 38, 71, 0.06)',
				'anaqati-hover': '0 8px 40px rgba(90, 38, 71, 0.1)',
				'anaqati-gold': '0 4px 20px rgba(200, 155, 60, 0.2)',
				'anaqati-pink': '0 4px 20px rgba(244, 194, 194, 0.3)',
			},
			transitionTimingFunction: {
				'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
				'bounce': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
			},
                        borderRadius: {
                                sm: 'var(--radius-sm)',
                                md: 'var(--radius-md)',
                                lg: 'var(--radius-lg)',
                                xl: '1rem',
                                '2xl': '1.25rem'
                        },
                        backdropBlur: {
                                xs: '2px'
                        },
			keyframes: {
				// Basic UI Animations
				'accordion-down': {
					from: { height: '0', opacity: '0' },
					to: { height: 'var(--radix-accordion-content-height)', opacity: '1' }
				},
				'accordion-up': {
					from: { height: 'var(--radix-accordion-content-height)', opacity: '1' },
					to: { height: '0', opacity: '0' }
				},
				'fade-in': {
					'0%': { opacity: '0', transform: 'translateY(10px)' },
					'100%': { opacity: '1', transform: 'translateY(0)' }
				},
				'fade-out': {
					'0%': { opacity: '1', transform: 'translateY(0)' },
					'100%': { opacity: '0', transform: 'translateY(10px)' }
				},
				'scale-in': {
					'0%': { transform: 'scale(0.95)', opacity: '0' },
					'100%': { transform: 'scale(1)', opacity: '1' }
				},
				'scale-out': {
					from: { transform: 'scale(1)', opacity: '1' },
					to: { transform: 'scale(0.95)', opacity: '0' }
				},
				'slide-in-right': {
					'0%': { transform: 'translateX(100%)' },
					'100%': { transform: 'translateX(0)' }
				},
				'slide-out-right': {
					'0%': { transform: 'translateX(0)' },
					'100%': { transform: 'translateX(100%)' }
				},
				'slide-in-left': {
					'0%': { transform: 'translateX(-100%)' },
					'100%': { transform: 'translateX(0)' }
				},
				'slide-out-left': {
					'0%': { transform: 'translateX(0)' },
					'100%': { transform: 'translateX(-100%)' }
				},
				'slide-in-up': {
					'0%': { transform: 'translateY(100%)' },
					'100%': { transform: 'translateY(0)' }
				},
				'slide-out-down': {
					'0%': { transform: 'translateY(0)' },
					'100%': { transform: 'translateY(100%)' }
				},
				'bounce-in': {
					'0%': { transform: 'scale(0.3)', opacity: '0' },
					'50%': { transform: 'scale(1.05)' },
					'70%': { transform: 'scale(0.95)' },
					'100%': { transform: 'scale(1)', opacity: '1' }
				},
				'shake': {
					'0%, 100%': { transform: 'translateX(0)' },
					'10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-2px)' },
					'20%, 40%, 60%, 80%': { transform: 'translateX(2px)' }
				},
				'pulse-glow': {
					'0%, 100%': { boxShadow: '0 0 5px hsl(var(--primary))' },
					'50%': { boxShadow: '0 0 20px hsl(var(--primary))' }
				},
				// Persian Heritage Animations
				'persian-glow': {
					'0%': { boxShadow: '0 0 20px hsl(var(--primary) / 0.3)' },
					'50%': { boxShadow: '0 0 40px hsl(var(--primary) / 0.6)' },
					'100%': { boxShadow: '0 0 20px hsl(var(--primary) / 0.3)' }
				},
				'persian-float': {
					'0%, 100%': { transform: 'translateY(0px)' },
					'50%': { transform: 'translateY(-10px)' }
				},
				'persian-shimmer': {
					'0%': { backgroundPosition: '-200% 0' },
					'100%': { backgroundPosition: '200% 0' }
				},
				'heritage-wave': {
					'0%, 100%': { transform: 'rotate(0deg)' },
					'25%': { transform: 'rotate(1deg)' },
					'75%': { transform: 'rotate(-1deg)' }
				},
				'arabesque-rotate': {
					'0%': { transform: 'rotate(0deg)' },
					'100%': { transform: 'rotate(360deg)' }
				},
			},
			animation: {
				// Basic UI Animations
				'accordion-down': 'accordion-down 0.3s ease-out',
				'accordion-up': 'accordion-up 0.3s ease-out',
				'fade-in': 'fade-in 0.3s ease-out',
				'fade-out': 'fade-out 0.3s ease-out',
				'scale-in': 'scale-in 0.2s ease-out',
				'scale-out': 'scale-out 0.2s ease-out',
				'slide-in-right': 'slide-in-right 0.3s ease-out',
				'slide-out-right': 'slide-out-right 0.3s ease-out',
				'slide-in-left': 'slide-in-left 0.3s ease-out',
				'slide-out-left': 'slide-out-left 0.3s ease-out',
				'slide-in-up': 'slide-in-up 0.3s ease-out',
				'slide-out-down': 'slide-out-down 0.3s ease-out',
				'bounce-in': 'bounce-in 0.6s ease-out',
				'shake': 'shake 0.5s ease-in-out',
				'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
				// Combined Animations
				'enter': 'fade-in 0.3s ease-out, scale-in 0.2s ease-out',
				'exit': 'fade-out 0.3s ease-out, scale-out 0.2s ease-out',
				// Persian Heritage Animations
				'persian-glow': 'persian-glow 4s ease-in-out infinite',
				'persian-float': 'persian-float 6s ease-in-out infinite',
				'persian-shimmer': 'persian-shimmer 3s linear infinite',
				'heritage-wave': 'heritage-wave 8s ease-in-out infinite',
				'arabesque-rotate': 'arabesque-rotate 20s linear infinite',
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
