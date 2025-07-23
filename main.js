// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAFIonE-mcnhxFPDSLFiiIs1-tURXqgGYE",
    authDomain: "modhusudhan-654e7.firebaseapp.com",
    projectId: "modhusudhan-654e7",
    storageBucket: "modhusudhan-654e7.firebasestorage.app", // Corrected storageBucket domain
    messagingSenderId: "221731458319",
    appId: "1:221731458319:web:127f4d6f18abf1451e027a",
    measurementId: "G-S8WE56VM8X"
};
const ADMIN_UID = "Gn3gILtHcjR5meyLp7SiwjxMyaH3"; // Your Admin UID
const CONTACT_FORM_EMAIL_TO = "toolgenixs@gmail.com"; // Your email for contact form submissions

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();
const storage = firebase.storage();

// Global variables to store fetched data
let allTools = [];
let allCategories = [];
let allBlogPosts = [];
// allContentPages is no longer needed as content pages are static HTML

// Element references
const mainContentContainer = document.getElementById('main-content-container');
const adminLoginSection = document.getElementById('admin-login-section'); // Keep for JS access for admin.js
const adminDashboardSection = document.getElementById('admin-dashboard-section');
const singleBlogPostPage = document.getElementById('single-blog-post-page');

const heroSection = document.querySelector('.hero');
const statsSection = document.querySelector('.stats-section');
const searchSection = document.querySelector('.search-section');
const categoriesSection = document.getElementById('categories');
const toolGridSection = document.getElementById('tool-grid-section');
const blogSection = document.getElementById('blog-section');
const subscribeSection = document.getElementById('subscribe');
const footerSection = document.querySelector('.footer');


document.addEventListener('DOMContentLoaded', () => {
    // Initialize Typed.js
    const typed = new Typed('#typed-text', {
        strings: ['AI Tools', 'ML Platforms', 'Data Science', 'Automation', 'Generative AI'],
        typeSpeed: 60,
        backSpeed: 30,
        loop: true,
        showCursor: true,
        cursorChar: '|'
    });

    // Initialize Lottie animation
    const animationContainer = document.getElementById('lottie-animation');
    // **IMPORTANT**: Make sure 'your-animation.json' exists in the 'lottie-animations' folder.
    // You can replace 'your-animation.json' with your actual Lottie JSON file name.
    lottie.loadAnimation({
        container: animationContainer,
        renderer: 'svg',
        loop: true,
        autoplay: true,
        path: 'lottie-animations/your-animation.json' // Path corrected to root
    });

    // Create particle effect
    createParticles();

    // Set up event listeners
    document.getElementById('searchInput').addEventListener('input', filterTools);
    document.getElementById('categoryFilter').addEventListener('change', filterTools);
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);
    
    // Subscription buttons
    document.getElementById('subscribeBtn').addEventListener('click', openModal);
    document.getElementById('heroSubscribe').addEventListener('click', openModal);
    document.getElementById('footerSubscribe').addEventListener('click', subscribe);

    // Set initial theme based on localStorage or system preference
    const savedTheme = localStorage.getItem('theme');
    const themeToggleIcon = document.querySelector('.theme-toggle .toggle-icon');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        themeToggleIcon.textContent = '🌙'; // Moon emoji for dark mode
    } else if (savedTheme === 'light') {
        document.body.classList.remove('dark-mode');
        themeToggleIcon.textContent = '☀️'; // Sun emoji for light mode
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.body.classList.add('dark-mode');
        themeToggleIcon.textContent = '🌙';
    } else {
        themeToggleIcon.textContent = '☀️'; // Default to sun if no preference
    }

    // Load data from Firebase
    fetchData();
    
    // Initial view
    showPage('home'); // Show home content by default
});

function createParticles() {
    const container = document.getElementById('particles');
    if (!container) return; // Add a check in case particles div isn't there
    const count = 30;
    
    for (let i = 0; i < count; i++) {
        const particle = document.createElement('div');
        particle.classList.add('particle');
        
        // Random properties
        const size = Math.random() * 5 + 2;
        const posX = Math.random() * 100;
        const posY = Math.random() * 100;
        const animationDuration = Math.random() * 10 + 10;
        const animationDelay = Math.random() * 5;
        
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.left = `${posX}%`;
        particle.style.top = `${posY}%`;
        particle.style.animationDuration = `${animationDuration}s`;
        particle.style.animationDelay = `${animationDelay}s`;
        
        container.appendChild(particle);
    }
}

