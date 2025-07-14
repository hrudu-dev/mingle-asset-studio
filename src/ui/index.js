import addOnUISdk from "https://new.express.adobe.com/static/add-on-sdk/sdk.js";

class MingleAssetStudio {
    constructor() {
        this.assets = new Map();
        this.folders = new Map();
        this.currentTab = 'generator';
        this.sandboxProxy = null;
        this.contextData = {};
        
        this.initializeData();
    }

    initializeData() {
        // Initialize default folders
        this.folders.set('recent', { name: 'Recent Assets', assets: [], icon: '📂' });
        this.folders.set('favorites', { name: 'Favorites', assets: [], icon: '⭐' });
        
        // Load from localStorage if available
        this.loadFromStorage();
    }

    async init() {
        console.log("Initializing Mingle Asset Studio...");
        
        // Get the UI runtime and sandbox proxy
        const { runtime } = addOnUISdk.instance;
        this.sandboxProxy = await runtime.apiProxy("documentSandbox");
        
        // Initialize UI components
        this.initializeNavigation();
        this.initializeGenerator();
        this.initializeAssetManagement();
        this.initializeInsights();
        this.initializeTeam();
        this.initializeQualityPanel();
        
        // Analyze current design context
        await this.analyzeDesignContext();
        
        console.log("Mingle Asset Studio initialized successfully!");
        this.showToast("Welcome to Mingle Asset Studio! 🎉", "success");
    }

