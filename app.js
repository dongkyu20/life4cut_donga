// Appwrite configuration
const appwriteConfig = {
    endpoint: '', // Appwrite Cloud endpoint
    projectId: '',
    bucketId: ''
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

// Available frame images with photo position configurations
// Based on canvas 400x800, converted to percentages
// Reference: x: 30, y: 50, width: 167, height: 297 for top-left
const frameImages = [
    {
        id: 1,
        path: 'frames/1.png',
        name: 'Frame 1',
        photoPositions: [
            { x: 7.65, y: 6.4, width: 41.5, height: 36.4 }, 
            { x: 50.75, y: 6.4, width: 41.5, height: 36.4 }, 
            { x: 7.65, y: 43.75, width: 41.5, height: 36.4 }, 
            { x: 50.75, y: 43.75, width: 41.5, height: 36.4 } 
        ]
    },
    {
        id: 2,
        path: 'frames/2.png',
        name: 'Frame 2',
        photoPositions: [
            { x: 7.65, y: 6.4, width: 41.5, height: 36.4 }, 
            { x: 50.75, y: 6.4, width: 41.5, height: 36.4 }, 
            { x: 7.65, y: 43.75, width: 41.5, height: 36.4 }, 
            { x: 50.75, y: 43.75, width: 41.5, height: 36.4 } 
        ]
    },
    {
        id: 3,
        path: 'frames/3.png',
        name: 'Frame 3',
        photoPositions: [
            { x: 7.65, y: 6.4, width: 41.5, height: 36.4 }, 
            { x: 50.75, y: 6.4, width: 41.5, height: 36.4 }, 
            { x: 7.65, y: 43.75, width: 41.5, height: 36.4 }, 
            { x: 50.75, y: 43.75, width: 41.5, height: 36.4 } 
        ]
    },
    {
        id: 4,
        path: 'frames/4.png',
        name: 'Frame 4',
        photoPositions: [
            { x: 7.65, y: 6.4, width: 41.5, height: 36.4 }, 
            { x: 50.75, y: 6.4, width: 41.5, height: 36.4 }, 
            { x: 7.65, y: 43.75, width: 41.5, height: 36.4 }, 
            { x: 50.75, y: 43.75, width: 41.5, height: 36.4 } 
        ]
    },
    {
        id: 5,
        path: 'frames/5.png',
        name: 'Frame 5',
        photoPositions: [
            { x: 7.65, y: 6.4, width: 41.5, height: 36.4 }, 
            { x: 50.75, y: 6.4, width: 41.5, height: 36.4 }, 
            { x: 7.65, y: 43.75, width: 41.5, height: 36.4 }, 
            { x: 50.75, y: 43.75, width: 41.5, height: 36.4 } 
        ]
    },
    // {
    //     id: 6,
    //     path: 'frames/6.png',
    //     name: 'Frame 6',
    //     photoPositions: [
    //         { x: 7.65, y: 6.4, width: 41.5, height: 36.4 }, 
    //         { x: 50.75, y: 6.4, width: 41.5, height: 36.4 }, 
    //         { x: 7.65, y: 43.75, width: 41.5, height: 36.4 }, 
    //         { x: 50.75, y: 43.75, width: 41.5, height: 36.4 } 
    //     ]
    // }
];

// Global state management
const appState = {
    capturedPhotos: [],
    selectedPhotos: [],
    selectedFrameId: 1,  // Default to first frame
    selectedFrameImage: null,  // Will store the loaded frame image
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
    const startButton = document.getElementById('start-capture');

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

        // Wait for video to be ready
        video.onloadedmetadata = () => {
            console.log('Camera initialized successfully');
            console.log(`Video dimensions: ${video.videoWidth}x${video.videoHeight}`);

            // Enable start button once video is ready
            if (startButton) {
                startButton.disabled = false;
                startButton.textContent = 'Start';
            }
        };

    } catch (error) {
        console.error('Error accessing camera:', error);
        // Show error message on button
        if (startButton) {
            startButton.textContent = 'Camera Error';
            startButton.disabled = true;
        }
    }
}

