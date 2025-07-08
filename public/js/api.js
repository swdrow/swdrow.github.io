async function initApiPage() {
    const apiContent = document.getElementById('api-content');
    apiContent.innerHTML = '<div class="text-center">Loading API documentation...</div>';

    try {
        const response = await fetch('/api/API_DOCUMENTATION.md');
        if (!response.ok) {
            throw new Error('Failed to load API documentation');
        }
        const markdown = await response.text();
        
        // A more robust (but still basic) markdown to HTML conversion
        let html = markdown
            .split('\n')
            .map(line => {
                if (line.startsWith('# ')) return `<h1>${line.substring(2)}</h1>`;
                if (line.startsWith('## ')) return `<h2>${line.substring(3)}</h2>`;
                if (line.startsWith('### ')) return `<h3>${line.substring(4)}</h3>`;
                if (line.startsWith('```json')) return '<pre class="bg-gray-800 p-4 rounded-lg text-white"><code>';
                if (line.startsWith('```bash')) return '<pre class="bg-gray-800 p-4 rounded-lg text-white"><code>';
                if (line.startsWith('```')) return '</code></pre>';
                if (line.trim() === '') return '<br>';
                return `<p>${line}</p>`;
            })
            .join('');

        apiContent.innerHTML = `<div class="prose prose-invert max-w-none">${html}</div>`;

    } catch (error) {
        console.error("Failed to load API documentation:", error);
        apiContent.innerHTML = `<div class="text-center text-red-500">Failed to load API documentation.</div>`;
    }
}
