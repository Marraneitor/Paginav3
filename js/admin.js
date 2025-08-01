// Admin panel JavaScript with Firebase integration
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 DOM cargado, esperando Firebase...');
    
    // Wait for Firebase to be available
    const waitForFirebase = () => {
        if (window.firebaseManager) {
            console.log('✅ Firebase Manager encontrado, inicializando admin...');
            initAdmin();
        } else {
            console.log('⏳ Esperando Firebase Manager...');
            setTimeout(waitForFirebase, 50);
        }
    };
    waitForFirebase();
    // Menu data (same as main site)
    const menuData = {
        "Hamburguesas": [
            { id: 1, name: "Clásica", price: 100, description: "🍔 Jugosa carne de res a la plancha, queso americano derretido, lechuga fresca, tomate maduro y nuestro aderezo especial casero en pan artesanal. ¡El sabor que conquistó corazones!", image: "https://i.imgur.com/ZaM5wGN.jpg", customizable: true },
            { id: 2, name: "BBQ Beacon", price: 110, description: "🔥 Increíble carne de res con nuestra salsa BBQ casera, queso cheddar fundido, aros de cebolla dorados y tocino crujiente. ¡Una explosión de sabores ahumados que te hará volver por más!", image: "https://i.imgur.com/CcLScs2.jpg", customizable: true },
            { id: 11, name: "Hawaiana Burger", price: 120, description: "🌺 Deliciosa carne de res con piña asada caramelizada, jamón premium y queso derretido. ¡Un viaje tropical en cada mordida que despertará tus sentidos!", image: "https://i.imgur.com/qAgzO42.jpg", customizable: true },
            { id: 12, name: "ChistorraBurger", price: 120, description: "🌶️ Exquisita carne de res con chistorra artesanal, cebolla caramelizada al punto perfecto y nuestro aderezo secreto. ¡Una fusión de sabores que te conquistará desde el primer bocado!", image: "https://i.imgur.com/nkF3aGD.jpg", customizable: true }
        ],
        "Hot Dogs": [
            { id: 5, name: "Hotdog Jumbo", price: 60, description: "🌭 Salchicha jumbo jugosa en pan artesanal tostado, tocino crujiente, tomate fresco, cebolla y nuestros aderezos especiales. ¡Preparado al momento para ti!", image: "https://i.imgur.com/AqVeJwo_d.png?maxwidth=520&shape=thumb&fidelity=high", customizable: true },
            { id: 27, name: "Jalapeño Dog", price: 60, description: "🌶️ Salchicha roja premium con queso manchego derretido, tocino crujiente, cebolla caramelizada y jalapeños frescos. ¡El toque picosito que te encantará!", image: "https://i.postimg.cc/hvdyGmrm/hotdog.png", customizable: true }
        ],
        "Combos": [
            { id: 6, name: "Combo Pareja", price: 250, originalPrice: 305, description: "💕 Perfecto para compartir: 2 hamburguesas deliciosas a tu elección, papas medianas doradas y 7 aros de cebolla crujientes. ¡Ideal para una cita perfecta!", image: "https://i.imgur.com/jIKRMRR_d.jpeg?maxwidth=520&shape=thumb&fidelity=high", isCombo: true, burgerChoices: 2, availableBurgers: [1, 2, 11, 12] },
            { id: 15, name: "Combo Dúo", price: 180, originalPrice: 220, description: "🤝 Lo mejor de dos mundos: 1 hamburguesa jugosa, 1 hotdog delicioso y papas medianas. ¡Para los que no pueden decidirse y quieren probarlo todo!", image: "https://i.imgur.com/6VdIGiA.png", isCombo: true, burgerChoices: 1, availableBurgers: [1, 2, 11, 12], hotdogChoices: 1, availableHotdogs: [5, 27] },
            { id: 7, name: "Combo Amigos", price: 340, originalPrice: 400, description: "👥 Para compartir con tus mejores amigos: 3 hamburguesas espectaculares, papas medianas y Coca-Cola 1.75L bien fría. ¡Momento perfecto para crear recuerdos!", image: "https://i.imgur.com/YWFhPNN_d.png?maxwidth=520&shape=thumb&fidelity=high", isCombo: true, burgerChoices: 3, availableBurgers: [1, 2, 11, 12] },
            { id: 14, name: "Combo Familiar", price: 650, originalPrice: 730, description: "👨‍👩‍👧‍👦 La experiencia familiar completa: 5 hamburguesas increíbles, papas gajo grandes, aros de cebolla grandes, Coca-Cola 3L + ENVÍO GRATIS. ¡Todos felices en casa!", image: "https://i.imgur.com/311tSY9_d.png?maxwidth=520&shape=thumb&fidelity=high", isCombo: true, burgerChoices: 5, availableBurgers: [1, 2, 11, 12] }
        ],
        "Extras": [
            { id: 8, name: "Papas Gajo Medianas", price: 60, description: "🍟 Papas gajo doradas y crujientes por fuera, suaves por dentro, sazonadas con nuestra mezcla especial de especias.", image: "https://i.imgur.com/mnmz0uG_d.jpeg?maxwidth=520&shape=thumb&fidelity=high" },
            { id: 16, name: "Papas Gajo Grandes", price: 110, description: "🍟 Porción generosa de nuestras famosas papas gajo, perfectas para compartir. ¡Irresistiblemente adictivas!", image: "https://i.imgur.com/mnmz0uG_d.jpeg?maxwidth=520&shape=thumb&fidelity=high" },
            { id: 28, name: "Papas Francesas Medianas", price: 60, description: "🍟 Papas francesas clásicas, doradas y crujientes, cortadas en bastones perfectos. ¡El acompañamiento tradicional que nunca pasa de moda!", image: "https://puertofresco.com/cdn/shop/products/fri2008_1_jpg.jpg?v=1593107920" },
            { id: 29, name: "Papas Francesas Grandes", price: 100, description: "🍟 Porción grande de nuestras deliciosas papas francesas, cortadas al estilo tradicional y fritas hasta el punto perfecto.", image: "https://puertofresco.com/cdn/shop/products/fri2008_1_jpg.jpg?v=1593107920" },
            { id: 25, name: "Papas Crispy Medianas", price: 60, description: "✨ Papas extra crujientes con nuestro rebozado especial, fritas al punto perfecto. ¡El crunch que tanto te gusta!", image: "https://imgur.com/4bflLWp.jpg" },
            { id: 26, name: "Papas Crispy Grandes", price: 110, description: "✨ Porción abundante de papas crispy súper crujientes. ¡Ideales para satisfacer antojos grandes!", image: "https://imgur.com/4bflLWp.jpg" },
            { id: 17, name: "Salchipapas Medianas", price: 80, description: "🌭🍟 La combinación perfecta: papas doradas con trozos jugosos de salchicha premium. ¡Un clásico que nunca falla!", image: "https://i.imgur.com/YgEDfx3_d.jpeg?maxwidth=520&shape=thumb&fidelity=high" },
            { id: 18, name: "Salchipapas Grandes", price: 120, description: "🌭🍟 Porción familiar de salchipapas con salchicha premium y papas doradas. ¡Para los que aman los sabores intensos!", image: "https://i.imgur.com/YgEDfx3_d.jpeg?maxwidth=520&shape=thumb&fidelity=high" },
            { id: 19, name: "Aros de Cebolla (7 pz)", price: 45, description: "🧅 Aros de cebolla empanizados y fritos hasta la perfección, crujientes por fuera y tiernos por dentro.", image: "https://i.imgur.com/rK8wjox_d.jpeg?maxwidth=520&shape=thumb&fidelity=high" },
            { id: 20, name: "Aros de Cebolla Grande (15 pz)", price: 80, description: "🧅 Porción generosa de aros de cebolla dorados. ¡El acompañamiento perfecto que complementa cualquier orden!", image: "https://i.imgur.com/rK8wjox_d.jpeg?maxwidth=520&shape=thumb&fidelity=high" }
        ],
        "Bebidas": [
             { id: 21, name: "Coca-Cola 600ml", price: 30, description: "🥤 Coca-Cola helada y refrescante, el acompañante perfecto para tu comida. ¡Nada como la chispa de la vida!", image: "https://www.cityclub.com.mx/dw/image/v2/BGBD_PRD/on/demandware.static/-/Sites-soriana-grocery-master-catalog/default/dw689a18fa/images/product/0000075007614_A.jpg?sw=1000&sh=1000&sm=fit" },
             { id: 22, name: "Coca-Cola 1.75L", price: 40, description: "🥤 Coca-Cola familiar perfecta para compartir, siempre fría y burbujeante. ¡Momentos especiales merecen la Coca-Cola!", image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSGy2eN7S4XcTdBnt6j96814qfmaZ2oXMoCrg&s" },
             { id: 23, name: "Coca-Cola 3L", price: 60, description: "🥤 La Coca-Cola grande para toda la familia, helada y con esa burbuja inconfundible que todos amamos. ¡Alegría para todos!", image: "https://i5.walmartimages.com.mx/gr/images/product-images/img_large/00750105530474L.jpg?odnHeight=612&odnWidth=612&odnBg=FFFFFF" },
             { id: 24, name: "Agua Natural 600ml", price: 20, description: "💧 Agua natural pura y refrescante para hidratarte mientras disfrutas de tu comida favorita.", image: "https://placehold.co/400x400/3B82F6/FFF?text=Agua" }
        ]
    };

    let currentCategory = 'Hamburguesas';
    let adminSettings = {
        serviceActive: true,
        hiddenProducts: []
    };
    
    // Initialize admin panel
    async function initAdmin() {
        try {
            console.log('🚀 Inicializando panel de administración...');
            console.log('🔍 Verificando Firebase Manager:', !!window.firebaseManager);
            
            if (!window.firebaseManager) {
                throw new Error('Firebase Manager no disponible después de la espera');
            }
            
            console.log('📡 Cargando configuraciones desde Firebase...');
            await loadSettingsFromFirebase();
            
            console.log('🎨 Renderizando productos...');
            renderProducts(currentCategory);
            
            console.log('⚙️ Configurando event listeners...');
            setupEventListeners();
            
            console.log('📊 Actualizando estado del servicio...');
            updateServiceStatus();
            
            console.log('👂 Configurando listeners en tiempo real...');
            setupRealtimeListeners();
            
            console.log('✅ Panel de administración listo y sincronizado');
            showToast('Panel de administración conectado a Firebase', 'success');
        } catch (error) {
            console.error('❌ Error inicializando admin:', error);
            console.log('🔄 Fallback a configuración local...');
            // Fallback to localStorage if Firebase fails
            loadSettingsFromLocalStorage();
            renderProducts(currentCategory);
            setupEventListeners();
            updateServiceStatus();
            showToast('Usando configuración local (sin sincronización)', 'warning');
        }
    }

    // Load settings from Firebase
    async function loadSettingsFromFirebase() {
        try {
            const settings = await window.firebaseManager.getSettings();
            if (settings) {
                adminSettings = {
                    serviceActive: settings.serviceActive !== undefined ? settings.serviceActive : true,
                    hiddenProducts: settings.hiddenProducts || []
                };
                
                // Update UI
                document.getElementById('service-toggle').checked = adminSettings.serviceActive;
                window.hiddenProducts = adminSettings.hiddenProducts;
            }
        } catch (error) {
            console.error('Error loading settings from Firebase:', error);
            throw error;
        }
    }

    // Load settings from localStorage (fallback)
    function loadSettingsFromLocalStorage() {
        const serviceActive = localStorage.getItem('restaurantServiceActive');
        const hiddenProducts = localStorage.getItem('hiddenProducts');
        
        adminSettings.serviceActive = serviceActive !== null ? serviceActive === 'true' : true;
        adminSettings.hiddenProducts = hiddenProducts ? JSON.parse(hiddenProducts) : [];
        
        document.getElementById('service-toggle').checked = adminSettings.serviceActive;
        window.hiddenProducts = adminSettings.hiddenProducts;
    }

    // Save settings to Firebase
    async function saveSettingsToFirebase() {
        try {
            console.log('💾 Intentando guardar configuraciones...', adminSettings);
            
            if (!window.firebaseManager) {
                console.error('❌ window.firebaseManager no está disponible');
                throw new Error('Firebase Manager no disponible');
            }
            
            console.log('📡 Guardando en Firebase...');
            await window.firebaseManager.saveSettings(adminSettings);
            console.log('✅ Configuraciones guardadas en Firebase exitosamente');
            
            // Also save to localStorage as backup
            localStorage.setItem('restaurantServiceActive', adminSettings.serviceActive.toString());
            localStorage.setItem('hiddenProducts', JSON.stringify(adminSettings.hiddenProducts));
            
            showToast('Configuración sincronizada exitosamente', 'success');
        } catch (error) {
            console.error('❌ Error saving settings to Firebase:', error);
            // Fallback to localStorage only
            localStorage.setItem('restaurantServiceActive', adminSettings.serviceActive.toString());
            localStorage.setItem('hiddenProducts', JSON.stringify(adminSettings.hiddenProducts));
            showToast('Error de sincronización - guardado solo localmente', 'warning');
        }
    }

    // Setup real-time listeners for settings changes
    function setupRealtimeListeners() {
        if (window.firebaseManager && window.firebaseManager.listenToSettings) {
            window.firebaseManager.listenToSettings((newSettings) => {
                if (newSettings) {
                    const oldServiceActive = adminSettings.serviceActive;
                    
                    adminSettings = {
                        serviceActive: newSettings.serviceActive !== undefined ? newSettings.serviceActive : true,
                        hiddenProducts: newSettings.hiddenProducts || []
                    };
                    
                    // Update UI
                    document.getElementById('service-toggle').checked = adminSettings.serviceActive;
                    window.hiddenProducts = adminSettings.hiddenProducts;
                    
                    updateServiceStatus();
                    renderProducts(currentCategory);
                    
                    // Show notification if service status changed from another device
                    if (oldServiceActive !== adminSettings.serviceActive) {
                        showToast(
                            `Servicio ${adminSettings.serviceActive ? 'ACTIVADO' : 'DESACTIVADO'} desde otro dispositivo`,
                            adminSettings.serviceActive ? 'success' : 'warning'
                        );
                    }
                }
            });
        }
    }

    // Update service status display
    function updateServiceStatus() {
        const isActive = adminSettings.serviceActive;
        const toggle = document.getElementById('service-toggle');
        const emoji = document.getElementById('service-emoji');
        const title = document.getElementById('service-title');
        const description = document.getElementById('service-description');
        const statusDot = document.getElementById('status-dot');
        const statusText = document.getElementById('status-text');
        
        // Update toggle if needed (prevent infinite loops)
        if (toggle.checked !== isActive) {
            toggle.checked = isActive;
        }
        
        if (isActive) {
            emoji.textContent = '🟢';
            title.textContent = 'Servicio Activo';
            description.textContent = 'Los clientes pueden realizar pedidos normalmente';
            statusDot.className = 'w-3 h-3 bg-green-500 rounded-full animate-pulse';
            statusText.textContent = 'SERVICIO ACTIVO';
            statusText.className = 'text-sm font-semibold text-green-600';
        } else {
            emoji.textContent = '🔴';
            title.textContent = 'Servicio Inactivo';
            description.textContent = 'Los clientes verán un mensaje de "Temporalmente cerrado"';
            statusDot.className = 'w-3 h-3 bg-red-500 rounded-full animate-pulse';
            statusText.textContent = 'SERVICIO CERRADO';
            statusText.className = 'text-sm font-semibold text-red-600';
        }
    }

    // Render products for selected category
    function renderProducts(category) {
        const container = document.getElementById('products-container');
        const products = menuData[category] || [];
        
        container.innerHTML = products.map(product => {
            const isHidden = adminSettings.hiddenProducts && adminSettings.hiddenProducts.includes(product.id);
            
            return `
                <div class="bg-white rounded-lg shadow-lg overflow-hidden border-2 ${isHidden ? 'border-red-300 opacity-60' : 'border-gray-200'} transition-all duration-300">
                    <div class="relative">
                        <img src="${product.image}" 
                             alt="${product.name}" 
                             class="w-full h-40 object-cover"
                             onerror="this.src='https://placehold.co/400x400/FFB300/FFFFFF?text=${encodeURIComponent(product.name)}'">
                        
                        <!-- Status overlay -->
                        <div class="absolute top-2 right-2">
                            ${isHidden ? 
                                '<div class="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold animate-pulse">OCULTO</div>' :
                                '<div class="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-bold">VISIBLE</div>'
                            }
                        </div>
                    </div>
                    
                    <div class="p-4">
                        <h3 class="font-bold text-lg mb-2 ${isHidden ? 'text-gray-500' : 'text-gray-800'}">${product.name}</h3>
                        <p class="text-gray-600 text-sm mb-3 line-clamp-2">${product.description}</p>
                        <div class="flex justify-between items-center mb-4">
                            <span class="text-xl font-bold text-yellow-600">$${product.price}</span>
                            <span class="text-sm text-gray-500">ID: ${product.id}</span>
                        </div>
                        
                        <!-- Toggle button -->
                        <button onclick="toggleProduct(${product.id})" 
                                class="w-full py-2 px-4 rounded-lg font-semibold transition-all duration-300 ${
                                    isHidden ? 
                                    'bg-green-500 hover:bg-green-600 text-white' : 
                                    'bg-red-500 hover:bg-red-600 text-white'
                                }">
                            <i class="fas ${isHidden ? 'fa-eye' : 'fa-eye-slash'} mr-2"></i>
                            ${isHidden ? 'Mostrar Producto' : 'Ocultar Producto'}
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Toggle product visibility
    window.toggleProduct = async function(productId) {
        console.log(`🔄 Toggling product ${productId}...`);
        
        const index = adminSettings.hiddenProducts.indexOf(productId);
        const product = findProductById(productId);
        
        if (index > -1) {
            // Show product
            adminSettings.hiddenProducts.splice(index, 1);
            console.log(`👁️ Producto ${productId} (${product.name}) ahora es VISIBLE`);
            showToast(`${product.name} ahora es VISIBLE`, 'success');
        } else {
            // Hide product
            adminSettings.hiddenProducts.push(productId);
            console.log(`🙈 Producto ${productId} (${product.name}) ahora está OCULTO`);
            showToast(`${product.name} ahora está OCULTO`, 'warning');
        }
        
        // Update global reference for compatibility
        window.hiddenProducts = adminSettings.hiddenProducts;
        
        console.log('💾 Guardando cambio de producto...');
        console.log('Productos ocultos actuales:', adminSettings.hiddenProducts);
        
        await saveSettingsToFirebase();
        renderProducts(currentCategory);
    };

    // Find product by ID
    function findProductById(productId) {
        for (const category in menuData) {
            const product = menuData[category].find(p => p.id === productId);
            if (product) return product;
        }
        return null;
    }

    // Show all products
    window.showAllProducts = async function() {
        adminSettings.hiddenProducts = [];
        window.hiddenProducts = adminSettings.hiddenProducts;
        await saveSettingsToFirebase();
        renderProducts(currentCategory);
        showToast('Todos los productos son ahora VISIBLES', 'success');
    };

    // Hide all products
    window.hideAllProducts = async function() {
        const allProducts = [];
        Object.values(menuData).forEach(category => {
            category.forEach(product => allProducts.push(product.id));
        });
        adminSettings.hiddenProducts = allProducts;
        window.hiddenProducts = adminSettings.hiddenProducts;
        await saveSettingsToFirebase();
        renderProducts(currentCategory);
        showToast('Todos los productos están ahora OCULTOS', 'warning');
    };

    // Reset settings
    window.resetSettings = async function() {
        if (confirm('¿Estás seguro de que quieres resetear todas las configuraciones?')) {
            adminSettings = {
                serviceActive: true,
                hiddenProducts: []
            };
            window.hiddenProducts = adminSettings.hiddenProducts;
            
            document.getElementById('service-toggle').checked = true;
            updateServiceStatus();
            renderProducts(currentCategory);
            
            await saveSettingsToFirebase();
            showToast('Configuración reseteada exitosamente', 'success');
        }
    };

    // Show toast notification
    function showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        const toastMessage = document.getElementById('toast-message');
        
        toastMessage.textContent = message;
        
        // Set toast color based on type
        toast.className = `fixed top-4 right-4 px-6 py-4 rounded-lg shadow-xl z-50 transform transition-transform duration-300 ${
            type === 'success' ? 'bg-green-500' : 
            type === 'warning' ? 'bg-orange-500' : 
            'bg-red-500'
        } text-white`;
        
        // Show toast
        toast.classList.remove('translate-x-full');
        
        // Hide toast after 3 seconds
        setTimeout(() => {
            toast.classList.add('translate-x-full');
        }, 3000);
    }

    // Setup event listeners
    function setupEventListeners() {
        // Service toggle
        document.getElementById('service-toggle').addEventListener('change', async () => {
            const newStatus = document.getElementById('service-toggle').checked;
            console.log(`🔄 Cambiando servicio a: ${newStatus ? 'ACTIVO' : 'INACTIVO'}`);
            
            adminSettings.serviceActive = newStatus;
            updateServiceStatus();
            
            console.log('💾 Guardando cambio de servicio...');
            await saveSettingsToFirebase();
            
            showToast(
                adminSettings.serviceActive ? 'Servicio ACTIVADO - Los clientes pueden hacer pedidos' : 'Servicio DESACTIVADO - Página cerrada temporalmente',
                adminSettings.serviceActive ? 'success' : 'warning'
            );
        });

        // Category tabs
        document.querySelectorAll('.category-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                // Update active tab
                document.querySelectorAll('.category-tab').forEach(t => {
                    t.classList.remove('active', 'bg-white', 'shadow-md', 'text-gray-800');
                    t.classList.add('text-gray-600');
                });
                
                tab.classList.add('active', 'bg-white', 'shadow-md', 'text-gray-800');
                tab.classList.remove('text-gray-600');
                
                // Update current category and render
                currentCategory = tab.dataset.category;
                renderProducts(currentCategory);
            });
        });
    }

    // Initialize when page loads
    initAdmin();
});
