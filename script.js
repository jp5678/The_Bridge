// Event Popup Logic
window.addEventListener('load', () => {
    const popup = document.getElementById('eventPopup');
    const closeBtn = document.getElementById('closePopup');

    if (popup) {
        console.log('Popup element found, attempting to show...');
        popup.style.display = 'flex';
        console.log('Popup display set to flex');

        // Close popup on button click
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                popup.style.display = 'none';
            });
        }

        // Close popup on outside click
        popup.addEventListener('click', (e) => {
            if (e.target === popup) {
                popup.style.display = 'none';
            }
        });
    } else {
        console.error('Popup element NOT found');
    }
});

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        if (targetId === '#') return; // Skip if href is just "#"

        const targetElement = document.querySelector(targetId);
        if (targetElement) {
            targetElement.scrollIntoView({
                behavior: 'smooth'
            });
        }
    });
});

// Navbar scroll effect
const navbar = document.querySelector('.navbar');
if (navbar) {
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.style.boxShadow = '0 10px 30px -10px rgba(2, 12, 27, 0.7)';
        } else {
            navbar.style.boxShadow = 'none';
        }
    });
}

// Mobile Menu Toggle
const hamburger = document.querySelector('.hamburger');
const navLinks = document.querySelector('.nav-links');

if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
        navLinks.style.display = navLinks.style.display === 'flex' ? 'none' : 'flex';
        if (navLinks.style.display === 'flex') {
            navLinks.style.flexDirection = 'column';
            navLinks.style.position = 'absolute';
            navLinks.style.top = '70px';
            navLinks.style.right = '0';
            navLinks.style.width = '100%';
            navLinks.style.backgroundColor = 'rgba(10, 25, 47, 0.98)';
            navLinks.style.padding = '2rem';
            navLinks.style.textAlign = 'center';
        }
    });
}

