# 🔥 Configuración de Firebase para SR & SRA BURGER

## 📋 Pasos para Configurar Firebase

### 1. Crear Proyecto en Firebase Console

1. **Ve a [Firebase Console](https://console.firebase.google.com/)**
2. **Haz clic en "Agregar proyecto"**
3. **Nombre del proyecto:** `SR-SRA-BURGER`
4. **Sigue los pasos** (puedes desactivar Google Analytics si quieres)

### 2. Configurar Firestore Database

1. **En el panel lateral, ve a "Firestore Database"**
2. **Haz clic en "Crear base de datos"**
3. **Selecciona "Empezar en modo de prueba"** (por ahora)
4. **Elige una ubicación** (preferiblemente cerca de México)

### 3. Obtener Configuración del Proyecto

1. **Ve a "Configuración del proyecto"** (icono de engranaje)
2. **Scroll hacia abajo hasta "Tus apps"**
3. **Haz clic en "Agregar app" > "Web" (icono </>)**
4. **Nombre de la app:** `SR-SRA-BURGER-WEB`
5. **Copia la configuración** que te aparece

### 4. Actualizar el Archivo Firebase Config

**Abre el archivo:** `js/firebase-config.js`

**Reemplaza estas líneas:**
```javascript
const firebaseConfig = {
    apiKey: "TU_API_KEY_AQUI",
    authDomain: "sr-sra-burger.firebaseapp.com",
    projectId: "sr-sra-burger",
    storageBucket: "sr-sra-burger.appspot.com",
    messagingSenderId: "123456789",
    appId: "TU_APP_ID_AQUI"
};
```

**Con tu configuración real que se ve así:**
```javascript
const firebaseConfig = {
    apiKey: "AIzaSyC_TU_API_KEY_REAL",
    authDomain: "tu-proyecto-real.firebaseapp.com",
    projectId: "tu-proyecto-real",
    storageBucket: "tu-proyecto-real.appspot.com",
    messagingSenderId: "987654321098",
    appId: "1:987654321098:web:abc123def456"
};
```

### 5. Configurar Reglas de Seguridad (Temporal)

1. **En Firestore, ve a "Reglas"**
2. **Reemplaza las reglas existentes** con:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /orders/{document} {
      allow read, write: if true;
    }
  }
}
```

⚠️ **IMPORTANTE:** Estas reglas son temporales para testing. Más adelante configuraremos seguridad adecuada.

### 6. Configurar Reglas de Seguridad (Producción - Opcional)

Para mayor seguridad, puedes usar estas reglas:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /orders/{document} {
      // Solo permitir lectura y escritura desde tu dominio
      allow read, write: if request.auth == null && 
        resource == null || 
        resource.data.keys().hasAll(['customer', 'items', 'total']);
    }
  }
}
```

## 🚀 ¿Cómo Funciona?

### Para Clientes (Página Principal)
- Cuando un cliente hace un pedido → **Se guarda automáticamente en Firebase**
- Los datos se envían en tiempo real a la base de datos
- **Backup automático** en localStorage si Firebase falla

### Para Administradores (Control de Envíos)
- **Actualizaciones en tiempo real** - Ver pedidos al instante
- **Sincronización automática** entre dispositivos
- **Acceso desde cualquier dispositivo** con internet

## 📱 Beneficios

### ✅ **Tiempo Real**
- Los pedidos aparecen instantáneamente en todos los dispositivos
- No necesitas refrescar la página

### ✅ **Multi-dispositivo**
- Puedes ver pedidos desde tu teléfono, tablet o computadora
- Todos los datos están sincronizados

### ✅ **Respaldo Automático**
- Si no hay internet, usa localStorage
- Cuando se recupera la conexión, todo se sincroniza

### ✅ **Sin Pérdida de Datos**
- Firebase es una base de datos profesional
- Los datos están seguros en la nube

## 🔧 Testing

### Después de Configurar:

1. **Hacer un pedido de prueba** desde la página principal
2. **Verificar que aparece** en el control de envíos
3. **Probar desde otro dispositivo** para confirmar sincronización

### En la Consola del Navegador verás:
```
🔥 Conectando con Firebase...
📥 Pedidos recibidos de Firebase: X
✅ Pedido guardado en Firebase con ID: abc123
```

## 🆘 Solución de Problemas

### Si no funciona Firebase:
- ✅ **Funciona como antes** con localStorage
- ✅ **No pierde funcionalidad**
- ✅ **Mensaje claro** en consola

### Mensajes de Error Comunes:
- `Firebase no disponible` → Revisar configuración
- `Error de conexión` → Revisar internet
- `Error de permisos` → Revisar reglas de Firestore

## 💡 Próximos Pasos

Una vez funcionando Firebase, puedes:

1. **Configurar autenticación** para múltiples usuarios
2. **Añadir notificaciones push** para nuevos pedidos
3. **Generar reportes** de ventas automáticos
4. **Integrar con sistema de facturación**

## 📞 Soporte

Si necesitas ayuda con la configuración:
1. Copia cualquier mensaje de error de la consola
2. Toma screenshot de la configuración de Firebase
3. Revisa que las reglas de Firestore estén correctas

¡Firebase te permitirá gestionar los pedidos como un restaurante profesional! 🍔✨
