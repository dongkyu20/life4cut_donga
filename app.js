// Appwrite configuration
const appwriteConfig = {
  endpoint: 'https://syd.cloud.appwrite.io/v1', // Appwrite Cloud endpoint
  projectId: '<project_id>',
  bucketId: '<bucket_id>'
};

// Initialize Appwrite
let appwriteClient;
let appwriteStorage;

function initializeAppwrite() {
  appwriteClient = new Appwrite.Client();
  appwriteClient.setEndpoint(appwriteConfig.endpoint);
  appwriteClient.setProject(appwriteConfig.projectId);
  appwriteStorage = new Appwrite.Storage(appwriteClient);
}

// Frame configurations with custom photo positions and sizes
const frameConfigs = {
    classic: {
        name: 'Classic',
        frameImage: 'frame1.png',
        canvasWidth: 400,
        canvasHeight: 800,
        photos: [
            { x: 30, y: 50, width: 167, height: 297 },   // Top-left
            { x: 203, y: 50, width: 167, height: 297 },  // Top-right
            { x: 30, y: 350, width: 167, height: 297 },  // Bottom-left
            { x: 203, y: 350, width: 167, height: 297 }  // Bottom-right
        ],
        titleY: 40,
        dateY: 780
    },
    polaroid: {
        name: 'Polaroid',
        frameImage: 'frame2.png',
        canvasWidth: 400,
        canvasHeight: 800,
        photos: [
            { x: 50, y: 80, width: 150, height: 150 },
            { x: 210, y: 80, width: 150, height: 150 },
            { x: 50, y: 280, width: 150, height: 150 },
            { x: 210, y: 280, width: 150, height: 150 }
        ],
        titleY: 50,
        dateY: 760
    },
    compact: {
        name: 'Compact',
        frameImage: 'frame3.png',
        canvasWidth: 400,
        canvasHeight: 800,
        photos: [
            { x: 70, y: 100, width: 130, height: 130 },
            { x: 210, y: 100, width: 130, height: 130 },
            { x: 70, y: 250, width: 130, height: 130 },
            { x: 210, y: 250, width: 130, height: 130 }
        ],
        titleY: 60,
        dateY: 740
    },
    vertical: {
        name: 'Vertical Strip',
        frameImage: 'frame4.png',
        canvasWidth: 300,
        canvasHeight: 1000,
        photos: [
            { x: 50, y: 50, width: 200, height: 200 },
            { x: 50, y: 270, width: 200, height: 200 },
            { x: 50, y: 490, width: 200, height: 200 },
            { x: 50, y: 710, width: 200, height: 200 }
        ],
        titleY: 30,
        dateY: 970
    }
};

// Global state management
const appState = {
    capturedPhotos: [],
    selectedPhotos: [],
    currentFrame: 'classic',
    finalImageDataUrl: '',
    uploadedImageUrl: '',
    pages: ['capture-page', 'selection-page', 'frame-page', 'preview-page'],
    currentPage: 0
};

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeCamera();
    setupEventListeners();
    generateFrameOptions();
    initializeAppwrite();
});

// Camera initialization
async function initializeCamera() {
    const video = document.getElementById('camera-stream');

    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                width: { ideal: 640 },
                height: { ideal: 480 },
                facingMode: 'user'
            },
            audio: false
        });

        video.srcObject = stream;
    } catch (error) {
        console.error('Error accessing camera:', error);
        alert('Unable to access camera. Please ensure you have granted camera permissions.');
    }
}

// Event listeners setup
function setupEventListeners() {
    // Page 1: Capture
    document.getElementById('start-capture').addEventListener('click', startPhotoCapture);

    // Page 2: Selection
    document.getElementById('back-to-capture').addEventListener('click', () => navigateToPage(0));
    document.getElementById('continue-to-frame').addEventListener('click', () => {
        if (appState.selectedPhotos.length === 4) {
            renderFramePreview();
            navigateToPage(2);
        }
    });

    // Page 3: Frame
    document.getElementById('back-to-selection').addEventListener('click', () => navigateToPage(1));
    document.getElementById('continue-to-preview').addEventListener('click', () => {
        generateFinalImage();
        navigateToPage(3);
    });

    // Page 4: Preview
    document.getElementById('download-direct').addEventListener('click', downloadFinalImage);
    document.getElementById('start-over').addEventListener('click', resetApp);
}

