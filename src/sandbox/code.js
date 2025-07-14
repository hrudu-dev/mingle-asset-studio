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
        createImageAsset: (config) => {
            return createVisualAsset(config, 'image');
        },

        createIconAsset: (config) => {
            return createVisualAsset(config, 'icon');
        },

        createLayoutAsset: (config) => {
            return createLayoutStructure(config);
        },

        createLogoAsset: (config) => {
            return createLogoDesign(config);
        },

        createGenericAsset: (config) => {
            return createVisualAsset(config, 'generic');
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
    function createVisualAsset(config, type) {
        try {
            const { prompt, style = 'modern' } = config;
            
            // Create a visual representation based on the asset type
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

    function createGenericPlaceholder(config) {
        const { prompt } = config;
        
        // Create a simple placeholder
        const placeholder = editor.createRectangle();
        placeholder.width = 200;
        placeholder.height = 150;
        placeholder.translation = { x: 30, y: 30 };
        
        const color = { red: 0.8, green: 0.8, blue: 0.9, alpha: 1 };
        placeholder.fill = editor.makeColorFill(color);
        
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
