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

    // 베리에이션 생성
    await generateVariations(title, category, originalText, selectedLimits);
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
async function generateVariations(title, category, originalText, limits) {
    // 로딩 표시
    loading.style.display = 'block';
    resultSection.style.display = 'none';

    // 시뮬레이션: 2초 대기
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 베리에이션 생성 (간단한 알고리즘)
    const variations = limits.map(limit => {
        const summarized = summarizeText(originalText, limit);
        return {
            id: Date.now() + Math.random(),
            characterLimit: limit,
            summarizedText: summarized,
            status: 'AUTO_GENERATED',
            isManuallyEdited: false
        };
    });

    // 결과 표시
    displayVariations(variations);

    // 로딩 숨김
    loading.style.display = 'none';
    resultSection.style.display = 'block';

    // 결과로 스크롤
    resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
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

    card.innerHTML = `
        <div class="variation-header">
            <span class="variation-limit">${variation.characterLimit}자 제한</span>
            <span class="variation-status ${statusClass}">${statusText}</span>
        </div>
        <div class="variation-text" data-original="${variation.summarizedText}">
            ${variation.summarizedText}
        </div>
        <div class="variation-actions">
            <button class="btn-edit" onclick="editVariation('${variation.id}')">수정</button>
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
