// Firebase references imported from main.js (assuming main.js loads first)
// db, auth, storage, ADMIN_UID should be accessible globally or passed
// This approach relies on main.js being loaded before admin.js
// For a larger app, you might use modules (ESM) but for simplicity, global access is fine here.

document.addEventListener('DOMContentLoaded', () => {
    // Admin Login/Logout
    document.getElementById('adminLoginBtn').addEventListener('click', adminLogin);
    document.getElementById('adminLogoutBtn').addEventListener('click', adminLogout);
    
    // Add Blog Post button in Admin Panel
    document.getElementById('addBlogPostBtn').addEventListener('click', addBlogPost);
    document.getElementById('blogImage').addEventListener('change', previewImage);

    // Content Page management buttons - DISABLED as pages are now static
    // document.getElementById('contentPageSelect').addEventListener('change', loadContentPageForEdit);
    // document.getElementById('saveContentPageBtn').addEventListener('click', saveContentPage);

    // Admin Tab Navigation
    document.querySelectorAll('.admin-tab-btn').forEach(button => {
        button.addEventListener('click', function() {
            const tabId = this.dataset.tab;
            showAdminTab(tabId);
        });
    });

    // Auth state change listener (to show/hide admin panel)
    auth.onAuthStateChanged(user => {
        if (user && user.uid === ADMIN_UID) {
            showPage('adminDashboard'); // Uses showPage from main.js
            loadExistingBlogPosts(); // Load existing posts for management
            // loadContentPageForEdit(); // No longer needed as content pages are static
            loadSubscribers(); // Load subscribers list
        } else {
            // If not admin, or logged out, ensure admin sections are hidden
            document.getElementById('admin-login-section').style.display = 'flex'; // Show login form
            document.getElementById('admin-dashboard-section').style.display = 'none';
        }
    });
});


// --- Admin Authentication ---
async function adminLogin() {
    const email = document.getElementById('adminEmail').value;
    const password = document.getElementById('adminPassword').value;
    const messageElem = document.getElementById('adminLoginMessage');

    try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        if (userCredential.user.uid === ADMIN_UID) {
            messageElem.textContent = 'Login successful!';
            messageElem.style.color = 'green';
            showPage('adminDashboard'); // Redirect to dashboard
            // No need to call load functions here as onAuthStateChanged handles it
        } else {
            await auth.signOut(); // Logout unauthorized user
            messageElem.textContent = 'Unauthorized access.';
            messageElem.style.color = 'red';
        }
    } catch (error) {
        console.error("Login error:", error);
        messageElem.textContent = error.message;
        messageElem.style.color = 'red';
    }
}

async function adminLogout() {
    try {
        await auth.signOut();
        // showPage('home'); // Redirect to home page
        // No need to call hideAdminDashboard here, onAuthStateChanged handles it
        document.getElementById('adminEmail').value = ''; // Clear login fields
        document.getElementById('adminPassword').value = '';
        document.getElementById('adminLoginMessage').textContent = '';
    } catch (error) {
        console.error("Logout error:", error);
        alert("Error logging out. Please try again.");
    }
}

// --- Admin Dashboard Tab Management ---
function showAdminTab(tabId) {
    // Deactivate all tab buttons and content
    document.querySelectorAll('.admin-tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.admin-tab-content').forEach(content => content.classList.remove('active'));

    // Activate the clicked tab button and its content
    document.querySelector(`.admin-tab-btn[data-tab="${tabId}"]`).classList.add('active');
    document.getElementById(tabId + '-tab').classList.add('active');
}


// --- Blog Post Management ---
function previewImage() {
    const fileInput = document.getElementById('blogImage');
    const preview = document.getElementById('blogImagePreview');
    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onloadend = function() {
        preview.src = reader.result;
        preview.style.display = 'block';
    }

    if (file) {
        reader.readAsDataURL(file);
    } else {
        preview.src = "";
        preview.style.display = 'none';
    }
}

