```
client/src/assets/images/
├── logo.png
├── favicon.ico
├── extension-icon.png
├── component-icon.png
├── sensor-icon.png
├── ui-icon.png
├── utility-icon.png
├── java-icon.png
├── kotlin-icon.png
├── build-icon.png
├── test-icon.png
├── docs-icon.png
├── migrate-icon.png
├── deps-icon.png
├── template-icon.png
└── settings-icon.png
```

## 📄 `client/src/assets/images/README.md`

```markdown
# Images Directory

This directory contains all image assets for AIX Studio.

## 📋 Image Inventory

| Image | Purpose | Size | Format |
|-------|---------|------|--------|
| `logo.png` | Application logo | 256x256 | PNG |
| `favicon.ico` | Browser favicon | 32x32 | ICO |
| `extension-icon.png` | Generic extension icon | 16x16 | PNG |
| `component-icon.png` | Component extension icon | 16x16 | PNG |
| `sensor-icon.png` | Sensor extension icon | 16x16 | PNG |
| `ui-icon.png` | UI extension icon | 16x16 | PNG |
| `utility-icon.png` | Utility extension icon | 16x16 | PNG |
| `java-icon.png` | Java language icon | 16x16 | PNG |
| `kotlin-icon.png` | Kotlin language icon | 16x16 | PNG |
| `build-icon.png` | Build system icon | 16x16 | PNG |
| `test-icon.png` | Testing icon | 16x16 | PNG |
| `docs-icon.png` | Documentation icon | 16x16 | PNG |
| `migrate-icon.png` | Migration icon | 16x16 | PNG |
| `deps-icon.png` | Dependencies icon | 16x16 | PNG |
| `template-icon.png` | Templates icon | 16x16 | PNG |
| `settings-icon.png` | Settings icon | 16x16 | PNG |

## 🎨 Color Palette

All icons use a consistent color palette:

- **Primary Blue**: #2196F3 (Main brand color)
- **Secondary Pink**: #FF4081 (Accent color)
- **Success Green**: #4CAF50 (Success states)
- **Warning Orange**: #FFC107 (Warning states)
- **Error Red**: #F44336 (Error states)
- **Neutral Gray**: #9E9E9E (Inactive states)

## 📐 Dimensions

All icons follow these dimension guidelines:

- **Logo**: 256x256 pixels (high resolution)
- **Favicon**: 32x32 pixels (ICO format)
- **Icons**: 16x16 pixels (standard toolbar size)
- **Large Icons**: 32x32 pixels (dashboard and overview)

## 🖼️ Image Generation

To generate actual images for AIX Studio:

### Using Online Tools

1. **Canva** - Professional design tool
2. **Figma** - Collaborative design platform
3. **Adobe Illustrator** - Vector graphics editor
4. **GIMP** - Free image editor

### Using CLI Tools

```bash
# Install ImageMagick for command-line image processing
# Ubuntu/Debian:
sudo apt install imagemagick

# macOS:
brew install imagemagick

# Generate placeholder images
convert -size 16x16 xc:#2196F3 extension-icon.png
convert -size 32x32 xc:#2196F3 logo.png
```

### Using SVG to PNG Conversion

```bash
# Convert SVG icons to PNG
# Using Inkscape (CLI):
inkscape --export-type=png --export-width=16 --export-height=16 icon.svg

# Using ImageMagick:
convert -background none -resize 16x16 icon.svg icon.png
```

## 🎯 Icon Design Guidelines

### Consistency

1. **Style**: Flat design with subtle shadows
2. **Stroke Width**: 1-2 pixels for outlines
3. **Corner Radius**: 2-4 pixels for rounded corners
4. **Padding**: 1-2 pixels around content
5. **Alignment**: Center-aligned content

### Recognition

1. **Distinct Shapes**: Each icon should be recognizable at 16x16
2. **Clear Metaphors**: Use universally understood symbols
3. **Minimal Detail**: Avoid fine details that don't scale
4. **Contrast**: Ensure good contrast with backgrounds

### Accessibility

1. **Color Blind Friendly**: Avoid red-green combinations
2. **High Contrast**: Ensure visibility on light/dark backgrounds
3. **Text Labels**: Always pair icons with text labels
4. **Alternative Text**: Provide alt text for all images

## 📁 Directory Structure Recommendations

```
images/
├── icons/                 # Small toolbar icons (16x16)
│   ├── 16x16/            # Sorted by size
│   └── 32x32/
├── logos/                # Branding images
│   ├── app/             # Application logos
│   └── company/         # Company logos
├── screenshots/          # Application screenshots
├── illustrations/        # Decorative images
└── templates/            # Template images
```

## 🔧 Image Optimization

### PNG Optimization

```bash
# Install pngcrush for PNG optimization
# Ubuntu/Debian:
sudo apt install pngcrush

# macOS:
brew install pngcrush

