import addOnUISdk from "https://new.express.adobe.com/static/add-on-sdk/sdk.js";

class MingleAssetStudio {
    constructor() {
        this.assets = new Map();
        this.sandboxProxy = null;
    }

    async init() {
        console.log("🚀 Initializing Mingle Asset Studio...");
        
        try {
            // Get the UI runtime and sandbox proxy
            const { runtime } = addOnUISdk.instance;
            console.log("📡 Getting sandbox proxy...");
            this.sandboxProxy = await runtime.apiProxy("documentSandbox");
            console.log("✅ Sandbox proxy connected:", this.sandboxProxy ? "Success" : "Failed");
            
            // Initialize UI components
            this.initializeGenerator();
            this.initializeAssetLibrary();
            
            console.log("✅ Mingle Asset Studio initialized successfully!");
            this.showToast("Welcome to Mingle Asset Studio! 🎉", "success");
            
        } catch (error) {
            console.error("❌ Initialization failed:", error);
            this.showToast("Failed to initialize. Please refresh and try again.", "error");
        }
    }

    initializeGenerator() {
        const generateBtn = document.getElementById('generateAssetBtn');
        const promptInput = document.getElementById('promptInput');
        const assetType = document.getElementById('assetType');
        const styleSelect = document.getElementById('styleSelect');

        generateBtn.addEventListener('click', async () => {
            const prompt = promptInput.value.trim();
            
            if (!prompt) {
                this.showToast("Please enter a prompt to generate an asset", "error");
                return;
            }

            const config = {
                prompt: prompt,
                type: assetType.value,
                style: styleSelect.value
            };

            await this.generateAsset(config);
        });

        // Enable enter key to generate
        promptInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                generateBtn.click();
            }
        });
    }

    async generateAsset(config) {
        console.log("🚀 Starting asset generation with config:", config);
        
        const generateBtn = document.getElementById('generateAssetBtn');
        const btnText = generateBtn.querySelector('.btn-text');
        const spinner = generateBtn.querySelector('.loading-spinner');
        
        // Show loading state
        generateBtn.disabled = true;
        btnText.classList.add('hidden');
        spinner.classList.remove('hidden');
        
        try {
            console.log("📝 Simulating asset generation...");
            // Create asset data
            const asset = await this.createAssetData(config);
            
            console.log("🎨 Creating asset in Adobe Express...");
            // Create the asset in Adobe Express
            await this.createAssetInExpress(config);
            
            // Add to library
            this.addAssetToLibrary(asset);
            
            console.log("✅ Asset generation completed successfully!");
            this.showToast(`${config.type} asset generated successfully! 🎨`, "success");
            
            // Clear form
            document.getElementById('promptInput').value = '';
            
        } catch (error) {
            console.error('❌ Asset generation failed:', error);
            this.showToast("Asset generation failed. Please try again.", "error");
        } finally {
            // Reset button state
            generateBtn.disabled = false;
            btnText.classList.remove('hidden');
            spinner.classList.add('hidden');
        }
    }

    async createAssetData(config) {
        // Simulate AI generation delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const assetId = 'asset_' + Date.now();
        const asset = {
            id: assetId,
            name: `${config.type}_${Date.now()}`,
            type: config.type,
            style: config.style,
            prompt: config.prompt,
            createdAt: new Date(),
            thumbnail: this.getThumbnailForType(config.type)
        };
        
        return asset;
    }

    async createAssetInExpress(config) {
        try {
            console.log("🔗 Sandbox proxy status:", this.sandboxProxy ? "Connected" : "Not connected");
            
            if (!this.sandboxProxy) {
                throw new Error("Sandbox proxy not available");
            }
            
            console.log(`🎯 Creating ${config.type} asset in Adobe Express...`);
            
            // Create different asset types in Adobe Express
            switch (config.type) {
                case 'image':
                    await this.sandboxProxy.createImageAsset(config);
                    break;
                case 'icon':
                    await this.sandboxProxy.createIconAsset(config);
                    break;
                case 'layout':
                    await this.sandboxProxy.createLayoutAsset(config);
                    break;
                case 'logo':
                    await this.sandboxProxy.createLogoAsset(config);
                    break;
                default:
                    await this.sandboxProxy.createGenericAsset(config);
            }
            
            console.log("✅ Asset created successfully in Adobe Express!");
            
        } catch (error) {
            console.error('❌ Express asset creation failed:', error);
            console.log("🔄 Attempting fallback rectangle creation...");
            
            try {
                await this.sandboxProxy.createRectangle();
                console.log("✅ Fallback rectangle created successfully!");
            } catch (fallbackError) {
                console.error("❌ Fallback creation also failed:", fallbackError);
                throw fallbackError;
            }
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
        toast.innerHTML = `
            <span>${type === 'success' ? '✅' : '❌'}</span>
            <span>${message}</span>
        `;
        
        container.appendChild(toast);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            if (toast.parentNode) {
                container.removeChild(toast);
            }
        }, 3000);
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
}

// Initialize the application when DOM is ready
const mingleStudio = new MingleAssetStudio();

addOnUISdk.ready.then(() => {
    mingleStudio.init();
});

// Make it globally available for onclick handlers
window.mingleStudio = mingleStudio;