// Event listeners setup
function setupEventListeners() {
    // Page 1: Capture
    const startButton = document.getElementById('start-capture');
    if (startButton) {
        startButton.addEventListener('click', startPhotoCapture);
        console.log('Start button listener attached');
    } else {
        console.error('Start button not found');
    }

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

    frameImages.forEach((frame, index) => {
        const option = document.createElement('div');
        option.className = 'frame-option' + (index === 0 ? ' selected' : '');
        option.dataset.frameId = frame.id;

        // Create thumbnail with actual frame image
        const thumbnail = document.createElement('div');
        thumbnail.className = 'frame-thumbnail';

        const img = document.createElement('img');
        img.src = frame.path;
        img.alt = frame.name;
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'contain';

        thumbnail.appendChild(img);

        const label = document.createElement('p');
        label.textContent = frame.name;

        option.appendChild(thumbnail);
        option.appendChild(label);

        option.addEventListener('click', function() {
            document.querySelectorAll('.frame-option').forEach(opt => opt.classList.remove('selected'));
            this.classList.add('selected');
            appState.selectedFrameId = frame.id;

            // Load the selected frame image
            const selectedFrame = frameImages.find(f => f.id === frame.id);
            if (selectedFrame) {
                const frameImg = new Image();
                frameImg.onload = function() {
                    appState.selectedFrameImage = frameImg;
                    renderFramePreview();
                };
                frameImg.src = selectedFrame.path;
            }
        });

        container.appendChild(option);
    });

    // Load the default frame image
    const defaultFrame = frameImages.find(f => f.id === appState.selectedFrameId);
    if (defaultFrame) {
        const frameImg = new Image();
        frameImg.onload = function() {
            appState.selectedFrameImage = frameImg;
        };
        frameImg.src = defaultFrame.path;
    }
}

// Photo capture functionality
async function startPhotoCapture() {
    console.log('Starting photo capture...');

    const video = document.getElementById('camera-stream');
    const canvas = document.getElementById('capture-canvas');
    const ctx = canvas.getContext('2d');
    const countdown = document.getElementById('countdown');
    const startButton = document.getElementById('start-capture');
    const progressIndicator = document.getElementById('progress-indicator');
    const photoCount = document.getElementById('photo-count');

    // Check if video is ready
    if (!video.videoWidth || !video.videoHeight) {
        console.error('Video not ready');
        startButton.textContent = 'Try Again';
        return;
    }

    // Reset captured photos
    appState.capturedPhotos = [];

    // Setup canvas dimensions
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    console.log('Canvas dimensions:', canvas.width, 'x', canvas.height);

    // Disable start button and show progress
    startButton.disabled = true;
    progressIndicator.classList.remove('hidden');

    // Capture 8 photos with 5-second intervals
    for (let i = 0; i < 8; i++) {
        photoCount.textContent = i + 1;

        // Countdown from 3 to 1
        for (let count = 1; count > 0; count--) {
            countdown.textContent = count;
            countdown.classList.add('show');
            await sleep(1000);
        }

        // Capture photo
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
        }
    }

    updateSelectionButton();
}

// Update selection button text
function updateSelectionButton() {
    const button = document.getElementById('continue-to-frame');
    const count = appState.selectedPhotos.length;

    button.textContent = count === 4 ? 'Next' : `${count}/4`;
    button.disabled = count !== 4;
}

