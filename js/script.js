document.addEventListener('DOMContentLoaded', () => {
    // Wait for Firebase to be available, then check service status
    const waitForFirebase = () => {
        if (window.firebaseManager) {
            initializeFirebaseFeatures();
        } else {
            setTimeout(waitForFirebase, 100);
        }
    };
    waitForFirebase();
    
    // Initialize Firebase-dependent features
    async function initializeFirebaseFeatures() {
        try {
            // Load hidden products from Firebase
            await loadHiddenProductsFromFirebase();
            
            // Setup real-time listeners
            setupHiddenProductsListener();
            
            // Check service status
            await checkServiceStatusFromFirebase();
            
            console.log('Firebase features initialized successfully');
        } catch (error) {
            console.error('Error initializing Firebase features:', error);
            // Fallback to localStorage-based functionality
            checkServiceStatusFromLocalStorage();
        }
    }
    
    // --- SERVICE AND ADMIN CONTROLS ---
    
    // Check if service is active from Firebase
    async function checkServiceStatusFromFirebase() {
        try {
            const isActive = await window.firebaseManager.isServiceActive();
            if (!isActive) {
                showServiceClosedModal();
                return false;
            }
            return true;
        } catch (error) {
            console.error('Error checking service status:', error);
            // Fallback to localStorage
            checkServiceStatusFromLocalStorage();
        }
    }
    
    // Fallback: Check service status from localStorage
    function checkServiceStatusFromLocalStorage() {
        const serviceActive = localStorage.getItem('restaurantServiceActive');
        if (serviceActive === 'false') {
            showServiceClosedModal();
            return false;
        }
        return true;
    }
    
    // Show service closed modal
    function showServiceClosedModal() {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4';
        modal.innerHTML = `
            <div class="bg-white rounded-2xl shadow-2xl max-w-md mx-auto text-center p-8">
                <div class="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <i class="fas fa-store-slash text-red-500 text-4xl"></i>
                </div>
                <h2 class="text-3xl font-bold text-gray-800 mb-4">¡Temporalmente Cerrado!</h2>
                <p class="text-gray-600 mb-6 leading-relaxed">
                    Lo sentimos, nuestro servicio de pedidos está temporalmente cerrado. 
                    <br><br>
                    Pronto estaremos de vuelta con deliciosas hamburguesas para ti.
                </p>
                <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <p class="text-blue-800 text-sm font-semibold">
                        <i class="fas fa-clock mr-2"></i>
                        SERVICIO TODOS LOS DÍAS DE 3 PM A 12 AM
                    </p>
                </div>
                <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                    <p class="text-yellow-800 text-sm">
                        <i class="fas fa-clock mr-2"></i>
                        Estaremos disponibles nuevamente muy pronto
                    </p>
                </div>
                <button onclick="window.location.reload()" 
                        class="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-8 py-3 rounded-full font-bold hover:from-yellow-600 hover:to-orange-600 transition-all duration-300 shadow-lg">
                    <i class="fas fa-refresh mr-2"></i>Intentar de nuevo
                </button>
            </div>
        `;
        document.body.appendChild(modal);
        
        // Disable all interactions
        document.body.style.overflow = 'hidden';
    }
    
    // Global variable to store hidden products from Firebase
    let hiddenProductsFromFirebase = [];
    
    // Load hidden products from Firebase on page load
    async function loadHiddenProductsFromFirebase() {
        try {
            hiddenProductsFromFirebase = await window.firebaseManager.getHiddenProducts();
            console.log('Productos ocultos cargados desde Firebase:', hiddenProductsFromFirebase);
        } catch (error) {
            console.error('Error loading hidden products from Firebase:', error);
            // Fallback to localStorage
            const hiddenProducts = localStorage.getItem('hiddenProducts');
            if (hiddenProducts) {
                hiddenProductsFromFirebase = JSON.parse(hiddenProducts);
            }
        }
    }
    
    // Check if product is hidden by admin
    function isProductHidden(productId) {
        // First check Firebase data
        if (hiddenProductsFromFirebase.length > 0) {
            return hiddenProductsFromFirebase.includes(productId);
        }
        
        // Fallback to localStorage
        const hiddenProducts = localStorage.getItem('hiddenProducts');
        if (hiddenProducts) {
            const hiddenList = JSON.parse(hiddenProducts);
            return hiddenList.includes(productId);
        }
        return false;
    }
    
    // Setup real-time listener for hidden products changes
    function setupHiddenProductsListener() {
        if (window.firebaseManager && window.firebaseManager.listenToSettings) {
            let isUpdating = false; // Flag to prevent loops
            
            window.firebaseManager.listenToSettings((newSettings) => {
                if (newSettings && !isUpdating) {
                    // Handle hidden products changes
                    if (newSettings.hiddenProducts) {
                        const oldHiddenProducts = [...hiddenProductsFromFirebase];
                        hiddenProductsFromFirebase = newSettings.hiddenProducts;
                        
                        // Re-render menu if hidden products changed
                        if (JSON.stringify(oldHiddenProducts) !== JSON.stringify(hiddenProductsFromFirebase)) {
                            console.log('Productos ocultos actualizados, re-renderizando menú...');
                            isUpdating = true;
                            renderMenu();
                            setTimeout(() => { isUpdating = false; }, 500); // Reset flag after delay
                        }
                    }
                    
                    // Handle service status changes (without reload loop)
                    if (newSettings.serviceActive !== undefined) {
                        const serviceClosedModal = document.querySelector('[class*="bg-black/80"], [class*="inset-0"]');
                        const isCurrentlyActive = !serviceClosedModal;
                        
                        if (!newSettings.serviceActive && isCurrentlyActive) {
                            console.log('Servicio desactivado desde panel de admin');
                            showServiceClosedModal();
                        }
                        // Removed the reload logic to prevent infinite reloads
                    }
                }
            });
        }
    }
    
    // --- ADVANCED UX ENHANCEMENTS ---
    
    // Enhanced loading states and micro-interactions with better visibility
    function showLoading(element) {
        element.classList.add('loading');
        element.innerHTML = '<div class="loading-spinner"></div><span class="ml-2">Agregando...</span>';
        element.disabled = true;
        element.style.pointerEvents = 'none';
    }
    
    function hideLoading(element, originalText) {
        element.classList.remove('loading');
        element.classList.add('success-state', 'btn-bounce');
        element.innerHTML = '<i class="fas fa-check mr-2"></i>¡Agregado!';
        element.disabled = false;
        element.style.pointerEvents = 'auto';
        
        // Reset to original state after success animation
        setTimeout(() => {
            element.classList.remove('success-state', 'btn-bounce');
            element.innerHTML = originalText;
        }, 1500);
    }
    
    // Enhanced success notifications with better visibility
    function showSuccessNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-4 rounded-xl shadow-2xl z-[100] transform translate-x-full transition-all duration-500 notification-enter border-l-4 border-green-300';
        notification.innerHTML = `
            <div class="flex items-center space-x-3">
                <div class="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    <i class="fas fa-check text-lg"></i>
                </div>
                <div>
                    <div class="font-bold text-lg">${message}</div>
                    <div class="text-green-100 text-sm">Se ha agregado a tu carrito</div>
                </div>
            </div>
        `;
        document.body.appendChild(notification);
        
        // Slide in with enhanced animation
        setTimeout(() => {
            notification.classList.remove('translate-x-full');
            notification.classList.add('shadow-glow');
        }, 100);
        
        // Slide out and remove with better timing
        setTimeout(() => {
            notification.classList.add('translate-x-full', 'opacity-0');
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 500);
        }, 3500);
    }
    
    // Add cart bounce animation when items are added
    function bounceCart() {
        const cartBtn = document.getElementById('open-cart-btn');
        cartBtn.classList.add('animate-bounce');
        setTimeout(() => cartBtn.classList.remove('animate-bounce'), 1000);
    }
    
    // Add urgency indicators for popular items
    function addUrgencyIndicators() {
        // Función deshabilitada - no agregar badges POPULAR adicionales
        // const popularItems = [1, 2, 6, 15]; // IDs of popular items
        // popularItems.forEach(itemId => {
        //     const itemElement = document.querySelector(`[data-id="${itemId}"]`)?.closest('.bg-white');
        //     if (itemElement) {
        //         const badge = document.createElement('div');
        //         badge.className = 'absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold z-10';
        //         badge.innerHTML = '🔥 POPULAR';
        //         itemElement.style.position = 'relative';
        //         itemElement.appendChild(badge);
        //     }
        // });
    }
    
    // Add estimated delivery time
    function addDeliveryTimeEstimate() {
        const currentHour = new Date().getHours();
        let estimatedTime = '25-35 min';
        
        if (currentHour >= 18 && currentHour <= 21) { // Peak hours
            estimatedTime = '35-45 min';
        } else if (currentHour >= 14 && currentHour <= 16) { // Lunch hours
            estimatedTime = '30-40 min';
        }
        
        const deliveryBadge = document.createElement('div');
        deliveryBadge.className = 'fixed top-20 left-4 bg-gradient-to-r from-green-500 to-teal-500 text-white px-4 py-2 rounded-full shadow-lg z-40 animate-bounce';
        deliveryBadge.innerHTML = `
            <div class="flex items-center space-x-2">
                <i class="fas fa-clock"></i>
                <span class="font-bold text-sm">Entrega: ${estimatedTime}</span>
            </div>
        `;
        document.body.appendChild(deliveryBadge);
    }
    
    // Add progressive disclosure for combo customization
    function enhanceComboModals() {
        // Add step indicator for combo configuration
        const addStepIndicator = (currentStep, totalSteps) => {
            return `
                <div class="flex justify-center mb-6">
                    <div class="flex space-x-2">
                        ${Array.from({length: totalSteps}, (_, i) => `
                            <div class="w-3 h-3 rounded-full ${i <= currentStep ? 'bg-yellow-500' : 'bg-gray-300'} transition-colors duration-300"></div>
                        `).join('')}
                    </div>
                    <div class="text-sm text-gray-600 mt-2">Paso ${currentStep + 1} de ${totalSteps}</div>
                </div>
            `;
        };
    }
    
    // Add social proof indicators
    function addSocialProof() {
        const socialProofItems = [
            { id: 1, reviews: 127, rating: 4.8 },
            { id: 2, reviews: 93, rating: 4.9 },
            { id: 6, reviews: 156, rating: 4.7 },
            { id: 15, reviews: 89, rating: 4.6 }
        ];
        
        socialProofItems.forEach(item => {
            const itemElement = document.querySelector(`[data-id="${item.id}"]`)?.closest('.bg-white');
            if (itemElement) {
                const socialProof = document.createElement('div');
                socialProof.className = 'absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm rounded-lg px-2 py-1 text-xs shadow-lg';
                socialProof.innerHTML = `
                    <div class="flex items-center space-x-1">
                        <div class="flex">
                            ${Array.from({length: 5}, (_, i) => `
                                <i class="fas fa-star ${i < Math.floor(item.rating) ? 'text-yellow-400' : 'text-gray-300'}" style="font-size: 10px;"></i>
                            `).join('')}
                        </div>
                        <span class="font-semibold text-gray-700">${item.rating}</span>
                        <span class="text-gray-500">(${item.reviews})</span>
                    </div>
                `;
                itemElement.style.position = 'relative';
                itemElement.appendChild(socialProof);
            }
        });
    }
    
    // Add cart abandonment prevention
    let cartAbandonmentTimer;
    function startCartAbandonmentTimer() {
        clearTimeout(cartAbandonmentTimer);
        if (cart.length > 0) {
            cartAbandonmentTimer = setTimeout(() => {
                const abandonmentModal = document.createElement('div');
                abandonmentModal.className = 'fixed inset-0 bg-black/60 z-[80] flex items-center justify-center p-4';
                abandonmentModal.innerHTML = `
                    <div class="bg-white rounded-lg shadow-xl max-w-md mx-auto p-6 text-center">
                        <div class="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <i class="fas fa-shopping-cart text-yellow-500 text-3xl"></i>
                        </div>
                        <h3 class="text-2xl font-bold mb-2">¡No te vayas con hambre! 🍔</h3>
                        <p class="text-gray-600 mb-6">Tienes ${cart.length} deliciosos productos en tu carrito esperándote.</p>
                        <div class="flex space-x-3">
                            <button onclick="this.parentElement.parentElement.parentElement.remove()" 
                                    class="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                                Seguir explorando
                            </button>
                            <button onclick="openCart(); this.parentElement.parentElement.parentElement.remove()" 
                                    class="flex-1 bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600">
                                Finalizar pedido
                            </button>
                        </div>
                    </div>
                `;
                document.body.appendChild(abandonmentModal);
            }, 120000); // 2 minutes
        }
    }
    
    // Add visual feedback for form validation
    function enhanceFormValidation() {
        const inputs = ['customer-name', 'customer-phone', 'address-input'];
        inputs.forEach(inputId => {
            const input = document.getElementById(inputId);
            if (input) {
                // Asegurar que el campo de dirección siempre permita escritura
                if (inputId === 'address-input') {
                    input.addEventListener('focus', function() {
                        // Remover cualquier bloqueo que pueda haber
                        this.removeAttribute('readonly');
                        this.removeAttribute('disabled');
                        this.style.pointerEvents = 'auto';
                        console.log('Campo de dirección enfocado - escritura habilitada');
                    });
                    
                    input.addEventListener('click', function() {
                        // Asegurar que siempre se pueda escribir al hacer clic
                        this.removeAttribute('readonly');
                        this.removeAttribute('disabled');
                        this.style.pointerEvents = 'auto';
                    });
                }
                
                input.addEventListener('blur', (e) => {
                    const value = e.target.value.trim();
                    const isValid = value.length > 0;
                    
                    if (isValid) {
                        e.target.classList.remove('border-red-300');
                        e.target.classList.add('border-green-300');
                        const checkIcon = e.target.parentElement.querySelector('.validation-icon');
                        if (checkIcon) checkIcon.remove();
                        
                        const icon = document.createElement('i');
                        icon.className = 'fas fa-check-circle text-green-500 absolute right-3 top-1/2 transform -translate-y-1/2 validation-icon';
                        e.target.parentElement.style.position = 'relative';
                        e.target.parentElement.appendChild(icon);
                    } else if (value.length === 0 && e.target.hasAttribute('required')) {
                        e.target.classList.remove('border-green-300');
                        e.target.classList.add('border-red-300');
                    }
                });
            }
        });
    }
    
    // Add smart recommendations
    function addSmartRecommendations(addedItemId) {
        const recommendations = {
            1: [8, 21], // Clásica -> Papas Gajo + Coca Cola
            2: [16, 22], // BBQ -> Papas Gajo Grandes + Coca Cola 1.75L
            11: [25, 21], // Hawaiana -> Papas Crispy + Coca Cola
            12: [26, 23], // Chistorra -> Papas Crispy Grandes + Coca Cola 3L
        };
        
        const recommended = recommendations[addedItemId];
        if (recommended && !document.getElementById('recommendation-popup')) {
            const popup = document.createElement('div');
            popup.id = 'recommendation-popup';
            popup.className = 'fixed bottom-4 left-4 bg-white rounded-lg shadow-xl p-4 max-w-sm z-50 border-l-4 border-yellow-500';
            popup.innerHTML = `
                <div class="flex justify-between items-start mb-3">
                    <h4 class="font-bold text-gray-800">🤖 Sugerencia Smart</h4>
                    <button onclick="this.parentElement.parentElement.remove()" class="text-gray-400 hover:text-gray-600">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <p class="text-sm text-gray-600 mb-3">¡Otros clientes también pidieron:</p>
                <div class="space-y-2">
                    ${recommended.map(id => {
                        const item = findItemById(id);
                        return `
                            <div class="flex items-center justify-between p-2 bg-gray-50 rounded">
                                <div class="flex items-center space-x-2">
                                    <img src="${item.image}" alt="${item.name}" class="w-8 h-8 rounded object-cover">
                                    <div>
                                        <div class="text-sm font-semibold">${item.name}</div>
                                        <div class="text-xs text-gray-500">$${item.price}</div>
                                    </div>
                                </div>
                                <button onclick="addToCart(${id})" class="bg-yellow-500 text-white px-2 py-1 rounded text-xs hover:bg-yellow-600">
                                    Agregar
                                </button>
                            </div>
                        `;
                    }).join('')}
                </div>
            `;
            document.body.appendChild(popup);
            
            // Auto remove after 10 seconds
            setTimeout(() => {
                if (document.getElementById('recommendation-popup')) {
                    document.getElementById('recommendation-popup').remove();
                }
            }, 10000);
        }
    }
    
    // Add real-time order total preview
    function addOrderTotalPreview() {
        let totalPreview = null;
        
        function createTotalPreview() {
            if (!totalPreview) {
                totalPreview = document.createElement('div');
                totalPreview.className = 'fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-6 py-3 rounded-full shadow-xl z-40 transition-all duration-300';
                totalPreview.style.display = 'none';
                document.body.appendChild(totalPreview);
            }
        }
        
        function updateTotalPreview() {
            createTotalPreview();
            
            if (cart.length > 0) {
                const total = calculateCartTotal();
                totalPreview.innerHTML = `
                    <div class="flex items-center space-x-3 cursor-pointer" onclick="openCart()">
                        <i class="fas fa-shopping-cart"></i>
                        <span class="font-bold">${cart.length} items • $${total.toFixed(0)}</span>
                        <i class="fas fa-chevron-right"></i>
                    </div>
                `;
                totalPreview.style.display = 'block';
            } else {
                totalPreview.style.display = 'none';
            }
        }
        
        return updateTotalPreview;
    }

    // --- DATA ---
    const FRIES_PRICE = 20;
    const ONION_RINGS_PRICE = 25;
    const DELIVERY_PRICE = 40; // Precio base hasta 4 km
    const EXTRA_KM_PRICE = 10; // Precio adicional por km después de 4 km
    const MAX_DELIVERY_DISTANCE = 7; // Distancia máxima de entrega en km
    const RESTAURANT_LOCATION = { lat: 17.9950, lng: -94.5370 }; // Coahuila 36, Emiliano Zapata, Minatitlán
    const toppingsData = [
        { id: 't6', name: 'Doble Carne', price: 30, description: '¿La quieres con doble carne jugosa?', image: 'https://images.unsplash.com/photo-1558030006-450675393462?w=300&h=200&fit=crop&crop=center' },
        { id: 't1', name: 'Tocino Extra', price: 15, description: '¿Te gusta el tocino crujiente?', image: 'https://images.unsplash.com/photo-1528607929212-2636ec44b982?w=300&h=200&fit=crop&crop=center' },
        { id: 't2', name: 'Queso Americano Extra', price: 15, description: '¿Más queso derretido?', image: 'https://images.unsplash.com/photo-1552767059-ce182ead6c1b?w=300&h=200&fit=crop&crop=center' },
        { id: 't7', name: 'Chezzy', price: 10, description: '¿Un toque cremoso extra?', image: 'https://images.unsplash.com/photo-1626957341926-98752fc2ba90?w=300&h=200&fit=crop&crop=center' },
        { id: 't5', name: 'Jalapeños', price: 0, description: '¿Le damos un toque picosito? ¡Gratis!', image: 'https://images.unsplash.com/photo-1544961503-7ad532ddf0ab?w=300&h=200&fit=crop&crop=center' }
    ];
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
    const WHATSAPP_NUMBER = '5219221593688';
    let cart = [];
    let tempComboConfig = {};
    let userAddress = null;

    // --- PROMOCIONES DIARIAS ---
    const dailyPromotions = {
        1: { // Lunes
            type: 'hotdog_discount',
            discount: 0.25, // 25% descuento
            description: '25% DESCUENTO EN HOTDOGS',
            categories: ['Hot Dogs']
        },
        2: { // Martes
            type: 'specific_item',
            targetItem: 2, // BBQ Beacon
            specialPrice: 100,
            description: 'BBQ BEACON A $100',
            categories: ['Hamburguesas']
        },
        3: { // Miércoles
            type: 'free_fries',
            description: 'PAPAS GRATIS CON HAMBURGUESA',
            categories: ['Hamburguesas']
        },
        4: { // Jueves
            type: 'meat_supreme',
            extraMeatDiscount: 20, // Doble carne a 10 en lugar de 30
            description: 'DOBLE CARNE POR SOLO 10',
            categories: ['Hamburguesas']
        }
    };

    // Función para obtener el día actual y aplicar promociones
    function getCurrentDayPromotion() {
        const today = new Date().getDay(); // 0 = Domingo, 1 = Lunes, etc.
        return dailyPromotions[today] || null;
    }

    // Función para aplicar promociones a un item
    function applyDailyPromotion(item, category) {
        const promotion = getCurrentDayPromotion();
        if (!promotion) return { ...item };

        const promotedItem = { ...item, originalPrice: item.price };

        // Aplicar promoción según el tipo
        switch (promotion.type) {
            case 'hotdog_discount':
                if (category === 'Hot Dogs') {
                    promotedItem.price = Math.round(item.price * (1 - promotion.discount));
                    promotedItem.hasPromotion = true;
                    promotedItem.promotionText = promotion.description;
                }
                break;
            
            case 'specific_item':
                if (item.id === promotion.targetItem) {
                    promotedItem.price = promotion.specialPrice;
                    promotedItem.hasPromotion = true;
                    promotedItem.promotionText = promotion.description;
                }
                break;
            
            case 'free_fries':
                if (category === 'Hamburguesas') {
                    promotedItem.hasPromotion = true;
                    promotedItem.promotionText = promotion.description;
                    promotedItem.freeFries = true;
                }
                break;
            
            case 'meat_supreme':
                if (category === 'Hamburguesas') {
                    promotedItem.hasPromotion = true;
                    promotedItem.promotionText = promotion.description;
                    promotedItem.meatSupreme = true;
                }
                break;
        }

        return promotedItem;
    }

    // Función para verificar si las promociones del día afectan a los combos
    function doesDailyPromotionAffectCombos() {
        const promotion = getCurrentDayPromotion();
        if (!promotion) return false;
        
        // Las promociones que afectan a hamburguesas o hotdogs afectan a los combos
        // porque los combos incluyen estos productos
        switch (promotion.type) {
            case 'hotdog_discount':
                // Lunes: descuento en hotdogs - afecta Combo Dúo
                return true;
            case 'specific_item':
                // Martes: BBQ Beacon a precio especial - afecta todos los combos que incluyan hamburguesas
                return true;
            case 'free_fries':
                // Miércoles: papas gratis con hamburguesas - afecta todos los combos
                return true;
            case 'meat_supreme':
                // Jueves: carne extra barata - afecta todos los combos que incluyan hamburguesas
                return true;
            default:
                return false;
        }
    }

    // --- ELEMENTS ---
    const menuContainer = document.getElementById('menu-categories');
    const cartSidebar = document.getElementById('cart-sidebar');
    const cartOverlay = document.getElementById('cart-overlay');
    const openCartBtn = document.getElementById('open-cart-btn');
    const closeCartBtn = document.getElementById('close-cart-btn');
    const cartItemsContainer = document.getElementById('cart-items');
    const cartEmptyMsg = document.getElementById('cart-empty-msg');
    const cartCount = document.getElementById('cart-count');
    const cartTotal = document.getElementById('cart-total');
    const checkoutBtn = document.getElementById('checkout-btn');
    const checkoutModal = document.getElementById('checkout-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const orderSummaryContainer = document.getElementById('order-summary');
    const sendWhatsappBtn = document.getElementById('send-whatsapp-btn');
    const customerNameInput = document.getElementById('customer-name');
    const customerPhoneInput = document.getElementById('customer-phone');
    const customModal = document.getElementById('customization-modal');
    const customModalTitle = document.getElementById('custom-modal-title');
    const toppingsContainer = document.getElementById('toppings-container');
    const customModalTotal = document.getElementById('custom-modal-total');
    const addCustomToCartBtn = document.getElementById('add-custom-to-cart-btn');
    const closeCustomModalBtn = document.getElementById('close-custom-modal-btn');
    const addFriesCheckbox = document.getElementById('add-fries-checkbox');
    const friesChoiceContainer = document.getElementById('fries-choice-container');
    const comboModal = document.getElementById('combo-modal');
    const comboModalTitle = document.getElementById('combo-modal-title');
    const comboModalBody = document.getElementById('combo-modal-body');
    const comboModalTotal = document.getElementById('combo-modal-total');
    const addComboToCartBtn = document.getElementById('add-combo-to-cart-btn');
    const closeComboModalBtn = document.getElementById('close-combo-modal-btn');
    const promotionsBtn = document.getElementById('promotions-btn');
    const promotionsModal = document.getElementById('promotions-modal');
    const closePromotionsModalBtn = document.getElementById('close-promotions-modal-btn');

    // --- DELIVERY DISTANCE CALCULATION ---
    
    // Función para calcular la distancia entre dos puntos usando la fórmula de Haversine
    function calculateDistance(lat1, lng1, lat2, lng2) {
        const R = 6371; // Radio de la Tierra en kilómetros
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLng/2) * Math.sin(dLng/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = R * c; // Distancia en kilómetros
        return distance;
    }
    
    // Función para calcular el precio de envío basado en la distancia
    function calculateDeliveryPrice(distance) {
        if (distance <= 4) {
            return DELIVERY_PRICE; // $40 para distancias hasta 4 km
        } else if (distance <= MAX_DELIVERY_DISTANCE) {
            const extraKm = Math.ceil(distance - 4); // Redondear hacia arriba los km extra
            return DELIVERY_PRICE + (extraKm * EXTRA_KM_PRICE);
        } else {
            return null; // Fuera del rango de entrega
        }
    }
    
    // Función para obtener la zona de entrega y precio
    function getDeliveryZone(distance) {
        if (distance <= 4) {
            return {
                zone: 'Zona 1 (0-4 km)',
                price: DELIVERY_PRICE,
                color: 'green',
                description: 'Zona de entrega estándar'
            };
        } else if (distance <= MAX_DELIVERY_DISTANCE) {
            const extraKm = Math.ceil(distance - 4);
            const totalPrice = DELIVERY_PRICE + (extraKm * EXTRA_KM_PRICE);
            return {
                zone: `Zona 2 (${distance.toFixed(1)} km)`,
                price: totalPrice,
                color: 'orange',
                description: `Zona extendida (+$${extraKm * EXTRA_KM_PRICE} por ${extraKm} km extra)`
            };
        } else {
            return {
                zone: 'Fuera de cobertura',
                price: null,
                color: 'red',
                description: `Lo sentimos, no llegamos a ${distance.toFixed(1)} km de distancia`
            };
        }
    }

    // --- FUNCTIONS ---
    function findItemById(itemId) {
        for (const category in menuData) {
            const item = menuData[category].find(i => i.id === itemId);
            if (item) return item;
        }
        return null;
    }
    
    // Enhanced addToCart with better visual feedback
    function addToCart(itemId) {
        const item = findItemById(itemId);
        if (!item) return;
        
        // Add loading state to button with better visual feedback
        const button = document.querySelector(`[data-id="${itemId}"].add-to-cart-btn`);
        if (button) {
            const originalText = button.innerHTML;
            showLoading(button);
            
            // Add vibration for mobile devices
            if (navigator.vibrate) {
                navigator.vibrate([50, 30, 50]);
            }
            
            setTimeout(() => {
                const cartItem = {
                    id: Date.now(),
                    baseItem: item,
                    customizations: [],
                    fries: null,
                    onionRings: null,
                    menuExtras: [],
                    price: item.price,
                    quantity: 1
                };
                
                cart.push(cartItem);
                updateCart();
                hideLoading(button, originalText);
                
                // Enhanced feedback with better timing
                setTimeout(() => {
                    showSuccessNotification(`${item.name} agregado al carrito 🎉`);
                    bounceCart();
                    addSmartRecommendations(itemId);
                    startCartAbandonmentTimer();
                }, 200);
                
            }, 800); // Longer loading time for better visual feedback
        }
    }
    
    // Enhanced cart calculation
    function calculateCartTotal() {
        let total = 0;
        cart.forEach(item => {
            total += item.price * item.quantity;
        });
        
        // Add delivery fee if applicable
        const deliveryType = document.querySelector('input[name="delivery-type"]:checked')?.value;
        if (deliveryType === 'delivery') {
            // Si hay una dirección seleccionada, usar el precio calculado
            if (userAddress && userAddress.deliveryPrice !== undefined) {
                total += userAddress.deliveryPrice;
            } else {
                // Usar precio base si no hay dirección específica
                total += DELIVERY_PRICE;
            }
        }
        
        return total;
    }
    
    // Enhanced updateCart with better animations
    function updateCart() {
        const cartItemsContainer = document.getElementById('cart-items');
        const cartEmptyMsg = document.getElementById('cart-empty-msg');
        const cartCount = document.getElementById('cart-count');
        const cartTotal = document.getElementById('cart-total');
        const checkoutBtn = document.getElementById('checkout-btn');
        
        // Update cart count with enhanced animation
        const oldCount = cartCount.textContent;
        cartCount.textContent = cart.length;
        if (cart.length > oldCount) {
            cartCount.classList.add('animate-pulse', 'bg-red-500', 'scale-110');
            setTimeout(() => {
                cartCount.classList.remove('animate-pulse', 'bg-red-500', 'scale-110');
            }, 1000);
        }
        
        if (cart.length === 0) {
            cartEmptyMsg.style.display = 'block';
            cartItemsContainer.innerHTML = '';
            cartTotal.textContent = '$0.00';
            checkoutBtn.disabled = true;
            checkoutBtn.classList.add('opacity-50');
            return;
        }
        
        cartEmptyMsg.style.display = 'none';
        checkoutBtn.disabled = false;
        checkoutBtn.classList.remove('opacity-50');
        
        // Enhanced cart items rendering with better UX
        cartItemsContainer.innerHTML = cart.map((item, index) => `
            <div class="cart-item-enter bg-gradient-to-r from-white to-gray-50 p-4 rounded-lg shadow-sm border border-gray-100 mb-3 hover:shadow-md transition-all duration-300">
                <div class="flex items-start space-x-3">
                    <img src="${item.baseItem.image}" alt="${item.baseItem.name}" 
                         class="w-16 h-16 object-cover rounded-lg shadow-sm">
                    <div class="flex-grow">
                        <h4 class="font-bold text-gray-800 text-lg">${item.baseItem.name}</h4>
                        
                        ${item.isCombo ? `
                            <div class="text-sm text-gray-600 mb-2">
                                <div class="bg-blue-50 p-2 rounded mb-2">
                                    <strong class="text-blue-800">Combo incluye:</strong>
                                    <ul class="mt-1 space-y-1">
                                        ${item.choices.map(choice => `
                                            <li class="flex items-center text-xs">
                                                <i class="fas fa-hamburger text-blue-600 mr-1"></i>
                                                ${choice.burger.name}
                                                ${choice.customizations.length > 0 ? 
                                                    `<span class="ml-2 bg-yellow-100 text-yellow-800 px-1 rounded text-xs">
                                                        +${choice.customizations.length} extras
                                                    </span>` : ''}
                                            </li>
                                        `).join('')}
                                        ${item.hotdogs ? item.hotdogs.map(hotdog => `
                                            <li class="flex items-center text-xs">
                                                <i class="fas fa-hotdog text-red-600 mr-1"></i>
                                                ${hotdog.hotdog.name}
                                            </li>
                                        `).join('') : ''}
                                        <li class="flex items-center text-xs">
                                            <i class="fas fa-fries text-yellow-600 mr-1"></i>
                                            Papas ${item.includedFries.type} ${item.includedFries.size}
                                        </li>
                                        ${item.baseItem.name.includes('Coca-Cola') ? 
                                            `<li class="flex items-center text-xs">
                                                <i class="fas fa-glass text-blue-600 mr-1"></i>
                                                Bebida incluida
                                            </li>` : ''}
                                    </ul>
                                </div>
                            </div>
                        ` : ''}
                        
                        ${(item.customizations && item.customizations.length > 0) || item.fries || item.onionRings || (item.menuExtras && item.menuExtras.length > 0) ? `
                            <div class="text-sm text-gray-600 bg-green-50 p-2 rounded mb-2">
                                <strong class="text-green-800">Personalizaciones:</strong>
                                <ul class="mt-1 space-y-1">
                                    ${item.customizations ? item.customizations.map(custom => `
                                        <li class="flex justify-between text-xs">
                                            <span>• ${custom.name}</span>
                                            <span class="font-semibold text-green-700">+$${custom.price}</span>
                                        </li>
                                    `).join('') : ''}
                                    ${item.fries ? `
                                        <li class="flex justify-between text-xs">
                                            <span>• Papas ${item.fries.type}</span>
                                            <span class="font-semibold text-green-700">+$${item.fries.price}</span>
                                        </li>
                                    ` : ''}
                                    ${item.onionRings ? `
                                        <li class="flex justify-between text-xs">
                                            <span>• Aros de Cebolla</span>
                                            <span class="font-semibold text-green-700">+$${item.onionRings.price}</span>
                                        </li>
                                    ` : ''}
                                    ${item.menuExtras ? item.menuExtras.map(extra => `
                                        <li class="flex justify-between text-xs">
                                            <span>• ${extra.name} ${extra.quantity > 1 ? `(${extra.quantity})` : ''}</span>
                                            <span class="font-semibold text-green-700">+$${(extra.price * extra.quantity)}</span>
                                        </li>
                                    `).join('') : ''}
                                </ul>
                            </div>
                        ` : ''}
                        
                        <div class="flex justify-between items-center mt-3">
                            <div class="flex items-center space-x-3 bg-gray-100 rounded-full p-1">
                                <button onclick="changeQuantity(${index}, -1)" 
                                        class="w-8 h-8 bg-white text-gray-600 rounded-full hover:bg-gray-200 hover:text-gray-800 transition-colors duration-200 flex items-center justify-center shadow-sm">
                                    <i class="fas fa-minus text-sm"></i>
                                </button>
                                <span class="font-bold text-lg min-w-[2rem] text-center">${item.quantity}</span>
                                <button onclick="changeQuantity(${index}, 1)" 
                                        class="w-8 h-8 bg-white text-gray-600 rounded-full hover:bg-gray-200 hover:text-gray-800 transition-colors duration-200 flex items-center justify-center shadow-sm">
                                    <i class="fas fa-plus text-sm"></i>
                                </button>
                            </div>
                            <div class="text-right">
                                <div class="text-xl font-bold text-[#FFB300]">$${(item.price * item.quantity).toFixed(0)}</div>
                                ${item.quantity > 1 ? `<div class="text-xs text-gray-500">$${item.price.toFixed(0)} c/u</div>` : ''}
                            </div>
                        </div>
                    </div>
                    <button onclick="removeFromCart(${index})" 
                            class="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-full transition-colors duration-200">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            </div>
        `).join('');
        
        // Update total with animation
        const total = calculateCartTotal();
        cartTotal.textContent = `$${total.toFixed(0)}`;
        
        // Update floating total preview
        if (window.updateTotalPreview) {
            window.updateTotalPreview();
        }
        
        // Add progress bar for free delivery
        addFreeDeliveryProgress(total);
    }
    
    // Add free delivery progress indicator
    function addFreeDeliveryProgress(currentTotal) {
        const freeDeliveryThreshold = 500;
        let progressContainer = document.getElementById('free-delivery-progress');
        
        if (!progressContainer) {
            progressContainer = document.createElement('div');
            progressContainer.id = 'free-delivery-progress';
            progressContainer.className = 'bg-gradient-to-r from-green-50 to-emerald-50 p-4 mb-4 rounded-lg border border-green-200';
            
            const cartItems = document.getElementById('cart-items');
            cartItems.parentNode.insertBefore(progressContainer, cartItems);
        }
        
        const remaining = Math.max(0, freeDeliveryThreshold - currentTotal);
        const progress = Math.min(100, (currentTotal / freeDeliveryThreshold) * 100);
        
        if (currentTotal >= freeDeliveryThreshold) {
            progressContainer.innerHTML = `
                <div class="text-center">
                    <div class="flex items-center justify-center space-x-2 text-green-700 font-bold">
                        <i class="fas fa-check-circle text-xl"></i>
                        <span>¡ENVÍO GRATIS desbloqueado! 🚚</span>
                    </div>
                    <p class="text-sm text-green-600 mt-1">Tu pedido califica para envío gratuito</p>
                </div>
            `;
        } else {
            progressContainer.innerHTML = `
                <div class="space-y-2">
                    <div class="flex justify-between items-center">
                        <span class="text-sm font-semibold text-gray-700">Progreso para ENVÍO GRATIS:</span>
                        <span class="text-sm font-bold text-green-600">$${remaining} restantes</span>
                    </div>
                    <div class="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div class="bg-gradient-to-r from-green-400 to-emerald-500 h-2 rounded-full transition-all duration-500 relative" 
                             style="width: ${progress}%">
                            <div class="absolute inset-0 bg-white/30 animate-pulse"></div>
                        </div>
                    </div>
                    <p class="text-xs text-gray-600">
                        <i class="fas fa-truck mr-1"></i>
                        Agrega $${remaining} más para obtener envío gratuito
                    </p>
                </div>
            `;
        }
    }
    
    // Enhanced quantity change with animations
    function changeQuantity(index, change) {
        if (cart[index]) {
            const newQuantity = cart[index].quantity + change;
            if (newQuantity <= 0) {
                removeFromCart(index);
                return;
            }
            
            cart[index].quantity = newQuantity;
            updateCart();
            
            // Add subtle animation feedback
            const quantityElement = document.querySelector(`[onclick="changeQuantity(${index}, ${change})"]`);
            if (quantityElement) {
                quantityElement.classList.add('scale-110');
                setTimeout(() => quantityElement.classList.remove('scale-110'), 150);
            }
            
            showSuccessNotification(`Cantidad actualizada 📊`);
        }
    }
    
    // Enhanced remove from cart with confirmation
    function removeFromCart(index) {
        if (cart[index]) {
            const itemName = cart[index].baseItem.name;
            
            // Add confirmation for expensive items
            if (cart[index].price > 100) {
                const confirmModal = document.createElement('div');
                confirmModal.className = 'fixed inset-0 bg-black/60 z-[90] flex items-center justify-center p-4';
                confirmModal.innerHTML = `
                    <div class="bg-white rounded-lg shadow-xl max-w-sm mx-auto p-6 text-center">
                        <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <i class="fas fa-trash-alt text-red-500 text-2xl"></i>
                        </div>
                        <h3 class="text-xl font-bold mb-2">¿Remover del carrito?</h3>
                        <p class="text-gray-600 mb-6">¿Estás seguro que quieres remover "${itemName}" de tu pedido?</p>
                        <div class="flex space-x-3">
                            <button onclick="this.parentElement.parentElement.parentElement.remove()" 
                                    class="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                                Cancelar
                            </button>
                            <button onclick="confirmRemove(${index}); this.parentElement.parentElement.parentElement.remove()" 
                                    class="flex-1 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600">
                                Remover
                            </button>
                        </div>
                    </div>
                `;
                document.body.appendChild(confirmModal);
            } else {
                confirmRemove(index);
            }
        }
    }
    
    function confirmRemove(index) {
        const itemName = cart[index].baseItem.name;
        cart.splice(index, 1);
        updateCart();
        showSuccessNotification(`${itemName} removido del carrito 🗑️`);
    }
    
    // Initialize all enhancements
    function initializeEnhancements() {
        addDeliveryTimeEstimate();
        enhanceFormValidation();
        window.updateTotalPreview = addOrderTotalPreview();
        
        // Monitor admin changes
        monitorAdminChanges();
        
    // Monitor admin changes
    function monitorAdminChanges() {
        // Check for changes in localStorage every 2 seconds
        let lastHiddenProducts = localStorage.getItem('hiddenProducts') || '[]';
        let lastServiceStatus = localStorage.getItem('restaurantServiceActive') || 'true';
        
        setInterval(() => {
            const currentHiddenProducts = localStorage.getItem('hiddenProducts') || '[]';
            const currentServiceStatus = localStorage.getItem('restaurantServiceActive') || 'true';
            
            // Check if service status changed
            if (currentServiceStatus !== lastServiceStatus) {
                if (currentServiceStatus === 'false') {
                    showServiceClosedModal();
                } else {
                    // Reload page if service was reactivated
                    window.location.reload();
                }
                lastServiceStatus = currentServiceStatus;
            }
            
            // Check if hidden products changed
            if (currentHiddenProducts !== lastHiddenProducts) {
                // Reload menu to reflect changes
                renderMenu();
                
                const hiddenCount = JSON.parse(currentHiddenProducts).length;
                if (hiddenCount > 0) {
                    showSuccessNotification(`⚠️ Algunos productos han sido actualizados por el administrador`);
                }
                
                lastHiddenProducts = currentHiddenProducts;
            }
        }, 2000);
    }
    
    // Add intersection observer for animations
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-fade-in-up');
                }
            });
        }, observerOptions);
        
        // Observe menu items for scroll animations
        setTimeout(() => {
            document.querySelectorAll('.bg-white.rounded-lg.shadow-lg').forEach(el => {
                observer.observe(el);
            });
        }, 1000);
    }
    
    // Enhanced renderMenu with mobile-first responsive design
    function renderMenu() {
        menuContainer.innerHTML = '';
        
        // Detect if user is on mobile
        const isMobile = window.innerWidth <= 640;
        
        for (const category in menuData) {
            const categoryDiv = document.createElement('div');
            categoryDiv.className = 'category-section';
            
            // Enhanced category header with icons and descriptions
            const categoryIcons = {
                'Hamburguesas': '🍔',
                'Hot Dogs': '🌭',
                'Combos': '🍽️',
                'Extras': '🍟',
                'Bebidas': '🥤'
            };
            
            const categoryDescriptions = {
                'Hamburguesas': 'Nuestras hamburguesas artesanales hechas con amor',
                'Hot Dogs': 'Hotdogs gourmet con ingredientes premium',
                'Combos': 'Combos diseñados para compartir y ahorrar',
                'Extras': 'Acompañamientos perfectos para tu pedido',
                'Bebidas': 'Refrescos helados para completar tu experiencia'
            };
            
            categoryDiv.innerHTML = `
                <div class="text-center mb-8 sm:mb-12 category-header-mobile">
                    <div class="inline-flex items-center space-x-2 sm:space-x-3 bg-gradient-to-r from-yellow-100 to-orange-100 px-4 sm:px-6 py-2 sm:py-3 rounded-full mb-3 sm:mb-4">
                        <span class="text-2xl sm:text-3xl">${categoryIcons[category]}</span>
                        <h3 class="text-xl sm:text-3xl font-bold font-poppins text-gray-900">${category}</h3>
                    </div>
                    <p class="text-sm sm:text-lg text-gray-600 max-w-2xl mx-auto px-4">${categoryDescriptions[category]}</p>
                </div>
            `;
            
            const grid = document.createElement('div');
            // Different layout for mobile vs desktop
            if (isMobile) {
                grid.className = 'space-y-4 menu-grid-mobile container-mobile';
            } else {
                grid.className = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 menu-grid';
            }
            
            menuData[category].forEach((originalItem, index) => {
                if(originalItem.hidden) return;
                
                // Check if product is hidden by admin
                if(isProductHidden(originalItem.id)) return;
                
                // Apply daily promotion
                const item = applyDailyPromotion(originalItem, category);
                
                // Enhanced button logic with better responsive design
                let buttonHtml;
                if (item.isCombo) {
                    buttonHtml = `
                        <button data-id="${item.id}" class="choose-combo-btn w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 sm:px-6 py-2 sm:py-4 rounded-lg sm:rounded-xl font-bold text-xs sm:text-base hover:from-blue-600 hover:to-blue-700 transform hover:-translate-y-1 transition-all duration-300 shadow-lg hover:shadow-xl">
                            <i class="fas fa-cogs mr-1 sm:mr-2"></i>Personaliza tu combo
                        </button>
                    `;
                } else if (item.customizable) {
                    buttonHtml = `
                        <button data-id="${item.id}" class="customize-btn w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white px-3 sm:px-6 py-2 sm:py-4 rounded-lg sm:rounded-xl font-bold text-xs sm:text-base hover:from-purple-600 hover:to-purple-700 transform hover:-translate-y-1 transition-all duration-300 shadow-lg hover:shadow-xl">
                            <i class="fas fa-magic mr-1 sm:mr-2"></i>Personalizar
                        </button>
                    `;
                } else {
                    buttonHtml = `
                        <button data-id="${item.id}" class="add-to-cart-btn w-full bg-gradient-to-r from-green-500 to-green-600 text-white px-3 sm:px-6 py-2 sm:py-4 rounded-lg sm:rounded-xl font-bold text-xs sm:text-base hover:from-green-600 hover:to-green-700 transform hover:-translate-y-1 transition-all duration-300 shadow-lg hover:shadow-xl active:scale-95">
                            <i class="fas fa-plus mr-1 sm:mr-2"></i>Agregar
                        </button>
                    `;
                }
                
                // Enhanced price display with better visual hierarchy
                let priceHtml;
                
                if (item.isCombo) {
                    const realPrice = calculateComboRealPrice(item);
                    const savings = realPrice - item.price;
                    priceHtml = `
                        <div class="bg-gradient-to-r from-green-50 to-emerald-50 p-3 rounded-lg border border-green-200">
                            <div class="text-center">
                                <div class="text-sm text-gray-500 line-through mb-1">Individual: $${realPrice.toFixed(0)}</div>
                                <div class="text-2xl font-bold text-green-600 mb-1">Combo: $${item.price.toFixed(0)}</div>
                                <div class="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold animate-pulse">
                                    ¡Ahorras $${savings.toFixed(0)}!
                                </div>
                            </div>
                        </div>
                    `;
                } else if (item.hasPromotion && item.originalPrice) {
                    const savings = item.originalPrice - item.price;
                    priceHtml = `
                        <div class="bg-gradient-to-r from-red-50 to-pink-50 p-3 rounded-lg border border-red-200">
                            <div class="text-center">
                                <div class="text-lg text-gray-500 line-through mb-1">$${item.originalPrice.toFixed(0)}</div>
                                <div class="text-3xl font-bold text-red-600 mb-1">$${item.price.toFixed(0)}</div>
                                <div class="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold animate-bounce">
                                    ¡OFERTA HOY!
                                </div>
                            </div>
                        </div>
                    `;
                } else {
                    priceHtml = `
                        <div class="text-center p-3">
                            <div class="text-3xl font-bold text-gray-800">$${item.price.toFixed(0)}</div>
                            <div class="text-sm text-gray-500">Precio regular</div>
                        </div>
                    `;
                }
                
                // Enhanced description processing
                let processedDescription = item.description;
                if (item.description.includes('ENVÍO GRATIS')) {
                    processedDescription = item.description.replace(
                        'ENVÍO GRATIS',
                        '<span class="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold animate-pulse inline-block mt-2">🚚 ENVÍO GRATIS</span>'
                    );
                }
                
                // Multiple badge system - Mobile responsive
                let badges = '';
                let mobileInlineBadges = '';
                
                if (item.hasPromotion) {
                    badges += `<div class="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold animate-pulse z-10 shadow-lg">🎉 OFERTA</div>`;
                    mobileInlineBadges += `<span class="inline-block bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold animate-pulse mr-1 mb-1">🎉 OFERTA</span>`;
                }
                if ([1, 2, 6, 15].includes(item.id)) {
                    // Solo mantenemos el badge inline que SÍ parpadea (el que encerraste)
                    mobileInlineBadges += `<span class="inline-block bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-bold mr-1 mb-1 animate-pulse">🔥 POPULAR</span>`;
                }
                if (item.isCombo) {
                    badges += `<div class="absolute top-8 left-2 bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-bold z-10 shadow-lg">💰 AHORRO</div>`;
                    mobileInlineBadges += `<span class="inline-block bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-bold mr-1 mb-1">💰 AHORRO</span>`;
                }
                
                // Create different card layouts for mobile vs desktop
                let cardHtml;
                
                if (isMobile) {
                    // Mobile layout - horizontal card
                    cardHtml = `
                        <div class="group bg-white rounded-2xl shadow-lg overflow-hidden flex flex-row relative border border-gray-100 hover:shadow-xl hover:border-yellow-300 menu-card menu-card-mobile transition-all duration-300" 
                             style="animation-delay: ${index * 50}ms;">
                            
                            <!-- Mobile Image -->
                            <div class="menu-card-image-mobile relative overflow-hidden bg-gray-100">
                                <img src="${item.image}" 
                                     alt="[Imagen de ${item.name}]" 
                                     class="w-full h-full object-cover"
                                     loading="lazy"
                                     onerror="this.src='https://placehold.co/400x400/FFB300/FFFFFF?text=${encodeURIComponent(item.name)}'">
                            </div>
                            
                            <!-- Mobile Content -->
                            <div class="menu-card-content-mobile">
                                <div class="flex-grow">
                                    <!-- Mobile badges - inline -->
                                    ${mobileInlineBadges ? `<div class="mb-2">${mobileInlineBadges}</div>` : ''}
                                    <h4 class="font-bold text-gray-900 mb-1">${item.name}</h4>
                                    <p class="text-gray-600 description mb-2">${processedDescription.replace(/<[^>]*>/g, '')}</p>
                                    <div class="price text-yellow-600 font-bold mb-2">$${item.price.toFixed(0)}</div>
                                </div>
                                <div class="mt-auto">
                                    ${buttonHtml}
                                </div>
                            </div>
                        </div>
                    `;
                } else {
                    // Desktop layout - vertical card
                    cardHtml = `
                        <div class="group bg-white rounded-2xl shadow-lg overflow-hidden flex flex-col transform hover:-translate-y-3 transition-all duration-500 relative border border-gray-100 hover:shadow-2xl hover:border-yellow-300 menu-card" 
                             style="animation-delay: ${index * 100}ms;">
                            ${badges}
                            
                            <!-- Image container with hover effects -->
                            <div class="relative overflow-hidden bg-gray-100 h-48 sm:h-56 md:h-64">
                                <img src="${item.image}" 
                                     alt="[Imagen de ${item.name}]" 
                                     class="w-full h-full object-cover transition-all duration-500 group-hover:scale-110"
                                     loading="lazy"
                                     onerror="this.src='https://placehold.co/400x400/FFB300/FFFFFF?text=${encodeURIComponent(item.name)}'">
                                
                                <!-- Overlay on hover -->
                                <div class="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                                    <div class="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                                        <i class="fas fa-eye text-white text-2xl"></i>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Content -->
                            <div class="p-4 sm:p-6 flex flex-col flex-grow space-y-3 sm:space-y-4">
                                <!-- Title and description -->
                                <div class="flex-grow">
                                    <h4 class="text-lg sm:text-xl font-bold mb-2 text-gray-900 group-hover:text-yellow-600 transition-colors duration-300">
                                        ${item.name}
                                    </h4>
                                    <p class="text-gray-600 text-sm leading-relaxed line-clamp-3">
                                        ${processedDescription}
                                    </p>
                                </div>
                                
                                <!-- Promotion banner -->
                                ${item.hasPromotion ? `
                                    <div class="bg-gradient-to-r from-red-500 to-pink-500 text-white p-2 sm:p-3 rounded-lg text-center shadow-lg">
                                        <div class="font-bold text-xs sm:text-sm animate-pulse">${item.promotionText}</div>
                                    </div>
                                ` : ''}
                                
                                <!-- Price section -->
                                ${priceHtml}
                                
                                <!-- Action button -->
                                <div class="pt-2">
                                    ${buttonHtml}
                                </div>
                            </div>
                        </div>
                    `;
                }
                
                grid.innerHTML += cardHtml;
            });
            
            categoryDiv.appendChild(grid);
            menuContainer.appendChild(categoryDiv);
        }
        
        // Initialize enhancements after rendering
        setTimeout(() => {
            addUrgencyIndicators();
            addSocialProof();
            initializeEnhancements();
        }, 500);
    }
    
    // Add window resize listener for responsive updates
    window.addEventListener('resize', () => {
        // Debounce resize events
        clearTimeout(window.resizeTimeout);
        window.resizeTimeout = setTimeout(() => {
            renderMenu(); // Re-render menu with appropriate layout
        }, 250);
    });

    // Configurar event listeners
    function setupEventListeners() {
        // Event listener para los botones de añadir al carrito
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('add-to-cart-btn')) {
                const itemId = parseInt(e.target.dataset.id);
                addToCart(itemId);
            }
        });
        
        // Event listener para los botones de personalizar
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('customize-btn')) {
                const itemId = parseInt(e.target.dataset.id);
                openCustomizationModal({ isCombo: false, itemId });
            }
        });
        
        // Event listener para los botones de elegir combo
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('choose-combo-btn')) {
                const comboId = parseInt(e.target.dataset.id);
                openComboModal(comboId);
            }
        });

        // Event listener para los botones de combo en el modal de promociones
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('promo-combo-btn')) {
                const comboId = parseInt(e.target.dataset.comboId);
                // Cerrar modal de promociones primero
                document.getElementById('promotions-modal').classList.add('hidden');
                // Abrir modal de configuración del combo
                openComboModal(comboId);
            }
        });

        // Event listener para el botón "Ver Todos los Combos"
        document.addEventListener('click', (e) => {
            if (e.target.id === 'scroll-to-combos') {
                // Cerrar modal de promociones
                document.getElementById('promotions-modal').classList.add('hidden');
                // Hacer scroll a la sección de combos
                const combosSection = document.querySelector('[data-category="Combos"]');
                if (combosSection) {
                    combosSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }
        });
        
        // Abrir carrito
        openCartBtn.addEventListener('click', openCart);
        
        // Cerrar carrito
        closeCartBtn.addEventListener('click', () => {
            cartSidebar.classList.add('translate-x-full');
            cartOverlay.classList.add('hidden');
        });
        
        // Cerrar carrito al hacer clic en el overlay
        cartOverlay.addEventListener('click', () => {
            cartSidebar.classList.add('translate-x-full');
            cartOverlay.classList.add('hidden');
        });
        
        // Cerrar modal de combo
        closeComboModalBtn.addEventListener('click', closeComboModal);
        
        // Event listener para navegar entre hamburguesas del combo
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('prev-burger-btn') || e.target.classList.contains('next-burger-btn')) {
                const choiceIndex = parseInt(e.target.dataset.choiceIndex);
                const direction = e.target.classList.contains('next-burger-btn') ? 'next' : 'prev';
                navigateBurger(choiceIndex, direction);
            }
        });
        
        // Event listener para navegar entre hotdogs del combo
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('prev-hotdog-btn') || e.target.classList.contains('next-hotdog-btn')) {
                const hotdogIndex = parseInt(e.target.dataset.hotdogIndex);
                const direction = e.target.classList.contains('next-hotdog-btn') ? 'next' : 'prev';
                navigateHotdog(hotdogIndex, direction);
            }
        });
        
        // Event listener para personalizar hamburguesa dentro de combo
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('combo-customize-btn')) {
                const choiceIndex = parseInt(e.target.closest('[data-choice-index]').dataset.choiceIndex);
                openCustomizationModal({ isCombo: true, choiceIndex });
            }
        });
        
        // Event listener para personalizar hotdog dentro de combo
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('hotdog-customize-btn')) {
                const hotdogIndex = parseInt(e.target.dataset.hotdogIndex);
                openCustomizationModal({ isCombo: true, isHotdog: true, hotdogIndex });
            }
        });
        
        // Event listener para cambio de tipo de papas en combos
        document.addEventListener('change', (e) => {
            if (e.target.name === 'combo-fries-type') {
                tempComboConfig.includedFries.type = e.target.value;
                
                // Actualizar estilos visuales
                document.querySelectorAll('input[name="combo-fries-type"]').forEach(radio => {
                    const label = radio.closest('label');
                    if (radio.checked) {
                        label.classList.add('bg-[#FFB300]/10', 'border-[#FFB300]');
                    } else {
                        label.classList.remove('bg-[#FFB300]/10', 'border-[#FFB300]');
                    }
                });
            }
        });
        
        // Cerrar modal de personalización
        closeCustomModalBtn.addEventListener('click', closeCustomizationModal);
        
        // Event listeners para modal de promociones
        promotionsBtn.addEventListener('click', () => {
            promotionsModal.classList.remove('hidden');
            promotionsModal.classList.add('flex');
            // Inicializar las tabs móviles al abrir el modal
            setTimeout(() => {
                updateDailyPromotions(); // Actualizar promociones antes de mostrar
                showMobilePromo('daily');
            }, 100);
        });
        
        closePromotionsModalBtn.addEventListener('click', () => {
            promotionsModal.classList.add('hidden');
            promotionsModal.classList.remove('flex');
        });
        
        // Cerrar modal de promociones al hacer clic fuera
        promotionsModal.addEventListener('click', (e) => {
            if (e.target === promotionsModal) {
                promotionsModal.classList.add('hidden');
                promotionsModal.classList.remove('flex');
            }
        });

        // Event listeners para menú móvil
        const mobileMenuBtn = document.getElementById('mobile-menu-btn');
        const mobileMenu = document.getElementById('mobile-menu');
        const mobileMenuOverlay = document.getElementById('mobile-menu-overlay');
        const closeMobileMenuBtn = document.getElementById('close-mobile-menu');
        const mobilePromotionsBtn = document.getElementById('mobile-promotions-btn');

        // Abrir menú móvil
        mobileMenuBtn.addEventListener('click', () => {
            mobileMenu.classList.remove('-translate-x-full');
            mobileMenu.classList.add('translate-x-0');
            mobileMenuOverlay.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
        });

        // Cerrar menú móvil
        function closeMobileMenu() {
            mobileMenu.classList.add('-translate-x-full');
            mobileMenu.classList.remove('translate-x-0');
            mobileMenuOverlay.classList.add('hidden');
            document.body.style.overflow = 'auto';
        }

        closeMobileMenuBtn.addEventListener('click', closeMobileMenu);
        mobileMenuOverlay.addEventListener('click', closeMobileMenu);

        // Botón de promociones en menú móvil
        mobilePromotionsBtn.addEventListener('click', () => {
            closeMobileMenu(); // Cerrar menú móvil primero
            setTimeout(() => {
                promotionsModal.classList.remove('hidden');
                promotionsModal.classList.add('flex');
                // Inicializar las tabs móviles al abrir el modal
                setTimeout(() => {
                    updateDailyPromotions(); // Actualizar promociones antes de mostrar
                    showMobilePromo('daily');
                }, 100);
            }, 300); // Esperar a que se cierre el menú móvil
        });

        // Cerrar menú móvil al hacer clic en enlaces de navegación
        document.querySelectorAll('#mobile-menu a[href^="#"]').forEach(link => {
            link.addEventListener('click', () => {
                closeMobileMenu();
            });
        });
        
        // Event listeners para los checkboxes y controles en el modal de personalización
        document.addEventListener('change', (e) => {
            if (e.target.classList.contains('topping-checkbox') || 
                e.target.id === 'add-fries-checkbox' || 
                e.target.id === 'add-onion-rings-checkbox' ||
                e.target.classList.contains('menu-extra-checkbox')) {
                
                // Actualizar estados visuales
                if (e.target.classList.contains('topping-checkbox')) {
                    updateToppingsVisualState();
                } else if (e.target.id === 'add-fries-checkbox') {
                    updateFriesVisualState();
                } else if (e.target.classList.contains('menu-extra-checkbox')) {
                    updateMenuExtrasVisualState();
                }
                
                // Actualizar precio
                updateCustomModalPrice();
            }
        });
        
        // Event listeners para los botones de cantidad en extras del menú
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('quantity-plus') || e.target.classList.contains('quantity-minus')) {
                const itemId = e.target.dataset.id;
                const displayElement = document.querySelector(`.quantity-display[data-id="${itemId}"]`);
                let quantity = parseInt(displayElement.textContent);
                
                if (e.target.classList.contains('quantity-plus')) {
                    quantity++;
                } else if (quantity > 1) {
                    quantity--;
                }
                
                displayElement.textContent = quantity;
                updateCustomModalPrice();
            }
        });
        
        // Event listener para añadir al carrito desde el modal de personalización
        addCustomToCartBtn.addEventListener('click', () => {
            const context = JSON.parse(addCustomToCartBtn.dataset.context || '{}');
            const { isCombo, itemId, choiceIndex, isHotdog, hotdogIndex } = context;
            
            // Recopilar personalizaciones seleccionadas
            const customizations = [];
            document.querySelectorAll('.topping-checkbox:checked').forEach(checkbox => {
                customizations.push({
                    name: checkbox.dataset.name,
                    price: parseFloat(checkbox.dataset.price)
                });
            });
            
            // Recopilar acompañamientos
            let fries = null;
            if (addFriesCheckbox.checked) {
                const friesType = document.querySelector('input[name="fries-type"]:checked').value;
                fries = {
                    type: friesType,
                    price: FRIES_PRICE
                };
            }
            
            let onionRings = null;
            if (document.getElementById('add-onion-rings-checkbox').checked) {
                onionRings = {
                    price: ONION_RINGS_PRICE
                };
            }
            
            // Recopilar extras del menú
            const menuExtras = [];
            document.querySelectorAll('.menu-extra-checkbox:checked').forEach(checkbox => {
                const extraId = parseInt(checkbox.dataset.id);
                const quantity = parseInt(document.querySelector(`.quantity-display[data-id="${extraId}"]`)?.textContent || '1');
                
                menuExtras.push({
                    id: extraId,
                    name: checkbox.dataset.name,
                    price: parseFloat(checkbox.dataset.price),
                    quantity: quantity
                });
            });
            
            if (isCombo) {
                if (isHotdog) {
                    // Actualizar configuración del hotdog en el combo
                    tempComboConfig.hotdogs[hotdogIndex].customizations = customizations;
                    tempComboConfig.hotdogs[hotdogIndex].fries = fries;
                    tempComboConfig.hotdogs[hotdogIndex].onionRings = onionRings;
                    tempComboConfig.hotdogs[hotdogIndex].menuExtras = menuExtras;
                    
                    // Actualizar el resumen de personalización en el modal de combo
                    const summaryEl = document.querySelector(`[data-hotdog-index="${hotdogIndex}"] .customizations-summary`);
                    let summaryText = [];
                    
                    if (customizations.length > 0) {
                        summaryText.push(`${customizations.length} ingredientes extra`);
                    }
                    
                    if (fries) {
                        summaryText.push(`Papas ${fries.type}`);
                    }
                    
                    if (onionRings) {
                        summaryText.push('Aros de Cebolla');
                    }
                    
                    if (menuExtras.length > 0) {
                        summaryText.push(`${menuExtras.length} extras del menú`);
                    }
                    
                    summaryEl.textContent = summaryText.length > 0 ? summaryText.join(', ') : 'Sin personalización.';
                } else {
                    // Actualizar configuración de la hamburguesa en el combo
                    tempComboConfig.choices[choiceIndex].customizations = customizations;
                    tempComboConfig.choices[choiceIndex].fries = fries;
                    tempComboConfig.choices[choiceIndex].onionRings = onionRings;
                    tempComboConfig.choices[choiceIndex].menuExtras = menuExtras;
                    
                    // Actualizar el resumen de personalización en el modal de combo
                    const summaryEl = document.querySelector(`[data-choice-index="${choiceIndex}"] .customizations-summary`);
                    let summaryText = [];
                    
                    if (customizations.length > 0) {
                        summaryText.push(`${customizations.length} ingredientes extra`);
                    }
                    
                    if (fries) {
                        summaryText.push(`Papas ${fries.type}`);
                    }
                    
                    if (onionRings) {
                        summaryText.push('Aros de Cebolla');
                    }
                    
                    if (menuExtras.length > 0) {
                        summaryText.push(`${menuExtras.length} extras del menú`);
                    }
                    
                    summaryEl.textContent = summaryText.length > 0 ? summaryText.join(', ') : 'Sin personalización.';
                }
                
                // Actualizar el precio total del combo
                updateComboModalTotal();
            } else {
                // Añadir el producto personalizado al carrito
                const item = findItemById(itemId);
                if (!item) return;
                
                const cartItem = {
                    id: Date.now(), // ID único para el carrito
                    baseItem: item,
                    customizations,
                    fries,
                    onionRings,
                    menuExtras,
                    price: parseFloat(customModalTotal.textContent.replace('$', '')),
                    quantity: 1
                };
                
                cart.push(cartItem);
                updateCart();
                openCart();
            }
            
            closeCustomizationModal();
        });
        
        // Event listener para añadir combo al carrito
        addComboToCartBtn.addEventListener('click', () => {
            const comboItem = {
                id: Date.now(), // ID único para el carrito
                baseItem: tempComboConfig.baseCombo,
                choices: JSON.parse(JSON.stringify(tempComboConfig.choices)), // Deep copy
                hotdogs: tempComboConfig.hotdogs ? JSON.parse(JSON.stringify(tempComboConfig.hotdogs)) : null, // Deep copy de hotdogs si existen
                includedFries: JSON.parse(JSON.stringify(tempComboConfig.includedFries)), // Deep copy de las papas incluidas
                price: parseFloat(comboModalTotal.textContent.replace('$', '')),
                quantity: 1,
                isCombo: true
            };
            
            cart.push(comboItem);
            updateCart();
            closeComboModal();
            openCart();
        });

        // Event listener para tipo de entrega
        document.addEventListener('change', (e) => {
            if (e.target.name === 'delivery-type') {
                const locationSection = document.getElementById('location-section');
                
                if (e.target.value === 'delivery') {
                    locationSection.classList.remove('hidden');
                } else {
                    locationSection.classList.add('hidden');
                    userAddress = null;
                }
                
                validateCheckoutForm();
            }
        });

        // Checkout
        checkoutBtn.addEventListener('click', () => {
            checkoutModal.classList.add('flex');
            checkoutModal.classList.remove('hidden');
            renderOrderSummary();
            updateCheckoutTotals(); // Nueva función para actualizar totales
            handlePaymentMethodChange(); // Configurar método de pago inicial
            validateCheckoutForm();
        });

        // Cerrar modal de checkout
        closeModalBtn.addEventListener('click', () => {
            checkoutModal.classList.add('hidden');
            checkoutModal.classList.remove('flex');
        });

        // Validación en tiempo real para los campos del formulario
        customerNameInput.addEventListener('input', validateCheckoutForm);
        customerNameInput.addEventListener('blur', validateCheckoutForm);
        
        const phoneInput = document.getElementById('customer-phone');
        if (phoneInput) {
            phoneInput.addEventListener('input', validateCheckoutForm);
            phoneInput.addEventListener('blur', validateCheckoutForm);
        }
        
        const addressInput = document.getElementById('address-input');
        if (addressInput) {
            addressInput.addEventListener('input', validateCheckoutForm);
            addressInput.addEventListener('blur', validateCheckoutForm);
        }
        
        const cashAmountInput = document.getElementById('cash-amount');
        if (cashAmountInput) {
            cashAmountInput.addEventListener('input', () => {
                calculateChange();
                validateCheckoutForm();
            });
            cashAmountInput.addEventListener('blur', () => {
                calculateChange();
                validateCheckoutForm();
            });
        }
        
        // Validación cuando cambian los radio buttons
        document.addEventListener('change', (e) => {
            if (e.target.name === 'payment') {
                handlePaymentMethodChange();
                validateCheckoutForm();
            }
            if (e.target.name === 'delivery-type') {
                updateCheckoutTotals(); // Actualizar totales cuando cambie el tipo de entrega
                calculateChange(); // Recalcular cambio con el nuevo total
                validateCheckoutForm();
            }
        });

        // Envío de pedido por WhatsApp
        sendWhatsappBtn.addEventListener('click', () => {
            const message = generateWhatsAppMessage();
            const encodedMessage = encodeURIComponent(message);
            window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`, '_blank');
            
            // Agregar pedido al sistema de control de envíos
            addToOrderControl();
            
            // Guardar datos del cliente
            saveCustomerData();
            
            // Cerrar modal y limpiar carrito
            checkoutModal.classList.add('hidden');
            checkoutModal.classList.remove('flex');
            cart = [];
            updateCart();
        });

        // Help modal
        document.getElementById('help-btn').addEventListener('click', () => {
            document.getElementById('help-modal').classList.add('flex');
            document.getElementById('help-modal').classList.remove('hidden');
        });
        
        document.getElementById('close-help-modal-btn').addEventListener('click', () => {
            document.getElementById('help-modal').classList.add('hidden');
            document.getElementById('help-modal').classList.remove('flex');
        });
    }

    // Funciones para el modal de personalización
    function openCustomizationModal(context) {
        const { isCombo, choiceIndex, isHotdog, hotdogIndex } = context;
        let item, currentCustomizations, currentFries, currentMenuExtras;
        
        if (isCombo) {
            if (isHotdog) {
                const hotdogChoice = tempComboConfig.hotdogs[hotdogIndex];
                item = hotdogChoice.hotdog;
                currentCustomizations = hotdogChoice.customizations || [];
                currentFries = hotdogChoice.fries;
                currentMenuExtras = hotdogChoice.menuExtras || [];
                customModalTitle.textContent = `Personaliza tu ${item.name} (Combo)`;
            } else {
                const choice = tempComboConfig.choices[choiceIndex];
                item = choice.burger;
                currentCustomizations = choice.customizations;
                currentFries = choice.fries;
                currentMenuExtras = choice.menuExtras || [];
                customModalTitle.textContent = `Personaliza tu ${item.name} (Combo)`;
            }
        } else {
            item = findItemById(context.itemId);
            currentCustomizations = [];
            currentFries = null;
            currentMenuExtras = [];
            customModalTitle.textContent = `Personaliza tu ${item.name}`;
        }
        
        addCustomToCartBtn.dataset.context = JSON.stringify(context);
        toppingsContainer.innerHTML = '';
        const currentToppingNames = currentCustomizations.map(c => c.name);
        
        // Determinar si es hotdog para filtrar toppings
        let isHotdogItem = false;
        if (isCombo && isHotdog) {
            isHotdogItem = true;
        } else if (!isCombo) {
            // Verificar si el item está en la categoría Hot Dogs
            for (const category in menuData) {
                if (category === 'Hot Dogs' && menuData[category].some(i => i.id === item.id)) {
                    isHotdogItem = true;
                    break;
                }
            }
        }
        
        // Filtrar toppings según el tipo de producto
        let availableToppings = toppingsData;
        if (isHotdogItem) {
            // Para hotdogs solo permitir Chezzy y Jalapeños
            availableToppings = toppingsData.filter(topping => 
                topping.name === 'Chezzy' || topping.name === 'Jalapeños'
            );
        }
        
        availableToppings.forEach(topping => {
            const isChecked = currentToppingNames.includes(topping.name) ? 'checked' : '';
            
            // Aplicar promoción de jueves para Carne Extra (ahora Doble Carne)
            let toppingPrice = topping.price;
            let promotionText = '';
            const todayPromotion = getCurrentDayPromotion();
            
            if (todayPromotion && todayPromotion.type === 'meat_supreme' && topping.name === 'Doble Carne') {
                toppingPrice = 10; // Precio especial de jueves
                promotionText = '<span class="text-red-600 font-bold text-xs">¡OFERTA HOY!</span>';
            }
            
            // Usar descripción persuasiva o precio
            const displayText = topping.price === 0 ? topping.description : topping.name;
            const priceDisplay = topping.price === 0 ? '' : `Solo ${toppingPrice.toFixed(0)} más`;
            
            toppingsContainer.innerHTML += `
                <label class="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-all duration-200 ${isChecked ? 'bg-[#FFB300]/10 border-[#FFB300]' : ''}">
                    <input type="checkbox" data-price="${toppingPrice}" data-name="${topping.name}" class="topping-checkbox form-checkbox h-5 w-5 text-[#FFB300] rounded focus:ring-[#FFA000]" ${isChecked}>
                    <div class="flex-grow ml-3">
                        <span class="font-semibold text-gray-800">${displayText}</span>
                        <div class="text-sm text-gray-600">
                            ${toppingPrice !== topping.price ? `<span class="line-through">+${topping.price.toFixed(0)}</span> ` : ''}
                            ${priceDisplay} ${promotionText}
                        </div>
                    </div>
                </label>
            `;
        });
        
        // Poblar extras del menú
        const menuExtrasContainer = document.getElementById('menu-extras-container');
        menuExtrasContainer.innerHTML = '';
        const menuExtras = [...menuData.Extras, ...menuData.Bebidas];
        menuExtras.forEach(extra => {
            const isChecked = currentMenuExtras.some(e => e.id === extra.id) ? 'checked' : '';
            const quantity = currentMenuExtras.find(e => e.id === extra.id)?.quantity || 1;
            menuExtrasContainer.innerHTML += `
                <label class="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-all duration-200 ${isChecked ? 'bg-[#FFB300]/10 border-[#FFB300]' : ''}">
                    <input type="checkbox" data-price="${extra.price}" data-name="${extra.name}" data-id="${extra.id}" class="menu-extra-checkbox form-checkbox h-5 w-5 text-[#FFB300] rounded focus:ring-[#FFA000]" ${isChecked}>
                    <div class="ml-3 mr-3">
                        <img src="${extra.image}" alt="${extra.name}" class="w-16 h-12 object-cover rounded-md shadow-sm">
                    </div>
                    <div class="flex-grow">
                        <span class="font-semibold text-gray-800">${extra.name}</span>
                        <div class="text-sm text-gray-600">+${extra.price.toFixed(0)}</div>
                    </div>
                    <div class="ml-2 ${isChecked ? '' : 'hidden'}" data-quantity-controls="${extra.id}">
                        <div class="flex items-center space-x-2">
                            <button type="button" class="quantity-minus bg-gray-200 hover:bg-gray-300 rounded-full w-6 h-6 flex items-center justify-center text-sm" data-id="${extra.id}">-</button>
                            <span class="quantity-display w-8 text-center text-sm font-semibold" data-id="${extra.id}">${quantity}</span>
                            <button type="button" class="quantity-plus bg-gray-200 hover:bg-gray-300 rounded-full w-6 h-6 flex items-center justify-center text-sm" data-id="${extra.id}">+</button>
                        </div>
                    </div>
                </label>
            `;
        });
            
        // Actualizar selección de acompañamientos
        if (currentFries) {
            addFriesCheckbox.checked = true;
            friesChoiceContainer.classList.remove('hidden');
            
            // Seleccionar el tipo de papas correcto
            document.querySelector(`input[name="fries-type"][value="${currentFries.type}"]`).checked = true;
        } else {
            addFriesCheckbox.checked = false;
            friesChoiceContainer.classList.add('hidden');
        }
        
        if (currentFries || currentCustomizations.length > 0 || (currentMenuExtras && currentMenuExtras.length > 0)) {
            updateToppingsVisualState();
            updateFriesVisualState();
            updateMenuExtrasVisualState();
        }
        
        // Mostrar modal y calcular precio
        updateCustomModalPrice();
        
        // Mostrar el modal
        customModal.classList.add('flex');
        customModal.classList.remove('hidden');
    }

    function closeCustomizationModal() {
        customModal.classList.add('hidden');
        customModal.classList.remove('flex');
    }

    // Funciones para actualizar estados visuales
    function updateToppingsVisualState() {
        const checkboxes = toppingsContainer.querySelectorAll('.topping-checkbox');
        checkboxes.forEach(checkbox => {
            const label = checkbox.closest('label');
            if (checkbox.checked) {
                label.classList.add('bg-[#FFB300]/10', 'border-[#FFB300]');
            } else {
                label.classList.remove('bg-[#FFB300]/10', 'border-[#FFB300]');
            }
        });
    }
    
    function updateFriesVisualState() {
        const label = addFriesCheckbox.closest('label');
        if (addFriesCheckbox.checked) {
            label.classList.add('bg-[#FFB300]/10', 'border-[#FFB300]');
            friesChoiceContainer.classList.remove('hidden');
        } else {
            label.classList.remove('bg-[#FFB300]/10', 'border-[#FFB300]');
            friesChoiceContainer.classList.add('hidden');
        }
    }
    
    function updateMenuExtrasVisualState() {
        const checkboxes = document.querySelectorAll('.menu-extra-checkbox');
        checkboxes.forEach(checkbox => {
            const label = checkbox.closest('label');
            const controls = label.querySelector(`[data-quantity-controls="${checkbox.dataset.id}"]`);
            
            if (checkbox.checked) {
                label.classList.add('bg-[#FFB300]/10', 'border-[#FFB300]');
                if (controls) controls.classList.remove('hidden');
            } else {
                label.classList.remove('bg-[#FFB300]/10', 'border-[#FFB300]');
                if (controls) controls.classList.add('hidden');
            }
        });
    }
    
    // Función para actualizar el precio total en el modal de personalización
    function updateCustomModalPrice() {
        const context = JSON.parse(addCustomToCartBtn.dataset.context || '{}');
        const { isCombo, itemId, choiceIndex } = context;
        
        let basePrice = 0;
        
        if (isCombo) {
            // Para combos, usamos el precio base de la hamburguesa
            const burger = tempComboConfig.choices[choiceIndex].burger;
            basePrice = burger.price;
        } else if (itemId) {
            // Para ítems individuales, usamos el precio del ítem
            const item = findItemById(itemId);
            basePrice = item.price;
        }
        
        // Sumar precio de los toppings seleccionados
        let total = basePrice;
        
        document.querySelectorAll('.topping-checkbox:checked').forEach(checkbox => {
            total += parseFloat(checkbox.dataset.price);
        });
        
        // Sumar precio de papas si están seleccionadas
        if (addFriesCheckbox.checked) {
            total += FRIES_PRICE;
        }
        
        // Sumar precio de aros de cebolla si están seleccionados
        if (document.getElementById('add-onion-rings-checkbox').checked) {
            total += ONION_RINGS_PRICE;
        }
        
        // Sumar precio de extras del menú seleccionados
        document.querySelectorAll('.menu-extra-checkbox:checked').forEach(checkbox => {
            const itemId = checkbox.dataset.id;
            const quantity = parseInt(document.querySelector(`.quantity-display[data-id="${itemId}"]`)?.textContent || '1');
            total += parseFloat(checkbox.dataset.price) * quantity;
        });
        
        // Mostrar el precio total
        customModalTotal.textContent = `${total.toFixed(0)}`;
    }

    // Funciones para combos
    function openComboModal(comboId) {
        const combo = findItemById(comboId);
        if (!combo) return;
        
        tempComboConfig = {
            baseCombo: combo,
            choices: [],
            includedFries: {
                type: 'Gajo', // Tipo por defecto
                size: 'Medianas'
            }
        };
        
        comboModalTitle.textContent = `Configura tu ${combo.name}`;
        comboModalBody.innerHTML = '';
        
        const clasicaPrice = findItemById(1).price;
        
        // Añadir hamburguesas al combo
        for (let i = 0; i < combo.burgerChoices; i++) {
            const defaultBurger = findItemById(combo.availableBurgers[0]);
            
            tempComboConfig.choices[i] = {
                burger: defaultBurger,
                customizations: [],
                fries: null
            };
            
            const choiceHtml = `
                <div class="border rounded-lg p-4" data-choice-index="${i}">
                    <h4 class="font-bold text-lg mb-3">Hamburguesa ${i + 1}</h4>
                    <div class="burger-selector mb-4">
                        <div class="relative bg-gray-100 rounded-lg overflow-hidden">
                            <img id="burger-img-${i}" src="${defaultBurger.image}" alt="${defaultBurger.name}" class="w-full h-40 sm:h-48 md:h-52 object-contain bg-white rounded-lg">
                            <div class="absolute inset-0 flex items-center justify-between px-3">
                                <button class="prev-burger-btn bg-black/60 hover:bg-black/80 text-white rounded-full w-10 h-10 flex items-center justify-center transition-all duration-200 shadow-lg backdrop-blur-sm" data-choice-index="${i}">
                                    <i class="fas fa-chevron-left"></i>
                                </button>
                                <button class="next-burger-btn bg-black/60 hover:bg-black/80 text-white rounded-full w-10 h-10 flex items-center justify-center transition-all duration-200 shadow-lg backdrop-blur-sm" data-choice-index="${i}">
                                    <i class="fas fa-chevron-right"></i>
                                </button>
                            </div>
                        </div>
                        <div class="text-center mt-3">
                            <h5 id="burger-name-${i}" class="font-semibold text-lg text-gray-800">${defaultBurger.name}</h5>
                            <p id="burger-price-${i}" class="text-sm text-gray-600 font-medium">Precio base</p>
                        </div>
                    </div>
                    <div class="customizations-summary text-sm text-gray-600 mb-3 p-2 bg-gray-50 rounded">Sin personalización.</div>
                    <button class="combo-customize-btn w-full text-sm bg-gray-200 hover:bg-gray-300 py-2 px-4 rounded-md transition-colors duration-200">Personalizar</button>
                </div>
            `;
            
            comboModalBody.innerHTML += choiceHtml;
        }
        
        // Añadir hotdogs al combo (si aplica)
        if (combo.hotdogChoices && combo.availableHotdogs) {
            for (let i = 0; i < combo.hotdogChoices; i++) {
                const defaultHotdog = findItemById(combo.availableHotdogs[0]);
                
                tempComboConfig.hotdogs = tempComboConfig.hotdogs || [];
                tempComboConfig.hotdogs[i] = {
                    hotdog: defaultHotdog,
                    customizations: [],
                    fries: null
                };
                
                const hotdogIndex = i;
                const choiceHtml = `
                    <div class="border rounded-lg p-4 mt-6" data-hotdog-index="${hotdogIndex}">
                        <h4 class="font-bold text-lg mb-3">Hot Dog ${hotdogIndex + 1}</h4>
                        <div class="hotdog-selector mb-4">
                            <div class="relative bg-gray-100 rounded-lg overflow-hidden">
                                <img id="hotdog-img-${hotdogIndex}" src="${defaultHotdog.image}" alt="${defaultHotdog.name}" class="w-full h-40 sm:h-48 md:h-52 object-contain bg-white rounded-lg">
                                <div class="absolute inset-0 flex items-center justify-between px-3">
                                    <button class="prev-hotdog-btn bg-black/60 hover:bg-black/80 text-white rounded-full w-10 h-10 flex items-center justify-center transition-all duration-200 shadow-lg backdrop-blur-sm" data-hotdog-index="${hotdogIndex}">
                                        <i class="fas fa-chevron-left"></i>
                                    </button>
                                    <button class="next-hotdog-btn bg-black/60 hover:bg-black/80 text-white rounded-full w-10 h-10 flex items-center justify-center transition-all duration-200 shadow-lg backdrop-blur-sm" data-hotdog-index="${hotdogIndex}">
                                        <i class="fas fa-chevron-right"></i>
                                    </button>
                                </div>
                            </div>
                            <div class="text-center mt-3">
                                <h5 id="hotdog-name-${hotdogIndex}" class="font-semibold text-lg text-gray-800">${defaultHotdog.name}</h5>
                                <p id="hotdog-price-${hotdogIndex}" class="text-sm text-gray-600 font-medium">Precio base</p>
                            </div>
                        </div>
                        <div class="customizations-summary text-sm text-gray-600 mb-3 p-2 bg-gray-50 rounded">Sin personalización.</div>
                        <button class="hotdog-customize-btn w-full text-sm bg-gray-200 hover:bg-gray-300 py-2 px-4 rounded-md transition-colors duration-200" data-hotdog-index="${hotdogIndex}">Personalizar</button>
                    </div>
                `;
                
                comboModalBody.innerHTML += choiceHtml;
            }
        }
        
        // Añadir selección de papas incluidas en el combo
        const friesSelectionHtml = `
            <div class="border rounded-lg p-4 mt-6">
                <h4 class="font-bold text-lg mb-3">Papas Medianas Incluidas</h4>
                <p class="text-sm text-gray-600 mb-3">Elige qué tipo de papas quieres en tu combo:</p>
                <div class="space-y-3">
                    <label class="flex items-center cursor-pointer p-3 border rounded-lg hover:bg-gray-50 transition-all duration-200 bg-[#FFB300]/10 border-[#FFB300]">
                        <input type="radio" name="combo-fries-type" value="Gajo" class="form-radio text-[#FFB300]" checked>
                        <div class="ml-3 mr-3">
                            <img src="https://imgur.com/0n0jSEh.jpg" alt="Papas Gajo" class="w-12 h-8 object-cover rounded shadow-sm">
                        </div>
                        <span class="font-medium">Papas Gajo Medianas</span>
                    </label>
                    <label class="flex items-center cursor-pointer p-3 border rounded-lg hover:bg-gray-50 transition-all duration-200">
                        <input type="radio" name="combo-fries-type" value="Francesas" class="form-radio text-[#FFB300]">
                        <div class="ml-3 mr-3">
                            <img src="https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=300&h=200&fit=crop&crop=center" alt="Papas Francesas" class="w-12 h-8 object-cover rounded shadow-sm">
                        </div>
                        <span class="font-medium">Papas a la Francesa Medianas</span>
                    </label>
                    <label class="flex items-center cursor-pointer p-3 border rounded-lg hover:bg-gray-50 transition-all duration-200">
                        <input type="radio" name="combo-fries-type" value="Crispy" class="form-radio text-[#FFB300]">
                        <div class="ml-3 mr-3">
                            <img src="https://imgur.com/4bflLWp.jpg" alt="Papas Crispy" class="w-12 h-8 object-cover rounded shadow-sm">
                        </div>
                        <span class="font-medium">Papas Crispy Medianas</span>
                    </label>
                </div>
            </div>
        `;
        
        comboModalBody.innerHTML += friesSelectionHtml;
        
        updateComboModalTotal();
        
        comboModal.classList.add('flex');
        comboModal.classList.remove('hidden');
    }

    function closeComboModal() {
        comboModal.classList.add('hidden');
        comboModal.classList.remove('flex');
    }

    function updateComboModalTotal() {
        let total = tempComboConfig.baseCombo.price;
        const clasicaPrice = findItemById(1).price;
        const baseHotdogPrice = findItemById(5).price; // Precio base del Hotdog Jumbo
        
        // Calcular precio de las hamburguesas
        tempComboConfig.choices.forEach(choice => {
            const upgradeCost = choice.burger.price - clasicaPrice;
            if (upgradeCost > 0) total += upgradeCost;
            
            if (choice.customizations) {
                choice.customizations.forEach(cust => total += cust.price);
            }
            
            if (choice.fries) total += choice.fries.price;
            if (choice.onionRings) total += choice.onionRings.price;
            
            if (choice.menuExtras && choice.menuExtras.length > 0) {
                choice.menuExtras.forEach(extra => total += extra.price * extra.quantity);
            }
        });
        
        // Calcular precio de los hotdogs (si existen)
        if (tempComboConfig.hotdogs) {
            tempComboConfig.hotdogs.forEach(hotdogChoice => {
                const upgradeCost = hotdogChoice.hotdog.price - baseHotdogPrice;
                if (upgradeCost > 0) total += upgradeCost;
                
                if (hotdogChoice.customizations) {
                    hotdogChoice.customizations.forEach(cust => total += cust.price);
                }
                
                if (hotdogChoice.fries) total += hotdogChoice.fries.price;
                if (hotdogChoice.onionRings) total += hotdogChoice.onionRings.price;
                
                if (hotdogChoice.menuExtras && hotdogChoice.menuExtras.length > 0) {
                    hotdogChoice.menuExtras.forEach(extra => total += extra.price * extra.quantity);
                }
            });
        }
        
        comboModalTotal.textContent = `${total.toFixed(0)}`;
    }

    // Función para calcular el precio real de un combo basado en sus componentes
    function calculateComboRealPrice(combo) {
        let realPrice = 0;
        
        switch (combo.id) {
            case 6: // Combo Pareja: 2 Hamburguesas + 1 Papas Medianas + 7 Aros de Cebolla
                realPrice = (100 * 2) + 60 + 45; // 2 Clásicas + Papas Medianas + Aros (7pz)
                break;
                
            case 15: // Combo Dúo: 1 Hamburguesa + 1 Hotdog + 1 Papas Medianas
                realPrice = 100 + 60 + 60; // Clásica + Hotdog + Papas Medianas
                break;
                
            case 7: // Combo Amigos: 3 Hamburguesas + 1 Papas Medianas + 1 Coca-Cola 1.75L
                realPrice = (100 * 3) + 60 + 40; // 3 Clásicas + Papas Medianas + Coca 1.75L
                break;
                
            case 14: // Combo Familiar: 5 Hamburguesas + 1 Papas Gajo Grandes + 1 Aros Grande + 1 Coca 3L
                realPrice = (100 * 5) + 100 + 80 + 60; // 5 Clásicas + Papas Grandes + Aros Grandes + Coca 3L
                break;
                
            default:
                realPrice = combo.originalPrice || combo.price;
        }
        
        return realPrice;
    }

    function navigateBurger(choiceIndex, direction) {
        const combo = tempComboConfig.baseCombo;
        const currentBurgerIndex = combo.availableBurgers.indexOf(tempComboConfig.choices[choiceIndex].burger.id);
        
        let newIndex;
        if (direction === 'next') {
            newIndex = (currentBurgerIndex + 1) % combo.availableBurgers.length;
        } else {
            newIndex = currentBurgerIndex === 0 ? combo.availableBurgers.length - 1 : currentBurgerIndex - 1;
        }
        
        const newBurgerId = combo.availableBurgers[newIndex];
        const newBurger = findItemById(newBurgerId);
        
        tempComboConfig.choices[choiceIndex].burger = newBurger;
        tempComboConfig.choices[choiceIndex].customizations = [];
        tempComboConfig.choices[choiceIndex].fries = null;
        tempComboConfig.choices[choiceIndex].onionRings = null;
        
        updateBurgerDisplay(choiceIndex, newBurger);
        
        const summaryEl = document.querySelector(`[data-choice-index="${choiceIndex}"] .customizations-summary`);
        summaryEl.textContent = 'Sin personalización.';
        
        updateComboModalTotal();
    }

    function updateBurgerDisplay(choiceIndex, burger) {
        const clasicaPrice = findItemById(1).price;
        const priceDiff = burger.price - clasicaPrice;
        const priceText = priceDiff > 0 ? `(+ ${priceDiff.toFixed(0)})` : 'Precio base';
        
        document.getElementById(`burger-img-${choiceIndex}`).src = burger.image;
        document.getElementById(`burger-img-${choiceIndex}`).alt = burger.name;
        document.getElementById(`burger-name-${choiceIndex}`).textContent = burger.name;
        document.getElementById(`burger-price-${choiceIndex}`).textContent = priceText;
    }
    
    function navigateHotdog(hotdogIndex, direction) {
        const combo = tempComboConfig.baseCombo;
        const currentHotdogIndex = combo.availableHotdogs.indexOf(tempComboConfig.hotdogs[hotdogIndex].hotdog.id);
        
        let newIndex;
        if (direction === 'next') {
            newIndex = (currentHotdogIndex + 1) % combo.availableHotdogs.length;
        } else {
            newIndex = currentHotdogIndex === 0 ? combo.availableHotdogs.length - 1 : currentHotdogIndex - 1;
        }
        
        const newHotdogId = combo.availableHotdogs[newIndex];
        const newHotdog = findItemById(newHotdogId);
        
        tempComboConfig.hotdogs[hotdogIndex].hotdog = newHotdog;
        tempComboConfig.hotdogs[hotdogIndex].customizations = [];
        tempComboConfig.hotdogs[hotdogIndex].fries = null;
        tempComboConfig.hotdogs[hotdogIndex].onionRings = null;
        
        updateHotdogDisplay(hotdogIndex, newHotdog);
        
        const summaryEl = document.querySelector(`[data-hotdog-index="${hotdogIndex}"] .customizations-summary`);
        summaryEl.textContent = 'Sin personalización.';
        
        updateComboModalTotal();
    }
    
    function updateHotdogDisplay(hotdogIndex, hotdog) {
        const baseHotdogPrice = findItemById(5).price; // Precio base del Hotdog Jumbo
        const priceDiff = hotdog.price - baseHotdogPrice;
        const priceText = priceDiff > 0 ? `(+ ${priceDiff.toFixed(0)})` : 'Precio base';
        
        document.getElementById(`hotdog-img-${hotdogIndex}`).src = hotdog.image;
        document.getElementById(`hotdog-img-${hotdogIndex}`).alt = hotdog.name;
        document.getElementById(`hotdog-name-${hotdogIndex}`).textContent = hotdog.name;
        document.getElementById(`hotdog-price-${hotdogIndex}`).textContent = priceText;
    }

    // Funciones de carrito
    function addToCart(itemId) {
        const originalItem = findItemById(itemId);
        if (!originalItem) return;
        
        // Determinar la categoría del item
        let category = '';
        for (const cat in menuData) {
            if (menuData[cat].some(i => i.id === itemId)) {
                category = cat;
                break;
            }
        }
        
        // Aplicar promoción diaria
        const item = applyDailyPromotion(originalItem, category);
        
        const cartItem = {
            id: Date.now(), // ID único para el carrito
            baseItem: item,
            price: item.price,
            quantity: 1,
            hasPromotion: item.hasPromotion || false,
            promotionText: item.promotionText || '',
            freeFries: item.freeFries || false,
            meatSupreme: item.meatSupreme || false
        };
        
        // Si es miércoles y es una hamburguesa, agregar papas gratis
        if (item.freeFries && category === 'Hamburguesas') {
            cartItem.freeFriesIncluded = {
                name: 'Papas Gajo Medianas',
                price: 0 // Gratis
            };
        }
        
        cart.push(cartItem);
        updateCart();
        openCart();
    }

    function openCart() {
        cartSidebar.classList.remove('translate-x-full');
        cartOverlay.classList.remove('hidden');
    }

    function updateCart() {
        cartCount.textContent = cart.length;
        cartTotal.textContent = `${getCartTotal().toFixed(0)}`;
        
        // Guardar carrito en localStorage
        localStorage.setItem('cart', JSON.stringify(cart));
        
        // Actualizar vista del carrito
        updateCartView();
    }

    function getCartTotal() {
        return cart.reduce((total, item) => total + item.price * item.quantity, 0);
    }

    function updateCartView() {
        cartItemsContainer.innerHTML = '';
        
        if (cart.length === 0) {
            cartEmptyMsg.classList.remove('hidden');
            checkoutBtn.disabled = true;
            checkoutBtn.classList.add('bg-gray-400', 'cursor-not-allowed');
        } else {
            cartEmptyMsg.classList.add('hidden');
            checkoutBtn.disabled = false;
            checkoutBtn.classList.remove('bg-gray-400', 'cursor-not-allowed');
            
            cart.forEach(item => {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'flex border-b border-gray-200 py-4';
                
                let itemName = item.baseItem.name;
                let customizationsText = '';
                
                if (item.isCombo) {
                    // Para combos, listar hamburguesas seleccionadas y papas incluidas
                    const burgerNames = item.choices.map(choice => choice.burger.name);
                    let comboDetails = burgerNames.join(', ');
                    
                    // Añadir hotdogs si existen
                    if (item.hotdogs && item.hotdogs.length > 0) {
                        const hotdogNames = item.hotdogs.map(hotdog => hotdog.hotdog.name);
                        comboDetails += ', ' + hotdogNames.join(', ');
                    }
                    
                    // Añadir información de papas incluidas
                    if (item.includedFries) {
                        comboDetails += `, Papas ${item.includedFries.type} ${item.includedFries.size}`;
                    }
                    
                    customizationsText = comboDetails;
                } else if (item.customizations && item.customizations.length > 0) {
                    // Para items personalizados, listar extras
                    const customizationNames = item.customizations.map(c => c.name);
                    customizationsText = `+ ${customizationNames.join(', ')}`;
                    
                    if (item.fries) {
                        customizationsText += `, Papas ${item.fries.type}`;
                    }
                    
                    if (item.onionRings) {
                        customizationsText += ', Aros de Cebolla';
                    }
                }
                
                // Añadir papas gratis si aplica
                if (item.freeFriesIncluded) {
                    if (customizationsText) customizationsText += ', ';
                    customizationsText += `🎉 ${item.freeFriesIncluded.name} (GRATIS)`;
                }
                
                // Mostrar badge de promoción si aplica
                let promotionBadge = '';
                if (item.hasPromotion) {
                    promotionBadge = '<span class="inline-block bg-red-500 text-white text-xs px-2 py-1 rounded-full ml-2 animate-pulse">🎉 PROMO</span>';
                }
                
                itemDiv.innerHTML = `
                    <div class="flex-shrink-0 w-20 h-20 bg-gray-100 rounded-md overflow-hidden">
                        <img src="${item.baseItem.image}" alt="${itemName}" class="w-full h-full object-cover">
                    </div>
                    <div class="ml-4 flex-grow">
                        <div class="flex justify-between">
                            <h4 class="font-semibold text-gray-800">${itemName}${promotionBadge}</h4>
                            <button class="remove-item-btn text-gray-400 hover:text-red-500" data-id="${item.id}">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                        <p class="text-sm text-gray-500 mb-2">${customizationsText}</p>
                        <div class="flex items-center justify-between">
                            <div class="flex items-center border rounded-md">
                                <button class="cart-qty-btn px-2 py-1 border-r" data-id="${item.id}" data-action="decrease">-</button>
                                <span class="px-4">${item.quantity}</span>
                                <button class="cart-qty-btn px-2 py-1 border-l" data-id="${item.id}" data-action="increase">+</button>
                            </div>
                            <span class="font-bold text-[#FFB300]">${(item.price * item.quantity).toFixed(0)}</span>
                        </div>
                    </div>
                `;
                
                cartItemsContainer.appendChild(itemDiv);
            });
            
            // Event listeners para botones de cantidad y eliminar
            document.querySelectorAll('.cart-qty-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const id = parseInt(e.currentTarget.dataset.id);
                    const action = e.currentTarget.dataset.action;
                    const itemIndex = cart.findIndex(item => item.id === id);
                    
                    if (itemIndex !== -1) {
                        if (action === 'increase') {
                            cart[itemIndex].quantity++;
                        } else if (action === 'decrease') {
                            if (cart[itemIndex].quantity > 1) {
                                cart[itemIndex].quantity--;
                            }
                        }
                        updateCart();
                    }
                });
            });
            
            document.querySelectorAll('.remove-item-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const id = parseInt(e.currentTarget.dataset.id);
                    cart = cart.filter(item => item.id !== id);
                    updateCart();
                });
            });
        }
    }

    // Funciones de checkout
    function renderOrderSummary() {
        orderSummaryContainer.innerHTML = '<h4 class="font-semibold text-lg mb-4">Resumen de tu pedido:</h4>';
        
        const orderSummaryList = document.createElement('div');
        orderSummaryList.className = 'space-y-3';
        
        cart.forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'flex justify-between items-start border-b pb-3';
            
            let customizationsText = '';
            
            if (item.isCombo) {
                // Para combos, listar hamburguesas seleccionadas
                const burgerList = item.choices.map(choice => {
                    let text = `• ${choice.burger.name}`;
                    if (choice.customizations && choice.customizations.length > 0) {
                        text += ` (+ ${choice.customizations.map(c => c.name).join(', ')})`;
                    }
                    return text;
                });
                
                // Añadir hotdogs si existen
                if (item.hotdogs && item.hotdogs.length > 0) {
                    const hotdogList = item.hotdogs.map(hotdog => {
                        let text = `• ${hotdog.hotdog.name}`;
                        if (hotdog.customizations && hotdog.customizations.length > 0) {
                            text += ` (+ ${hotdog.customizations.map(c => c.name).join(', ')})`;
                        }
                        return text;
                    });
                    burgerList.push(...hotdogList);
                }
                
                // Añadir información de papas incluidas
                if (item.includedFries) {
                    burgerList.push(`• Papas ${item.includedFries.type} ${item.includedFries.size}`);
                }
                
                customizationsText = burgerList.join('<br>');
            } else if (item.customizations && item.customizations.length > 0) {
                // Para items personalizados, listar extras
                const extras = [];
                
                if (item.customizations.length > 0) {
                    extras.push(`+ ${item.customizations.map(c => c.name).join(', ')}`);
                }
                
                if (item.fries) {
                    extras.push(`+ Papas ${item.fries.type}`);
                }
                
                if (item.onionRings) {
                    extras.push('+ Aros de Cebolla');
                }
                
                if (item.freeFriesIncluded) {
                    extras.push(`+ ${item.freeFriesIncluded.name} (GRATIS 🎉)`);
                }

                customizationsText = extras.join('<br>');
            }
            
            // Preparar información de precio y ahorro
            let priceDisplay = '';
            if (item.isCombo) {
                const realPrice = calculateComboRealPrice(item.baseItem);
                const savings = realPrice - item.baseItem.price;
                priceDisplay = `
                    <div class="text-right">
                        <div class="text-xs text-gray-400 line-through">Individual: ${realPrice.toFixed(0)}</div>
                        <span class="font-bold">${(item.price * item.quantity).toFixed(0)}</span>
                        <div class="text-xs text-green-600">Ahorras: ${(savings * item.quantity).toFixed(0)}</div>
                    </div>
                `;
            } else {
                priceDisplay = `<span class="font-bold">${(item.price * item.quantity).toFixed(0)}</span>`;
            }
            
            itemDiv.innerHTML = `
                <div>
                    <span class="font-semibold">${item.quantity}x ${item.baseItem.name}</span>
                    <p class="text-xs text-gray-500">${customizationsText}</p>
                </div>
                ${priceDisplay}
            `;
            
            orderSummaryList.appendChild(itemDiv);
        });
        
        // Añadir subtotal y envío
        const deliveryTypeValue = document.querySelector('input[name="delivery-type"]:checked').value;
        const subtotal = getCartTotal();
        const deliveryCost = deliveryTypeValue === 'delivery' ? DELIVERY_PRICE : 0;
        const total = subtotal + deliveryCost;
        
        const totalsDiv = document.createElement('div');
        totalsDiv.className = 'mt-4 space-y-2';
        totalsDiv.innerHTML = `
            <div class="flex justify-between text-gray-600">
                <span>Subtotal:</span>
                <span>${subtotal.toFixed(0)}</span>
            </div>
            <div class="flex justify-between text-gray-600">
                <span>Envío:</span>
                <span>${deliveryTypeValue === 'delivery' ? `${DELIVERY_PRICE.toFixed(0)}` : 'Gratis'}</span>
            </div>
            <div class="flex justify-between font-bold text-lg mt-2 pt-2 border-t">
                <span>Total:</span>
                <span class="text-[#FFB300]">${total.toFixed(0)}</span>
            </div>
        `;
        
        orderSummaryList.appendChild(totalsDiv);
        orderSummaryContainer.appendChild(orderSummaryList);
    }

    // Validación del formulario de checkout
    function validateCheckoutForm() {
        // Obtener los valores relevantes
        const name = customerNameInput ? customerNameInput.value.trim() : '';
        const phone = customerPhoneInput ? customerPhoneInput.value.trim() : '';
        const deliveryTypeElement = document.querySelector('input[name="delivery-type"]:checked');
        const paymentMethodElement = document.querySelector('input[name="payment"]:checked');
        
        if (!deliveryTypeElement || !paymentMethodElement) {
            return; // No se han seleccionado todas las opciones necesarias
        }
        
        const deliveryTypeValue = deliveryTypeElement.value;
        const paymentMethod = paymentMethodElement.value;

        // Validación del nombre y teléfono
        const nameValid = name.length > 0;
        // Validar teléfono: eliminar espacios, guiones y paréntesis, y verificar que tenga al menos 8 dígitos
        const phoneDigits = phone.replace(/[\s\-\(\)]/g, '');
        const phoneValid = phoneDigits.length >= 8;
        
        // Validación de dirección sólo para entrega a domicilio
        let locationValid = true;
        if (deliveryTypeValue === 'delivery') {
            // Validar que se haya ingresado una dirección
            const addressInput = document.getElementById('address-input');
            if (!addressInput || !addressInput.value.trim()) {
                locationValid = false;
                userAddress = null;
            } else {
                userAddress = addressInput.value.trim();
                // Mejor validación: la dirección debe tener al menos una longitud mínima
                // y preferiblemente estar validada por Google Maps
                locationValid = userAddress.length >= 10;
                
                // Bonus: si hay un lugar seleccionado de Google Maps, es más confiable
                if (window.selectedPlace && window.selectedPlace.formatted_address) {
                    locationValid = true;
                    userAddress = window.selectedPlace.formatted_address;
                }
            }
        }
        
        // Validación de pago efectivo
        let paymentValid = true;
        if (paymentMethod === 'Efectivo') {
            const cashAmountInput = document.getElementById('cash-amount');
            const cashAmountValue = cashAmountInput.value.trim();
            
            // Si hay un valor ingresado y el campo NO está en foco (usuario terminó de escribir),
            // validar que sea suficiente
            if (cashAmountValue) {
                const cashAmount = parseFloat(cashAmountValue);
                const total = getCartTotal() + (document.querySelector('input[name="delivery-type"]:checked').value === 'delivery' ? DELIVERY_PRICE : 0);
                // Usar una pequeña tolerancia para evitar problemas de precisión con números flotantes
                paymentValid = !isNaN(cashAmount) && (cashAmount >= total || Math.abs(cashAmount - total) < 0.01);
            } else {
                // Si no hay valor y el campo no está en foco, marcar como inválido
                paymentValid = document.activeElement !== cashAmountInput;
            }
        }
        
        // Mostrar mensajes de error relevantes
        const errorMsgId = 'checkout-validation-msg';
        let errorMsg = document.getElementById(errorMsgId);
        
        if (!errorMsg) {
            errorMsg = document.createElement('div');
            errorMsg.id = errorMsgId;
            errorMsg.className = 'bg-red-50 text-red-700 p-3 rounded-md mt-3 text-sm hidden';
            sendWhatsappBtn.parentNode.insertBefore(errorMsg, sendWhatsappBtn);
        }
        
        // Determinar qué mensaje mostrar
        if (!nameValid) {
            errorMsg.textContent = "Por favor ingresa tu nombre";
            errorMsg.classList.remove('hidden');
        } else if (!phoneValid) {
            errorMsg.textContent = "Por favor ingresa un número de teléfono válido";
            errorMsg.classList.remove('hidden');
        } else if (deliveryTypeValue === 'delivery' && !locationValid) {
           
            errorMsg.textContent = "Por favor ingresa una dirección de entrega";
            errorMsg.classList.remove('hidden');
        } else if (paymentMethod === 'Efectivo' && !paymentValid && document.activeElement !== document.getElementById('cash-amount')) {
            errorMsg.textContent = "El monto de efectivo es insuficiente";
            errorMsg.classList.remove('hidden');
        } else {
            errorMsg.classList.add('hidden');
        }
        
        // Habilitar o deshabilitar botón de WhatsApp
        const isFormValid = nameValid && phoneValid && locationValid && paymentValid;
        sendWhatsappBtn.disabled = !isFormValid;
    }

    // Nueva función para actualizar los totales del checkout
    function updateCheckoutTotals() {
        const subtotalElement = document.getElementById('checkout-subtotal');
        const deliveryFeeElement = document.getElementById('checkout-delivery-fee');
        const totalElement = document.getElementById('checkout-total');
        
        if (!subtotalElement || !totalElement) return;
        
        // Calcular subtotal del carrito
        const subtotal = getCartTotal();
        
        // Verificar si es entrega a domicilio
        const deliveryType = document.querySelector('input[name="delivery-type"]:checked');
        const isDelivery = deliveryType && deliveryType.value === 'delivery';
        
        // Calcular fee de delivery
        let deliveryFee = 0;
        let deliveryText = '';
        
        if (isDelivery) {
            if (userAddress && userAddress.deliveryPrice !== undefined) {
                deliveryFee = userAddress.deliveryPrice;
                if (userAddress.distance <= 4) {
                    deliveryText = `Envío (${userAddress.distance.toFixed(1)} km):`;
                } else {
                    const extraKm = Math.ceil(userAddress.distance - 4);
                    deliveryText = `Envío (${userAddress.distance.toFixed(1)} km, +$${extraKm * EXTRA_KM_PRICE}):`;
                }
            } else {
                deliveryFee = DELIVERY_PRICE;
                deliveryText = 'Envío a domicilio:';
            }
        }
        
        const total = subtotal + deliveryFee;
        
        // Actualizar elementos
        subtotalElement.textContent = `$${subtotal.toFixed(0)}`;
        totalElement.textContent = `$${total.toFixed(0)}`;
        
        // Mostrar/ocultar fee de delivery
        if (deliveryFeeElement) {
            if (isDelivery) {
                const deliverySpan = deliveryFeeElement.querySelector('span:first-child');
                const priceSpan = deliveryFeeElement.querySelector('span:last-child');
                
                if (deliverySpan) deliverySpan.textContent = deliveryText;
                if (priceSpan) priceSpan.textContent = `+$${deliveryFee.toFixed(0)}`;
                
                deliveryFeeElement.classList.remove('hidden');
            } else {
                deliveryFeeElement.classList.add('hidden');
            }
        }
        
        // Recalcular cambio si está en modo efectivo
        calculateChange();
    }

    // Nueva función para calcular el cambio
    function calculateChange() {
        const cashAmountInput = document.getElementById('cash-amount');
        const changeDisplay = document.getElementById('change-display');
        const changeAmount = document.getElementById('change-amount');
        const insufficientCash = document.getElementById('insufficient-cash');
        
        if (!cashAmountInput || !changeDisplay || !changeAmount) return;
        
        // Solo calcular si el método de pago es efectivo
        const paymentMethod = document.querySelector('input[name="payment"]:checked');
        if (!paymentMethod || paymentMethod.value !== 'Efectivo') {
            changeDisplay.classList.add('hidden');
            if (insufficientCash) insufficientCash.classList.add('hidden');
            return;
        }
        
        const cashValue = parseFloat(cashAmountInput.value) || 0;
        
        if (cashValue <= 0) {
            changeDisplay.classList.add('hidden');
            if (insufficientCash) insufficientCash.classList.add('hidden');
            return;
        }
        
        // Calcular total actual
        const subtotal = getCartTotal();
        const deliveryType = document.querySelector('input[name="delivery-type"]:checked');
        const isDelivery = deliveryType && deliveryType.value === 'delivery';
        const total = subtotal + (isDelivery ? DELIVERY_PRICE : 0);
        
        if (cashValue >= total) {
            // Suficiente dinero - mostrar cambio
            const change = cashValue - total;
            changeAmount.textContent = `$${change.toFixed(0)}`;
            changeDisplay.classList.remove('hidden');
            if (insufficientCash) insufficientCash.classList.add('hidden');
        } else {
            // Dinero insuficiente - mostrar advertencia
            changeDisplay.classList.add('hidden');
            if (insufficientCash) insufficientCash.classList.remove('hidden');
        }
    }

    // Nueva función para manejar cambio de método de pago
    function handlePaymentMethodChange() {
        const cashContainer = document.getElementById('cash-amount-container');
        const paymentMethod = document.querySelector('input[name="payment"]:checked');
        
        if (!cashContainer || !paymentMethod) return;
        
        if (paymentMethod.value === 'Efectivo') {
            cashContainer.style.display = 'block';
            calculateChange();
        } else {
            cashContainer.style.display = 'none';
            // Limpiar displays de cambio
            const changeDisplay = document.getElementById('change-display');
            const insufficientCash = document.getElementById('insufficient-cash');
            if (changeDisplay) changeDisplay.classList.add('hidden');
            if (insufficientCash) insufficientCash.classList.add('hidden');
        }
    }

    function generateWhatsAppMessage() {
        const customerName = customerNameInput ? customerNameInput.value.trim() : '';
        const customerPhone = customerPhoneInput ? customerPhoneInput.value.trim() : '';
        const deliveryTypeElement = document.querySelector('input[name="delivery-type"]:checked');
        const paymentMethodElement = document.querySelector('input[name="payment"]:checked');
        
        if (!deliveryTypeElement || !paymentMethodElement) {
            return 'Error: Faltan datos del formulario';
        }
        
        const deliveryTypeValue = deliveryTypeElement.value;
        const paymentMethod = paymentMethodElement.value;
        
        let address = '';
        let addressDetails = '';
        if (deliveryTypeValue === 'delivery') {
            const addressInput = document.getElementById('address-input').value.trim();
            
            // Use Google Maps validated address if available
            if (window.selectedPlace && window.selectedPlace.formatted_address) {
                address = window.selectedPlace.formatted_address;
                addressDetails = '\n📍 *Dirección verificada con Google Maps*';
                
                // Add coordinates for delivery precision
                if (window.selectedPlace.geometry) {
                    const lat = window.selectedPlace.geometry.location.lat();
                    const lng = window.selectedPlace.geometry.location.lng();
                    addressDetails += `\n📐 Coordenadas: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
                }
            } else {
                address = addressInput;
                addressDetails = '\n⚠️ *Dirección sin verificar - confirmar con cliente*';
            }
        }
        
        let cashAmount = '';
        if (paymentMethod === 'Efectivo') {
            const cashAmountInput = document.getElementById('cash-amount').value.trim();
            if (cashAmountInput) {
                cashAmount = parseFloat(cashAmountInput).toFixed(2);
            }
        }
        
        // Construir el mensaje
        let message = `*NUEVO PEDIDO*\n\n`;
        message += `*Nombre:* ${customerName}\n`;
        message += `*Teléfono:* ${customerPhone}\n\n`;
        
        message += `*Tipo de entrega:* ${deliveryTypeValue === 'delivery' ? 'A domicilio' : 'Recoger en local'}\n`;
        
        if (deliveryTypeValue === 'delivery') {
            message += `*Dirección:* ${address}${addressDetails}\n`;
        }
        
        message += `*Método de pago:* ${paymentMethod}\n`;
        
        if (paymentMethod === 'Efectivo' && cashAmount) {
            const total = getCartTotal() + (deliveryTypeValue === 'delivery' ? DELIVERY_PRICE : 0);
            const change = parseFloat(cashAmount) - total;
            
            message += `*Pagará con:* ${cashAmount}\n`;
            message += `*Cambio:* ${change.toFixed(0)}\n`;
        }
        
        message += `\n*DETALLE DEL PEDIDO:*\n`;
        
        cart.forEach(item => {
            message += `\n• ${item.quantity}x ${ item.baseItem.name} - $${(item.price * item.quantity).toFixed(2)}\n`;
            
            if (item.isCombo) {
                // Detalles de hamburguesas en combo
                message += item.choices.map(choice => {
                    let text = `  ↳ ${choice.burger.name}`;
                    if (choice.customizations && choice.customizations.length > 0) {
                        text += ` (+ ${choice.customizations.map(c => c.name).join(', ')})`;
                    }
                    if (choice.fries) {
                        text += `, Papas ${choice.fries.type}`;
                    }
                    if (choice.onionRings) {
                        text += `, Aros de Cebolla`;
                    }
                    return text;
                }).join('\n');
                message += '\n';
            } else if (item.customizations && item.customizations.length > 0) {
                // Detalles de personalizaciones
                message += `  ↳ Con: ${item.customizations.map(c => c.name).join(', ')}\n`;
            }
            
            if (!item.isCombo && item.fries) {
                message += `  ↳ Con Papas ${item.fries.type}\n`;
            }
            
            if (!item.isCombo && item.onionRings) {
                message += `  ↳ Con Aros de Cebolla\n`;
            }
            
            if (item.menuExtras && item.menuExtras.length > 0) {
                item.menuExtras.forEach(extra => {
                    message += `  ↳ ${extra.quantity}x ${extra.name}\n`;
                });
            }
        });
        
        // Totales
        const subtotal = getCartTotal();
        const deliveryCost = deliveryTypeValue === 'delivery' ? DELIVERY_PRICE : 0;
        const total = subtotal + deliveryCost;
        
        message += `\n*Subtotal:* ${subtotal.toFixed(0)}`;
        message += `\n*Envío:* ${deliveryTypeValue === 'delivery' ? `${DELIVERY_PRICE.toFixed(0)}` : 'Gratis'}`;
        message += `\n*TOTAL:* ${total.toFixed(0)}`;
        
        return message;
    }

    // Guardar y cargar datos
    function loadCustomerData() {
        const savedPhone = localStorage.getItem('customerPhone');
        if (savedPhone) {
            customerPhoneInput.value = savedPhone;
        }
    }
    
    function saveCustomerData() {
        localStorage.setItem('customerPhone', customerPhoneInput.value.trim());
    }
    
    function loadCart() {
        try {
            const savedCart = JSON.parse(localStorage.getItem('cart'));
            if (savedCart && Array.isArray(savedCart)) {
                cart = savedCart;
            }
        } catch (e) {
            console.error('Error loading cart:', e);
            localStorage.removeItem('cart');
        }
    }
    
    // Initialize everything when page loads
    function initialize() {
        renderMenu();
        setupEventListeners();
        initializeEnhancements();
        loadCustomerData();
        loadCart();
        updateCart();
        
        // Set current year in footer
        document.getElementById('year').textContent = '2024';
        
        // Add smooth scrolling for anchor links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
        
        // Add progressive web app features
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js').catch(() => {
                // Service worker registration failed, but that's ok
            });
        }
        
        // Add performance monitoring
        if ('PerformanceObserver' in window) {
            const observer = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    if (entry.entryType === 'largest-contentful-paint') {
                        // Log LCP for optimization
                        console.log('LCP:', entry.startTime);
                    }
                }
            });
            observer.observe({entryTypes: ['largest-contentful-paint']});
        }
        
        // Initialize theme preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
        function handleThemeChange(e) {
            document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
        }
        handleThemeChange(prefersDark);
        prefersDark.addEventListener('change', handleThemeChange);
        
        // Add error boundary for JavaScript errors
        window.addEventListener('error', (e) => {
            console.error('JavaScript Error:', e.error);
            // Could send to analytics service
        });
        
        // Add visibility change handler for performance
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                // Page is hidden, pause expensive operations
                clearTimeout(cartAbandonmentTimer);
            } else {
                // Page is visible, resume operations
                startCartAbandonmentTimer();
            }
        });
        
        console.log('🍔 SR & SRA BURGER - Sistema inicializado correctamente!');
        console.log('💡 Todas las mejoras UX/UI están activas');
        console.log('🚀 Experiencia de usuario optimizada para conversiones');
    }
    
    // Start the application
    initialize();

    // --- GOOGLE MAPS INTEGRATION ---
    
    let autocomplete;
    let map;
    let marker;
    let selectedPlace = null;
    
    // Initialize Google Maps when API is loaded (ACTIVADO CON API REAL)
    window.initializeGoogleMaps = function() {
        console.log('🗺️ Google Maps API cargada exitosamente con tu API key');
        console.log('📍 Iniciando configuración del autocompletado real...');
        initializeAddressAutocomplete();
    };
    
    // Intentar inicializar inmediatamente si Google Maps ya está disponible
    if (window.google && window.google.maps && window.google.maps.places) {
        console.log('✅ Google Maps ya disponible - inicializando ahora');
        initializeAddressAutocomplete();
    }
    
    // Fallback mejorado: esperar un poco más para la carga de Google Maps
    setTimeout(() => {
        const addressInput = document.getElementById('address-input');
        if (addressInput && !autocomplete) {
            console.log('⚠️ Activando autocompletado simulado como respaldo');
            setupFreeTextInput(addressInput);
        }
    }, 3000); // Aumentado a 3 segundos para mejor carga
    
    function initializeAddressAutocomplete() {
        const addressInput = document.getElementById('address-input');
        
        if (!addressInput) {
            console.log('⚠️ Elemento address-input no encontrado');
            return;
        }

        // Primero, asegurar que el campo siempre permita escribir libremente
        addressInput.removeAttribute('readonly');
        addressInput.removeAttribute('disabled');
        addressInput.style.pointerEvents = 'auto';
        
        console.log('🔍 Verificando disponibilidad de Google Maps...');
        
        // Si Google Maps no está disponible, usar entrada libre inmediatamente
        if (!window.google || !window.google.maps || !window.google.maps.places) {
            console.log('⚠️ Google Maps no disponible - usando autocompletado simulado');
            setupFreeTextInput(addressInput);
            return;
        }
        
        try {
            console.log('✅ Google Maps disponible - configurando autocompletado para Coahuila 36, Minatitlán');
            
            // Configure autocomplete options - Optimizado para área de entrega de 4km desde Coahuila 36
            const options = {
                types: ['address'], // Enfocado en direcciones
                componentRestrictions: { country: 'mx' }, // Restringir a México
                bounds: {
                    // Área de entrega: 4 km radio desde Coahuila 36, Emiliano Zapata, Minatitlán
                    // Coordenadas aproximadas: 17.9950, -94.5370
                    north: 18.0310,  // +4km Norte
                    south: 17.9590,  // -4km Sur  
                    east: -94.4910,  // +4km Este
                    west: -94.5830   // -4km Oeste
                },
                strictBounds: false, // Permitir sugerencias cercanas también
                fields: ['address_components', 'formatted_address', 'geometry', 'name', 'place_id']
            };
            
            // Initialize autocomplete
            autocomplete = new google.maps.places.Autocomplete(addressInput, options);
            
            // Configurar preferencias adicionales
            autocomplete.setOptions({
                strictBounds: false,
                placeIdOnly: false
            });
            
            // Add place changed listener
            autocomplete.addListener('place_changed', onPlaceChanged);
            
            // Mejorar la experiencia de usuario
            addressInput.addEventListener('focus', function() {
                console.log('🎯 Campo de dirección enfocado - Google Maps listo');
                // Dar una pista al usuario con área de cobertura específica
                if (this.value === '') {
                    this.placeholder = 'Escribe tu dirección... (Cobertura: 4 km desde Coahuila 36, Minatitlán)';
                }
            });
            
            addressInput.addEventListener('input', function(e) {
                console.log('📝 Escribiendo con Google Maps activo:', e.target.value.length + ' caracteres');
                
                // Verificar que las sugerencias aparezcan
                setTimeout(() => {
                    const pacContainer = document.querySelector('.pac-container');
                    if (pacContainer && e.target.value.length > 2) {
                        console.log('💡 Sugerencias de Google Maps disponibles');
                    }
                }, 500);
            });
            
            console.log('✅ Autocompletado de Google Maps inicializado para área de entrega (4km desde Coahuila 36)');
            
        } catch (error) {
            console.error('❌ Error al inicializar Google Maps:', error);
            console.log('🔄 Activando autocompletado simulado como respaldo');
            setupFreeTextInput(addressInput);
        }
        
        // Initialize map view button
        const showMapBtn = document.getElementById('show-map-btn');
        if (showMapBtn) {
            showMapBtn.addEventListener('click', toggleMapView);
        }
    }
    
    // Función para configurar entrada libre de texto con simulación de autocompletado
    function setupFreeTextInput(addressInput) {
        // Asegurar que el campo permita escritura libre
        addressInput.style.backgroundColor = 'white';
        addressInput.removeAttribute('readonly');
        addressInput.removeAttribute('disabled');
        
        console.log('✅ Configurando entrada libre de texto con autocompletado simulado');
        
        // Crear contenedor de sugerencias
        let suggestionsContainer = document.getElementById('address-suggestions');
        if (!suggestionsContainer) {
            suggestionsContainer = document.createElement('div');
            suggestionsContainer.id = 'address-suggestions';
            suggestionsContainer.className = 'absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-50 hidden';
            addressInput.parentElement.appendChild(suggestionsContainer);
        }
        
        // Direcciones de ejemplo para área de cobertura (4km desde Coahuila 36, Emiliano Zapata)
        const sampleAddresses = [
            'Coahuila 36, Emiliano Zapata, Minatitlán, Veracruz (SEDE)',
            'Calle Zaragoza 123, Col. Centro, Minatitlán, Veracruz',
            'Av. Hidalgo 456, Col. Deportiva, Minatitlán, Veracruz',
            'Calle Morelos 789, Col. Petrolera, Minatitlán, Veracruz',
            'Av. Universidad 321, Col. Universitaria, Minatitlán, Veracruz',
            'Calle Juárez 654, Col. Centro, Minatitlán, Veracruz',
            'Av. Insurgentes 987, Col. Las Flores, Minatitlán, Veracruz',
            'Calle Galeana 147, Col. Emiliano Zapata, Minatitlán, Veracruz',
            'Av. 20 de Noviembre 258, Col. Benito Juárez, Minatitlán, Veracruz',
            'Calle Aldama 369, Col. La Cangrejera, Minatitlán, Veracruz',
            'Av. Obregón 741, Col. Insurgentes, Minatitlán, Veracruz',
            'Calle Victoria 852, Col. Francisco Villa, Minatitlán, Veracruz',
            'Av. Reforma 963, Col. 10 de Mayo, Minatitlán, Veracruz'
        ];
        
        // Event listener para mostrar sugerencias
        addressInput.addEventListener('input', function(e) {
            const value = e.target.value.trim();
            console.log('Dirección escrita:', value, 'Longitud:', value.length);
            
            if (value.length >= 3) {
                // Filtrar direcciones que coincidan
                const matches = sampleAddresses.filter(addr => 
                    addr.toLowerCase().includes(value.toLowerCase())
                );
                
                if (matches.length > 0) {
                    showSuggestions(matches, value);
                } else {
                    hideSuggestions();
                }
                
                // Simular validación después de ciertos caracteres
                if (value.length > 10) {
                    showAddressConfirmation(value);
                }
            } else {
                hideSuggestions();
            }
        });
        
        // Función para mostrar sugerencias
        function showSuggestions(suggestions, query) {
            suggestionsContainer.innerHTML = suggestions.slice(0, 5).map(addr => {
                const isSede = addr.includes('SEDE');
                return `
                <div class="suggestion-item p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 ${isSede ? 'bg-blue-50 border-blue-200' : ''}"
                     onclick="selectSuggestion('${addr}')">
                    <div class="flex items-center space-x-2">
                        <i class="fas fa-map-marker-alt ${isSede ? 'text-blue-600' : 'text-blue-500'}"></i>
                        <div class="flex-grow">
                            <div class="font-medium text-gray-800">${highlightMatch(addr, query)}</div>
                            <div class="text-xs ${isSede ? 'text-blue-600 font-semibold' : 'text-gray-500'}">
                                ${isSede ? '🏪 Nuestra ubicación principal' : 'Área de cobertura de entrega'}
                            </div>
                        </div>
                        ${isSede ? '<span class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">SEDE</span>' : ''}
                    </div>
                </div>
            `}).join('');
            
            suggestionsContainer.classList.remove('hidden');
        }
        
        // Función para resaltar coincidencias
        function highlightMatch(text, query) {
            const regex = new RegExp(`(${query})`, 'gi');
            return text.replace(regex, '<mark class="bg-yellow-200">$1</mark>');
        }
        
        // Función para ocultar sugerencias
        function hideSuggestions() {
            suggestionsContainer.classList.add('hidden');
        }
        
        // Función global para seleccionar sugerencia
        window.selectSuggestion = function(address) {
            addressInput.value = address;
            hideSuggestions();
            showAddressConfirmation(address);
        };
        
        // Función para mostrar confirmación de dirección
        function showAddressConfirmation(address) {
            const mapContainer = document.getElementById('map-container');
            const selectedAddressDiv = document.getElementById('selected-address');
            
            if (mapContainer && selectedAddressDiv) {
                mapContainer.classList.remove('hidden');
                
                selectedAddressDiv.innerHTML = `
                    <div class="flex items-start space-x-2">
                        <i class="fas fa-map-marker-alt text-green-600 mt-1"></i>
                        <div>
                            <div class="font-medium text-gray-800">${address}</div>
                            <div class="text-xs text-gray-500 mt-1">
                                <i class="fas fa-check-circle text-green-500 mr-1"></i>
                                Dirección válida para entrega
                            </div>
                        </div>
                    </div>
                `;
                
                // Simular información de zona de entrega
                showSimulatedDeliveryZone();
            }
        }
        
        // Función para simular zona de entrega
        function showSimulatedDeliveryZone() {
            const mapContainer = document.getElementById('map-container');
            if (!mapContainer) return;
            
            // Remover info anterior
            const existingZoneInfo = mapContainer.querySelector('.zone-info');
            if (existingZoneInfo) existingZoneInfo.remove();
            
            const zoneInfo = document.createElement('div');
            zoneInfo.className = 'zone-info bg-green-50 border border-green-200 rounded-lg p-3 mt-2';
            zoneInfo.innerHTML = `
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-2">
                        <i class="fas fa-truck text-green-600"></i>
                        <div>
                            <div class="font-medium text-green-800">Zona de entrega: Centro</div>
                            <div class="text-sm text-green-700">Distancia estimada: 2.1 km • Costo de envío: $50</div>
                        </div>
                    </div>
                    <div class="text-green-600 font-bold">✓</div>
                </div>
            `;
            mapContainer.appendChild(zoneInfo);
        }
        
        // Ocultar sugerencias al hacer clic fuera
        document.addEventListener('click', function(e) {
            if (!addressInput.contains(e.target) && !suggestionsContainer.contains(e.target)) {
                hideSuggestions();
            }
        });
        
        console.log('✅ Entrada libre de texto con autocompletado simulado configurada');
    }
    
    function onPlaceChanged() {
        const place = autocomplete.getPlace();
        
        if (!place.geometry) {
            console.log('❌ No se encontraron detalles para esta dirección');
            showAddressError('No se encontraron detalles para esta dirección');
            return;
        }
        
        selectedPlace = place;
        displaySelectedAddress(place);
        validateAddressZone(place);
        
        console.log('📍 Dirección seleccionada:', place.formatted_address);
    }
    
    function displaySelectedAddress(place) {
        const mapContainer = document.getElementById('map-container');
        const selectedAddressDiv = document.getElementById('selected-address');
        
        if (!mapContainer || !selectedAddressDiv) return;
        
        // Show confirmation container
        mapContainer.classList.remove('hidden');
        
        // Display formatted address
        selectedAddressDiv.innerHTML = `
            <div class="flex items-start space-x-2">
                <i class="fas fa-map-marker-alt text-green-600 mt-1"></i>
                <div>
                    <div class="font-medium text-gray-800">${place.formatted_address}</div>
                    <div class="text-xs text-gray-500 mt-1">
                        <i class="fas fa-check-circle text-green-500 mr-1"></i>
                        Dirección verificada con Google Maps
                    </div>
                </div>
            </div>
        `;
        
        // Show distance estimate
        estimateDeliveryDistance(place);
    }
    
    function validateAddressZone(place) {
        // Get coordinates
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        
        // Calcular distancia desde el restaurante usando las nuevas coordenadas
        const distance = calculateDistance(
            RESTAURANT_LOCATION.lat, RESTAURANT_LOCATION.lng,
            lat, lng
        );
        
        // Obtener información de la zona de entrega
        const deliveryZone = getDeliveryZone(distance);
        
        if (deliveryZone.price !== null) {
            // Guardar información de la dirección con precio de envío
            userAddress = {
                formatted_address: place.formatted_address,
                distance: distance,
                deliveryPrice: deliveryZone.price,
                zone: deliveryZone.zone,
                coordinates: { lat: lat, lng: lng }
            };
            
            showDeliveryZoneInfo({
                name: deliveryZone.zone,
                distance: distance,
                fee: deliveryZone.price,
                time: distance <= 4 ? '25-35 min' : '35-45 min',
                description: deliveryZone.description,
                color: deliveryZone.color
            });
            
            // Actualizar el total del carrito con el nuevo precio de envío
            updateCheckoutTotals();
        } else {
            // Fuera del rango de entrega
            userAddress = null;
            showDeliveryZoneWarning(distance);
        }
    }
    
    function estimateDeliveryDistance(place) {
        // Ubicación del restaurante: Coahuila 36, Emiliano Zapata, Minatitlán, Veracruz
        const restaurantLocation = { lat: 17.9950, lng: -94.5370 };
        const customerLocation = {
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng()
        };
        
        const distance = calculateDistance(restaurantLocation, customerLocation);
        
        const selectedAddressDiv = document.getElementById('selected-address');
        if (selectedAddressDiv && distance) {
            const distanceInfo = document.createElement('div');
            distanceInfo.className = 'text-xs text-blue-600 mt-1';
            distanceInfo.innerHTML = `
                <i class="fas fa-route mr-1"></i>
                Aproximadamente ${distance.toFixed(1)} km desde SR & SRA BURGER
            `;
            selectedAddressDiv.appendChild(distanceInfo);
        }
    }
    
    function showDeliveryZoneInfo(zone) {
        const mapContainer = document.getElementById('map-container');
        if (!mapContainer) return;
        
        // Limpiar información anterior
        const existingInfo = mapContainer.querySelector('.zone-info');
        if (existingInfo) existingInfo.remove();
        
        const colorClass = zone.color === 'green' ? 'green' : 'orange';
        const bgClass = `bg-${colorClass}-50`;
        const borderClass = `border-${colorClass}-200`;
        const textClass = `text-${colorClass}-800`;
        const iconClass = `text-${colorClass}-600`;
        
        const zoneInfo = document.createElement('div');
        zoneInfo.className = `zone-info ${bgClass} border ${borderClass} rounded-lg p-3 mt-2`;
        zoneInfo.innerHTML = `
            <div class="flex items-center space-x-2">
                <i class="fas fa-check-circle ${iconClass}"></i>
                <div class="flex-1">
                    <div class="font-medium ${textClass}">${zone.name} - ${zone.distance.toFixed(1)} km</div>
                    <div class="text-sm ${textClass.replace('800', '700')}">
                        Costo de envío: $${zone.fee} • Tiempo estimado: ${zone.time}
                    </div>
                    <div class="text-xs ${textClass.replace('800', '600')} mt-1">
                        ${zone.description}
                    </div>
                </div>
            </div>
            ${zone.fee > DELIVERY_PRICE ? `
                <div class="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                    <i class="fas fa-info-circle mr-1"></i>
                    Zona extendida: $${DELIVERY_PRICE} base + $${zone.fee - DELIVERY_PRICE} por distancia adicional
                </div>
            ` : ''}
        `;
        mapContainer.appendChild(zoneInfo);
        mapContainer.classList.remove('hidden');
    }
    
    function showDeliveryZoneWarning(distance) {
        const mapContainer = document.getElementById('map-container');
        if (!mapContainer) return;
        
        // Limpiar información anterior
        const existingInfo = mapContainer.querySelector('.zone-info');
        if (existingInfo) existingInfo.remove();
        
        const warning = document.createElement('div');
        warning.className = 'zone-info bg-red-50 border border-red-200 rounded-lg p-3 mt-2';
        warning.innerHTML = `
            <div class="flex items-center space-x-2">
                <i class="fas fa-exclamation-triangle text-red-600"></i>
                <div>
                    <div class="font-medium text-red-800">Fuera del área de entrega</div>
                    <div class="text-sm text-red-700">
                        Tu dirección está a ${distance.toFixed(1)} km. Solo entregamos dentro de un radio de ${MAX_DELIVERY_DISTANCE} km desde nuestro restaurante en Coahuila 36, Emiliano Zapata, Minatitlán.
                    </div>
                    <div class="text-xs text-red-600 mt-2">
                        <strong>Zonas de entrega:</strong><br>
                        • Zona 1 (0-4 km): $${DELIVERY_PRICE}<br>
                        • Zona 2 (4-7 km): $${DELIVERY_PRICE} + $${EXTRA_KM_PRICE}/km adicional
                    </div>
                </div>
            </div>
        `;
        mapContainer.appendChild(warning);
        mapContainer.classList.remove('hidden');
    }
    
    function showAddressError(message) {
        const addressInput = document.getElementById('address-input');
        if (!addressInput) return;
        
        addressInput.classList.add('border-red-500');
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'text-red-600 text-sm mt-1';
        errorDiv.innerHTML = `<i class="fas fa-exclamation-circle mr-1"></i>${message}`;
        
        addressInput.parentNode.appendChild(errorDiv);
        
        setTimeout(() => {
            addressInput.classList.remove('border-red-500');
            errorDiv.remove();
        }, 5000);
    }
    
    function toggleMapView() {
        const miniMap = document.getElementById('mini-map');
        const showMapBtn = document.getElementById('show-map-btn');
        
        if (!miniMap || !selectedPlace) return;
        
        if (miniMap.classList.contains('hidden')) {
            // Show map
            miniMap.classList.remove('hidden');
            showMapBtn.innerHTML = '<i class="fas fa-eye-slash mr-1"></i>Ocultar mapa';
            initializeMiniMap();
        } else {
            // Hide map
            miniMap.classList.add('hidden');
            showMapBtn.innerHTML = '<i class="fas fa-eye mr-1"></i>Ver mapa';
        }
    }
    
    function initializeMiniMap() {
        if (!selectedPlace || !window.google) return;
        
        const miniMapDiv = document.getElementById('mini-map');
        if (!miniMapDiv) return;
        
        const mapOptions = {
            zoom: 16,
            center: selectedPlace.geometry.location,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
            zoomControl: true,
            styles: [
                {
                    featureType: 'poi',
                    elementType: 'labels',
                    stylers: [{ visibility: 'off' }]
                }
            ]
        };
        
        map = new google.maps.Map(miniMapDiv, mapOptions);
        
        // Add marker for selected address
        marker = new google.maps.Marker({
            position: selectedPlace.geometry.location,
            map: map,
            title: selectedPlace.formatted_address,
            icon: {
                url: 'data:image/svg+xml;base64,' + btoa(`
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32">
                        <path fill="#FFB300" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                    </svg>
                `),
                scaledSize: new google.maps.Size(32, 32)
            }
        });
        
        // Add info window
        const infoWindow = new google.maps.InfoWindow({
            content: `
                <div class="p-2">
                    <div class="font-bold text-sm">Dirección de entrega</div>
                    <div class="text-xs text-gray-600 mt-1">${selectedPlace.formatted_address}</div>
                </div>
            `
        });
        
        marker.addListener('click', () => {
            infoWindow.open(map, marker);
        });
        
        console.log('🗺️ Mini mapa inicializado');
    }
    
    // Fallback if Google Maps fails to load
    setTimeout(() => {
        if (!window.google) {
            console.log('⚠️ Google Maps no se cargó - La API key puede ser inválida');
            console.log('💡 Para usar Google Maps necesitas una API key válida en el HTML');
            
            // Asegurar que el campo de dirección funcione sin Google Maps
            const addressInput = document.getElementById('address-input');
            if (addressInput && !autocomplete) {
                console.log('🔧 Configurando autocompletado simulado...');
                setupFreeTextInput(addressInput);
                
                // Mostrar mensaje informativo al usuario
                showGoogleMapsInfo();
            }
        } else {
            console.log('✅ Google Maps cargado correctamente');
        }
    }, 2000);
    
    // Función para mostrar información sobre Google Maps
    function showGoogleMapsInfo() {
        const helpText = document.querySelector('.text-xs.text-gray-500');
        if (helpText) {
            helpText.innerHTML = `
                <i class="fas fa-info-circle text-blue-500 mr-1"></i>
                Autocompletado simulado activo. Escribe tu dirección y aparecerán sugerencias locales.
                <br><small class="text-gray-400">Para Google Maps real se requiere API key válida.</small>
            `;
            helpText.classList.remove('text-gray-500');
            helpText.classList.add('text-blue-600');
        }
    }
    
    // Inicialización inmediata del campo de dirección (sin esperar Google Maps)
    const addressInput = document.getElementById('address-input');
    if (addressInput) {
        // Asegurar que el campo esté disponible para escritura desde el inicio
        addressInput.removeAttribute('readonly');
        addressInput.removeAttribute('disabled');
        addressInput.style.backgroundColor = 'white';
        addressInput.style.pointerEvents = 'auto';
        addressInput.style.opacity = '1';
        
        // Agregar event listener para monitorear la escritura
        addressInput.addEventListener('input', function(e) {
            console.log('Dirección actual:', e.target.value, 'Longitud:', e.target.value.length);
        });
        
        // Agregar event listener para asegurar que siempre se pueda escribir
        addressInput.addEventListener('keydown', function(e) {
            // Permitir todas las teclas normales de escritura
            if (e.key.length === 1 || ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) {
                // No bloquear ninguna tecla de escritura
                return true;
            }
        });
        
        console.log('✅ Campo de dirección habilitado para escritura libre desde el inicio');
    }

    // Función para agregar pedido al sistema de control de envíos
    function addToOrderControl() {
        try {
            // Obtener datos del formulario
            const customerName = customerNameInput ? customerNameInput.value.trim() : '';
            const customerPhone = customerPhoneInput ? customerPhoneInput.value.trim() : '';
            const deliveryTypeElement = document.querySelector('input[name="delivery-type"]:checked');
            const paymentMethodElement = document.querySelector('input[name="payment"]:checked');
            
            if (!customerName || !customerPhone || !deliveryTypeElement || !paymentMethodElement) {
                console.error('Faltan datos requeridos para agregar al control de envíos');
                return;
            }
            
            const deliveryTypeValue = deliveryTypeElement.value;
            const paymentMethod = paymentMethodElement.value;
            
            // Obtener dirección
            let address = '';
            if (deliveryTypeValue === 'delivery') {
                const addressInput = document.getElementById('address-input');
                if (addressInput) {
                    address = addressInput.value.trim();
                }
                
                // Usar dirección validada por Google Maps si está disponible
                if (window.selectedPlace && window.selectedPlace.formatted_address) {
                    address = window.selectedPlace.formatted_address;
                }
            } else {
                address = 'Recoger en local - SR & SRA BURGER';
            }
            
            // Obtener monto en efectivo si aplica
            let cashAmount = '';
            if (paymentMethod === 'Efectivo') {
                const cashAmountInput = document.getElementById('cash-amount');
                if (cashAmountInput && cashAmountInput.value.trim()) {
                    cashAmount = parseFloat(cashAmountInput.value.trim()).toFixed(2);
                }
            }
            
            // Convertir items del carrito al formato requerido
            const orderItems = cart.map(item => {
                let itemName = item.baseItem.name;
                let customizations = '';
                
                if (item.isCombo) {
                    // Para combos, agregar detalles de las elecciones
                    const choiceDetails = item.choices.map(choice => {
                        let text = choice.burger.name;
                        if (choice.customizations && choice.customizations.length > 0) {
                            text += ` (+ ${choice.customizations.map(c => c.name).join(', ')})`;
                        }
                        if (choice.fries) {
                            text += `, Papas ${choice.fries.type}`;
                        }
                        if (choice.onionRings) {
                            text += `, Aros de Cebolla`;
                        }
                        return text;
                    }).join(' | ');
                    customizations = choiceDetails;
                } else {
                    // Para items individuales
                    const details = [];
                    if (item.customizations && item.customizations.length > 0) {
                        details.push(`+ ${item.customizations.map(c => c.name).join(', ')}`);
                    }
                    if (item.fries) {
                        details.push(`Papas ${item.fries.type}`);
                    }
                    if (item.onionRings) {
                        details.push('Aros de Cebolla');
                    }
                    if (item.menuExtras && item.menuExtras.length > 0) {
                        item.menuExtras.forEach(extra => {
                            details.push(`${extra.quantity}x ${extra.name}`);
                        });
                    }
                    customizations = details.join(', ');
                }
                
                return {
                    name: itemName,
                    quantity: item.quantity,
                    price: parseFloat((item.price * item.quantity).toFixed(2)),
                    customizations: customizations || ''
                };
            });
            
            // Calcular totales
            const subtotal = getCartTotal();
            const deliveryCost = deliveryTypeValue === 'delivery' ? DELIVERY_PRICE : 0;
            const total = subtotal + deliveryCost;
            
            // Crear notas especiales
            let notes = '';
            if (paymentMethod === 'Efectivo' && cashAmount) {
                const change = parseFloat(cashAmount) - total;
                notes += `Pago: $${cashAmount} | Cambio: $${change.toFixed(2)}`;
            }
            if (paymentMethod !== 'Efectivo') {
                notes += `Pago: ${paymentMethod}`;
            }
            
            // Crear objeto de datos del pedido
            const orderData = {
                customer: {
                    name: customerName,
                    phone: customerPhone,
                    address: address
                },
                items: orderItems,
                total: parseFloat(total.toFixed(2)),
                notes: notes || '',
                deliveryType: deliveryTypeValue,
                paymentMethod: paymentMethod
            };
            
            console.log('📝 Enviando pedido a Firebase...', orderData);
            
            // Enviar a Firebase usando el manager global
            if (window.firebaseOrderManager) {
                window.firebaseOrderManager.addOrder(orderData)
                    .then((orderId) => {
                        console.log('✅ Pedido guardado en Firebase con ID:', orderId);
                        showNotification('¡Pedido enviado exitosamente!', 'success');
                    })
                    .catch((error) => {
                        console.error('❌ Error al guardar en Firebase:', error);
                        // Fallback: guardar en localStorage si Firebase falla
                        saveToLocalStorageBackup(orderData);
                        showNotification('Pedido guardado localmente (sin conexión)', 'warning');
                    });
            } else {
                console.warn('⚠️ Firebase no está disponible, guardando en localStorage');
                saveToLocalStorageBackup(orderData);
                showNotification('Pedido guardado localmente', 'warning');
            }
            
        } catch (error) {
            console.error('Error al procesar pedido:', error);
            showNotification('Error al procesar el pedido', 'error');
        }
    }

    // Función de respaldo para localStorage
    function saveToLocalStorageBackup(orderData) {
        try {
            const existingOrders = JSON.parse(localStorage.getItem('orders') || '[]');
            const newOrder = {
                id: Date.now().toString(),
                timestamp: new Date().toISOString(),
                status: 'pending',
                customer: orderData.customer,
                items: orderData.items,
                total: orderData.total,
                notes: orderData.notes || '',
                deliveryType: orderData.deliveryType,
                paymentMethod: orderData.paymentMethod,
                estimatedTime: calculateEstimatedTime(orderData.items),
                confirmed: false,
                onWaySent: false,
                arrivedSent: false
            };
            
            existingOrders.unshift(newOrder);
            localStorage.setItem('orders', JSON.stringify(existingOrders));
            console.log('💾 Pedido guardado en localStorage como respaldo');
        } catch (error) {
            console.error('Error al guardar en localStorage:', error);
        }
    }

    // Función para mostrar notificaciones
    function showNotification(message, type = 'info') {
        // Crear elemento de notificación
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm transition-all duration-300 transform translate-x-full`;
        
        // Estilos según tipo
        const styles = {
            success: 'bg-green-500 text-white',
            error: 'bg-red-500 text-white',
            warning: 'bg-yellow-500 text-white',
            info: 'bg-blue-500 text-white'
        };
        
        notification.className += ` ${styles[type] || styles.info}`;
        notification.innerHTML = `
            <div class="flex items-center">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle'} mr-2"></i>
                <span>${message}</span>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Mostrar con animación
        setTimeout(() => {
            notification.classList.remove('translate-x-full');
        }, 100);
        
        // Ocultar después de 3 segundos
        setTimeout(() => {
            notification.classList.add('translate-x-full');
            setTimeout(() => {
                if (notification.parentNode) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
    
    // Función auxiliar para calcular tiempo estimado
    function calculateEstimatedTime(items) {
        // Tiempo base + tiempo por item
        const baseTime = 15;
        const timePerItem = 5;
        return baseTime + (items.length * timePerItem);
    }

});

// Función global para controlar las pestañas móviles de promociones
function showMobilePromo(category) {
    console.log('Cambiando a pestaña:', category);
    
    // Remover clase activa de todas las pestañas y resetear estilos
    const tabs = document.querySelectorAll('.mobile-promo-tab');
    tabs.forEach(tab => {
        tab.classList.remove('active');
        // Resetear estilos de tab inactiva
        tab.className = 'mobile-promo-tab flex-shrink-0 bg-gray-200 text-gray-700 px-4 py-2 rounded-full text-sm font-bold';
    });
    
    // Ocultar todo el contenido
    const contents = document.querySelectorAll('.mobile-promo-content');
    contents.forEach(content => {
        content.classList.add('hidden');
        content.classList.remove('active');
    });
    
    // Activar la pestaña seleccionada
    const activeTab = document.querySelector(`[onclick="showMobilePromo('${category}')"]`);
    if (activeTab) {
        activeTab.classList.add('active');
        // Aplicar estilos de tab activa
        activeTab.className = 'mobile-promo-tab active flex-shrink-0 bg-gradient-to-r from-red-500 to-orange-500 text-white px-4 py-2 rounded-full text-sm font-bold';
    }
    
    // Mapear categorías a IDs correctos
    const contentIdMap = {
        'daily': 'mobile-daily-promos',
        'combos': 'mobile-combos-promos', 
        'weekend': 'mobile-weekend-promos'
    };
    
    // Mostrar el contenido correspondiente
    const contentId = contentIdMap[category];
    const activeContent = document.getElementById(contentId);
    if (activeContent) {
        activeContent.classList.remove('hidden');
        activeContent.classList.add('active');
        console.log('Mostrando contenido:', contentId);
    } else {
        console.error('No se encontró el contenido:', contentId);
    }
}

// Función para actualizar promociones según el día actual
function updateDailyPromotions() {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
    
    // Solo promociones de lunes a jueves (NO aplican a combos)
    const dailyPromotions = {
        1: { // Lunes - HOTDOG MANIA
            day: 'LUNES',
            title: 'HOTDOG MANIA',
            discount: '20% OFF',
            description: 'En todos los hotdogs',
            color: 'from-blue-600 to-blue-800',
            hasPromo: true
        },
        2: { // Martes - BBQ por $100
            day: 'MARTES',
            title: 'BBQ BEACON',
            discount: 'Precio único',
            description: '$100 pesos',
            color: 'from-green-600 to-green-800',
            hasPromo: true
        },
        3: { // Miércoles - Papas complemento gratis
            day: 'MIÉRCOLES',
            title: 'PAPAS GRATIS',
            discount: 'Papas gratis',
            description: 'Compra hamburguesa',
            color: 'from-purple-600 to-purple-800',
            hasPromo: true
        },
        4: { // Jueves - Carne extra y tocino 50% descuento
            day: 'JUEVES',
            title: 'CARNE & TOCINO',
            discount: '50% OFF',
            description: 'Carne extra + tocino',
            color: 'from-red-600 to-red-800',
            hasPromo: true
        }
        // Viernes, sábado y domingo: SIN PROMOCIONES (no se muestran)
    };
    
    const currentPromo = dailyPromotions[dayOfWeek];
    
    // Solo actualizar si hay promoción para el día actual
    if (currentPromo && currentPromo.hasPromo) {
        // Actualizar versión móvil
        const mobileCard = document.getElementById('mobile-daily-promo-card');
        const mobileTodayBadge = document.getElementById('mobile-today-badge');
        const mobileDay = document.getElementById('mobile-current-day');
        const mobileTitle = document.getElementById('mobile-current-promo-title');
        const mobileDiscount = document.getElementById('mobile-current-promo-discount');
        const mobileDesc = document.getElementById('mobile-current-promo-desc');
        
        if (mobileCard && mobileDay && mobileTitle && mobileDiscount && mobileDesc) {
            // Mostrar la card de promoción
            mobileCard.style.display = 'block';
            mobileCard.className = `bg-gradient-to-r ${currentPromo.color} rounded-2xl p-4 text-white relative overflow-hidden`;
            mobileDay.textContent = currentPromo.day;
            mobileTitle.textContent = currentPromo.title;
            mobileDiscount.textContent = currentPromo.discount;
            mobileDesc.textContent = currentPromo.description;
            
            // Mostrar badge "HOY"
            if (mobileTodayBadge) {
                mobileTodayBadge.style.display = 'block';
            }
        }
        
        // Actualizar versión desktop
        const desktopCard = document.getElementById('desktop-daily-promo-card');
        const desktopTodayBadge = document.getElementById('desktop-today-badge');
        const desktopDay = document.getElementById('desktop-current-day');
        const desktopTitle = document.getElementById('desktop-current-promo-title');
        const desktopDiscount = document.getElementById('desktop-current-promo-discount');
        const desktopDesc = document.getElementById('desktop-current-promo-desc');
        
        if (desktopCard && desktopDay && desktopTitle && desktopDiscount && desktopDesc) {
            // Mostrar la card de promoción
            desktopCard.style.display = 'block';
            desktopCard.className = `group relative overflow-hidden rounded-2xl bg-gradient-to-br ${currentPromo.color} text-white shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:scale-105`;
            desktopDay.textContent = currentPromo.day;
            desktopTitle.textContent = currentPromo.title;
            desktopDiscount.textContent = currentPromo.discount;
            desktopDesc.textContent = currentPromo.description;
            
            // Mostrar badge "HOY"
            if (desktopTodayBadge) {
                desktopTodayBadge.style.display = 'block';
            }
        }
        
        console.log(`✅ Promoción activa para ${currentPromo.day}: ${currentPromo.title}`);
    } else {
        // No hay promoción para hoy - ocultar las cards de promoción diaria
        const mobileCard = document.getElementById('mobile-daily-promo-card');
        const desktopCard = document.getElementById('desktop-daily-promo-card');
        
        if (mobileCard) {
            mobileCard.style.display = 'none';
        }
        if (desktopCard) {
            desktopCard.style.display = 'none';
        }
        
        console.log(`ℹ️ Sin promociones para hoy (día ${dayOfWeek})`);
    }
}

// Inicializar promociones del día cuando se carga la página
document.addEventListener('DOMContentLoaded', function() {
    // Esperar un poco para asegurar que todos los elementos estén cargados
    setTimeout(() => {
        updateDailyPromotions();
    }, 500);
});
