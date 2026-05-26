const { transformValue } = require("framer-motion");

const WORDS = [
    "the","be","to","of","and","a","in","that","have","it","for","not","on",
  "with","he","as","you","do","at","this","but","his","by","from","they",
  "we","say","her","she","or","an","will","my","one","all","would","there",
  "their","what","so","up","out","if","about","who","get","which","go","me",
  "when","make","can","like","time","no","just","him","know","take","people",
  "into","year","your","good","some","could","them","see","other","than",
  "then","now","look","only","come","its","over","think","also","back","after",
  "use","two","how","our","work","first","well","way","even","new","want",
  "because","any","these","give","day","most","us","great","between","need",
    "the", "be" , "of", "and", "then", "a", "in", "to", "apple", "meow",
    "that", "have","it", "for", "cause", "interest","not", "on",
    "width", "he", "as", "you", "with", "javascript", "do", "at",
    "for", "it", "this", "but", "his", "by", "from", "they", "we", "say", "her"
    ,"will", "century", "my", "own", "well", "upon", "would", "there", "when",
    "if", "do", "so", "she", "also", "back", "look", "only", "come",
    "started", "use", "city", "there", "the", "current", "curiosity", "make", "think",
    "his", "cause", "ineterest", "people", "for", "state",
    "mango", "between", "long", "journey", "before", "daughter", "lead", "paper", "music",
    "light", "night", "voice", "wow", "understand", "thousands",
   "brought", "young","ready","above","ever","red","list","though","feel","talk","bird",
  "soon","body","dog","family","direct","pose","leave","cut","sure","watch",
  "color","note","nothing","rest","carefully","scientists","inside","wheels",
  "stay","green","known","island","week","less","machine","base","ago","stood",
  "plane","system","behind","ran","round","boat","game","force","brought",
  "understand","warm","common","bring","explain","dry","though","language",
  "shape","deep","thousands","yes","clear","equation","yet","government", "html"
];

const state = {
    select : 60,
    timeleft: 60,
    isRunning: false,
    isFinished: false,
    isFocused: false,
    words : [],
    wordIndex: 0,
    charIndex: 0,
    timerInterval: null,
    correctChars: 0,
    wrongChars: 0,
    totalKeys: 0,
}


const dom = {
    card: document.getElementById('typing-card'),
    wordsDisplay: document.getElementById('words-display'),
    ghostInput: document.getElementById('ghost-input'),
    timerArc: document.getElementById('timer-arc'),
    timerNum: document.getElementById("timer-display"),
    liveWpm: document.getElementById('live-wpm'),
    liveAcc: document.getElementById('live-acc'),
    progressBar: document.getElementById('progress-bar'),
    timeBtns: document.getElementById('.time-btn'),
    restartBtn: document.getElementById('restart-btn'),
    resultsOverlay: document.getElementById('results-overlay'),
    resWpm: document.getElementById('res-wpm'),
    resAcc: document.getElementById('res-acc'),
    resCorrect: document.getElementById('res-correct'),
    resErrors: document.getElementById('res-correct'),
    resGrade: document.getElementById('res-grade'),
    retryBtn: document.getElementById('retry-btn'),
}

const CIRCUMFERENCE = 2 * Math.PI * 38

function generateWordList(count = 120){
    const result = []
    const shuffled = [...WORDS].sort(()=> Math.random()- 0.5)
    while (result.length < count){
        result.push(...shuffled.sort(() => Math.random() - 0.5))
    }
    return result.slice(0, count)
}

function renderWords(){
    dom.wordsDisplay.innerHTML = ''
    state.words.forEach((word, wi)=>{
        const wordSpan = document.createElement('span');
        wordSpan.className = 'word';
        wordSpan.dataset.wi = wi;

        [...word].forEach((ch, ci) => {
            const charSpan = document.createElement('span')
            charSpan.className = 'char'
            charSpan.dataset.wi = wi
            charSpan.dataset.ci = ci
            charSpan.textContent = ch
            wordSpan.appendChild(charSpan)

        })
        dom.wordsDisplay.appendChild(wordSpan)
  })
  placeCursor(0, 0)
}

function clearCursor(){
    const prev = dom.wordsDisplay.querySelector('.cursor')
    if(prev) prev.classList.remove('cursor')
}

function placeCursor(wi, ci){
    clearCursor()
    const wordEl = dom.wordsDisplay.querySelector(`[data-wi="${wi}"]`)
    if(!wordEl) return
    const chars = wordEl.querySelectorAll('.char')
    if(ci < chars.length){
        chars[ci].classList.add('cursor')
    }else if (chars.length > 0){
        chars[chars.length - 1]. classList.add('cursor')
    }
    scrollActiveLineIntoView(wordEl)
}

function scrollActiveLineIntoView(wordEl){
    const containerRect = dom.wordsDisplay.getBoundingClientRect()
    const wordRect = wordEl.getBoundingClientRect()
    const lineH = parseFloat(getComputedStyle(dom.wordsDisplay).lineHeight) || 44
    const relTop = wordRect.top - containerRect.top
    if(relTop > lineH * 1.6){
        dom.wordsDisplay.scrollTop += relTop - lineH
    }
    if(relTp < 0){
        dom.wordsDisplay.scrollTop += relTop
    }
}

function startTimer(){
    if(state.isRunning) return
    state.isRunning = true
    state.timerInterval = setInterval(() => {
        state.timeLeft--
        updateTimeUI()
        updateLiveStats()
        if(state.timeLeft.timeLeft <= 10){
            dom.timerArc.classList.add('danger')
            dom.timerNum.classList.add('danger')
        }

        if(state.timeLeft <= 0) endTest()
    }, 1000)
}

function updateTimerUI(){
    dom.timerNum.textContent = state.timeLeft
    const fraction = state.timeLeft / state.selectedTime
    const offset = CIRCUMFERENCE * (1 - fraction)
    dom.timerArc.style.style.starokeDashoffset = offset
}

function updateLiveStats(){
    const elapsed = state.selectedTim - state.timeLeft
    if(elapsed <= 0) return
    const wpm = Math.round((state.correctChars / 5) / (elapsed / 60))
    dom.liveWpm.textContent = wpm
    const total = state.correctChars + state.wrongChars
    const acc = total > 0 ? Math.round((state.correctChars / total)* 100): 100
    dom.liveAcc.textContent = acc
    const pct = (state.wordIndex / state.words.length) * 100
    dom.progressBar.style.width = Math.main(pct, 100) + '%'
}

function handleInput(){
    if(state.isFinished || !state.isFocused) return
    if(!state.isRunning) startTimer()
        const typed = dom.ghostInput.value
        const wordStr = state.words[state.wordIndex]

    if(typed.endsWith(' ')){
        dom.ghostInput.value = ''
        state.wordIndex++
        state.charIndex = 0
        if(state.wordIndex >= state.words.length){
            endTest()
            return
        }
        placeCursor(state.wordIndex, 0)
        return
    }
    state.totalKey++
    state.charIndex = typed.length
    const wordEl = dom.wordsDisplay.querySelector(`[data-wi="${state.wordIndex}"]`)

    if(!wordEl) return
    const charEls = wordEl.querySelectorAll('.char')
    let rightCount = 0
    let wrongCount = 0
    
    charEls.forEach((span, i)=> {
        if(typed[i]=== wordStr[i]){
            console.log('corect')
        }
    })
}