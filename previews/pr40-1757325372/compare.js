document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const files = params.get('files')?.split(',');

    if (!files || files.length !== 2) {
        document.querySelector('.comparison-container').innerHTML = '<p>Invalid comparison URL. Please select two files to compare.</p>';
        return;
    }

    const [file1, file2] = files;

    document.getElementById('file1-title').textContent = file1;
    document.getElementById('file2-title').textContent = file2;

    try {
        const [content1, content2] = await Promise.all([
            fetch(`https://raw.githubusercontent.com/klezm/awesome-copilot/main/${file1}`).then(res => res.text()),
            fetch(`https://raw.githubusercontent.com/klezm/awesome-copilot/main/${file2}`).then(res => res.text())
        ]);

        console.log('Content 1:', content1.substring(0, 100));
        console.log('Content 2:', content2.substring(0, 100));

        const diff = Diff.diffLines(content1, content2);

        const file1Content = document.getElementById('file1-content');
        const file2Content = document.getElementById('file2-content');

        diff.forEach(part => {
            const span = document.createElement('span');
            span.textContent = part.value;

            if (part.added) {
                span.className = 'diff-added';
                file2Content.appendChild(span);
            } else if (part.removed) {
                span.className = 'diff-removed';
                file1Content.appendChild(span);
            } else {
                span.className = 'diff-common';
                file1Content.appendChild(span.cloneNode(true));
                file2Content.appendChild(span);
            }
        });
    } catch (error) {
        console.error('Error fetching or comparing files:', error);
        document.querySelector('.comparison-container').innerHTML = '<p>Could not load files for comparison.</p>';
    }
});
