let audioCtx = null;
let gainNode = null;
let isAudioInitialized = false;

// 오디오 파라미터 변수 확장 제어 레이어
let lowPassFilter = null;   // 과거/미래 환경 차단 필터
let dripInterval = null;    // 노드 2용 물방울 스케줄러
let tensionOsc = null;      // 노드 3용 미래 예측 긴장감 고조 오실레이터
let tensionGain = null;     // 긴장감 볼륨 제어 노드

// 1. 온보딩 시작하기 버튼을 명확히 터치했을 때 호출되는 오디오 초기화 함수
function startLesson() {
    if (isAudioInitialized) return;
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        audioCtx = new AudioContext();
        
        // 브라우저 자동재생 보안 정책 우회 및 강제 가동
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }

        gainNode = audioCtx.createGain();
        // 초기 볼륨 설정
        gainNode.gain.setValueAtTime(0.18, audioCtx.currentTime);
        
        const bufferSize = 2 * audioCtx.sampleRate;
        const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        
        // 실시간 빗소리용 화이트 노이즈 합성
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }
        
        const whiteNoise = audioCtx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;
        
        const filter = audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1100, audioCtx.currentTime); // 빗소리 톤 보정
        
        whiteNoise.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        whiteNoise.start();
        isAudioInitialized = true;
        console.log("🔊 웹 오디오 가동 완료: 실시간 노이즈 노드가 연동되었습니다.");
        
        // UI에서 온보딩 오버레이 레이어 제거
        const overlay = document.getElementById('startOverlay');
        if (overlay) {
            overlay.style.opacity = '0';
            overlay.style.pointerEvents = 'none';
            setTimeout(() => { overlay.style.display = 'none'; }, 500);
        }
    } catch (e) {
        console.error("웹 오디오 API 초기화 실패:", e);
    }
}

// 2. 아파트 창문 커튼 인터랙션 (노드 1)
function triggerNode1() {
    const frame = document.getElementById('windowFrame');
    if (!frame) return;
    
    if (!frame.classList.contains('open')) {
        frame.classList.add('open');
        document.getElementById('rainBg').style.display = 'block';
        document.getElementById('targetSentence').classList.add('show');
        
        // 커튼을 치면 빗소리가 웅장하게 밀려오도록 증폭
        if (gainNode && audioCtx) {
            gainNode.gain.linearRampToValueAtTime(0.65, audioCtx.currentTime + 0.25);
        }
        
        setTimeout(() => {
            document.getElementById('ccqPanel').classList.add('show');
        }, 1000);
    }
}

// 3. 노드 1 -> 노드 2 화면 및 사운드 전환 처리
function finishDemo() {
    const node1 = document.getElementById('node-1');
    const node2 = document.getElementById('node-2');
    
    if (!node1 || !node2) return;

    node1.style.opacity = '0';
    
    setTimeout(() => {
        node1.classList.add('is-hidden');
        node2.classList.remove('is-hidden');
        
        setTimeout(() => {
            node2.style.opacity = '1';
        }, 50);

        // 빗소리를 과거의 둔탁한 잔상 톤으로 필터링 변환
        transitionAudioToPast();
    }, 1200);
}

// 4. 노드 2 오디오 변조 및 실시간 물방울 팝 신스 가동
function transitionAudioToPast() {
    if (!audioCtx || audioCtx.state === 'suspended') return;

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
    
    // 주파수를 저역대(300Hz)로 감쇄시켜 둔탁하게 멀어지는 과거 시제 사운드 구현
    lowPassFilter.frequency.setValueAtTime(1100, now);
    lowPassFilter.frequency.exponentialRampToValueAtTime(300, now + 3.0);

    if (gainNode) {
        gainNode.gain.setValueAtTime(gainNode.gain.value, now);
        gainNode.gain.linearRampToValueAtTime(0.08, now + 3.0); 
    }

    startDripSynth();
}

// 물방울 합성음 생성 피치 엔진
function playDripSound() {
    if (!audioCtx || audioCtx.state === 'suspended') return;

    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const dripGain = audioCtx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(1200, now + 0.04); 

    dripGain.gain.setValueAtTime(0.0, now);
    dripGain.gain.linearRampToValueAtTime(0.15, now + 0.005);
    dripGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(dripGain);
    dripGain.connect(audioCtx.destination);
    
    osc.start(now);
    osc.stop(now + 0.09);
}

function startDripSynth() {
    if (dripInterval) clearInterval(dripInterval);
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

function handleNode2Wrong() {
    const feedback = document.getElementById('node2-feedback');
    if (!feedback) return;
    feedback.classList.remove('is-hidden');
    feedback.style.color = '#f25c54';
    feedback.innerHTML = "❌ Look outside/inside carefully! The rain has stopped now. But look at the water puddles on the ground!";
}

// 5. 노드 2 -> 노드 3 스톰 전조 화면 시퀀스 가동
function transitionToNode3() {
    const node2 = document.getElementById('node-2');
    const node3 = document.getElementById('node-3');
    if (!node2 || !node3) return;

    if (dripInterval) clearInterval(dripInterval);

    node2.style.opacity = '0';
    setTimeout(() => {
        node2.classList.add('is-hidden');
        node3.classList.remove('is-hidden');
        setTimeout(() => { node3.style.opacity = '1'; }, 50);
        
        // 미래 시제 인지용 바람 필터 및 고주파 가속 신스 연동
        transitionAudioToFuturePredictive();
    }, 1200);
}

// 미래 예측 스톰 기류 주파수 변조 연출
function transitionAudioToFuturePredictive() {
    if (!audioCtx || audioCtx.state === 'suspended') return;
    const now = audioCtx.currentTime;

    if (lowPassFilter) {
        lowPassFilter.frequency.setValueAtTime(300, now);
        lowPassFilter.frequency.exponentialRampToValueAtTime(2500, now + 4.0);
    }
    
    if (gainNode) {
        gainNode.gain.setValueAtTime(0.08, now);
        gainNode.gain.linearRampToValueAtTime(0.4, now + 4.0);
    }

    if (!tensionOsc) {
        tensionOsc = audioCtx.createOscillator();
        tensionGain = audioCtx.createGain();
        
        tensionOsc.type = 'sawtooth';
        tensionOsc.frequency.setValueAtTime(70, now);
        tensionOsc.frequency.linearRampToValueAtTime(180, now + 5.0);
        
        const tensionFilter = audioCtx.createBiquadFilter();
        tensionFilter.type = 'lowpass';
        tensionFilter.frequency.setValueAtTime(200, now);

        tensionGain.gain.setValueAtTime(0.0, now);
        tensionGain.gain.linearRampToValueAtTime(0.25, now + 4.0);

        tensionOsc.connect(tensionFilter);
        tensionFilter.connect(tensionGain);
        tensionGain.connect(audioCtx.destination);
        
        tensionOsc.start(now);
    }
}

function handleNode3Wrong() {
    const feedback = document.getElementById('node3-feedback');
    if (!feedback) return;
    feedback.classList.remove('is-hidden');
    feedback.style.color = '#f25c54';
    feedback.innerHTML = "❌ No! There isn't a single drop falling right now. But look at the conditional environmental signs!";
}

function handleNode3Correct() {
    const feedback = document.getElementById('node3-feedback');
    if (!feedback) return;
    feedback.classList.remove('is-hidden');
    feedback.style.color = '#06d6a0';
    feedback.innerHTML = "🎯 Perfect Inference! It's NOT raining yet. However, the sequence of conditions guarantees that it <strong>is going to rain</strong>. You have unlocked all fundamental Tense Edges!";
    
    if (tensionGain) {
        tensionGain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
    }
}
