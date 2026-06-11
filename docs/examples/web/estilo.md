---
name: Web Bands Web
colors:
  surface: '#131313'
  surface-dim: '#131313'
  surface-bright: '#3a3939'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1c1b1b'
  surface-container: '#201f1f'
  surface-container-high: '#2a2a2a'
  surface-container-highest: '#353534'
  on-surface: '#e5e2e1'
  on-surface-variant: '#cfc2d6'
  inverse-surface: '#e5e2e1'
  inverse-on-surface: '#313030'
  outline: '#988d9f'
  outline-variant: '#4d4354'
  surface-tint: '#ddb7ff'
  primary: '#ddb7ff'
  on-primary: '#490080'
  primary-container: '#b76dff'
  on-primary-container: '#400071'
  inverse-primary: '#842bd2'
  secondary: '#5de6ff'
  on-secondary: '#00363e'
  secondary-container: '#00cbe6'
  on-secondary-container: '#00515d'
  tertiary: '#fabc4e'
  on-tertiary: '#432c00'
  tertiary-container: '#bd871a'
  on-tertiary-container: '#3a2600'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#f0dbff'
  primary-fixed-dim: '#ddb7ff'
  on-primary-fixed: '#2c0051'
  on-primary-fixed-variant: '#6900b3'
  secondary-fixed: '#a2eeff'
  secondary-fixed-dim: '#2fd9f4'
  on-secondary-fixed: '#001f25'
  on-secondary-fixed-variant: '#004e5a'
  tertiary-fixed: '#ffdead'
  tertiary-fixed-dim: '#fabc4e'
  on-tertiary-fixed: '#281900'
  on-tertiary-fixed-variant: '#604100'
  background: '#131313'
  on-background: '#e5e2e1'
  surface-variant: '#353534'
  surface-charcoal: '#121214'
  surface-elevated: '#1E1E22'
  glass-stroke: rgba(255, 255, 255, 0.08)
  neon-glow-purple: rgba(168, 85, 247, 0.4)
  neon-glow-cyan: rgba(34, 211, 238, 0.4)
typography:
  display-lg:
    fontFamily: Montserrat
    fontSize: 64px
    fontWeight: '900'
    lineHeight: '1.1'
    letterSpacing: -0.04em
  display-lg-mobile:
    fontFamily: Montserrat
    fontSize: 40px
    fontWeight: '900'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-xl:
    fontFamily: Montserrat
    fontSize: 36px
    fontWeight: '800'
    lineHeight: '1.2'
  headline-lg:
    fontFamily: Montserrat
    fontSize: 28px
    fontWeight: '700'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1'
    letterSpacing: 0.02em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 4px
  container-max: 1280px
  gutter: 24px
  margin-mobile: 16px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
  section-gap: 80px
---

## Brand & Style
The design system is engineered to evoke the high-energy, immersive atmosphere of a late-night electronic rock venue. It targets a modern audience of musicians, promoters, and fans who value technical precision and raw energy. 

The aesthetic is a fusion of **Dark Minimalism** and **Neon Futurism**. It utilizes a "Deep Space" canvas where content is prioritized through high-contrast accents and tactical use of light. The interface should feel like a premium piece of audio hardware—precise, responsive, and tactile. Visual interest is driven by the tension between the void-like background and the vibrant, glowing energy of the interactive elements.

## Colors
The palette is rooted in a "True Black" (#050505) foundation to maximize OLED contrast and depth. 

- **Primary (Electric Purple):** Used for primary actions, active states, and high-energy highlights. 
- **Secondary (Neon Cyan):** Reserved for success states, secondary highlights, and data visualization (e.g., genre tags, stats).
- **Surface Strategy:** We use a hierarchy of charcoal grays to create depth without breaking the dark aesthetic. 
- **Gradients:** Use linear gradients from Primary to Secondary for hero elements or premium CTA buttons to suggest motion and frequency.

## Typography
The typography system uses a high-contrast pairing to establish a clear hierarchy.

- **Headlines:** Montserrat is utilized for its geometric, aggressive presence. Display sizes should use heavy weights (800-900) and tight tracking to mimic concert posters.
- **Body:** Inter provides maximum legibility against dark backgrounds. Its neutral character ensures that long-form descriptions or band bios remain readable without competing with the bold headlines.
- **Labels:** Use uppercase for labels to create a technical, "console" feel for metadata like timestamps or category tags.

## Layout & Spacing
The system uses a **Fluid Grid** with a 12-column structure on desktop. 

- **Breathing Room:** Large vertical gaps (Section Gaps) are used between content blocks to maintain a clean, premium feel. 
- **Content Density:** Band directories should use a 3-column or 4-column grid for band cards to balance information density and visual impact.
- **Mobile:** Transition to a single-column layout with 16px side margins. Horizontal scrolling "chips" or "carousels" should be used for genres or featured lists to save vertical space.

## Elevation & Depth
Depth is created through **Glassmorphism** and **Light-Emitting Borders** rather than traditional drop shadows.

- **Surface Layers:** The background is #050505. Elevated cards use #121214 with a 1px "glass-stroke" border.
- **Backdrop Blur:** Use a `20px` backdrop filter blur on navigation bars and floating modals to create a sense of layered translucent glass.
- **Glow Effects:** Interactive elements emit a soft `0px 0px 15px` outer glow in the primary or secondary color when hovered or active, simulating a neon tube light.

## Shapes
The shape language is "Soft-Technical." We avoid fully organic circles or sharp, aggressive corners. A subtle 0.25rem (4px) or 0.5rem (8px) radius is applied to most elements to provide a modern, professional finish that feels intentional and engineered. 

Buttons and input fields should maintain this consistent radius to feel like part of a unified interface "deck."

## Components
- **Band Cards:** Feature a background image with a dark gradient overlay. On hover, the card scales by 1.02x and the border-color transitions from subtle gray to the primary glow.
- **Buttons:** 
  - *Primary:* Gradient fill (Purple to Cyan), white text, bold weight.
  - *Secondary:* Ghost style with a neon border and no fill.
- **Navigation:** Fixed top bar with high backdrop blur and a thin bottom border (#FFFFFF 10%). Link states use the secondary cyan color.
- **Chips/Tags:** Small, pill-shaped with a dark charcoal background and secondary-colored text. 
- **Inputs:** Darker than the surface color with a focus state that activates a "Neon Cyan" border glow.
- **Animations:** All transitions should use a `cubic-bezier(0.4, 0, 0.2, 1)` timing function for a "snappy yet smooth" feel. Page changes should utilize a subtle 10px vertical slide and fade-in.
