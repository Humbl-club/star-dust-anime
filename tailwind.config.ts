import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
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
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))',
					glow: 'hsl(var(--primary-glow))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				}
			},
			backgroundImage: {
				'gradient-primary': 'var(--gradient-primary)',
				'gradient-secondary': 'var(--gradient-secondary)',
				'gradient-hero': 'var(--gradient-hero)',
				'gradient-card': 'var(--gradient-card)'
			},
			boxShadow: {
				'glow-primary': 'var(--glow-primary)',
				'glow-accent': 'var(--glow-accent)',
				'glow-card': 'var(--glow-card)'
			},
			fontFamily: {
				sans: ['Inter', 'system-ui', 'sans-serif']
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: { height: '0' },
					to: { height: 'var(--radix-accordion-content-height)' }
				},
				'accordion-up': {
					from: { height: 'var(--radix-accordion-content-height)' },
					to: { height: '0' }
				},
				'fade-in': {
					'0%': { opacity: '0', transform: 'translateY(20px)' },
					'100%': { opacity: '1', transform: 'translateY(0)' }
				},
				'fade-in-up': {
					'0%': { opacity: '0', transform: 'translateY(40px)' },
					'100%': { opacity: '1', transform: 'translateY(0)' }
				},
				'scale-in': {
					'0%': { opacity: '0', transform: 'scale(0.9)' },
					'100%': { opacity: '1', transform: 'scale(1)' }
				},
				'slide-in-right': {
					'0%': { opacity: '0', transform: 'translateX(100px)' },
					'100%': { opacity: '1', transform: 'translateX(0)' }
				},
				'bounce-in': {
					'0%': { opacity: '0', transform: 'scale(0.3)' },
					'50%': { opacity: '1', transform: 'scale(1.05)' },
					'70%': { transform: 'scale(0.9)' },
					'100%': { opacity: '1', transform: 'scale(1)' }
				},
				'glow-pulse': {
					'0%, 100%': { boxShadow: '0 0 20px hsl(219 100% 65% / 0.3)' },
					'50%': { boxShadow: '0 0 40px hsl(219 100% 65% / 0.6)' }
				},
				'float': {
					'0%, 100%': { transform: 'translateY(0px)' },
					'50%': { transform: 'translateY(-10px)' }
				},
				'float-delayed': {
					'0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
					'50%': { transform: 'translateY(-15px) rotate(180deg)' }
				},
				'gradient-shift': {
					'0%, 100%': { 
						backgroundPosition: '0% 50%',
						transform: 'scale(1)'
					},
					'50%': { 
						backgroundPosition: '100% 50%',
						transform: 'scale(1.05)'
					}
				},
				'particle-float': {
					'0%, 100%': { 
						transform: 'translateY(0px) translateX(0px) rotate(0deg)',
						opacity: '0.4'
					},
					'25%': { 
						transform: 'translateY(-20px) translateX(10px) rotate(90deg)',
						opacity: '0.8'
					},
					'50%': { 
						transform: 'translateY(-10px) translateX(-10px) rotate(180deg)',
						opacity: '0.6'
					},
					'75%': { 
						transform: 'translateY(-15px) translateX(5px) rotate(270deg)',
						opacity: '0.9'
					}
				},
				'shimmer': {
					'0%': { transform: 'translateX(-100%)' },
					'100%': { transform: 'translateX(100%)' }
				},
				'pulse-glow': {
					'0%, 100%': { 
						boxShadow: '0 0 20px hsl(219 100% 65% / 0.3)',
						transform: 'scale(1)'
					},
					'50%': { 
						boxShadow: '0 0 40px hsl(219 100% 65% / 0.6), 0 0 60px hsl(315 100% 65% / 0.4)',
						transform: 'scale(1.02)'
					}
				},
				'bounce-subtle': {
					'0%, 100%': { transform: 'translateY(0px)' },
					'50%': { transform: 'translateY(-5px)' }
				},
				'slide-up-fade': {
					'0%': { 
						opacity: '0', 
						transform: 'translateY(30px) scale(0.95)' 
					},
					'100%': { 
						opacity: '1', 
						transform: 'translateY(0px) scale(1)' 
					}
				},
				'rotate-slow': {
					'0%': { transform: 'rotate(0deg)' },
					'100%': { transform: 'rotate(360deg)' }
				},
				'background-pan': {
					'0%': { backgroundPosition: '0% 0%' },
					'100%': { backgroundPosition: '100% 100%' }
				},
				'slide-in-from-bottom': {
					'0%': { 
						opacity: '0', 
						transform: 'translateY(100%)' 
					},
					'100%': { 
						opacity: '1', 
						transform: 'translateY(0)' 
					}
				},
				'slide-in-from-top': {
					'0%': { 
						opacity: '0', 
						transform: 'translateY(-100%)' 
					},
					'100%': { 
						opacity: '1', 
						transform: 'translateY(0)' 
					}
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'fade-in': 'fade-in 0.6s ease-out',
				'fade-in-up': 'fade-in-up 0.8s ease-out',
				'scale-in': 'scale-in 0.5s ease-out',
				'slide-in-right': 'slide-in-right 0.7s ease-out',
				'bounce-in': 'bounce-in 0.8s ease-out',
				'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
				'float': 'float 3s ease-in-out infinite',
				'float-delayed': 'float-delayed 4s ease-in-out infinite',
				'gradient-shift': 'gradient-shift 8s ease-in-out infinite',
				'particle-float': 'particle-float 6s ease-in-out infinite',
				'shimmer': 'shimmer 2s ease-in-out infinite',
				'pulse-glow': 'pulse-glow 3s ease-in-out infinite',
				'bounce-subtle': 'bounce-subtle 2s ease-in-out infinite',
				'slide-up-fade': 'slide-up-fade 0.6s ease-out',
				'rotate-slow': 'rotate-slow 20s linear infinite',
				'background-pan': 'background-pan 10s ease-in-out infinite',
				'slide-in-from-bottom': 'slide-in-from-bottom 0.3s ease-out',
				'slide-in-from-top': 'slide-in-from-top 0.3s ease-out'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;