---
layout: default
title: Home Page
---

// グローバル変数
let currentImage = null;
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

// ファイル入力変更時
fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
        loadImageFromFile(file);
    }
});

// ドラッグ&ドロップ処理
dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('drag-over');
});

dropzone.addEventListener('dragleave', () => {
    dropzone.classList.remove('drag-over');
});

dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('drag-over');
    
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
        loadImageFromFile(file);
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

// ファイルから画像を読み込む
function loadImageFromFile(file) {
    imageName = file.name.split('.')[0];
    imageFormat = file.type;
    
    const reader = new FileReader();
    reader.onload = (e) => {
        loadImage(e.target.result, file.name);
    };
    reader.readAsDataURL(file);
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

// 画像を読み込んでキャンバスに描画
function loadImage(src, name) {
    const img = new Image();
    img.onload = () => {
        currentImage = img;
        
        // 画像情報を表示
        fileName.textContent = name;
        imageDimensions.textContent = `${img.width} × ${img.height}px`;
        imageFormatText.textContent = getFormatName(imageFormat);
        
        // プレビューセクションを表示
        previewSection.style.display = 'block';
        
        // キャンバスに描画
        drawPreview();
        
        // スムーズスクロール
        previewSection.scrollIntoView({ behavior: 'smooth' });
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

// プレビューを描画
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

// 半分をダウンロード
function downloadHalf(side) {
    if (!currentImage) return;
    
    const splitPercent = parseFloat(splitPosition.value) / 100;
    const splitX = Math.round(currentImage.width * splitPercent);
    
    // 新しいキャンバスを作成
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (side === 'left') {
        // 左半分
        canvas.width = splitX;
        canvas.height = currentImage.height;
        ctx.drawImage(
            currentImage,
            0, 0, splitX, currentImage.height,
            0, 0, splitX, currentImage.height
        );
    } else {
        // 右半分
        canvas.width = currentImage.width - splitX;
        canvas.height = currentImage.height;
        ctx.drawImage(
            currentImage,
            splitX, 0, currentImage.width - splitX, currentImage.height,
            0, 0, currentImage.width - splitX, currentImage.height
        );
    }
    
    // ダウンロード
    canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        
        // ファイル拡張子を取得
        const extension = getExtension(imageFormat);
        a.download = `${imageName}_${side}${extension}`;
        
        a.click();
        URL.revokeObjectURL(url);
    }, imageFormat);
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
    // 状態をリセット
    currentImage = null;
    originalImageData = null;
    fileInput.value = '';
    urlInput.value = '';
    splitPosition.value = 50;
    splitPercentage.textContent = '50';
    
    // プレビューセクションを非表示
    previewSection.style.display = 'none';
    
    // スクロールを上に戻す
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
