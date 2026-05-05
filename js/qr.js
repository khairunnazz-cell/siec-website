// ============================================
// SIEC QR Code Generator
// Pure JavaScript - No Library Needed
// Menggunakan Google Charts Image API
// ============================================

var SIEC_QR = {
    
    // Generate QR Code sebagai IMG element (bukan canvas)
    // Lebih reliable karena pakai image URL
    generate: function(containerId, text, size, logoUrl) {
        var container = document.getElementById(containerId);
        if (!container) return;
        
        size = size || 100;
        var encodedText = encodeURIComponent(text || 'https://siec.vercel.app');
        
        // Hapus isi lama
        container.innerHTML = '';
        container.style.width = size + 'px';
        container.style.textAlign = 'center';
        container.style.position = 'relative';
        container.style.display = 'inline-block';
        
        // Gunakan Google Charts QR API
        var imgUrl = 'https://chart.googleapis.com/chart?' +
            'cht=qr' +
            '&chs=' + size + 'x' + size +
            '&chl=' + encodedText +
            '&choe=UTF-8' +
            '&chld=H|1';
        
        // Buat wrapper div
        var wrapper = document.createElement('div');
        wrapper.style.position = 'relative';
        wrapper.style.display = 'inline-block';
        wrapper.style.width = size + 'px';
        wrapper.style.height = size + 'px';
        
        // Buat QR image
        var img = document.createElement('img');
        img.src = imgUrl;
        img.width = size;
        img.height = size;
        img.style.display = 'block';
        img.style.borderRadius = '4px';
        
        img.onerror = function() {
            // Fallback: coba API lain
            SIEC_QR.fallback(container, text, size);
        };
        
        wrapper.appendChild(img);
        
        // Tambah logo di tengah
        if (logoUrl) {
            var logoSize = Math.round(size * 0.22);
            var logoWrapper = document.createElement('div');
            logoWrapper.style.cssText = 
                'position:absolute;' +
                'top:50%;left:50%;' +
                'transform:translate(-50%,-50%);' +
                'width:' + logoSize + 'px;' +
                'height:' + logoSize + 'px;' +
                'border-radius:50%;' +
                'overflow:hidden;' +
                'border:2px solid white;' +
                'box-shadow:0 0 0 1px #2563eb;' +
                'background:white;';
            
            var logoImg = document.createElement('img');
            logoImg.src = logoUrl;
            logoImg.style.cssText = 
                'width:100%;height:100%;' +
                'object-fit:contain;' +
                'border-radius:50%;';
            
            logoImg.onerror = function() {
                // Jika logo tidak ada, tulis teks SIEC
                logoWrapper.style.display = 'flex';
                logoWrapper.style.alignItems = 'center';
                logoWrapper.style.justifyContent = 'center';
                logoWrapper.innerHTML = '<span style="font-size:' + 
                    Math.round(logoSize * 0.35) + 
                    'px;font-weight:800;color:#2563eb;font-family:Arial;">SIEC</span>';
            };
            
            logoWrapper.appendChild(logoImg);
            wrapper.appendChild(logoWrapper);
        }
        
        container.appendChild(wrapper);
    },
    
    // Fallback menggunakan API QR server lain
    fallback: function(container, text, size) {
        var encodedText = encodeURIComponent(text || 'https://siec.vercel.app');
        var fallbackUrl = 'https://api.qrserver.com/v1/create-qr-code/' +
            '?size=' + size + 'x' + size +
            '&data=' + encodedText +
            '&margin=4' +
            '&ecc=H' +
            '&format=svg';
        
        container.innerHTML = 
            '<img src="' + fallbackUrl + '" ' +
            'width="' + size + '" height="' + size + '" ' +
            'style="display:block;border-radius:4px;" ' +
            'onerror="SIEC_QR.drawManual(this.parentElement,' + size + ')">';
    },
    
    // Fallback terakhir: gambar manual dengan canvas
    drawManual: function(container, size) {
        container.innerHTML = '';
        var canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        var ctx = canvas.getContext('2d');
        
        // Background putih
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, size, size);
        
        // Border
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;
        ctx.strokeRect(4, 4, size-8, size-8);
        
        // Pattern sudut (simulasi QR)
        var sq = Math.round(size * 0.2);
        // Sudut kiri atas
        ctx.fillStyle = '#000000';
        ctx.fillRect(10, 10, sq, sq);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(15, 15, sq-10, sq-10);
        ctx.fillStyle = '#000000';
        ctx.fillRect(18, 18, sq-16, sq-16);
        
        // Sudut kanan atas
        ctx.fillStyle = '#000000';
        ctx.fillRect(size-10-sq, 10, sq, sq);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(size-15-sq+10, 15, sq-10, sq-10);
        ctx.fillStyle = '#000000';
        ctx.fillRect(size-18-sq+16, 18, sq-16, sq-16);
        
        // Sudut kiri bawah
        ctx.fillStyle = '#000000';
        ctx.fillRect(10, size-10-sq, sq, sq);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(15, size-15-sq+10, sq-10, sq-10);
        ctx.fillStyle = '#000000';
        ctx.fillRect(18, size-18-sq+16, sq-16, sq-16);
        
        // Teks tengah
        ctx.fillStyle = '#2563eb';
        ctx.font = 'bold ' + Math.round(size*0.12) + 'px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('SCAN', size/2, size/2 - size*0.06);
        ctx.fillText('SIEC', size/2, size/2 + size*0.06);
        
        container.appendChild(canvas);
    }
};

// ============================================
// Fungsi global yang dipanggil dari admin.js
// ============================================

// Untuk canvas element (kompatibel dengan kode lama)