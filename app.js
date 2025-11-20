// Appwrite configuration
const appwriteConfig = {
    endpoint: 'https://syd.cloud.appwrite.io/v1', // Appwrite Cloud endpoint
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
// Reference: x: 30, y: 47.45, width: 167, height: 297 for top-left
const frameImages = [
    {
        id: 1,
        path: 'frames/1.png',
        name: 'Frame 1',
        photoPositions: [
            { x: 7.7, y: 5.7, width: 41.3, height: 40.7 }, 
            { x: 50.5, y: 5.7, width: 41.3, height: 40.7 }, 
            { x: 7.7, y: 47.45, width: 41.3, height: 40.7 }, 
            { x: 50.5, y: 47.45, width: 41.3, height: 40.7 } 
        ]
    },
    {
        id: 2,
        path: 'frames/2.png',
        name: 'Frame 2',
        photoPositions: [
            { x: 7.7, y: 5.7, width: 41.3, height: 40.7 }, 
            { x: 50.5, y: 5.7, width: 41.3, height: 40.7 }, 
            { x: 7.7, y: 47.45, width: 41.3, height: 40.7 }, 
            { x: 50.5, y: 47.45, width: 41.3, height: 40.7 } 
        ]
    },
    {
        id: 3,
        path: 'frames/3.png',
        name: 'Frame 3',
        photoPositions: [
            { x: 7.7, y: 5.7, width: 41.3, height: 40.7 }, 
            { x: 50.5, y: 5.7, width: 41.3, height: 40.7 }, 
            { x: 7.7, y: 47.45, width: 41.3, height: 40.7 }, 
            { x: 50.5, y: 47.45, width: 41.3, height: 40.7 } 
        ]
    },
    {
        id: 4,
        path: 'frames/4.png',
        name: 'Frame 4',
        photoPositions: [
            { x: 7.7, y: 5.7, width: 41.3, height: 40.7 }, 
            { x: 50.5, y: 5.7, width: 41.3, height: 40.7 }, 
            { x: 7.7, y: 47.45, width: 41.3, height: 40.7 }, 
            { x: 50.5, y: 47.45, width: 41.3, height: 40.7 } 
        ]
    },
    {
        id: 5,
        path: 'frames/5.png',
        name: 'Frame 5',
        photoPositions: [
            { x: 7.7, y: 5.7, width: 41.3, height: 40.7 }, 
            { x: 50.5, y: 5.7, width: 41.3, height: 40.7 }, 
            { x: 7.7, y: 47.45, width: 41.3, height: 40.7 }, 
            { x: 50.5, y: 47.45, width: 41.3, height: 40.7 } 
        ]
    },
    {
        id: 6,
        path: 'frames/6.png',
        name: 'Frame 6',
        photoPositions: [
            { x: 7.7, y: 5.7, width: 41.3, height: 40.7 }, 
            { x: 50.5, y: 5.7, width: 41.3, height: 40.7 }, 
            { x: 7.7, y: 47.45, width: 41.3, height: 40.7 }, 
            { x: 50.5, y: 47.45, width: 41.3, height: 40.7 } 
        ]
    },
    {
        id: 7,
        path: 'frames/7.png',
        name: 'Frame 7',
        photoPositions: [
            { x: 7.7, y: 5.7, width: 41.3, height: 40.7 }, 
            { x: 50.5, y: 5.7, width: 41.3, height: 40.7 }, 
            { x: 7.7, y: 47.45, width: 41.3, height: 40.7 }, 
            { x: 50.5, y: 47.45, width: 41.3, height: 40.7 } 
        ]
    },
    {
        id: 8,
        path: 'frames/8.png',
        name: 'Frame 8',
        photoPositions: [
            { x: 7.7, y: 5.7, width: 41.3, height: 40.7 }, 
            { x: 50.5, y: 5.7, width: 41.3, height: 40.7 }, 
            { x: 7.7, y: 47.45, width: 41.3, height: 40.7 }, 
            { x: 50.5, y: 47.45, width: 41.3, height: 40.7 } 
        ]
    },
];

// Global state management
const appState = {
    capturedPhotos: [],
    selectedPhotos: [],
    selectedFrameId: 1,  // Default to first frame
    selectedFrameImage: null,  // Will store the loaded frame image
    finalImageDataUrl: '',
    uploadedImageUrl: '',
    pages: ['home-page', 'capture-page', 'selection-page', 'frame-page', 'preview-page'],
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
                startButton.textContent = '촬영';
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
    // Page 1: Home
    document.getElementById('start-from-home').addEventListener('click', () => navigateToPage(1));

    // Page 2: Capture
    const startButton = document.getElementById('start-capture');
    if (startButton) {
        startButton.addEventListener('click', startPhotoCapture);
        console.log('Start button listener attached');
    } else {
        console.error('Start button not found');
    }

    // Page 3: Selection
    const continueToFrameButton = document.getElementById('continue-to-frame');
    if (continueToFrameButton) {
        continueToFrameButton.addEventListener('click', () => {
            if (appState.selectedPhotos.length === 4) {
                renderFramePreview();
                navigateToPage(3);
            }
        });
        console.log('Continue to frame button listener attached');
    } else {
        console.error('Continue to frame button not found');
    }

    // Page 4: Frame
    const continueToPreviewButton = document.getElementById('continue-to-preview');
    if (continueToPreviewButton) {
        continueToPreviewButton.addEventListener('click', () => {
            generateFinalImage();
            navigateToPage(4);
        });
        console.log('Continue to preview button listener attached');
    } else {
        console.error('Continue to preview button not found');
    }

    // Page 5: Preview
    const downloadButton = document.getElementById('download-direct');
    if (downloadButton) {
        downloadButton.addEventListener('click', downloadFinalImage);
    }
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
        option.appendChild(thumbnail);

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
    const captureInstruction = document.getElementById('capture-instruction');
    const logoWrapper = document.querySelector('.logo-wrapper');
    const bottomLogoWrapper = document.querySelector('.bottom-logo-wrapper');
    const countdownProgressWrapper = document.querySelector('.countdown-progress-wrapper');
    const flashEffect = document.getElementById('flash-effect');

    // Check if video is ready
    if (!video.videoWidth || !video.videoHeight) {
        console.error('Video not ready');
        startButton.textContent = 'Try Again';
        return;
    }

    // Reset captured photos
    appState.capturedPhotos = [];

    // Setup canvas dimensions with 2:3 aspect ratio
    const targetAspect = 2 / 3;
    const videoAspect = video.videoWidth / video.videoHeight;
    
    let sourceWidth, sourceHeight, sourceX, sourceY;
    
    if (videoAspect > targetAspect) {
        // Video is wider - crop horizontally
        sourceHeight = video.videoHeight;
        sourceWidth = sourceHeight * targetAspect;
        sourceX = (video.videoWidth - sourceWidth) / 2;
        sourceY = 0;
    } else {
        // Video is taller - crop vertically
        sourceWidth = video.videoWidth;
        sourceHeight = sourceWidth / targetAspect;
        sourceX = 0;
        sourceY = (video.videoHeight - sourceHeight) / 2;
    }
    
    // Set canvas to capture with 2:3 aspect ratio
    canvas.width = 800;  // Fixed width
    canvas.height = 1200; // 2:3 ratio
    console.log('Canvas dimensions:', canvas.width, 'x', canvas.height);

    // Hide instruction text, logo, and start button
    if (captureInstruction) {
        captureInstruction.style.display = 'none';
    }
    if (logoWrapper) {
        logoWrapper.classList.add('hidden');
    }
    startButton.style.display = 'none';

    // Show bottom logo
    if (bottomLogoWrapper) {
        bottomLogoWrapper.classList.remove('hidden');
    }

    // Show countdown-progress wrapper and progress indicator
    if (countdownProgressWrapper) {
        countdownProgressWrapper.classList.add('active');
    }
    progressIndicator.classList.remove('hidden');

    // Capture 8 photos with 5-second intervals
    for (let i = 0; i < 8; i++) {
        photoCount.textContent = i + 1;

        // Countdown from 5 to 1
        for (let count = 5; count > 0; count--) {
            countdown.textContent = count.toString().padStart(2, '0');
            countdown.classList.add('show');
            await sleep(1000);
        }

        // Trigger flash effect
        flashEffect.classList.add('active');
        
        // Capture photo with cropping to 2:3 aspect ratio
        ctx.drawImage(
            video,
            sourceX, sourceY, sourceWidth, sourceHeight,  // Source (cropped area from video)
            0, 0, canvas.width, canvas.height             // Destination (canvas)
        );
        const photoDataUrl = canvas.toDataURL('image/jpeg', 0.9);
        appState.capturedPhotos.push(photoDataUrl);

        countdown.classList.remove('show');
        
        // Remove flash effect after animation
        setTimeout(() => {
            flashEffect.classList.remove('active');
        }, 300);

        // Wait before next photo (if not the last one)
        if (i < 7) {
            await sleep(500);
        }
    }

    progressIndicator.classList.add('hidden');

    // Hide bottom logo after capture
    if (bottomLogoWrapper) {
        bottomLogoWrapper.classList.add('hidden');
    }

    // Automatically move to selection page
    setTimeout(() => {
        renderSelectionGrid();
        navigateToPage(2);
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
    renderSelectionFramePreview();
}

// Toggle photo selection
function togglePhotoSelection(event) {
    const photoItem = event.currentTarget;
    const index = parseInt(photoItem.dataset.index);
    const photo = appState.capturedPhotos[index];

    if (photoItem.classList.contains('selected')) {
        // Deselect
        photoItem.classList.remove('selected');
        photoItem.removeAttribute('data-order');
        appState.selectedPhotos = appState.selectedPhotos.filter(p => p !== photo);
        
        // Update order numbers for remaining selected photos
        updatePhotoOrderNumbers();
    } else {
        // Check if we can select more
        if (appState.selectedPhotos.length < 4) {
            photoItem.classList.add('selected');
            appState.selectedPhotos.push(photo);
            photoItem.setAttribute('data-order', appState.selectedPhotos.length);
        }
    }

    updateSelectionButton();
    renderSelectionFramePreview();
}

// Helper function to update order numbers after deselection
function updatePhotoOrderNumbers() {
    const selectedItems = document.querySelectorAll('.photo-item.selected');
    selectedItems.forEach((item) => {
        const itemIndex = parseInt(item.dataset.index);
        const photo = appState.capturedPhotos[itemIndex];
        const orderInSelected = appState.selectedPhotos.indexOf(photo) + 1;
        item.setAttribute('data-order', orderInSelected);
    });
}

// Update selection button text
function updateSelectionButton() {
    const button = document.getElementById('continue-to-frame');
    const count = appState.selectedPhotos.length;

    button.textContent = count === 4 ? '선택 완료' : `선택 완료 (${count}/4)`;
    button.disabled = count !== 4;
}


// Render frame preview on selection page
function renderSelectionFramePreview() {
    const canvas = document.getElementById('selection-frame-preview');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');

    // Get the current frame configuration
    const currentFrame = frameImages.find(f => f.id === appState.selectedFrameId);
    if (!currentFrame || !appState.selectedFrameImage) {
        // If frame not loaded yet, hide canvas
        canvas.style.display = 'none';
        return;
    }

    canvas.style.display = 'block';

    // Set canvas size for preview (larger size)
    canvas.width = 500;
    const aspectRatio = appState.selectedFrameImage.height / appState.selectedFrameImage.width;
    canvas.height = 500 * aspectRatio;

    // Clear canvas with white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw the frame first (background layer)
    ctx.drawImage(appState.selectedFrameImage, 0, 0, canvas.width, canvas.height);

    // If no photos selected, just show the frame
    if (appState.selectedPhotos.length === 0) {
        return;
    }

    // Draw the selected photos on top of the frame
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
        };
        img.src = photo;
    });
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

    // Draw the frame first (background layer)
    ctx.drawImage(appState.selectedFrameImage, 0, 0, canvas.width, canvas.height);

    // Draw the selected photos using custom positions on top of the frame
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
        };
        img.src = photo;
    });
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

    // Draw the frame first (background layer)
    ctx.drawImage(appState.selectedFrameImage, 0, 0, canvas.width, canvas.height);

    // Draw the selected photos using custom positions on top of the frame
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
    let isHomePage = false;
    appState.pages.forEach((pageId, index) => {
        const page = document.getElementById(pageId);
        if (index === pageIndex) {
            page.classList.add('active');
            if (pageId === 'home-page') {
                isHomePage = true;
            }

            // Show capture instruction, logo, and button when navigating to capture page
            if (pageId === 'capture-page') {
                const captureInstruction = document.getElementById('capture-instruction');
                if (captureInstruction) {
                    captureInstruction.style.display = 'block';
                }
                const logoWrapper = document.querySelector('.logo-wrapper');
                if (logoWrapper) {
                    logoWrapper.classList.remove('hidden');
                }
                const bottomLogoWrapper = document.querySelector('.bottom-logo-wrapper');
                if (bottomLogoWrapper) {
                    bottomLogoWrapper.classList.add('hidden');
                }
                const startButton = document.getElementById('start-capture');
                if (startButton) {
                    startButton.style.display = 'block';
                }
                // Hide countdown-progress wrapper when navigating to capture page
                const countdownProgressWrapper = document.querySelector('.countdown-progress-wrapper');
                if (countdownProgressWrapper) {
                    countdownProgressWrapper.classList.remove('active');
                }
                const countdown = document.getElementById('countdown');
                if (countdown) {
                    countdown.classList.remove('show');
                }
            }
        } else {
            page.classList.remove('active');
        }
    });

    document.body.classList.toggle('home-active', isHomePage);
    appState.currentPage = pageIndex;
}

// Utility function for delays
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
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
