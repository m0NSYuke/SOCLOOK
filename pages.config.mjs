import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({root:'pages-client',base:'./',plugins:[react()],publicDir:false,build:{outDir:'../pages-dist',emptyOutDir:true}});
