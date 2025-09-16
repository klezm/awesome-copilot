// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
	integrations: [
		starlight({
			title: 'Docs with Tailwind',
			social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/withastro/starlight' }],
			sidebar: [
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
		}),
	],
	vite: {
		plugins: [tailwindcss()],
	},
});