// Render frame preview
function renderFramePreview() {
    const canvas = document.getElementById('frame-preview');
    const ctx = canvas.getContext('2d');

    if (!appState.selectedFrameImage) {
        console.log('Frame image not loaded yet');
        return;
    }

    // Get the current frame configuration
    const currentFrame = frameImages.find(f => f.id === appState.selectedFrameId);
    if (!currentFrame) {
        console.error('Frame configuration not found');
        return;
    }

    // Set canvas size to match frame image dimensions
    canvas.width = 600; // Standard width for display
    const aspectRatio = appState.selectedFrameImage.height / appState.selectedFrameImage.width;
    canvas.height = 600 * aspectRatio;

    // Clear canvas with white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw the selected photos using custom positions
    let loadedPhotos = 0;
    appState.selectedPhotos.forEach((photo, index) => {
        const img = new Image();
        img.onload = function() {
            const pos = currentFrame.photoPositions[index];

            // Convert percentage positions to actual pixel coordinates
            const x = (pos.x / 100) * canvas.width;
            const y = (pos.y / 100) * canvas.height;
            const width = (pos.width / 100) * canvas.width;
            const height = (pos.height / 100) * canvas.height;

            drawCroppedImage(ctx, img, x, y, width, height);

            loadedPhotos++;
            // After all photos are drawn, draw the frame with transparency on top
            if (loadedPhotos === appState.selectedPhotos.length) {
                const transparentFrame = makeGrayTransparent(appState.selectedFrameImage);
                ctx.drawImage(transparentFrame, 0, 0, canvas.width, canvas.height);
            }
        };
        img.src = photo;
    });
}


// Function to make gray areas in frame transparent
function makeGrayTransparent(frameImg) {
    // Create a temporary canvas to process the frame
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = frameImg.width;
    tempCanvas.height = frameImg.height;
    const tempCtx = tempCanvas.getContext('2d');

    // Draw the frame image
    tempCtx.drawImage(frameImg, 0, 0);

    // Get image data
    const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
    const data = imageData.data;

    // Loop through pixels and make gray areas transparent
    // Gray color is approximately RGB(200-210, 200-210, 200-210)
    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Check if pixel is gray (adjust threshold as needed)
        // Gray areas in your frames appear to be around RGB(205, 205, 205)
        if (r > 180 && g > 180 && b > 180 &&
            Math.abs(r - g) < 20 && Math.abs(g - b) < 20 && Math.abs(r - b) < 20) {
            data[i + 3] = 0; // Make transparent
        }
    }

    // Put the modified image data back
    tempCtx.putImageData(imageData, 0, 0);

    return tempCanvas;
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



// Generate final image
function generateFinalImage() {
    const canvas = document.getElementById('final-canvas');
    const ctx = canvas.getContext('2d');

    if (!appState.selectedFrameImage) {
        console.error('Frame image not loaded');
        return;
    }

    // Get the current frame configuration
    const currentFrame = frameImages.find(f => f.id === appState.selectedFrameId);
    if (!currentFrame) {
        console.error('Frame configuration not found');
        return;
    }

    // Set canvas size to high resolution for final output
    canvas.width = 1800; // High resolution width
    const aspectRatio = appState.selectedFrameImage.height / appState.selectedFrameImage.width;
    canvas.height = 1800 * aspectRatio;

    // Clear canvas with white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw the selected photos using custom positions
    let loadedCount = 0;
    appState.selectedPhotos.forEach((photo, index) => {
        const img = new Image();
        img.onload = function() {
            const pos = currentFrame.photoPositions[index];

            // Convert percentage positions to actual pixel coordinates
            const x = (pos.x / 100) * canvas.width;
            const y = (pos.y / 100) * canvas.height;
            const width = (pos.width / 100) * canvas.width;
            const height = (pos.height / 100) * canvas.height;

            drawCroppedImage(ctx, img, x, y, width, height);

            loadedCount++;
            if (loadedCount === 4) {
                // After all photos are drawn, draw the frame with transparency on top
                const transparentFrame = makeGrayTransparent(appState.selectedFrameImage);
                ctx.drawImage(transparentFrame, 0, 0, canvas.width, canvas.height);

                // Save final image when everything is drawn
                appState.finalImageDataUrl = canvas.toDataURL('image/jpeg', 0.95);
                generateQRCode();
            }
        };
        img.src = photo;
    });
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
        
        return null;
    }
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
    appState.selectedFrameId = 1;
    appState.selectedFrameImage = null;
    appState.finalImageDataUrl = '';
    appState.uploadedImageUrl = '';

    // Clear UI
    document.getElementById('selection-grid').innerHTML = '';
    document.getElementById('qr-code').innerHTML = '';

    // Reset buttons
    document.getElementById('start-capture').textContent = 'Start';
    updateSelectionButton();

    // Regenerate frame options to reset selection
    generateFrameOptions();

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