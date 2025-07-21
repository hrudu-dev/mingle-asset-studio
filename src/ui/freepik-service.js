/**
 * Freepik Mystic Image Generation Service
 * Provides integration with Freepik's Mystic API for ultra-realistic, high-resolution images
 */

class FreepikService {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseUrl = 'https://api.freepik.com/v1/ai/mystic';
        this.statusUrl = 'https://api.freepik.com/v1/ai/mystic';
        this.isValidKey = false;
        
        // Validate API key format
        if (!apiKey || apiKey === 'YOUR_FREEPIK_API_KEY_HERE' || apiKey === 'DEMO_KEY_NEEDS_REPLACEMENT') {
            console.warn('⚠️ Freepik API key not configured - service will be disabled');
            this.isValidKey = false;
        } else if (!apiKey.startsWith('FPSX')) {
            console.warn('⚠️ Invalid Freepik API key format - should start with "FPSX"');
            this.isValidKey = false;
        } else {
            this.isValidKey = true;
        }
        
        // Available models for different use cases
        this.models = {
            'realism': 'realism',      // Realistic images with natural colors
            'fluid': 'fluid',          // Best prompt adherence, creative images
            'zen': 'zen'               // Smoother, cleaner, simpler results
        };
        
        // Style to model mapping
        this.styleModelMapping = {
            'colourful': 'fluid',
            'cyberpunk': 'fluid',
            'real': 'realism',
            'modern': 'fluid',
            'minimalist': 'zen',
            'vintage': 'realism',
            'bold': 'fluid',
            'elegant': 'realism',
            'playful': 'fluid'
        };
        
        // Resolution mapping
        this.resolutions = {
            'low': '1k',
            'medium': '2k',
            'high': '4k'
        };
        
