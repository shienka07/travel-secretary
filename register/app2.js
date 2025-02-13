function toggleAll() {
    const agreeAll = document.getElementById('agree-all');
    const terms = document.getElementById('terms');
    const privacy = document.getElementById('privacy');
    const marketing = document.getElementById('marketing');
    
    const isChecked = agreeAll.checked;
    terms.checked = isChecked;
    privacy.checked = isChecked;
    marketing.checked = isChecked;
}

// 다른 체크박스가 풀리면 '모두 동의합니다' 체크박스도 풀리게
function checkAgreeAll() {
    const agreeAll = document.getElementById('agree-all');
    const terms = document.getElementById('terms');
    const privacy = document.getElementById('privacy');
    const marketing = document.getElementById('marketing');

    if (!terms.checked || !privacy.checked || !marketing.checked) {
        agreeAll.checked = false;
    } else {
        agreeAll.checked = true;
    }
}