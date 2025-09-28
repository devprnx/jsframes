/**
 * Visualization themes for JSFrames
 */

export interface VisualizationTheme {
  name: string;
  backgroundColor: string;
  textColor: string;
  gridColor: string;
  colors: string[];
  fontFamily: string;
  fontSize: number;
}

export const LIGHT_THEME: VisualizationTheme = {
  name: 'light',
  backgroundColor: '#ffffff',
  textColor: '#000000',
  gridColor: '#e2e8f0',
  colors: [
    '#3182ce', '#38a169', '#d69e2e', '#e53e3e', '#805ad5',
    '#dd6b20', '#319795', '#c53030', '#553c9a', '#2d3748'
  ],
  fontFamily: 'Arial, sans-serif',
  fontSize: 12
};

export const DARK_THEME: VisualizationTheme = {
  name: 'dark',
  backgroundColor: '#2d3748',
  textColor: '#ffffff',
  gridColor: '#4a5568',
  colors: [
    '#63b3ed', '#68d391', '#f6e05e', '#fc8181', '#b794f6',
    '#f6ad55', '#4fd1c7', '#f56565', '#9f7aea', '#718096'
  ],
  fontFamily: 'Arial, sans-serif',
  fontSize: 12
};

export const COLORFUL_THEME: VisualizationTheme = {
  name: 'colorful',
  backgroundColor: '#fafafa',
  textColor: '#212121',
  gridColor: '#e0e0e0',
  colors: [
    '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7',
    '#dda0dd', '#98d8c8', '#f7dc6f', '#bb8fce', '#85c1e9'
  ],
  fontFamily: 'Arial, sans-serif',
  fontSize: 12
};

export const MINIMAL_THEME: VisualizationTheme = {
  name: 'minimal',
  backgroundColor: '#ffffff',
  textColor: '#333333',
  gridColor: '#f0f0f0',
  colors: [
    '#666666', '#999999', '#cccccc', '#333333', '#000000'
  ],
  fontFamily: 'Helvetica, Arial, sans-serif',
  fontSize: 11
};

let defaultTheme: VisualizationTheme = LIGHT_THEME;

export function setDefaultTheme(theme: VisualizationTheme): void {
  defaultTheme = theme;
}

export function getDefaultTheme(): VisualizationTheme {
  return defaultTheme;
}

export const THEMES = {
  light: LIGHT_THEME,
  dark: DARK_THEME,
  colorful: COLORFUL_THEME,
  minimal: MINIMAL_THEME
};