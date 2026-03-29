import ZAI from 'z-ai-web-dev-sdk';
import fs from 'fs';

async function analyzeImage(imagePath: string, prompt: string) {
  const zai = await ZAI.create();
  
  const imageBuffer = fs.readFileSync(imagePath);
  const base64Image = imageBuffer.toString('base64');
  
  const response = await zai.chat.completions.createVision({
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          { type: 'image_url', image_url: { url: `data:image/png;base64,${base64Image}` } }
        ]
      }
    ],
    thinking: { type: 'disabled' }
  });
  
  return response.choices[0]?.message?.content;
}

async function main() {
  const images = [
    '/home/z/my-project/upload/pasted_image_1774605731090.png',
    '/home/z/my-project/upload/pasted_image_1774605744607.png',
    '/home/z/my-project/upload/pasted_image_1774606292633.png',
    '/home/z/my-project/upload/pasted_image_1774606309690.png'
  ];
  
  for (let i = 0; i < images.length; i++) {
    console.log(`\n=== Image ${i + 1} ===`);
    try {
      const result = await analyzeImage(
        images[i], 
        'Describe this mobile app UI design in detail. What is the layout, colors, components, buttons, text fields, and overall design style? What features does this screen show? Be specific about colors (orange, white, etc), rounded corners, card layouts, and any icons used.'
      );
      console.log(result);
    } catch (e: any) {
      console.error('Error:', e.message);
    }
  }
}

main();