# Optimize PNG files
pngcrush -reduce input.png output.png
```

### JPEG Optimization

```bash
# Install jpegoptim for JPEG optimization
# Ubuntu/Debian:
sudo apt install jpegoptim

# macOS:
brew install jpegoptim

# Optimize JPEG files
jpegoptim --max=85 image.jpg
```

### WebP Conversion

```bash
# Convert to WebP for better compression
# Ubuntu/Debian:
sudo apt install webp

# macOS:
brew install webp

# Convert PNG to WebP
cwebp image.png -o image.webp

# Convert JPEG to WebP
cwebp image.jpg -o image.webp
```

## 🔄 Image Placeholders

For development purposes, here are base64 encoded placeholders:

### `logo.png` (256x256)
```base64
iVBORw0KGgoAAAANSUhEUgAAAQAAAAEACAYAAABccqhmAAAgAElEQVR4nO2dB3gU1drHZ2Z2s5vsJr03SAgQEiChhB567wEp0kGKIkVQUERFRVGKiIKIgCgqRVREehHpNaGE3kPoPb2T3eyW+f7PzM5mN7ubTSF5f8/zPDuzM3POzJzznnPmnHPOjCAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAIgiAI......
```

### `favicon.ico` (32x32)
```base64
AAABAAEAEBAAAAAAAABoBQAAFgAAACgAAAAQAAAAIAAAAAEACAAAAAAAAAEAAAAAAAAAAAAAAAEAAAAA
AAAAAAD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////
AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////
AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////
AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////
AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////
AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////
AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////
AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////
AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////
AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////
AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////
AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////
AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////
AP///wD......
```

## 🎨 SVG Icon Templates

### `extension-icon.svg`
```svg
<svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
  <rect width="16" height="16" fill="#2196F3"/>
  <path d="M4 4H12V6H4V4Z" fill="white"/>
  <path d="M4 7H12V9H4V7Z" fill="white"/>
  <path d="M4 10H8V12H4V10Z" fill="white"/>
</svg>
```

### `component-icon.svg`
```svg
<svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
  <rect width="16" height="16" fill="#4CAF50"/>
  <circle cx="8" cy="8" r="4" fill="white"/>
  <circle cx="8" cy="8" r="2" fill="#4CAF50"/>
</svg>
```

### `sensor-icon.svg`
```svg
<svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
  <rect width="16" height="16" fill="#FF9800"/>
  <path d="M4 4H12V12H4V4Z" fill="none" stroke="white" stroke-width="1"/>
  <circle cx="8" cy="8" r="2" fill="white"/>
  <path d="M8 6L8 10" stroke="#FF9800" stroke-width="1"/>
  <path d="M6 8L10 8" stroke="#FF9800" stroke-width="1"/>
</svg>
```

### `ui-icon.svg`
```svg
<svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
  <rect width="16" height="16" fill="#9C27B0"/>
  <rect x="2" y="2" width="12" height="2" fill="white"/>
  <rect x="2" y="6" width="8" height="2" fill="white"/>
  <rect x="2" y="10" width="6" height="2" fill="white"/>
</svg>
```

### `utility-icon.svg`
```svg
<svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
  <rect width="16" height="16" fill="#607D8B"/>
  <path d="M4 4H12V6H4V4Z" fill="white"/>
  <path d="M4 7H10V9H4V7Z" fill="white"/>
  <path d="M4 10H8V12H4V10Z" fill="white"/>
  <circle cx="13" cy="5" r="1" fill="white"/>
</svg>
```

### `java-icon.svg`
```svg
<svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
  <rect width="16" height="16" fill="#6DB33F"/>
  <path d="M4 4H12V6H4V4Z" fill="white"/>
  <path d="M4 7H12V9H4V7Z" fill="white"/>
  <path d="M4 10H8V12H4V10Z" fill="white"/>
</svg>
```

### `kotlin-icon.svg`
```svg
<svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
  <rect width="16" height="16" fill="#7F52FF"/>
  <path d="M4 4L12 8L4 12V4Z" fill="white"/>
</svg>
```

### `build-icon.svg`
```svg
<svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
  <rect width="16" height="16" fill="#FF5722"/>
  <path d="M4 4H12V6H4V4Z" fill="white"/>
  <path d="M4 7H10V9H4V7Z" fill="white"/>
  <path d="M4 10H8V12H4V10Z" fill="white"/>
</svg>
```

### `test-icon.svg`
```svg
<svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
  <rect width="16" height="16" fill="#00BCD4"/>
  <path d="M6 4L12 8L6 12V4Z" fill="white"/>
  <circle cx="4" cy="8" r="2" fill="white"/>
</svg>
```

### `docs-icon.svg`
```svg
<svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
  <rect width="16" height="16" fill="#795548"/>
  <path d="M3 3H13V5H3V3Z" fill="white"/>
  <path d="M3 6H13V8H3V6Z" fill="white"/>
  <path d="M3 9H10V11H3V9Z" fill="white"/>
