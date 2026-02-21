// DOM 요소
const titleInput = document.getElementById('title');
const categorySelect = document.getElementById('category');
const originalTextArea = document.getElementById('originalText');
const charCount = document.getElementById('charCount');
const generateBtn = document.getElementById('generateBtn');
const clearBtn = document.getElementById('clearBtn');
const resultSection = document.getElementById('resultSection');
const variationList = document.getElementById('variationList');
const loading = document.getElementById('loading');

// 글자수 카운트 업데이트
originalTextArea.addEventListener('input', () => {
    const count = originalTextArea.value.length;
    charCount.textContent = count;

    if (count > 4800) {
        charCount.style.color = '#f44336';
    } else {
        charCount.style.color = '#888';
    }
});

// 베리에이션 생성 버튼 클릭
generateBtn.addEventListener('click', async () => {
    const title = titleInput.value.trim();
    const category = categorySelect.value;
    const originalText = originalTextArea.value.trim();

    // 유효성 검증
    if (!title) {
        alert('제목을 입력해주세요.');
        titleInput.focus();
        return;
    }

    if (!originalText) {
        alert('원본 카피를 입력해주세요.');
        originalTextArea.focus();
        return;
    }

    if (originalText.length < 10) {
        alert('원본 카피는 최소 10자 이상이어야 합니다.');
        originalTextArea.focus();
        return;
    }

    // 선택된 글자수 제한 가져오기
    const selectedLimits = Array.from(
        document.querySelectorAll('.checkbox-group input[type="checkbox"]:checked')
    ).map(cb => parseInt(cb.value));

    if (selectedLimits.length === 0) {
        alert('최소 하나 이상의 글자수 제한을 선택해주세요.');
        return;
    }

    // 선택된 이미지 사이즈 가져오기
    const selectedImageSize = document.querySelector('input[name="imageSize"]:checked').value;

    // 베리에이션 생성
    await generateVariations(title, category, originalText, selectedLimits, selectedImageSize);
});

// 초기화 버튼 클릭
clearBtn.addEventListener('click', () => {
    if (confirm('입력한 내용과 생성된 베리에이션을 모두 초기화하시겠습니까?')) {
        titleInput.value = '';
        categorySelect.value = '프로모션';
        originalTextArea.value = '';
        charCount.textContent = '0';
        variationList.innerHTML = '';
        resultSection.style.display = 'none';
    }
});

// 베리에이션 생성 함수 (더미 구현)
async function generateVariations(title, category, originalText, limits, imageSize) {
    const loadingText = document.getElementById('loadingText');

    // 로딩 표시
    loading.style.display = 'block';
    resultSection.style.display = 'none';
    loadingText.textContent = '배너 문구 생성 중...';

    // 시뮬레이션: 텍스트 요약 2초
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 베리에이션 생성 (간단한 알고리즘)
    const variations = limits.map(limit => {
        const summarized = summarizeText(originalText, limit);
        return {
            id: Date.now() + Math.random(),
            characterLimit: limit,
            summarizedText: summarized,
            status: 'AUTO_GENERATED',
            isManuallyEdited: false,
            imageSize: imageSize,
            imageUrl: null,
            imageLoading: true
        };
    });

    // 결과 표시
    displayVariations(variations);

    // 로딩 숨김
    loading.style.display = 'none';
    resultSection.style.display = 'block';

    // 결과로 스크롤
    resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

    // 이미지 생성 (각 베리에이션마다 순차적으로)
    loadingText.textContent = '배너 이미지 생성 중...';
    for (const variation of variations) {
        await generateBannerImage(variation, title, category);
    }
}

// 텍스트 요약 함수 (간단한 더미 구현)
function summarizeText(text, limit) {
    // 문장 단위로 분리
    const sentences = text.split(/[.!?]\s+/).filter(s => s.trim());

    let result = '';

    // 글자수 제한에 맞게 문장 선택
    for (const sentence of sentences) {
        const trimmed = sentence.trim();
        if ((result + trimmed).length <= limit - 3) {
            result += (result ? ' ' : '') + trimmed;
        } else {
            break;
        }
    }

    // 결과가 비어있으면 앞부분만 잘라내기
    if (!result) {
        result = text.substring(0, limit - 3) + '...';
    } else if (result.length < text.length) {
        // 원본보다 짧으면 말줄임표 추가
        if (!result.endsWith('.')) {
            result += '...';
        }
    }

    return result;
}

