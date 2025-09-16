// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
	site: 'https://example.com',
	integrations: [
		starlight({
			title: 'Awesome Copilot Collection',
			social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/github/awesome-copilot' }],
			sidebar: [
				{
					label: 'Template Collection',
					link: '/',
				},
				{
					label: 'Chatmodes',
					autogenerate: { directory: 'chatmodes' },
				},
				{
					label: 'Instructions',
					autogenerate: { directory: 'instructions' },
				},
				{
					label: 'Prompts',
					autogenerate: { directory: 'prompts' },
				},
			],
			customCss: ['./src/styles/global.css'],
			components: {
				Sidebar: './src/components/Sidebar.astro',
			},
		}),
	],
	vite: {
		plugins: [tailwindcss()],
	},
});
