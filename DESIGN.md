---
colors:
  error: "#C62828"
  neutral-0: "#FFFFFF"
  neutral-100: "#E9E9E9"
  neutral-300: "#C7C7C7"
  neutral-50: "#F5F5F5"
  neutral-500: "#777777"
  neutral-800: "#222222"
  neutral-950: "#0A0A0A"
  overlay: rgba(0, 0, 0, 0.42)
  primary: "#061A33"
  primary-light: "#0B4B86"
  secondary: "#E10600"
  secondary-dark: "#B80000"
  success: "#167A4A"
  warning: "#B77900"
components:
  badge:
    backgroundColor: "{colors.neutral-950}"
    padding: 6px 10px
    rounded: "{rounded.pill}"
    textColor: "{colors.neutral-0}"
  button-primary:
    backgroundColor: "{colors.secondary}"
    height: 52px
    padding: 16px 28px
    rounded: "{rounded.sm}"
    textColor: "{colors.neutral-0}"
  button-primary-hover:
    backgroundColor: "{colors.secondary-dark}"
    height: 52px
    padding: 16px 28px
    rounded: "{rounded.sm}"
    textColor: "{colors.neutral-0}"
  button-secondary:
    backgroundColor: "{colors.neutral-0}"
    height: 52px
    padding: 15px 27px
    rounded: "{rounded.sm}"
    textColor: "{colors.neutral-950}"
  button-secondary-hover:
    backgroundColor: "{colors.neutral-100}"
    height: 52px
    padding: 15px 27px
    rounded: "{rounded.sm}"
    textColor: "{colors.neutral-950}"
  filter-bar:
    backgroundColor: "{colors.neutral-0}"
    padding: 20px 24px
    rounded: "{rounded.sm}"
    textColor: "{colors.neutral-950}"
  header:
    backgroundColor: "{colors.neutral-0}"
    height: 128px
    padding: 0 56px
    textColor: "{colors.neutral-950}"
  hero:
    height: 680px
    rounded: "{rounded.none}"
    textColor: "{colors.neutral-0}"
  input:
    backgroundColor: "{colors.neutral-0}"
    height: 48px
    padding: 12px 16px
    rounded: "{rounded.sm}"
    textColor: "{colors.neutral-950}"
  price:
    textColor: "{colors.neutral-950}"
    typography: "{typography.heading-md}"
  topbar:
    backgroundColor: "{colors.primary}"
    height: 48px
    padding: 0 56px
    textColor: "{colors.neutral-0}"
  vehicle-card:
    backgroundColor: "{colors.neutral-0}"
    padding: 0
    rounded: "{rounded.sm}"
    textColor: "{colors.neutral-950}"
  vehicle-card-image:
    height: 260px
    rounded: "{rounded.sm}"
description: "Sistema visual para un sitio web premium de venta de
  motocicletas, inspirado en la captura de referencia: navegación
  editorial, estética motorsport, alto contraste, fotografía
  protagonista y llamados a la acción en rojo."
name: Moto Premium Marketplace
rounded:
  lg: 8px
  md: 4px
  none: 0px
  pill: 9999px
  sm: 2px
spacing:
  2xl: 48px
  3xl: 64px
  4xl: 96px
  lg: 24px
  md: 16px
  sm: 12px
  xl: 32px
  xs: 8px
  xxs: 4px
typography:
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: 400
    letterSpacing: 0em
    lineHeight: 1.55
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: 400
    letterSpacing: 0em
    lineHeight: 1.5
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: 400
    letterSpacing: 0em
    lineHeight: 1.45
  display-lg:
    fontFamily: Barlow Condensed
    fontSize: 52px
    fontWeight: 600
    letterSpacing: "-0.015em"
    lineHeight: 1
  display-xl:
    fontFamily: Barlow Condensed
    fontSize: 64px
    fontWeight: 600
    letterSpacing: "-0.02em"
    lineHeight: 0.98
  heading-lg:
    fontFamily: Barlow Condensed
    fontSize: 40px
    fontWeight: 600
    letterSpacing: 0em
    lineHeight: 1.05
  heading-md:
    fontFamily: Barlow Condensed
    fontSize: 30px
    fontWeight: 600
    letterSpacing: 0em
    lineHeight: 1.1
  heading-sm:
    fontFamily: Barlow Condensed
    fontSize: 24px
    fontWeight: 600
    letterSpacing: 0em
    lineHeight: 1.15
  label-caps:
    fontFamily: Barlow Condensed
    fontSize: 14px
    fontWeight: 600
    letterSpacing: 0.08em
    lineHeight: 1
version: alpha
---

## Overview

**Premium motorsport editorial meets modern motorcycle commerce.**

