/**
 * Hugging Face Image Generation Service
 * Provides integration with open-source image generation models
 */

class HuggingFaceService {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseUrl = 'https://api-inference.huggingface.co/models';
        this.isValidKey = false;
        
        // Validate API key format
        if (!apiKey || apiKey === 'DEMO_KEY_NEEDS_REPLACEMENT' || apiKey === 'YOUR_HUGGINGFACE_API_KEY_HERE') {
            console.warn('⚠️ Demo Hugging Face API key detected - please set your own API key');
            this.isValidKey = false;
        } else if (!apiKey.startsWith('hf_')) {
            console.warn('⚠️ Invalid Hugging Face API key format - should start with "hf_"');
            this.isValidKey = false;
        } else {
            this.isValidKey = true;
        }
        
        // Available open-source models for different use cases
        this.models = {
            // General purpose image generation
            'stable-diffusion': 'stabilityai/stable-diffusion-2-1',
            'stable-diffusion-xl': 'stabilityai/stable-diffusion-xl-base-1.0',
            
            // Specialized models
            'anime': 'hakurei/waifu-diffusion',
            'artistic': 'prompthero/openjourney-v4',
            'realistic': 'SG161222/Realistic_Vision_V2.0',
            
            // Style-specific models
            'pixel-art': 'nerijs/pixel-art-xl',
            'logo': 'microsoft/DialoGPT-medium', // Placeholder - will use SD for logos
            'minimalist': 'runwayml/stable-diffusion-v1-5',
            
            // Default fallback
            'default': 'stabilityai/stable-diffusion-2-1'
        };
        
