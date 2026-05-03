<p align="center">
  <img src="./assets/images/favicon_vic.png" alt="VillaInChat Logo" width="150" />
  <h1 align="center">VillaInChat</h1>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-1.0.0-blue.svg" alt="version" />
  <img src="https://img.shields.io/badge/Framework-React%20Native-20232A?logo=react&logoColor=61DAFB" alt="React Native Framework" />
  <img src="https://img.shields.io/badge/Platform-Expo-white?logo=expo&logoColor=black" alt="Expo Platform" />
  <img src="https://img.shields.io/badge/Language-TypeScript-3178C6?logo=typescript&logoColor=white" alt="TypeScript Language" />
  <img src="https://img.shields.io/badge/BaaS-Supabase-3ECF8E?logo=supabase&logoColor=white" alt="Supabase BaaS" />
  <img src="https://img.shields.io/badge/Proyecto-DAM-ff69b4.svg" alt="Proyecto DAM" />
</p>

---

## 🛖 Plataforma de Comunicación para Comunidades

<img src="./assets/images/favicon_vic.png" align="right" width="200" alt="VillaInChat Splash">

**VillaInChat** es una aplicación desarrollada con React Native y Expo, concebida como Proyecto Intermodular para el ciclo de Desarrollo de Aplicaciones Multiplataforma (DAM). Su objetivo principal es facilitar y centralizar la comunicación entre estudiantes y profesorado, ofreciendo herramientas de mensajería en tiempo real y gestión administrativa.

### ✨ Características Principales

- 💬 **Mensajería en tiempo real:** Canales de grupo con tipos PUBLIC, PRIVATE y ANNOUNCEMENTS. Los mensajes se sincronizan al instante entre todos los clientes mediante WebSockets (Supabase Realtime).
- 👥 **Grupos y canales:** Los administradores pueden crear grupos con múltiples canales. Los miembros se unen automáticamente a los canales públicos y de anuncios al incorporarse al grupo.
- 📨 **Mensajes Directos (DMs):** Conversaciones privadas 1 a 1. El sistema detecta si ya existe una conversación previa y la reutiliza.
- 🔔 **Menciones con notificaciones push:** Sistema de menciones `@usuario` y `@everyone` con notificaciones push via Expo Push Service. Las menciones siempre notifican al receptor independientemente de sus ajustes de notificaciones.
- 🛡️ **Roles y permisos:** Sistema de roles por usuario (ADMIN, TEACHER, STUDENT) y por grupo (ADMIN, CLASS_REP, STUDENT). Los canales de anuncios solo permiten escribir a administradores y delegados.
- ⚙️ **Ajustes y personalización:** Selección de tema (Claro / Oscuro / Sistema), gestión de notificaciones y datos de perfil.
- 📱 **Multiplataforma:** Funciona en Android, iOS y Web con una única base de código.

<br clear="both"/>

---

## 🛠 Tecnologías y Arquitectura

### Frontend (App Móvil / Web)

| Capa | Tecnología |
|---|---|
| Framework | React Native + Expo 54 (`newArchEnabled`) |
| Lenguaje | TypeScript 5.9 |
| Routing | `expo-router` (file-based, Bottom Tabs + Stack) |
| Estado global | `zustand` (persistido en AsyncStorage / localStorage) |
| Estado contextual | React Context API (Auth, Notificaciones, UserSheet) |
| Formularios | `react-hook-form` + `zod` |
| Animaciones | `react-native-reanimated` |
| Gestos | `react-native-gesture-handler` |
| Modales | `@gorhom/bottom-sheet` |
| Iconos | `@expo/vector-icons`, `lucide-react-native` |

### Backend como Servicio (BaaS)

| Capa | Tecnología |
|---|---|
| Plataforma | Supabase |
| Base de datos | PostgreSQL con Row Level Security (RLS) |
| Autenticación | Supabase Auth (email/password, sesión persistida) |
| Tiempo real | Supabase Realtime (`postgres_changes`) |
| API | PostgREST (REST + RPC functions) |
| Funciones serverless | Edge Functions en Deno (TypeScript) |
| Notificaciones push | Expo Push API (via Edge Function + trigger PostgreSQL) |

