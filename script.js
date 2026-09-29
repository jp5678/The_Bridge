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

// Supabase config (shared by Photos and Calendar)
const SUPABASE_URL = 'https://ktdxmqgqepqvebiwhqoo.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt0ZHhtcWdxZXBxdmViaXdocW9vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ5NzE5NjIsImV4cCI6MjA5MDU0Nzk2Mn0.xakxUWHOzQ-QFNOD9Fb_1cgYqNc-qTVEBxCG2d9DciQ';
const ADMIN_PASSWORD = 'TheBridge';

// Photos Gallery (Supabase Storage)
(function () {
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
                        if (pw !== ADMIN_PASSWORD) { alert('비밀번호가 틀렸습니다.'); return; }
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

// Event Calendar (Supabase table "events", localStorage fallback)
(function () {
    const TABLE = 'events';
    const LOCAL_KEY = 'thebridge_events';

    const grid = document.getElementById('calGrid');
    if (!grid) return;

    const titleEl = document.getElementById('calTitle');
    const selectedEl = document.getElementById('calSelectedDate');
    const listEl = document.getElementById('calEventList');
    const form = document.getElementById('calForm');
    const notice = document.getElementById('calNotice');
    const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

    const sb = window.supabase ? supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null;
    let useLocal = false;
    let events = [];
    const today = new Date();
    let viewYear = today.getFullYear();
    let viewMonth = today.getMonth();
    let selected = toKey(today);

    function pad(n) { return (n < 10 ? '0' : '') + n; }
    function toKey(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }

    function formatKey(key) {
        const p = key.split('-').map(Number);
        const d = new Date(p[0], p[1] - 1, p[2]);
        return p[0] + '.' + pad(p[1]) + '.' + pad(p[2]) + '(' + WEEKDAYS[d.getDay()] + ')';
    }

    function eventsOn(key) {
        return events.filter(function (ev) { return ev.date === key; })
            .sort(function (a, b) { return (a.time || '').localeCompare(b.time || ''); });
    }

    function readLocal() {
        try { return JSON.parse(localStorage.getItem(LOCAL_KEY)) || []; } catch (e) { return []; }
    }

    function writeLocal(list) {
        try { localStorage.setItem(LOCAL_KEY, JSON.stringify(list)); } catch (e) { console.error(e); }
    }

    function switchToLocal(err) {
        if (err) console.error(err);
        useLocal = true;
        notice.textContent = '※ 서버 일정 저장소에 연결할 수 없어 이 브라우저에만 임시 저장됩니다.';
        events = readLocal();
    }

    function checkPassword(action) {
        const pw = prompt(action + ' 비밀번호를 입력하세요:');
        if (pw === null) return false;
        if (pw !== ADMIN_PASSWORD) { alert('비밀번호가 틀렸습니다.'); return false; }
        return true;
    }

    function loadEvents() {
        if (!sb && !useLocal) switchToLocal();
        if (useLocal) {
            events = readLocal();
            render();
            return Promise.resolve();
        }
        return sb.from(TABLE).select('*').order('date', { ascending: true })
            .then(function (res) {
                if (res.error) throw res.error;
                events = res.data || [];
            })
            .catch(switchToLocal)
            .then(render);
    }

    function addEvent(ev) {
        if (useLocal) {
            ev.id = Date.now() + '_' + Math.random().toString(36).slice(2);
            events.push(ev);
            writeLocal(events);
            return Promise.resolve();
        }
        return sb.from(TABLE).insert(ev).then(function (res) {
            if (res.error) throw res.error;
        });
    }

    function deleteEvent(id) {
        if (useLocal) {
            events = events.filter(function (ev) { return String(ev.id) !== String(id); });
            writeLocal(events);
            return Promise.resolve();
        }
        return sb.from(TABLE).delete().eq('id', id).then(function (res) {
            if (res.error) throw res.error;
        });
    }

    function renderGrid() {
        titleEl.textContent = viewYear + '년 ' + (viewMonth + 1) + '월';
        grid.innerHTML = '';

        const firstDay = new Date(viewYear, viewMonth, 1).getDay();
        const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
        const todayKey = toKey(today);

        for (let i = 0; i < firstDay; i++) {
            const blank = document.createElement('div');
            blank.className = 'cal-cell empty';
            grid.appendChild(blank);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(viewYear, viewMonth, day);
            const key = toKey(date);
            const dayEvents = eventsOn(key);

            const cell = document.createElement('button');
            cell.type = 'button';
            cell.className = 'cal-cell';
            if (date.getDay() === 0) cell.classList.add('sun');
            if (date.getDay() === 6) cell.classList.add('sat');
            if (key === todayKey) cell.classList.add('today');
            if (key === selected) cell.classList.add('selected');
            if (dayEvents.length) cell.classList.add('has-event');

            const num = document.createElement('span');
            num.className = 'cal-day';
            num.textContent = day;
            cell.appendChild(num);

            dayEvents.slice(0, 2).forEach(function (ev) {
                const tag = document.createElement('span');
                tag.className = 'cal-tag';
                tag.textContent = ev.title;
                cell.appendChild(tag);
            });
            if (dayEvents.length > 2) {
                const more = document.createElement('span');
                more.className = 'cal-more';
                more.textContent = '+' + (dayEvents.length - 2);
                cell.appendChild(more);
            }

            cell.addEventListener('click', function () {
                selected = key;
                form.querySelector('#evDate').value = key;
                render();
            });
            grid.appendChild(cell);
        }
    }

    function renderList() {
        selectedEl.textContent = formatKey(selected) + ' 일정';
        listEl.innerHTML = '';
        const dayEvents = eventsOn(selected);

        if (!dayEvents.length) {
            const empty = document.createElement('li');
            empty.className = 'cal-empty';
            empty.textContent = '등록된 일정이 없습니다.';
            listEl.appendChild(empty);
            return;
        }

        dayEvents.forEach(function (ev) {
            const li = document.createElement('li');
            li.className = 'cal-event';

            const time = document.createElement('span');
            time.className = 'event-date';
            time.textContent = ev.time ? ev.time.slice(0, 5) : '종일';

            const title = document.createElement('h4');
            title.className = 'event-title';
            title.textContent = ev.title;

            li.appendChild(time);
            li.appendChild(title);

            if (ev.place) {
                const place = document.createElement('p');
                place.textContent = '📍 ' + ev.place;
                li.appendChild(place);
            }
            if (ev.note) {
                const note = document.createElement('p');
                note.textContent = ev.note;
                li.appendChild(note);
            }

            const del = document.createElement('button');
            del.type = 'button';
            del.className = 'cal-delete';
            del.title = '삭제';
            del.textContent = '×';
            del.addEventListener('click', function () {
                if (!confirm('"' + ev.title + '" 일정을 삭제할까요?')) return;
                if (!checkPassword('삭제')) return;
                deleteEvent(ev.id).then(loadEvents).catch(function (err) {
                    alert('삭제 실패: ' + err.message);
                });
            });
            li.appendChild(del);

            listEl.appendChild(li);
        });
    }

    function render() {
        renderGrid();
        renderList();
    }

    function moveMonth(delta) {
        const d = new Date(viewYear, viewMonth + delta, 1);
        viewYear = d.getFullYear();
        viewMonth = d.getMonth();
        renderGrid();
    }

    document.getElementById('calPrev').addEventListener('click', function () { moveMonth(-1); });
    document.getElementById('calNext').addEventListener('click', function () { moveMonth(1); });
    document.getElementById('calToday').addEventListener('click', function () {
        viewYear = today.getFullYear();
        viewMonth = today.getMonth();
        selected = toKey(today);
        form.querySelector('#evDate').value = selected;
        render();
    });

    form.addEventListener('submit', function (e) {
        e.preventDefault();
        const ev = {
            date: form.querySelector('#evDate').value,
            time: form.querySelector('#evTime').value || null,
            title: form.querySelector('#evTitle').value.trim(),
            place: form.querySelector('#evPlace').value.trim() || null,
            note: form.querySelector('#evNote').value.trim() || null
        };
        if (!ev.date || !ev.title) return;
        if (!checkPassword('일정 등록')) return;

        addEvent(ev).then(function () {
            const p = ev.date.split('-').map(Number);
            viewYear = p[0];
            viewMonth = p[1] - 1;
            selected = ev.date;
            form.reset();
            form.querySelector('#evDate').value = selected;
            return loadEvents();
        }).catch(function (err) {
            alert('등록 실패: ' + err.message);
        });
    });

    form.querySelector('#evDate').value = selected;
    render();
    loadEvents();
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
