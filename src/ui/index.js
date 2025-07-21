import addOnUISdk from "https://new.express.adobe.com/static/add-on-sdk/sdk.js";
import HuggingFaceService from "./huggingface-service.js";
import GeminiService from "./gemini-service.js";
import FreepikService from "./freepik-service.js";
import LocalModelsService from "./local-models-service.js";

// Add debugging to window for troubleshooting
window.debugInfo = {
    sdkLoaded: false,
    initialized: false,
    errors: []
};

console.log("🔧 DEBUG: Script loading started");

class MingleAssetStudio {
    constructor() {
        console.log("🔧 DEBUG: Constructor called");
        this.assets = new Map();
        this.sandboxProxy = null;
        this.outputImages = [];
        
        // Initialize all AI services
        try {
            const hfApiKey = this.getHuggingFaceApiKey();
            this.huggingFaceService = new HuggingFaceService(hfApiKey);
            console.log('🤗 Hugging Face service initialized');
            
            // Gemini API key - using environment variable or demo key
            const geminiApiKey = this.getGeminiApiKey();
            this.geminiService = new GeminiService(geminiApiKey);
            console.log('🧠 Gemini service initialized');
            
            // Freepik API key - ultra-realistic image generation
            const freepikApiKey = this.getFreepikApiKey();
            this.freepikService = new FreepikService(freepikApiKey);
            console.log('⭐ Freepik service initialized');
            
            // Local Models - free open-source models (always available)
            this.localModelsService = new LocalModelsService();
            console.log('🎨 Local Models service initialized');
            
            // Set default provider to HuggingFace (includes free tier)
            this.currentProvider = 'huggingface'; // Options: 'huggingface', 'gemini', 'freepik', 'local', 'all'
            
        } catch (error) {
            console.error('❌ Failed to initialize AI services:', error);
            window.debugInfo.errors.push('AI services init failed: ' + error.message);
        }
    }

    /**
     * Get Hugging Face API key
     * To get your API key:
     * 1. Go to https://huggingface.co/settings/tokens
     * 2. Create a new token with 'Read' permissions
     * 3. Replace the value below with your token (starts with 'hf_')
     */
    getHuggingFaceApiKey() {
        // Replace with your actual Hugging Face API key
        const apiKey = 'YOUR_HUGGINGFACE_API_KEY_HERE'; // Should start with 'hf_'
        
        if (apiKey === 'YOUR_HUGGINGFACE_API_KEY_HERE') {
            console.warn('⚠️ Please replace with your actual Hugging Face API key for full functionality');
        }
        
        return apiKey;
    }

    /**
     * Get Gemini API key from environment or use a demo key
     * To get your API key:
     * 1. Go to https://aistudio.google.com/app/apikey
     * 2. Create a new API key
     * 3. Replace the value below with your key (starts with 'AIza')
     */
    getGeminiApiKey() {
        // Replace 'YOUR_ACTUAL_API_KEY_HERE' with your real Gemini API key
        const apiKey = 'DEMO_KEY_NEEDS_REPLACEMENT'; // Put your real API key here
        
        if (apiKey === 'YOUR_GEMINI_API_KEY_HERE' || apiKey === 'DEMO_KEY_NEEDS_REPLACEMENT') {
            console.warn('⚠️ Gemini API key not configured - service will be disabled');
        }
        
        return apiKey;
    }

    /**
     * Get Freepik API key for ultra-realistic image generation
     * To get your API key:
     * 1. Go to https://freepik.com/api
     * 2. Sign up for Freepik API access
     * 3. Replace the value below with your API key
     */
    getFreepikApiKey() {
        // Replace with your actual Freepik API key
        const apiKey = 'YOUR_FREEPIK_API_KEY_HERE'; // Get from https://freepik.com/api
        
        if (apiKey === 'YOUR_FREEPIK_API_KEY_HERE') {
            console.warn('⚠️ Please replace with your actual Freepik API key for full functionality');
        }
        
        return apiKey;
    }

    async init() {
        console.log("🚀 Initializing Mingle Asset Studio...");
        console.log("🔧 DEBUG: Init method called");
        
        try {
            // Check if addOnUISdk is available
            if (!addOnUISdk) {
                throw new Error("addOnUISdk is not available");
            }
            console.log("🔧 DEBUG: addOnUISdk available");
            
            if (!addOnUISdk.instance) {
                throw new Error("addOnUISdk.instance is not available");
            }
            console.log("🔧 DEBUG: addOnUISdk.instance available");
            
            // Get the UI runtime and sandbox proxy
            const { runtime } = addOnUISdk.instance;
            console.log("📡 Getting sandbox proxy...");
            
            try {
                this.sandboxProxy = await runtime.apiProxy("documentSandbox");
                console.log("✅ Sandbox proxy connected:", this.sandboxProxy ? "Success" : "Failed");
            } catch (sandboxError) {
                console.warn("⚠️ Sandbox proxy failed, continuing without it:", sandboxError);
                this.sandboxProxy = null;
            }
            
            // Initialize UI components (this should work even without sandbox)
            this.initializeGenerator();
            this.initializeOutput();
            this.initializeImageUpload();
            
            console.log("✅ Mingle Asset Studio initialized successfully!");
            window.debugInfo.initialized = true;
            this.showToast("Welcome to Mingle Asset Studio! 🎉", "success");
            
            // Run API diagnosis on startup for debugging (with error handling)
            setTimeout(async () => {
                try {
                    await this.diagnoseAllAPIs();
                } catch (diagnosisError) {
                    console.warn("⚠️ API diagnosis failed, but app continues to work:", diagnosisError);
                }
            }, 2000); // Wait 2 seconds for everything to initialize
            
        } catch (error) {
            console.error("❌ Initialization failed:", error);
            window.debugInfo.errors.push('Init failed: ' + error.message);
            this.showToast("Failed to initialize. Please refresh and try again.", "error");
            
            // Try to initialize UI components even if everything else fails
            try {
                this.initializeGenerator();
                this.initializeOutput();
                this.initializeImageUpload();
                console.log("⚠️ UI initialized in fallback mode");
                this.showToast("Running in fallback mode - limited functionality", "warning");
            } catch (uiError) {
                console.error("❌ UI initialization also failed:", uiError);
                window.debugInfo.errors.push('UI init failed: ' + uiError.message);
            }
        }
    }

