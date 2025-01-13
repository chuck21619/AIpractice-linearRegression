document.addEventListener('DOMContentLoaded', () => {
    const navLinks = document.querySelectorAll('nav ul li a');
    const contentDiv = document.getElementById('content');

    navLinks.forEach(link => {
        link.addEventListener('click', (event) => {
            event.preventDefault();
            const pageUrl = link.getAttribute('data-page');
        fetch(pageUrl)
            .then(response => response.text())
            .then(html => {
                contentDiv.innerHTML = html;
                if (pageUrl === 'methods/univariate/univariateLinearRegression.html') {
                    const script = document.createElement('script');
                    script.src = 'methods/univariate/univariate.js';
                    script.onload = () => {
                        window.setupDropArea();
                    };
                    document.body.appendChild(script);
                }
            });
        });
    });
});
