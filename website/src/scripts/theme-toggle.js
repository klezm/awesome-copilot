const themeToggle = document.querySelector('#theme-toggle');
const systemPreference = window.matchMedia('(prefers-color-scheme: dark)');

const toggleTheme = (isDark) => {
	document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
	localStorage.setItem('theme', isDark ? 'dark' : 'light');
	if (themeToggle) {
		themeToggle.checked = isDark;
	}
};

const applyTheme = () => {
	const savedTheme = localStorage.getItem('theme');
	const prefersDark = systemPreference.matches;
	toggleTheme(savedTheme ? savedTheme === 'dark' : prefersDark);
};

systemPreference.addEventListener('change', (e) => {
	toggleTheme(e.matches);
});

if (themeToggle) {
	themeToggle.addEventListener('click', () => {
		const currentTheme = document.documentElement.getAttribute('data-theme');
		toggleTheme(currentTheme !== 'dark');
	});
}

applyTheme();