// Generate frame options dynamically
function generateFrameOptions() {
    const container = document.getElementById('frame-options');
    container.innerHTML = '';

    Object.keys(frameConfigs).forEach((frameKey, index) => {
        const frame = frameConfigs[frameKey];
        const option = document.createElement('div');
        option.className = 'frame-option' + (index === 0 ? ' selected' : '');
        option.dataset.frame = frameKey;

        // Create thumbnail preview
        const thumbnail = document.createElement('div');
        thumbnail.className = 'frame-thumbnail';
        thumbnail.innerHTML = `
            <div class="frame-preview-mini">
                <div class="photo-placeholder"></div>
                <div class="photo-placeholder"></div>
                <div class="photo-placeholder"></div>
                <div class="photo-placeholder"></div>
            </div>
        `;

        const label = document.createElement('p');
        label.textContent = frame.name;

        option.appendChild(thumbnail);
        option.appendChild(label);

        option.addEventListener('click', function() {
            document.querySelectorAll('.frame-option').forEach(opt => opt.classList.remove('selected'));
            this.classList.add('selected');
            appState.currentFrame = frameKey;
            renderFramePreview();
        });

        container.appendChild(option);
    });
}

// Photo capture functionality
async function startPhotoCapture() {
    const video = document.getElementById('camera-stream');
    const canvas = document.getElementById('capture-canvas');
    const ctx = canvas.getContext('2d');
    const countdown = document.getElementById('countdown');
    const startButton = document.getElementById('start-capture');
    const progressIndicator = document.getElementById('progress-indicator');
    const photoCount = document.getElementById('photo-count');
    const capturedPhotosContainer = document.getElementById('captured-photos');

    // Reset captured photos
    appState.capturedPhotos = [];
    capturedPhotosContainer.innerHTML = '';

    // Setup canvas dimensions
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Disable start button and show progress
    startButton.disabled = true;
    progressIndicator.classList.remove('hidden');

    // Capture 8 photos with 5-second intervals
    for (let i = 0; i < 8; i++) {
        photoCount.textContent = i + 1;

        // Countdown from 5 to 1
        for (let count = 5; count > 0; count--) {
            countdown.textContent = count;
            countdown.classList.add('show');
            await sleep(1000);
        }

        // Capture photo
        countdown.textContent = 'SMILE!';
        await sleep(500);

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const photoDataUrl = canvas.toDataURL('image/jpeg', 0.9);
        appState.capturedPhotos.push(photoDataUrl);

        // Don't display captured photos during shooting
        // Photos will be shown on selection page instead

        countdown.classList.remove('show');

        // Wait before next photo (if not the last one)
        if (i < 7) {
            await sleep(500);
        }
    }

    // // Re-enable button and hide progress
    // startButton.disabled = false;
    // startButton.textContent = 'Retake Photos';
    progressIndicator.classList.add('hidden');

    // Automatically move to selection page
    setTimeout(() => {
        renderSelectionGrid();
        navigateToPage(1);
    }, 1500);
}

// Render photo selection grid
function renderSelectionGrid() {
    const grid = document.getElementById('selection-grid');
    grid.innerHTML = '';

    appState.capturedPhotos.forEach((photo, index) => {
        const photoItem = document.createElement('div');
        photoItem.className = 'photo-item';
        photoItem.dataset.index = index;

        const img = document.createElement('img');
        img.src = photo;

        photoItem.appendChild(img);
        photoItem.addEventListener('click', togglePhotoSelection);

        grid.appendChild(photoItem);
    });

    // Reset selection
    appState.selectedPhotos = [];
    updateSelectionButton();
}

// Toggle photo selection
function togglePhotoSelection(event) {
    const photoItem = event.currentTarget;
    const index = parseInt(photoItem.dataset.index);
    const photo = appState.capturedPhotos[index];

    if (photoItem.classList.contains('selected')) {
        // Deselect
        photoItem.classList.remove('selected');
        appState.selectedPhotos = appState.selectedPhotos.filter(p => p !== photo);
    } else {
        // Check if we can select more
        if (appState.selectedPhotos.length < 4) {
            photoItem.classList.add('selected');
            appState.selectedPhotos.push(photo);
        } else {
            alert('You can only select 4 photos!');
        }
    }

    updateSelectionButton();
}

