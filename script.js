function triggerNode1() {
    const frame = document.getElementById('windowFrame');
    
    // 커튼이 열려있지 않은 상태일 때만 실행
    if (!frame.classList.contains('open')) {
        frame.classList.add('open');
        document.getElementById('rainBg').style.display = 'block';
        document.getElementById('targetSentence').classList.add('show');
        
        // 1초 뒤 자연스럽게 CCQ 검증 패널 등장
        setTimeout(() => {
            document.getElementById('ccqPanel').classList.add('show');
        }, 1000);
    }
}

function finishDemo() {
    alert("🎉 온보딩 노드 1 성공! 엣지(현재 시점 맥락)가 활성화되었습니다.");
}