async function fetchData() {
    try {
        // Fetch Categories
        const categoriesSnapshot = await db.collection('categories').get();
        allCategories = categoriesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        loadCategories();
        
        // Fetch Tools
        const toolsSnapshot = await db.collection('tools').get();
        allTools = toolsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        loadTools();
        populateCategoryFilter(allCategories);

        // Fetch Blog Posts
        const blogPostsSnapshot = await db.collection('blogPosts').orderBy('timestamp', 'desc').get();
        allBlogPosts = blogPostsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        loadBlogPosts();
        
        // Update Stats
        document.getElementById('toolsCount').textContent = `${allTools.length}+`;
        document.getElementById('usersCount').textContent = `500K+`; // Static for now, can be dynamic
    } catch (error) {
        console.error("Error fetching data:", error);
        document.getElementById('tool-grid').innerHTML = '<p style="text-align: center; color: red;">Failed to load tools. Please try again later.</p>';
        document.getElementById('blogPostsGrid').innerHTML = '<p style="text-align: center; color: red;">Failed to load blog posts. Please try again later.</p>';
    }
}

function loadCategories() {
    const categoriesGrid = document.querySelector('.categories-grid');
    categoriesGrid.innerHTML = ''; 

    if (allCategories.length === 0) {
        categoriesGrid.innerHTML = '<p style="text-align: center;">No categories found.</p>';
        return;
    }
    
    allCategories.forEach((category, index) => {
        const categoryCard = document.createElement('div');
        categoryCard.className = `category-card fade-in delay-${index % 4}`;
        categoryCard.dataset.categoryName = category.name; 
        categoryCard.innerHTML = `
            <div class="category-icon"><i class="${category.icon}"></i></div>
            <h3 class="category-name">${category.name}</h3>
            <div class="category-count">${category.count}+ Tools</div>
        `;
        categoryCard.addEventListener('click', () => {
            document.getElementById('categoryFilter').value = category.name;
            filterTools();
            document.getElementById('tool-grid-section').scrollIntoView({ behavior: 'smooth' });
        });
        categoriesGrid.appendChild(categoryCard);
    });
}

function loadTools() {
    const toolGrid = document.getElementById('tool-grid');
    toolGrid.innerHTML = '<div class="loader"></div>'; 
    
    setTimeout(() => {
        toolGrid.innerHTML = ''; 
        if (allTools.length === 0) {
            toolGrid.innerHTML = '<p style="text-align: center;">No AI tools found.</p>';
            return;
        }

        allTools.forEach((tool, index) => {
            const toolCard = document.createElement('a');
            toolCard.href = tool.link;
            toolCard.target = "_blank";
            toolCard.rel = "noopener noreferrer";
            toolCard.className = `tool-card fade-in delay-${index % 3}`;
            toolCard.innerHTML = `
                <div class="tool-icon">
                    <img src="${tool.icon}" alt="${tool.name}">
                    <div class="tool-badge">AI</div>
                </div>
                <div class="tool-info">
                    <h3>${tool.name}</h3>
                    <p class="tool-category">${tool.category}</p>
                    <p class="tool-description">${tool.description}</p>
                    <div class="tool-meta">
                        <span class="tool-rating">${'★'.repeat(tool.rating || 0)}${'☆'.repeat(5 - (tool.rating || 0))}</span>
                        <span class="tool-reviews">${tool.reviews || '0'} reviews</span>
                    </div>
                </div>
                <div class="tool-link">
                    <span>Explore</span>
                    <i class="fas fa-arrow-right"></i>
                </div>
            `;
            toolGrid.appendChild(toolCard);
        });
    }, 1500); // Simulate loading delay
}

function populateCategoryFilter(categories) {
    const categoryFilter = document.getElementById('categoryFilter');
    categoryFilter.innerHTML = '<option value="all">All Categories</option>'; 

    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.name;
        option.textContent = category.name;
        categoryFilter.appendChild(option);
    });
}

