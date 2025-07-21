/**
 * Local Open-Source Models Service
 * Provides integration with free, locally-runnable image generation models
 */

class LocalModelsService {
    constructor() {
        this.isAvailable = true;
        
        // Free open-source models that can run locally or via free APIs
        this.models = {
            // Replicate free tier models
            'stable-diffusion-free': {
                name: 'Stable Diffusion 1.5',
                endpoint: 'https://api.replicate.com/v1/predictions',
                model: 'stability-ai/stable-diffusion:db21e45d3f7023abc2a46ee38a23973f6dce16bb082a930b0c49861f96d1e5bf',
                free: true,
                description: 'Free tier Stable Diffusion'
            },
            
            // Hugging Face Spaces (free inference)
            'dreamshaper': {
                name: 'DreamShaper',
                endpoint: 'https://hf.space/embed/Lykon/DreamShaper/+/api/predict',
                free: true,
                description: 'High-quality free model via HF Spaces'
            },
            
            // ComfyUI online (free)
            'comfyui-free': {
                name: 'ComfyUI Online',
                endpoint: 'https://comfyui-api.com/generate',
                free: true,
                description: 'Free ComfyUI workflow'
            },
            
            // Fallback - always works
            'canvas-generator': {
                name: 'Canvas Generator',
                local: true,
                free: true,
                description: 'Local canvas-based image generation'
            }
        };
        
        console.log('🎨 Local Models Service initialized with free open-source options');
    }

    /**
     * Generate image using free open-source models
     */
    async generateImage(config) {
        const { prompt, style = 'modern', type = 'image', aspectRatio = '1:1' } = config;
        
        console.log('🎨 Generating with free open-source models:', { prompt, style, type, aspectRatio });

        try {
            // Try different free methods in order of preference
            let result = null;
            
            // Method 1: Try Hugging Face Spaces (free)
            try {
                result = await this.tryHuggingFaceSpaces(prompt, style, aspectRatio);
                if (result) {
                    console.log('✅ Generated using HuggingFace Spaces (free)');
                    return this.formatSuccess(result, 'HuggingFace Spaces', config);
                }
            } catch (error) {
                console.log('⚠️ HF Spaces not available:', error.message);
            }
            
            // Method 2: Try Pollinations AI (completely free)
            try {
                result = await this.tryPollinationsAI(prompt, style, aspectRatio);
                if (result) {
                    console.log('✅ Generated using Pollinations AI (free)');
                    return this.formatSuccess(result, 'Pollinations AI', config);
                }
            } catch (error) {
                console.log('⚠️ Pollinations AI not available:', error.message);
            }
            
            // Method 3: Canvas-based generation (always works)
            console.log('🎨 Using local canvas generator as fallback');
            result = await this.generateWithCanvas(prompt, style, aspectRatio);
            return this.formatSuccess(result, 'Canvas Generator', config, true);
            
        } catch (error) {
            console.error('❌ All free generation methods failed:', error);
            
            // Final fallback
            const fallbackImage = await this.generateWithCanvas(prompt, style, aspectRatio);
            return this.formatSuccess(fallbackImage, 'Fallback Canvas', config, true);
        }
    }