    initializeGenerator() {
        console.log("🔧 DEBUG: initializeGenerator called");
        
        const generateBtn = document.getElementById('generateAssetBtn');
        const promptInput = document.getElementById('promptInput');
        
        if (!generateBtn) {
            console.error("❌ Generate button not found!");
            window.debugInfo.errors.push('Generate button not found');
            return;
        }
        
        if (!promptInput) {
            console.error("❌ Prompt input not found!");
            window.debugInfo.errors.push('Prompt input not found');
            return;
        }
        
        console.log("🔧 DEBUG: Found generate button and prompt input");
        
        // Initialize selection handlers
        this.initializeAspectRatio();
        this.initializeStyleSelection();
        this.initializeTypeSelection();
        this.initializeProviderSelection();
        this.initializeModelInfo();

        generateBtn.addEventListener('click', async () => {
            console.log("🔧 DEBUG: Generate button clicked");
            const prompt = promptInput.value.trim();
            
            if (!prompt) {
                this.showToast("Please enter a prompt to generate an asset", "error");
                return;
            }

            const config = {
                prompt: prompt,
                type: this.getSelectedType(),
                style: this.getSelectedStyle(),
                aspectRatio: this.getSelectedAspectRatio()
            };
            
            console.log("🔧 DEBUG: Config created:", config);
            console.log("🔧 DEBUG: Current provider:", this.currentProvider);
            await this.generateAsset(config);
        });

        // Test Local Models button for development
        const testLocalBtn = document.getElementById('testLocalBtn');
        if (testLocalBtn) {
            testLocalBtn.addEventListener('click', async () => {
                console.log("🔧 DEBUG: Test Local Models button clicked");
                await this.testLocalModelsConnection();
            });
        }

        // Test Canvas Integration button for development
        const testCanvasBtn = document.getElementById('testCanvasBtn');
        if (testCanvasBtn) {
            testCanvasBtn.addEventListener('click', async () => {
                console.log("🔧 DEBUG: Test Canvas button clicked");
                await this.testCanvasIntegration();
            });
        }

        // Test HF button for development
        const testHfBtn = document.getElementById('testHfBtn');
        if (testHfBtn) {
            testHfBtn.addEventListener('click', async () => {
                console.log("🔧 DEBUG: Test HF button clicked");
                await this.testHuggingFaceConnection();
            });
        }

        // Test Gemini button for development
        const testGeminiBtn = document.getElementById('testGeminiBtn');
        if (testGeminiBtn) {
            testGeminiBtn.addEventListener('click', async () => {
                console.log("🔧 DEBUG: Test Gemini button clicked");
                await this.testGeminiConnection();
            });
        }

        // Test Freepik button for development
        const testFreepikBtn = document.getElementById('testFreepikBtn');
        if (testFreepikBtn) {
            testFreepikBtn.addEventListener('click', async () => {
                console.log("🔧 DEBUG: Test Freepik button clicked");
                await this.testFreepikConnection();
            });
        }

        // Diagnose all APIs button
        const diagnoseAPIsBtn = document.getElementById('diagnoseAPIsBtn');
        if (diagnoseAPIsBtn) {
            diagnoseAPIsBtn.addEventListener('click', async () => {
                console.log("🔧 DEBUG: Diagnose APIs button clicked");
                await this.diagnoseAllAPIs();
            });
        }

        // Enable enter key to generate
        promptInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                generateBtn.click();
            }
        });
        
        console.log("🔧 DEBUG: Generator initialization complete");
    }

    initializeProviderSelection() {
        const providerBtns = document.querySelectorAll('.provider-btn');
        
        providerBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                providerBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                const provider = btn.dataset.provider;
                this.switchProvider(provider);
            });
        });
    }

    initializeAspectRatio() {
        const aspectBtns = document.querySelectorAll('.aspect-btn');
        
        aspectBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                aspectBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });
    }

    initializeStyleSelection() {
        const styleCards = document.querySelectorAll('.style-btn');
        
        styleCards.forEach(card => {
            card.addEventListener('click', () => {
                styleCards.forEach(c => c.classList.remove('active'));
                card.classList.add('active');
                this.updateModelInfo();
            });
        });
    }

    initializeTypeSelection() {
        const typeBtns = document.querySelectorAll('.type-btn');
        
        typeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                typeBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.updateModelInfo();
            });
        });
    }

    initializeModelInfo() {
        // Model info is now simplified for the new UI
        // Initialize with current selection
        this.updateModelInfo();
    }

    updateModelInfo() {
        const currentStyle = this.getSelectedStyle();
        const currentType = this.getSelectedType();
        
        // Get the model that would be used for current selection
        const modelKey = this.huggingFaceService.getModelForRequest(currentStyle, currentType);
        const modelName = this.huggingFaceService.models[modelKey];
        
        console.log(`🤗 Selected model for ${currentType} with ${currentStyle} style: ${modelName}`);
    }

    formatModelName(name) {
        // Convert model names to readable format
        const nameMap = {
            'stable-diffusion-2-1': 'Stable Diffusion 2.1',
            'stable-diffusion-xl-base-1.0': 'Stable Diffusion XL',
            'waifu-diffusion': 'Waifu Diffusion',
            'openjourney-v4': 'OpenJourney v4',
            'Realistic_Vision_V2.0': 'Realistic Vision',
            'pixel-art-xl': 'Pixel Art XL',
            'stable-diffusion-v1-5': 'Stable Diffusion 1.5'
        };
        
        return nameMap[name] || name.charAt(0).toUpperCase() + name.slice(1);
    }

    getSelectedType() {
        const activeType = document.querySelector('.type-btn.active');
        return activeType ? activeType.dataset.type : 'image';
    }

    getSelectedStyle() {
        const activeStyle = document.querySelector('.style-btn.active');
        return activeStyle ? activeStyle.dataset.style : 'colourful';
    }

    getSelectedAspectRatio() {
        const activeAspect = document.querySelector('.aspect-btn.active');
        return activeAspect ? activeAspect.dataset.ratio : '1:1';
    }

    async generateAsset(config) {
        console.log("🚀 Starting asset generation with config:", config);
        console.log("🔧 DEBUG: generateAsset called");
        
        // Add uploaded image to config if available
        if (this.uploadedImage) {
            config.uploadedImage = this.uploadedImage;
            console.log("🖼️ Including uploaded image in generation:", this.uploadedImage.name);
        }
        
        const generateBtn = document.getElementById('generateAssetBtn');
        const btnText = generateBtn.querySelector('.btn-text');
        const spinner = generateBtn.querySelector('.loading-spinner');
        
        if (!generateBtn || !btnText || !spinner) {
            console.error("❌ Button elements not found");
            this.showToast("UI error: Button elements missing", "error");
            return;
        }
        
        // Show loading state
        generateBtn.disabled = true;
        btnText.classList.add('hidden');
        spinner.classList.remove('hidden');
        
        try {
            console.log("� Generating 4 images with multiple AI providers...");
            
            // Show progress
            this.showToast('Generating 4 images with AI...', 'info');
            
            let successfulResults = [];
            
            try {
            // Generate images using selected provider(s)
            if (this.currentProvider === 'all') {
                // Use all providers - distribute images among them
                successfulResults = await this.generateWithAllProviders(config);
            } else if (this.currentProvider === 'local') {
                // Use local/free models
                successfulResults = await this.generateWithLocalModels(config);
            } else if (this.currentProvider === 'freepik') {
                // Use only Freepik
                successfulResults = await this.generateWithFreepik(config);
            } else if (this.currentProvider === 'gemini') {
                // Use only Gemini
                successfulResults = await this.generateWithGemini(config);
            } else if (this.currentProvider === 'huggingface') {
                // Use only Hugging Face (default)
                successfulResults = await this.generateWithHuggingFace(config);
            } else {
                // Fallback to Hugging Face if provider not recognized
                successfulResults = await this.generateWithHuggingFace(config);
            }            } catch (aiError) {
                console.warn("⚠️ AI generation failed, using fallback:", aiError);
                
                // Create fallback test images
                for (let i = 0; i < 4; i++) {
                    const fallbackResult = await this.createTestImage(config, i + 1);
                    successfulResults.push(fallbackResult);
                }
            }
            
            if (successfulResults.length === 0) {
                throw new Error('All image generations failed');
            }
            
            console.log(`✅ Generated ${successfulResults.length}/4 images successfully`);
            this.showToast(`Generated ${successfulResults.length}/4 images!`, 'success');
            
            // Add all successful images to output area
            console.log("🔧 DEBUG: Adding images to output area...");
            for (const [index, result] of successfulResults.entries()) {
                try {
                    const asset = await this.createAssetData(config, result, index + 1);
                    this.addImageToOutput(result.imageUrl, asset);
                    console.log(`✅ Added image ${index + 1} to output`);
                } catch (imageError) {
                    console.error(`❌ Failed to add image ${index + 1}:`, imageError);
                }
            }
            
            // Add to library (just the first one for compatibility)
            if (successfulResults.length > 0) {
                try {
                    console.log("🔧 DEBUG: Adding first asset to library...");
                    const firstAsset = await this.createAssetData(config, successfulResults[0], 1);
                    this.addAssetToLibrary(firstAsset);
                    console.log("✅ Added asset to library");
                } catch (libraryError) {
                    console.error("❌ Failed to add to library:", libraryError);
                }
            }
            
            console.log("✅ All asset generations completed successfully!");
            
            // Show provider summary
            const providers = [...new Set(successfulResults.map(r => r.metadata?.provider || 'fallback'))];
            const providerText = providers.join(' + ');
            
            this.showToast(`4 images generated with ${providerText}! 🎨`, "success");
            
            // Clear form
            document.getElementById('promptInput').value = '';
            
        } catch (error) {
            console.error('❌ Asset generation failed:', error);
            this.showToast(`Generation failed: ${error.message}`, "error");
        } finally {
            // Reset button state
            generateBtn.disabled = false;
            btnText.classList.remove('hidden');
            spinner.classList.add('hidden');
        }
    }

    // Generate with Local Models only (free open-source)
    async generateWithLocalModels(config) {
        const generationPromises = [];
        for (let i = 0; i < 4; i++) {
            const variedConfig = {
                ...config,
                prompt: `${config.prompt}, variation ${i + 1}`
            };
            generationPromises.push(this.localModelsService.generateImage(variedConfig));
        }
        
        const generationResults = await Promise.all(generationPromises);
        return generationResults.filter(result => result.success);
    }

    // Generate with Freepik only
    async generateWithFreepik(config) {
        const generationPromises = [];
        for (let i = 0; i < 4; i++) {
            const variedConfig = {
                ...config,
                prompt: `${config.prompt}, variation ${i + 1}`
            };
            generationPromises.push(this.freepikService.generateImage(variedConfig));
        }
        
        const generationResults = await Promise.all(generationPromises);
        return generationResults.filter(result => result.success);
    }

    // Generate with Hugging Face only
    async generateWithHuggingFace(config) {
        const generationPromises = [];
        for (let i = 0; i < 4; i++) {
            const variedConfig = {
                ...config,
                prompt: `${config.prompt}, variation ${i + 1}`
            };
            generationPromises.push(this.huggingFaceService.generateImage(variedConfig));
        }
        
        const generationResults = await Promise.all(generationPromises);
        return generationResults.filter(result => result.success);
    }

    // Generate with Gemini only
    async generateWithGemini(config) {
        const generationPromises = [];
        for (let i = 0; i < 4; i++) {
            const variedConfig = {
                ...config,
                prompt: `${config.prompt}, variation ${i + 1}`
            };
            generationPromises.push(this.geminiService.generateImage(variedConfig));
        }
        
        const generationResults = await Promise.all(generationPromises);
        return generationResults.filter(result => result.success);
    }

    // Generate with all three providers
    async generateWithAllProviders(config) {
        const allPromises = [];
        
        // 1 image from Freepik (newest, highest quality)
        const freepikConfig = {
            ...config,
            prompt: `${config.prompt}, premium Freepik generation`
        };
        allPromises.push(this.freepikService.generateImage(freepikConfig));
        
        // 2 images from Hugging Face
        for (let i = 0; i < 2; i++) {
            const variedConfig = {
                ...config,
                prompt: `${config.prompt}, HF variation ${i + 1}`
            };
            allPromises.push(this.huggingFaceService.generateImage(variedConfig));
        }
        
        // 1 image from Gemini
        const geminiConfig = {
            ...config,
            prompt: `${config.prompt}, Gemini creative variation`
        };
        allPromises.push(this.geminiService.generateImage(geminiConfig));
        
        const generationResults = await Promise.all(allPromises);
        return generationResults.filter(result => result.success);
    }

    // Generate with both providers (legacy method for backward compatibility)
    async generateWithBothProviders(config) {
        const allPromises = [];
        
        // 2 images from Hugging Face
        for (let i = 0; i < 2; i++) {
            const variedConfig = {
                ...config,
                prompt: `${config.prompt}, HF variation ${i + 1}`
            };
            allPromises.push(this.huggingFaceService.generateImage(variedConfig));
        }
        
        // 2 images from Gemini
        for (let i = 0; i < 2; i++) {
            const variedConfig = {
                ...config,
                prompt: `${config.prompt}, Gemini variation ${i + 1}`
            };
            allPromises.push(this.geminiService.generateImage(variedConfig));
        }
        
        const generationResults = await Promise.all(allPromises);
        return generationResults.filter(result => result.success);
    }

    // Test image creation for fallback
    async createTestImage(config, variationNumber) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 400;
        canvas.height = 400;
        
        // Create a simple colored rectangle with text
        const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'];
        const color = colors[variationNumber - 1] || '#6C5CE7';
        
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, 400, 400);
        
        ctx.fillStyle = 'white';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`Test Image ${variationNumber}`, 200, 180);
        ctx.font = '16px Arial';
        ctx.fillText(config.prompt, 200, 220);
        ctx.fillText(`Style: ${config.style}`, 200, 250);
        
        const dataUrl = canvas.toDataURL('image/png');
        
        return {
            success: true,
            imageUrl: dataUrl,
            prompt: config.prompt,
            model: 'test-generator',
            metadata: {
                style: config.style,
                type: config.type,
                aspectRatio: config.aspectRatio,
                originalPrompt: config.prompt,
                fallback: true,
                test: true
            }
        };
    }

    async createAssetData(config, generationResult, variationNumber = 1) {
        const assetId = 'asset_' + Date.now() + '_' + variationNumber;
        const asset = {
            id: assetId,
            name: `${config.type}_${Date.now()}_v${variationNumber}`,
            type: config.type,
            style: config.style,
            prompt: config.prompt,
            createdAt: new Date(),
            thumbnail: generationResult ? generationResult.imageUrl : this.getThumbnailForType(config.type),
            imageUrl: generationResult ? generationResult.imageUrl : null,
            model: generationResult ? generationResult.model : 'simulation',
            metadata: generationResult ? generationResult.metadata : {},
            variation: variationNumber
        };
        
        return asset;
    }

    async createAssetInExpress(config, imageUrl = null) {
        try {
            console.log("🔗 Sandbox proxy status:", this.sandboxProxy ? "Connected" : "Not connected");
            
            if (!this.sandboxProxy) {
                throw new Error("Sandbox proxy not available");
            }
            
            console.log(`🎯 Creating ${config.type} asset in Adobe Express...`);
            
            // Enhanced config with generated image
            const enhancedConfig = {
                ...config,
                imageUrl: imageUrl
            };
            
            // Use the correct sandbox methods based on available API
            if (imageUrl) {
                // If we have an image URL, create image asset
                await this.sandboxProxy.createImageAsset(enhancedConfig);
            } else {
                // Fallback to rectangle creation
                await this.sandboxProxy.createRectangle();
            }
            
            console.log("✅ Asset created successfully in Adobe Express!");
            
        } catch (error) {
            console.error('❌ Express asset creation failed:', error);
            console.log("🔄 Attempting fallback rectangle creation...");
            
            try {
                // Always fallback to simple rectangle which we know works
                await this.sandboxProxy.createRectangle();
                console.log("✅ Fallback rectangle created successfully!");
            } catch (fallbackError) {
                console.error("❌ Fallback creation also failed:", fallbackError);
                throw fallbackError;
            }
        }
    }

    // Output Area Management
    initializeOutput() {
        console.log("🖼️ Initializing output area...");
        console.log("🔧 DEBUG: initializeOutput called");
        
        this.outputImages = [];
        
        // Check if output area exists
        const outputArea = document.getElementById('outputArea');
        if (!outputArea) {
            console.error("❌ Output area not found!");
            window.debugInfo.errors.push('Output area not found');
            return;
        }
        
        console.log("🔧 DEBUG: Output area found");
        this.updateOutputArea();
        console.log("🔧 DEBUG: Output initialization complete");
    }

    initializeImageUpload() {
        console.log("🖼️ Initializing image upload...");
        
        const uploadArea = document.getElementById('uploadImageArea');
        const uploadInput = document.getElementById('imageUploadInput');
        const uploadText = document.getElementById('uploadText');
        const uploadPreview = document.getElementById('uploadedImagePreview');
        const uploadThumb = document.getElementById('uploadedImageThumb');
        const clearUploadBtn = document.getElementById('clearUploadBtn');
        
        if (!uploadArea || !uploadInput) {
            console.error("❌ Upload elements not found!");
            return;
        }
        
        this.uploadedImage = null;
        
        // Click to upload
        uploadArea.addEventListener('click', () => {
            uploadInput.click();
        });
        
        // File input change handler
        uploadInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.handleImageUpload(file);
            }
        });
        
        // Drag and drop support
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('bg-[#1a1f25]');
        });
        
        uploadArea.addEventListener('dragleave', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('bg-[#1a1f25]');
        });
        
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('bg-[#1a1f25]');
            
            const files = e.dataTransfer.files;
            if (files.length > 0 && files[0].type.startsWith('image/')) {
                this.handleImageUpload(files[0]);
            }
        });
        
        // Clear upload button
        if (clearUploadBtn) {
            clearUploadBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.clearUploadedImage();
            });
        }
        
        console.log("✅ Image upload initialized");
    }

    async handleImageUpload(file) {
        console.log("🖼️ Handling image upload:", file.name);
        
        const uploadText = document.getElementById('uploadText');
        const uploadPreview = document.getElementById('uploadedImagePreview');
        const uploadThumb = document.getElementById('uploadedImageThumb');
        
        try {
            // Validate file
            if (!file.type.startsWith('image/')) {
                this.showToast("Please upload a valid image file", "error");
                return;
            }
            
            if (file.size > 10 * 1024 * 1024) { // 10MB limit
                this.showToast("Image file is too large. Please use a file under 10MB", "error");
                return;
            }
            
            // Read file as data URL
            const reader = new FileReader();
            reader.onload = (e) => {
                const dataUrl = e.target.result;
                
                // Store uploaded image
                this.uploadedImage = {
                    file: file,
                    dataUrl: dataUrl,
                    name: file.name
                };
                
                // Update UI
                uploadText.textContent = `📎 ${file.name}`;
                uploadThumb.src = dataUrl;
                uploadPreview.classList.remove('hidden');
                
                this.showToast("Image uploaded successfully! 📸", "success");
                console.log("✅ Image uploaded and stored");
            };
            
            reader.onerror = () => {
                this.showToast("Failed to read image file", "error");
                console.error("❌ FileReader error");
            };
            
            reader.readAsDataURL(file);
            
        } catch (error) {
            console.error("❌ Image upload error:", error);
            this.showToast("Failed to upload image", "error");
        }
    }

    clearUploadedImage() {
        console.log("🗑️ Clearing uploaded image");
        
        const uploadText = document.getElementById('uploadText');
        const uploadPreview = document.getElementById('uploadedImagePreview');
        const uploadInput = document.getElementById('imageUploadInput');
        
        this.uploadedImage = null;
        uploadText.textContent = 'Upload an image';
        uploadPreview.classList.add('hidden');
        uploadInput.value = '';
        
        this.showToast("Uploaded image cleared", "info");
        console.log("✅ Uploaded image cleared");
    }

    addImageToOutput(imageUrl, asset) {
        const outputImage = {
            id: asset.id,
            url: imageUrl,
            prompt: asset.prompt,
            style: asset.style,
            type: asset.type,
            timestamp: new Date()
        };
        
        this.outputImages.unshift(outputImage); // Add to beginning
        
        // Keep only last 6 images
        if (this.outputImages.length > 6) {
            this.outputImages = this.outputImages.slice(0, 6);
        }
        
        this.updateOutputArea();
        console.log("✅ Added image to output area:", asset.id);
    }

    updateOutputArea() {
        const outputArea = document.getElementById('outputArea');
        const emptyState = document.getElementById('emptyState');
        
        if (!outputArea) {
            console.error("❌ Output area not found in DOM");
            return;
        }
        
        if (this.outputImages.length === 0) {
            if (emptyState) emptyState.style.display = 'flex';
            return;
        }
        
        if (emptyState) emptyState.style.display = 'none';
        
        // Remove existing images (except empty state)
        const existingImages = outputArea.querySelectorAll('.output-image');
        existingImages.forEach(img => img.remove());
        
        // Add new images
        this.outputImages.forEach(image => {
            const imageElement = this.createOutputImageElement(image);
            if (imageElement) {
                outputArea.appendChild(imageElement);
            }
        });
    }

    createOutputImageElement(imageData) {
        if (!imageData) {
            console.error("❌ No image data provided to createOutputImageElement");
            return null;
        }
        
        const div = document.createElement('div');
        div.className = 'output-image';
        
        try {
            div.innerHTML = `
                <img src="${imageData.url}" alt="${imageData.prompt || 'Generated image'}" />
                <button class="delete-btn" onclick="window.mingleStudio.removeOutputImage('${imageData.id}')" title="Remove">×</button>
            `;
            
            // Add click handler to add to document
            div.addEventListener('click', (e) => {
                if (!e.target.classList.contains('delete-btn')) {
                    this.addImageToDocument(imageData);
                }
            });
            
            return div;
        } catch (error) {
            console.error("❌ Error creating output image element:", error);
            return null;
        }
    }

    removeOutputImage(imageId) {
        this.outputImages = this.outputImages.filter(img => img.id !== imageId);
        this.updateOutputArea();
        this.showToast('Image removed from output', 'info');
    }

    async addImageToDocument(imageData) {
        try {
            console.log("📄 Adding image to Adobe Express document...");
            console.log("🔧 Image data:", {
                id: imageData.id,
                url: imageData.url?.substring(0, 100) + '...',
                type: imageData.type,
                prompt: imageData.prompt?.substring(0, 50) + '...'
            });
            
            if (!this.sandboxProxy) {
                throw new Error("Sandbox proxy not available - Adobe Express integration not initialized");
            }
            
            console.log("🔧 Sandbox proxy available, methods:", Object.keys(this.sandboxProxy));
            
            const config = {
                type: imageData.type,
                style: imageData.style,
                prompt: imageData.prompt,
                imageUrl: imageData.url
            };
            
            console.log("🔧 Calling createAssetInExpress with config...");
            await this.createAssetInExpress(config, imageData.url);
            
            console.log("✅ Image successfully added to document!");
            this.showToast("Image added to document! 📄", "success");
            
        } catch (error) {
            console.error("❌ Failed to add image to document:", error);
            console.error("❌ Error stack:", error.stack);
            
            // Provide specific user guidance based on error type
            let errorMessage = "Failed to add image to document";
            if (error.message.includes("Sandbox proxy not available")) {
                errorMessage = "Adobe Express not connected - please open in Express";
            } else if (error.message.includes("CORS")) {
                errorMessage = "Image loading blocked - trying alternative method";
            } else if (error.message.includes("network")) {
                errorMessage = "Network error - please check connection";
            }
            
            this.showToast(errorMessage, "error");
        }
    }

    initializeAssetLibrary() {
        const searchInput = document.getElementById('searchAssets');
        const filterSelect = document.getElementById('filterAssets');

        // Search functionality
        searchInput.addEventListener('input', () => {
            this.filterAssets();
        });

        // Filter functionality
        filterSelect.addEventListener('change', () => {
            this.filterAssets();
        });

        // Update initial view
        this.updateAssetGrid();
    }

    addAssetToLibrary(asset) {
        this.assets.set(asset.id, asset);
        this.updateAssetGrid();
        this.saveToStorage();
    }

    updateAssetGrid() {
        const grid = document.getElementById('assetGrid');
        
        // For the current UI, we don't have an asset grid, so just log for now
        if (!grid) {
            console.log("ℹ️ Asset grid not found - assets are managed in output area only");
            return;
        }
        
        if (this.assets.size === 0) {
            grid.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">🎨</div>
                    <div class="empty-state-text">No assets yet</div>
                    <div class="empty-state-subtext">Generate your first asset to get started!</div>
                </div>
            `;
            return;
        }

        const assetArray = Array.from(this.assets.values())
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        grid.innerHTML = assetArray.map(asset => `
            <div class="asset-card" onclick="mingleStudio.addAssetToDocument('${asset.id}')">
                <div class="asset-thumbnail">${asset.thumbnail}</div>
                <div class="asset-info">
                    <div class="asset-name">${asset.name}</div>
                    <div class="asset-type">${asset.type}</div>
                </div>
            </div>
        `).join('');
    }

    filterAssets() {
        const searchTerm = document.getElementById('searchAssets').value.toLowerCase();
        const filterType = document.getElementById('filterAssets').value;

        let filteredAssets = Array.from(this.assets.values());

        // Apply text search
        if (searchTerm) {
            filteredAssets = filteredAssets.filter(asset => 
                asset.name.toLowerCase().includes(searchTerm) ||
                asset.prompt.toLowerCase().includes(searchTerm)
            );
        }

        // Apply type filter
        if (filterType && filterType !== 'all') {
            filteredAssets = filteredAssets.filter(asset => asset.type === filterType);
        }

        // Update grid with filtered results
        const grid = document.getElementById('assetGrid');
        
        if (filteredAssets.length === 0) {
            grid.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">🔍</div>
                    <div class="empty-state-text">No assets found</div>
                    <div class="empty-state-subtext">Try adjusting your search or filters</div>
                </div>
            `;
            return;
        }

        filteredAssets.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        grid.innerHTML = filteredAssets.map(asset => `
            <div class="asset-card" onclick="mingleStudio.addAssetToDocument('${asset.id}')">
                <div class="asset-thumbnail">${asset.thumbnail}</div>
                <div class="asset-info">
                    <div class="asset-name">${asset.name}</div>
                    <div class="asset-type">${asset.type}</div>
                </div>
            </div>
        `).join('');
    }

    async addAssetToDocument(assetId) {
        try {
            const asset = this.assets.get(assetId);
            if (!asset) return;

            console.log("📋 Adding asset to document:", asset.name);
            
            const config = {
                prompt: asset.prompt,
                style: asset.style,
                type: asset.type
            };

            await this.createAssetInExpress(config);
            this.showToast(`Added "${asset.name}" to document! 📄`, "success");

        } catch (error) {
            console.error('Failed to add asset to document:', error);
            this.showToast("Failed to add asset to document", "error");
        }
    }

    getThumbnailForType(type) {
        const thumbnails = {
            image: '🖼️',
            icon: '🎯',
            layout: '📐',
            logo: '🏷️'
        };
        return thumbnails[type] || '🎨';
    }

    showToast(message, type = 'success') {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        // Get appropriate icon for toast type
        const icons = {
            'success': '✅',
            'error': '❌',
            'warning': '⚠️',
            'info': 'ℹ️'
        };
        
        const icon = icons[type] || '✅';
        
        toast.innerHTML = `
            <span>${icon}</span>
            <span>${message}</span>
        `;
        
        container.appendChild(toast);
        
        // Auto remove after different durations based on type
        const duration = type === 'error' ? 5000 : type === 'warning' ? 4000 : 3000;
        
        setTimeout(() => {
            if (toast.parentNode) {
                container.removeChild(toast);
            }
        }, duration);
    }

    saveToStorage() {
        try {
            const data = {
                assets: Array.from(this.assets.entries())
            };
            localStorage.setItem('mingleAssetStudio', JSON.stringify(data));
        } catch (error) {
            console.error('Failed to save to storage:', error);
        }
    }

    loadFromStorage() {
        try {
            const data = localStorage.getItem('mingleAssetStudio');
            if (data) {
                const parsed = JSON.parse(data);
                this.assets = new Map(parsed.assets || []);
            }
        } catch (error) {
            console.error('Failed to load from storage:', error);
        }
    }

    // Development helper: Test Local Models connection
    async testLocalModelsConnection() {
        console.log('🎨 Testing Local Models connection...');
        
        try {
            this.showToast('🎨 Testing Free Local Models...', 'info');
            
            // Test the connection itself
            const connectionTest = await this.localModelsService.testConnection();
            
            if (connectionTest.success) {
                console.log('✅ Local Models service is working!');
                this.showToast('✅ Free Local Models working!', 'success');
                
                // Now test image generation
                const testConfig = {
                    prompt: 'a simple blue circle',
                    style: 'minimalist',
                    type: 'icon',
                    aspectRatio: '1:1'
                };
                
                const result = await this.localModelsService.generateImage(testConfig);
                
                if (result.success) {
                    console.log('✅ Local Models test successful!', result);
                    this.showToast(`✅ Free models work! Using: ${result.model}`, 'success');
                } else {
                    console.log('⚠️ Local Models generation failed');
                    this.showToast('⚠️ Generation test failed', 'warning');
                }
            } else {
                console.log('❌ Local Models service failed:', connectionTest.error);
                this.showToast('❌ Local Models test failed', 'error');
            }
            
        } catch (error) {
            console.error('❌ Local Models test error:', error);
            this.showToast(`❌ Local Models Error: ${error.message}`, 'error');
        }
    }

    // Development helper: Test both AI connections
    async testHuggingFaceConnection() {
        console.log('🧪 Testing Hugging Face connection...');
        
        const testConfig = {
            prompt: 'a simple red circle',
            style: 'minimalist',
            type: 'icon',
            aspectRatio: '1:1'
        };
        
        try {
            this.showToast('🧪 Testing HF API connection...', 'info');
            
            // First test the API connection itself
            const connectionTest = await this.huggingFaceService.testConnection();
            
            if (connectionTest.success) {
                console.log('✅ Hugging Face API connection successful!');
                this.showToast('✅ HF API connected successfully!', 'success');
                
                // Now test image generation
                const result = await this.huggingFaceService.generateImage(testConfig);
                
                if (result.success) {
                    if (result.metadata.fallback) {
                        console.log('⚠️ HF API test completed with fallback');
                        this.showToast('HF API unavailable - fallback working!', 'warning');
                    } else {
                        console.log('✅ Hugging Face test successful!', result);
                        this.showToast(`✅ HF API works! Model: ${result.model.split('/').pop()}`, 'success');
                    }
                } else {
                    console.log('⚠️ HF image generation failed, but API is connected');
                    this.showToast('⚠️ API connected but image generation failed', 'warning');
                }
            } else {
                console.log('❌ Hugging Face API connection failed:', connectionTest.error);
                this.showToast('❌ HF API connection failed', 'error');
            }
            
        } catch (error) {
            console.error('❌ Hugging Face test error:', error);
            this.showToast(`❌ HF Error: ${error.message}`, 'error');
        }
    }

    async testGeminiConnection() {
        console.log('🧪 Testing Gemini connection...');
        
        try {
            this.showToast('🧪 Testing Gemini API connection...', 'info');
            
            // Test simple API connectivity first
            const testResult = await this.geminiService.testConnection();
            
            if (testResult.success) {
                console.log('✅ Gemini API connection successful!');
                this.showToast('✅ Gemini API connected successfully!', 'success');
                
                // Now test image generation
                const testConfig = {
                    prompt: 'a simple blue circle',
                    style: 'minimalist',
                    type: 'icon',
                    aspectRatio: '1:1'
                };
                
                const result = await this.geminiService.generateImage(testConfig);
                
                if (result.success) {
                    console.log('✅ Gemini image generation test successful!', result);
                    this.showToast('✅ Gemini image generation working!', 'success');
                } else {
                    console.log('⚠️ Gemini image generation failed, but API is connected');
                    this.showToast('⚠️ API connected but image generation failed', 'warning');
                }
            } else {
                console.log('❌ Gemini API connection failed:', testResult.error);
                this.showToast('❌ Gemini API connection failed', 'error');
            }
            
        } catch (error) {
            console.error('❌ Gemini test error:', error);
            this.showToast(`❌ Gemini test failed: ${error.message}`, 'error');
        }
    }

    // Development helper: Test Freepik connection
    async testFreepikConnection() {
        console.log('🧪 Testing Freepik connection...');
        
        try {
            this.showToast('🧪 Testing Freepik API connection...', 'info');
            
            // Test simple API connectivity first
            const testResult = await this.freepikService.testConnection();
            
            if (testResult.success) {
                console.log('✅ Freepik API connection successful!');
                this.showToast('✅ Freepik API connected successfully!', 'success');
                
                // Now test image generation
                const testConfig = {
                    prompt: 'a simple blue circle',
                    style: 'minimalist',
                    type: 'icon',
                    aspectRatio: '1:1'
                };
                
                const result = await this.freepikService.generateImage(testConfig);
                
                if (result.success) {
                    if (result.metadata.fallback) {
                        console.log('⚠️ Freepik API test completed with fallback');
                        this.showToast('Freepik API unavailable - fallback working!', 'warning');
                    } else {
                        console.log('✅ Freepik image generation test successful!', result);
                        this.showToast('✅ Freepik ultra-realistic generation working!', 'success');
                    }
                } else {
                    console.log('⚠️ Freepik image generation failed, but API is connected');
                    this.showToast('⚠️ API connected but image generation failed', 'warning');
                }
            } else {
                console.log('❌ Freepik API connection failed:', testResult.error);
                this.showToast('❌ Freepik API connection failed', 'error');
            }
            
        } catch (error) {
            console.error('❌ Freepik test error:', error);
            this.showToast(`❌ Freepik test failed: ${error.message}`, 'error');
        }
    }

    // Development helper: Test Canvas Integration
    async testCanvasIntegration() {
        console.log('📄 Testing Adobe Express Canvas Integration...');
        
        try {
            this.showToast('📄 Testing canvas integration...', 'info');
            
            // Check if sandbox proxy is available
            if (!this.sandboxProxy) {
                console.log('❌ Sandbox proxy not available');
                this.showToast('❌ Not connected to Adobe Express - open in Express first', 'error');
                return;
            }
            
            console.log('✅ Sandbox proxy available, methods:', Object.keys(this.sandboxProxy));
            
            // Generate a simple test image using our free service to avoid CORS issues
            console.log('🎨 Generating test image using free service...');
            const testConfig = {
                prompt: 'simple test image for canvas integration',
                style: 'modern',
                type: 'image',
                aspectRatio: '1:1'
            };
            
            const imageResult = await this.localModelsService.generateImage(testConfig);
            
            if (!imageResult.success) {
                throw new Error('Failed to generate test image');
            }
            
            const testImageData = {
                id: 'test-canvas-' + Date.now(),
                url: imageResult.imageUrl, // This should be a data URL
                prompt: testConfig.prompt,
                style: testConfig.style,
                type: testConfig.type
            };
            
            console.log('🔧 Testing with generated image (data URL):', testImageData.url.substring(0, 50) + '...');
            
            // Try to add the test image to the document
            await this.addImageToDocument(testImageData);
            
            console.log('✅ Canvas integration test completed!');
            this.showToast('✅ Canvas integration test completed!', 'success');
            
        } catch (error) {
            console.error('❌ Canvas integration test failed:', error);
            console.error('❌ Error details:', error.stack);
            
            // Provide specific guidance based on error
            let errorMessage = 'Canvas integration test failed';
            if (error.message.includes('Sandbox proxy not available')) {
                errorMessage = 'Open this add-on in Adobe Express first';
            } else if (error.message.includes('CORS')) {
                errorMessage = 'Image loading blocked by CORS policy';
            } else if (error.message.includes('network')) {
                errorMessage = 'Network error during test';
            } else if (error.message.includes('Failed to generate test image')) {
                errorMessage = 'Could not generate test image';
            }
            
            this.showToast(`❌ ${errorMessage}`, 'error');
        }
    }

    // Switch between AI providers
    switchProvider(provider) {
        const validProviders = ['huggingface', 'gemini', 'freepik', 'local', 'all'];
        if (validProviders.includes(provider)) {
            this.currentProvider = provider;
            console.log(`🔄 Switched to ${provider} provider`);
            this.showToast(`Now using ${provider} for generation`, 'info');
        } else {
            console.error('❌ Invalid provider:', provider);
            this.showToast('Invalid provider specified', 'error');
        }
    }

    // Comprehensive API diagnosis
    async diagnoseAllAPIs() {
        console.log('🔧 Running comprehensive API diagnosis...');
        
        const diagnosis = {
            local: { configured: true, connected: false, error: null },
            huggingface: { configured: false, connected: false, error: null },
            gemini: { configured: false, connected: false, error: null },
            freepik: { configured: false, connected: false, error: null }
        };

        // Check Local Models (always available)
        try {
            const testResult = await this.localModelsService.testConnection();
            diagnosis.local.connected = testResult.success;
            if (!testResult.success) {
                diagnosis.local.error = testResult.error;
            }
        } catch (error) {
            diagnosis.local.error = error.message;
        }

        // Check HuggingFace
        try {
            const hfKey = this.getHuggingFaceApiKey();
            diagnosis.huggingface.configured = hfKey && hfKey !== 'YOUR_HUGGINGFACE_API_KEY_HERE' && hfKey.startsWith('hf_');
            
            if (diagnosis.huggingface.configured) {
                const testResult = await this.huggingFaceService.testConnection();
                diagnosis.huggingface.connected = testResult.success;
                if (!testResult.success) {
                    diagnosis.huggingface.error = testResult.error;
                }
            } else {
                if (!hfKey || hfKey === 'YOUR_HUGGINGFACE_API_KEY_HERE') {
                    diagnosis.huggingface.error = 'API key not configured - using placeholder';
                } else if (!hfKey.startsWith('hf_')) {
                    diagnosis.huggingface.error = 'Invalid API key format - must start with "hf_"';
                } else {
                    diagnosis.huggingface.error = 'API key configuration issue';
                }
            }
        } catch (error) {
            diagnosis.huggingface.error = error.message;
        }

        // Check Gemini
        try {
            const geminiKey = this.getGeminiApiKey();
            diagnosis.gemini.configured = geminiKey && 
                geminiKey !== 'YOUR_GEMINI_API_KEY_HERE' && 
                geminiKey !== 'DEMO_KEY_NEEDS_REPLACEMENT' && 
                geminiKey.startsWith('AIza');
            
            if (diagnosis.gemini.configured) {
                const testResult = await this.geminiService.testConnection();
                diagnosis.gemini.connected = testResult.success;
                if (!testResult.success) {
                    diagnosis.gemini.error = testResult.error;
                }
            } else {
                if (!geminiKey || geminiKey === 'YOUR_GEMINI_API_KEY_HERE' || geminiKey === 'DEMO_KEY_NEEDS_REPLACEMENT') {
                    diagnosis.gemini.error = 'NOT CONFIGURED';
                } else if (!geminiKey.startsWith('AIza')) {
                    diagnosis.gemini.error = 'Invalid API key format - must start with "AIza"';
                } else {
                    diagnosis.gemini.error = 'API key configuration issue';
                }
            }
        } catch (error) {
            diagnosis.gemini.error = error.message;
        }

        // Check Freepik
        try {
            const freepikKey = this.getFreepikApiKey();
            diagnosis.freepik.configured = freepikKey && 
                freepikKey !== 'YOUR_FREEPIK_API_KEY_HERE' && 
                freepikKey !== 'DEMO_KEY_NEEDS_REPLACEMENT' &&
                freepikKey.startsWith('FPSX');
            
            if (diagnosis.freepik.configured) {
                const testResult = await this.freepikService.testConnection();
                diagnosis.freepik.connected = testResult.success;
                if (!testResult.success) {
                    diagnosis.freepik.error = testResult.error;
                }
            } else {
                if (!freepikKey || freepikKey === 'YOUR_FREEPIK_API_KEY_HERE' || freepikKey === 'DEMO_KEY_NEEDS_REPLACEMENT') {
                    diagnosis.freepik.error = 'NOT CONFIGURED';
                } else if (!freepikKey.startsWith('FPSX')) {
                    diagnosis.freepik.error = 'Invalid API key format - must start with "FPSX"';
                } else {
                    diagnosis.freepik.error = 'API key configuration issue';
                }
            }
        } catch (error) {
            diagnosis.freepik.error = error.message;
        }

        // Report results
        console.log('📊 API Diagnosis Results:', diagnosis);
        
        // Log specific instructions for each failed API
        Object.keys(diagnosis).forEach(apiName => {
            const api = diagnosis[apiName];
            if (!api.connected) {
                console.group(`❌ ${apiName.toUpperCase()} API Issues:`);
                console.log('Status:', api.configured ? 'Configured but not working' : 'Not configured');
                console.log('Error:', api.error);
                
                if (apiName === 'huggingface') {
                    console.log('🔧 TO FIX:');
                    console.log('1. Go to: https://huggingface.co/settings/tokens');
                    console.log('2. Create new token with "Read" permissions');
                    console.log('3. Replace API key in getHuggingFaceApiKey() method');
                    console.log('4. Key must start with "hf_"');
                } else if (apiName === 'gemini') {
                    console.log('🔧 TO FIX:');
                    console.log('1. Go to: https://aistudio.google.com/app/apikey');
                    console.log('2. Create new API key');
                    console.log('3. Replace "YOUR_GEMINI_API_KEY_HERE" in getGeminiApiKey() method');
                    console.log('4. Key must start with "AIza"');
                } else if (apiName === 'freepik') {
                    console.log('🔧 TO FIX:');
                    console.log('1. Check your Freepik API key at: https://freepik.com/api');
                    console.log('2. Update in getFreepikApiKey() method if needed');
                }
                console.groupEnd();
            }
        });
        
        const workingAPIs = Object.keys(diagnosis).filter(api => diagnosis[api].connected);
        const configuredAPIs = Object.keys(diagnosis).filter(api => diagnosis[api].configured);
        
        let message = `API Status: ${workingAPIs.length}/4 working`;
        
        // Add specific error info for failed APIs
        const failedAPIs = Object.keys(diagnosis).filter(api => !diagnosis[api].connected);
        if (failedAPIs.length > 0) {
            const criticalErrors = failedAPIs.map(api => {
                const error = diagnosis[api].error;
                if (api === 'local') return null; // Don't show local errors as critical
                if (error && error.includes('Invalid')) {
                    return `${api}: INVALID KEY`;
                } else if (error && error.includes('not configured')) {
                    return `${api}: NOT CONFIGURED`;
                } else {
                    return `${api}: ERROR`;
                }
            }).filter(Boolean);
            
            if (criticalErrors.length > 0) {
                message += `\nIssues: ${criticalErrors.join(', ')}`;
            }
        }
        
        console.log(message);
        
        // Use success if local models work (always free option available)
        const hasWorkingFreeOption = diagnosis.local.connected;
        
        // API status notifications are hidden - information is available in console
        // Uncomment below if you want to see API status notifications:
        /*
        if (hasWorkingFreeOption) {
            this.showToast(message + '\n✅ Free local models available!', 'success');
        } else if (workingAPIs.length === 0) {
            this.showToast('⚠️ No APIs working! Check console for setup guide.', 'error');
        } else {
            this.showToast(message + '\nCheck console for details.', 'warning');
        }
        */
        
        return diagnosis;
    }
}