function filterTools() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const selectedCategory = document.getElementById('categoryFilter').value;
    
    const toolGrid = document.getElementById('tool-grid');
    toolGrid.innerHTML = ''; 

    const filteredTools = allTools.filter(tool => {
        const name = tool.name.toLowerCase();
        const description = tool.description.toLowerCase();
        const toolCategory = tool.category;
        
        const matchesSearch = name.includes(searchTerm) || description.includes(searchTerm);
        const matchesCategory = selectedCategory === 'all' || toolCategory === selectedCategory;
        
        return matchesSearch && matchesCategory;
    });

    if (filteredTools.length === 0) {
        toolGrid.innerHTML = '<p style="text-align: center;">No tools found matching your criteria.</p>';
        return;
    }

    filteredTools.forEach((tool, index) => {
        const toolCard = document.createElement('a');
        toolCard.href = tool.link;
        toolCard.target = "_blank";
        toolCard.rel = "noopener noreferrer";
        toolCard.className = `tool-card fade-in delay-${index % 3}`;
        toolCard.innerHTML = `
            <div class="tool-icon">
                <img src="${tool.icon}" alt="${tool.name}">
                <div class="tool-badge">AI</div>
            </div>
            <div class="tool-info">
                <h3>${tool.name}</h3>
                <p class="tool-category">${tool.category}</p>
                <p class="tool-description">${tool.description}</p>
                <div class="tool-meta">
                    <span class="tool-rating">${'★'.repeat(tool.rating || 0)}${'☆'.repeat(5 - (tool.rating || 0))}</span>
                    <span class="tool-reviews">${tool.reviews || '0'} reviews</span>
                </div>
            </div>
            <div class="tool-link">
                <span>Explore</span>
                <i class="fas fa-arrow-right"></i>
            </div>
        `;
        toolGrid.appendChild(toolCard);
    });
}

function toggleTheme() {
    const body = document.body;
    const themeToggleIcon = document.querySelector('.theme-toggle .toggle-icon');
    body.classList.toggle('dark-mode');
    if (body.classList.contains('dark-mode')) {
        localStorage.setItem('theme', 'dark');
        themeToggleIcon.textContent = '🌙'; // Moon emoji for dark mode
    } else {
        localStorage.setItem('theme', 'light');
        themeToggleIcon.textContent = '☀️'; // Sun emoji for light mode
    }
}


function openModal() {
    alert('Subscribe to our newsletter for the latest AI tools and updates!');
}