// Update selection button text
function updateSelectionButton() {
    const button = document.getElementById('continue-to-frame');
    const count = appState.selectedPhotos.length;

    button.textContent = `Continue (${count}/4 selected)`;
    button.disabled = count !== 4;
}

// Render frame preview
function renderFramePreview() {
    const canvas = document.getElementById('frame-preview');
    const ctx = canvas.getContext('2d');
    const config = frameConfigs[appState.currentFrame];

    // Set canvas size based on frame configuration
    canvas.width = config.canvasWidth;
    canvas.height = config.canvasHeight;

    // Clear canvas with white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // First, draw the frame background if it exists
    if (config.frameImage) {
        const frameImg = new Image();
        frameImg.onload = function() {
            // Draw frame first (no transparency)
            ctx.drawImage(frameImg, 0, 0, canvas.width, canvas.height);

            // Then draw photos on top
            drawPhotosOnCanvas(ctx, config, appState.selectedPhotos, () => {
                // Add text decorations after photos
                drawTextDecorations(ctx, config);
            });
        };
        frameImg.onerror = function() {
            console.log(`${config.frameImage} not found, drawing without frame`);
            // Draw photos without frame
            drawPhotosOnCanvas(ctx, config, appState.selectedPhotos, () => {
                drawTextDecorations(ctx, config);
            });
        };
        frameImg.src = config.frameImage;
    } else {
        // No frame image, just draw photos
        drawPhotosOnCanvas(ctx, config, appState.selectedPhotos, () => {
            drawTextDecorations(ctx, config);
        });
    }
}

// Helper function to draw photos on canvas
function drawPhotosOnCanvas(ctx, config, photos, callback) {
    let loadedPhotos = 0;

    photos.forEach((photo, index) => {
        const img = new Image();
        img.onload = function() {
            const photoConfig = config.photos[index];

            // Draw photo with cropping to maintain aspect ratio
            drawCroppedImage(ctx, img, photoConfig.x, photoConfig.y, photoConfig.width, photoConfig.height);

            loadedPhotos++;
            if (loadedPhotos === 4 && callback) {
                callback();
            }
        };
        img.src = photo;
    });
}

// Function to draw image with center cropping to maintain aspect ratio
function drawCroppedImage(ctx, img, x, y, width, height) {
    const targetAspect = width / height;
    const imgAspect = img.width / img.height;

    let sourceX = 0;
    let sourceY = 0;
    let sourceWidth = img.width;
    let sourceHeight = img.height;

    if (imgAspect > targetAspect) {
        // Image is wider than target - crop horizontally
        sourceWidth = img.height * targetAspect;
        sourceX = (img.width - sourceWidth) / 2;
    } else if (imgAspect < targetAspect) {
        // Image is taller than target - crop vertically
        sourceHeight = img.width / targetAspect;
        sourceY = (img.height - sourceHeight) / 2;
    }

    // Draw the cropped image
    ctx.drawImage(
        img,
        sourceX, sourceY, sourceWidth, sourceHeight,  // Source rectangle (cropped area)
        x, y, width, height                           // Destination rectangle
    );
}

// Helper function to draw text decorations
function drawTextDecorations(ctx, config) {
    // Add title
    ctx.fillStyle = '#764ba2';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Life Four Cuts', ctx.canvas.width / 2, config.titleY);

    // Add date
    const date = new Date().toLocaleDateString();
    ctx.font = '16px Arial';
    ctx.fillStyle = '#666';
    ctx.fillText(date, ctx.canvas.width / 2, config.dateY);
}


