// グローバル変数
let currentImage = null;
let currentImages = []; // Array to hold multiple image objects
let activePreviewIndex = 0; // The image currently shown in the preview
let originalImageData = null;
let imageFormat = 'image/png';
let imageName = 'image';

// DOM要素の取得
const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('fileInput');
const selectFileBtn = document.getElementById('selectFileBtn');
const urlInput = document.getElementById('urlInput');
const loadUrlBtn = document.getElementById('loadUrlBtn');
const previewSection = document.getElementById('previewSection');
const previewCanvas = document.getElementById('previewCanvas');
const splitPosition = document.getElementById('splitPosition');
const splitPercentage = document.getElementById('splitPercentage');
const splitLine = document.getElementById('splitLine');
const downloadLeft = document.getElementById('downloadLeft');
const downloadRight = document.getElementById('downloadRight');
const resetBtn = document.getElementById('resetBtn');
const fileName = document.getElementById('fileName');
const imageDimensions = document.getElementById('imageDimensions');
const imageFormatText = document.getElementById('imageFormat');

// タブ切り替え
const tabBtns = document.querySelectorAll('.tab-btn');
const uploadAreas = document.querySelectorAll('.upload-area');

tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const targetTab = btn.dataset.tab;
        
        // タブのアクティブ状態を切り替え
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // エリアの表示を切り替え
        uploadAreas.forEach(area => {
            if (area.id === `${targetTab}-area`) {
                area.classList.add('active');
            } else {
                area.classList.remove('active');
            }
        });
    });
});

// ファイル選択ボタン
selectFileBtn.addEventListener('click', () => {
    fileInput.click();
});

// ファイル入力変更時 (Multiple files support)
fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        loadMultipleFiles(e.target.files);
    }
});

// ドラッグ&ドロップ処理
dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('drag-over');
});

// ドロップ処理 (Multiple files support)
dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('drag-over');
    
    if (e.dataTransfer.files.length > 0) {
        loadMultipleFiles(e.dataTransfer.files);
    }
});

// URL読み込みボタン
loadUrlBtn.addEventListener('click', () => {
    const url = urlInput.value.trim();
    if (url) {
        loadImageFromUrl(url);
    }
});

// URLインプットでEnterキー
urlInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        loadUrlBtn.click();
    }
});