async function subscribe() {
    const emailInput = document.getElementById('subscribeEmail');
    const email = emailInput.value;

    if (email && validateEmail(email)) {
        try {
            await db.collection('subscribers').add({
                email: email,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
            alert(`Thank you for subscribing with ${email}! You'll receive our updates soon.`);
            emailInput.value = ''; 
        } catch (error) {
            console.error("Error adding document: ", error);
            alert('There was an error subscribing. Please try again.');
        }
    } else {
        alert('Please enter a valid email address');
    }
}

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// --- Page Display Logic ---

// Hide all main sections and specific pages
function hideAllSections() {
    mainContentContainer.style.display = 'none';
    adminLoginSection.style.display = 'none'; // Keep for admin.js to show/hide
    adminDashboardSection.style.display = 'none';
    singleBlogPostPage.style.display = 'none';
    // Hide specific main sections if needed for dynamic display
    heroSection.style.display = 'none';
    statsSection.style.display = 'none';
    searchSection.style.display = 'none';
    categoriesSection.style.display = 'none';
    toolGridSection.style.display = 'none';
    blogSection.style.display = 'none';
    subscribeSection.style.display = 'none';
    footerSection.style.display = 'none'; // Footer usually always visible, but good for total control
}

// Show specific pages based on parameter
function showPage(pageName, data = null) {
    hideAllSections(); // Hide everything first
    window.scrollTo(0, 0); // Scroll to top on page change

    // Dynamically update meta description and title for SEO
    const metaDescription = document.querySelector('meta[name="description"]');
    const pageTitle = document.querySelector('title');

    switch (pageName) {
        case 'home':
            mainContentContainer.style.display = 'block'; // Show entire main content
            heroSection.style.display = 'flex';
            statsSection.style.display = 'block';
            searchSection.style.display = 'block';
            categoriesSection.style.display = 'block';
            toolGridSection.style.display = 'block';
            blogSection.style.display = 'block';
            subscribeSection.style.display = 'block';
            footerSection.style.display = 'block';
            pageTitle.textContent = 'Braynio - Discover AI Tools & Blog';
            metaDescription.setAttribute('content', 'Discover the best AI tools, read insightful blog posts, and stay updated with the latest in artificial intelligence.');
            break;
        case 'tools':
            mainContentContainer.style.display = 'block';
            searchSection.style.display = 'block';
            toolGridSection.style.display = 'block';
            subscribeSection.style.display = 'block';
            footerSection.style.display = 'block';
            pageTitle.textContent = 'AI Tools | Braynio';
            metaDescription.setAttribute('content', 'Browse our extensive collection of AI tools across various categories.');
            document.getElementById('tool-grid-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
            break;
        case 'categories':
            mainContentContainer.style.display = 'block';
            categoriesSection.style.display = 'block';
            subscribeSection.style.display = 'block';
            footerSection.style.display = 'block';
            pageTitle.textContent = 'Categories | Braynio';
            metaDescription.setAttribute('content', 'Explore AI tools by category to find exactly what you need.');
            document.getElementById('categories').scrollIntoView({ behavior: 'smooth', block: 'start' });
            break;
        case 'blog':
            mainContentContainer.style.display = 'block';
            blogSection.style.display = 'block';
            subscribeSection.style.display = 'block';
            footerSection.style.display = 'block';
            pageTitle.textContent = 'Blog | Braynio';
            metaDescription.setAttribute('content', 'Read the latest blog posts and insights on artificial intelligence.');
            document.getElementById('blog-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
            break;
        case 'adminDashboard': // Called from admin.js after successful login
            adminDashboardSection.style.display = 'block';
            pageTitle.textContent = 'Admin Dashboard | Braynio';
            metaDescription.setAttribute('content', 'Manage Braynio website content and users.');
            break;
        case 'singleBlogPost':
            displaySingleBlogPost(data); // data here will be postId
            break;
        default:
            showPage('home'); // Fallback to home
            break;
    }
}

// Load and Display Blog Posts (Frontend)
function loadBlogPosts() {
    const blogPostsGrid = document.getElementById('blogPostsGrid');
    blogPostsGrid.innerHTML = ''; // Clear existing posts

    if (allBlogPosts.length === 0) {
        blogPostsGrid.innerHTML = '<p style="text-align: center;">No blog posts available yet.</p>';
        return;
    }

    allBlogPosts.forEach(post => {
        const postCard = document.createElement('div');
        postCard.className = 'blog-post-card';
        postCard.innerHTML = `
            ${post.imageUrl ? `<img src="${post.imageUrl}" alt="${post.title}">` : ''}
            <div class="blog-post-info">
                <h3>${post.title}</h3>
                <div class="blog-post-meta">
                    <span>By ${post.author}</span>
                    <span>${post.timestamp ? new Date(post.timestamp.toDate()).toLocaleDateString() : 'Date N/A'}</span>
                </div>
                <p class="blog-post-description">${post.content[0].substring(0, 150)}...</p>
                <button class="subscribe-btn" style="background: var(--secondary);" onclick="event.preventDefault(); showPage('singleBlogPost', '${post.id}')">Read More</button>
            </div>
        `;
        blogPostsGrid.appendChild(postCard);
    });
}

// Display a single blog post
function displaySingleBlogPost(postId) {
    singleBlogPostPage.style.display = 'block';

    const post = allBlogPosts.find(p => p.id === postId);

    if (!post) {
        singleBlogPostPage.innerHTML = '<p style="text-align: center;">Blog post not found.</p><button onclick="showPage(\'blog\')" style="margin-top: 2rem; background: var(--secondary);">Back to Blog</button>';
        return;
    }

    // SEO updates for single post
    document.title = `${post.title} | Braynio Blog`;
    document.querySelector('meta[name="description"]').setAttribute("content", post.content[0].substring(0, 160));
    addBlogPostSchema(post); // Add structured data

    document.getElementById('single-post-title').textContent = post.title;
    document.getElementById('single-post-author').textContent = post.author;
    document.getElementById('single-post-date').textContent = post.timestamp ? new Date(post.timestamp.toDate()).toLocaleDateString() : 'Date N/A';

    const postImage = document.getElementById('single-post-image');
    if (post.imageUrl) {
        postImage.src = post.imageUrl;
        postImage.style.display = 'block';
    } else {
        postImage.style.display = 'none';
    }

    const postVideoContainer = document.getElementById('single-post-video');
    postVideoContainer.innerHTML = '';
    if (post.videoUrl) {
        let embedHtml = '';
        if (post.videoUrl.includes('youtube.com/')) { // Changed from googleusercontent to direct YouTube
            const videoId = post.videoUrl.split('v=')[1]?.split('&')[0];
            if (videoId) {
                embedHtml = `<iframe width="100%" height="400" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
            }
        } else if (post.videoUrl.includes('vimeo.com/')) {
            const videoId = post.videoUrl.split('vimeo.com/')[1]?.split('?')[0];
            if (videoId) {
                embedHtml = `<iframe src="https://player.vimeo.com/video/${videoId}" width="100%" height="400" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>`;
            }
        }
        postVideoContainer.innerHTML = embedHtml;
        postVideoContainer.style.display = 'block';
    } else {
        postVideoContainer.style.display = 'none';
    }

    const postContent = document.getElementById('single-post-content');
    postContent.innerHTML = post.content.map(p => `<p>${p}</p>`).join(''); // Render paragraphs
}

// SEO: Add structured data for blog posts
function addBlogPostSchema(post) {
    // Remove any existing schema scripts to avoid duplicates
    const oldSchema = document.querySelector('script[type="application/ld+json"][data-schema-type="blog-post"]');
    if (oldSchema) {
        oldSchema.remove();
    }

    const schemaData = {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        "headline": post.title,
        "image": post.imageUrl,
        "datePublished": post.timestamp ? new Date(post.timestamp.toDate()).toISOString() : '',
        "author": {
            "@type": "Person",
            "name": post.author
        },
        "articleBody": post.content.join('\n\n'),
        "publisher": {
            "@type": "Organization",
            "name": "Braynio",
            "logo": {
                "@type": "ImageObject",
                "url": "https://yourwebsite.com/images/logo.png" // Replace with your actual logo URL
            }
        },
        "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": window.location.href // Current URL of the blog post
        }
    };
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-schema-type', 'blog-post'); // Custom attribute to identify
    script.textContent = JSON.stringify(schemaData);
    document.head.appendChild(script);
}

// Handle Contact Form Submission - this function will be called from contact.html
// So it needs to be accessible globally or loaded there directly.
// For now, it stays in main.js, but contact.html needs to have access to `db`
// To ensure it can submit. A simpler way is to use a Firebase Cloud Function for email sending,
// but for direct Firestore submission, this works if main.js is loaded on contact.html
async function handleContactFormSubmit(event) {
    event.preventDefault(); // Prevent default form submission
    const name = document.getElementById('contactName').value;
    const email = document.getElementById('contactEmail').value;
    const message = document.getElementById('contactMessage').value;
    const statusElem = document.getElementById('contactFormStatus');

    if (!name || !email || !message) {
        statusElem.textContent = 'Please fill in all fields.';
        statusElem.style.color = 'red';
        return;
    }
    if (!validateEmail(email)) {
        statusElem.textContent = 'Please enter a valid email address.';
        statusElem.style.color = 'red';
        return;
    }

    statusElem.textContent = 'Sending message...';
    statusElem.style.color = 'blue';

    try {
        await db.collection('contactMessages').add({
            name: name,
            email: email, // Sender's email
            message: message,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            // You can add a field to send to a specific email if you use a Cloud Function
            // e.g., sendTo: CONTACT_FORM_EMAIL_TO
        });
        statusElem.textContent = 'Message sent successfully! We will get back to you soon.';
        statusElem.style.color = 'green';
        // Clear form
        document.getElementById('contactName').value = '';
        document.getElementById('contactEmail').value = '';
        document.getElementById('contactMessage').value = '';
    } catch (error) {
        console.error("Error sending contact message:", error);
        statusElem.textContent = `Error sending message: ${error.message}`;
        statusElem.style.color = 'red';
    }
                                  }
