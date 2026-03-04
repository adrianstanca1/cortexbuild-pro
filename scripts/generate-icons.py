#!/usr/bin/env python3
"""Generate PWA icons for CortexBuild Pro iOS app"""

from PIL import Image, ImageDraw, ImageFont
import os

def create_icon(size, output_path):
    """Create a square icon with CortexBuild branding"""
    # Create image with blue gradient background
    img = Image.new('RGB', (size, size), '#2563eb')
    draw = ImageDraw.Draw(img)
    
    # Draw gradient effect (simple version)
    for y in range(size):
        alpha = y / size
        r = int(37 + (29 - 37) * alpha)
        g = int(99 + (78 - 99) * alpha)
        b = int(235 + (216 - 235) * alpha)
        draw.line([(0, y), (size, y)], fill=(r, g, b))
    
    # Add "C" letter in center
    try:
        font_size = int(size * 0.55)
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", font_size)
    except:
        font = ImageFont.load_default()
    
    # Calculate text position for center
    text = "C"
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    x = (size - text_width) // 2
    y = (size - text_height) // 2 - size * 0.05
    
    draw.text((x, y), text, fill='white', font=font)
    
    # Add "BUILD" text at bottom
    try:
        small_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", int(size * 0.12))
    except:
        small_font = ImageFont.load_default()
    
    build_text = "BUILD"
    bbox = draw.textbbox((0, 0), build_text, font=small_font)
    text_width = bbox[2] - bbox[0]
    x = (size - text_width) // 2
    y = size * 0.78
    
    draw.text((x, y), build_text, fill=(255, 255, 255, 230), font=small_font)
    
    # Save the image
    img.save(output_path, 'PNG')
    print(f"✓ Created {output_path} ({size}x{size})")

def main():
    # Ensure we're in the right directory
    public_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'public')
    os.makedirs(public_dir, exist_ok=True)
    
    # Create icons
    icons = [
        (192, 'pwa-192x192.png'),
        (512, 'pwa-512x512.png'),
        (180, 'apple-touch-icon.png'),
    ]
    
    for size, filename in icons:
        output_path = os.path.join(public_dir, filename)
        create_icon(size, output_path)
    
    print("\n✅ All PWA icons generated successfully!")
    print("\nTo install on iOS:")
    print("1. Deploy the app to a HTTPS URL")
    print("2. Open in Safari on iPhone/iPad")
    print("3. Tap 'Share' button")
    print("4. Select 'Add to Home Screen'")

if __name__ == '__main__':
    main()