async function addBlogPost() {
    const postIdToEdit = document.getElementById('addBlogPostBtn').dataset.editingPostId; // Check if editing
    const title = document.getElementById('blogTitle').value;
    const author = document.getElementById('blogAuthor').value;
    const imageFile = document.getElementById('blogImage').files[0];
    const videoUrl = document.getElementById('blogVideo').value;
    const content = document.getElementById('blogContent').value;
    const statusElem = document.getElementById('blogPostStatus');

    if (!title || !author || !content) {
        statusElem.textContent = 'Please fill in all required fields (Title, Author, Content).';
        statusElem.style.color = 'red';
        return;
    }

    statusElem.textContent = 'Processing post...';
    statusElem.style.color = 'blue';

    let imageUrl = '';
    let oldImageUrl = ''; // To delete old image if replaced

    if (postIdToEdit) {
        // If editing, get current post to check old image URL
        const oldPost = allBlogPosts.find(p => p.id === postIdToEdit);
        if (oldPost) {
            oldImageUrl = oldPost.imageUrl;
            imageUrl = oldPost.imageUrl; // Keep old image if not replaced
        }
    }

    if (imageFile) {
        try {
            // Upload new image
            const storageRef = storage.ref('blog_images/' + imageFile.name);
            const snapshot = await storageRef.put(imageFile);
            imageUrl = await snapshot.ref.getDownloadURL();

            // If editing and new image uploaded, delete old image
            if (postIdToEdit && oldImageUrl && oldImageUrl !== imageUrl) {
                const oldImageRef = storage.refFromURL(oldImageUrl);
                await oldImageRef.delete().catch(error => console.warn("Could not delete old image:", error));
            }
        } catch (error) {
            console.error("Error uploading image:", error);
            statusElem.textContent = `Error uploading image: ${error.message}`;
            statusElem.style.color = 'red';
            return;
        }
    }

    const postData = {
        title: title,
        author: author,
        imageUrl: imageUrl,
        videoUrl: videoUrl,
        content: content.split('\n\n').filter(p => p.trim() !== ''), // Split and filter empty paragraphs
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    };

    try {
        if (postIdToEdit) {
            // Update existing post
            await db.collection('blogPosts').doc(postIdToEdit).update(postData);
            statusElem.textContent = 'Blog post updated successfully!';
            document.getElementById('addBlogPostBtn').textContent = 'Add Blog Post';
            document.getElementById('addBlogPostBtn').removeAttribute('data-editing-post-id');
        } else {
            // Add new post
            await db.collection('blogPosts').add(postData);
            statusElem.textContent = 'Blog post added successfully!';
        }
        statusElem.style.color = 'green';
        clearBlogPostForm(); // Clear form

        // Reload blog posts on front-end and admin panel
        await fetchData(); // Re-fetch all data to ensure consistency
        loadExistingBlogPosts(); // Reload admin list
    } catch (error) {
        console.error("Error saving blog post:", error);
        statusElem.textContent = `Error: ${error.message}`;
        statusElem.style.color = 'red';
    }
}

function clearBlogPostForm() {
    document.getElementById('blogTitle').value = '';
    document.getElementById('blogAuthor').value = '';
    document.getElementById('blogImage').value = '';
    document.getElementById('blogImagePreview').src = '';
    document.getElementById('blogImagePreview').style.display = 'none';
    document.getElementById('blogVideo').value = '';
    document.getElementById('blogContent').value = '';
    document.getElementById('addBlogPostBtn').textContent = 'Add Blog Post';
    document.getElementById('addBlogPostBtn').removeAttribute('data-editing-post-id');
    document.getElementById('blogPostStatus').textContent = '';
}


async function loadExistingBlogPosts() {
    const existingBlogPostsDiv = document.getElementById('existingBlogPosts');
    existingBlogPostsDiv.innerHTML = '<p>Loading existing posts...</p>';

    try {
        const snapshot = await db.collection('blogPosts').orderBy('timestamp', 'desc').get();
        allBlogPosts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })); // Update global variable

        if (allBlogPosts.length === 0) {
            existingBlogPostsDiv.innerHTML = '<p>No blog posts found.</p>';
            return;
        }

        const ul = document.createElement('ul');
        ul.style.listStyle = 'none';
        ul.style.padding = '0';

        allBlogPosts.forEach(post => {
            const li = document.createElement('li');
            li.className = 'blog-post-item';
            li.innerHTML = `
                <span>${post.title}</span>
                <div class="actions">
                    <button class="edit-btn" data-post-id="${post.id}">Edit</button>
                    <button class="delete-btn" data-post-id="${post.id}">Delete</button>
                </div>
            `;
            ul.appendChild(li);
        });
        existingBlogPostsDiv.innerHTML = '';
        existingBlogPostsDiv.appendChild(ul);

        // Add event listeners for edit/delete buttons
        ul.querySelectorAll('.edit-btn').forEach(button => {
            button.addEventListener('click', (e) => editBlogPost(e.target.dataset.postId));
        });
        ul.querySelectorAll('.delete-btn').forEach(button => {
            button.addEventListener('click', (e) => deleteBlogPost(e.target.dataset.postId));
        });

    } catch (error) {
        console.error("Error loading existing blog posts:", error);
        existingBlogPostsDiv.innerHTML = '<p style="color: red;">Error loading posts.</p>';
    }
}

