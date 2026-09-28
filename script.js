let audioCtx = null;
let gainNode = null;
let isAudioInitialized = false;

// 오디오 파라미터 변수 확장 제어 레이어
let lowPassFilter = null; // 과거의 잔상을 표현할 로우패스 필터
let dripInterval = null;  // 물방울 신스 스케줄러

// 1. 온보딩 시작하기 버튼을 명확히 터치했을 때 호출되는 오디오 초기화 함수
function startLesson() {
    if (isAudioInitialized) return;
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        audioCtx = new AudioContext();
        gainNode = audioCtx.createGain();
        
        // 초기 청취 가능성 상향: 방안에서 듣는 볼륨 조절
        gainNode.gain.setValueAtTime(0.18, audioCtx.currentTime);
        
        const bufferSize = 2 * audioCtx.sampleRate;
        const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        
        // 화이트 노이즈 생성 알고리즘 정밀화
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
        console.log("🔊 웹 오디오 가동 완료: 처음부터 은은한 빗소리가 정상 작동합니다.");
        
        // UI에서 스플래시 오버레이 화면을 자연스럽게 제거
        const overlay = document.getElementById('startOverlay');
        if (overlay) {
            overlay.style.opacity = '0';
            overlay.style.pointerEvents = 'none';
        }
    } catch (e) {
        console.error("웹 오디오 API 초기화 실패:", e);
    }
}

// 2. 아파트 창문 커튼을 치면 합성 중인 빗소리가 웅장하게 커지는 메인 액티비티 로직
function triggerNode1() {
    const frame = document.getElementById('windowFrame');
    if (!frame) return;
    
    if (!frame.classList.contains('open')) {
        frame.classList.add('open');
        document.getElementById('rainBg').style.display = 'block';
        document.getElementById('targetSentence').classList.add('show');
        
        // 커튼 인터랙션: 커튼을 치면 소리가 확 쏟아지듯 부드럽게 증폭!
        if (gainNode && audioCtx) {
            gainNode.gain.linearRampToValueAtTime(0.65, audioCtx.currentTime + 0.25);
        }
        
        setTimeout(() => {
            document.getElementById('ccqPanel').classList.add('show');
        }, 1000);
    }
}

/**
 * 노드 1의 [Yes, right now!] 검증 버튼 클릭 시 호출되는 화면/오디오 전환 함수
 */
function finishDemo() {
    const node1 = document.getElementById('node-1');
    const node2 = document.getElementById('node-2');
    
    if (!node1 || !node2) {
        console.error("전환할 노드 요소를 찾을 수 없습니다.");
        return;
    }

    // 1. 시각적 페이드 아웃/인 시퀀스
    node1.style.opacity = '0';
    
    setTimeout(() => {
        node1.classList.add('is-hidden');
        node2.classList.remove('is-hidden');
        
        // 브라우저 렌더링 큐 반영 후 페이드인 효과 연출
        setTimeout(() => {
            node2.style.opacity = '1';
        }, 50);

        // 2. 청각적 시제 엣지 전환 실행 (Web Audio API 제어)
        transitionAudioToPast();
    }, 1200); // CSS transition 시간과 동기화
}

/**
 * Web Audio API 실시간 필터 및 노드 전환 로직
 * 웅장한 실시간 빗소리를 '둔탁한 과거의 잔상'으로 깎고, 간헐적 물방울 신스를 추가합니다.
 */
function transitionAudioToPast() {
    // 오디오 컨텍스트 상태 예외 차단 해제 및 정밀 검증
    if (!audioCtx || audioCtx.state === 'suspended') return;

    // 1. 메인 Gain 노드와 최종 목적지(destination) 사이에 오디오 로우패스 필터 동적 삽입
    if (!lowPassFilter) {
        lowPassFilter = audioCtx.createBiquadFilter();
        lowPassFilter.type = 'lowpass';
        
        if (gainNode) {
            gainNode.disconnect();
            gainNode.connect(lowPassFilter);
            lowPassFilter.connect(audioCtx.destination);
        }
    }

    const now = audioCtx.currentTime;
    
    // 주파수를 300Hz로 대폭 깎아서 빗소리를 완전히 먹먹하고 멀게 만듦 (과거의 잔상 톤 구현)
    lowPassFilter.frequency.setValueAtTime(1100, now);
    lowPassFilter.frequency.exponentialRampToValueAtTime(300, now + 3.0);

    // 전체 볼륨도 과거의 기억처럼 아주 은은하게 감쇄 (0.65 -> 0.08)
    if (gainNode) {
        gainNode.gain.setValueAtTime(gainNode.gain.value, now);
        gainNode.gain.linearRampToValueAtTime(0.08, now + 3.0); 
    }

    // 3. 물방울 뚝뚝 떨어지는 실시간 효과음 신디사이저(Drip Synth) 가동
    startDripSynth();
}

/**
 * Pure Web Audio API 기반의 오디오 합성: 물방울 소리 (Drip Synth)
 */
function playDripSound() {
    if (!audioCtx || audioCtx.state === 'suspended') return;

    const now = audioCtx.currentTime;
    
    // 오실레이터와 엔벨롭(Gain) 노드 생성
    const osc = audioCtx.createOscillator();
    const dripGain = audioCtx.createGain();
    
    osc.type = 'sine';
    
    // 인지언어학적 청각 매핑: 물방울이 떨어지며 튕기는 '틱'하는 고주파 변조 연출
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(1200, now + 0.04); 

    // 볼륨 엔벨롭 설정 (매우 짧고 간결하게 툭 떨어지는 소리)
    dripGain.gain.setValueAtTime(0.0, now);
    dripGain.gain.linearRampToValueAtTime(0.15, now + 0.005);
    dripGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    // 노드 연결 및 플레이
    osc.connect(dripGain);
    dripGain.connect(audioCtx.destination);
    
    osc.start(now);
    osc.stop(now + 0.09);
}

/**
 * 노드 2의 주기적인 물방울 합성 엔진 구동
 */
function startDripSynth() {
    if (dripInterval) clearInterval(dripInterval);
    
    // 2초~4초 사이의 불규칙적 인터벌로 물방울 소리를 합성하여 불규칙적 현실감 부여
    dripInterval = setInterval(() => {
        playDripSound();
        triggerPuddleRipple();
    }, Math.random() * 2000 + 2000);
}

function triggerPuddleRipple() {
    const ripple = document.querySelector('.puddle-ripple');
    if (ripple) {
        ripple.style.transform = 'scale(1.5)';
        ripple.style.opacity = '0.4';
        setTimeout(() => {
            ripple.style.transform = 'scale(0)';
            ripple.style.opacity = '0';
        }, 600);
    }
}

/* --- Node 2 교육 패널 CCQ 인터랙션 함수 --- */
function handleNode2Wrong() {
    const feedback = document.getElementById('node2-feedback');
    if (!feedback) return;
    feedback.classList.remove('is-hidden');
    feedback.style.color = '#f25c54';
    feedback.innerHTML = "❌ Look outside/inside carefully! The rain has stopped now. But look at the water puddles on the ground!";
}

function handleNode2Correct() {
    const feedback = document.getElementById('node2-feedback');
    if (!feedback) return;
    feedback.classList.remove('is-hidden');
    feedback.style.color = '#06d6a0';
    feedback.innerHTML = "🎯 Excellent! It is NOT raining right now. But the wet puddles prove that it <strong>was raining</strong> this morning. You grasped the Tense Edge!";
    
    playDripSound();
}