// Photos Gallery (Supabase Storage)
(function () {
    const SUPABASE_URL = 'https://ktdxmqgqepqvebiwhqoo.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt0ZHhtcWdxZXBxdmViaXdocW9vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ5NzE5NjIsImV4cCI6MjA5MDU0Nzk2Mn0.xakxUWHOzQ-QFNOD9Fb_1cgYqNc-qTVEBxCG2d9DciQ';
    const BUCKET = 'Photos';

    const gallery = document.getElementById('photoGallery');
    const noPhotosMsg = document.getElementById('noPhotosMsg');
    const photoUpload = document.getElementById('photoUpload');
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightboxImg');
    const lightboxClose = document.getElementById('lightboxClose');
    const lightboxPrev = document.getElementById('lightboxPrev');
    const lightboxNext = document.getElementById('lightboxNext');

    if (!gallery || !photoUpload) return;

    const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    let currentPhotos = [];
    let currentIndex = 0;

    function getPublicUrl(path) {
        return sb.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
    }

    function setLoading(on) {
        noPhotosMsg.textContent = on ? '불러오는 중...' : '아직 업로드된 사진이 없습니다.';
        noPhotosMsg.style.display = on ? 'block' : '';
    }

    function renderGallery() {
        setLoading(true);
        sb.storage.from(BUCKET).list('', { sortBy: { column: 'created_at', order: 'desc' } })
            .then(function (res) {
                if (res.error) throw res.error;

                gallery.querySelectorAll('.photo-item').forEach(function (el) { el.remove(); });

                const files = (res.data || []).filter(function (f) { return f.name !== '.emptyFolderPlaceholder'; });
                currentPhotos = files;

                if (files.length === 0) {
                    setLoading(false);
                    noPhotosMsg.style.display = 'block';
                    return;
                }

                noPhotosMsg.style.display = 'none';

                files.forEach(function (file, index) {
                    const url = getPublicUrl(file.name);

                    const item = document.createElement('div');
                    item.className = 'photo-item';

                    const img = document.createElement('img');
                    img.src = url;
                    img.alt = file.name;
                    img.loading = 'lazy';

                    const deleteBtn = document.createElement('button');
                    deleteBtn.className = 'delete-btn';
                    deleteBtn.title = '삭제';
                    deleteBtn.textContent = '×';
                    deleteBtn.addEventListener('click', function (e) {
                        e.stopPropagation();
                        var pw = prompt('삭제 비밀번호를 입력하세요:');
                        if (pw === null) return;
                        if (pw !== 'TheBridge') { alert('비밀번호가 틀렸습니다.'); return; }
                        sb.storage.from(BUCKET).remove([file.name]).then(function (r) {
                            if (r.error) { alert('삭제 실패: ' + r.error.message); return; }
                            renderGallery();
                        });
                    });

                    item.appendChild(img);
                    item.appendChild(deleteBtn);
                    item.addEventListener('click', function () { openLightbox(index); });
                    gallery.appendChild(item);
                });
            })
            .catch(function (err) {
                noPhotosMsg.textContent = '사진을 불러오지 못했습니다.';
                noPhotosMsg.style.display = 'block';
                console.error(err);
            });
    }

    function openLightbox(index) {
        if (!currentPhotos.length) return;
        currentIndex = index;
        lightboxImg.src = getPublicUrl(currentPhotos[currentIndex].name);
        lightbox.classList.add('active');
    }

    function closeLightbox() {
        lightbox.classList.remove('active');
        lightboxImg.src = '';
    }

    function navigateLightbox(direction) {
        if (!currentPhotos.length) return;
        currentIndex = (currentIndex + direction + currentPhotos.length) % currentPhotos.length;
        lightboxImg.src = getPublicUrl(currentPhotos[currentIndex].name);
    }

    lightboxClose.addEventListener('click', closeLightbox);
    lightboxPrev.addEventListener('click', function () { navigateLightbox(-1); });
    lightboxNext.addEventListener('click', function () { navigateLightbox(1); });
    lightbox.addEventListener('click', function (e) { if (e.target === lightbox) closeLightbox(); });

    document.addEventListener('keydown', function (e) {
        if (!lightbox.classList.contains('active')) return;
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowLeft') navigateLightbox(-1);
        if (e.key === 'ArrowRight') navigateLightbox(1);
    });

    function compressImage(file, maxWidth = 1920, maxHeight = 1920, quality = 0.8) {
        return new Promise((resolve, reject) => {
            if (!file.type.match(/image.*/)) {
                resolve(file);
                return;
            }
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = function (event) {
                const img = new Image();
                img.src = event.target.result;
                img.onload = function () {
                    let width = img.width;
                    let height = img.height;
                    if (width > maxWidth || height > maxHeight) {
                        if (width > height) {
                            height = Math.round((height *= maxWidth / width));
                            width = maxWidth;
                        } else {
                            width = Math.round((width *= maxHeight / height));
                            height = maxHeight;
                        }
                    }
                    const canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    canvas.toBlob((blob) => {
                        if (!blob) {
                            reject(new Error('Canvas is empty'));
                            return;
                        }
                        const newFile = new File([blob], file.name, {
                            type: file.type,
                            lastModified: Date.now()
                        });
                        resolve(newFile);
                    }, file.type, quality);
                };
                img.onerror = reject;
            };
            reader.onerror = reject;
        });
    }

    photoUpload.addEventListener('change', async function (e) {
        const files = Array.from(e.target.files);
        if (!files.length) return;

        noPhotosMsg.textContent = '업로드 중... (큰 사진은 압축 중입니다)';
        noPhotosMsg.style.display = 'block';

        const promises = files.map(async function (file) {
            try {
                const compressedFile = await compressImage(file);
                const ext = compressedFile.name.split('.').pop() || 'jpg';
                const path = Date.now() + '_' + Math.random().toString(36).slice(2) + '.' + ext;
                return await sb.storage.from(BUCKET).upload(path, compressedFile, { cacheControl: '3600', upsert: false });
            } catch (err) {
                return { error: { message: err.message || '압축/업로드 중 오류 발생' } };
            }
        });

        Promise.all(promises).then(function (results) {
            const failed = results.filter(function (r) { return r.error; });
            if (failed.length) {
                alert('일부 사진 업로드에 실패했습니다: ' + failed[0].error.message + '\n\n(참고: 파일 크기 제한, 또는 Supabase의 CORS 설정 문제일 수 있습니다.)');
            }
            renderGallery();
        });

        e.target.value = '';
    });

    renderGallery();
})();

// Simple Intersection Observer for fade-in animations
const observerOptions = {
    threshold: 0.1
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

document.querySelectorAll('.section').forEach(section => {
    section.style.opacity = '0';
    section.style.transform = 'translateY(20px)';
    section.style.transition = 'all 0.6s ease-out';
    observer.observe(section);
});