// Generate final image
function generateFinalImage() {
    const canvas = document.getElementById('final-canvas');
    const ctx = canvas.getContext('2d');
    const config = frameConfigs[appState.currentFrame];

    // Set canvas size based on frame configuration
    canvas.width = config.canvasWidth;
    canvas.height = config.canvasHeight;

    // Clear canvas with white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // First, draw the frame if it exists
    if (config.frameImage) {
        const frameImg = new Image();
        frameImg.crossOrigin = 'anonymous';
        frameImg.onload = function() {
            // Draw frame background first (no transparency)
            ctx.drawImage(frameImg, 0, 0, canvas.width, canvas.height);

            // Then draw photos on top of frame
            drawFinalPhotos(ctx, config, () => {
                // Add text decorations last
                drawFinalTextDecorations(ctx, config);

                // Save final image
                appState.finalImageDataUrl = canvas.toDataURL('image/jpeg', 0.95);
                generateQRCode();
            });
        };
        frameImg.onerror = function() {
            console.log(`${config.frameImage} not found, generating without frame`);
            // Draw without frame
            drawFinalPhotos(ctx, config, () => {
                drawFinalTextDecorations(ctx, config);
                appState.finalImageDataUrl = canvas.toDataURL('image/jpeg', 0.95);
                generateQRCode();
            });
        };
        frameImg.src = config.frameImage;
    } else {
        // No frame, just draw photos
        drawFinalPhotos(ctx, config, () => {
            drawFinalTextDecorations(ctx, config);
            appState.finalImageDataUrl = canvas.toDataURL('image/jpeg', 0.95);
            generateQRCode();
        });
    }
}

// Helper function to draw photos for final image
function drawFinalPhotos(ctx, config, callback) {
    let loadedCount = 0;

    appState.selectedPhotos.forEach((photo, index) => {
        const img = new Image();
        img.onload = function() {
            const photoConfig = config.photos[index];

            // Draw photo with cropping to maintain aspect ratio
            drawCroppedImage(ctx, img, photoConfig.x, photoConfig.y, photoConfig.width, photoConfig.height);

            loadedCount++;
            if (loadedCount === 4 && callback) {
                callback();
            }
        };
        img.src = photo;
    });
}

// Helper function to draw text decorations on final image
function drawFinalTextDecorations(ctx, config) {
    // Add title
    ctx.fillStyle = '#764ba2';
    ctx.font = 'bold 28px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Life Four Cuts', ctx.canvas.width / 2, config.titleY);

    // Add date
    const date = new Date().toLocaleDateString();
    ctx.font = '18px Arial';
    ctx.fillStyle = '#666';
    ctx.fillText(date, ctx.canvas.width / 2, config.dateY);

    // Add decorative hearts for some frames
    if (config.name !== 'Vertical Strip') {
        ctx.fillStyle = '#ff69b4';
        ctx.font = '20px Arial';
        ctx.fillText('♥ ♥ ♥', ctx.canvas.width / 2, config.dateY + 20);
    }
}

// Upload image to cloud storage
async function uploadImageToCloud(dataUrl) {
    try {
        // Convert data URL to blob
        const blob = dataURItoBlob(dataUrl);
        
        // Create a unique filename with timestamp
        const timestamp = Date.now();
        const filename = `life-four-cuts-${timestamp}.jpg`;
        
        // Create a File object from blob
        const file = new File([blob], filename, { type: 'image/jpeg' });
        
        // Upload to Appwrite Storage
        const response = await appwriteStorage.createFile(
            appwriteConfig.bucketId,
            Appwrite.ID.unique(),
            file
        );
        
        // Get the file view URL (public URL)
        const fileUrl = `${appwriteConfig.endpoint}/storage/buckets/${appwriteConfig.bucketId}/files/${response.$id}/view?project=${appwriteConfig.projectId}`;
        
        console.log('Image uploaded successfully to Appwrite Storage:', fileUrl);
        return fileUrl;
        
    } catch (error) {
        console.error('Appwrite upload error:', error);
        
        // Fallback to Imgur if Appwrite fails
        return await fallbackUpload(dataUrl);
    }
}