        // Aspect ratio mapping
        this.aspectRatios = {
            '1:1': 'square_1_1',
            '16:9': 'widescreen_16_9',
            '9:16': 'social_story_9_16',
            '4:3': 'classic_4_3',
            '3:4': 'traditional_3_4',
            '3:2': 'standard_3_2',
            '2:3': 'portrait_2_3'
        };
    }

    /**
     * Generate an image using Freepik Mystic API
     */
    async generateImage(config) {
        const { prompt, style = 'modern', type = 'image', aspectRatio = '1:1', uploadedImage } = config;
        
        console.log('🎨 Generating image with Freepik Mystic:', { prompt, style, type, aspectRatio, hasUpload: !!uploadedImage });

        try {
            // Check for valid API key
            if (!this.isValidKey) {
                throw new Error('Invalid or missing Freepik API key. Please configure a valid API key.');
            }

            // Select appropriate model based on style and type
            const modelKey = this.getModelForRequest(style, type);
            const modelName = this.models[modelKey];
            
            // Enhance prompt based on style and type
            const enhancedPrompt = this.enhancePrompt(prompt, style, type, aspectRatio, uploadedImage);
            
            // Generate image using Freepik API
            let imageResult;
            if (uploadedImage) {
                console.log('🖼️ Using image with style reference for Freepik generation');
                imageResult = await this.callFreepikWithStyleReference(modelName, enhancedPrompt, uploadedImage, aspectRatio);
            } else {
                imageResult = await this.callFreepikAPI(modelName, enhancedPrompt, aspectRatio);
            }
            
            return {
                success: true,
                imageUrl: imageResult.imageUrl,
                prompt: enhancedPrompt,
                model: modelName,
                metadata: {
                    style,
                    type,
                    aspectRatio,
                    originalPrompt: prompt,
                    provider: 'freepik',
                    hasUploadedImage: !!uploadedImage,
                    taskId: imageResult.taskId
                }
            };
            
        } catch (error) {
            console.error('❌ Freepik generation failed:', error);
            
            // Create fallback placeholder image
            console.log('🔄 Creating fallback placeholder image...');
            const fallbackImage = await this.createFallbackImage(config, error.message);
            
            return {
                success: true,
                imageUrl: fallbackImage,
                prompt: prompt,
                model: 'freepik-fallback',
                metadata: {
                    style,
                    type,
                    aspectRatio,
                    originalPrompt: prompt,
                    fallback: true,
                    error: error.message,
                    provider: 'freepik'
                }
            };
        }
    }

    /**
     * Call Freepik Mystic API for text-to-image generation
     */
    async callFreepikAPI(model, prompt, aspectRatio) {
        try {
            console.log('🌟 Calling Freepik Mystic API...');
            
            const requestBody = {
                prompt: prompt,
                model: model,
                resolution: '2k',
                aspect_ratio: this.aspectRatios[aspectRatio] || 'square_1_1',
                creative_detailing: 50,
                engine: 'automatic',
                fixed_generation: false,
                filter_nsfw: true
            };

            console.log('📡 Freepik API Request:', requestBody);

            const response = await fetch(this.baseUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-freepik-api-key': this.apiKey
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorData = await response.text();
                console.error('❌ Freepik API error:', response.status, errorData);
                throw new Error(`Freepik API error: ${response.status} - ${errorData}`);
            }

            const data = await response.json();
            console.log('✅ Freepik API response:', data);

            // Freepik API returns task_id, need to poll for completion
            if (data.task_id) {
                const imageUrl = await this.pollForCompletion(data.task_id);
                return {
                    imageUrl: imageUrl,
                    taskId: data.task_id
                };
            } else {
                throw new Error('No task ID returned from Freepik API');
            }
            
        } catch (error) {
            console.error('❌ Freepik API call failed:', error);
            throw error;
        }
    }

    /**
     * Call Freepik API with style reference (uploaded image)
     */
    async callFreepikWithStyleReference(model, prompt, uploadedImage, aspectRatio) {
        try {
            console.log('🖼️ Using Freepik with style reference...');
            
            // Convert uploaded image to base64
            const base64Image = uploadedImage.dataUrl.split(',')[1]; // Remove data:image/...;base64, prefix
            
            const requestBody = {
                prompt: prompt,
                model: model,
                resolution: '2k',
                aspect_ratio: this.aspectRatios[aspectRatio] || 'square_1_1',
                style_reference: base64Image,
                adherence: 60, // Balance between prompt and style
                hdr: 40,       // More natural look
                creative_detailing: 50,
                engine: 'automatic',
                fixed_generation: false,
                filter_nsfw: true
            };

            const response = await fetch(this.baseUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-freepik-api-key': this.apiKey
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorData = await response.text();
                console.error('❌ Freepik style reference API error:', response.status, errorData);
                throw new Error(`Freepik API error: ${response.status} - ${errorData}`);
            }

            const data = await response.json();
            
            if (data.task_id) {
                const imageUrl = await this.pollForCompletion(data.task_id);
                return {
                    imageUrl: imageUrl,
                    taskId: data.task_id
                };
            } else {
                throw new Error('No task ID returned from Freepik API');
            }
            
        } catch (error) {
            console.error('❌ Freepik style reference call failed:', error);
            throw error;
        }
    }

    /**
     * Poll for task completion
     */
    async pollForCompletion(taskId, maxAttempts = 30, delayMs = 2000) {
        console.log(`⏳ Polling for completion of task: ${taskId}`);
        
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            try {
                const response = await fetch(`${this.statusUrl}/${taskId}`, {
                    method: 'GET',
                    headers: {
                        'x-freepik-api-key': this.apiKey
                    }
                });

                if (!response.ok) {
                    const errorData = await response.text();
                    console.error('❌ Freepik status check error:', response.status, errorData);
                    throw new Error(`Status check error: ${response.status}`);
                }

                const data = await response.json();
                console.log(`📊 Attempt ${attempt + 1}: Task status:`, data.task_status || data.status);

                if (data.task_status === 'COMPLETED' || data.status === 'COMPLETED') {
                    if (data.generated && data.generated.length > 0) {
                        console.log('✅ Freepik generation completed!');
                        return data.generated[0]; // Return first generated image URL
                    } else {
                        throw new Error('Task completed but no images generated');
                    }
                } else if (data.task_status === 'FAILED' || data.status === 'FAILED') {
                    throw new Error('Freepik generation failed');
                } else if (data.task_status === 'IN_PROGRESS' || data.status === 'IN_PROGRESS') {
                    // Still processing, wait and try again
                    await new Promise(resolve => setTimeout(resolve, delayMs));
                    continue;
                } else {
                    console.warn(`⚠️ Unknown status: ${data.task_status || data.status}`);
                    await new Promise(resolve => setTimeout(resolve, delayMs));
                }
                
            } catch (error) {
                console.error(`❌ Polling attempt ${attempt + 1} failed:`, error);
                if (attempt === maxAttempts - 1) {
                    throw error;
                }
                await new Promise(resolve => setTimeout(resolve, delayMs));
            }
        }
        
        throw new Error('Polling timeout: Task did not complete within expected time');
    }

    /**
     * Select the best model for the request
     */
    getModelForRequest(style, type) {
        // Special handling for specific asset types
        if (type === 'logo' || type === 'icon') {
            return 'zen'; // Clean, simple results for graphics
        }
        
        if (type === 'layout') {
            return 'zen'; // Better for clean layouts
        }
        
        // Use style mapping for general images
        return this.styleModelMapping[style] || 'fluid';
    }

    /**
     * Enhance the prompt based on style, type, and aspect ratio
     */
    enhancePrompt(prompt, style, type, aspectRatio, uploadedImage) {
        let enhancedPrompt = prompt;
        
        // Add uploaded image context if available
        if (uploadedImage) {
            enhancedPrompt = `${prompt}, with style and aesthetic inspired by the reference image`;
        }
        
        // Add type-specific enhancements
        const typeEnhancements = {
            'image': 'high quality, detailed, professional photography',
            'icon': 'simple icon design, clean, minimal, vector style, clear symbol',
            'logo': 'professional logo design, clean, memorable, brand identity, vector style',
            'layout': 'clean layout design, organized, professional, modern interface'
        };
        
        // Add style-specific enhancements
        const styleEnhancements = {
            'colourful': 'vibrant colors, bright, colorful, energetic, lively',
            'cyberpunk': 'cyberpunk aesthetic, neon lights, futuristic, dark atmosphere, digital',
            'real': 'photorealistic, natural lighting, detailed, lifelike, authentic',
            'modern': 'modern design, contemporary, sleek, minimalist, current',
            'minimalist': 'minimalist design, simple, clean, white space, elegant',
            'vintage': 'vintage style, retro, classic, aged, nostalgic, timeless',
            'bold': 'bold design, strong colors, high contrast, dramatic, impactful',
            'elegant': 'elegant, sophisticated, refined, luxury, premium, graceful',
            'playful': 'playful, fun, whimsical, creative, joyful, lighthearted'
        };
        
        // Add quality and technical specifications
        const qualityTerms = 'masterpiece quality, ultra detailed, sharp focus, professional';
        
        // Combine all enhancements
        enhancedPrompt = `${enhancedPrompt}, ${typeEnhancements[type]}, ${styleEnhancements[style]}, ${qualityTerms}`;
        
        // Add aspect ratio guidance
        if (aspectRatio === '16:9') {
            enhancedPrompt += ', wide composition, landscape format';
        } else if (aspectRatio === '9:16') {
            enhancedPrompt += ', tall composition, portrait format';
        } else if (aspectRatio === '1:1') {
            enhancedPrompt += ', square composition, centered';
        }
        
        return enhancedPrompt;
    }

    /**
     * Create a fallback placeholder image when Freepik API fails
     */
    async createFallbackImage(config, errorMessage) {
        const { style = 'modern', type = 'image', aspectRatio = '1:1' } = config;
        
        // Create a canvas element
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Set dimensions based on aspect ratio
        let width = 512;
        let height = 512;
        
        if (aspectRatio === '16:9') {
            width = 512;
            height = 288;
        } else if (aspectRatio === '9:16') {
            width = 288;
            height = 512;
        } else if (aspectRatio === '4:3') {
            width = 512;
            height = 384;
        } else if (aspectRatio === '3:4') {
            width = 384;
            height = 512;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Freepik-themed colors (modern gradient)
        const freepikColors = {
            'colourful': { bg: '#6366f1', text: '#ffffff', accent: '#8b5cf6' },
            'cyberpunk': { bg: '#7c3aed', text: '#e0e7ff', accent: '#c4b5fd' },
            'real': { bg: '#374151', text: '#f9fafb', accent: '#9ca3af' },
            'modern': { bg: '#1f2937', text: '#ffffff', accent: '#6366f1' },
            'minimalist': { bg: '#f8fafc', text: '#1f2937', accent: '#6b7280' },
            'vintage': { bg: '#92400e', text: '#fef3c7', accent: '#d97706' },
            'bold': { bg: '#dc2626', text: '#ffffff', accent: '#f87171' },
            'elegant': { bg: '#1f2937', text: '#f9fafb', accent: '#6366f1' },
            'playful': { bg: '#ec4899', text: '#ffffff', accent: '#f472b6' }
        };
        
        const colors = freepikColors[style] || freepikColors['modern'];
        
        // Create gradient background
        const gradient = ctx.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, colors.bg);
        gradient.addColorStop(1, colors.accent);
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
        
        // Add Freepik logo/indicator
        ctx.fillStyle = colors.text;
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Title
        ctx.fillText(`⭐ FREEPIK ${type.toUpperCase()}`, width / 2, height / 2 - 40);
        
        // Style indicator
        ctx.font = '16px Arial';
        ctx.fillText(`Style: ${style}`, width / 2, height / 2);
        
        // Error info (truncated)
        ctx.font = '12px Arial';
        const shortError = errorMessage.length > 40 ? errorMessage.substring(0, 40) + '...' : errorMessage;
        ctx.fillText(`Fallback: ${shortError}`, width / 2, height / 2 + 30);
        
        // Add decorative elements based on type
        ctx.fillStyle = colors.accent;
        if (type === 'icon') {
            // Freepik-style icon
            ctx.beginPath();
            ctx.arc(width / 2, height / 2 - 80, 20, 0, 2 * Math.PI);
            ctx.fill();
        } else if (type === 'logo') {
            // Freepik-style logo shape
            ctx.fillRect(width / 2 - 40, height / 2 - 100, 80, 30);
        }
        
        // Convert canvas to data URL
        return canvas.toDataURL('image/png');
    }

    /**
     * Test Freepik API connection
     */
    async testConnection() {
        try {
            console.log('🧪 Testing Freepik API connection...');
            
            // Check if we have a valid API key first
            if (!this.isValidKey) {
                return {
                    success: false,
                    error: 'Invalid or missing Freepik API key. Please check your API key configuration.'
                };
            }
            
            // Simple test generation
            const testRequestBody = {
                prompt: 'a simple red circle, minimalist',
                model: 'zen',
                resolution: '1k',
                aspect_ratio: 'square_1_1',
                creative_detailing: 30,
                engine: 'automatic',
                fixed_generation: true,
                filter_nsfw: true
            };

            const response = await fetch(this.baseUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-freepik-api-key': this.apiKey
                },
                body: JSON.stringify(testRequestBody)
            });

            if (!response.ok) {
                const errorData = await response.text();
                console.error('❌ Freepik API test error:', response.status, errorData);
                
                let errorMessage = `API Error: ${response.status}`;
                
                if (response.status === 401) {
                    errorMessage += ' - Invalid API key';
                } else if (response.status === 403) {
                    errorMessage += ' - API key lacks permission';
                } else if (response.status === 429) {
                    errorMessage += ' - Rate limit exceeded';
                } else if (response.status === 500) {
                    errorMessage += ' - Server error';
                }
                
                return {
                    success: false,
                    error: errorMessage
                };
            }

            const data = await response.json();
            
            if (data.task_id) {
                console.log('✅ Freepik API connection successful! Task ID:', data.task_id);
                return {
                    success: true,
                    taskId: data.task_id,
                    status: data.task_status || data.status
                };
            } else {
                return {
                    success: false,
                    error: 'No task ID returned from API'
                };
            }

        } catch (error) {
            console.error('❌ Freepik connection test failed:', error);
            
            let errorMessage = error.message;
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                errorMessage = 'Network error - check internet connection';
            }
            
            return {
                success: false,
                error: errorMessage
            };
        }
    }
}

export default FreepikService;
