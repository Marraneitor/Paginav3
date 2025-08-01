// Configuración de Firebase para SR & SRA BURGER
// ✅ CONFIGURACIÓN REAL OBTENIDA DE FIREBASE CONSOLE

const firebaseConfig = {
    apiKey: "AIzaSyCf7-6oLHjpNgU1zr4qdTrOKuXGe1ht2Zs",
    authDomain: "sr-sra-burger.firebaseapp.com",
    projectId: "sr-sra-burger",
    storageBucket: "sr-sra-burger.firebasestorage.app",
    messagingSenderId: "542059080203",
    appId: "1:542059080203:web:2e15f179a1475b1a77f50e"
};

// Inicializar Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js";
import { 
    getFirestore, 
    collection, 
    addDoc, 
    getDocs, 
    doc, 
    updateDoc, 
    deleteDoc,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Funciones para manejar pedidos en Firebase
class FirebaseOrderManager {
    constructor() {
        this.ordersCollection = collection(db, 'orders');
    }

    // Agregar nuevo pedido
    async addOrder(orderData) {
        try {
            // Limpiar datos para evitar valores undefined
            const cleanedOrder = this.cleanOrderData({
                ...orderData,
                timestamp: serverTimestamp(),
                status: 'pending',
                confirmed: false,
                onWaySent: false,
                arrivedSent: false,
                estimatedTime: this.calculateEstimatedTime(orderData.items)
            });

            const docRef = await addDoc(this.ordersCollection, cleanedOrder);
            console.log('✅ Pedido agregado con ID: ', docRef.id);
            return docRef.id;
        } catch (error) {
            console.error('❌ Error agregando pedido: ', error);
            throw error;
        }
    }

    // Función para limpiar datos y remover valores undefined
    cleanOrderData(data) {
        const cleaned = {};
        
        for (const [key, value] of Object.entries(data)) {
            if (value !== undefined && value !== null) {
                if (typeof value === 'object' && !Array.isArray(value) && value.constructor === Object) {
                    // Si es un objeto, limpiar recursivamente
                    const cleanedObj = this.cleanOrderData(value);
                    if (Object.keys(cleanedObj).length > 0) {
                        cleaned[key] = cleanedObj;
                    }
                } else if (Array.isArray(value)) {
                    // Si es un array, limpiar cada elemento
                    const cleanedArray = value.map(item => 
                        typeof item === 'object' ? this.cleanOrderData(item) : item
                    ).filter(item => item !== undefined && item !== null);
                    if (cleanedArray.length > 0) {
                        cleaned[key] = cleanedArray;
                    }
                } else {
                    cleaned[key] = value;
                }
            }
        }
        
        return cleaned;
    }

    // Obtener todos los pedidos
    async getOrders() {
        try {
            const q = query(this.ordersCollection, orderBy('timestamp', 'desc'));
            const querySnapshot = await getDocs(q);
            const orders = [];
            
            querySnapshot.forEach((doc) => {
                orders.push({
                    id: doc.id,
                    ...doc.data(),
                    timestamp: doc.data().timestamp?.toDate()?.toISOString() || new Date().toISOString()
                });
            });
            
            return orders;
        } catch (error) {
            console.error('Error obteniendo pedidos: ', error);
            throw error;
        }
    }

    // Escuchar cambios en tiempo real
    onOrdersChange(callback) {
        const q = query(this.ordersCollection, orderBy('timestamp', 'desc'));
        return onSnapshot(q, (querySnapshot) => {
            const orders = [];
            querySnapshot.forEach((doc) => {
                orders.push({
                    id: doc.id,
                    ...doc.data(),
                    timestamp: doc.data().timestamp?.toDate()?.toISOString() || new Date().toISOString()
                });
            });
            callback(orders);
        });
    }

    // Actualizar pedido
    async updateOrder(orderId, updateData) {
        try {
            const orderRef = doc(db, 'orders', orderId);
            await updateDoc(orderRef, updateData);
            console.log('Pedido actualizado correctamente');
        } catch (error) {
            console.error('Error actualizando pedido: ', error);
            throw error;
        }
    }

    // Eliminar pedido
    async deleteOrder(orderId) {
        try {
            const orderRef = doc(db, 'orders', orderId);
            await deleteDoc(orderRef);
            console.log('Pedido eliminado correctamente');
        } catch (error) {
            console.error('Error eliminando pedido: ', error);
            throw error;
        }
    }

    // Calcular tiempo estimado
    calculateEstimatedTime(items) {
        const baseTime = 15;
        const timePerItem = 5;
        return baseTime + (items.length * timePerItem);
    }
}

// Clase para manejar configuraciones de administración
class FirebaseAdminManager {
    constructor() {
        this.db = db;
        this.settingsRef = 'admin-settings';
    }

    // Obtener configuraciones
    async getSettings() {
        try {
            const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js');
            const docRef = doc(this.db, this.settingsRef, 'main');
            const docSnap = await getDoc(docRef);
            
            if (docSnap.exists()) {
                return docSnap.data();
            } else {
                // Configuración por defecto
                const defaultSettings = {
                    serviceActive: true,
                    hiddenProducts: [],
                    lastUpdated: new Date().toISOString()
                };
                await this.saveSettings(defaultSettings);
                return defaultSettings;
            }
        } catch (error) {
            console.error('Error obteniendo configuraciones:', error);
            throw error;
        }
    }

    // Guardar configuraciones
    async saveSettings(settings) {
        try {
            const { doc, setDoc } = await import('https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js');
            const docRef = doc(this.db, this.settingsRef, 'main');
            
            const settingsToSave = {
                ...settings,
                lastUpdated: new Date().toISOString()
            };
            
            await setDoc(docRef, settingsToSave);
            console.log('Configuraciones guardadas en Firebase');
            return true;
        } catch (error) {
            console.error('Error guardando configuraciones:', error);
            throw error;
        }
    }

    // Escuchar cambios en tiempo real
    listenToSettings(callback) {
        try {
            let lastUpdate = null; // Track last update to prevent rapid firing
            
            import('https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js')
                .then(({ doc, onSnapshot }) => {
                    const docRef = doc(this.db, this.settingsRef, 'main');
                    
                    return onSnapshot(docRef, (docSnap) => {
                        if (docSnap.exists()) {
                            const data = docSnap.data();
                            const currentUpdate = data.lastUpdated;
                            
                            // Only call callback if this is a new update
                            if (currentUpdate !== lastUpdate) {
                                lastUpdate = currentUpdate;
                                callback(data);
                            }
                        }
                    });
                })
                .catch(error => {
                    console.error('Error configurando listener:', error);
                });
        } catch (error) {
            console.error('Error en listener de configuraciones:', error);
        }
    }

    // Verificar si el servicio está activo (para la página principal)
    async isServiceActive() {
        try {
            const settings = await this.getSettings();
            return settings.serviceActive !== false; // Por defecto true si no existe
        } catch (error) {
            console.error('Error verificando estado del servicio:', error);
            return true; // Por defecto activo si hay error
        }
    }

    // Obtener productos ocultos (para la página principal)
    async getHiddenProducts() {
        try {
            const settings = await this.getSettings();
            return settings.hiddenProducts || [];
        } catch (error) {
            console.error('Error obteniendo productos ocultos:', error);
            return [];
        }
    }
}

// Exportar instancia global
window.firebaseOrderManager = new FirebaseOrderManager();
window.firebaseManager = new FirebaseAdminManager();

// Función de utilidad para mostrar errores
window.showFirebaseError = function(error) {
    console.error('Firebase Error:', error);
    if (window.showNotification) {
        window.showNotification('Error de conexión. Verifica tu internet.', 'error');
    }
};

export { FirebaseOrderManager, db };
