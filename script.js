// 🎛️ 웹 오디오 API 컨텍스트 및 볼륨 제어 노드 선언
let audioCtx = null;
let gainNode = null;
let isAudioInitialized = false;

// 1. 유저가 화면 어디든 처음 터치/클릭하는 순간 브라우저 내부에서 실시간 빗소리 합성 시작
document.addEventListener('click', () => { initRainSynth(); });
document.addEventListener('touchstart', () => { initRainSynth(); });

function initRainSynth() {
    if (isAudioInitialized) return;

    try {
        // 브라우저 오디오 컨텍스트 생성
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        audioCtx = new AudioContext();
        
        // 🔊 메인 볼륨 제어 장치 연결
        gainNode = audioCtx.createGain();
        gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime); // 커튼 열기 전: 아주 은은한 방 안 빗소리 (8% 볼륨)

        // 🌧️ 빗소리를 만들기 위한 백색 소음(White Noise) 버퍼 생성
        const bufferSize = 2 * audioCtx.sampleRate;
        const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        
        // 난수를 채워 무작위 백색소음 데이터 생성
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }

        // 오디오 소스에 소음 버퍼 입력
        const whiteNoise = audioCtx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;

        // 🎚️ 빗소리 질감을 위한 오디오 필터 생성 (고주파를 부드럽게 깎아 빗소리처럼 연출)
        const filter = audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1200, audioCtx.currentTime); // 약간 먹먹한 느낌의 기본 주파수

        // 그래프 연결: 소음원 ➔ 필터 ➔ 볼륨 제어 ➔ 스피커 출력
        whiteNoise.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        // 재생 시작
        whiteNoise.start();
        isAudioInitialized = true;
        console.log("⚡ 외부 파일 없는 브라우저 자체 빗소리 합성 엔진 가동 성공!");
    } catch (e) {
        console.error("웹 오디오 API 초기화 실패:", e);
    }
}

// 2. 아파트 창문 커튼을 치면 합성 중인 빗소리가 확 커지는 메인 인터랙션 로직
function triggerNode1() {
    const frame = document.getElementById('windowFrame');
    
    if (!frame.classList.contains('open')) {
        frame.classList.add('open');
        document.getElementById('rainBg').style.display = 'block';
        document.getElementById('targetSentence').classList.add('show');
        
        // 만약 첫 클릭이 커튼 창틀이었다면 오디오 엔진이 켜졌는지 재확인
        if (!isAudioInitialized) {
            initRainSynth();
        }
        
        // 🔊 볼륨 인터랙션: 커튼을 치면 빗소리 볼륨을 0.08에서 0.55(55% 수준)로 부드럽고 묵직하게 증폭!
        if (gainNode && audioCtx) {
            const currentVol = gainNode.gain.value;
            // 0.2초 동안 볼륨을 자연스럽게 0.55로 올리는 오디오 전용 페이드 기능 사용
            gainNode.gain.linearRampToValueAtTime(0.55, audioCtx.currentTime + 0.2);
        }
        
        // 1초 뒤 자연스럽게 CCQ 검증 패널 등장
        setTimeout(() => {
            document.getElementById('ccqPanel').classList.add('show');
        }, 1000);
    }
}

function finishDemo() {
    alert("🎉 온보딩 노드 1 성공! 합성 빗소리와 함께 시제 엣지(현재 시점 맥락)가 완벽히 활성화되었습니다.");
    
    // 검증 완료 후 대기 상태를 위해 소리를 다시 은은하게 줄임
    if (gainNode && audioCtx) {
        gainNode.gain.linearRampToValueAtTime(0.08, audioCtx.currentTime + 0.3);
    }
}