// Initialize the application when DOM is ready
console.log("🔧 DEBUG: Creating MingleAssetStudio instance");
const mingleStudio = new MingleAssetStudio();

// Add error handling for SDK initialization
try {
    console.log("🔄 Waiting for Adobe Express SDK to be ready...");
    
    if (typeof addOnUISdk === 'undefined') {
        console.error("❌ addOnUISdk is undefined");
        window.debugInfo.errors.push('addOnUISdk is undefined');
    } else {
        console.log("✅ addOnUISdk is available");
        window.debugInfo.sdkLoaded = true;
    }
    
    addOnUISdk.ready.then(() => {
        console.log("✅ Adobe Express SDK is ready!");
        mingleStudio.init();
    }).catch((error) => {
        console.error("❌ Adobe Express SDK failed to initialize:", error);
        window.debugInfo.errors.push('SDK ready failed: ' + error.message);
        
        // Try to initialize anyway for testing
        console.log("🔄 Attempting fallback initialization...");
        mingleStudio.init();
    });
    
} catch (error) {
    console.error("❌ Failed to initialize SDK:", error);
    window.debugInfo.errors.push('SDK init error: ' + error.message);
    
    // Try to initialize anyway
    console.log("🔄 Attempting emergency initialization...");
    setTimeout(() => {
        mingleStudio.init();
    }, 1000);
}

// Make it globally available for onclick handlers
window.mingleStudio = mingleStudio;

console.log("🔧 DEBUG: Script execution complete");
console.log("🔧 DEBUG: Check window.debugInfo for troubleshooting");
