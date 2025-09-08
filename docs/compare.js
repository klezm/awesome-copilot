document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const files = params.get('files')?.split(',');

    if (!files || files.length !== 2) {
        document.getElementById('diff-container').innerHTML = '<p>Invalid comparison URL. Please select two files to compare.</p>';
        return;
    }

    const [file1, file2] = files;

    try {
        const [content1, content2] = await Promise.all([
            fetch(`https://raw.githubusercontent.com/klezm/awesome-copilot/main/${file1}`).then(res => res.text()),
            fetch(`https://raw.githubusercontent.com/klezm/awesome-copilot/main/${file2}`).then(res => res.text())
        ]);

        const patch = Diff.createTwoFilesPatch(file1, file2, content1, content2);

        const diff2htmlUi = new Diff2HtmlUI(document.getElementById('diff-container'), patch, {
            drawFileList: false,
            matching: 'lines',
            outputFormat: 'side-by-side'
        });

        diff2htmlUi.draw();

    } catch (error) {
        console.error('Error fetching or comparing files:', error);
        document.getElementById('diff-container').innerHTML = '<p>Could not load files for comparison.</p>';
    }
});