// 複数ファイルを読み込む
function loadMultipleFiles(fileList) {
    currentImages = []; // Reset array
    const files = Array.from(fileList).filter(file => file.type.startsWith('image/'));
    
    if (files.length === 0) return;

    let loadedCount = 0;

    files.forEach((file, index) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                currentImages.push({
                    img: img,
                    name: file.name.split('.')[0],
                    format: file.type,
                    originalName: file.name
                });

                loadedCount++;
                // Once all images are loaded into memory, show the first one as a preview
                if (loadedCount === files.length) {
                    showPreview(0); 
                }
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

// URLから画像を読み込む
function loadImageFromUrl(url) {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
        // URLからファイル名を抽出
        const urlParts = url.split('/');
        const filename = urlParts[urlParts.length - 1].split('?')[0] || 'image';
        imageName = filename.split('.')[0] || 'image';
        
        // URLから画像フォーマットを推測
        if (filename.toLowerCase().endsWith('.jpg') || filename.toLowerCase().endsWith('.jpeg')) {
            imageFormat = 'image/jpeg';
        } else if (filename.toLowerCase().endsWith('.png')) {
            imageFormat = 'image/png';
        } else if (filename.toLowerCase().endsWith('.webp')) {
            imageFormat = 'image/webp';
        } else if (filename.toLowerCase().endsWith('.gif')) {
            imageFormat = 'image/gif';
        } else {
            imageFormat = 'image/png'; // デフォルト
        }
        
        loadImage(img.src, filename);
    };
    
    img.onerror = () => {
        alert('画像の読み込みに失敗しました。\nCORS対応の画像URLか確認してください。');
    };
    
    img.src = url;
}

// 単一の画像を読み込む (URLやペースト用)
function loadImage(src, name) {
    const img = new Image();
    img.onload = () => {
        // Wrap the single image in the array so the batch downloader works for URLs & Paste
        currentImages = [{
            img: img,
            name: name.split('.')[0],
            format: imageFormat, 
            originalName: name
        }];
        
        showPreview(0);
    };
    img.src = src;
}

// フォーマット名を取得
function getFormatName(format) {
    const formats = {
        'image/jpeg': 'JPEG',
        'image/png': 'PNG',
        'image/webp': 'WebP',
        'image/gif': 'GIF'
    };
    return formats[format] || 'Unknown';
}

// プレビューの情報を更新してキャンバスに描画を指示
function showPreview(index) {
    if (currentImages.length === 0) return;
    
    activePreviewIndex = index;
    const activeImageObj = currentImages[index];
    currentImage = activeImageObj.img; // Set for the preview drawing
    
    // Display (+X other files) if more than 1 image is uploaded
    let displayFileName = activeImageObj.originalName;
    if (currentImages.length > 1) {
        displayFileName += ` (+${currentImages.length - 1} other files)`;
    }
    
    fileName.textContent = displayFileName;
    imageDimensions.textContent = `${currentImage.width} × ${currentImage.height}px`;
    imageFormatText.textContent = getFormatName(activeImageObj.format);
    
    previewSection.style.display = 'block';
    
    // キャンバスに描画
    drawPreview();
    
    previewSection.scrollIntoView({ behavior: 'smooth' });
}

// プレビューを描画 (Restored missing function)
function drawPreview() {
    if (!currentImage) return;
    
    const canvas = previewCanvas;
    const ctx = canvas.getContext('2d');
    
    // キャンバスサイズを画像サイズに設定
    canvas.width = currentImage.width;
    canvas.height = currentImage.height;
    
    // 画像を描画
    ctx.drawImage(currentImage, 0, 0);
    
    // 分割線を更新
    updateSplitLine();
}

// 分割線を更新
function updateSplitLine() {
    const percentage = splitPosition.value;
    splitLine.style.left = `${percentage}%`;
}

// スライダー変更時
splitPosition.addEventListener('input', (e) => {
    splitPercentage.textContent = e.target.value;
    updateSplitLine();
});

// 左半分をダウンロード
downloadLeft.addEventListener('click', () => {
    downloadHalf('left');
});

// 右半分をダウンロード
downloadRight.addEventListener('click', () => {
    downloadHalf('right');
});

// 半分をダウンロード (Batch download)
function downloadHalf(side) {
    if (currentImages.length === 0) return;
    
    const splitPercent = parseFloat(splitPosition.value) / 100;
    
    // Loop through all uploaded images
    currentImages.forEach((imgObj, index) => {
        // Add a 300ms delay between each download to prevent browser blocking
        setTimeout(() => {
            const splitX = Math.round(imgObj.img.width * splitPercent);
            
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            if (side === 'left') {
                canvas.width = splitX;
                canvas.height = imgObj.img.height;
                ctx.drawImage(
                    imgObj.img,
                    0, 0, splitX, imgObj.img.height,
                    0, 0, splitX, imgObj.img.height
                );
            } else {
                canvas.width = imgObj.img.width - splitX;
                canvas.height = imgObj.img.height;
                ctx.drawImage(
                    imgObj.img,
                    splitX, 0, imgObj.img.width - splitX, imgObj.img.height,
                    0, 0, imgObj.img.width - splitX, imgObj.img.height
                );
            }
            
            canvas.toBlob((blob) => {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                
                const extension = getExtension(imgObj.format);
                a.download = `${imgObj.name}_${side}${extension}`;
                
                a.click();
                URL.revokeObjectURL(url);
            }, imgObj.format);
            
        }, index * 300); // 300ms delay multiplied by the index
    });
}

// 拡張子を取得
function getExtension(format) {
    const extensions = {
        'image/jpeg': '.jpg',
        'image/png': '.png',
        'image/webp': '.webp',
        'image/gif': '.gif'
    };
    return extensions[format] || '.png';
}

// リセットボタン
resetBtn.addEventListener('click', () => {
    currentImage = null;
    currentImages = []; // Clear the array
    originalImageData = null;
    fileInput.value = '';
    urlInput.value = '';
    splitPosition.value = 50;
    splitPercentage.textContent = '50';
    
    previewSection.style.display = 'none';
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

// クリップボードから画像を貼り付け（Ctrl+V / Cmd+V）
document.addEventListener('paste', (e) => {
    const items = e.clipboardData.items;
    
    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        
        // 画像データの場合
        if (item.type.indexOf('image') !== -1) {
            e.preventDefault();
            
            const blob = item.getAsFile();
            imageName = `clipboard_image_${Date.now()}`;
            imageFormat = blob.type || 'image/png';
            
            const reader = new FileReader();
            reader.onload = (event) => {
                loadImage(event.target.result, `${imageName}${getExtension(imageFormat)}`);
            };
            reader.readAsDataURL(blob);
            
            break;
        }
    }
});