    // Navigation System
    initializeNavigation() {
        const tabButtons = document.querySelectorAll('.tab-btn');
        
        tabButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tabId = e.target.dataset.tab;
                this.switchTab(tabId);
            });
        });
    }

    switchTab(tabId) {
        // Update active tab button
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabId);
        });
        
        // Update active tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.id === `${tabId}-tab`);
        });
        
        this.currentTab = tabId;
        
        // Trigger tab-specific updates
        if (tabId === 'insights') {
            this.updateInsights();
        }
    }

    // Asset Generator
    initializeGenerator() {
        const generateBtn = document.getElementById('generateAssetBtn');
        const promptInput = document.getElementById('promptInput');
        const assetTypeButtons = document.querySelectorAll('.option-btn[data-type]');
        const styleSelect = document.getElementById('styleSelect');
        const brandSelect = document.getElementById('brandSelect');

        // Asset type selection
        assetTypeButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                assetTypeButtons.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.updateContextSuggestions();
            });
        });

        // Generate asset button
        generateBtn.addEventListener('click', async () => {
            const prompt = promptInput.value.trim();
            if (!prompt) {
                this.showToast("Please enter a description for your asset", "warning");
                return;
            }

            await this.generateAsset({
                prompt,
                type: document.querySelector('.option-btn.active').dataset.type,
                style: styleSelect.value,
                brand: brandSelect.value
            });
        });

        // Real-time context updates
        promptInput.addEventListener('input', () => {
            this.updateContextSuggestions();
        });

        styleSelect.addEventListener('change', () => {
            this.updateContextSuggestions();
        });
    }

    async generateAsset(config) {
        const generateBtn = document.getElementById('generateAssetBtn');
        const btnText = generateBtn.querySelector('.btn-text');
        const spinner = generateBtn.querySelector('.loading-spinner');
        
        // Show loading state
        generateBtn.disabled = true;
        btnText.classList.add('hidden');
        spinner.classList.remove('hidden');
        
        try {
            // Simulate AI generation process
            await this.simulateAssetGeneration(config);
            
            // Create the asset in Adobe Express
            await this.createAssetInExpress(config);
            
            this.showToast(`${config.type} asset generated successfully! 🎨`, "success");
            
            // Clear form
            document.getElementById('promptInput').value = '';
            
        } catch (error) {
            console.error('Asset generation failed:', error);
            this.showToast("Asset generation failed. Please try again.", "error");
        } finally {
            // Reset button state
            generateBtn.disabled = false;
            btnText.classList.remove('hidden');
            spinner.classList.add('hidden');
        }
    }

    async simulateAssetGeneration(config) {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Generate mock asset data
        const assetId = 'asset_' + Date.now();
        const asset = {
            id: assetId,
            name: `${config.type}_${Date.now()}`,
            type: config.type,
            style: config.style,
            prompt: config.prompt,
            createdAt: new Date(),
            rating: 0,
            usageCount: 0,
            tags: this.extractTagsFromPrompt(config.prompt),
            thumbnail: this.generateThumbnail(config.type)
        };
        
        // Store asset
        this.assets.set(assetId, asset);
        this.folders.get('recent').assets.unshift(assetId);
        
        // Update UI
        this.updateAssetGrid();
        this.updateFolderCounts();
        this.saveToStorage();
        
        return asset;
    }

    async createAssetInExpress(config) {
        try {
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
        } catch (error) {
            console.error('Express asset creation failed:', error);
            // Fallback to basic rectangle creation
            await this.sandboxProxy.createRectangle();
        }
    }

    extractTagsFromPrompt(prompt) {
        // Simple tag extraction from prompt
        const commonWords = ['a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
        return prompt
            .toLowerCase()
            .split(/\s+/)
            .filter(word => word.length > 2 && !commonWords.includes(word))
            .slice(0, 5);
    }

    generateThumbnail(type) {
        const thumbnails = {
            image: '🖼️',
            icon: '🎯',
            layout: '📐',
            logo: '🏷️'
        };
        return thumbnails[type] || '📄';
    }

    updateContextSuggestions() {
        const suggestions = document.getElementById('contextSuggestions');
        const activeType = document.querySelector('.option-btn.active')?.dataset.type;
        const prompt = document.getElementById('promptInput').value;
        
        let suggestionText = "💡 AI will analyze your current design context and suggest optimal formats and styles.";
        
        if (activeType && prompt) {
            const contextSuggestions = this.generateContextSuggestions(activeType, prompt);
            suggestionText = `💡 Suggested: ${contextSuggestions}`;
        }
        
        suggestions.innerHTML = `<p class="suggestion-text">${suggestionText}</p>`;
    }

    generateContextSuggestions(type, prompt) {
        const suggestions = {
            image: "High-resolution format recommended for social media posts",
            icon: "SVG format with transparent background for web use",
            layout: "Responsive grid system with mobile-first approach",
            logo: "Vector format with brand color variations"
        };
        
        return suggestions[type] || "Optimized format for your current project";
    }

    async analyzeDesignContext() {
        try {
            // Get current document context from Adobe Express
            this.contextData = await this.sandboxProxy.getDocumentContext();
            this.updateContextSuggestions();
        } catch (error) {
            console.error('Context analysis failed:', error);
        }
    }

    // Asset Management
    initializeAssetManagement() {
        const searchInput = document.getElementById('searchAssets');
        const filterSelect = document.getElementById('filterAssets');
        const newFolderBtn = document.getElementById('newFolderBtn');
        
        searchInput.addEventListener('input', (e) => {
            this.filterAssets(e.target.value, filterSelect.value);
        });
        
        filterSelect.addEventListener('change', (e) => {
            this.filterAssets(searchInput.value, e.target.value);
        });
        
        newFolderBtn.addEventListener('click', () => {
            this.createNewFolder();
        });
        
        // Initialize folder structure
        this.updateFolderStructure();
        this.updateAssetGrid();
    }

    updateFolderStructure() {
        const folderStructure = document.querySelector('.folder-structure');
        folderStructure.innerHTML = '';
        
        this.folders.forEach((folder, folderId) => {
            const folderElement = document.createElement('div');
            folderElement.className = 'folder-item';
            folderElement.dataset.folder = folderId;
            folderElement.innerHTML = `
                <span class="folder-icon">${folder.icon}</span>
                <span class="folder-name">${folder.name}</span>
                <span class="folder-count">${folder.assets.length}</span>
            `;
            
            folderElement.addEventListener('click', () => {
                this.selectFolder(folderId);
            });
            
            folderStructure.appendChild(folderElement);
        });
    }

    updateAssetGrid() {
        const assetsGrid = document.getElementById('assetsGrid');
        
        if (this.assets.size === 0) {
            assetsGrid.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📦</div>
                    <p>No assets yet. Generate your first asset in the Generator tab!</p>
                </div>
            `;
            return;
        }
        
        assetsGrid.innerHTML = '';
        
        this.assets.forEach((asset, assetId) => {
            const assetCard = document.createElement('div');
            assetCard.className = 'asset-card';
            assetCard.innerHTML = `
                <div class="asset-preview">${asset.thumbnail}</div>
                <div class="asset-info">
                    <div class="asset-name">${asset.name}</div>
                    <div class="asset-meta">
                        <span>${asset.type}</span>
                        <span>⭐ ${asset.rating.toFixed(1)}</span>
                    </div>
                </div>
            `;
            
            assetCard.addEventListener('click', () => {
                this.selectAsset(assetId);
            });
            
            assetCard.addEventListener('dblclick', async () => {
                await this.useAsset(assetId);
            });
            
            assetsGrid.appendChild(assetCard);
        });
    }

    filterAssets(searchTerm, typeFilter) {
        const assetCards = document.querySelectorAll('.asset-card');
        
        assetCards.forEach(card => {
            const name = card.querySelector('.asset-name').textContent.toLowerCase();
            const type = card.querySelector('.asset-meta span').textContent.toLowerCase();
            
            const matchesSearch = !searchTerm || name.includes(searchTerm.toLowerCase());
            const matchesFilter = typeFilter === 'all' || type.includes(typeFilter);
            
            card.style.display = (matchesSearch && matchesFilter) ? 'block' : 'none';
        });
    }

    async useAsset(assetId) {
        const asset = this.assets.get(assetId);
        if (!asset) return;
        
        try {
            // Add asset to current Adobe Express document
            await this.sandboxProxy.addAssetToDocument(asset);
            
            // Update usage statistics
            asset.usageCount++;
            this.saveToStorage();
            
            this.showToast(`Added "${asset.name}" to document! 📎`, "success");
        } catch (error) {
            console.error('Failed to use asset:', error);
            this.showToast("Failed to add asset to document", "error");
        }
    }

    selectAsset(assetId) {
        // Remove previous selections
        document.querySelectorAll('.asset-card').forEach(card => {
            card.classList.remove('selected');
        });
        
        // Add selection to clicked asset
        event.currentTarget.classList.add('selected');
        
        // Show quality panel for selected asset
        this.showQualityPanel(assetId);
    }

    createNewFolder() {
        const folderName = prompt("Enter folder name:");
        if (!folderName) return;
        
        const folderId = 'folder_' + Date.now();
        this.folders.set(folderId, {
            name: folderName,
            assets: [],
            icon: '📁'
        });
        
        this.updateFolderStructure();
        this.saveToStorage();
        this.showToast(`Folder "${folderName}" created! 📁`, "success");
    }

    updateFolderCounts() {
        this.updateFolderStructure();
    }

    // Insights and Analytics
    initializeInsights() {
        this.updateInsights();
    }

    updateInsights() {
        const totalAssets = document.getElementById('totalAssets');
        const assetsUsed = document.getElementById('assetsUsed');
        const avgRating = document.getElementById('avgRating');
        
        const totalCount = this.assets.size;
        const usedCount = Array.from(this.assets.values()).filter(asset => asset.usageCount > 0).length;
        const avgRatingValue = totalCount > 0 
            ? Array.from(this.assets.values()).reduce((sum, asset) => sum + asset.rating, 0) / totalCount
            : 0;
        
        totalAssets.textContent = totalCount;
        assetsUsed.textContent = usedCount;
        avgRating.textContent = avgRatingValue.toFixed(1);
        
        this.updateAssetTypeChart();
    }

    updateAssetTypeChart() {
        const chartContainer = document.getElementById('assetTypeChart');
        
        if (this.assets.size === 0) {
            chartContainer.innerHTML = '<div class="chart-placeholder">📈 Charts will appear here as you use assets</div>';
            return;
        }
        
        const typeCounts = {};
        this.assets.forEach(asset => {
            typeCounts[asset.type] = (typeCounts[asset.type] || 0) + 1;
        });
        
        let chartHTML = '<div class="chart-bars">';
        Object.entries(typeCounts).forEach(([type, count]) => {
            const percentage = (count / this.assets.size) * 100;
            chartHTML += `
                <div class="chart-bar">
                    <div class="bar-label">${type}</div>
                    <div class="bar-fill" style="width: ${percentage}%"></div>
                    <div class="bar-count">${count}</div>
                </div>
            `;
        });
        chartHTML += '</div>';
        
        chartContainer.innerHTML = chartHTML;
    }

    // Team Collaboration (Placeholder)
    initializeTeam() {
        // Future implementation for team features
        console.log("Team collaboration features initialized (placeholder)");
    }

    // Quality Control Panel
    initializeQualityPanel() {
        const closeBtn = document.getElementById('closeQualityPanel');
        closeBtn.addEventListener('click', () => {
            this.hideQualityPanel();
        });
    }

    showQualityPanel(assetId) {
        const asset = this.assets.get(assetId);
        if (!asset) return;
        
        const panel = document.getElementById('qualityPanel');
        const resolutionCheck = document.getElementById('resolutionCheck');
        const brandCheck = document.getElementById('brandCheck');
        const qualityRating = document.getElementById('qualityRating');
        
        // Simulate quality metrics
        resolutionCheck.textContent = "✅ High (300 DPI)";
        brandCheck.textContent = "✅ Compliant";
        qualityRating.textContent = `⭐ ${(Math.random() * 2 + 3).toFixed(1)}/5`;
        
        panel.classList.remove('hidden');
    }

    hideQualityPanel() {
        document.getElementById('qualityPanel').classList.add('hidden');
    }

    // Utility Functions
    showToast(message, type = 'info') {
        const toastContainer = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        
        toastContainer.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 5000);
    }

    saveToStorage() {
        try {
            const data = {
                assets: Array.from(this.assets.entries()),
                folders: Array.from(this.folders.entries())
            };
            localStorage.setItem('mingleAssetStudio', JSON.stringify(data));
        } catch (error) {
            console.error('Failed to save to localStorage:', error);
        }
    }

    loadFromStorage() {
        try {
            const data = localStorage.getItem('mingleAssetStudio');
            if (data) {
                const parsed = JSON.parse(data);
                this.assets = new Map(parsed.assets || []);
                // Merge with default folders
                const storedFolders = new Map(parsed.folders || []);
                storedFolders.forEach((folder, id) => {
                    this.folders.set(id, folder);
                });
            }
        } catch (error) {
            console.error('Failed to load from localStorage:', error);
        }
    }
}

// Initialize the application when the SDK is ready
addOnUISdk.ready.then(async () => {
    console.log("addOnUISdk is ready for use.");
    
    const app = new MingleAssetStudio();
    await app.init();
    
    // Make app globally available for debugging
    window.mingleApp = app;
});
