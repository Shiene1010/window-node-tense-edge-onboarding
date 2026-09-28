let audioCtx = null;
let gainNode = null;
let isAudioInitialized = false;

// 1. 온보딩 시작하기 버튼을 명확히 터치했을 때 호출되는 오디오 초기화 함수
function startLesson() {
    if (isAudioInitialized) return;

    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        audioCtx = new AudioContext();
        
        gainNode = audioCtx.createGain();
        // 🔊 초기 청취 가능성 상향: 방안에서 듣는 볼륨을 0.08에서 0.18로 올려 처음부터 잘 들리도록 조절
        gainNode.gain.setValueAtTime(0.18, audioCtx.currentTime); 

        const bufferSize = 2 * audioCtx.sampleRate;
        const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }

        const whiteNoise = audioCtx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;

        const filter = audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1100, audioCtx.currentTime); // 비 내리는 먹먹한 톤 보정

        whiteNoise.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        whiteNoise.start();
        isAudioInitialized = true;
        console.log("⚡ 웹 오디오 가동 완료: 처음부터 은은한 빗소리가 정상 작동합니다.");

        // UI에서 스플래시 오버레이 화면을 자연스럽게 제거
        const overlay = document.getElementById('startOverlay');
        overlay.style.opacity = '0';
        overlay.style.pointerEvents = 'none';

    } catch (e) {
        console.error("웹 오디오 API 초기화 실패:", e);
    }
}

// 2. 아파트 창문 커튼을 치면 합성 중인 빗소리가 웅장하게 커지는 메인 액티비티 로직
function triggerNode1() {
    const frame = document.getElementById('windowFrame');
    
    if (!frame.classList.contains('open')) {
        frame.classList.add('open');
        document.getElementById('rainBg').style.display = 'block';
        document.getElementById('targetSentence').classList.add('show');
        
        // 🔊 커튼 인터랙션: 커튼을 치면 0.18에서 0.65(65% 수준)로 소리가 확 쏟아지듯 부드럽게 증폭!
        if (gainNode && audioCtx) {
            gainNode.gain.linearRampToValueAtTime(0.65, audioCtx.currentTime + 0.25);
        }
        
        setTimeout(() => {
            document.getElementById('ccqPanel').classList.add('show');
        }, 1000);
    }
}

function finishDemo() {
    alert("🎉 온보딩 노드 1 성공! 합성 빗소리와 함께 시제 엣지(현재 시점 맥락)가 완벽히 활성화되었습니다.");
    
    if (gainNode && audioCtx) {
        gainNode.gain.linearRampToValueAtTime(0.18, audioCtx.currentTime + 0.3);
    }
}