function editBlogPost(postId) {
    const post = allBlogPosts.find(p => p.id === postId);
    if (post) {
        document.getElementById('blogTitle').value = post.title;
        document.getElementById('blogAuthor').value = post.author;
        document.getElementById('blogContent').value = post.content.join('\n\n'); // Join paragraphs back
        document.getElementById('blogVideo').value = post.videoUrl || '';
        if (post.imageUrl) {
            document.getElementById('blogImagePreview').src = post.imageUrl;
            document.getElementById('blogImagePreview').style.display = 'block';
        } else {
            document.getElementById('blogImagePreview').src = '';
            document.getElementById('blogImagePreview').style.display = 'none';
        }
        document.getElementById('addBlogPostBtn').textContent = 'Update Blog Post';
        document.getElementById('addBlogPostBtn').dataset.editingPostId = postId;
        document.getElementById('blogPostStatus').textContent = 'Editing post...';
        document.getElementById('blogPostStatus').style.color = 'orange';

        // Scroll to the top of the form for better UX
        document.getElementById('blogTitle').scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

async function deleteBlogPost(postId) {
    if (!confirm('Are you sure you want to delete this blog post?')) {
        return;
    }
    try {
        const post = allBlogPosts.find(p => p.id === postId);
        if (post && post.imageUrl) {
            // Delete image from storage
            const imageRef = storage.refFromURL(post.imageUrl);
            await imageRef.delete().catch(error => console.warn("Could not delete associated image:", error));
        }
        await db.collection('blogPosts').doc(postId).delete();
        alert('Blog post deleted successfully!');
        
        // Reload blog posts on both front-end and admin panel
        await fetchData();
        loadExistingBlogPosts();
    } catch (error) {
        console.error("Error deleting blog post:", error);
        alert(`Error deleting blog post: ${error.message}`);
    }
}

// --- Content Page Management - DISABLED as pages are now static HTML ---
// function loadContentPageForEdit() {
//     const statusElem = document.getElementById('contentPageStatus');
//     statusElem.textContent = 'These pages are now static HTML files and cannot be edited from here.';
//     statusElem.style.color = 'red';
//     document.getElementById('contentPageTitle').value = '';
//     document.getElementById('contentPageBody').value = '';
//     document.getElementById('saveContentPageBtn').disabled = true;
// }

// async function saveContentPage() {
//     // This function is no longer active for static pages
//     return;
// }

// --- Subscriber Management ---
async function loadSubscribers() {
    const subscribersListDiv = document.getElementById('subscribersList');
    subscribersListDiv.innerHTML = '<p>Loading subscribers...</p>';

    try {
        const snapshot = await db.collection('subscribers').orderBy('timestamp', 'desc').get();
        // allSubscribers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })); // Not needed if already fetched by main.js

        if (snapshot.docs.length === 0) {
            subscribersListDiv.innerHTML = '<p>No subscribers found.</p>';
            return;
        }

        const ul = document.createElement('ul');
        snapshot.docs.forEach(doc => { // Iterate directly over snapshot docs
            const sub = { id: doc.id, ...doc.data() };
            const li = document.createElement('li');
            li.innerHTML = `
                <span>${sub.email}</span>
                <span>${sub.timestamp ? new Date(sub.timestamp.toDate()).toLocaleDateString() : 'Date N/A'}</span>
                <button data-subscriber-id="${sub.id}">Delete</button>
            `;
            li.querySelector('button').addEventListener('click', (e) => deleteSubscriber(e.target.dataset.subscriberId));
            ul.appendChild(li);
        });
        subscribersListDiv.innerHTML = '<h3>Current Subscribers</h3>';
        subscribersListDiv.appendChild(ul);

    } catch (error) {
        console.error("Error loading subscribers:", error);
        subscribersListDiv.innerHTML = '<p style="color: red;">Error loading subscribers.</p>';
    }
}

async function deleteSubscriber(subscriberId) {
    if (!confirm('Are you sure you want to delete this subscriber?')) {
        return;
    }
    try {
        await db.collection('subscribers').doc(subscriberId).delete();
        alert('Subscriber deleted successfully!');
        loadSubscribers(); // Reload the list
    } catch (error) {
        console.error("Error deleting subscriber:", error);
        alert(`Error deleting subscriber: ${error.message}`);
    }
}