// Fallback upload methods if Appwrite fails
async function fallbackUpload(dataUrl) {
    try {
        // Method 1: Try Imgur (anonymous upload)
        const base64 = dataUrl.split(',')[1];

        const imgurResponse = await fetch('https://api.imgur.com/3/image', {
            method: 'POST',
            headers: {
                'Authorization': 'Client-ID 0cda8c40b32ba0a',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                image: base64,
                type: 'base64',
                name: 'life-four-cuts.jpg',
                title: 'Life Four Cuts Photo'
            })
        });

        if (imgurResponse.ok) {
            const imgurData = await imgurResponse.json();
            if (imgurData.success && imgurData.data && imgurData.data.link) {
                console.log('Image uploaded to Imgur fallback:', imgurData.data.link);
                return imgurData.data.link;
            }
        }
    } catch (err) {
        console.log('Imgur fallback upload failed:', err);
    }

    // If all methods fail, return null
    return null;
}

// Generate QR code for download
async function generateQRCode() {
    const qrContainer = document.getElementById('qr-code');
    qrContainer.innerHTML = '<p style="color: #667eea;">Uploading image...</p>';

    try {
        // Upload image to cloud storage
        const imageUrl = await uploadImageToCloud(appState.finalImageDataUrl);

        if (imageUrl) {
            // Clear container and generate QR code with the actual URL
            qrContainer.innerHTML = '';
            new QRCode(qrContainer, {
                text: imageUrl,
                width: 200,
                height: 200,
                colorDark: '#000000',
                colorLight: '#ffffff',
                correctLevel: QRCode.CorrectLevel.H
            });

            // Store the URL for direct download button
            appState.uploadedImageUrl = imageUrl;

            console.log('Image uploaded successfully:', imageUrl);
        } else {
            throw new Error('Failed to get upload URL');
        }
    } catch (error) {
        console.error('Upload failed:', error);
        // Fallback to local download
        qrContainer.innerHTML = '<p style="color: #ff6b6b;">Upload failed. Use direct download button.</p>';

        // Create local blob URL as fallback
        const blob = dataURItoBlob(appState.finalImageDataUrl);
        const localUrl = URL.createObjectURL(blob);

        // Generate QR with local URL (won't work on other devices)
        setTimeout(() => {
            qrContainer.innerHTML = '';
            new QRCode(qrContainer, {
                text: localUrl,
                width: 200,
                height: 200,
                colorDark: '#000000',
                colorLight: '#ffffff',
                correctLevel: QRCode.CorrectLevel.H
            });
        }, 2000);
    }
}

// Create shortened URL for data URL (fallback)
async function createShortenedDataUrl(dataUrl) {
    try {
        // For very small images, we can try to create a data URL QR code
        // This has significant size limitations
        if (dataUrl.length < 3000) {
            return dataUrl;
        }

        // If too large, return null to indicate failure
        return null;
    } catch (error) {
        console.error('URL shortening failed:', error);
        return null;
    }
}

// Convert data URI to blob
function dataURItoBlob(dataURI) {
    const byteString = atob(dataURI.split(',')[1]);
    const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);

    for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }

    return new Blob([ab], { type: mimeString });
}

// Download final image
function downloadFinalImage() {
    // If we have an uploaded URL, open it in a new tab
    if (appState.uploadedImageUrl) {
        window.open(appState.uploadedImageUrl, '_blank');
    } else {
        // Fallback to local download
        const link = document.createElement('a');
        link.download = `life-four-cuts-${Date.now()}.jpg`;
        link.href = appState.finalImageDataUrl;
        link.click();
    }
}

// Reset application
function resetApp() {
    appState.capturedPhotos = [];
    appState.selectedPhotos = [];
    appState.currentFrame = 'classic';
    appState.finalImageDataUrl = '';
    appState.uploadedImageUrl = '';

    // Clear UI
    document.getElementById('captured-photos').innerHTML = '';
    document.getElementById('selection-grid').innerHTML = '';
    document.getElementById('qr-code').innerHTML = '';

    // Reset buttons
    document.getElementById('start-capture').textContent = 'Start Photo Session';
    updateSelectionButton();

    // Navigate to first page
    navigateToPage(0);
}

// Navigation between pages
function navigateToPage(pageIndex) {
    appState.pages.forEach((pageId, index) => {
        const page = document.getElementById(pageId);
        if (index === pageIndex) {
            page.classList.add('active');
        } else {
            page.classList.remove('active');
        }
    });

    appState.currentPage = pageIndex;
}

// Utility function for delays
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}