### Tablas principales

| Tabla | Descripción |
|---|---|
| `user_profile` | Datos del usuario, rol global, token push, preferencias |
| `group_room` | Grupos de la plataforma |
| `group_members` | Relación usuario ↔ grupo con rol local |
| `chat_room` | Canales de chat (con `FK_group_id`) o DMs (`FK_group_id = null`) |
| `chat_members` | Relación usuario ↔ canal |
| `messages` | Mensajes con referencia al autor y al canal |
| `mentions` | Menciones `@usuario` y `@everyone` con estado de lectura |

---

## ⚙️ Variables de entorno

Crea un archivo `.env` en la raíz del proyecto con las siguientes variables:

```env
EXPO_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_aqui
```
Nota: Si vas a generar una APK con EAS Build, estas variables deben configurarse también en el dashboard de Expo (expo.dev) o mediante el CLI:
```
eas env:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "https://..." --environment production
eas env:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "tu-anon-key" --environment production
```
Para despliegues en Vercel, configúralas en el dashboard de Vercel independientemente.

## 🚀 Ejecución
### Como Usuario
Accede a la página oficial de VillaInChat e inicia sesión con tus credenciales o regístrate como cuenta nueva.
Descarga la APK móvil desde este enlace de Drive.
### Como Desarrollador
Versión Web (modo desarrollo)
Clona o descarga el repositorio e instala las dependencias:

```
npm install
```
Configura las variables de entorno (ver sección anterior).

### Ejecuta la aplicación:
```
npx expo start
````
### Versión Móvil con tunnel
Puedes probar la versión móvil sin APK usando Expo Go:
```
npx expo start --tunnel
```
Los servicios de Google (notificaciones push nativas) no estarán activos en este modo.

### Generar APK con EAS Build
Instala EAS CLI de forma global:
```
npm install -g eas-cli
```
Inicia sesión en tu cuenta de Expo:
```
eas login
```
Configura las variables de entorno en expo.dev (ver sección anterior).

Asegúrate de tener tu propio google-services.json de Firebase en la raíz del proyecto.

Genera la APK:
```
eas build -p android --profile preview
```
Una vez descargada la APK, puedes conectarte al servidor de desarrollo con:
```
npx expo start --dev-client
```
## 📁 Estructura del proyecto
```
villaInChat/
├── app/                    # Rutas (expo-router, file-based)
│   ├── _layout.tsx         # Layout raíz con providers globales
│   ├── (auth)/             # Pantallas de autenticación
│   ├── (tabs)/             # Navegación principal por pestañas
│   ├── groups/[id].tsx     # Detalle de grupo con canales
│   └── rooms/[id].tsx      # Vista de chat o DM
│
├── src/
│   ├── actions/            # Mutaciones hacia Supabase con validación Zod
│   ├── components/         # Componentes organizados por dominio
│   ├── hooks/              # Hooks reutilizables
│   ├── providers/          # Contextos globales (Auth, Notifications, UserSheet)
│   ├── services/           # Lógica de negocio (menciones, búsqueda, notificaciones)
│   ├── stores/             # Zustand stores (settings)
│   ├── lib/                # Clientes singleton (supabase, notifications)
│   ├── types/              # Tipos TypeScript generados y custom
│   └── themes/             # Design system (colores, spacing, tipografía)
│
├── supabase/
│   ├── functions/          # Edge Functions Deno
│   │   ├── send-push/                      # Notificaciones de mensajes
│   │   └── send-mention-notification/      # Notificaciones de menciones
│   └── migrations/         # SQL y triggers de base de datos
│
└── assets/                 # Imágenes, iconos y fuentes
```
### 👥 Equipo
| Integrante | Rol |
|---|---|
| Juan Felipe Perez Perdomo | Tech lead, Desarrollador Full Stack |
| Alvaro Eugenio | Desarrollador Back-End |
| Martin Oliver | Desarrollador Front-End |