// 베리에이션 표시
function displayVariations(variations) {
    variationList.innerHTML = '';

    variations.forEach(variation => {
        const card = createVariationCard(variation);
        variationList.appendChild(card);
    });
}

// 베리에이션 카드 생성
function createVariationCard(variation) {
    const card = document.createElement('div');
    card.className = 'variation-card';
    card.dataset.id = variation.id;

    const statusClass = variation.isManuallyEdited ? 'status-edited' : 'status-auto';
    const statusText = variation.isManuallyEdited ? '수동 편집됨' : '자동 생성됨';

    const imageSizeDisplay = {
        '1:1': '1:1 정사각형',
        '16:9': '16:9 가로형',
        '9:16': '9:16 세로형',
        '4:3': '4:3 표준'
    }[variation.imageSize] || variation.imageSize;

    const ratioClass = 'ratio-' + variation.imageSize.replace(':', '-');

    card.innerHTML = `
        <div class="variation-header">
            <span class="variation-limit">${variation.characterLimit}자 제한</span>
            <span class="variation-status ${statusClass}">${statusText}</span>
        </div>
        <div class="variation-content">
            <div class="variation-left">
                <div class="variation-text" data-original="${escapeHtml(variation.summarizedText)}">
                    ${variation.summarizedText}
                </div>
                <div class="variation-actions">
                    <button class="btn-edit" onclick="editVariation('${variation.id}')">텍스트 수정</button>
                </div>
            </div>
            <div class="variation-right">
                <div class="banner-image-container ${ratioClass}" id="banner-${variation.id}">
                    ${variation.imageLoading ? `
                        <div class="banner-loading">
                            <div class="spinner"></div>
                            <p>이미지 생성 중...</p>
                        </div>
                    ` : variation.imageUrl ? `
                        <img src="${variation.imageUrl}" alt="배너 이미지" class="banner-image">
                        <span class="image-size-badge">${imageSizeDisplay}</span>
                    ` : `
                        <div class="banner-placeholder">
                            <div class="banner-placeholder-icon">🖼️</div>
                            <p>이미지 생성 실패</p>
                        </div>
                    `}
                </div>
                <div class="image-actions">
                    <button class="btn-regenerate" onclick="regenerateImage('${variation.id}')">
                        🔄 이미지 재생성
                    </button>
                    ${variation.imageUrl ? `
                        <button class="btn-download" onclick="downloadImage('${variation.id}')">
                            💾 다운로드
                        </button>
                    ` : ''}
                </div>
            </div>
        </div>
    `;

    return card;
}

// 베리에이션 수정
function editVariation(id) {
    const card = document.querySelector(`.variation-card[data-id="${id}"]`);
    const textDiv = card.querySelector('.variation-text');
    const actionsDiv = card.querySelector('.variation-actions');
    const originalText = textDiv.dataset.original;
    const currentText = textDiv.textContent.trim();

    // 텍스트를 textarea로 변경
    textDiv.innerHTML = `
        <textarea class="variation-textarea">${currentText}</textarea>
    `;

    const textarea = textDiv.querySelector('textarea');
    textarea.focus();

    // 액션 버튼 변경
    actionsDiv.innerHTML = `
        <button class="btn-save" onclick="saveVariation('${id}')">저장</button>
        <button class="btn-cancel" onclick="cancelEdit('${id}', '${escapeHtml(originalText)}')">취소</button>
    `;
}

// 베리에이션 저장
function saveVariation(id) {
    const card = document.querySelector(`.variation-card[data-id="${id}"]`);
    const textarea = card.querySelector('.variation-textarea');
    const newText = textarea.value.trim();

    if (!newText) {
        alert('내용을 입력해주세요.');
        return;
    }

    const textDiv = card.querySelector('.variation-text');
    const statusSpan = card.querySelector('.variation-status');
    const actionsDiv = card.querySelector('.variation-actions');

    // 텍스트 업데이트
    textDiv.textContent = newText;
    textDiv.dataset.original = newText;

    // 상태 업데이트
    statusSpan.className = 'variation-status status-edited';
    statusSpan.textContent = '수동 편집됨';

    // 액션 버튼 복원
    actionsDiv.innerHTML = `
        <button class="btn-edit" onclick="editVariation('${id}')">수정</button>
    `;

    // 성공 알림
    showNotification('베리에이션이 저장되었습니다.', 'success');
}