The site should feel like a premium motorcycle brand showroom translated
into a digital sales experience: fast, confident, technical and
aspirational without becoming visually noisy. The motorcycle and its
photography are the protagonists.

The visual language is built around **deep navy, white and performance
red**, with large condensed headlines, uppercase navigation labels,
strong photographic compositions and generous negative space. The
reference image establishes a full-width editorial hero with a dark
image treatment, white headline typography and a single high-visibility
red CTA.

The experience should communicate:

-   **Performance:** dynamic photography, strong typography and decisive
    CTAs.
-   **Premium quality:** restrained palette, precise spacing and minimal
    decoration.
-   **Confidence:** short labels, direct language and clear hierarchy.
-   **Commerce:** every model page should make price, availability,
    specifications and contact actions easy to find.
-   **Human aspiration:** motorcycles should be shown in lifestyle
    contexts as well as isolated product views.

Do not copy the exact Ducati/Scrambler logo, proprietary typography or
trademarked brand assets from the reference. Reproduce the **visual
principles**, not the protected brand identity, unless those assets are
explicitly supplied by the project owner.

The design is **desktop-first in composition but fully responsive**. On
mobile, preserve the same hierarchy rather than simply shrinking desktop
layouts.

## Colors

The palette is intentionally limited. **Deep navy** establishes the
brand environment, **red** is reserved for conversion and important
interactive actions, and **white/light neutrals** keep product
information clean.

