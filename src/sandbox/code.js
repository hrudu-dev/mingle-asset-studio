import addOnSandboxSdk from "add-on-sdk-document-sandbox";
import { editor } from "express-document-sdk";

// Get the document sandbox runtime.
const { runtime } = addOnSandboxSdk.instance;

function start() {
    // APIs to be exposed to the UI runtime
    const sandboxApi = {
        // Legacy rectangle creation for compatibility
        createRectangle: () => {
            const rectangle = editor.createRectangle();
            rectangle.width = 240;
            rectangle.height = 180;
            rectangle.translation = { x: 10, y: 10 };
            
            const color = { red: 0.32, green: 0.34, blue: 0.89, alpha: 1 };
            const rectangleFill = editor.makeColorFill(color);
            rectangle.fill = rectangleFill;
            
            const insertionParent = editor.context.insertionParent;
            insertionParent.children.append(rectangle);
        },

        // Enhanced asset creation methods
        createImageAsset: async (config) => {
            return await createVisualAsset(config, 'image');
        },

        createIconAsset: async (config) => {
            return await createVisualAsset(config, 'icon');
        },

        createLayoutAsset: async (config) => {
            return await createLayoutStructure(config);
        },

        createLogoAsset: async (config) => {
            return await createLogoDesign(config);
        },

        createGenericAsset: async (config) => {
            return await createVisualAsset(config, 'generic');
        },

        // Asset management
        addAssetToDocument: (asset) => {
            return addExistingAssetToDocument(asset);
        },

        // Context analysis
        getDocumentContext: () => {
            return analyzeDocumentContext();
        },

        // Quality assessment
        assessAssetQuality: (asset) => {
            return performQualityAssessment(asset);
        }
    };

    // Helper functions for asset creation
    async function createVisualAsset(config, type) {
        try {
            const { prompt, style = 'modern', imageUrl } = config;
            
            console.log(`🎨 Creating ${type} asset with config:`, { prompt, style, hasImage: !!imageUrl });
            
            // If we have a generated image URL, use it
            if (imageUrl) {
                return await createImageFromUrl(config, type);
            }
            
            // Otherwise create a placeholder
            switch (type) {
                case 'image':
                    return createImagePlaceholder(config);
                case 'icon':
                    return createIconPlaceholder(config);
                default:
                    return createGenericPlaceholder(config);
            }
        } catch (error) {
            console.error(`Failed to create ${type} asset:`, error);
            throw error;
        }
    }

    async function createImageFromUrl(config, type) {
        try {
            const { imageUrl, prompt, style, aspectRatio = '1:1' } = config;
            
            console.log('🖼️ Creating actual image from URL for type:', type);
            console.log('🔧 Image URL:', imageUrl);
            console.log('🔧 URL domain:', new URL(imageUrl).hostname);
            
            let lastError = null;
            try {
                let imageBlob;
                if (imageUrl.startsWith('data:')) {
                    // Convert data URL to blob
                    console.log('🔧 Converting data URL to blob...');
                    const response = await fetch(imageUrl);
                    imageBlob = await response.blob();
                } else {
                    // External URL - handle CORS issues
                    console.log('🔧 Fetching external image with CORS handling...');
                    try {
                        // Try direct fetch first
                        const response = await fetch(imageUrl, {
                            mode: 'cors',
                            credentials: 'omit'
                        });
                        
                        if (!response.ok) {
                            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                        }
                        
                        imageBlob = await response.blob();
                        console.log('✅ Direct fetch successful, blob size:', imageBlob.size);
                    } catch (corsError) {
                        console.warn('⚠️ CORS fetch failed, trying proxy method:', corsError.message);
                        
                        // Fallback: Try to convert to data URL via proxy
                        try {
                            const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(imageUrl)}`;
                            const response = await fetch(proxyUrl);
                            imageBlob = await response.blob();
                            console.log('✅ Proxy fetch successful, blob size:', imageBlob.size);
                        } catch (proxyError) {
                            console.error('❌ Both direct and proxy fetch failed:', proxyError);
                            throw new Error(`Failed to fetch image: ${corsError.message}`);
                        }
                    }
                }
                console.log('🔧 Creating image from blob, size:', imageBlob.size);
                console.log('🔧 Available editor methods:', Object.getOwnPropertyNames(editor).filter(name => typeof editor[name] === 'function'));
                // Try all possible image creation methods
                let imageElement = null;
                let methodTried = null;
                const tryMethods = [
                    { name: 'createImage', fn: editor.createImage },
                    { name: 'createImageFromBlob', fn: editor.createImageFromBlob },
                    { name: 'createBitmapImage', fn: editor.createBitmapImage }
                ];
                for (const method of tryMethods) {
                    if (typeof method.fn === 'function') {
                        try {
                            console.log(`🔧 Trying ${method.name}...`);
                            imageElement = await method.fn.call(editor, imageBlob);
                            methodTried = method.name;
                            break;
                        } catch (err) {
                            lastError = err;
                            console.warn(`⚠️ ${method.name} failed:`, err);
                        }
                    }
                }
                if (!imageElement) {
                    throw new Error('No image creation method succeeded. Last error: ' + (lastError ? lastError.message : 'unknown'));
                }
                // Set dimensions based on aspect ratio and type
                const dimensions = getAssetDimensions(type, aspectRatio);
                imageElement.width = dimensions.width;
                imageElement.height = dimensions.height;
                imageElement.translation = { x: 20, y: 20 };
                // Add to document
                const insertionParent = editor.context.insertionParent;
                insertionParent.children.append(imageElement);
                // Add a label for context
                const label = editor.createText();
                label.text = `Generated: "${prompt.substring(0, 30)}..."`;
                label.translation = { x: 20, y: dimensions.height + 40 };
                label.fontSize = 12;
                const labelColor = { red: 0.2, green: 0.2, blue: 0.2, alpha: 1 };
                const labelFill = editor.makeColorFill(labelColor);
                label.fill = labelFill;
                insertionParent.children.append(label);
                console.log('✅ Real generated image successfully added to document using', methodTried);
                return { 
                    success: true, 
                    type: type, 
                    elements: [imageElement, label],
                    imageUrl: imageUrl,
                    isRealImage: true,
                    methodTried,
                    lastError: null
                };
            } catch (imageError) {
                lastError = imageError;
                console.warn('⚠️ Failed to create real image, using styled placeholder:', imageError);
                // Fallback to a more sophisticated placeholder that represents the actual content
                const dimensions = getAssetDimensions(type, aspectRatio);
                // Create main rectangle to represent the image
                const imageRect = editor.createRectangle();
                imageRect.width = dimensions.width;
                imageRect.height = dimensions.height;
                imageRect.translation = { x: 20, y: 20 };
                // Use style-based colors
                const styleColors = getStyleColors(style);
                const imageFill = editor.makeColorFill(styleColors.primary);
                imageRect.fill = imageFill;
                // Add generated image indicator
                const indicator = editor.createRectangle();
                indicator.width = 120;
                indicator.height = 30;
                indicator.translation = { x: 25, y: 25 };
                indicator.fill = editor.makeColorFill(styleColors.accent);
                // Add text overlay
                const label = editor.createText();
                label.text = `⚠️ AI Image Insert Failed`;
                label.translation = { x: 30, y: 35 };
                label.fontSize = 12;
                const labelColor = { red: 1, green: 1, blue: 1, alpha: 1 };
                const labelFill = editor.makeColorFill(labelColor);
                label.fill = labelFill;
                // Add prompt text
                const promptLabel = editor.createText();
                promptLabel.text = `"${prompt.substring(0, 40)}..."`;
                promptLabel.translation = { x: 25, y: dimensions.height + 30 };
                promptLabel.fontSize = 11;
                const promptColor = { red: 0.4, green: 0.4, blue: 0.4, alpha: 1 };
                const promptFill = editor.makeColorFill(promptColor);
                promptLabel.fill = promptFill;
                // Add error message
                const errorLabel = editor.createText();
                errorLabel.text = lastError ? `Error: ${lastError.message}` : 'Unknown error';
                errorLabel.translation = { x: 25, y: dimensions.height + 50 };
                errorLabel.fontSize = 10;
                errorLabel.fill = labelFill;
                // Add all elements to document
                const insertionParent = editor.context.insertionParent;
                insertionParent.children.append(imageRect);
                insertionParent.children.append(indicator);
                insertionParent.children.append(label);
                insertionParent.children.append(promptLabel);
                insertionParent.children.append(errorLabel);
                console.log('✅ Generated image placeholder with error message added to document');
                return { 
                    success: true, 
                    type: type, 
                    elements: [imageRect, indicator, label, promptLabel, errorLabel],
                    imageUrl: imageUrl,
                    isRealImage: false,
                    lastError: lastError ? lastError.message : null
                };
            }
        } catch (error) {
            console.error('❌ Failed to create image from URL:', error);
            // Final fallback to basic placeholder
            return createImagePlaceholder(config);
        }
    }

    function getAssetDimensions(type, aspectRatio) {
        const baseDimensions = {
            'image': { width: 400, height: 300 },
            'icon': { width: 64, height: 64 },
            'logo': { width: 200, height: 100 },
            'layout': { width: 600, height: 400 }
        };
        
        let base = baseDimensions[type] || baseDimensions['image'];
        
        // Adjust for aspect ratio
        if (aspectRatio === '16:9') {
            base.height = Math.round(base.width * 9 / 16);
        } else if (aspectRatio === '9:16') {
            base.width = Math.round(base.height * 9 / 16);
        } else if (aspectRatio === '1:1') {
            base.height = base.width;
        }
        
        return base;
    }

    function createImagePlaceholder(config) {
        const { prompt, style } = config;
        
        // Create a rectangle to represent the generated image
        const imageRect = editor.createRectangle();
        imageRect.width = 400;
        imageRect.height = 300;
        imageRect.translation = { x: 20, y: 20 };
        
        // Apply style-based colors
        const styleColors = getStyleColors(style);
        const imageFill = editor.makeColorFill(styleColors.primary);
        imageRect.fill = imageFill;
        
        // Add a text label
        const label = editor.createText();
        label.text = `AI Generated Image\n"${prompt.substring(0, 30)}..."`;
        label.translation = { x: 30, y: 30 };
        
        const insertionParent = editor.context.insertionParent;
        insertionParent.children.append(imageRect);
        insertionParent.children.append(label);
        
        return { success: true, type: 'image', elements: [imageRect, label] };
    }

    function createIconPlaceholder(config) {
        const { prompt, style } = config;
        
        // Create a smaller square for icon
        const iconRect = editor.createRectangle();
        iconRect.width = 64;
        iconRect.height = 64;
        iconRect.translation = { x: 50, y: 50 };
        
        const styleColors = getStyleColors(style);
        const iconFill = editor.makeColorFill(styleColors.accent);
        iconRect.fill = iconFill;
        
        // Add icon label
        const label = editor.createText();
        label.text = `Icon: ${prompt.split(' ')[0]}`;
        label.translation = { x: 50, y: 120 };
        
        const insertionParent = editor.context.insertionParent;
        insertionParent.children.append(iconRect);
        insertionParent.children.append(label);
        
        return { success: true, type: 'icon', elements: [iconRect, label] };
    }

    function createLayoutStructure(config) {
        const { prompt, style } = config;
        
        // Create a layout structure with multiple elements
        const elements = [];
        const styleColors = getStyleColors(style);
        
        // Header section
        const header = editor.createRectangle();
        header.width = 600;
        header.height = 80;
        header.translation = { x: 20, y: 20 };
        header.fill = editor.makeColorFill(styleColors.primary);
        elements.push(header);
        
        // Content sections
        for (let i = 0; i < 3; i++) {
            const section = editor.createRectangle();
            section.width = 180;
            section.height = 120;
            section.translation = { x: 20 + (i * 200), y: 120 };
            section.fill = editor.makeColorFill(styleColors.secondary);
            elements.push(section);
        }
        
        // Add layout label
        const label = editor.createText();
        label.text = `AI Layout: ${prompt.substring(0, 40)}...`;
        label.translation = { x: 20, y: 260 };
        elements.push(label);
        
        const insertionParent = editor.context.insertionParent;
        elements.forEach(element => insertionParent.children.append(element));
        
        return { success: true, type: 'layout', elements };
    }

    function createLogoDesign(config) {
        const { prompt, style } = config;
        
        // Create a logo-like design with shapes and text
        const elements = [];
        const styleColors = getStyleColors(style);
        
        // Logo symbol (circle)
        const symbol = editor.createEllipse();
        symbol.width = 80;
        symbol.height = 80;
        symbol.translation = { x: 50, y: 50 };
        symbol.fill = editor.makeColorFill(styleColors.primary);
        elements.push(symbol);
        
        // Logo text
        const logoText = editor.createText();
        logoText.text = extractBrandNameFromPrompt(prompt);
        logoText.translation = { x: 140, y: 70 };
        elements.push(logoText);
        
        // Subtitle
        const subtitle = editor.createText();
        subtitle.text = `${style} style logo`;
        subtitle.translation = { x: 140, y: 100 };
        elements.push(subtitle);
        
        const insertionParent = editor.context.insertionParent;
        elements.forEach(element => insertionParent.children.append(element));
        
        return { success: true, type: 'logo', elements };
    }

    function getStyleColors(style) {
        const colorSchemes = {
            'colourful': {
                primary: { red: 0.96, green: 0.62, blue: 0.04, alpha: 1 }, // Orange
                secondary: { red: 0.98, green: 0.75, blue: 0.14, alpha: 1 },
                accent: { red: 0.92, green: 0.40, blue: 0.13, alpha: 1 }
            },
            'cyberpunk': {
                primary: { red: 0.49, green: 0.23, blue: 0.93, alpha: 1 }, // Purple
                secondary: { red: 0.88, green: 0.91, blue: 1.0, alpha: 1 },
                accent: { red: 0.77, green: 0.71, blue: 0.99, alpha: 1 }
            },
            'real': {
                primary: { red: 0.22, green: 0.25, blue: 0.32, alpha: 1 }, // Gray
                secondary: { red: 0.98, green: 0.98, blue: 0.98, alpha: 1 },
                accent: { red: 0.61, green: 0.64, blue: 0.69, alpha: 1 }
            },
            'modern': {
                primary: { red: 0.31, green: 0.28, blue: 0.90, alpha: 1 }, // Blue
                secondary: { red: 0.51, green: 0.55, blue: 0.97, alpha: 1 },
                accent: { red: 1.0, green: 1.0, blue: 1.0, alpha: 1 }
            },
            'minimalist': {
                primary: { red: 0.97, green: 0.98, blue: 0.99, alpha: 1 }, // Light gray
                secondary: { red: 0.12, green: 0.16, blue: 0.22, alpha: 1 },
                accent: { red: 0.42, green: 0.45, blue: 0.50, alpha: 1 }
            }
        };
        
        return colorSchemes[style] || colorSchemes['modern'];
    }

    function extractBrandNameFromPrompt(prompt) {
        // Extract potential brand name from prompt
        const words = prompt.split(' ');
        // Take first 1-2 meaningful words
        const brandWords = words.slice(0, 2).filter(word => 
            word.length > 2 && !['logo', 'for', 'the', 'and', 'a', 'an'].includes(word.toLowerCase())
        );
        return brandWords.join(' ') || 'Brand Logo';
    }

    function createGenericPlaceholder(config) {
        const { prompt, style } = config;
        
        // Create a simple placeholder
        const placeholder = editor.createRectangle();
        placeholder.width = 200;
        placeholder.height = 150;
        placeholder.translation = { x: 30, y: 30 };
        
        const styleColors = getStyleColors(style);
        placeholder.fill = editor.makeColorFill(styleColors.primary);
        
        const label = editor.createText();
        label.text = `Generated Asset\n"${prompt.substring(0, 20)}..."`;
        label.translation = { x: 40, y: 40 };
        
        const insertionParent = editor.context.insertionParent;
        insertionParent.children.append(placeholder);
        insertionParent.children.append(label);
        
        return { success: true, type: 'generic', elements: [placeholder, label] };
    }

    function addExistingAssetToDocument(asset) {
        try {
            // Recreate the asset based on its stored configuration
            const config = {
                prompt: asset.prompt,
                style: asset.style,
                type: asset.type
            };
            
            return createVisualAsset(config, asset.type);
        } catch (error) {
            console.error('Failed to add asset to document:', error);
            throw error;
        }
    }

    function analyzeDocumentContext() {
        try {
            const context = editor.context;
            
            return {
                documentSize: {
                    width: context.documentWidth || 800,
                    height: context.documentHeight || 600
                },
                elementCount: context.insertionParent?.children?.length || 0,
                documentType: detectDocumentType(context),
                recommendedFormats: getRecommendedFormats(context),
                colorScheme: extractColorScheme(context)
            };
        } catch (error) {
            console.error('Failed to analyze document context:', error);
            return {
                documentSize: { width: 800, height: 600 },
                elementCount: 0,
                documentType: 'unknown',
                recommendedFormats: ['image', 'icon'],
                colorScheme: ['#6366f1', '#8b5cf6']
            };
        }
    }

    function performQualityAssessment(asset) {
        // Simulate quality assessment
        return {
            resolution: 'high',
            brandCompliance: 'compliant',
            overallRating: Math.random() * 2 + 3, // 3-5 stars
            suggestions: [
                'Consider increasing contrast for better accessibility',
                'Asset follows brand guidelines well',
                'High resolution suitable for print and digital use'
            ]
        };
    }

    // Utility functions
    function getStyleColors(style) {
        const styleMap = {
            modern: {
                primary: { red: 0.39, green: 0.4, blue: 0.95, alpha: 1 },
                secondary: { red: 0.55, green: 0.36, blue: 0.97, alpha: 1 },
                accent: { red: 0.16, green: 0.73, blue: 0.51, alpha: 1 }
            },
            minimalist: {
                primary: { red: 0.1, green: 0.1, blue: 0.1, alpha: 1 },
                secondary: { red: 0.9, green: 0.9, blue: 0.9, alpha: 1 },
                accent: { red: 0.6, green: 0.6, blue: 0.6, alpha: 1 }
            },
            vintage: {
                primary: { red: 0.7, green: 0.4, blue: 0.2, alpha: 1 },
                secondary: { red: 0.9, green: 0.8, blue: 0.6, alpha: 1 },
                accent: { red: 0.5, green: 0.3, blue: 0.1, alpha: 1 }
            },
            bold: {
                primary: { red: 1, green: 0.2, blue: 0.3, alpha: 1 },
                secondary: { red: 1, green: 0.6, blue: 0.1, alpha: 1 },
                accent: { red: 0.9, green: 0.1, blue: 0.5, alpha: 1 }
            },
            elegant: {
                primary: { red: 0.2, green: 0.2, blue: 0.4, alpha: 1 },
                secondary: { red: 0.8, green: 0.7, blue: 0.9, alpha: 1 },
                accent: { red: 0.6, green: 0.5, blue: 0.8, alpha: 1 }
            },
            playful: {
                primary: { red: 1, green: 0.7, blue: 0.8, alpha: 1 },
                secondary: { red: 0.7, green: 0.9, blue: 1, alpha: 1 },
                accent: { red: 0.9, green: 1, blue: 0.7, alpha: 1 }
            }
        };
        
        return styleMap[style] || styleMap.modern;
    }

    function extractBrandNameFromPrompt(prompt) {
        // Simple extraction of potential brand name from prompt
        const words = prompt.split(' ');
        const brandIndicators = ['logo', 'brand', 'company', 'business'];
        
        for (let i = 0; i < words.length; i++) {
            if (brandIndicators.includes(words[i].toLowerCase()) && words[i + 1]) {
                return words[i + 1].charAt(0).toUpperCase() + words[i + 1].slice(1);
            }
        }
        
        return 'Brand Logo';
    }

    function detectDocumentType(context) {
        const { documentWidth = 800, documentHeight = 600 } = context;
        const ratio = documentWidth / documentHeight;
        
        if (Math.abs(ratio - 1) < 0.1) return 'square-post';
        if (Math.abs(ratio - 16/9) < 0.1) return 'presentation';
        if (Math.abs(ratio - 4/5) < 0.1) return 'instagram-post';
        if (ratio > 2) return 'banner';
        if (ratio < 0.8) return 'story';
        
        return 'custom';
    }

    function getRecommendedFormats(context) {
        const docType = detectDocumentType(context);
        
        const formatMap = {
            'square-post': ['image', 'icon', 'logo'],
            'presentation': ['layout', 'image'],
            'instagram-post': ['image', 'layout'],
            'banner': ['image', 'layout'],
            'story': ['image', 'layout'],
            'custom': ['image', 'icon', 'layout', 'logo']
        };
        
        return formatMap[docType] || ['image', 'icon'];
    }

    function extractColorScheme(context) {
        // This would analyze existing elements in the document
        // For now, return a default modern color scheme
        return ['#6366f1', '#8b5cf6', '#10b981', '#f59e0b'];
    }

    // Expose the API to the UI runtime
    runtime.exposeApi(sandboxApi);
}

start();