// 편집 취소
function cancelEdit(id, originalText) {
    const card = document.querySelector(`.variation-card[data-id="${id}"]`);
    const textDiv = card.querySelector('.variation-text');
    const actionsDiv = card.querySelector('.variation-actions');

    // 원본 텍스트로 복원
    textDiv.textContent = unescapeHtml(originalText);

    // 액션 버튼 복원
    actionsDiv.innerHTML = `
        <button class="btn-edit" onclick="editVariation('${id}')">수정</button>
    `;
}

// HTML 이스케이프
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// HTML 언이스케이프
function unescapeHtml(html) {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent;
}

// 알림 표시
function showNotification(message, type = 'info') {
    // 기존 알림 제거
    const existing = document.querySelector('.notification');
    if (existing) {
        existing.remove();
    }

    // 새 알림 생성
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#4caf50' : '#2196f3'};
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        z-index: 1000;
        animation: slideIn 0.3s ease-out;
    `;

    document.body.appendChild(notification);

    // 3초 후 제거
    setTimeout(() => {
        notification.style.animation = 'fadeOut 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// 페이지 로드 시 샘플 데이터 입력 (테스트용)
window.addEventListener('load', () => {
    // 샘플 데이터는 필요시 주석 해제
    /*
    titleInput.value = '봄 할인 프로모션';
    categorySelect.value = '프로모션';
    originalTextArea.value = '봄맞이 특별 할인! 모든 상품 최대 50% 할인 이벤트가 진행됩니다. 지금 바로 방문하셔서 놀라운 혜택을 받아보세요!';
    charCount.textContent = originalTextArea.value.length;
    */
});

// 배너 이미지 생성 (더미 구현)
async function generateBannerImage(variation, title, category) {
    // 시뮬레이션: 1.5초 대기
    await new Promise(resolve => setTimeout(resolve, 1500));

    // 더미 이미지 생성 (실제로는 DALL-E API 호출)
    // placeholder 서비스를 이용하여 이미지 생성
    const dimensions = {
        '1:1': { width: 800, height: 800 },
        '16:9': { width: 1600, height: 900 },
        '9:16': { width: 900, height: 1600 },
        '4:3': { width: 1200, height: 900 }
    }[variation.imageSize];

    // Canvas로 더미 이미지 생성
    const imageUrl = generateDummyBannerImage(
        variation.summarizedText,
        dimensions.width,
        dimensions.height,
        category
    );

    // 베리에이션 업데이트
    variation.imageUrl = imageUrl;
    variation.imageLoading = false;

    // 카드 업데이트
    updateVariationCard(variation);
}

// 더미 배너 이미지 생성 (Canvas 사용)
function generateDummyBannerImage(text, width, height, category) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    // 배경 그라디언트
    const gradient = ctx.createLinearGradient(0, 0, width, height);

    // 카테고리별 색상
    const colors = {
        '프로모션': ['#667eea', '#764ba2'],
        '이벤트': ['#f093fb', '#f5576c'],
        '신규출시': ['#4facfe', '#00f2fe'],
        '공지사항': ['#43e97b', '#38f9d7']
    };

    const [color1, color2] = colors[category] || colors['프로모션'];
    gradient.addColorStop(0, color1);
    gradient.addColorStop(1, color2);

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // 텍스트 추가
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // 텍스트 크기 조정
    const fontSize = Math.min(width, height) / 10;
    ctx.font = `bold ${fontSize}px "Noto Sans KR", sans-serif`;

    // 텍스트 그림자
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;

    // 긴 텍스트 처리 (줄바꿈)
    const maxWidth = width * 0.8;
    const words = text.split(' ');
    let line = '';
    let lines = [];

    for (const word of words) {
        const testLine = line + word + ' ';
        const metrics = ctx.measureText(testLine);

        if (metrics.width > maxWidth && line !== '') {
            lines.push(line);
            line = word + ' ';
        } else {
            line = testLine;
        }
    }
    lines.push(line);

    // 텍스트 그리기
    const lineHeight = fontSize * 1.2;
    const startY = (height - (lines.length - 1) * lineHeight) / 2;

    lines.forEach((line, index) => {
        ctx.fillText(line.trim(), width / 2, startY + index * lineHeight);
    });

    // 장식 요소 추가
    ctx.shadowColor = 'transparent';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 3;
    ctx.strokeRect(20, 20, width - 40, height - 40);

    return canvas.toDataURL('image/png');
}

// 베리에이션 카드 업데이트
function updateVariationCard(variation) {
    const card = document.querySelector(`.variation-card[data-id="${variation.id}"]`);
    if (!card) return;

    const bannerContainer = card.querySelector(`#banner-${variation.id}`);
    const statusClass = variation.isManuallyEdited ? 'status-edited' : 'status-auto';
    const statusText = variation.isManuallyEdited ? '수동 편집됨' : '자동 생성됨';

    const imageSizeDisplay = {
        '1:1': '1:1 정사각형',
        '16:9': '16:9 가로형',
        '9:16': '9:16 세로형',
        '4:3': '4:3 표준'
    }[variation.imageSize] || variation.imageSize;

    if (variation.imageUrl && !variation.imageLoading) {
        bannerContainer.innerHTML = `
            <img src="${variation.imageUrl}" alt="배너 이미지" class="banner-image">
            <span class="image-size-badge">${imageSizeDisplay}</span>
        `;

        // 다운로드 버튼 추가
        const imageActions = bannerContainer.parentElement.querySelector('.image-actions');
        if (!imageActions.querySelector('.btn-download')) {
            imageActions.innerHTML += `
                <button class="btn-download" onclick="downloadImage('${variation.id}')">
                    💾 다운로드
                </button>
            `;
        }
    }
}