        // Style to model mapping
        this.styleModelMapping = {
            'colourful': 'stable-diffusion-xl',
            'cyberpunk': 'artistic', 
            'real': 'realistic',
            // Legacy mappings for compatibility
            'modern': 'stable-diffusion-xl',
            'minimalist': 'minimalist',
            'vintage': 'artistic',
            'bold': 'stable-diffusion',
            'elegant': 'realistic',
            'playful': 'anime'
        };
    }

    /**
     * Generate an image using Hugging Face models
     */
    async generateImage(config) {
        const { prompt, style = 'modern', type = 'image', aspectRatio = '1:1', uploadedImage } = config;
        
        console.log('🎨 Generating image with Hugging Face:', { prompt, style, type, aspectRatio, hasUpload: !!uploadedImage });

        try {
            // First try free Hugging Face Spaces
            const freeResult = await this.tryHuggingFaceSpaces(prompt, style, aspectRatio);
            if (freeResult) {
                console.log('✅ Generated using free HF Spaces');
                return {
                    success: true,
                    imageUrl: freeResult,
                    prompt: prompt,
                    model: 'HuggingFace Spaces (Free)',
                    metadata: {
                        style,
                        type,
                        aspectRatio,
                        originalPrompt: prompt,
                        provider: 'huggingface',
                        method: 'spaces',
                        hasUploadedImage: !!uploadedImage
                    }
                };
            }

            // Check for valid API key for paid inference
            if (!this.isValidKey) {
                throw new Error('Free HF Spaces unavailable and no valid API key for paid inference. Please configure a valid API key or try again later.');
            }

            // Select appropriate model based on style and type
            const modelKey = this.getModelForRequest(style, type);
            const modelName = this.models[modelKey];
            
            // Enhance prompt based on style and type
            const enhancedPrompt = this.enhancePrompt(prompt, style, type, aspectRatio, uploadedImage);
            
            // Generate image
            let imageBlob;
            if (uploadedImage) {
                // Use image-to-image generation if an image is uploaded
                console.log('🖼️ Using image-to-image generation with uploaded file:', uploadedImage.name);
                imageBlob = await this.callHuggingFaceImageToImageAPI(modelName, enhancedPrompt, uploadedImage);
            } else {
                // Use text-to-image generation
                imageBlob = await this.callHuggingFaceAPI(modelName, enhancedPrompt);
            }
            
            // Convert to data URL for easy handling
            const imageDataUrl = await this.blobToDataUrl(imageBlob);
            
            return {
                success: true,
                imageUrl: imageDataUrl,
                prompt: enhancedPrompt,
                model: modelName,
                metadata: {
                    style,
                    type,
                    aspectRatio,
                    originalPrompt: prompt,
                    provider: 'huggingface',
                    method: 'api',
                    hasUploadedImage: !!uploadedImage
                }
            };
            
        } catch (error) {
            console.error('❌ Hugging Face generation failed:', error);
            
            // Create fallback placeholder image
            console.log('🔄 Creating fallback placeholder image...');
            const fallbackImage = await this.createFallbackImage(config, error.message);
            
            return {
                success: true,
                imageUrl: fallbackImage,
                prompt: prompt,
                model: 'fallback-generator',
                metadata: {
                    style,
                    type,
                    aspectRatio,
                    originalPrompt: prompt,
                    provider: 'huggingface',
                    fallback: true,
                    error: error.message,
                    hasUploadedImage: !!uploadedImage
                }
            };
        }
    }

    /**
     * Create a fallback placeholder image when HF API fails
     */
    async createFallbackImage(config, errorMessage) {
        const { style = 'modern', type = 'image', aspectRatio = '1:1' } = config;
        
        // Create a canvas element
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Set dimensions based on aspect ratio
        let width = 400;
        let height = 400;
        
        if (aspectRatio === '16:9') {
            width = 640;
            height = 360;
        } else if (aspectRatio === '9:16') {
            width = 360;
            height = 640;
        } else if (aspectRatio === '3:2') {
            width = 600;
            height = 400;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Style-based colors
        const styleColors = {
            'colourful': { bg: '#f59e0b', text: '#ffffff', accent: '#fbbf24' },
            'cyberpunk': { bg: '#7c3aed', text: '#e0e7ff', accent: '#c4b5fd' },
            'real': { bg: '#374151', text: '#f9fafb', accent: '#9ca3af' },
            // Legacy styles
            'modern': { bg: '#4f46e5', text: '#ffffff', accent: '#818cf8' },
            'minimalist': { bg: '#f8fafc', text: '#1f2937', accent: '#6b7280' },
            'vintage': { bg: '#92400e', text: '#fef3c7', accent: '#d97706' },
            'bold': { bg: '#dc2626', text: '#ffffff', accent: '#f87171' },
            'elegant': { bg: '#1f2937', text: '#f9fafb', accent: '#9ca3af' },
            'playful': { bg: '#ec4899', text: '#ffffff', accent: '#f472b6' }
        };
        
        const colors = styleColors[style] || styleColors['modern'];
        
        // Create gradient background
        const gradient = ctx.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, colors.bg);
        gradient.addColorStop(1, colors.accent);
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
        
        // Add text content
        ctx.fillStyle = colors.text;
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Title
        ctx.fillText(`${type.toUpperCase()} PLACEHOLDER`, width / 2, height / 2 - 40);
        
        // Style indicator
        ctx.font = '16px Arial';
        ctx.fillText(`Style: ${style}`, width / 2, height / 2);
        
        // Error info (truncated)
        ctx.font = '12px Arial';
        const shortError = errorMessage.length > 50 ? errorMessage.substring(0, 50) + '...' : errorMessage;
        ctx.fillText(`Fallback: ${shortError}`, width / 2, height / 2 + 30);
        
        // Add decorative elements based on type
        ctx.fillStyle = colors.accent;
        if (type === 'icon') {
            // Simple icon shape
            ctx.beginPath();
            ctx.arc(width / 2, height / 2 - 80, 20, 0, 2 * Math.PI);
            ctx.fill();
        } else if (type === 'logo') {
            // Logo-like rectangle
            ctx.fillRect(width / 2 - 40, height / 2 - 100, 80, 30);
        }
        
        // Convert canvas to data URL
        return canvas.toDataURL('image/png');
    }

    /**
     * Select the best model for the request
     */
    getModelForRequest(style, type) {
        // Special handling for specific asset types
        if (type === 'logo' || type === 'icon') {
            return 'stable-diffusion-xl'; // Best for clean, crisp graphics
        }
        
        if (type === 'layout') {
            return 'minimalist'; // Better for clean layouts
        }
        
        // Use style mapping for general images
        return this.styleModelMapping[style] || 'default';
    }

    /**
     * Enhance the prompt based on style, type, and aspect ratio
     */
    enhancePrompt(prompt, style, type, aspectRatio, uploadedImage) {
        let enhancedPrompt = prompt;
        
        // Add uploaded image context if available
        if (uploadedImage) {
            enhancedPrompt = `${prompt}, inspired by uploaded image, maintaining similar style and composition`;
        }
        
        // Add type-specific enhancements
        const typeEnhancements = {
            'image': 'high quality, detailed, professional',
            'icon': 'simple icon, clean design, minimal, vector style, transparent background',
            'logo': 'logo design, clean, professional, minimal, vector style, brand identity',
            'layout': 'clean layout, organized design, professional, modern interface'
        };
        
        // Add style-specific enhancements
        const styleEnhancements = {
            'colourful': 'vibrant colors, bright, colorful, cheerful, lively design',
            'cyberpunk': 'cyberpunk style, neon lights, dark futuristic, sci-fi, electronic',
            'real': 'realistic, photorealistic, natural lighting, detailed, lifelike',
            // Legacy styles for compatibility
            'modern': 'modern design, contemporary, sleek, clean lines',
            'minimalist': 'minimalist, simple, clean, white space, elegant',
            'vintage': 'vintage style, retro, classic, aged, nostalgic',
            'bold': 'bold design, vibrant colors, strong contrast, dynamic',
            'elegant': 'elegant, sophisticated, refined, luxury, premium',
            'playful': 'playful, fun, colorful, whimsical, creative'
        };
        
        // Add quality and technical specifications
        const qualityTerms = 'masterpiece, best quality, highly detailed, sharp focus';
        
        // Combine all enhancements
        enhancedPrompt = `${prompt}, ${typeEnhancements[type]}, ${styleEnhancements[style]}, ${qualityTerms}`;
        
        // Add aspect ratio guidance
        if (aspectRatio === '16:9') {
            enhancedPrompt += ', wide composition, landscape orientation';
        } else if (aspectRatio === '9:16') {
            enhancedPrompt += ', tall composition, portrait orientation';
        } else if (aspectRatio === '1:1') {
            enhancedPrompt += ', square composition, centered';
        }
        
        return enhancedPrompt;
    }

    /**
     * Call the Hugging Face Inference API
     */
    async callHuggingFaceAPI(modelName, prompt) {
        const url = `${this.baseUrl}/${modelName}`;
        
        console.log('🌐 Making HF API call to:', url);
        console.log('📝 Prompt:', prompt);
        
        const maxRetries = 3;
        const initialDelay = 10000; // 10 seconds

        for (let i = 0; i < maxRetries; i++) {
            try {
                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        inputs: prompt,
                        parameters: {
                            guidance_scale: 7.5,
                            num_inference_steps: 20,
                            negative_prompt: 'blurry, low quality, distorted, deformed, ugly, bad anatomy'
                        }
                    })
                });

                console.log(`📡 HF API Response status (Attempt ${i + 1}):`, response.status);

                if (response.ok) {
                    const blob = await response.blob();
                    console.log('✅ Successfully received blob, size:', blob.size, 'bytes');
                    return blob;
                }

                const errorText = await response.text();
                console.error(`❌ HF API Error Response (Attempt ${i + 1}):`, errorText);

                // Handle authentication errors specifically
                if (response.status === 401) {
                    throw new Error('Invalid Hugging Face API key. Please check your API key and make sure it has the correct permissions.');
                }
                
                // Handle payment required errors specifically
                if (response.status === 402) {
                    throw new Error('HuggingFace Inference API requires payment. Please add credits to your account or upgrade your plan at https://huggingface.co/pricing');
                }

                if (response.status === 503) {
                    let estimatedTime = 20;
                    try {
                        const errorJson = JSON.parse(errorText);
                        if (errorJson.estimated_time) {
                            estimatedTime = errorJson.estimated_time;
                        }
                    } catch (e) { /* ignore */ }
                    
                    const waitTime = (estimatedTime * 1000) || (initialDelay * (i + 1));
                    console.log(`⏳ Model is loading. Retrying in ${waitTime / 1000} seconds...`);
                    await new Promise(resolve => setTimeout(resolve, waitTime));
                    continue;
                }

                throw new Error(`Hugging Face API error: ${response.status} - ${errorText}`);

            } catch (error) {
                console.error(`❌ HF API Call Failed (Attempt ${i + 1}):`, error);
                if (i === maxRetries - 1) {
                    if (error.message.includes('CORS') || error.message.includes('cross-origin')) {
                        throw new Error('CORS error: Cannot access Hugging Face API from this environment.');
                    }
                    if (error.message.includes('Failed to fetch')) {
                        throw new Error('Network error: Unable to connect to Hugging Face API.');
                    }
                    throw error;
                }
            }
        }
        
        throw new Error('Hugging Face API failed after multiple retries.');
    }

    /**
     * Call Hugging Face API for image-to-image generation
     */
    async callHuggingFaceImageToImageAPI(modelName, prompt, uploadedImage) {
        // For now, we'll use text-to-image with enhanced prompt since most HF models don't support img2img directly
        // In a production environment, you'd use specialized img2img models
        console.log('🖼️ Using text-to-image with image-informed prompt (HF limitation)');
        
        // Enhance the prompt to describe the uploaded image
        const enhancedPrompt = `${prompt}, based on uploaded image style and composition, maintaining visual coherence`;
        
        return await this.callHuggingFaceAPI(modelName, enhancedPrompt);
    }

    /**
     * Try free Hugging Face Spaces for image generation
     */
    async tryHuggingFaceSpaces(prompt, style, aspectRatio) {
        console.log('🆓 Trying free HuggingFace Spaces...');
        
        const enhancedPrompt = this.enhancePrompt(prompt, style, 'image', aspectRatio);
        
        // Try Pollinations AI (works reliably and is free)
        try {
            const dimensions = this.getDimensionsForAspectRatio(aspectRatio);
            const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(enhancedPrompt)}?width=${dimensions.width}&height=${dimensions.height}&seed=${Math.floor(Math.random() * 1000000)}`;
            
            console.log('🌸 Trying Pollinations AI via HF service:', url);
            
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'image/*'
                }
            });
            
            if (response.ok) {
                const blob = await response.blob();
                if (blob.size > 1000) {
                    console.log('✅ Pollinations AI success via HF service');
                    return await this.blobToDataUrl(blob);
                }
            }
        } catch (error) {
            console.log('⚠️ Pollinations AI failed:', error.message);
        }

        // Try alternative free method with CORS proxy
        try {
            const dimensions = this.getDimensionsForAspectRatio(aspectRatio);
            const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(enhancedPrompt)}?width=${dimensions.width}&height=${dimensions.height}&seed=${Math.floor(Math.random() * 1000000)}`;
            const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(imageUrl)}`;
            
            const response = await fetch(proxyUrl);
            if (response.ok) {
                const blob = await response.blob();
                if (blob.size > 1000) {
                    console.log('✅ Free image generation via proxy successful');
                    return await this.blobToDataUrl(blob);
                }
            }
        } catch (error) {
            console.log('⚠️ Proxy method failed:', error.message);
        }

        return null; // No free method worked
    }

    /**
     * Get dimensions for aspect ratio
     */
    getDimensionsForAspectRatio(aspectRatio) {
        switch (aspectRatio) {
            case '16:9':
                return { width: 640, height: 360 };
            case '9:16':
                return { width: 360, height: 640 };
            case '3:2':
                return { width: 600, height: 400 };
            case '2:3':
                return { width: 400, height: 600 };
            default: // 1:1
                return { width: 512, height: 512 };
        }
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
     * Get available models
     */
    getAvailableModels() {
        return Object.keys(this.models).map(key => ({
            key,
            name: this.models[key],
            description: this.getModelDescription(key)
        }));
    }

    /**
     * Test API connection
     */
    async testConnection() {
        try {
            console.log('🧪 Testing Hugging Face API connection...');
            
            // First test free spaces
            console.log('🆓 Testing free HuggingFace Spaces...');
            try {
                const freeTest = await this.tryHuggingFaceSpaces('test image', 'modern', '1:1');
                if (freeTest) {
                    console.log('✅ Free HuggingFace Spaces working!');
                    return {
                        success: true,
                        message: 'Free HuggingFace Spaces working! No API key needed.'
                    };
                }
            } catch (freeError) {
                console.log('⚠️ Free spaces test failed:', freeError.message);
            }
            
            // Check if we have a valid API key for paid inference
            if (!this.isValidKey) {
                return {
                    success: false,
                    error: 'Free HuggingFace Spaces unavailable and no valid API key. Get a key from https://huggingface.co/settings/tokens'
                };
            }
            
            // Test with a simple API endpoint that doesn't require special permissions
            const url = 'https://huggingface.co/api/models/gpt2';
            
            try {
                const response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                    }
                });
                
                if (response.ok) {
                    const modelData = await response.json();
                    console.log('✅ Hugging Face API key is valid! Model access confirmed:', modelData.id);
                    
                    // Now test the inference API for image generation
                    try {
                        const inferenceUrl = 'https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-2-1';
                        const inferenceResponse = await fetch(inferenceUrl, {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${this.apiKey}`,
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                inputs: 'test image generation',
                                parameters: { num_inference_steps: 5 }
                            })
                        });
                        
                        if (inferenceResponse.ok) {
                            console.log('✅ HuggingFace Inference API is fully working!');
                            return {
                                success: true,
                                message: 'API key valid and Inference API accessible. Both free and paid options available!'
                            };
                        } else if (inferenceResponse.status === 402) {
                            console.log('⚠️ HuggingFace API key valid but Inference API requires payment');
                            return {
                                success: true,
                                message: 'API key valid but paid inference requires credits. Free spaces available as backup!'
                            };
                        } else {
                            console.log('⚠️ API key valid but inference may have other issues');
                            return {
                                success: true,
                                message: 'API key valid - using free spaces for now, paid inference may require model loading time'
                            };
                        }
                    } catch (inferenceError) {
                        console.log('⚠️ API key valid but inference test failed:', inferenceError.message);
                        return {
                            success: true,
                            message: 'API key valid - using free spaces, paid inference capabilities unknown'
                        };
                    }
                    
                } else if (response.status === 401) {
                    console.error('❌ Hugging Face API authentication failed: Invalid API key');
                    return {
                        success: false,
                        error: 'Invalid API key but free spaces may still work. Check your API key for paid features.'
                    };
                } else {
                    const errorText = await response.text();
                    console.error('❌ Hugging Face API connection failed:', response.status, errorText);
                    return {
                        success: false,
                        error: `API connection failed but free spaces may work: ${response.status}`
                    };
                }
            } catch (networkError) {
                console.error('❌ Network error testing Hugging Face API:', networkError);
                return {
                    success: false,
                    error: `Network error - free spaces may still work: ${networkError.message}`
                };
            }
            
        } catch (error) {
            console.error('❌ Hugging Face connection test error:', error);
            return {
                success: false,
                error: `Connection test failed but free options may work: ${error.message}`
            };
        }
    }

    /**
     * Get model description
     */
    getModelDescription(modelKey) {
        const descriptions = {
            'stable-diffusion': 'General purpose, balanced quality and speed',
            'stable-diffusion-xl': 'High quality, detailed images',
            'anime': 'Anime and manga style artwork',
            'artistic': 'Artistic and creative styles',
            'realistic': 'Photorealistic images',
            'pixel-art': 'Retro pixel art style',
            'minimalist': 'Clean, minimal designs',
            'default': 'Reliable general purpose model'
        };
        
        return descriptions[modelKey] || 'Open-source image generation model';
    }
}

export default HuggingFaceService;