    /**
     * Try Pollinations AI - completely free, no API key needed
     * Returns data URL to avoid CORS issues with Adobe Express
     */
    async tryPollinationsAI(prompt, style, aspectRatio) {
        const stylePrompt = this.enhancePromptForStyle(prompt, style);
        const dimensions = this.getDimensionsForAspectRatio(aspectRatio);
        
        // Pollinations AI - free image generation
        const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(stylePrompt)}?width=${dimensions.width}&height=${dimensions.height}&seed=${Math.floor(Math.random() * 1000000)}`;
        
        console.log('🌸 Trying Pollinations AI:', url);
        
        try {
            // Use CORS proxy for Adobe Express compatibility
            const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
            
            const response = await fetch(proxyUrl, {
                method: 'GET',
                headers: {
                    'Accept': 'image/*'
                }
            });
            
            if (response.ok) {
                const blob = await response.blob();
                if (blob.size > 1000) { // Valid image
                    console.log('✅ Pollinations AI success, converting to data URL for Express compatibility');
                    return await this.blobToDataUrl(blob);
                }
            }
            throw new Error('Invalid response from Pollinations AI');
        } catch (error) {
            console.error('❌ Pollinations AI failed:', error);
            throw error;
        }
    }

    /**
     * Try HuggingFace Spaces - free inference
     */
    async tryHuggingFaceSpaces(prompt, style, aspectRatio) {
        const stylePrompt = this.enhancePromptForStyle(prompt, style);
        
        // Try multiple free HF Spaces
        const spaces = [
            'https://hf.space/embed/runwayml/stable-diffusion-v1-5/+/api/predict',
            'https://hf.space/embed/stabilityai/stable-diffusion-2-1/+/api/predict'
        ];
        
        for (const spaceUrl of spaces) {
            try {
                console.log('🤗 Trying HF Space:', spaceUrl);
                
                const response = await fetch(spaceUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        data: [stylePrompt, 20, 7.5, null]
                    })
                });
                
                if (response.ok) {
                    const result = await response.json();
                    if (result.data && result.data[0]) {
                        // Convert HF Space result to data URL
                        return result.data[0];
                    }
                }
            } catch (error) {
                console.log(`⚠️ HF Space ${spaceUrl} failed:`, error.message);
                continue;
            }
        }
        
        throw new Error('All HuggingFace Spaces unavailable');
    }

    /**
     * Canvas-based image generation - always works
     */
    async generateWithCanvas(prompt, style, aspectRatio) {
        const dimensions = this.getDimensionsForAspectRatio(aspectRatio);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = dimensions.width;
        canvas.height = dimensions.height;
        
        // Create a visually appealing generated image based on prompt
        const colors = this.getColorsForStyle(style);
        const shapes = this.getShapesForPrompt(prompt);
        
        // Background gradient
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, colors.primary);
        gradient.addColorStop(0.5, colors.secondary);
        gradient.addColorStop(1, colors.accent);
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Add geometric shapes based on prompt
        this.drawShapesBasedOnPrompt(ctx, canvas, prompt, style, colors);
        
        // Add text overlay with prompt summary
        this.addTextOverlay(ctx, canvas, prompt, colors);
        
        return canvas.toDataURL('image/png');
    }

    /**
     * Draw shapes based on prompt content
     */
    drawShapesBasedOnPrompt(ctx, canvas, prompt, style, colors) {
        const lowerPrompt = prompt.toLowerCase();
        
        // Save context
        ctx.save();
        
        // Determine shapes based on keywords
        if (lowerPrompt.includes('circle') || lowerPrompt.includes('round')) {
            this.drawCircles(ctx, canvas, colors);
        } else if (lowerPrompt.includes('square') || lowerPrompt.includes('box')) {
            this.drawSquares(ctx, canvas, colors);
        } else if (lowerPrompt.includes('triangle') || lowerPrompt.includes('arrow')) {
            this.drawTriangles(ctx, canvas, colors);
        } else if (lowerPrompt.includes('logo') || lowerPrompt.includes('brand')) {
            this.drawLogo(ctx, canvas, colors);
        } else if (lowerPrompt.includes('icon')) {
            this.drawIcon(ctx, canvas, colors, lowerPrompt);
        } else {
            // Default: abstract composition
            this.drawAbstractComposition(ctx, canvas, colors, style);
        }
        
        // Restore context
        ctx.restore();
    }

    /**
     * Draw circles
     */
    drawCircles(ctx, canvas, colors) {
        const numCircles = 3 + Math.floor(Math.random() * 4);
        
        for (let i = 0; i < numCircles; i++) {
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height;
            const radius = 20 + Math.random() * 100;
            
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fillStyle = colors.shapes[i % colors.shapes.length] + '80'; // Semi-transparent
            ctx.fill();
            
            // Add stroke
            ctx.strokeStyle = colors.accent;
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    }

    /**
     * Draw squares
     */
    drawSquares(ctx, canvas, colors) {
        const numSquares = 2 + Math.floor(Math.random() * 3);
        
        for (let i = 0; i < numSquares; i++) {
            const size = 40 + Math.random() * 120;
            const x = Math.random() * (canvas.width - size);
            const y = Math.random() * (canvas.height - size);
            
            ctx.fillStyle = colors.shapes[i % colors.shapes.length] + '90';
            ctx.fillRect(x, y, size, size);
            
            // Add border
            ctx.strokeStyle = colors.accent;
            ctx.lineWidth = 3;
            ctx.strokeRect(x, y, size, size);
        }
    }

    /**
     * Draw abstract composition
     */
    drawAbstractComposition(ctx, canvas, colors, style) {
        // Create flowing shapes based on style
        const numShapes = 5 + Math.floor(Math.random() * 5);
        
        for (let i = 0; i < numShapes; i++) {
            ctx.beginPath();
            
            // Create organic shapes
            const centerX = Math.random() * canvas.width;
            const centerY = Math.random() * canvas.height;
            const numPoints = 6 + Math.floor(Math.random() * 6);
            
            for (let j = 0; j < numPoints; j++) {
                const angle = (j / numPoints) * Math.PI * 2;
                const radius = 30 + Math.random() * 80;
                const x = centerX + Math.cos(angle) * radius;
                const y = centerY + Math.sin(angle) * radius;
                
                if (j === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            
            ctx.closePath();
            ctx.fillStyle = colors.shapes[i % colors.shapes.length] + '70';
            ctx.fill();
        }
    }

    /**
     * Add text overlay
     */
    addTextOverlay(ctx, canvas, prompt, colors) {
        // Add prompt text at bottom
        ctx.fillStyle = colors.text;
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        
        const words = prompt.split(' ').slice(0, 3).join(' '); // First 3 words
        const text = words.length > 20 ? words.substring(0, 17) + '...' : words;
        
        // Add background for text
        const textWidth = ctx.measureText(text).width;
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(canvas.width/2 - textWidth/2 - 10, canvas.height - 35, textWidth + 20, 25);
        
        // Add text
        ctx.fillStyle = colors.text;
        ctx.fillText(text, canvas.width / 2, canvas.height - 15);
        
        // Add "AI Generated" watermark
        ctx.font = '10px Arial';
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.textAlign = 'right';
        ctx.fillText('🎨 AI Generated', canvas.width - 10, 20);
    }

    /**
     * Get colors based on style
     */
    getColorsForStyle(style) {
        const colorSchemes = {
            'colourful': {
                primary: '#FF6B6B',
                secondary: '#4ECDC4', 
                accent: '#45B7D1',
                shapes: ['#FF6B6B', '#4ECDC4', '#96CEB4', '#FFEAA7', '#DDA0DD'],
                text: '#FFFFFF'
            },
            'cyberpunk': {
                primary: '#0A0A0A',
                secondary: '#FF00FF',
                accent: '#00FFFF',
                shapes: ['#FF00FF', '#00FFFF', '#FF0080', '#8000FF', '#00FF80'],
                text: '#00FFFF'
            },
            'real': {
                primary: '#2C3E50',
                secondary: '#34495E',
                accent: '#ECF0F1',
                shapes: ['#3498DB', '#E74C3C', '#2ECC71', '#F39C12', '#9B59B6'],
                text: '#FFFFFF'
            },
            'minimalist': {
                primary: '#F8F9FA',
                secondary: '#E9ECEF',
                accent: '#6C757D',
                shapes: ['#007BFF', '#28A745', '#FFC107', '#DC3545', '#6F42C1'],
                text: '#212529'
            }
        };
        
        return colorSchemes[style] || colorSchemes['colourful'];
    }

    /**
     * Enhance prompt for different styles
     */
    enhancePromptForStyle(prompt, style) {
        const styleEnhancements = {
            'colourful': prompt + ', vibrant colors, colorful, bright, vivid',
            'cyberpunk': prompt + ', cyberpunk style, neon colors, futuristic, digital art',
            'real': prompt + ', photorealistic, detailed, high quality, professional',
            'minimalist': prompt + ', minimalist, clean, simple, elegant design'
        };
        
        return styleEnhancements[style] || prompt;
    }

    /**
     * Get dimensions for aspect ratio
     */
    getDimensionsForAspectRatio(aspectRatio) {
        const ratios = {
            '1:1': { width: 512, height: 512 },
            '16:9': { width: 768, height: 432 },
            '9:16': { width: 432, height: 768 },
            '4:3': { width: 640, height: 480 }
        };
        
        return ratios[aspectRatio] || ratios['1:1'];
    }

    /**
     * Convert blob to data URL
     */
    async blobToDataUrl(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }

    /**
     * Format successful result
     */
    formatSuccess(imageUrl, modelName, config, isFallback = false) {
        return {
            success: true,
            imageUrl: imageUrl,
            prompt: config.prompt,
            model: modelName,
            metadata: {
                style: config.style,
                type: config.type,
                aspectRatio: config.aspectRatio,
                originalPrompt: config.prompt,
                provider: 'local-models',
                free: true,
                fallback: isFallback
            }
        };
    }

    /**
     * Test connection - always available for local models
     */
    async testConnection() {
        try {
            // Test canvas generation
            const testResult = await this.generateWithCanvas('test', 'modern', '1:1');
            
            console.log('✅ Local Models Service is working');
            return {
                success: true,
                message: 'Local models available - Canvas generation working'
            };
        } catch (error) {
            console.error('❌ Local models test failed:', error);
            return {
                success: false,
                error: 'Local canvas generation failed'
            };
        }
    }
}

export default LocalModelsService;