-   **Primary (#061A33):** deep navy for top bars, dark backgrounds,
    footer areas and brand framing.
-   **Primary Light (#0B4B86):** blue used for subtle gradients, active
    navigation accents and secondary brand surfaces.
-   **Secondary (#E10600):** performance red. This is the principal
    action color for CTAs such as "Comprar", "Consultar", "Solicitar
    test ride" and "Ver modelo".
-   **Secondary Dark (#B80000):** hover/pressed state for red actions.
-   **Neutral 0 (#FFFFFF):** primary surface and reverse text.
-   **Neutral 50 (#F5F5F5):** page background and alternating content
    sections.
-   **Neutral 100 (#E9E9E9):** subtle surface separation.
-   **Neutral 300 (#C7C7C7):** borders and disabled controls.
-   **Neutral 500 (#777777):** metadata and secondary copy.
-   **Neutral 800 (#222222):** standard dark text.
-   **Neutral 950 (#0A0A0A):** strongest text and product pricing.
-   **Overlay (rgba(0,0,0,0.42)):** image overlay used to guarantee
    readable hero text.
-   **Success (#167A4A):** availability and confirmation states.
-   **Warning (#B77900):** stock or attention states.
-   **Error (#C62828):** validation and destructive feedback.

**Color rules**

-   Red should have a clear purpose. Do not turn every link, badge or
    decorative element red.
-   Use red primarily for the **single most important action** in a
    local UI region.
-   White text over photography must sit on a sufficiently dark image
    treatment.
-   Never place small gray text on white if it falls below accessible
    contrast.
-   Avoid gradients as decoration. Gradients are allowed only as subtle
    image overlays or depth aids.

## Typography

Typography should reproduce the energetic, condensed editorial feel of
the reference while remaining highly readable for commerce content.

**Primary typefaces**

-   **Barlow Condensed:** display headlines, navigation labels, buttons,
    prices when visually prominent, model names and technical labels.
-   **Inter:** body copy, descriptions, forms, filters, specifications
    and supporting information.

Use uppercase selectively for navigation, labels and CTAs. Do not
uppercase paragraphs or long descriptions.

### Typography hierarchy

-   **Display XL:** 64px / 0.98 / 600 --- hero headlines on large
    desktop screens.
-   **Display LG:** 52px / 1.0 / 600 --- secondary hero or campaign
    headlines.
-   **Heading LG:** 40px / 1.05 / 600 --- major section headings.
-   **Heading MD:** 30px / 1.1 / 600 --- product/model headings and card
    prices.
-   **Heading SM:** 24px / 1.15 / 600 --- subsections.
-   **Body LG:** 18px / 1.55 / 400 --- lead copy.
-   **Body MD:** 16px / 1.5 / 400 --- default body text.
-   **Body SM:** 14px / 1.45 / 400 --- metadata and supporting copy.
-   **Label Caps:** 14px / 1 / 600 with 0.08em tracking --- navigation,
    filters, badges and compact UI labels.

**Responsive type**

At viewport widths below 768px:

-   Display XL → 42px.
-   Display LG → 36px.
-   Heading LG → 32px.
-   Heading MD → 26px.
-   Body sizes remain 14--16px unless the content benefits from a larger
    lead.

Do not use more than three font weights in one screen.

## Layout

The layout is based on a **full-bleed editorial composition combined
with a constrained commerce grid**.

### Global structure

1.  Thin dark-blue utility/top bar.
2.  Main white navigation bar with menu, navigation, centered brand mark
    and right-side actions.
3.  Full-width hero/campaign area.
4.  Product discovery and motorcycle catalog sections.
5.  Editorial/lifestyle sections.
6.  Conversion CTA.
7.  Dark footer.

The navigation shown in the reference is intentionally spacious. The
brand mark sits centrally while primary navigation occupies the left and
utility actions occupy the right.

### Container

-   Desktop maximum content width: **1440px**.
-   Standard desktop side margin: **56px**.
-   Tablet side margin: **32px**.
-   Mobile side margin: **20px**.
-   Content grid gutter: **24px** desktop, **16px** mobile.

### Spacing

Use the defined spacing tokens consistently. Prefer larger whitespace
between sections rather than decorative separators.

-   Small UI gap: 8--12px.
-   Component gap: 16--24px.
-   Card/content gap: 24--32px.
-   Section padding: 64--96px desktop.
-   Hero content inset: approximately 7% of viewport width, capped by
    the main container.

### Hero

The hero is a defining component.

-   Full viewport width.
-   Desktop target height: 620--700px.
-   Motorcycle photography fills the entire background.
-   Apply a dark left-to-right overlay so the headline remains readable.
-   Align copy to the left third of the composition.
-   Keep the primary CTA visually isolated.
-   Use a maximum headline width of approximately 720px.
-   Do not place critical text over the motorcycle's face, wheels or key
    product details when the image provides a clean alternative.

The hero should feel cinematic, not like a generic carousel.

### Product catalog

Use a responsive grid:

-   Desktop: 3 or 4 cards per row depending on available width.
-   Tablet: 2 cards.
-   Mobile: 1 card.

Cards should align visually even when model names or metadata have
different lengths.

### Vehicle detail page

Recommended hierarchy:

1.  Image gallery.
2.  Model name and short positioning statement.
3.  Price and availability.
4.  Primary CTA.
5.  Key technical specifications.
6.  Equipment/features.
7.  Financing or purchase information.
8.  Test ride/contact CTA.
9.  Related motorcycles.

The purchase action should remain easy to find without competing with
the product photography.

### Responsive behavior

At widths below 1024px:

-   Collapse secondary navigation.
-   Reduce header height.
-   Convert multi-column grids to 2 columns where appropriate.
-   Preserve strong horizontal padding.

At widths below 768px:

-   Replace desktop navigation with a compact menu.
-   Keep the brand mark visible.
-   Stack hero content vertically.
-   Reduce hero height to approximately 520--600px.
-   Use one-column product cards.
-   Convert filter bars into a horizontal scroll or expandable filter
    drawer.
-   Keep CTAs full-width where they improve touch usability.

At widths below 480px:

-   Use 20px horizontal page padding.
-   Avoid side-by-side CTAs.
-   Keep tap targets at least 44px high.

## Elevation & Depth

The design should feel **flat, precise and premium**, not like a
dashboard.

Use hierarchy primarily through:

1.  photography,
2.  tonal contrast,
3.  whitespace,
4.  typography,
5.  thin borders.

Shadows should be subtle and functional.

-   Default card shadow: none or extremely soft.
-   Hovered product card: slight elevation is acceptable.
-   Dropdowns and overlays: use a soft shadow sufficient to separate
    them from the page.
-   Avoid heavy neumorphism, glowing effects or large blurred shadows.

Hero depth comes from the photographic overlay rather than box shadows.

## Shapes

The shape language is **sharp and engineered**.

-   Default radius: 2--4px.
-   Cards: 2--4px.
-   Buttons: 2--4px.
-   Inputs: 2--4px.
-   Pills: reserved for compact status badges, not primary buttons.
-   Avoid large rounded "SaaS-style" cards with 16--24px radius.
-   Avoid mixing highly rounded components with sharp components in the
    same UI region.

Buttons should look like physical controls: compact, confident and easy
to scan.

## Components

### Header

The header is a major brand element.

**Desktop**

-   Dark-blue utility strip at the top.
-   White main navigation.
-   Hamburger/menu icon at the left.
-   Primary navigation labels in uppercase condensed typography.
-   Brand mark centered.
-   Test ride/contact and dealer/location actions on the right.

**Behavior**

-   Sticky navigation is allowed.
-   On scroll, reduce vertical height but preserve the white surface and
    clear brand presence.
-   Never let the header obscure important hero content.

### Buttons

**Primary**

-   Red background.
-   White uppercase text.
-   52px target height desktop.
-   44px minimum touch height mobile.
-   2--4px radius.
-   Medium/semibold condensed label.
-   No gradient.

**Secondary**

-   White or transparent background.
-   Dark text.
-   Thin dark border.
-   Same dimensions as primary when paired.

**Text action**

-   No filled background.
-   Dark text with a clear underline or arrow indicator.
-   Use for low-priority navigation only.

### Vehicle cards

Each card should answer three questions immediately:

1.  What motorcycle is this?
2.  What does it cost?
3.  What is the next action?

Recommended structure:

-   Large product image.
-   Optional availability/badge.
-   Model family/category.
-   Model name.
-   Short specification line.
-   Price.
-   CTA.

On hover, the image may scale very slightly (approximately 1.02), but
the layout must not jump.

### Filters

Catalog filters should feel like a dealership tool, not a generic admin
interface.

Recommended filters:

-   Marca
-   Modelo
-   Cilindrada
-   Año
-   Precio
-   Tipo
-   Disponibilidad

Use compact labels and clear selected states.

### Search

Search should support model name, brand and relevant vehicle attributes.

-   White surface.
-   Dark border.
-   Clear focus state using primary blue.
-   Search icon inside the field.
-   Never rely on placeholder text as the only label.

### Badges

Use badges sparingly for:

-   Nuevo
-   Disponible
-   Oferta
-   Últimas unidades

Badges should be compact and never overpower the motorcycle image.

### Pricing

Prices are high-priority information.

-   Use Barlow Condensed.
-   Strong contrast.
-   Keep currency and financing information visually subordinate to the
    final price.
-   Do not hide the price behind unnecessary interaction if the business
    model allows public pricing.

### Specification list

Technical information should be scannable.

Example categories:

-   Cilindrada
-   Potencia
-   Torque
-   Peso
-   Altura de asiento
-   Capacidad de tanque
-   Transmisión

Use a two-column specification layout on desktop and one column on
mobile.

### Image gallery

Motorcycle imagery is a core part of the experience.

-   Prefer large horizontal hero images.
-   Use consistent image aspect ratios in grids.
-   Preserve the motorcycle's silhouette.
-   Avoid excessive cropping of wheels, handlebars or front fairings.
-   Thumbnail navigation should remain secondary to the main image.

### Forms

Forms for contact, financing and test rides should be short.

Required visual states:

-   Default.
-   Focus.
-   Filled.
-   Error.
-   Success.
-   Disabled.

Use explicit labels and concise helper/error text.

### Footer

Use the deep navy background.

Organize into:

-   Brand/navigation.
-   Models.
-   Services.
-   Dealer/contact information.
-   Legal/privacy.
-   Social links.

Keep the footer dense enough to be useful but visually quiet compared
with the hero.

## Do's and Don'ts

### Do

-   Do make the motorcycle the visual protagonist.
-   Do use strong editorial photography.
-   Do use deep navy, white and performance red consistently.
-   Do reserve red for important actions and highlights.
-   Do use condensed uppercase typography for navigation and short
    labels.
-   Do maintain generous whitespace around major content.
-   Do make price, availability and contact actions easy to find.
-   Do preserve the same visual hierarchy across desktop, tablet and
    mobile.
-   Do use accessible contrast and visible focus states.
-   Do keep interactions fast and visually decisive.
-   Do use subtle motion for image hover, menus and transitions.
-   Do prefer real motorcycle photography over generic stock imagery.

### Don't

-   Don't reproduce the exact Ducati/Scrambler logo or proprietary brand
    assets unless supplied and authorized by the project.
-   Don't turn every element red.
-   Don't use excessive gradients, glassmorphism, neon effects or
    decorative glow.
-   Don't use oversized rounded cards or pill-shaped buttons for the
    main commerce UI.
-   Don't make the catalog look like a generic SaaS dashboard.
-   Don't hide essential motorcycle information behind hover-only
    interactions.
-   Don't use tiny text for technical specifications.
-   Don't overlay long paragraphs on busy photography.
-   Don't let carousels dominate the entire shopping experience; provide
    direct access to models.
-   Don't sacrifice performance for animation.
-   Don't introduce a new accent color without a clear semantic reason.
-   Don't change spacing, radii or typography ad hoc when an existing
    token already expresses the intended design.

### Implementation priority

When a visual decision is ambiguous, follow this order:

1.  **Motorcycle photography and product clarity**
2.  **Brand hierarchy and navigation**
3.  **Primary conversion action**
4.  **Typography hierarchy**
5.  **Spacing and grid consistency**
6.  **Decorative details**

The final result should feel like a **premium motorcycle showroom with
editorial energy**, not like a generic ecommerce template.