// 이미지 재생성
async function regenerateImage(id) {
    const card = document.querySelector(`.variation-card[data-id="${id}"]`);
    const bannerContainer = card.querySelector('.banner-image-container');

    // 로딩 표시
    bannerContainer.innerHTML = `
        <div class="banner-loading">
            <div class="spinner"></div>
            <p>이미지 생성 중...</p>
        </div>
    `;

    // 베리에이션 데이터 가져오기 (임시로 카드에서 추출)
    const textDiv = card.querySelector('.variation-text');
    const text = textDiv.textContent.trim();
    const limitSpan = card.querySelector('.variation-limit');
    const limit = parseInt(limitSpan.textContent);

    const imageSizeClass = Array.from(bannerContainer.classList)
        .find(cls => cls.startsWith('ratio-'));
    const imageSize = imageSizeClass ? imageSizeClass.replace('ratio-', '').replace('-', ':') : '1:1';

    // 임시 베리에이션 객체 생성
    const variation = {
        id: id,
        summarizedText: text,
        characterLimit: limit,
        imageSize: imageSize,
        imageUrl: null,
        imageLoading: true,
        isManuallyEdited: false
    };

    // 이미지 재생성
    const category = document.getElementById('category').value;
    const title = document.getElementById('title').value;
    await generateBannerImage(variation, title, category);

    showNotification('배너 이미지가 재생성되었습니다.', 'success');
}

// 이미지 다운로드
function downloadImage(id) {
    const card = document.querySelector(`.variation-card[data-id="${id}"]`);
    const img = card.querySelector('.banner-image');

    if (!img) {
        alert('다운로드할 이미지가 없습니다.');
        return;
    }

    const link = document.createElement('a');
    const limitSpan = card.querySelector('.variation-limit');
    const limit = limitSpan.textContent.replace('자 제한', '');
    const title = document.getElementById('title').value || '배너';

    link.download = `${title}_${limit}.png`;
    link.href = img.src;
    link.click();

    showNotification('이미지 다운로드가 시작되었습니다.', 'success');
}

// 애니메이션 CSS 추가
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes fadeOut {
        from {
            opacity: 1;
        }
        to {
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
