/**
 * Opciones de tema
 */
export type ThemeMode = "light" | "dark" | "system";

/**
 * Configuración de la aplicación
 */
export interface Settings{
    theme: ThemeMode,
    welcomeShown: boolean,
}

/**
 * Valores por defecto
 */
export const DEFAULT_SETTINGS: Settings = {
    theme: "system",
    welcomeShown: false,
}