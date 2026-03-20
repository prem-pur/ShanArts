const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');
const path = require('path');

// Ensure previews directory exists
const previewDir = path.join(__dirname, '../public/previews');
if (!fs.existsSync(previewDir)) {
    fs.mkdirSync(previewDir, { recursive: true });
}

// Generate Design based on Template and Customer Data
const generateDesign = async (template, customerData) => {
    const { layoutJson, previewImageUrl } = template;

    const width = layoutJson.width || 800;
    const height = layoutJson.height || 600;

    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // 1. Draw Background
    ctx.fillStyle = customerData.colorPreferences || '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // If template has a background image (optional)
    // if (template.backgroundImage) { ... }

    // 2. Loop through elements
    if (layoutJson.elements) {
        for (const element of layoutJson.elements) {
            if (element.type === 'text') {
                // Get content from customer data based on key (e.g. "textContent")
                // Or use static text from template if no key
                let text = element.text || '';
                if (element.key && customerData[element.key]) {
                    text = customerData[element.key];
                }

                ctx.fillStyle = element.color || '#000000';
                const fontSize = element.fontSize || 30;
                ctx.font = `${'bold'} ${fontSize}px sans-serif`;
                ctx.textAlign = element.textAlign || 'left';
                const x = element.x || 0;
                const y = element.y || 0;

                // Simple text drawing
                ctx.fillText(text, x, y);
            }
            // Add image handling if needed
        }
    }

    // Save File
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileName = `design-${uniqueSuffix}.png`;
    const filePath = path.join(previewDir, fileName);
    const buffer = canvas.toBuffer('image/png');

    fs.writeFileSync(filePath, buffer);

    return `/previews/${fileName}`;
};

module.exports = { generateDesign };