</svg>
```

### `migrate-icon.svg`
```svg
<svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
  <rect width="16" height="16" fill="#E91E63"/>
  <path d="M4 6L8 10L12 6" fill="none" stroke="white" stroke-width="2"/>
</svg>
```

### `deps-icon.svg`
```svg
<svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
  <rect width="16" height="16" fill="#9E9E9E"/>
  <rect x="2" y="2" width="4" height="4" fill="white"/>
  <rect x="10" y="2" width="4" height="4" fill="white"/>
  <rect x="2" y="10" width="4" height="4" fill="white"/>
  <rect x="10" y="10" width="4" height="4" fill="white"/>
  <rect x="6" y="6" width="4" height="4" fill="white"/>
</svg>
```

### `template-icon.svg`
```svg
<svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
  <rect width="16" height="16" fill="#3F51B5"/>
  <path d="M4 4H12V6H4V4Z" fill="white"/>
  <path d="M4 7H10V9H4V7Z" fill="white"/>
  <path d="M4 10H8V12H4V10Z" fill="white"/>
</svg>
```

### `settings-icon.svg`
```svg
<svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
  <rect width="16" height="16" fill="#607D8B"/>
  <circle cx="8" cy="8" r="5" fill="none" stroke="white" stroke-width="1"/>
  <circle cx="8" cy="8" r="2" fill="white"/>
  <path d="M8 3L8 5" stroke="white" stroke-width="1"/>
  <path d="M8 11L8 13" stroke="white" stroke-width="1"/>
  <path d="M3 8L5 8" stroke="white" stroke-width="1"/>
  <path d="M11 8L13 8" stroke="white" stroke-width="1"/>
</svg>
```

## 📈 Image Optimization Guidelines

### File Size Targets

| Image Type | Max Size | Optimization Goal |
|------------|----------|------------------|
| Icons (16x16) | 1 KB | Lossless |
| Icons (32x32) | 2 KB | Lossless |
| Logos (256x256) | 10 KB | Lossy (quality 85%) |
| Screenshots | 100 KB | Lossy (quality 80%) |
| Illustrations | 50 KB | Lossy (quality 85%) |

### Optimization Tools

```bash
# PNG Optimization
pngcrush -reduce input.png output.png

# JPEG Optimization
jpegoptim --max=85 image.jpg

# WebP Conversion
cwebp image.png -o image.webp

# SVG Optimization
svgo input.svg -o output.svg
```

## 🔄 Image Generation Automation

### Script for Generating Icons

```bash
#!/bin/bash
# generate-icons.sh

# Create icons directory
mkdir -p icons

# Generate base icons using ImageMagick
convert -size 16x16 xc:#2196F3 icons/extension-icon.png
convert -size 16x16 xc:#4CAF50 icons/component-icon.png
convert -size 16x16 xc:#FF9800 icons/sensor-icon.png
convert -size 16x16 xc:#9C27B0 icons/ui-icon.png
convert -size 16x16 xc:#607D8B icons/utility-icon.png
convert -size 16x16 xc:#6DB33F icons/java-icon.png
convert -size 16x16 xc:#7F52FF icons/kotlin-icon.png
convert -size 16x16 xc:#FF5722 icons/build-icon.png
convert -size 16x16 xc:#00BCD4 icons/test-icon.png
convert -size 16x16 xc:#795548 icons/docs-icon.png
convert -size 16x16 xc:#E91E63 icons/migrate-icon.png
convert -size 16x16 xc:#9E9E9E icons/deps-icon.png
convert -size 16x16 xc:#3F51B5 icons/template-icon.png
convert -size 16x16 xc:#607D8B icons/settings-icon.png

# Generate larger versions
convert -size 32x32 xc:#2196F3 icons/logo.png
convert -size 32x32 xc:#2196F3 icons/favicon.ico

echo "Icons generated successfully!"
```

## 🎯 Best Practices

### 1. Consistent Sizing

- **Icons**: 16x16 pixels for toolbar
- **Buttons**: 24x24 pixels for action buttons
- **Avatars**: 32x32 pixels for user avatars
- **Logos**: 256x256 pixels for high-resolution displays

### 2. Proper Naming

```bash
# Good naming convention
icon-extension.png
icon-component.png
icon-sensor.png
logo-app.png
favicon.ico

# Avoid generic names
image1.png
icon.png
picture.jpg
```

### 3. Accessibility

- **Alt text**: Always provide meaningful alt text
- **Contrast**: Ensure 4.5:1 contrast ratio for accessibility
- **Descriptions**: Include detailed descriptions for screen readers
- **Focus states**: Provide visual feedback for keyboard navigation

### 4. Performance

- **Lazy loading**: Load images only when needed
- **Compression**: Optimize images without losing quality
- **Formats**: Use appropriate formats (WebP, SVG, AVIF)
- **Sizes**: Provide multiple sizes for responsive design

This images directory provides a complete foundation for AIX Studio's visual assets with proper organization, optimization guidelines, and generation tools.
```